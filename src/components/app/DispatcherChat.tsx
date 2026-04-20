import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, PanelLeft, PanelLeftClose, Send } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/auth-store'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { useDispatcherSession, usePostDispatcherMessage, useProductFlowSession, queryKeys } from '@/hooks/use-comms-api'
import { commsAPI } from '@/services/comms-api'
import {
  DISPATCHER_OPTION_PICK_SCROLL_THRESHOLD,
  DISPATCHER_RAIL_PAGE_SIZE,
  DISPATCHER_UI,
  isDispatcherOptionPickKindShown,
} from '@/config/constants'
import { cn } from '@/lib/utils'
import type {
  DispatcherAgentMessage,
  DispatcherAgentUiBlockV1,
  DispatcherPickOption,
  ProductFlowSession,
  ProductFlowSessionStatus,
} from '@/types/api'

const ASSISTANT_PROSE =
  'prose prose-sm max-w-none text-gray-900 ' +
  'prose-p:text-gray-900 prose-p:leading-relaxed prose-p:my-1.5 prose-p:text-sm ' +
  'prose-headings:text-gray-900 prose-headings:font-semibold prose-headings:my-2 prose-headings:text-sm ' +
  'prose-strong:text-gray-900 prose-ul:text-gray-900 prose-ol:text-gray-900 ' +
  'prose-li:text-gray-900 prose-li:my-0.5 ' +
  'prose-code:text-gray-800 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-[0.85em] ' +
  'prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:text-[0.8rem] ' +
  'prose-a:text-brand-indigo prose-a:no-underline hover:prose-a:underline'

const DISPATCHER_AUTO_OPENED_MSG_IDS_KEY = 'comms-dispatcher-auto-opened-msg-ids:'

function dispatcherAutoOpenedStorageKey(assemblyId: string) {
  return `${DISPATCHER_AUTO_OPENED_MSG_IDS_KEY}${assemblyId}`
}

function loadDispatcherAutoOpenedMessageIds(assemblyId: string): Set<string> {
  if (typeof sessionStorage === 'undefined') return new Set()
  try {
    const raw = sessionStorage.getItem(dispatcherAutoOpenedStorageKey(assemblyId))
    if (!raw) return new Set()
    const arr = JSON.parse(raw) as unknown
    if (!Array.isArray(arr)) return new Set()
    return new Set(arr.filter((x): x is string => typeof x === 'string'))
  } catch {
    return new Set()
  }
}

function persistDispatcherAutoOpenedMessageId(assemblyId: string, messageId: string, setRef: Set<string>) {
  setRef.add(messageId)
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(
      dispatcherAutoOpenedStorageKey(assemblyId),
      JSON.stringify([...setRef]),
    )
  } catch {
    /* quota / private mode */
  }
}

function firstOpenFlowBlock(msg: DispatcherAgentMessage): DispatcherAgentUiBlockV1 | undefined {
  return msg.uiBlocks?.find(
    (b) => b.kind === 'OPEN_PRODUCT_FLOW_SESSION' && Boolean(b.productFlowSessionId?.trim()),
  )
}

function formatSessionUpdated(ms: number | undefined): string {
  if (ms == null || Number.isNaN(ms)) return ''
  const diff = Date.now() - ms
  if (diff < 60_000) return 'Just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function formatSessionStatusLabel(status: ProductFlowSessionStatus | undefined): string {
  if (!status) return ''
  const map: Record<ProductFlowSessionStatus, string> = {
    ACTIVE: 'Active',
    IN_PROGRESS: 'In progress',
    COMPLETED: 'Completed',
    ABANDONED: 'Abandoned',
    CLOSED: 'Closed',
    POST_ACTION_FAILED: 'Post-action failed',
  }
  return map[status] ?? status
}

const SESSION_CARD_CONFIG: Record<string, { header: string; hint: string; button: string; accent: string }> = {
  ACTIVE:             { header: 'Session setup',       hint: 'Open to configure and manage this run.', button: 'Open & Set Up',             accent: 'border-brand-indigo/20 bg-brand-ghost text-brand-indigo' },
  IN_PROGRESS:        { header: 'Session in progress', hint: 'Session is running — view updates and responses.', button: 'Open In-Progress Session', accent: 'border-amber-300/40 bg-amber-50 text-amber-700' },
  COMPLETED:          { header: 'Session completed',   hint: 'Session finished — review results and responses.', button: 'Open Completed Session',    accent: 'border-emerald-300/40 bg-emerald-50 text-emerald-700' },
  CLOSED:             { header: 'Session closed',      hint: 'Session was closed — view results and responses.', button: 'Open Closed Session',        accent: 'border-gray-300/40 bg-gray-50 text-gray-600' },
  POST_ACTION_FAILED: { header: 'Post-action failed',  hint: 'Session encountered a post-action failure.',       button: 'Open Session',               accent: 'border-red-300/40 bg-red-50 text-red-700' },
  ABANDONED:          { header: 'Session abandoned',   hint: 'Session was abandoned.',                            button: 'Open Session',               accent: 'border-gray-300/40 bg-gray-50 text-gray-500' },
}
const SESSION_CARD_FALLBACK = SESSION_CARD_CONFIG.ACTIVE

