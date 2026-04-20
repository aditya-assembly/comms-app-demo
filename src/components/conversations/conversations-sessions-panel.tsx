import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import {
  CheckCircle2,
  Clock,
  MessageSquare,
  Phone,
  PhoneIncoming,
  Play,
  Users,
  Video,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useConversationSessionSearch } from '@/hooks/use-comms-api'
import { commsAPI } from '@/services/comms-api'
import type { Participant } from '@/types/api'
import type { ConversationSession } from '@/types/orchestration-dashboard-types'
import { DEFAULT_SESSION_SORT } from '@/components/conversations/constants'
import { cn } from '@/lib/utils'
import {
  appListToolbarBarClass,
  AppListToolbarRow,
  AppListSearchField,
  appListToolbarMetaClass,
} from '@/components/app/app-list-toolbar'

const typeIcons = {
  INCOMING_CALL: PhoneIncoming,
  OUTGOING_CALL: Phone,
  VIDEO_CALL: Video,
  ASSISTANT_CHAT: MessageSquare,
}

const typeLabels: Record<string, string> = {
  INCOMING_CALL: 'Incoming Call',
  OUTGOING_CALL: 'Outgoing Call',
  VIDEO_CALL: 'Video Call',
  ASSISTANT_CHAT: 'Assistant Chat',
}

function formatDuration(startTime?: number, endTime?: number | null): string {
  if (!startTime) return 'N/A'
  if (!endTime) return 'In progress'

  const durationMs = endTime - startTime
  const durationSeconds = Math.floor(durationMs / 1000)
  const minutes = Math.floor(durationSeconds / 60)
  const seconds = durationSeconds % 60

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  return `${seconds}s`
}

