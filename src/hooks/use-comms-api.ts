import { useState, useEffect } from 'react'
import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  type QueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import { commsAPI } from '@/services/comms-api'
import { ENTITY_FILTER_TYPE, FILTER_OPERATORS } from '@/config/orchestration-constants'
import { DEFAULT_SESSION_SORT } from '@/components/conversations/constants'
import type {
  DispatcherAgentSession,
  DispatcherAgentMessageRequest,
  ProductFlowSession,
  ProductFlowSessionSearchRequest,
  Participant,
  ParticipantSearchRequest,
  ParticipantSearchPageResponse,
} from '@/types/api'
import type {
  EntityFilter,
  ProductFlow,
  ProductFlowSessionEvent,
  ProductFlowSessionEventSearchRequest,
  EntitySpec,
  Entity,
  EntityDocQueryBuilder,
  StepResponse,
  ProductFlowSessionMessage,
  CompleteStepResponse,
  CreateSessionRequest,
  CreateSessionResponse,
  BootstrapRequest,
  SessionSearchParams,
} from '@/types/orchestration-dashboard-types'

export const queryKeys = {
  commsInfo: ['commsInfo'] as const,
  dispatcherSession: (assemblyId: string) => ['dispatcherSession', assemblyId] as const,
  productFlowSession: (sessionId: string) => ['productFlowSession', sessionId] as const,
  productFlowsByAssembly: (assemblyId: string) => ['productFlowsByAssembly', assemblyId] as const,
  consolePublishedTriggers: (assemblyId: string, workflowId: string) =>
    ['consolePublishedTriggers', assemblyId, workflowId] as const,
  currentStep: (sessionId: string) => ['currentStep', sessionId] as const,
  sessionMessages: (sessionId: string, stepIndex?: number, limit?: number) =>
    ['sessionMessages', sessionId, stepIndex, limit] as const,
  emailOutreachInStep: (sessionId: string, stepIndex: number) => ['emailOutreachInStep', sessionId, stepIndex] as const,
  dataViewDetails: (assemblyId: string, workflowId: string, dataViewId: string) =>
    ['dataViewDetails', assemblyId, workflowId, dataViewId] as const,
  dataViewDataSearch: (assemblyId: string, workflowId: string, dataViewId: string, queryBuilder?: unknown) =>
    ['dataViewDataSearch', assemblyId, workflowId, dataViewId, queryBuilder] as const,
  entitySearch: (assemblyId: string, workflowId: string, queryBuilder?: unknown) =>
    ['entitySearch', assemblyId, workflowId, queryBuilder] as const,
  conversation: (id: string, assemblyId?: string) => ['conversation', id, assemblyId] as const,
  conversationAsTemplate: (id: string) => ['conversationAsTemplate', id] as const,
  conversationTemplates: (assemblyId: string, params?: unknown) =>
    ['conversationTemplates', assemblyId, params] as const,
  teamMembersSearch: (assemblyId: string, request?: unknown) =>
    ['teamMembersSearch', assemblyId, request] as const,
  productFlowSessions: (params: unknown) => ['productFlowSessions', params] as const,
  participantsDirectory: (assemblyId: string, params: ParticipantSearchRequest) =>
    ['participantsDirectory', assemblyId, JSON.stringify(params)] as const,
  conversationSessionsSearch: (assemblyId: string, params: unknown) =>
    ['conversationSessionsSearch', assemblyId, params] as const,
  conversationSession: (id: string) => ['conversationSession', id] as const,
}

function invalidateProductFlowStepCaches(queryClient: QueryClient, sessionId: string, stepIndex?: number) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.productFlowSession(sessionId) })
  void queryClient.invalidateQueries({ queryKey: queryKeys.currentStep(sessionId) })
  void queryClient.invalidateQueries({
    predicate: (q) =>
      Array.isArray(q.queryKey) && q.queryKey[0] === 'sessionMessages' && q.queryKey[1] === sessionId,
  })
  if (stepIndex !== undefined && stepIndex >= 0) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.emailOutreachInStep(sessionId, stepIndex) })
  } else {
    void queryClient.invalidateQueries({
      predicate: (q) =>
        Array.isArray(q.queryKey) && q.queryKey[0] === 'emailOutreachInStep' && q.queryKey[1] === sessionId,
    })
  }
}

