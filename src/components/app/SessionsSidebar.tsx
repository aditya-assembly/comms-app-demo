import { useState, useMemo, useEffect } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Plus, Search, LogOut, Settings } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { commsAPI } from '@/services/comms-api'
import { LogoVoiceWaveIcon } from '@/components/Logo'
import { cn } from '@/lib/utils'
import { DISPATCHER_RAIL_PAGE_SIZE, DISPATCHER_UI } from '@/config/constants'
import type { ProductFlowSession, ProductFlowSessionStatus } from '@/types/api'

function shortCreatedDate(ms: number | undefined): string {
  if (ms == null || Number.isNaN(ms)) return ''
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
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

function SessionRow({
  session, selected, onSelect,
}: { session: ProductFlowSession; selected: boolean; onSelect: (id: string) => void }) {
  const title = session.name?.trim() || 'Untitled session'
  const createdLabel = shortCreatedDate(session.createdAt)
  const statusLabel = formatSessionStatusLabel(session.status)
  return (
    <button
      type="button"
      onClick={() => onSelect(session.id)}
      className={cn(
        'w-full rounded-xl border px-3 py-2.5 text-left transition-all',
        selected
          ? 'border-brand-indigo/40 bg-brand-ghost ring-1 ring-brand-indigo/20'
          : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-900 leading-snug truncate">{title}</p>
        {statusLabel ? (
          <span
            className={cn(
              'shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5',
              session.status === 'ACTIVE' && 'pill pill-active',
              session.status === 'IN_PROGRESS' && 'bg-yellow-100 text-yellow-700',
              session.status !== 'ACTIVE' && session.status !== 'IN_PROGRESS' && 'bg-gray-100 text-gray-600',
            )}
          >
            {statusLabel}
          </span>
        ) : null}
      </div>
      {createdLabel ? (
        <p className="mt-0.5 text-[11px] text-gray-400">Created {createdLabel}</p>
      ) : null}
    </button>
  )
}

interface SessionsSidebarProps {
  selectedSessionId: string | null
  onSelectSession: (id: string) => void
  onNewComms: () => void
  onOpenSettings: () => void
}

export function SessionsSidebar({
  selectedSessionId, onSelectSession, onNewComms, onOpenSettings,
}: SessionsSidebarProps) {
  const user = useAuthStore((s) => s.user)
  const { logout } = useAuthStore()
  const { selectedAssemblyId } = useWorkspaceStore()
  const [searchInput, setSearchInput] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')

  const teamMemberId = user?.teamMemberID ?? ''

  useEffect(() => {
    const id = window.setTimeout(() => setSearchDebounced(searchInput.trim()), 300)
    return () => window.clearTimeout(id)
  }, [searchInput])

  useEffect(() => {
    setSearchInput('')
    setSearchDebounced('')
  }, [selectedAssemblyId])

  const {
    data: pagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: listLoading,
  } = useInfiniteQuery({
    queryKey: ['sessions-sidebar', selectedAssemblyId, teamMemberId, searchDebounced],
    queryFn: async ({ pageParam }) =>
      commsAPI.searchProductFlowSessions({
        assemblyId: selectedAssemblyId ?? undefined,
        teamMemberId: teamMemberId || undefined,
        page: pageParam as number,
        pageSize: DISPATCHER_RAIL_PAGE_SIZE,
        sortBy: 'UPDATED_AT',
        sortOrder: 'DESC',
        ...(searchDebounced.length > 0 ? { search: searchDebounced } : {}),
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) => {
      const page = lastPageParam as number
      if (lastPage.totalPages <= 0) return undefined
      if (page + 1 >= lastPage.totalPages) return undefined
      return page + 1
    },
    enabled: Boolean(selectedAssemblyId),
    staleTime: 30_000,
  })

  const sessions = useMemo(() => pagesData?.pages.flatMap((p) => p.sessions) ?? [], [pagesData?.pages])

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <aside className="flex h-full flex-col app-sidebar w-64 shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <LogoVoiceWaveIcon size={26} />
          <span className="font-bold text-gray-900 text-sm" style={{ letterSpacing: '-0.01em' }}>Comms</span>
        </div>
        <button
          type="button"
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg text-gray-400 hover:text-brand-indigo hover:bg-brand-ghost transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* New Comms button */}
      <div className="px-3 py-2.5">
        <button
          type="button"
          onClick={onNewComms}
          className="w-full btn-primary justify-center py-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          New Comms
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
          <input
            type="search"
            placeholder={DISPATCHER_UI.RAIL_SEARCH_PLACEHOLDER}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label={DISPATCHER_UI.RAIL_SEARCH_PLACEHOLDER}
            className="w-full pl-9 pr-3 h-9 rounded-xl border border-gray-100 bg-white text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-brand-indigo/50 transition-colors"
          />
        </div>
      </div>

      <p className="px-4 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
        {DISPATCHER_UI.SIDEBAR_RECENT}
      </p>

      {/* Sessions list */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 pb-2">
        <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto">
          {listLoading && !pagesData ? (
            <p className="px-1 text-xs text-gray-300 py-4 text-center">Loading…</p>
          ) : sessions.length === 0 ? (
            <p className="px-1 text-xs text-gray-300">
              {searchDebounced.length > 0 ? DISPATCHER_UI.RAIL_NO_MATCHES : DISPATCHER_UI.RAIL_EMPTY}
            </p>
          ) : (
            sessions.map((s) => (
              <SessionRow key={s.id} session={s} selected={selectedSessionId === s.id} onSelect={onSelectSession} />
            ))
          )}
        </div>
        {hasNextPage ? (
          <div className="shrink-0 pt-2">
            <button
              type="button"
              disabled={isFetchingNextPage}
              onClick={() => void fetchNextPage()}
              className="w-full rounded-xl border border-gray-100 bg-white py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              {isFetchingNextPage ? DISPATCHER_UI.RAIL_SHOW_MORE_LOADING : DISPATCHER_UI.RAIL_SHOW_MORE}
            </button>
          </div>
        ) : null}
      </div>

      {/* User footer */}
      <div className="border-t border-gray-100 px-3 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-brand-indigo flex items-center justify-center text-white text-xs font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-900 truncate">{user?.name ?? 'User'}</p>
            <p className="text-[10px] text-gray-400 truncate">{user?.email ?? ''}</p>
          </div>
          <button
            type="button"
            onClick={() => logout()}
            className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
            title="Log out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
