import { useState, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import {
  Sparkle, ListChecks, Users, MagnifyingGlass, GitBranch,
  CaretRight, Plus, Check, CheckCircle, Circle,
  Lightning, ArrowLeft, X, ChatCircle, PlugsConnected,
} from '@phosphor-icons/react'
import {
  Loader2, Settings, LogOut, Search, SlidersHorizontal, ChevronLeft,
  ChevronRight, Eye, Building2, Mail, Fingerprint, CalendarClock,
  Tag, Pencil, LayoutDashboard,
} from 'lucide-react'
import { DispatcherChat } from './DispatcherChat'
import { TemplatesView } from './templates-view'
import { IntegrationsView } from '../integrations/IntegrationsView'
import { SessionDetail } from './SessionDetail'
import { ConversationsSessionsPanel } from '@/components/conversations/conversations-sessions-panel'
import { ConversationSessionDetailView } from '@/components/conversations/conversation-session-detail'
import { WorkspaceSettings } from './WorkspaceSettings'
import { SupplierProgramDashboard } from './SupplierProgramDashboard'
import { LogoVoiceWaveIcon } from '@/components/Logo'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { useAuthStore } from '@/stores/auth-store'
import { commsAPI } from '@/services/comms-api'
import { queryKeys } from '@/hooks/use-comms-api'
import { cn } from '@/lib/utils'
import type { ProductFlowSession, Participant, ParticipantSearchRequest } from '@/types/api'
import {
  useParticipantsDirectorySearch,
  useCreateParticipantForAssembly,
  useUpdateParticipantForAssembly,
} from '@/hooks/use-comms-api'
import {
  PARTICIPANT_RECORD_STATUS_OPTIONS,
  PARTICIPANT_PREFERRED_CHANNEL_OPTIONS,
  PARTICIPANT_STATUS_UNSET,
  participantStatusSelectOptions,
  participantStatusSelectValue,
} from '@/types/participant-enums'
import { Sheet, SheetContent } from '@/components/ui/sheet'

/* ────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────── */

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-brand-ghost text-brand-indigo',
  ABANDONED: 'bg-gray-100 text-gray-400',
  CLOSED: 'bg-gray-100 text-gray-500',
  POST_ACTION_FAILED: 'bg-red-100 text-red-700',
}

const PREFERRED_CHANNEL_NONE = '__none__' as const
const STATUS_FILTER_ANY = '__all__' as const