export type ProductFlowSessionEventQueryFilters = {
  eventType?: string
  eventStatus?: string
  timeStartMs?: number
  timeEndMs?: number
}

function buildSessionEventSearchRequest(
  page: number,
  pageSize: number,
  searchText: string | undefined,
  filters: ProductFlowSessionEventQueryFilters | undefined
): ProductFlowSessionEventSearchRequest {
  const entityFilters: EntityFilter[] = []
  if (filters?.eventType) {
    entityFilters.push({
      '@type': ENTITY_FILTER_TYPE,
      field: 'eventType',
      operator: FILTER_OPERATORS.EQ,
      value: filters.eventType,
    })
  }
  if (filters?.eventStatus) {
    entityFilters.push({
      '@type': ENTITY_FILTER_TYPE,
      field: 'eventStatus',
      operator: FILTER_OPERATORS.EQ,
      value: filters.eventStatus,
    })
  }
  if (filters?.timeStartMs != null) {
    entityFilters.push({
      '@type': ENTITY_FILTER_TYPE,
      field: 'lastModifiedAt',
      operator: FILTER_OPERATORS.GTE,
      value: filters.timeStartMs,
    })
  }
  if (filters?.timeEndMs != null) {
    entityFilters.push({
      '@type': ENTITY_FILTER_TYPE,
      field: 'lastModifiedAt',
      operator: FILTER_OPERATORS.LTE,
      value: filters.timeEndMs,
    })
  }
  const req: ProductFlowSessionEventSearchRequest = { page, pageSize }
  if (entityFilters.length > 0) req.entityFilters = entityFilters
  const st = searchText?.trim()
  if (st) req.searchText = st
  return req
}

export function useCommsInfo() {
  return useQuery({
    queryKey: queryKeys.commsInfo,
    queryFn: () => commsAPI.getCommsAppInfo(),
    staleTime: 60_000,
  })
}

export function useDispatcherSession(assemblyId: string, options: { enabled: boolean }) {
  return useQuery<DispatcherAgentSession>({
    queryKey: queryKeys.dispatcherSession(assemblyId),
    queryFn: () => commsAPI.getDispatcherAgentSession(assemblyId),
    enabled: options.enabled && Boolean(assemblyId),
    staleTime: 30_000,
  })
}

/** Product flow definitions for the current assembly (same data as orchestration dashboard flows list). */
export function useProductFlowsByAssembly(assemblyId: string, options: { enabled: boolean }) {
  return useQuery<ProductFlow[]>({
    queryKey: queryKeys.productFlowsByAssembly(assemblyId),
    queryFn: () => commsAPI.getProductFlowsByAssembly(assemblyId),
    enabled: options.enabled && Boolean(assemblyId),
    staleTime: 2 * 60_000,
  })
}

export function useCreateProductFlowSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: CreateSessionRequest) => commsAPI.createProductFlowSession(request),
    onSuccess: (data: CreateSessionResponse, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.productFlowSession(data.session.id) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.currentStep(data.session.id) })
      void queryClient.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          (q.queryKey[0] === 'sessionsView' ||
            q.queryKey[0] === 'dispatcherRail' ||
            q.queryKey[0] === 'sessions-sidebar'),
      })
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : 'Failed to start flow'
      toast.error(msg)
    },
  })
}

export function usePostDispatcherMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      assemblyId,
      request,
    }: {
      assemblyId: string
      request: DispatcherAgentMessageRequest
    }) => commsAPI.postDispatcherAgentMessage(assemblyId, request),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(queryKeys.dispatcherSession(variables.assemblyId), data)
      void queryClient.invalidateQueries({
        queryKey: queryKeys.dispatcherSession(variables.assemblyId),
      })
      void queryClient.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          q.queryKey[1] === variables.assemblyId &&
          (q.queryKey[0] === 'dispatcherRail' || q.queryKey[0] === 'sessions-sidebar'),
      })
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : 'Failed to send message'
      toast.error(msg)
    },
  })
}