function SessionFlowCard({
  sessionId,
  sessionLabel,
  onOpen,
}: {
  sessionId: string
  sessionLabel?: string
  onOpen: (id: string) => void
}) {
  const { data: session } = useProductFlowSession(sessionId)
  const status = session?.status ?? 'ACTIVE'
  const cfg = SESSION_CARD_CONFIG[status] ?? SESSION_CARD_FALLBACK

  return (
    <div className={cn('mt-3 rounded-xl border px-3 py-3', cfg.accent.split(' ').slice(0, 2).join(' '), 'bg-opacity-100')}>
      <p className={cn('text-[10px] font-bold uppercase tracking-wider', cfg.accent.split(' ').pop())}>{cfg.header}</p>
      {sessionLabel && <p className="mt-1 text-sm font-semibold text-gray-900">{sessionLabel}</p>}
      <p className="mt-0.5 text-xs text-gray-500">{cfg.hint}</p>
      <button
        type="button"
        onClick={() => onOpen(sessionId)}
        className="mt-3 btn-primary text-xs py-1.5 px-3"
      >
        {cfg.button}
      </button>
    </div>
  )
}

function dispatcherPickOptionMatchesQuery(opt: DispatcherPickOption, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const hay = `${opt.label} ${opt.subtitle ?? ''} ${opt.id}`.toLowerCase()
  return hay.includes(q)
}

function DispatcherOptionPickBlock({
  block,
  disabled,
  onPicked,
}: {
  block: DispatcherAgentUiBlockV1
  disabled: boolean
  onPicked: (optionId: string) => void
}) {
  const selectionKind = block.pickSelectionKind?.trim()
  const [query, setQuery] = useState('')
  const rawPickOptions = block.pickOptions

  const filtered = useMemo(() => {
    const opts = rawPickOptions
    if (!opts?.length) return []
    return opts.filter((o) => dispatcherPickOptionMatchesQuery(o, query))
  }, [rawPickOptions, query])

  if (!selectionKind || !rawPickOptions || rawPickOptions.length === 0) {
    return null
  }

  const scrollableSearch = rawPickOptions.length > DISPATCHER_OPTION_PICK_SCROLL_THRESHOLD
  const rows = scrollableSearch ? filtered : rawPickOptions

  return (
    <div className="w-full max-w-[min(100%,38rem)] rounded-xl border border-gray-200 bg-white px-3 py-3 shadow-sm">
      {block.pickPrompt?.trim() ? (
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{block.pickPrompt.trim()}</p>
      ) : null}
      {scrollableSearch ? (
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={DISPATCHER_UI.OPTION_PICK_SEARCH_PLACEHOLDER}
          className="mt-2 h-9 border-gray-200 bg-[#F8FAFC] text-sm"
          disabled={disabled}
          aria-label={DISPATCHER_UI.OPTION_PICK_SEARCH_PLACEHOLDER}
        />
      ) : null}
      <div
        className={cn(
          'mt-2 flex flex-col gap-2',
          scrollableSearch && 'max-h-60 overflow-y-auto overflow-x-hidden pr-1',
        )}
      >
        {rows.length === 0 ? (
          <p className="text-xs text-gray-400">{DISPATCHER_UI.OPTION_PICK_NO_MATCHES}</p>
        ) : (
          rows.map((opt) => (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              onClick={() => onPicked(opt.id)}
              className="flex w-full flex-col items-start gap-0.5 rounded-lg border border-gray-100 bg-[#F8FAFC] px-3 py-2.5 text-left text-sm transition-colors hover:border-brand-indigo/30 hover:bg-brand-ghost disabled:opacity-50"
            >
              <span className="font-medium text-gray-900">{opt.label}</span>
              {opt.subtitle ? <span className="text-xs text-gray-500">{opt.subtitle}</span> : null}
            </button>
          ))
        )}
      </div>
    </div>
  )
}