function formatRelative(ms: number | undefined): string {
  if (ms == null || Number.isNaN(ms)) return ''
  const diff = Date.now() - ms
  if (diff < 60_000) return 'Just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function shortDate(ms: number | undefined): string {
  if (!ms) return '—'
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function formatTs(ms: number | undefined): string {
  if (ms == null || !Number.isFinite(ms)) return '—'
  try {
    return new Date(ms).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return String(ms)
  }
}

function participantIsEditableInAssembly(p: Participant | null, assemblyId: string | undefined): boolean {
  if (!p || !assemblyId) return false
  return p.domainOwner === 'ASSEMBLY_LINE' && p.domainOwnerId === assemblyId
}

function participantToEditPayload(detail: Participant): Participant {
  return {
    id: detail.id,
    email: detail.email ?? '',
    firstName: detail.firstName,
    lastName: detail.lastName,
    reference: detail.reference,
    enabled: detail.enabled !== false,
    phone: detail.phone,
    company: detail.company,
    role: detail.role,
    tags: detail.tags ? [...detail.tags] : [],
    status: detail.status,
    preferredChannel: detail.preferredChannel,
  }
}

function buildParticipantSearchRequest(params: {
  search: string
  status: string
  tagsAny: string[]
  page: number
  pageSize: number
  assemblyId: string
}): ParticipantSearchRequest {
  const req: ParticipantSearchRequest = {
    search: params.search.trim() || undefined,
    page: params.page,
    pageSize: params.pageSize,
    status: params.status !== STATUS_FILTER_ANY ? params.status : undefined,
    tagsAny: params.tagsAny.length ? params.tagsAny : undefined,
    domainOwner: 'ASSEMBLY_LINE',
    domainOwnerId: params.assemblyId,
  }
  return req
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      className="shrink-0 rounded p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
      aria-label={`Copy ${label ?? text}`}
      onClick={() => {
        void navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
    >
      {copied ? <Check size={12} weight="bold" /> : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  )
}

/* ────────────────────────────────────────────────
   Sessions View (full table + detail)
   ──────────────────────────────────────────────── */

function SessionsView({ onOpenSession }: { onOpenSession: (id: string) => void }) {
  const { selectedAssemblyId } = useWorkspaceStore()
  const user = useAuthStore((s) => s.user)
  const teamMemberId = user?.teamMemberID ?? ''
  const [filter, setFilter] = useState<'all' | 'ACTIVE' | 'IN_PROGRESS' | 'COMPLETED'>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<ProductFlowSession | null>(null)

  const { data: activeData, isFetching: activeFetching } = useQuery({
    queryKey: ['sessionsView', selectedAssemblyId, 'ACTIVE', teamMemberId],
    queryFn: () => commsAPI.searchProductFlowSessions({
      assemblyId: selectedAssemblyId ?? undefined,
      teamMemberId: teamMemberId || undefined,
      status: 'ACTIVE', page: 0, pageSize: 100,
    }),
    enabled: Boolean(selectedAssemblyId),
    staleTime: 30_000,
  })

  const { data: inProgressData, isFetching: inProgressFetching } = useQuery({
    queryKey: ['sessionsView', selectedAssemblyId, 'IN_PROGRESS', teamMemberId],
    queryFn: () => commsAPI.searchProductFlowSessions({
      assemblyId: selectedAssemblyId ?? undefined,
      teamMemberId: teamMemberId || undefined,
      status: 'IN_PROGRESS', page: 0, pageSize: 100,
    }),
    enabled: Boolean(selectedAssemblyId),
    staleTime: 30_000,
  })

  const { data: completedData, isFetching: completedFetching } = useQuery({
    queryKey: ['sessionsView', selectedAssemblyId, 'COMPLETED', teamMemberId],
    queryFn: () => commsAPI.searchProductFlowSessions({
      assemblyId: selectedAssemblyId ?? undefined,
      teamMemberId: teamMemberId || undefined,
      status: 'COMPLETED', page: 0, pageSize: 100,
    }),
    enabled: Boolean(selectedAssemblyId),
    staleTime: 30_000,
  })

  const allSessions = useMemo(() => {
    return [...(activeData?.sessions ?? []), ...(inProgressData?.sessions ?? []), ...(completedData?.sessions ?? [])]
  }, [activeData, inProgressData, completedData])

  const filtered = useMemo(() => {
    let list = allSessions
    if (filter !== 'all') list = list.filter(s => s.status === filter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(s => s.name?.toLowerCase().includes(q) || s.id.toLowerCase().includes(q))
    }
    return list
  }, [allSessions, filter, search])

  const counts = {
    all: allSessions.length,
    ACTIVE: activeData?.sessions?.length ?? 0,
    IN_PROGRESS: inProgressData?.sessions?.length ?? 0,
    COMPLETED: completedData?.sessions?.length ?? 0,
  }
  const loading = activeFetching || inProgressFetching || completedFetching

  const stepCount = (s: ProductFlowSession) => s.stepSessions?.length ?? 0
  const currentStep = (s: ProductFlowSession) => (s.currentStepIndex ?? 0) + 1
  const progressPct = (s: ProductFlowSession) => {
    const total = stepCount(s)
    if (!total) return 0
    return Math.round((currentStep(s) / total) * 100)
  }

  return (
    <div className="flex h-full min-h-0 flex-1 overflow-hidden">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="px-5 py-3 border-b border-[#E2E8F0] bg-white flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1 bg-[#F1F5F9] rounded-xl p-1">
            {(['all', 'ACTIVE', 'IN_PROGRESS', 'COMPLETED'] as const).map(f => {
              const label = f === 'all' ? 'All' : f === 'ACTIVE' ? 'Active' : f === 'IN_PROGRESS' ? 'In Progress' : 'Completed'
              return (
                <button key={f} onClick={() => setFilter(f)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  {label} <span className="text-gray-400">({counts[f]})</span>
                </button>
              )
            })}
          </div>
          <div className="flex-1" />
          {loading && <Loader2 className="w-4 h-4 animate-spin text-gray-300" />}
          <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-1.5">
            <MagnifyingGlass size={12} className="text-gray-400 shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-xs text-gray-700 outline-none placeholder-gray-400 w-40" placeholder="Search sessions…" />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <th className="text-left px-5 py-2.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Session</th>
                <th className="text-left px-3 py-2.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-3 py-2.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider hidden md:table-cell">Progress</th>
                <th className="text-left px-3 py-2.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Created</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#F1F5F9]">
              {filtered.map(session => {
                const pct = progressPct(session)
                const isSel = selected?.id === session.id
                return (
                  <tr key={session.id} onClick={() => setSelected(isSel ? null : session)}
                    className={`cursor-pointer hover:bg-[#F8FAFC] transition-colors ${isSel ? 'bg-brand-ghost/50' : ''}`}>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-gray-900 text-sm">{session.name ?? 'Untitled session'}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5 font-mono">{session.id.slice(0, 12)}…</div>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[session.status] ?? 'bg-gray-100 text-gray-500'}`}>{session.status}</span>
                    </td>
                    <td className="px-3 py-3.5 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-indigo rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">Step {currentStep(session)}/{stepCount(session) || '?'}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 hidden lg:table-cell">
                      <span className="text-xs text-gray-400">{shortDate(session.createdAt)}</span>
                    </td>
                    <td className="px-3 py-3.5">
                      <CaretRight size={13} className={`${isSel ? 'text-brand-indigo rotate-90' : 'text-gray-300'} transition-transform`} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && (
            <div className="text-center py-16 text-sm text-gray-400">No sessions match this filter.</div>
          )}
        </div>
      </div>

      {/* Session detail panel */}
      {selected && (
        <div className="w-[340px] shrink-0 border-l border-[#E2E8F0] bg-white overflow-y-auto flex flex-col">
          <div className="px-4 py-3 border-b border-[#E2E8F0] flex items-center justify-between shrink-0">
            <span className="text-sm font-bold text-gray-900 truncate">{selected.name ?? 'Session'}</span>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
              <ArrowLeft size={14} />
            </button>
          </div>
          <div className="px-4 py-4 space-y-4 flex-1 overflow-y-auto">
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Steps', value: stepCount(selected), icon: <ListChecks size={12} className="text-brand-indigo" /> },
                { label: 'Current', value: `${currentStep(selected)}/${stepCount(selected) || '?'}`, icon: <CheckCircle size={12} className="text-green-500" /> },
                { label: 'Status', value: selected.status, icon: <Circle size={12} className="text-gray-400" /> },
              ].map(s => (
                <div key={s.label} className="bg-[#F8FAFC] rounded-xl px-2.5 py-2.5 text-center">
                  <div className="flex justify-center mb-1">{s.icon}</div>
                  <div className="text-sm font-bold text-gray-900">{s.value}</div>
                  <div className="text-[10px] text-gray-400">{s.label}</div>
                </div>
              ))}
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-semibold text-gray-600">Progress</span>
                <span className="font-bold text-brand-indigo">{progressPct(selected)}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-brand-indigo rounded-full transition-all" style={{ width: `${progressPct(selected)}%` }} />
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[selected.status] ?? 'bg-gray-100 text-gray-500'}`}>{selected.status}</span>
            </div>

            {/* Step list */}
            {(selected.stepSessions?.length ?? 0) > 0 && (
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Steps</div>
                <div className="space-y-1.5">
                  {selected.stepSessions?.map((step, i) => {
                    const stepName = (step as unknown as Record<string, unknown>)?.name as string | undefined
                    const stepStatus = step.status
                    return (
                      <div key={i} className="flex items-center gap-2.5 px-3 py-2 bg-white border border-gray-100 rounded-xl">
                        <div className={cn(
                          'w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[9px] font-black',
                          stepStatus === 'COMPLETED' ? 'bg-green-100 text-green-600' :
                          stepStatus === 'IN_PROGRESS' ? 'bg-brand-ghost text-brand-indigo' :
                          'bg-gray-100 text-gray-400'
                        )}>
                          {stepStatus === 'COMPLETED' ? <Check size={9} weight="bold" /> : i + 1}
                        </div>
                        <span className="text-xs font-medium text-gray-700 flex-1 truncate">{stepName ?? `Step ${i + 1}`}</span>
                        <span className="text-[9px] font-bold text-gray-400">{stepStatus}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Session results */}
            {(selected.sessionResults?.length ?? 0) > 0 && (
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Results</div>
                <div className="space-y-1.5">
                  {selected.sessionResults?.map(r => (
                    <div key={r.id} className="bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
                      {r.label && <p className="text-xs font-semibold text-green-800">{r.label}</p>}
                      {r.value && <p className="text-xs text-green-700 mt-0.5">{r.value}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[#F8FAFC] rounded-xl px-3 py-2">
                <div className="text-gray-400 mb-0.5">Created</div>
                <div className="font-semibold text-gray-800">{shortDate(selected.createdAt)}</div>
              </div>
              <div className="bg-[#F8FAFC] rounded-xl px-3 py-2">
                <div className="text-gray-400 mb-0.5">Updated</div>
                <div className="font-semibold text-gray-800">{shortDate(selected.updatedAt)}</div>
              </div>
            </div>

            {(selected.status === 'ACTIVE' || selected.status === 'IN_PROGRESS' || selected.status === 'COMPLETED') && (
              <button
                type="button"
                onClick={() => onOpenSession(selected.id)}
                className="w-full flex items-center justify-center gap-1.5 bg-brand-indigo text-white text-xs font-bold py-2.5 rounded-xl hover:bg-brand-mid transition-colors"
              >
                <Lightning size={12} weight="fill" /> Open session
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ────────────────────────────────────────────────
   People View — real API-backed participant directory
   ──────────────────────────────────────────────── */

function PeopleView() {
  const { selectedAssemblyId } = useWorkspaceStore()
  const assemblyId = selectedAssemblyId ?? ''

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState<string>(STATUS_FILTER_ANY)
  const [tagsInput, setTagsInput] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const [detail, setDetail] = useState<Participant | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newFirstName, setNewFirstName] = useState('')
  const [newLastName, setNewLastName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newCompany, setNewCompany] = useState('')
  const [newRole, setNewRole] = useState('')
  const [newReference, setNewReference] = useState('')
  const [newStatus, setNewStatus] = useState<string>(PARTICIPANT_STATUS_UNSET)
  const [newPreferredChannel, setNewPreferredChannel] = useState<string>(PREFERRED_CHANNEL_NONE)
  const [createTags, setCreateTags] = useState<string[]>([])
  const [createTagInput, setCreateTagInput] = useState('')

  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState<Participant | null>(null)
  const [editTagInput, setEditTagInput] = useState('')

  const createMutation = useCreateParticipantForAssembly()
  const updateMutation = useUpdateParticipantForAssembly()

  const resetCreateForm = useCallback(() => {
    setNewEmail(''); setNewFirstName(''); setNewLastName('')
    setNewPhone(''); setNewCompany(''); setNewRole('')
    setNewReference(''); setNewStatus(PARTICIPANT_STATUS_UNSET)
    setNewPreferredChannel(PREFERRED_CHANNEL_NONE)
    setCreateTags([]); setCreateTagInput('')
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search), 350)
    return () => window.clearTimeout(t)
  }, [search])

  const tagsAny = useMemo(
    () => tagsInput.split(',').map(s => s.trim().toLowerCase()).filter(Boolean),
    [tagsInput],
  )

  const request = useMemo(() => {
    if (!assemblyId) return { page: 0, pageSize: 25 }
    return buildParticipantSearchRequest({
      search: debouncedSearch, status, tagsAny, page, pageSize, assemblyId,
    })
  }, [assemblyId, debouncedSearch, status, tagsAny, page, pageSize])

  const { data, isLoading, isFetching, refetch } = useParticipantsDirectorySearch(assemblyId, request)

  useEffect(() => { setPage(0) }, [debouncedSearch, status, tagsInput, pageSize, assemblyId])

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1

  const onOpenCreate = useCallback(() => { resetCreateForm(); setCreateOpen(true) }, [resetCreateForm])

  const onSubmitCreate = useCallback(() => {
    if (!assemblyId || !newEmail.trim()) return
    const tags = [...createTags]
    const tail = createTagInput.trim().toLowerCase()
    if (tail && !tags.includes(tail)) tags.push(tail)
    const body: Participant = {
      id: '',
      email: newEmail.trim().toLowerCase(),
      firstName: newFirstName.trim() || undefined,
      lastName: newLastName.trim() || undefined,
      phone: newPhone.trim() || undefined,
      company: newCompany.trim() || undefined,
      role: newRole.trim() || undefined,
      reference: newReference.trim() || undefined,
      status: newStatus !== PARTICIPANT_STATUS_UNSET ? newStatus : undefined,
      preferredChannel: newPreferredChannel !== PREFERRED_CHANNEL_NONE
        ? (newPreferredChannel as Participant['preferredChannel'])
        : undefined,
      tags: tags.length ? tags : undefined,
    }
    createMutation.mutate({ assemblyId, body }, {
      onSuccess: () => { setCreateOpen(false); resetCreateForm() },
    })
  }, [assemblyId, newEmail, newFirstName, newLastName, newPhone, newCompany, newRole,
      newReference, newStatus, newPreferredChannel, createTags, createTagInput, createMutation, resetCreateForm])

  const startEdit = useCallback(() => {
    if (!detail) return
    setEditForm(participantToEditPayload(detail))
    setEditTagInput('')
    setEditMode(true)
  }, [detail])

  const onSaveEdit = useCallback(() => {
    if (!assemblyId || !detail?.id || !editForm) return
    const tags = [...(editForm.tags ?? [])]
    const tail = editTagInput.trim().toLowerCase()
    if (tail && !tags.includes(tail)) tags.push(tail)
    const body: Participant = { ...editForm, email: (editForm.email ?? '').trim().toLowerCase(), tags }
    updateMutation.mutate({ assemblyId, participantId: detail.id, body }, {
      onSuccess: (updated) => { setDetail(updated); setEditMode(false); setEditForm(null); setEditTagInput('') },
    })
  }, [assemblyId, detail?.id, editForm, editTagInput, updateMutation])

  if (!assemblyId) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-gray-400">No workspace selected. Go to settings to pick one.</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="px-5 py-3 border-b border-[#E2E8F0] bg-white flex items-center gap-3 shrink-0 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Name, email, company…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-[#E2E8F0] bg-white outline-none focus:border-brand-indigo/40"
          />
        </div>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="text-xs rounded-lg border border-[#E2E8F0] px-3 py-2 bg-white text-gray-700 outline-none focus:border-brand-indigo/40"
        >
          <option value={STATUS_FILTER_ANY}>Any status</option>
          {PARTICIPANT_RECORD_STATUS_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <input
          value={tagsInput}
          onChange={e => setTagsInput(e.target.value)}
          placeholder="Tags (comma-sep)"
          className="text-xs rounded-lg border border-[#E2E8F0] px-3 py-2 bg-white text-gray-700 outline-none focus:border-brand-indigo/40 w-40"
        />
        <button onClick={() => void refetch()} disabled={isFetching}
          className="text-xs font-semibold px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:bg-gray-50 text-gray-600 transition-colors flex items-center gap-1.5">
          {isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <SlidersHorizontal className="h-3.5 w-3.5" />}
          Refresh
        </button>
        <button onClick={onOpenCreate}
          className="text-xs font-semibold px-3 py-2 rounded-lg bg-brand-indigo text-white hover:bg-brand-mid transition-colors flex items-center gap-1.5">
          <Plus size={13} /> Add person
        </button>
        <span className="text-xs text-gray-400">
          {data != null ? `${data.total} total` : null}
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
              <th className="text-left px-5 py-2.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Person</th>
              <th className="text-left px-3 py-2.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Email</th>
              <th className="text-left px-3 py-2.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider hidden md:table-cell">Company</th>
              <th className="text-left px-3 py-2.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Status</th>
              <th className="px-3 py-2.5 text-right w-[80px]" />
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#F1F5F9]">
            {isLoading && !data ? (
              <tr>
                <td colSpan={5} className="h-48 text-center text-gray-400">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />Loading people…
                </td>
              </tr>
            ) : !data?.items?.length ? (
              <tr>
                <td colSpan={5} className="h-40 text-center text-gray-400">No participants match these filters.</td>
              </tr>
            ) : (
              data.items.map(row => (
                <tr key={row.id} className="hover:bg-[#F8FAFC] cursor-pointer transition-colors" onClick={() => setDetail(row)}>
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-gray-900 text-sm">
                      {[row.firstName, row.lastName].filter(Boolean).join(' ') || '—'}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5 font-mono truncate max-w-[180px]">{row.id}</div>
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-1.5 text-sm">
                      <Mail className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                      <span className="truncate max-w-[220px]">{row.email ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 hidden md:table-cell">
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Building2 className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate max-w-[160px]">{row.company ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {row.status
                        ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{row.status}</span>
                        : '—'}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${row.enabled === false ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                        {row.enabled === false ? 'Disabled' : 'Enabled'}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-right">
                    <button onClick={(e) => { e.stopPropagation(); setDetail(row) }}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-brand-indigo transition-colors">
                      <Eye className="h-3.5 w-3.5" /> View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-5 py-2.5 border-t border-[#E2E8F0] bg-white shrink-0">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Rows</span>
          <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(0) }}
            className="rounded border border-[#E2E8F0] px-2 py-1 text-xs bg-white outline-none">
            {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Page {page + 1} / {totalPages}</span>
          <button disabled={page <= 0 || isFetching} onClick={() => setPage(p => Math.max(0, p - 1))}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button disabled={!data || page + 1 >= totalPages || isFetching} onClick={() => setPage(p => p + 1)}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Detail Sheet */}
      <Sheet open={detail != null} onOpenChange={open => { if (!open) { setDetail(null); setEditMode(false); setEditForm(null); setEditTagInput('') } }}>
        <SheetContent className="w-full sm:max-w-lg border-l border-[#E2E8F0] bg-white p-0">
          {detail && (
            <div className="flex flex-col h-full">
              {/* Sheet header */}
              <div className="px-5 py-4 border-b border-[#E2E8F0] shrink-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Fingerprint className="h-5 w-5 text-brand-indigo" />
                      <span className="text-base font-bold text-gray-900">Participant detail</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {participantIsEditableInAssembly(detail, assemblyId)
                        ? 'Edit fields scoped to this workspace.'
                        : 'Read-only — not owned by this workspace.'}
                    </p>
                  </div>
                  {participantIsEditableInAssembly(detail, assemblyId) && !editMode && (
                    <button onClick={startEdit}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-gray-50 text-gray-700 transition-colors">
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                  )}
                  {participantIsEditableInAssembly(detail, assemblyId) && editMode && (
                    <div className="flex gap-1.5">
                      <button onClick={() => { setEditMode(false); setEditForm(null); setEditTagInput('') }}
                        className="text-xs px-3 py-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                        Cancel
                      </button>
                      <button onClick={onSaveEdit} disabled={updateMutation.isPending}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand-indigo text-white hover:bg-brand-mid transition-colors flex items-center gap-1">
                        {updateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Edit mode */}
              {editMode && editForm && participantIsEditableInAssembly(detail, assemblyId) ? (
                <div className="flex-1 overflow-y-auto px-5 py-4">
                  <div className="space-y-3 text-sm">
                    <div>
                      <label className="text-xs font-medium text-gray-500">Email</label>
                      <input value={editForm.email ?? ''} onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-brand-indigo/40" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-500">First name</label>
                        <input value={editForm.firstName ?? ''} onChange={e => setEditForm({ ...editForm, firstName: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-brand-indigo/40" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500">Last name</label>
                        <input value={editForm.lastName ?? ''} onChange={e => setEditForm({ ...editForm, lastName: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-brand-indigo/40" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Phone</label>
                      <input value={editForm.phone ?? ''} onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-brand-indigo/40" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-500">Company</label>
                        <input value={editForm.company ?? ''} onChange={e => setEditForm({ ...editForm, company: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-brand-indigo/40" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500">Role</label>
                        <input value={editForm.role ?? ''} onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-brand-indigo/40" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Reference</label>
                      <input value={editForm.reference ?? ''} onChange={e => setEditForm({ ...editForm, reference: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-brand-indigo/40" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Status</label>
                      <select
                        value={participantStatusSelectValue(editForm.status)}
                        onChange={e => setEditForm({ ...editForm, status: e.target.value === PARTICIPANT_STATUS_UNSET ? undefined : e.target.value })}
                        className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-brand-indigo/40 bg-white"
                      >
                        <option value={PARTICIPANT_STATUS_UNSET}>Not set</option>
                        {participantStatusSelectOptions(editForm.status).map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Preferred channel</label>
                      <select
                        value={editForm.preferredChannel ?? PREFERRED_CHANNEL_NONE}
                        onChange={e => setEditForm({ ...editForm, preferredChannel: e.target.value === PREFERRED_CHANNEL_NONE ? undefined : e.target.value as Participant['preferredChannel'] })}
                        className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-brand-indigo/40 bg-white"
                      >
                        <option value={PREFERRED_CHANNEL_NONE}>—</option>
                        {PARTICIPANT_PREFERRED_CHANNEL_OPTIONS.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Tags</label>
                      <p className="text-[10px] text-gray-400 mt-0.5">Type a tag and press Enter.</p>
                      <div className="mt-1 flex min-h-[2.5rem] flex-wrap gap-1.5 rounded-lg border border-[#E2E8F0] px-2 py-1.5 focus-within:border-brand-indigo/40">
                        {(editForm.tags ?? []).map(tag => (
                          <span key={tag} className="flex items-center gap-0.5 text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                            {tag}
                            <button type="button" onClick={() => setEditForm(prev => prev ? { ...prev, tags: (prev.tags ?? []).filter(t => t !== tag) } : prev)}
                              className="text-gray-400 hover:text-gray-600"><X size={10} /></button>
                          </span>
                        ))}
                        <input value={editTagInput} onChange={e => setEditTagInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              const t = editTagInput.trim().toLowerCase()
                              if (!t) return
                              setEditForm(prev => { if (!prev) return prev; const list = prev.tags ?? []; if (list.includes(t)) return prev; return { ...prev, tags: [...list, t] } })
                              setEditTagInput('')
                            } else if (e.key === 'Backspace' && editTagInput === '') {
                              setEditForm(prev => { if (!prev) return prev; const list = prev.tags ?? []; if (!list.length) return prev; return { ...prev, tags: list.slice(0, -1) } })
                            }
                          }}
                          placeholder={(editForm.tags ?? []).length === 0 ? 'Type a tag, press Enter…' : 'Add another…'}
                          className="h-6 min-w-[8rem] flex-1 bg-transparent text-xs outline-none" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-[#E2E8F0] p-3">
                      <label className="text-xs font-medium text-gray-700">Enabled</label>
                      <button type="button" onClick={() => setEditForm({ ...editForm, enabled: !(editForm.enabled !== false) })}
                        className={cn('relative inline-flex h-5 w-9 items-center rounded-full transition-colors', editForm.enabled !== false ? 'bg-brand-indigo' : 'bg-gray-300')}>
                        <span className={cn('inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform', editForm.enabled !== false ? 'translate-x-4' : 'translate-x-0.5')} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Read-only detail view */
                <div className="flex-1 overflow-y-auto px-5 py-4">
                  <div className="space-y-5 text-sm">
                    {!participantIsEditableInAssembly(detail, assemblyId) && (
                      <p className="text-xs text-amber-600 rounded-lg border border-amber-200 bg-amber-50 p-3">
                        This record is not owned by the current workspace.
                      </p>
                    )}
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Name</div>
                      <div className="text-base font-semibold text-gray-900">
                        {[detail.firstName, detail.lastName].filter(Boolean).join(' ') || '—'}
                      </div>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Email</div>
                        <div className="break-all">{detail.email ?? '—'}</div>
                      </div>
                      {detail.email && <CopyButton text={detail.email} label="email" />}
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Id</div>
                      <div className="font-mono text-xs break-all flex items-start gap-2">
                        {detail.id}
                        <CopyButton text={detail.id} label="id" />
                      </div>
                    </div>
                    <hr className="border-[#E2E8F0]" />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-[10px] text-gray-400 mb-0.5">Domain</div>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{detail.domainOwner ?? 'NONE'}</span>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-400 mb-0.5">Owner id</div>
                        <div className="font-mono text-xs truncate">{detail.domainOwnerId ?? '—'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-400 mb-0.5">Phone</div>
                        {detail.phone ?? '—'}
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-400 mb-0.5">Preferred channel</div>
                        {detail.preferredChannel ?? '—'}
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-400 mb-0.5">Company</div>
                        {detail.company ?? '—'}
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-400 mb-0.5">Role</div>
                        {detail.role ?? '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 mb-1 flex items-center gap-1"><Tag className="h-3 w-3" /> Tags</div>
                      <div className="flex flex-wrap gap-1">
                        {detail.tags?.length
                          ? detail.tags.map(t => <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t}</span>)
                          : '—'}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-[10px] text-gray-400 mb-0.5">Sessions (total / done)</div>
                        {detail.sessionsTotal ?? '—'} / {detail.sessionsCompleted ?? '—'}
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-400 mb-0.5 flex items-center gap-1"><CalendarClock className="h-3 w-3" /> Last activity</div>
                        {formatTs(detail.lastActivityAt)}
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-400 mb-0.5">Response rate</div>
                        {detail.responseRate ?? '—'}
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-400 mb-0.5">Avg response (h)</div>
                        {detail.averageResponseHours ?? '—'}
                      </div>
                    </div>
                    {detail.channelStats?.length ? (
                      <div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Channel stats</div>
                        <ul className="space-y-1 text-xs">
                          {detail.channelStats.map((c, i) => (
                            <li key={`${c.channel}-${i}`} className="flex justify-between gap-4 border-b border-gray-100 pb-1">
                              <span>{c.channel}</span>
                              <span className="font-mono">{c.count}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {detail.recentSessionIds?.length ? (
                      <div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Recent sessions</div>
                        <ul className="font-mono text-xs space-y-1">
                          {detail.recentSessionIds.map(sid => <li key={sid} className="truncate">{sid}</li>)}
                        </ul>
                      </div>
                    ) : null}
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">AI summary</div>
                      <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-wrap rounded-lg border border-gray-100 bg-[#F8FAFC] p-3">
                        {detail.aiGeneratedSummary?.trim() || '—'}
                      </p>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 mb-0.5">Reference</div>
                      <div className="text-xs break-all">{detail.reference ?? '—'}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Create dialog */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-4 border-b border-[#E2E8F0]">
              <div className="text-base font-bold text-gray-900">Add person</div>
              <p className="text-xs text-gray-400 mt-0.5">Creates a participant owned by this workspace.</p>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500">Email *</label>
                <input value={newEmail} onChange={e => setNewEmail(e.target.value)} type="email" autoComplete="email"
                  placeholder="name@company.com"
                  className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-brand-indigo/40" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500">First name</label>
                  <input value={newFirstName} onChange={e => setNewFirstName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-brand-indigo/40" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Last name</label>
                  <input value={newLastName} onChange={e => setNewLastName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-brand-indigo/40" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Phone</label>
                <input value={newPhone} onChange={e => setNewPhone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-brand-indigo/40" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500">Company</label>
                  <input value={newCompany} onChange={e => setNewCompany(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-brand-indigo/40" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Role</label>
                  <input value={newRole} onChange={e => setNewRole(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-brand-indigo/40" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Reference</label>
                <input value={newReference} onChange={e => setNewReference(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-brand-indigo/40" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Status</label>
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-brand-indigo/40 bg-white">
                  <option value={PARTICIPANT_STATUS_UNSET}>Not set</option>
                  {PARTICIPANT_RECORD_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Preferred channel</label>
                <select value={newPreferredChannel} onChange={e => setNewPreferredChannel(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-brand-indigo/40 bg-white">
                  <option value={PREFERRED_CHANNEL_NONE}>—</option>
                  {PARTICIPANT_PREFERRED_CHANNEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Tags</label>
                <p className="text-[10px] text-gray-400 mt-0.5">Type a tag and press Enter.</p>
                <div className="mt-1 flex min-h-[2.5rem] flex-wrap gap-1.5 rounded-lg border border-[#E2E8F0] px-2 py-1.5 focus-within:border-brand-indigo/40">
                  {createTags.map(tag => (
                    <span key={tag} className="flex items-center gap-0.5 text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                      {tag}
                      <button type="button" onClick={() => setCreateTags(prev => prev.filter(t => t !== tag))}
                        className="text-gray-400 hover:text-gray-600"><X size={10} /></button>
                    </span>
                  ))}
                  <input value={createTagInput} onChange={e => setCreateTagInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const t = createTagInput.trim().toLowerCase()
                        if (t) { setCreateTags(prev => prev.includes(t) ? prev : [...prev, t]); setCreateTagInput('') }
                      } else if (e.key === 'Backspace' && createTagInput === '') {
                        setCreateTags(prev => prev.length > 0 ? prev.slice(0, -1) : prev)
                      }
                    }}
                    placeholder={createTags.length === 0 ? 'Type a tag, press Enter…' : 'Add another…'}
                    className="h-6 min-w-[8rem] flex-1 bg-transparent text-xs outline-none" />
                </div>
              </div>
            </div>
            <div className="px-5 py-3 border-t border-[#E2E8F0] flex justify-end gap-2">
              <button onClick={() => setCreateOpen(false)}
                className="text-xs font-semibold px-4 py-2 rounded-lg border border-[#E2E8F0] hover:bg-gray-50 text-gray-600 transition-colors">
                Cancel
              </button>
              <button onClick={onSubmitCreate} disabled={!newEmail.trim() || createMutation.isPending}
                className="text-xs font-semibold px-4 py-2 rounded-lg bg-brand-indigo text-white hover:bg-brand-mid transition-colors disabled:opacity-50 flex items-center gap-1">
                {createMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ────────────────────────────────────────────────
   Main App Shell — nav (Agent / Templates / Sessions / People)
   ──────────────────────────────────────────────── */

type ViewId = 'dashboard' | 'agent' | 'templates' | 'sessions' | 'conversations' | 'people' | 'integrations'

const LEGACY_APP_SEGMENTS = new Set(['dispatcher', 'sync', 'async'])

type ParsedAppPath = {
  view: ViewId
  productFlowSessionId: string | null
  /** Conversation session detail (full-screen overlay, or stacked over product-flow session via ?conversation=) */
  conversationSessionId: string | null
}

/**
 * Maps /app/... to main view and optional ids for full-screen overlays.
 *
 * <ul>
 *   <li>/app/dashboard — program dashboard (demo)</li>
 *   <li>/app/sessions — list</li>
 *   <li>/app/sessions/&lt;productFlowSessionId&gt; — product-flow session detail</li>
 *   <li>/app/sessions/&lt;productFlowSessionId&gt;?conversation=&lt;id&gt; — conversation on top of session detail</li>
 *   <li>/app/conversations — list</li>
 *   <li>/app/conversations/&lt;conversationSessionId&gt; — conversation session detail</li>
 * </ul>
 */
function parseAppPath(pathname: string, search = ''): ParsedAppPath {
  const parts = pathname.replace(/\/+$/, '').split('/').filter(Boolean)
  if (parts.length === 0 || parts[0] !== 'app') {
    return { view: 'dashboard', productFlowSessionId: null, conversationSessionId: null }
  }
  const seg = parts[1] ?? 'dashboard'
  const allowed: ViewId[] = ['dashboard', 'agent', 'templates', 'sessions', 'conversations', 'people', 'integrations']
  const view: ViewId = allowed.includes(seg as ViewId) ? (seg as ViewId) : 'agent'

  let productFlowSessionId: string | null = null
  if (view === 'sessions' && parts.length >= 3 && parts[2]) {
    try {
      productFlowSessionId = decodeURIComponent(parts[2])
    } catch {
      productFlowSessionId = parts[2]
    }
  }

  let conversationSessionId: string | null = null
  if (view === 'conversations' && parts.length >= 3 && parts[2]) {
    try {
      conversationSessionId = decodeURIComponent(parts[2])
    } catch {
      conversationSessionId = parts[2]
    }
  }

  const qs = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  const conversationFromQuery = qs.get('conversation')
  if (view === 'sessions' && productFlowSessionId && conversationFromQuery) {
    try {
      conversationSessionId = decodeURIComponent(conversationFromQuery)
    } catch {
      conversationSessionId = conversationFromQuery
    }
  }

  return { view, productFlowSessionId, conversationSessionId }
}

export function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const queryClient = useQueryClient()

  const { view, productFlowSessionId, conversationSessionId } = useMemo(
    () => parseAppPath(location.pathname, location.search),
    [location.pathname, location.search],
  )

  useLayoutEffect(() => {
    const parts = location.pathname.replace(/\/+$/, '').split('/').filter(Boolean)
    if (parts[0] === 'app' && parts[1] && LEGACY_APP_SEGMENTS.has(parts[1]) && parts.length === 2) {
      navigate('/app/agent', { replace: true })
    }
  }, [location.pathname, navigate])

  const { selectedAssemblyId } = useWorkspaceStore()
  const commsInfo = useAuthStore((s) => s.commsInfo)
  const user = useAuthStore((s) => s.user)
  const { logout } = useAuthStore()

  useEffect(() => {
    const workspaces = commsInfo?.ownedAssemblyLines ?? []
    if (!selectedAssemblyId && workspaces.length > 1) setSettingsOpen(true)
  }, [selectedAssemblyId, commsInfo])

  const handleOpenSession = useCallback(
    (sessionId: string) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.productFlowSession(sessionId) })
      navigate(`/app/sessions/${encodeURIComponent(sessionId)}`)
    },
    [navigate, queryClient],
  )
  const handleCloseSheet = useCallback(() => {
    navigate('/app/sessions')
  }, [navigate])

  const handleOpenConversationSession = useCallback(
    (conversationId: string) => {
      const enc = encodeURIComponent(conversationId)
      if (productFlowSessionId) {
        navigate(`/app/sessions/${encodeURIComponent(productFlowSessionId)}?conversation=${enc}`)
      } else {
        navigate(`/app/conversations/${enc}`)
      }
    },
    [navigate, productFlowSessionId],
  )

  const handleCloseConversationOverlay = useCallback(() => {
    const qs = new URLSearchParams(location.search.startsWith('?') ? location.search.slice(1) : location.search)
    if (view === 'sessions' && productFlowSessionId && qs.get('conversation')) {
      navigate(`/app/sessions/${encodeURIComponent(productFlowSessionId)}`)
      return
    }
    navigate('/app/conversations')
  }, [navigate, location.search, view, productFlowSessionId])

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const NAV: { id: ViewId; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Program', icon: <LayoutDashboard className="w-[15px] h-[15px]" strokeWidth={view === 'dashboard' ? 2.5 : 2} /> },
    { id: 'agent', label: 'Agent', icon: <Sparkle size={15} weight={view === 'agent' ? 'fill' : 'regular'} /> },
    { id: 'templates', label: 'Templates', icon: <GitBranch size={15} weight={view === 'templates' ? 'fill' : 'regular'} /> },
    { id: 'sessions', label: 'Sessions', icon: <ListChecks size={15} weight={view === 'sessions' ? 'fill' : 'regular'} /> },
    { id: 'conversations', label: 'Conversations', icon: <ChatCircle size={15} weight={view === 'conversations' ? 'fill' : 'regular'} /> },
    { id: 'people', label: 'People', icon: <Users size={15} weight={view === 'people' ? 'fill' : 'regular'} /> },
    { id: 'integrations', label: 'Integrations', icon: <PlugsConnected size={15} weight={view === 'integrations' ? 'fill' : 'regular'} /> },
  ]

  const HEADER: Record<ViewId, { title: string; sub: string }> = {
    dashboard: { title: 'Program dashboard', sub: 'AgileOne supplier onboarding — pipeline & SPE queue' },
    agent: { title: 'Agent', sub: 'Create & dispatch structured comms' },
    templates: { title: 'Templates', sub: 'Product flow templates — preview and start a session' },
    sessions: { title: 'Sessions', sub: 'All active and completed comms sessions' },
    conversations: { title: 'Conversations', sub: 'Conversation sessions for this workspace' },
    people: { title: 'People', sub: 'Participant directory — search, add, and edit' },
    integrations: { title: 'Integrations', sub: 'Import and export data' },
  }

  return (
    <div className="h-screen flex overflow-hidden bg-[#F1F5F9]" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Sidebar (dark) ── */}
      <div className="w-[220px] shrink-0 bg-[#0F172A] flex flex-col">
        <div className="px-4 py-4 border-b border-white/10 flex items-center gap-2.5">
          <LogoVoiceWaveIcon size={28} />
          <div className="text-sm font-bold text-white">Comms demo</div>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {NAV.map(item => (
            <button key={item.id} type="button" onClick={() => navigate(`/app/${item.id}`)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${view === item.id ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/80 hover:bg-white/5'}`}>
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-white/10 space-y-1.5">
          <button onClick={() => setSettingsOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-white/40 hover:text-white/70 hover:bg-white/5 transition-all">
            <Settings className="w-3.5 h-3.5" /> Settings
          </button>
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="w-7 h-7 rounded-full bg-brand-indigo flex items-center justify-center shrink-0 text-[10px] font-black text-white">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">{user?.name ?? 'User'}</div>
              <div className="text-[10px] text-white/40 truncate">{user?.email ?? ''}</div>
            </div>
            <button onClick={() => logout()} title="Log out"
              className="p-1 rounded-lg text-white/30 hover:text-red-400 hover:bg-white/5 transition-colors shrink-0">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Content area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <div className="h-12 shrink-0 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-bold text-gray-900 truncate">{HEADER[view].title}</span>
            <span className="text-gray-300 shrink-0">/</span>
            <span className="text-sm text-gray-500 truncate hidden sm:inline">{HEADER[view].sub}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/"
              className="text-xs font-semibold text-brand-indigo hover:text-brand-mid transition-colors"
            >
              Use cases
            </Link>
          </div>
        </div>

        {/* View — flex column so children (e.g. DispatcherChat) can use flex-1 and fill viewport height */}
        <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
          {view === 'dashboard' && <SupplierProgramDashboard />}
          {view === 'agent' && <DispatcherChat onOpenSession={handleOpenSession} />}
          {view === 'templates' && <TemplatesView onOpenSession={handleOpenSession} />}
          {view === 'sessions' && <SessionsView onOpenSession={handleOpenSession} />}
          {view === 'conversations' && selectedAssemblyId ? (
            <ConversationsSessionsPanel
              assemblyId={selectedAssemblyId}
              onOpenSession={(id) => navigate(`/app/conversations/${encodeURIComponent(id)}`)}
            />
          ) : view === 'conversations' ? (
            <div className="flex flex-1 items-center justify-center text-sm text-gray-500">Select a workspace in Settings.</div>
          ) : null}
          {view === 'people' && <PeopleView />}
          {view === 'integrations' && <IntegrationsView />}
        </div>
      </div>

      {/* Session detail — full-screen overlay */}
      {Boolean(productFlowSessionId) && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#F8FAFC]">
          {productFlowSessionId && selectedAssemblyId ? (
            <SessionDetail
              sessionId={productFlowSessionId}
              assemblyId={selectedAssemblyId}
              onBack={handleCloseSheet}
              onOpenConversationSession={handleOpenConversationSession}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
            </div>
          )}
        </div>
      )}

      {conversationSessionId && selectedAssemblyId ? (
        <div className="fixed inset-0 z-[60] flex flex-col overflow-hidden bg-[#F8FAFC]">
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
            <ConversationSessionDetailView
              conversationSessionId={conversationSessionId}
              assemblyId={selectedAssemblyId}
              onBack={handleCloseConversationOverlay}
            />
          </div>
        </div>
      ) : null}

      {/* Workspace settings */}
      <WorkspaceSettings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