export function useSearchProductFlowSessions(
  request: ProductFlowSessionSearchRequest,
  options: { enabled: boolean }
) {
  return useQuery({
    queryKey: ['searchSessions', request],
    queryFn: () => commsAPI.searchProductFlowSessions(request),
    enabled: options.enabled,
    staleTime: 30_000,
  })
}

export function useProductFlowSession(
  sessionId: string | null,
  options: { enabled?: boolean } = {}
) {
  const enabled = (options.enabled ?? true) && Boolean(sessionId)
  return useQuery<ProductFlowSession>({
    queryKey: queryKeys.productFlowSession(sessionId ?? ''),
    queryFn: () => commsAPI.getProductFlowSession(sessionId!),
    enabled,
    staleTime: 15_000,
  })
}

export function useCurrentStep(sessionId: string, options: { enabled?: boolean } = {}) {
  const enabled = options.enabled !== false && Boolean(sessionId)
  return useQuery<StepResponse>({
    queryKey: queryKeys.currentStep(sessionId),
    queryFn: () => commsAPI.getProductFlowSessionCurrentStep(sessionId) as Promise<StepResponse>,
    enabled,
    staleTime: 5_000,
  })
}

export function useSessionMessages(
  sessionId: string,
  stepIndex: number | undefined,
  limit: number | undefined,
  options: { enabled?: boolean } = {}
) {
  const enabled = options.enabled !== false && Boolean(sessionId)
  return useQuery<ProductFlowSessionMessage[]>({
    queryKey: queryKeys.sessionMessages(sessionId, stepIndex, limit),
    queryFn: () => commsAPI.getSessionMessages(sessionId, stepIndex, limit) as Promise<ProductFlowSessionMessage[]>,
    enabled,
    staleTime: 5_000,
  })
}

export function useConsoleWorkflowTriggers(
  assemblyId: string,
  workflowId: string,
  options: { enabled: boolean }
) {
  return useQuery({
    queryKey: queryKeys.consolePublishedTriggers(assemblyId, workflowId),
    queryFn: () => commsAPI.getConsolePublishedTriggers(assemblyId, workflowId),
    enabled: options.enabled && Boolean(assemblyId) && Boolean(workflowId),
    staleTime: 30_000,
    retry: 2,
    retryDelay: 1000,
  })
}

export function useInfiniteProductFlowSessionEvents(
  sessionId: string,
  options: {
    pageSize?: number
    enabled?: boolean
    searchText?: string
    filters?: ProductFlowSessionEventQueryFilters
  } = {}
) {
  const pageSize = options.pageSize ?? 20
  const searchText = options.searchText ?? ''
  const filters = options.filters
  const enabled = options.enabled !== false && Boolean(sessionId)

  return useInfiniteQuery<{
    items: ProductFlowSessionEvent[]
    totalCount: number
    page: number
    pageSize: number
    totalPages: number
  }>({
    queryKey: ['productFlowSessionEventsInfinite', sessionId, pageSize, searchText, filters ?? {}] as const,
    queryFn: ({ pageParam }) =>
      commsAPI.searchProductFlowSessionEvents(
        sessionId,
        buildSessionEventSearchRequest(pageParam as number, pageSize, searchText, filters)
      ),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.totalPages > 0 && lastPage.page + 1 < lastPage.totalPages ? lastPage.page + 1 : undefined,
    enabled,
  })
}

export function useEntitySpec(
  assemblyId: string,
  workflowId: string,
  entitySpecId?: string,
  _fieldName?: string
) {
  return useQuery<EntitySpec>({
    queryKey: ['entitySpec', assemblyId, workflowId, entitySpecId],
    queryFn: () => commsAPI.getEntitySpec(assemblyId, workflowId, entitySpecId!),
    enabled: Boolean(assemblyId && workflowId && entitySpecId),
    staleTime: 5 * 60 * 1000,
  })
}