function SessionListButton({
  session,
  onSelect,
  isSelected,
}: {
  session: ProductFlowSession
  onSelect: (id: string) => void
  isSelected: boolean
}) {
  const title = session.name?.trim() || 'Untitled run'
  const meta = formatSessionUpdated(session.updatedAt)
  const statusLabel = formatSessionStatusLabel(session.status)
  return (
    <button
      type="button"
      onClick={() => onSelect(session.id)}
      className={cn(
        'w-full rounded-lg border px-3 py-2.5 text-left transition-colors',
        'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300',
        isSelected && 'border-brand-indigo/50 bg-brand-ghost ring-1 ring-brand-indigo/20',
      )}
    >
      <div className="text-sm font-medium leading-snug text-gray-900 truncate">{title}</div>
      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-400">
        {statusLabel ? (
          <span className="shrink-0 rounded-md bg-gray-100 px-1.5 py-0 text-[10px] font-medium text-gray-700">
            {statusLabel}
          </span>
        ) : null}
        {meta ? <span>{meta}</span> : null}
        <span className="truncate font-mono opacity-80">{session.id.slice(0, 8)}…</span>
      </div>
    </button>
  )
}

interface DispatcherChatProps {
  onOpenSession: (sessionId: string) => void
}

export function DispatcherChat({ onOpenSession }: DispatcherChatProps) {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const { selectedAssemblyId } = useWorkspaceStore()

  const assemblyId = selectedAssemblyId ?? ''
  const teamMemberId = user?.teamMemberID ?? ''
  const enabled = Boolean(assemblyId)

  const { data: session, isLoading: sessionLoading } = useDispatcherSession(assemblyId, { enabled })
  const postMessage = usePostDispatcherMessage()

  const [railSearchInput, setRailSearchInput] = useState('')
  const [railSearchDebounced, setRailSearchDebounced] = useState('')

  useEffect(() => {
    const id = window.setTimeout(() => setRailSearchDebounced(railSearchInput.trim()), 300)
    return () => window.clearTimeout(id)
  }, [railSearchInput])

  useEffect(() => {
    setRailSearchInput('')
    setRailSearchDebounced('')
  }, [assemblyId])

  const {
    data: railPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: railLoading,
  } = useInfiniteQuery({
    queryKey: ['dispatcherRail', assemblyId, teamMemberId, railSearchDebounced],
    queryFn: async ({ pageParam }) =>
      commsAPI.searchProductFlowSessions({
        assemblyId,
        teamMemberId: teamMemberId || undefined,
        page: pageParam as number,
        pageSize: DISPATCHER_RAIL_PAGE_SIZE,
        sortBy: 'UPDATED_AT',
        sortOrder: 'DESC',
        ...(railSearchDebounced.length > 0 ? { search: railSearchDebounced } : {}),
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) => {
      const page = lastPageParam as number
      if (lastPage.totalPages <= 0) return undefined
      if (page + 1 >= lastPage.totalPages) return undefined
      return page + 1
    },
    enabled,
  })

  const railSessions = useMemo(() => railPages?.pages.flatMap((p) => p.sessions) ?? [], [railPages?.pages])

  const [draft, setDraft] = useState('')
  const [optimistic, setOptimistic] = useState<string | null>(null)
  const [sessionsRailOpen, setSessionsRailOpen] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const openedMessageIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!assemblyId) {
      openedMessageIds.current = new Set()
      return
    }
    openedMessageIds.current = loadDispatcherAutoOpenedMessageIds(assemblyId)
  }, [assemblyId])

  const serverMessages = useMemo(() => session?.messages ?? [], [session?.messages])
  const hasMessages = serverMessages.length > 0 || optimistic !== null

  useEffect(() => {
    if (optimistic && serverMessages.some((m) => m.role === 'USER' && m.content?.trim() === optimistic.trim())) {
      setOptimistic(null)
    }
  }, [serverMessages, optimistic])

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
      })
    })
    return () => cancelAnimationFrame(id)
  }, [serverMessages.length, optimistic])

  useEffect(() => {
    if (!serverMessages.length || !assemblyId) return
    const last = serverMessages[serverMessages.length - 1]
    if (last.role !== 'ASSISTANT' || !last.id) return
    if (openedMessageIds.current.has(last.id)) return
    const block = firstOpenFlowBlock(last)
    const sessionId = block?.productFlowSessionId?.trim()
    if (!sessionId) return

    let cancelled = false

    const run = async () => {
      try {
        const pf = await commsAPI.getProductFlowSession(sessionId)
        if (cancelled) return
        persistDispatcherAutoOpenedMessageId(assemblyId, last.id!, openedMessageIds.current)
        if (pf.status !== 'ACTIVE' && pf.status !== 'IN_PROGRESS') {
          return
        }
        onOpenSession(sessionId)
        void queryClient.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) &&
            q.queryKey[1] === assemblyId &&
            (q.queryKey[0] === 'dispatcherRail' || q.queryKey[0] === 'sessions-sidebar'),
        })
        void queryClient.invalidateQueries({ queryKey: ['productFlowSessions'] })
      } catch {
        if (cancelled) return
        persistDispatcherAutoOpenedMessageId(assemblyId, last.id!, openedMessageIds.current)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [serverMessages, assemblyId, onOpenSession, queryClient])

  const handleSend = useCallback(async () => {
    const text = draft.trim()
    if (!text || !assemblyId || postMessage.isPending) return
    setDraft('')
    setOptimistic(text)
    try {
      await postMessage.mutateAsync({ assemblyId, request: { message: text } })
    } catch {
      setOptimistic(null)
    }
  }, [assemblyId, draft, postMessage])

  const handleOpenFlow = useCallback(
    (sessionId: string) => {
      const id = sessionId.trim()
      if (!id) return
      onOpenSession(id)
      void queryClient.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          q.queryKey[1] === assemblyId &&
          (q.queryKey[0] === 'dispatcherRail' || q.queryKey[0] === 'sessions-sidebar'),
      })
      void queryClient.invalidateQueries({ queryKey: queryKeys.productFlowSession(id) })
    },
    [assemblyId, onOpenSession, queryClient],
  )

  const handleDispatcherOptionPick = useCallback(
    (selectionKind: string, pickSelectedId: string) => {
      const id = pickSelectedId.trim()
      const kind = selectionKind.trim()
      if (!assemblyId || !id || !kind) return
      postMessage.mutate({
        assemblyId,
        request: {
          message: '',
          pickSelectionKind: kind,
          pickSelectedId: id,
        },
      })
    },
    [assemblyId, postMessage],
  )

  const renderMessage = (m: DispatcherAgentMessage, i: number) => {
    const openBlock = m.role === 'ASSISTANT' ? firstOpenFlowBlock(m) : undefined
    const optionPickBlocks =
      m.role === 'ASSISTANT'
        ? (m.uiBlocks ?? []).filter(
            (b) =>
              b.kind === 'OPTION_PICK' &&
              isDispatcherOptionPickKindShown(b.pickSelectionKind) &&
              (b.pickOptions?.length ?? 0) > 0,
          )
        : []

    return (
      <div
        key={m.id ?? `msg-${i}`}
        className={cn('mb-4 flex flex-col gap-2', m.role === 'USER' ? 'items-end' : 'items-start')}
      >
        <div
          className={cn(
            'max-w-[min(100%,38rem)] rounded-2xl px-4 py-3 text-sm shadow-sm',
            m.role === 'USER'
              ? 'bubble-user'
              : 'border border-gray-100 bg-white text-gray-900',
          )}
        >
          {m.role === 'USER' ? (
            <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
          ) : (
            <>
              <div className={ASSISTANT_PROSE}>
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                  {m.content ?? ''}
                </ReactMarkdown>
              </div>
              {openBlock?.productFlowSessionId ? (
                <SessionFlowCard
                  sessionId={openBlock.productFlowSessionId}
                  sessionLabel={openBlock.sessionLabel}
                  onOpen={handleOpenFlow}
                />
              ) : null}
            </>
          )}
        </div>

        {optionPickBlocks.map((block, bi) => (
          <DispatcherOptionPickBlock
            key={`${m.id ?? i}-pick-${bi}`}
            block={block}
            disabled={postMessage.isPending}
            onPicked={(optionId) => {
              const kind = block.pickSelectionKind?.trim()
              if (kind) handleDispatcherOptionPick(kind, optionId)
            }}
          />
        ))}
      </div>
    )
  }

  if (!assemblyId) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <p className="text-sm text-gray-400">No workspace selected. Go to settings to pick one.</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-row overflow-hidden">
      {/* Sessions rail */}
      {sessionsRailOpen && (
        <aside className="flex h-full max-h-full min-h-0 w-[260px] shrink-0 flex-col border-r border-[#E2E8F0] bg-white">
          <div className="flex shrink-0 items-start justify-between gap-2 border-b border-[#E2E8F0] px-3 py-3">
            <div className="min-w-0 pr-1">
              <h2 className="text-sm font-semibold text-gray-900">{DISPATCHER_UI.RAIL_TITLE}</h2>
              <p className="mt-0.5 text-[11px] leading-snug text-gray-400">{DISPATCHER_UI.RAIL_SUBTITLE}</p>
            </div>
            <button
              type="button"
              className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              onClick={() => setSessionsRailOpen(false)}
              aria-label={DISPATCHER_UI.HIDE_SESSIONS}
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>
          <div className="shrink-0 border-b border-[#E2E8F0] px-3 py-2">
            <Input
              type="search"
              value={railSearchInput}
              onChange={(e) => setRailSearchInput(e.target.value)}
              placeholder={DISPATCHER_UI.RAIL_SEARCH_PLACEHOLDER}
              className="h-9 border-gray-200 bg-[#F8FAFC] text-sm"
              aria-label={DISPATCHER_UI.RAIL_SEARCH_PLACEHOLDER}
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-2">
            <div className="space-y-2 p-3">
              {railLoading && !railPages ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
                </div>
              ) : railSessions.length === 0 ? (
                <p className="px-1 text-xs text-gray-400">
                  {railSearchDebounced.length > 0 ? DISPATCHER_UI.RAIL_NO_MATCHES : DISPATCHER_UI.RAIL_EMPTY}
                </p>
              ) : (
                railSessions.map((s) => (
                  <SessionListButton key={s.id} session={s} isSelected={false} onSelect={handleOpenFlow} />
                ))
              )}
            </div>
          </div>
          {hasNextPage ? (
            <div className="shrink-0 border-t border-[#E2E8F0] p-3 pt-2">
              <button
                type="button"
                disabled={isFetchingNextPage}
                onClick={() => void fetchNextPage()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                    {DISPATCHER_UI.RAIL_SHOW_MORE_LOADING}
                  </>
                ) : (
                  DISPATCHER_UI.RAIL_SHOW_MORE
                )}
              </button>
            </div>
          ) : null}
        </aside>
      )}

      {/* Main chat column */}
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#FAFAFA]">
        {/* Show sessions toggle */}
        {!sessionsRailOpen && (
          <div className="flex shrink-0 items-center gap-2 border-b border-gray-100 bg-white px-3 py-2">
            <button
              type="button"
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              onClick={() => setSessionsRailOpen(true)}
            >
              <PanelLeft className="h-3.5 w-3.5" />
              {DISPATCHER_UI.SHOW_SESSIONS}
            </button>
          </div>
        )}

        {/* Messages — flex-col with justify-end so content hugs the bottom when short */}
        <div className="flex-1 overflow-y-auto px-4 py-5 min-h-0">
          <div className="mx-auto max-w-2xl flex flex-col min-h-full justify-end">
            {sessionLoading && !optimistic ? (
              <div className="flex flex-1 items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
              </div>
            ) : hasMessages ? (
              <>
                {serverMessages.map((m, i) => renderMessage(m, i))}
                {optimistic && !serverMessages.some((m) => m.role === 'USER' && m.content?.trim() === optimistic.trim()) && (
                  <div className="mb-4 flex justify-end">
                    <div className="bubble-user max-w-[38rem]">
                      <p className="whitespace-pre-wrap leading-relaxed">{optimistic}</p>
                      <p className="mt-1 text-[11px] opacity-70">{new Date().toLocaleTimeString()}</p>
                    </div>
                  </div>
                )}
                {postMessage.isPending && (
                  <div className="flex justify-start mb-4">
                    <div className="border border-gray-100 bg-white rounded-2xl px-4 py-3 flex gap-1 items-center">
                      <span className="typing-dot w-1.5 h-1.5 bg-gray-400 rounded-full" />
                      <span className="typing-dot w-1.5 h-1.5 bg-gray-400 rounded-full" />
                      <span className="typing-dot w-1.5 h-1.5 bg-gray-400 rounded-full" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center text-center pb-8">
                <div className="w-14 h-14 rounded-2xl bg-brand-ghost flex items-center justify-center mb-4">
                  <Send className="w-6 h-6 text-brand-indigo" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">How can I help?</h3>
                <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
                  Type a message below to start a new comms session.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Input — pinned to bottom */}
        <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-4">
          <div className="mx-auto max-w-2xl flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend() }
              }}
              placeholder={DISPATCHER_UI.INPUT_PLACEHOLDER}
              rows={2}
              className="flex-1 resize-none rounded-xl border border-gray-200 bg-[#F8FAFC] px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-indigo/30 focus:border-brand-indigo/50 transition-all min-h-[3rem]"
              disabled={postMessage.isPending}
            />
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={!draft.trim() || postMessage.isPending}
              className="h-11 w-11 shrink-0 rounded-xl btn-primary p-0 justify-center disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {postMessage.isPending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
