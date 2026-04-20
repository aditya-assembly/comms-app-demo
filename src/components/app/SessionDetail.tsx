import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react'
import { useProductFlowSession } from '@/hooks/use-comms-api'
import { FlowSessionExecution } from '@/components/flows/flow-session-execution'
import type { ProductFlowSession as OrchestrationProductFlowSession } from '@/types/orchestration-dashboard-types'

interface SessionDetailProps {
  sessionId: string
  assemblyId: string
  onBack: () => void
  onOpenConversationSession?: (conversationSessionId: string) => void
}

export function SessionDetail({ sessionId, assemblyId, onBack, onOpenConversationSession }: SessionDetailProps) {
  const { data: session, isLoading } = useProductFlowSession(sessionId)

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20">
        <AlertCircle className="w-8 h-8 text-gray-300" />
        <p className="text-sm text-gray-400">Could not load this session.</p>
        <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Go back
        </button>
      </div>
    )
  }

  return (
    <FlowSessionExecution
      session={session as unknown as OrchestrationProductFlowSession}
      onBack={onBack}
      assemblyId={assemblyId}
      workflowId={session.workflowId ?? ''}
      onOpenConversationSession={onOpenConversationSession}
    />
  )
}