export function useEntitySearch(
  assemblyId: string,
  workflowId: string,
  queryBuilder: EntityDocQueryBuilder | undefined,
  enabled: boolean = true
) {
  return useQuery<{ results: Entity[]; totalCount: number }>({
    queryKey: queryKeys.entitySearch(assemblyId, workflowId, queryBuilder),
    queryFn: () => commsAPI.searchEntities(assemblyId, workflowId, queryBuilder!),
    enabled: enabled && Boolean(assemblyId && workflowId && queryBuilder?.objectSpecID),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}


export function useNextStep() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (sessionId: string) => commsAPI.nextStep(sessionId, {}),
    onSuccess: (_, sessionId) => {
      invalidateProductFlowStepCaches(queryClient, sessionId)
    },
    onError: () => toast.error('Failed to advance step'),
  })
}

export function useMoveToNextStep() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, request }: { sessionId: string; request?: unknown }) =>
      commsAPI.nextStep(sessionId, request ?? {}),
    onSuccess: (_data, variables) => {
      invalidateProductFlowStepCaches(queryClient, variables.sessionId)
    },
    onError: () => toast.error('Failed to move to next step'),
  })
}

export function useStartStep() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      sessionId,
      stepIndex,
      request,
    }: {
      sessionId: string
      stepIndex: number
      request?: unknown
    }) => commsAPI.startStep(sessionId, stepIndex, request ?? {}),
    onSuccess: (_data, variables) => {
      invalidateProductFlowStepCaches(queryClient, variables.sessionId, variables.stepIndex)
    },
    onError: () => toast.error('Failed to start step'),
  })
}

export function useCompleteStep() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      sessionId,
      stepIndex,
      request,
    }: {
      sessionId: string
      stepIndex: number
      request?: unknown
    }) => commsAPI.completeStep(sessionId, stepIndex, request ?? {}),
    onSuccess: (_data, variables) => {
      invalidateProductFlowStepCaches(queryClient, variables.sessionId, variables.stepIndex)
    },
    onError: () => toast.error('Failed to complete step'),
  })
}

export function useAcknowledgeStep() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, stepIndex }: { sessionId: string; stepIndex: number }) =>
      commsAPI.acknowledgeStep(sessionId, stepIndex),
    onSuccess: (_data, variables) => {
      invalidateProductFlowStepCaches(queryClient, variables.sessionId, variables.stepIndex)
    },
    onError: () => toast.error('Failed to acknowledge step'),
  })
}

export function useRetryStep() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, stepIndex }: { sessionId: string; stepIndex: number }) =>
      commsAPI.retryStep(sessionId, stepIndex),
    onSuccess: (_data, variables) => {
      queryClient.setQueryData(queryKeys.productFlowSession(variables.sessionId), _data)
    },
    onError: () => toast.error('Failed to retry step'),
  })
}

export function useRunAutomation() {
  const queryClient = useQueryClient()
  return useMutation<
    CompleteStepResponse,
    Error,
    { sessionId: string; stepIndex: number; request?: unknown }
  >({
    mutationFn: async ({ sessionId, stepIndex, request }) =>
      (await commsAPI.runAutomation(sessionId, stepIndex, request ?? {})) as CompleteStepResponse,
    onSuccess: (_data, variables) => {
      invalidateProductFlowStepCaches(queryClient, variables.sessionId, variables.stepIndex)
    },
    onError: () => toast.error('Failed to run automation'),
  })
}

export function useSendSessionMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, message }: { sessionId: string; message: string }) =>
      commsAPI.sendProductFlowSessionMessage(sessionId, message),
    onSuccess: (_, { sessionId }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.productFlowSession(sessionId) })
    },
    onError: () => toast.error('Failed to send message'),
  })
}

export function useSendSessionMessageSync() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, message }: { sessionId: string; message: string }) =>
      commsAPI.sendProductFlowSessionMessageSync(sessionId, message),
    onSuccess: (_, { sessionId }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.productFlowSession(sessionId) })
    },
    onError: () => toast.error('Failed to send message'),
  })
}

