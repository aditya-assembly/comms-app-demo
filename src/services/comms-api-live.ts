import { apiClient } from './api'
import { API_CONFIG } from '@/config/api'
import type {
  CommsAppInfo,
  DispatcherAgentSession,
  DispatcherAgentMessageRequest,
  ProductFlowSession,
  ProductFlowSessionSearchResponse,
  ProductFlowSessionSearchRequest,
  ProductFlowSessionTask,
  ProductFlowSessionTaskPageResponse,
  ProductFlowSessionTaskStatsResponse,
  ConversationSessionParticipantsResolveResponse,
  TaskMessage,
  TaskMessagePageResponse,
  SSOResponse,
  Participant,
  ParticipantSearchRequest,
  ParticipantSearchPageResponse,
  ParticipantImportItem,
  BatchParticipantResult,
  IntegrationConnection,
  ExportJob,
  SftpConnectionRequest,
  ExportRequest,
  FolderEntry,
} from '@/types/api'
import type {
  WorkflowTriggerItem,
  TriggerExecutionResponse,
  TriggerInputValue,
  EntitySpec,
  Entity,
  EntityDocQueryBuilder,
  DataView,
  DataViewQuery,
  MediaFile,
  ProductFlow,
  ProductFlowSessionEvent,
  ProductFlowSessionEventSearchRequest,
  GeolocationTypeaheadResponse,
  GeolocationCityResult,
  MessageRequest,
  SSEEvent,
  CreateSessionRequest,
  CreateSessionResponse,
  BootstrapRequest,
  SessionSearchParams,
  SessionSearchResponse,
} from '@/types/orchestration-dashboard-types'


const filterNullEntities = <T,>(items: (T | null)[] | undefined, totalCount: number | undefined): { items: T[]; totalCount: number } => {
  if (!items || items.length === 0) {
    return { items: [], totalCount: totalCount || 0 }
  }
  let nullCount = 0
  const filtered = items.filter((item): item is T => {
    if (item === null) {
      nullCount++
      return false
    }
    return true
  })
  return { items: filtered, totalCount: Math.max(0, (totalCount || 0) - nullCount) }
}

export class LiveCommsAPI {
  // --- Auth ---