function formatParticipantDisplayName(p: Participant): string {
  const name = `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim()
  return name || p.email || 'Unknown'
}

type SessionTab = 'all' | 'open' | 'completed'

interface ConversationsSessionsPanelProps {
  assemblyId: string
  onOpenSession: (conversationSessionId: string) => void
}

export function ConversationsSessionsPanel({ assemblyId, onOpenSession }: ConversationsSessionsPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const [activeTab, setActiveTab] = useState<SessionTab>('all')
  const pageSize = 20

  const sessionCompleteFilter =
    activeTab === 'open' ? false : activeTab === 'completed' ? true : undefined

  const { sessions, isLoading, totalCount, totalPages } = useConversationSessionSearch(
    assemblyId,
    searchQuery,
    {
      page,
      pageSize,
      sessionComplete: sessionCompleteFilter,
      sort: DEFAULT_SESSION_SORT,
    },
  )

  const [participantsMap, setParticipantsMap] = useState<Record<string, Record<string, Participant>>>({})

  const fetchAllParticipants = useCallback(async () => {
    const sessionParticipants: Record<string, Record<string, Participant>> = {}
    const allParticipantIds = new Set<string>()
    sessions.forEach((session) => {
      session.participants?.forEach((id) => allParticipantIds.add(id))
    })

    if (allParticipantIds.size === 0) {
      setParticipantsMap(sessionParticipants)
      return
    }

    try {
      const allParticipants = await commsAPI.getParticipantsBatch(Array.from(allParticipantIds))
      const participantLookup = allParticipants.reduce<Record<string, Participant>>((acc, p) => {
        acc[p.id] = p
        return acc
      }, {})

      sessions.forEach((session) => {
        if (session.participants?.length) {
          const sessionParticipantMap = session.participants.reduce<Record<string, Participant>>((acc, id) => {
            const participant = participantLookup[id]
            if (participant) acc[id] = participant
            return acc
          }, {})
          sessionParticipants[session.id] = sessionParticipantMap
        }
      })
    } catch {
      // Non-blocking
    }
    setParticipantsMap(sessionParticipants)
  }, [sessions])

  useEffect(() => {
    if (sessions.length > 0) {
      void fetchAllParticipants()
    } else {
      setParticipantsMap({})
    }
  }, [sessions, fetchAllParticipants])

  const handleTabChange = (value: string) => {
    setActiveTab(value as SessionTab)
    setPage(0)
  }

  const titleForCount = useMemo(() => {
    if (activeTab === 'all') return `All (${totalCount})`
    if (activeTab === 'open') return `Open (${totalCount})`
    return `Completed (${totalCount})`
  }, [activeTab, totalCount])

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden bg-white">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-1 min-h-0 flex-col overflow-hidden">
        <div className={appListToolbarBarClass}>
          <AppListToolbarRow>
            <TabsList
              className={cn(
                'h-auto shrink-0 justify-start gap-0 rounded-xl border-0 bg-[#F1F5F9] p-1 shadow-none',
                'inline-flex w-auto',
              )}
            >
              <TabsTrigger
                value="all"
                className="rounded-lg px-3 py-1.5 text-xs font-semibold data-[state=active]:border-0 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=inactive]:text-gray-500"
              >
                All
              </TabsTrigger>
              <TabsTrigger
                value="open"
                className="rounded-lg px-3 py-1.5 text-xs font-semibold data-[state=active]:border-0 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=inactive]:text-gray-500"
              >
                Open
              </TabsTrigger>
              <TabsTrigger
                value="completed"
                className="rounded-lg px-3 py-1.5 text-xs font-semibold data-[state=active]:border-0 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm data-[state=inactive]:text-gray-500"
              >
                Completed
              </TabsTrigger>
            </TabsList>
            <AppListSearchField
              value={searchQuery}
              onChange={(v) => {
                setSearchQuery(v)
                setPage(0)
              }}
              placeholder="Search by title, room, participant…"
            />
            <span className={cn(appListToolbarMetaClass, 'max-sm:w-full max-sm:pt-0')}>{titleForCount}</span>
          </AppListToolbarRow>
        </div>

        <div className="flex flex-1 min-h-0 flex-col overflow-hidden px-5 pb-4 pt-4">
        <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
          {isLoading ? (
            <Card className="border-gray-100">
              <CardContent className="p-10 text-center text-sm text-gray-500">Loading sessions…</CardContent>
            </Card>
          ) : sessions.length === 0 ? (
            <Card className="border-gray-100">
              <CardContent className="p-10 text-center text-sm text-gray-500">
                No conversation sessions match your filters.
              </CardContent>
            </Card>
          ) : (
            sessions.map((session, index) => {
              const TypeIcon = typeIcons[session.type as keyof typeof typeIcons] || MessageSquare
              return (
                <SessionCard
                  key={session.id}
                  session={session}
                  index={index}
                  TypeIcon={TypeIcon}
                  onSessionClick={onOpenSession}
                  participantsMap={participantsMap}
                />
              )
            })
          )}
        </div>

        {totalPages > 1 ? (
          <div className="mt-4 flex shrink-0 items-center justify-between border-t border-[#E2E8F0] pt-3">
            <span className="text-xs text-gray-500">
              Page {page + 1} of {totalPages} ({totalCount} total)
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                disabled={page === 0 || isLoading}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                disabled={page >= totalPages - 1 || isLoading}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
        </div>
      </Tabs>
    </div>
  )
}

function SessionCard({
  session,
  index,
  TypeIcon,
  onSessionClick,
  participantsMap,
}: {
  session: ConversationSession
  index: number
  TypeIcon: React.ComponentType<{ className?: string }>
  onSessionClick: (sessionId: string) => void
  participantsMap: Record<string, Record<string, Participant>>
}) {
  const duration = formatDuration(session.conversationStartedAt, session.conversationEndedAt)
  const startDate = session.conversationStartedAt ? new Date(session.conversationStartedAt) : null
  const endDate = session.conversationEndedAt ? new Date(session.conversationEndedAt) : null

  const sessionParticipants = participantsMap[session.id]
  const hasParticipantIds = (session.participants?.length ?? 0) > 0
  const participantNames =
    sessionParticipants && Object.values(sessionParticipants).map(formatParticipantDisplayName).filter(Boolean)
  const participantsLabel =
    !hasParticipantIds ? '—' : participantNames?.length ? participantNames.join(', ') : 'Loading participants…'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
    >
      <button
        type="button"
        onClick={() => onSessionClick(session.id)}
        className={cn(
          'w-full text-left rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all',
          'hover:border-brand-indigo/30 hover:bg-brand-ghost/40 hover:shadow-md',
        )}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg bg-gray-50 p-2">
            <TypeIcon className="h-5 w-5 text-brand-indigo" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-sm font-semibold text-gray-900">
                {session.title?.trim() || "Conversation"}
              </h3>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase text-gray-600">
                {typeLabels[session.type] ?? session.type}
              </span>
              {session.sessionComplete ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                  <CheckCircle2 className="h-3 w-3" /> Done
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                  <Play className="h-3 w-3" /> Open
                </span>
              )}
            </div>
            <div className="mt-2 grid gap-1 text-xs text-gray-500 sm:grid-cols-2">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {startDate ? format(startDate, 'MMM d, yyyy h:mm a') : '—'}
                  {endDate ? ` → ${format(endDate, 'h:mm a')}` : ''}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400">Duration</span>
                <span className="font-medium text-gray-700">{duration}</span>
              </div>
              <div className="flex items-start gap-1.5 sm:col-span-2">
                <Users className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span className="break-words">{participantsLabel}</span>
              </div>
            </div>
          </div>
        </div>
      </button>
    </motion.div>
  )
}