export function useBootstrapStep() {
  return useMutation({
    mutationFn: ({
      sessionId,
      stepIndex,
      request,
    }: {
      sessionId: string
      stepIndex: number
      request?: BootstrapRequest
    }) => commsAPI.bootstrapStep(sessionId, stepIndex, request),
    onError: () => toast.error('Failed to bootstrap step'),
  })
}

export function useCloseSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (sessionId: string) => commsAPI.closeSession(sessionId),
    onSuccess: (_data, sessionId) => {
      void queryClient.invalidateQueries({ queryKey: ['productFlowSession', sessionId] })
      void queryClient.invalidateQueries({ queryKey: ['productFlowSessions'] })
    },
    onError: () => toast.error('Failed to close session'),
  })
}

export function useReenterStep() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, stepIndex }: { sessionId: string; stepIndex: number }) =>
      commsAPI.reenterStep(sessionId, stepIndex),
    onSuccess: (_data, { sessionId }) => {
      void queryClient.invalidateQueries({ queryKey: ['productFlowSession', sessionId] })
      void queryClient.invalidateQueries({ queryKey: ['productFlowSessions'] })
      void queryClient.invalidateQueries({ queryKey: queryKeys.currentStep(sessionId) })
    },
    onError: () => toast.error('Failed to re-enter step for editing'),
  })
}

export function useSessionTaskStats(sessionId: string, enabled = true) {
  return useQuery({
    queryKey: ['productFlowSessionTaskStats', sessionId],
    queryFn: () => commsAPI.getSessionTaskStats(sessionId),
    enabled: enabled && Boolean(sessionId),
    staleTime: 10_000,
  })
}

/** Resolves participant directory name/email for conversation session ids (Responses table). */
export function useConversationSessionParticipantSummaries(
  sessionId: string,
  conversationSessionIds: string[],
  enabled = true
) {
  const sortedKey = [...conversationSessionIds].sort().join(',')
  return useQuery({
    queryKey: ['conversationSessionParticipants', sessionId, sortedKey] as const,
    queryFn: () => commsAPI.resolveConversationSessionParticipants(sessionId, conversationSessionIds),
    enabled: enabled && Boolean(sessionId) && conversationSessionIds.length > 0,
    staleTime: 30_000,
  })
}

export function useSessionTasks(
  sessionId: string,
  page = 0,
  pageSize = 20,
  searchQuery = '',
  enabled = true
) {
  const q = searchQuery.trim()
  return useQuery({
    queryKey: ['productFlowSessionTasks', sessionId, page, pageSize, q],
    queryFn: () => commsAPI.getSessionTasks(sessionId, page, pageSize, q || undefined),
    enabled: enabled && Boolean(sessionId),
    staleTime: 10_000,
  })
}

export function useResolveTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { sessionId: string; taskId: string; status: 'COMPLETED' | 'FAILED' | 'CANCELLED' }) =>
      commsAPI.resolveTask(params.sessionId, params.taskId, params.status),
    onSuccess: (_data, params) => {
      void queryClient.invalidateQueries({ queryKey: ['productFlowSessionTasks', params.sessionId] })
      void queryClient.invalidateQueries({ queryKey: ['productFlowSessionTaskStats', params.sessionId] })
      void queryClient.invalidateQueries({ queryKey: ['productFlowSession', params.sessionId] })
      void queryClient.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          q.queryKey[0] === 'conversationSessionParticipants' &&
          q.queryKey[1] === params.sessionId,
      })
    },
    onError: () => toast.error('Failed to resolve task'),
  })
}

export function useTaskMessages(taskId: string, page = 0, pageSize = 50, enabled = true) {
  return useQuery({
    queryKey: ['taskMessages', taskId, page, pageSize],
    queryFn: () => commsAPI.getTaskMessages(taskId, page, pageSize),
    enabled: enabled && Boolean(taskId),
    staleTime: 5_000,
    refetchInterval: 15_000,
  })
}