  async generateOTP(email: string): Promise<{ message: string }> {
    return apiClient.post(API_CONFIG.ENDPOINTS.AUTH.GENERATE_OTP, null, {
      params: { email },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  }

  async loginWithOTP(email: string, code: string): Promise<{ message: string }> {
    return apiClient.get(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
      params: { email, code, ref: 'comms-app' },
    })
  }

  async logout(): Promise<void> {
    await apiClient.get(API_CONFIG.ENDPOINTS.AUTH.LOGOUT)
  }

  async getSSOAuthorizeUrl(params: {
    provider: string
    state: string
    redirectUri: string
    email?: string
    domain?: string
  }): Promise<string> {
    const result = await apiClient.get<{ url?: string; redirectUrl?: string }>(
      API_CONFIG.ENDPOINTS.AUTH.SSO_AUTHORIZE,
      { params }
    )
    return result.url ?? result.redirectUrl ?? ''
  }

  async completeSSOLogin(params: {
    code: string
    state: string
    redirectUri: string
  }): Promise<SSOResponse> {
    return apiClient.post(API_CONFIG.ENDPOINTS.AUTH.SSO_COMPLETE_WEB, params)
  }

  // --- Comms App Info ---

  async getCommsAppInfo(): Promise<CommsAppInfo> {
    return apiClient.get(API_CONFIG.ENDPOINTS.COMMS_APP.INFO)
  }

  // --- Dispatcher Agent ---

  async getDispatcherAgentSession(assemblyId: string): Promise<DispatcherAgentSession> {
    return apiClient.get(API_CONFIG.ENDPOINTS.DISPATCHER_AGENT.SESSION(assemblyId))
  }

  async postDispatcherAgentMessage(
    assemblyId: string,
    request: DispatcherAgentMessageRequest
  ): Promise<DispatcherAgentSession> {
    return apiClient.post(API_CONFIG.ENDPOINTS.DISPATCHER_AGENT.MESSAGES(assemblyId), request)
  }

  // --- Product flow definitions (templates / catalog) — Comms orchestration-dashboard facade ---

  async getProductFlowsByAssembly(assemblyId: string): Promise<ProductFlow[]> {
    return apiClient.get(API_CONFIG.ENDPOINTS.PRODUCT_FLOWS.GET_BY_ASSEMBLY(assemblyId))
  }

  async getProductFlowById(assemblyId: string, workflowId: string, productFlowId: string): Promise<ProductFlow> {
    return apiClient.get(API_CONFIG.ENDPOINTS.PRODUCT_FLOWS.GET_BY_ID(assemblyId, workflowId, productFlowId))
  }

  // --- Product Flow Sessions ---

  async createProductFlowSession(request: CreateSessionRequest): Promise<CreateSessionResponse> {
    return apiClient.post(API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.CREATE, request)
  }

  async searchProductFlowSessions(
    request: ProductFlowSessionSearchRequest
  ): Promise<ProductFlowSessionSearchResponse> {
    return apiClient.post(API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.SEARCH, request)
  }

  async getProductFlowSession(sessionId: string): Promise<ProductFlowSession> {
    return apiClient.get(API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.GET(sessionId))
  }

  async getProductFlowSessionCurrentStep(sessionId: string): Promise<unknown> {
    return apiClient.get(API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.GET_CURRENT_STEP(sessionId))
  }

  async sendProductFlowSessionMessage(sessionId: string, message: string): Promise<unknown> {
    return apiClient.post(API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.SEND_MESSAGE(sessionId), { message })
  }

  async sendProductFlowSessionMessageSync(sessionId: string, message: string): Promise<unknown> {
    return apiClient.post(API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.SEND_MESSAGE_SYNC(sessionId), { message })
  }

  async nextStep(sessionId: string, body?: unknown): Promise<unknown> {
    return apiClient.post(API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.NEXT_STEP(sessionId), body ?? {})
  }

  async startStep(sessionId: string, stepIndex: number, body?: unknown): Promise<unknown> {
    return apiClient.post(API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.START_STEP(sessionId, stepIndex), body ?? {})
  }

  async completeStep(sessionId: string, stepIndex: number, body?: unknown): Promise<unknown> {
    return apiClient.post(API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.COMPLETE_STEP(sessionId, stepIndex), body ?? {})
  }

  async runAutomation(sessionId: string, stepIndex: number, body?: unknown): Promise<unknown> {
    return apiClient.post(API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.RUN_AUTOMATION(sessionId, stepIndex), body ?? {})
  }

  async acknowledgeStep(sessionId: string, stepIndex: number): Promise<ProductFlowSession> {
    return apiClient.post(API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.ACKNOWLEDGE_STEP(sessionId, stepIndex))
  }

  async retryStep(sessionId: string, stepIndex: number): Promise<ProductFlowSession> {
    return apiClient.post(API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.RETRY_STEP(sessionId, stepIndex))
  }

  async bootstrapStep(sessionId: string, stepIndex: number, request?: BootstrapRequest): Promise<unknown> {
    return apiClient.post(API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.BOOTSTRAP(sessionId, stepIndex), request ?? {})
  }

  async getStepUpdates(sessionId: string, stepIndex: number): Promise<unknown> {
    return apiClient.get(API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.GET_STEP_UPDATES(sessionId, stepIndex))
  }

  async sendStepUpdate(sessionId: string, stepIndex: number, payload: unknown): Promise<unknown> {
    return apiClient.post(API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.SEND_STEP_UPDATE(sessionId, stepIndex), payload)
  }

  async addSessionUpdate(sessionId: string, payload: unknown): Promise<unknown> {
    return apiClient.post(API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.ADD_SESSION_UPDATE(sessionId), payload)
  }

  async createConversation(sessionId: string, stepIndex: number, payload: unknown): Promise<unknown> {
    return apiClient.post(API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.CREATE_CONVERSATION(sessionId, stepIndex), payload)
  }

  async updateConversation(sessionId: string, stepIndex: number, payload: unknown): Promise<unknown> {
    return apiClient.put(API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.UPDATE_CONVERSATION(sessionId, stepIndex), payload)
  }

  async deleteConversation(sessionId: string, stepIndex: number): Promise<unknown> {
    return apiClient.delete(API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.DELETE_CONVERSATION(sessionId, stepIndex))
  }

  async createEmailOutreach(sessionId: string, stepIndex: number, payload: unknown): Promise<unknown> {
    return apiClient.post(API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.CREATE_EMAIL_OUTREACH(sessionId, stepIndex), payload)
  }

  async getEmailOutreach(sessionId: string, stepIndex: number): Promise<unknown> {
    return apiClient.get(API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.GET_EMAIL_OUTREACH(sessionId, stepIndex))
  }

  async updateEmailOutreach(sessionId: string, stepIndex: number, payload: unknown): Promise<unknown> {
    return apiClient.put(API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.UPDATE_EMAIL_OUTREACH(sessionId, stepIndex), payload)
  }

  async sendEmailOutreach(sessionId: string, stepIndex: number): Promise<unknown> {
    return apiClient.post(API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.SEND_EMAIL_OUTREACH(sessionId, stepIndex))
  }

  async addFollowUp(sessionId: string, stepIndex: number, payload: unknown): Promise<unknown> {
    return apiClient.post(API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.ADD_FOLLOW_UP(sessionId, stepIndex), payload)
  }

  async deleteEmailOutreach(sessionId: string, stepIndex: number): Promise<unknown> {
    return apiClient.delete(API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.DELETE_EMAIL_OUTREACH(sessionId, stepIndex))
  }

  async removeSessionResult(sessionId: string, resultId: string): Promise<unknown> {
    return apiClient.delete(API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.REMOVE_SESSION_RESULT(sessionId, resultId))
  }

  async getConversationSession(sessionId: string, conversationSessionId: string): Promise<unknown> {
    return apiClient.get(
      API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.GET_CONVERSATION_SESSION(sessionId, conversationSessionId)
    )
  }

  /** Alias for orchestration-dashboard naming — same as {@link #getConversationSession}. */
  async getConversationSessionForProductFlowSession(
    productFlowSessionId: string,
    conversationSessionId: string
  ): Promise<unknown> {
    return this.getConversationSession(productFlowSessionId, conversationSessionId)
  }

  async searchSessionEvents(sessionId: string, payload: unknown): Promise<unknown> {
    return apiClient.post(API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.EVENTS_SEARCH(sessionId), payload)
  }

  async closeSession(sessionId: string): Promise<ProductFlowSession> {
    return apiClient.post<ProductFlowSession>(API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.CLOSE(sessionId))
  }

  async reenterStep(sessionId: string, stepIndex: number): Promise<unknown> {
    return apiClient.post(API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.REENTER_STEP(sessionId, stepIndex))
  }

  async getSessionTaskStats(sessionId: string): Promise<ProductFlowSessionTaskStatsResponse> {
    return apiClient.get<ProductFlowSessionTaskStatsResponse>(
      API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.TASKS_STATS(sessionId)
    )
  }

  async resolveConversationSessionParticipants(
    sessionId: string,
    conversationSessionIds: string[]
  ): Promise<ConversationSessionParticipantsResolveResponse> {
    return apiClient.post<ConversationSessionParticipantsResolveResponse>(
      API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.RESOLVE_CONVERSATION_SESSION_PARTICIPANTS(sessionId),
      { conversationSessionIds }
    )
  }

  async getSessionTasks(
    sessionId: string,
    page = 0,
    pageSize = 20,
    searchQuery?: string
  ): Promise<ProductFlowSessionTaskPageResponse> {
    const params: Record<string, string | number> = { page, pageSize }
    if (searchQuery?.trim()) {
      params.q = searchQuery.trim()
    }
    return apiClient.get<ProductFlowSessionTaskPageResponse>(
      API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.TASKS(sessionId),
      { params }
    )
  }

  async resolveTask(sessionId: string, taskId: string, status: 'COMPLETED' | 'FAILED' | 'CANCELLED'): Promise<ProductFlowSessionTask> {
    return apiClient.patch<ProductFlowSessionTask>(
      `${API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.TASKS(sessionId)}/${taskId}`,
      { status }
    )
  }

  async mockConversationCompletion(sessionId: string, email: string): Promise<ProductFlowSessionTask> {
    return apiClient.post<ProductFlowSessionTask>(
      API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.MOCK_CONVERSATION_COMPLETION(sessionId),
      { email }
    )
  }

  async getTaskMessages(taskId: string, page = 0, pageSize = 50): Promise<TaskMessagePageResponse> {
    return apiClient.get<TaskMessagePageResponse>(
      API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.TASK_MESSAGES(taskId),
      { params: { page, pageSize } }
    )
  }

  async sendTaskMessage(taskId: string, content: string, files?: File[]): Promise<TaskMessage> {
    if (files && files.length > 0) {
      const formData = new FormData()
      formData.append('content', content)
      for (const file of files) {
        formData.append('files', file)
      }
      return apiClient.request<TaskMessage>(
        API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.TASK_MESSAGES(taskId),
        { method: 'POST', data: formData, headers: { 'Content-Type': 'multipart/form-data' } }
      )
    }
    return apiClient.post<TaskMessage>(
      API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.TASK_MESSAGES(taskId),
      { content }
    )
  }

  async getTaskMessageCount(taskId: string): Promise<{ count: number }> {
    return apiClient.get<{ count: number }>(
      API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.TASK_MESSAGE_COUNT(taskId)
    )
  }

  async getTaskMessageAttachmentUrl(taskId: string, mediaId: string): Promise<{ url: string }> {
    return apiClient.get<{ url: string }>(
      API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.TASK_MESSAGE_MEDIA(taskId, mediaId)
    )
  }

  async batchImportParticipants(
    assemblyId: string,
    participants: ParticipantImportItem[],
    upsert: boolean
  ): Promise<BatchParticipantResult> {
    return apiClient.post<BatchParticipantResult>(
      API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.INTEGRATIONS_PARTICIPANT_BATCH(),
      { assemblyId, participants, upsert }
    )
  }

  async getConversation(conversationId: string, _assemblyId?: string): Promise<unknown> {
    return apiClient.get(API_CONFIG.ENDPOINTS.CONVERSATIONS.GET(conversationId))
  }

  async getSessionMessages(sessionId: string, stepIndex?: number, limit?: number): Promise<unknown> {
    const params = new URLSearchParams()
    if (stepIndex !== undefined) params.append('stepIndex', String(stepIndex))
    if (limit !== undefined) params.append('limit', String(limit))
    const qs = params.toString()
    const base = API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.GET_MESSAGES(sessionId)
    const url = qs ? `${base}?${qs}` : base
    return apiClient.get(url)
  }

  async getConsolePublishedTriggers(assemblyId: string, workflowId: string): Promise<WorkflowTriggerItem[]> {
    const res = await apiClient.get<WorkflowTriggerItem[]>(
      API_CONFIG.ENDPOINTS.ORCHESTRATION.CONSOLE_PUBLISHED_TRIGGERS(assemblyId, workflowId)
    )
    return Array.isArray(res) ? res : []
  }

  async kickoffConsoleTrigger(
    assemblyId: string,
    workflowId: string,
    triggerId: string,
    inputs: Record<string, TriggerInputValue>,
    forTesting = false
  ): Promise<TriggerExecutionResponse> {
    let url = API_CONFIG.ENDPOINTS.ORCHESTRATION.CONSOLE_KICKOFF_TRIGGER(assemblyId, workflowId, triggerId)
    if (forTesting) url += '?forTesting=true'
    return apiClient.post<TriggerExecutionResponse>(url, inputs)
  }

  async getMediaForTrigger(triggerId: string, mediaId: string): Promise<string> {
    const res = await apiClient.get<{ url: string }>(
      API_CONFIG.ENDPOINTS.TRIGGER_MEDIA.GET(triggerId, mediaId)
    )
    return res.url
  }

  async uploadMediaForTrigger(
    triggerId: string,
    file: File,
    onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void,
    description?: string,
    name?: string
  ): Promise<MediaFile> {
    const formData = new FormData()
    formData.append('file', file)
    if (description) formData.append('description', description)
    if (name) formData.append('name', name)
    return apiClient.request<MediaFile>(API_CONFIG.ENDPOINTS.TRIGGER_MEDIA.UPLOAD(triggerId), {
      method: 'PUT',
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress
        ? (pe) => {
            if (pe.total) {
              onProgress({
                loaded: pe.loaded,
                total: pe.total,
                percentage: Math.round((pe.loaded * 100) / pe.total),
              })
            }
          }
        : undefined,
    })
  }

  async deleteTriggerMedia(triggerId: string, mediaId: string): Promise<void> {
    await apiClient.delete(API_CONFIG.ENDPOINTS.TRIGGER_MEDIA.DELETE(triggerId, mediaId))
  }

  async getEntitySpec(assemblyId: string, workflowId: string, entitySpecId: string): Promise<EntitySpec> {
    return apiClient.get<EntitySpec>(API_CONFIG.ENDPOINTS.ORCHESTRATION.ENTITY_SPEC(assemblyId, workflowId, entitySpecId))
  }

  async searchEntities(
    assemblyId: string,
    workflowId: string,
    queryBuilder: EntityDocQueryBuilder
  ): Promise<{ results: Entity[]; totalCount: number }> {
    const response = await apiClient.post<{ items: Entity[]; totalCount: number }>(
      API_CONFIG.ENDPOINTS.ORCHESTRATION.ENTITY_SEARCH(assemblyId, workflowId),
      queryBuilder
    )
    const { items: results, totalCount } = filterNullEntities(response.items, response.totalCount)
    return { results, totalCount }
  }

  async getDataViewDetails(assemblyId: string, workflowId: string, dataViewId: string): Promise<DataView> {
    return apiClient.get<DataView>(
      API_CONFIG.ENDPOINTS.ORCHESTRATION.DATA_VIEW_DETAILS(assemblyId, workflowId, dataViewId)
    )
  }

  async searchDataViewData(
    assemblyId: string,
    workflowId: string,
    dataViewId: string,
    queryBuilder: DataViewQuery
  ): Promise<{
    items: Entity[]
    totalCount: number
    page: number
    pageSize: number
    totalPages: number
    sortConfig?: { field: string; fieldType: 'ATTRIBUTE' | 'METADATA' | 'CUSTOM'; order: string }
  }> {
    const response = await apiClient.post<{
      items: (Entity | null)[]
      totalCount: number
      page: number
      pageSize: number
      totalPages: number
      sortConfig?: { field: string; fieldType: 'ATTRIBUTE' | 'METADATA' | 'CUSTOM'; order: string }
    }>(API_CONFIG.ENDPOINTS.ORCHESTRATION.DATA_VIEW_SEARCH_DATA(assemblyId, workflowId, dataViewId), queryBuilder, {
      timeout: API_CONFIG.REQUEST.DATA_VIEW_SEARCH_TIMEOUT,
    })
    const { items, totalCount } = filterNullEntities(response.items, response.totalCount)
    return {
      items,
      totalCount,
      page: response.page || 0,
      pageSize: response.pageSize || 0,
      totalPages: response.totalPages || 0,
      sortConfig: response.sortConfig,
    }
  }

  async enrichSearchDataView(
    assemblyId: string,
    workflowId: string,
    dataViewId: string,
    queryBuilder: DataViewQuery
  ): Promise<{ items: Entity[]; totalCount: number; page: number; pageSize: number; totalPages: number }> {
    type EnrichResp = {
      enrichmentResults?: (Entity | null)[]
      totalCount?: number
      page?: number
      pageSize?: number
      totalPages?: number
    }
    const response = await apiClient.post<EnrichResp>(
      API_CONFIG.ENDPOINTS.ORCHESTRATION.DATA_VIEW_ENRICH_SEARCH(assemblyId, workflowId, dataViewId),
      queryBuilder,
      { timeout: API_CONFIG.REQUEST.DATA_VIEW_SEARCH_TIMEOUT }
    )
    const { items, totalCount } = filterNullEntities(response.enrichmentResults, response.totalCount)
    return {
      items,
      totalCount,
      page: response.page || 0,
      pageSize: response.pageSize || 0,
      totalPages: response.totalPages || 0,
    }
  }

  async typeaheadCities(
    query: string,
    country?: string,
    state?: string
  ): Promise<GeolocationTypeaheadResponse<GeolocationCityResult>> {
    const params: Record<string, string> = { query }
    if (country) params.country = country
    if (state) params.state = state
    return apiClient.get<GeolocationTypeaheadResponse<GeolocationCityResult>>(
      API_CONFIG.ENDPOINTS.ORCHESTRATION.GEO_TYPEAHEAD_CITIES,
      { params }
    )
  }

  async searchProductFlowSessionEvents(
    sessionId: string,
    body?: ProductFlowSessionEventSearchRequest
  ): Promise<{
    items: ProductFlowSessionEvent[]
    totalCount: number
    page: number
    pageSize: number
    totalPages: number
  }> {
    const payload = body ?? {}
    const res = await apiClient.postWithResponse<ProductFlowSessionEvent[]>(
      API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.EVENTS_SEARCH(sessionId),
      payload
    )
    const headers = res.headers as Record<string, string | number | undefined>
    const pickHeader = (keys: string[], fallback: number): number => {
      for (const k of keys) {
        const v = headers[k] ?? headers[k.toLowerCase()]
        if (v !== undefined && v !== null && String(v).trim() !== '') {
          const n = parseInt(String(v), 10)
          if (!Number.isNaN(n)) return n
        }
      }
      return fallback
    }
    const rawItems = res.data
    const itemsList = Array.isArray(rawItems) ? rawItems : []
    const headerTotal = pickHeader(['X-Total-Count', 'x-total-count'], itemsList.length)
    const { items, totalCount } = filterNullEntities(itemsList, headerTotal)
    return {
      items,
      totalCount,
      page: pickHeader(['X-Current-Page', 'x-current-page'], (payload as { page?: number }).page ?? 0),
      pageSize: pickHeader(['X-Page-Size', 'x-page-size'], (payload as { pageSize?: number }).pageSize ?? 20),
      totalPages: pickHeader(['X-Total-Pages', 'x-total-pages'], 0),
    }
  }

  async sendMessageStream(sessionId: string, request: MessageRequest, onEvent: (event: SSEEvent) => void): Promise<void> {
    if (!sessionId) throw new Error('Session ID is required')
    const baseUrl = apiClient.getBaseUrl()
    const endpoint = `${baseUrl}${API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.SEND_MESSAGE(sessionId)}`
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(request),
    })
    if (!response.ok) {
      const error = (await response.json().catch(() => ({ message: 'Failed to send message' }))) as { message?: string }
      throw new Error(error.message || 'Failed to send message')
    }
    if (!response.body) throw new Error('No response body')
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split('\n\n')
        buffer = events.pop() || ''
        for (const eventStr of events) {
          if (eventStr.startsWith('data: ')) {
            const jsonStr = eventStr.slice(6)
            try {
              onEvent(JSON.parse(jsonStr) as SSEEvent)
            } catch {
              // ignore malformed chunk
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  async getConversationSessionById(conversationSessionId: string): Promise<unknown> {
    return apiClient.get(API_CONFIG.ENDPOINTS.CONVERSATION_SESSIONS.GET(conversationSessionId))
  }

  async searchConversationSessions(
    assemblyId: string,
    params: SessionSearchParams
  ): Promise<SessionSearchResponse> {
    if (!assemblyId) throw new Error('assemblyId is required')
    const body = { ...params }
    if (
      !body.sessionID &&
      !body.conversationId &&
      !body.workflowID &&
      !body.assemblyLineID &&
      !body.search &&
      !body.participantIds?.length
    ) {
      body.search = '*'
    }
    return apiClient.post<SessionSearchResponse>(
      API_CONFIG.ENDPOINTS.CONVERSATION_SESSIONS.SEARCH(assemblyId),
      body
    )
  }

  async getConversationRecordingSignedUrl(sessionId: string, mediaPath: string): Promise<string> {
    const res = await apiClient.get<{ url: string }>(
      API_CONFIG.ENDPOINTS.CONVERSATION_SESSIONS.RECORDING_SIGNED_URL(sessionId, mediaPath)
    )
    return res.url
  }

  async getConversationItemMediaUrl(conversationId: string, mediaId: string): Promise<string> {
    const res = await apiClient.get<{ url: string }>(
      API_CONFIG.ENDPOINTS.CONVERSATION_SESSIONS.CONVERSATION_MEDIA(conversationId, mediaId)
    )
    return res.url
  }

  async getParticipantsBatch(participantIds: string[]): Promise<Participant[]> {
    if (!participantIds.length) return []
    return apiClient.post<Participant[]>(API_CONFIG.ENDPOINTS.COMMS_ADMIN.PARTICIPANTS_BATCH, {
      participantIds,
    })
  }

  async getConversationAsTemplate(id: string): Promise<unknown> {
    return apiClient.get(API_CONFIG.ENDPOINTS.CONVERSATIONS.GET_AS_TEMPLATE(id))
  }

  async getConversationTemplateConversations(assemblyId: string, params: Record<string, unknown>): Promise<unknown> {
    return apiClient.post(API_CONFIG.ENDPOINTS.CONVERSATION_TEMPLATES.CONVERSATIONS(assemblyId), params ?? {})
  }

  async createConversationInStep(sessionId: string, stepIndex: number, request: unknown): Promise<unknown> {
    return apiClient.post(API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.CREATE_CONVERSATION(sessionId, stepIndex), request)
  }

  async updateConversationInStep(sessionId: string, stepIndex: number, request: unknown): Promise<unknown> {
    return apiClient.put(API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.UPDATE_CONVERSATION(sessionId, stepIndex), request)
  }

  async getEmailOutreachInStep(sessionId: string, stepIndex: number): Promise<unknown> {
    return apiClient.get(API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.GET_EMAIL_OUTREACH(sessionId, stepIndex))
  }

  async updateEmailOutreachInStep(sessionId: string, stepIndex: number, request: unknown): Promise<unknown> {
    return apiClient.put(API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.UPDATE_EMAIL_OUTREACH(sessionId, stepIndex), request)
  }

  async sendEmailOutreachInStep(sessionId: string, stepIndex: number, request?: unknown): Promise<unknown> {
    return apiClient.post(
      API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.SEND_EMAIL_OUTREACH(sessionId, stepIndex),
      request ?? {}
    )
  }

  async addFollowUpInStep(sessionId: string, stepIndex: number, request?: unknown): Promise<unknown> {
    return apiClient.post(
      API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.ADD_FOLLOW_UP(sessionId, stepIndex),
      request ?? {}
    )
  }

  async searchTeamMembers(assemblyId: string, request: Record<string, unknown>): Promise<unknown> {
    const formData = new URLSearchParams()
    const search = request.search
    if (typeof search === 'string' && search.length > 0) formData.append('search', search)
    const page = request.page
    if (typeof page === 'number') formData.append('page', String(page))
    const pageSize = request.pageSize
    if (typeof pageSize === 'number') formData.append('pageSize', String(pageSize))

    return apiClient.post(API_CONFIG.ENDPOINTS.ASSIGNMENT.TEAM_MEMBERS_SEARCH(assemblyId), formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  }

  // --- Participants ---

  async searchParticipantsDirectory(assemblyId: string, params: ParticipantSearchRequest): Promise<ParticipantSearchPageResponse> {
    return apiClient.post<ParticipantSearchPageResponse>(
      API_CONFIG.ENDPOINTS.PARTICIPANTS.SEARCH(assemblyId),
      params ?? {}
    )
  }

  async createParticipantForAssembly(assemblyId: string, body: Participant): Promise<Participant> {
    return apiClient.post<Participant>(
      API_CONFIG.ENDPOINTS.PARTICIPANTS.CREATE(assemblyId),
      body
    )
  }

  async updateParticipantForAssembly(assemblyId: string, participantId: string, body: Participant): Promise<Participant> {
    return apiClient.put<Participant>(
      API_CONFIG.ENDPOINTS.PARTICIPANTS.UPDATE(assemblyId, participantId),
      body
    )
  }

  // --- Integration Connections ---

  async listIntegrationConnections(assemblyId: string): Promise<IntegrationConnection[]> {
    return apiClient.get<IntegrationConnection[]>(
      API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.INTEGRATIONS_CONNECTIONS() + `?assemblyId=${encodeURIComponent(assemblyId)}`
    )
  }

  async createSftpConnection(body: SftpConnectionRequest): Promise<IntegrationConnection> {
    return apiClient.post<IntegrationConnection>(
      API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.INTEGRATIONS_CONNECTIONS(),
      body
    )
  }

  async deleteIntegrationConnection(connectionId: string): Promise<void> {
    return apiClient.delete(
      API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.INTEGRATIONS_CONNECTION(connectionId)
    )
  }

  async toggleAutoSync(connectionId: string, enabled: boolean): Promise<IntegrationConnection> {
    return apiClient.put<IntegrationConnection>(
      API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.INTEGRATIONS_CONNECTION_AUTO_SYNC(connectionId),
      { enabled }
    )
  }

  async updateConnectionTarget(connectionId: string, targetFolderPath: string, displayName?: string): Promise<IntegrationConnection> {
    return apiClient.patch<IntegrationConnection>(
      API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.INTEGRATIONS_CONNECTION_TARGET(connectionId),
      { targetFolderPath, displayName }
    )
  }

  async listGoogleDriveFolders(connectionId: string, parentId?: string): Promise<FolderEntry[]> {
    const url = API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.INTEGRATIONS_GOOGLE_FOLDERS(connectionId)
      + (parentId ? `?parentId=${encodeURIComponent(parentId)}` : '')
    return apiClient.get<FolderEntry[]>(url)
  }

  async createGoogleDriveFolder(
    connectionId: string,
    name: string,
    parentId?: string,
  ): Promise<FolderEntry> {
    return apiClient.post<FolderEntry>(
      API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.INTEGRATIONS_GOOGLE_FOLDER_CREATE(connectionId),
      { name, parentId: parentId ?? 'root' },
    )
  }

  async listSharePointDrives(connectionId: string): Promise<FolderEntry[]> {
    return apiClient.get<FolderEntry[]>(
      API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.INTEGRATIONS_SHAREPOINT_DRIVES(connectionId)
    )
  }

  async listSharePointFolders(connectionId: string, driveId: string, parentItemId?: string): Promise<FolderEntry[]> {
    let url = API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.INTEGRATIONS_SHAREPOINT_FOLDERS(connectionId)
      + `?driveId=${encodeURIComponent(driveId)}`
    if (parentItemId) {
      url += `&parentItemId=${encodeURIComponent(parentItemId)}`
    }
    return apiClient.get<FolderEntry[]>(url)
  }

  async getGoogleOAuthUrl(assemblyId: string): Promise<{ authorizationUrl: string }> {
    return apiClient.get<{ authorizationUrl: string }>(
      API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.INTEGRATIONS_GOOGLE_AUTHORIZE() + `?assemblyId=${encodeURIComponent(assemblyId)}`
    )
  }

  async getSharePointOAuthUrl(assemblyId: string): Promise<{ authorizationUrl: string }> {
    return apiClient.get<{ authorizationUrl: string }>(
      API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.INTEGRATIONS_SHAREPOINT_AUTHORIZE() + `?assemblyId=${encodeURIComponent(assemblyId)}`
    )
  }

  // --- Export Jobs ---

  async triggerExport(body: ExportRequest): Promise<ExportJob> {
    return apiClient.post<ExportJob>(
      API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.INTEGRATIONS_EXPORT(),
      body
    )
  }

  async getExportJobStatus(jobId: string, assemblyId?: string): Promise<ExportJob> {
    const params = assemblyId ? `?assemblyId=${encodeURIComponent(assemblyId)}` : ''
    return apiClient.get<ExportJob>(
      API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.INTEGRATIONS_EXPORT_JOB(jobId) + params
    )
  }

  async retryExportJob(jobId: string, assemblyId: string): Promise<ExportJob> {
    return apiClient.post<ExportJob>(
      API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.INTEGRATIONS_EXPORT_JOB_RETRY(jobId)
        + `?assemblyId=${encodeURIComponent(assemblyId)}`,
      {},
    )
  }

  async listExportHistory(assemblyId: string, page = 0, pageSize = 20): Promise<ExportJob[]> {
    return apiClient.get<ExportJob[]>(
      API_CONFIG.ENDPOINTS.PRODUCT_FLOW_SESSIONS.INTEGRATIONS_EXPORT_HISTORY() + `?assemblyId=${encodeURIComponent(assemblyId)}&page=${page}&pageSize=${pageSize}`
    )
  }
}

/** Real backend — not used in comms-app-demo (see comms-api.ts). */
export const liveCommsAPI = new LiveCommsAPI()