export function useSendTaskMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { taskId: string; content: string; files?: File[] }) =>
      commsAPI.sendTaskMessage(params.taskId, params.content, params.files),
    onSuccess: (_data, params) => {
      void queryClient.invalidateQueries({ queryKey: ['taskMessages', params.taskId] })
      void queryClient.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) && q.queryKey[0] === 'productFlowSessionTasks',
      })
    },
    onError: () => toast.error('Failed to send message'),
  })
}

export function useCreateConversation() {
  return useMutation({
    mutationFn: ({
      sessionId,
      stepIndex,
      payload,
    }: {
      sessionId: string
      stepIndex: number
      payload: unknown
    }) => commsAPI.createConversation(sessionId, stepIndex, payload),
    onError: () => toast.error('Failed to create conversation'),
  })
}

export function useUpdateConversation() {
  return useMutation({
    mutationFn: ({
      sessionId,
      stepIndex,
      payload,
    }: {
      sessionId: string
      stepIndex: number
      payload: unknown
    }) => commsAPI.updateConversation(sessionId, stepIndex, payload),
    onError: () => toast.error('Failed to update conversation'),
  })
}

export function useDeleteConversation() {
  return useMutation({
    mutationFn: ({ sessionId, stepIndex }: { sessionId: string; stepIndex: number }) =>
      commsAPI.deleteConversation(sessionId, stepIndex),
    onError: () => toast.error('Failed to delete conversation'),
  })
}

export function useCreateEmailOutreach() {
  return useMutation({
    mutationFn: ({
      sessionId,
      stepIndex,
      payload,
    }: {
      sessionId: string
      stepIndex: number
      payload: unknown
    }) => commsAPI.createEmailOutreach(sessionId, stepIndex, payload),
    onError: () => toast.error('Failed to create email outreach'),
  })
}

export function useUpdateEmailOutreach() {
  return useMutation({
    mutationFn: ({
      sessionId,
      stepIndex,
      payload,
    }: {
      sessionId: string
      stepIndex: number
      payload: unknown
    }) => commsAPI.updateEmailOutreach(sessionId, stepIndex, payload),
    onError: () => toast.error('Failed to update email outreach'),
  })
}

export function useSendEmailOutreach() {
  return useMutation({
    mutationFn: ({ sessionId, stepIndex }: { sessionId: string; stepIndex: number }) =>
      commsAPI.sendEmailOutreach(sessionId, stepIndex),
    onError: () => toast.error('Failed to send email outreach'),
  })
}

export function useDeleteEmailOutreach() {
  return useMutation({
    mutationFn: ({ sessionId, stepIndex }: { sessionId: string; stepIndex: number }) =>
      commsAPI.deleteEmailOutreach(sessionId, stepIndex),
    onError: () => toast.error('Failed to delete email outreach'),
  })
}

export function useAddFollowUp() {
  return useMutation({
    mutationFn: ({
      sessionId,
      stepIndex,
      payload,
    }: {
      sessionId: string
      stepIndex: number
      payload: unknown
    }) => commsAPI.addFollowUp(sessionId, stepIndex, payload),
    onError: () => toast.error('Failed to add follow-up'),
  })
}

export function useRemoveSessionResult() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, resultId }: { sessionId: string; resultId: string }) =>
      commsAPI.removeSessionResult(sessionId, resultId),
    onSuccess: (_, { sessionId }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.productFlowSession(sessionId) })
    },
    onError: () => toast.error('Failed to remove result'),
  })
}

export function useSendStepUpdate() {
  return useMutation({
    mutationFn: ({
      sessionId,
      stepIndex,
      payload,
    }: {
      sessionId: string
      stepIndex: number
      payload: unknown
    }) => commsAPI.sendStepUpdate(sessionId, stepIndex, payload),
    onError: () => toast.error('Failed to send step update'),
  })
}

export function useAddSessionUpdate() {
  return useMutation({
    mutationFn: ({ sessionId, payload }: { sessionId: string; payload: unknown }) =>
      commsAPI.addSessionUpdate(sessionId, payload),
    onError: () => toast.error('Failed to add session update'),
  })
}

export function useConversation(id: string, enabled: boolean = true, assemblyId?: string) {
  return useQuery({
    queryKey: queryKeys.conversation(id, assemblyId),
    queryFn: () => commsAPI.getConversation(id, assemblyId),
    enabled: enabled && Boolean(id),
    staleTime: 2 * 60 * 1000,
  })
}

export function useConversationAsTemplate(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.conversationAsTemplate(id),
    queryFn: () => commsAPI.getConversationAsTemplate(id),
    enabled: enabled && Boolean(id),
    staleTime: 2 * 60 * 1000,
  })
}

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

export function useConversationTemplateSearch(
  assemblyId: string,
  searchQuery: string,
  filters: Record<string, unknown> = {},
) {
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const { data: searchResponse, isLoading } = useQuery({
    queryKey: queryKeys.conversationTemplates(assemblyId, { ...filters, searchQuery: debouncedSearchQuery }),
    queryFn: () => commsAPI.getConversationTemplateConversations(assemblyId, {
      ...filters,
      searchQuery: debouncedSearchQuery,
      assemblyID: assemblyId,
      page: (filters.page as number) ?? 0,
      pageSize: (filters.pageSize as number) ?? 50,
    }),
    enabled: Boolean(assemblyId),
    staleTime: 30_000,
  })
  return { data: searchResponse, isLoading, templates: (searchResponse as unknown as Record<string, unknown>)?.conversations ?? [] }
}

export function useCreateConversationInStep() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      sessionId, stepIndex, request,
    }: { sessionId: string; stepIndex: number; request: unknown }) =>
      commsAPI.createConversationInStep(sessionId, stepIndex, request),
    onSuccess: (_data, variables) => {
      invalidateProductFlowStepCaches(queryClient, variables.sessionId, variables.stepIndex)
    },
  })
}

export function useUpdateConversationInStep() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      sessionId, stepIndex, request,
    }: { sessionId: string; stepIndex: number; request: unknown }) =>
      commsAPI.updateConversationInStep(sessionId, stepIndex, request),
    onSuccess: (_data, variables) => {
      invalidateProductFlowStepCaches(queryClient, variables.sessionId, variables.stepIndex)
    },
  })
}

export function useEmailOutreachInStep(sessionId: string, stepIndex: number, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.emailOutreachInStep(sessionId, stepIndex),
    queryFn: () => commsAPI.getEmailOutreachInStep(sessionId, stepIndex),
    enabled: Boolean(enabled && sessionId && stepIndex >= 0),
    staleTime: 30_000,
  })
}

export function useUpdateEmailOutreachInStep() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      sessionId, stepIndex, request,
    }: { sessionId: string; stepIndex: number; request: unknown }) =>
      commsAPI.updateEmailOutreachInStep(sessionId, stepIndex, request),
    onSuccess: (_data, variables) => {
      invalidateProductFlowStepCaches(queryClient, variables.sessionId, variables.stepIndex)
    },
  })
}

export function useSendEmailOutreachInStep() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      sessionId, stepIndex, request,
    }: { sessionId: string; stepIndex: number; request?: unknown }) =>
      commsAPI.sendEmailOutreachInStep(sessionId, stepIndex, request),
    onSuccess: (_data, variables) => {
      invalidateProductFlowStepCaches(queryClient, variables.sessionId, variables.stepIndex)
    },
  })
}

export function useAddFollowUpInStep() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      sessionId, stepIndex, request,
    }: { sessionId: string; stepIndex: number; request?: unknown }) =>
      commsAPI.addFollowUpInStep(sessionId, stepIndex, request),
    onSuccess: (_data, variables) => {
      invalidateProductFlowStepCaches(queryClient, variables.sessionId, variables.stepIndex)
    },
  })
}

export function useTeamMembersSearch(assemblyId: string, request: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: queryKeys.teamMembersSearch(assemblyId, request),
    queryFn: () => commsAPI.searchTeamMembers(assemblyId, request),
    enabled: Boolean(assemblyId),
    staleTime: 5 * 60 * 1000,
  })
}

export function useConversationSession(conversationSessionId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.conversationSession(conversationSessionId),
    queryFn: () => commsAPI.getConversationSessionById(conversationSessionId),
    enabled: enabled && Boolean(conversationSessionId),
    staleTime: 60_000,
  })
}

const CONVERSATION_SESSION_SEARCH_DEBOUNCE_MS = 350

export function useConversationSessionSearch(
  assemblyId: string,
  searchQuery: string,
  filters: Omit<SessionSearchParams, 'search' | 'assemblyLineID'> & {
    page?: number
    pageSize?: number
  } = {},
) {
  const debouncedSearchQuery = useDebounce(searchQuery, CONVERSATION_SESSION_SEARCH_DEBOUNCE_MS)

  const { data: searchResponse, isLoading } = useQuery({
    queryKey: queryKeys.conversationSessionsSearch(assemblyId, {
      ...filters,
      search: debouncedSearchQuery || '*',
      assemblyLineID: assemblyId,
      sort: filters.sort ?? DEFAULT_SESSION_SORT,
    }),
    queryFn: () =>
      commsAPI.searchConversationSessions(assemblyId, {
        ...filters,
        search: debouncedSearchQuery || '*',
        assemblyLineID: assemblyId,
        sort: filters.sort ?? DEFAULT_SESSION_SORT,
        page: filters.page !== undefined ? filters.page : 0,
        pageSize: filters.pageSize || 20,
      }),
    enabled: Boolean(assemblyId),
    staleTime: 30_000,
  })

  return {
    sessions: searchResponse?.sessions ?? [],
    isLoading,
    totalCount: searchResponse?.totalCount ?? 0,
    page: searchResponse?.page ?? 0,
    pageSize: searchResponse?.pageSize ?? 20,
    totalPages: searchResponse?.totalPages ?? 0,
    searchQuery: debouncedSearchQuery,
  }
}

export function useMockConversationCompletion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { sessionId: string; email: string }) =>
      commsAPI.mockConversationCompletion(params.sessionId, params.email),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['productFlowSessionTasks', variables.sessionId] })
      void queryClient.invalidateQueries({ queryKey: ['productFlowSessionTaskStats', variables.sessionId] })
      void queryClient.invalidateQueries({ queryKey: queryKeys.productFlowSession(variables.sessionId) })
      void queryClient.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          q.queryKey[0] === 'productFlowSessionEventsInfinite' &&
          q.queryKey[1] === variables.sessionId,
      })
      void queryClient.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          q.queryKey[0] === 'conversationSessionParticipants' &&
          q.queryKey[1] === variables.sessionId,
      })
      void queryClient.invalidateQueries({
        predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'conversationSession',
      })
      toast.success(`Conversation completion simulated for ${variables.email}`)
    },
    onError: () => toast.error('Failed to simulate conversation completion'),
  })
}

export function useProductFlowSessionEventsPivot() {
  return useMutation({
    mutationFn: (params: { sessionId: string; request: unknown }) =>
      commsAPI.searchProductFlowSessionEvents(params.sessionId, params.request as Record<string, unknown>),
    onError: () => toast.error('Failed to run pivot'),
  })
}

// --- Participants ---

export function useParticipantsDirectorySearch(assemblyId: string, params: ParticipantSearchRequest) {
  return useQuery<ParticipantSearchPageResponse>({
    queryKey: queryKeys.participantsDirectory(assemblyId, params),
    queryFn: () => commsAPI.searchParticipantsDirectory(assemblyId, params),
    enabled: Boolean(assemblyId),
    placeholderData: (previousData) => previousData,
  })
}

export function useCreateParticipantForAssembly() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ assemblyId, body }: { assemblyId: string; body: Participant }) =>
      commsAPI.createParticipantForAssembly(assemblyId, body),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['participantsDirectory', variables.assemblyId] })
      toast.success('Participant created')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create participant')
    },
  })
}

export function useUpdateParticipantForAssembly() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      assemblyId,
      participantId,
      body,
    }: {
      assemblyId: string
      participantId: string
      body: Participant
    }) => commsAPI.updateParticipantForAssembly(assemblyId, participantId, body),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['participantsDirectory', variables.assemblyId] })
      toast.success('Participant updated')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update participant')
    },
  })
}
