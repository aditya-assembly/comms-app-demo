/**
 * Fully offline mock API for comms-app-demo — no network calls.
 */
import { LiveCommsAPI } from './comms-api-live'
import {
  AGILEONE_SUPPLIER_TEMPLATES,
  DEMO_ASSEMBLY_ID,
  DEMO_PRODUCT_FLOW_ID,
  DEMO_TEAM_MEMBER_ID,
  DEMO_WORKFLOW_ID,
  findSupplierTemplateById,
  demoApiSessions,
  demoConversationSessions,
  demoOrchestrationSessions,
  demoParticipants,
  getDispatcherMessages,
  pushDispatcherMessages,
  upsertSession,
} from '@/demo/mock-store'
import type {
  BatchParticipantResult,
  CommsAppInfo,
  DispatcherAgentMessage,
  DispatcherAgentMessageRequest,
  DispatcherAgentSession,
  ExportJob,
  IntegrationConnection,
  Participant,
  ParticipantImportItem,
  ParticipantSearchPageResponse,
  ParticipantSearchRequest,
  ProductFlowSession,
  ProductFlowSessionSearchRequest,
  ProductFlowSessionSearchResponse,
  ProductFlowSessionTask,
  ProductFlowSessionTaskPageResponse,
  ProductFlowSessionTaskStatsResponse,
  SSOResponse,
  TaskMessage,
  TaskMessagePageResponse,
} from '@/types/api'
import type {
  ConversationSession,
  CreateSessionRequest,
  CreateSessionResponse,
  DataView,
  DataViewQuery,
  Entity,
  EntityDocQueryBuilder,
  EntitySpec,
  GeolocationCityResult,
  GeolocationTypeaheadResponse,
  MediaFile,
  MessageRequest,
  ProductFlow,
  ProductFlowSessionEvent,
  ProductFlowSessionEventSearchRequest,
  ProductFlowSessionMessage,
  SessionSearchParams,
  SessionSearchResponse,
  SSEEvent,
  ProductFlowSession as OrchProductFlowSession,
  InformationFlowStep,
  StepResponse,
} from '@/types/orchestration-dashboard-types'
import type { ProductFlowSessionTaskStatsResponse as ApiTaskStats } from '@/types/api'

const DEMO_INFO: CommsAppInfo = {
  teamMemberID: DEMO_TEAM_MEMBER_ID,
  name: 'Alex Morgan (SPE Demo)',
  email: 'spe.demo@assembly.example',
  organizationID: 'org-agileone-demo',
  primaryTeam: 'Supplier Partner Enablement',
  ownedAssemblyLines: [
    {
      assemblyLineID: DEMO_ASSEMBLY_ID,
      name: 'AgileOne — MSP Programs',
      description: 'Domestic supplier / contractor onboarding (demo)',
      workflows: [{ id: DEMO_WORKFLOW_ID, name: 'Supplier onboarding' }],
    },
  ],
}

function filterSessions(req: ProductFlowSessionSearchRequest): ProductFlowSession[] {
  let list = demoApiSessions.filter((s) => !req.assemblyId || s.assemblyId === req.assemblyId)
  if (req.status) list = list.filter((s) => s.status === req.status)
  if (req.search?.trim()) {
    const q = req.search.toLowerCase()
    list = list.filter((s) => s.name?.toLowerCase().includes(q) || s.id.toLowerCase().includes(q))
  }
  return list
}

function buildInformationStep(): InformationFlowStep {
  return {
    type: 'INFORMATION',
    name: 'AgileOne supplier onboarding (preview)',
    description: 'Guided session: documents validate before SPE review.',
    content:
      '## What suppliers complete\n\n' +
      '- **COI** — auto-validation (limits, named insured, expiry)\n' +
      '- **W-9** — OCR for EIN / legal name vs profile\n' +
      '- **MSA** — DocuSign track / collect\n' +
      '- **ACH / banking**\n' +
      '- **Capability profile** + **conditional addenda** by program\n\n' +
      '## Reminders\n\nDay **3** and **7**; escalate to owning SPE after the **2nd** no-response.',
  }
}

function buildStepResponse(sessionId: string): StepResponse {
  const orch = demoOrchestrationSessions.get(sessionId)
  const stepIndex = orch?.currentStepIndex ?? 0
  const step = buildInformationStep()
  const stepSession = orch?.stepSessions?.find((s) => s.stepIndex === stepIndex)
  const totalSteps = 5
  return {
    stepIndex,
    step,
    stepSession,
    progress: {
      current: stepIndex + 1,
      total: totalSteps,
      percentage: Math.round(((stepIndex + 1) / totalSteps) * 100),
    },
    transition: {
      willAutoAdvance: false,
      requiresManualAdvance: true,
      hasNextStep: stepIndex < totalSteps - 1,
    },
    canStart: false,
    canComplete: true,
    canMoveToNext: stepIndex < totalSteps - 1,
    sessionStatus: orch?.status === 'COMPLETED' ? 'COMPLETED' : 'ACTIVE',
  }
}

function demoAssistantReply(userText: string): string {
  const t = userText.toLowerCase()
  if (t.includes('coi') && (t.includes('30') || t.includes('expir'))) {
    return '**Recertification queue (demo):** 4 suppliers have a COI expiring within 30 days — Novus, Harbor Ridge, Summit, and Apex. I can add them to a renewal dispatch batch when you are ready.'
  }
  if (t.includes('msa') || t.includes('esign')) {
    return '**Stuck at MSA e-sign (demo):** 2 suppliers — **Novus Staffing** and **Apex Industrial** — are waiting on executed MSA. I can send a targeted nudge with the signing link.'
  }
  if (t.includes('healthcare') || t.includes('general staffing')) {
    return '**Program comparison (demo):** Average time to SPE approval — **Healthcare**: 4.2 days vs **General Staffing**: 3.1 days this quarter. Bottleneck for Healthcare is addenda completeness.'
  }
  if (t.includes('california') || t.includes('addenda')) {
    return '**California addenda (demo):** 1 supplier (**Harbor Ridge**) is missing the state-specific addendum for CA operations; the session is holding on that item.'
  }
  if (t.includes('sharepoint') || (t.includes('file') && t.includes('folder'))) {
    return '**SharePoint filing (demo):** On approval, artifacts route to `/Programs/AgileOne/{supplier_onboarding_id}/` with COI, W-9, executed MSA, and ACH packet — same structure production would use.'
  }
  if (t.includes('venda') || t.includes('portal') || t.includes('ach')) {
    return '**Venda / downstream (demo):** When SPE marks **Approved**, a Venda setup request is queued automatically (supplier profile + payment terms handoff).'
  }
  if (t.includes('exception') || t.includes('red-line') || t.includes('variance')) {
    return '**Exceptions path (demo):** If a supplier cannot meet a standard requirement, the session can branch to an **exceptions amendment** document without editing the base MSA.'
  }
  if (t.includes('escalat') || t.includes('remind') || t.includes('no response')) {
    return '**Escalation (demo):** After the **2nd** reminder with no supplier response, the owning SPE gets a digest with attempt history, last session state, and days elapsed.'
  }
  if (t.includes('coi') && (t.includes('fail') || t.includes('minimum') || t.includes('500'))) {
    return '**COI validation (demo):** Example supplier feedback: *“Your COI shows $500K general liability. This program requires $1M. Please upload an updated certificate.”* — no SPE touch until corrected.'
  }
  return (
    'In the full product, I would orchestrate invites, validate documents, and route exceptions. ' +
    'Here in **demo mode**, open **Program dashboard** for pipeline & TAT, or **Sessions** to inspect each supplier run.'
  )
}

export class MockCommsAPI {
  async generateOTP(_email: string): Promise<{ message: string }> {
    return { message: 'Demo mode — OTP not sent.' }
  }

  async loginWithOTP(_email: string, _code: string): Promise<{ message: string }> {
    return { message: 'Demo mode.' }
  }

  async logout(): Promise<void> {}

  async getSSOAuthorizeUrl(_params: {
    provider: string
    state: string
    redirectUri: string
    email?: string
    domain?: string
  }): Promise<string> {
    return 'about:blank'
  }

  async completeSSOLogin(_params: { code: string; state: string; redirectUri: string }): Promise<SSOResponse> {
    return { email: DEMO_INFO.email } as SSOResponse
  }

  async getCommsAppInfo(): Promise<CommsAppInfo> {
    return DEMO_INFO
  }

  async getDispatcherAgentSession(assemblyId: string): Promise<DispatcherAgentSession> {
    return {
      id: `das-${assemblyId}`,
      assemblyId,
      teamMemberId: DEMO_TEAM_MEMBER_ID,
      messages: getDispatcherMessages(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
  }

  async postDispatcherAgentMessage(
    assemblyId: string,
    request: DispatcherAgentMessageRequest,
  ): Promise<DispatcherAgentSession> {
    const userMsg: DispatcherAgentMessage = {
      role: 'USER',
      content: request.message,
      createdAt: Date.now(),
    }
    const reply: DispatcherAgentMessage = {
      role: 'ASSISTANT',
      content: demoAssistantReply(request.message),
      createdAt: Date.now() + 1,
    }
    pushDispatcherMessages([userMsg, reply])
    return this.getDispatcherAgentSession(assemblyId)
  }

  async getProductFlowsByAssembly(assemblyId: string): Promise<ProductFlow[]> {
    if (assemblyId !== DEMO_ASSEMBLY_ID) return []
    return [...AGILEONE_SUPPLIER_TEMPLATES]
  }

  async getProductFlowById(_assemblyId: string, _workflowId: string, productFlowId: string): Promise<ProductFlow> {
    return findSupplierTemplateById(productFlowId) ?? AGILEONE_SUPPLIER_TEMPLATES[0]
  }

  async createProductFlowSession(request: CreateSessionRequest): Promise<CreateSessionResponse> {
    const id = `pfs-demo-${Date.now()}`
    const created = Date.now()
    const orch: OrchProductFlowSession = {
      id,
      productFlowId: request.productFlowId,
      name: request.note ?? 'New supplier onboarding session',
      userQuery: request.userQuery ?? null,
      teamMemberId: DEMO_TEAM_MEMBER_ID,
      assemblyId: request.assemblyId,
      workflowId: request.workflowId ?? DEMO_WORKFLOW_ID,
      currentStepIndex: 0,
      status: 'ACTIVE',
      createdAt: created,
      updatedAt: created,
      stepSessions: [],
      messages: [],
    }
    demoOrchestrationSessions.set(id, orch)
    const apiS: ProductFlowSession = {
      id,
      name: orch.name,
      userQuery: request.userQuery ?? undefined,
      productFlowId: request.productFlowId,
      teamMemberId: DEMO_TEAM_MEMBER_ID,
      assemblyId: request.assemblyId,
      workflowId: orch.workflowId,
      status: 'ACTIVE',
      currentStepIndex: 0,
      createdAt: created,
      updatedAt: created,
    }
    upsertSession(apiS)
    return {
      session: apiS as unknown as OrchProductFlowSession,
      currentStep: buildStepResponse(id),
    }
  }

  async searchProductFlowSessions(request: ProductFlowSessionSearchRequest): Promise<ProductFlowSessionSearchResponse> {
    const list = filterSessions(request)
    const page = request.page ?? 0
    const pageSize = request.pageSize ?? 50
    const slice = list.slice(page * pageSize, page * pageSize + pageSize)
    return {
      sessions: slice,
      page,
      pageSize,
      totalCount: list.length,
      totalPages: Math.max(1, Math.ceil(list.length / pageSize)),
    }
  }

  async getProductFlowSession(sessionId: string): Promise<ProductFlowSession> {
    const orch = demoOrchestrationSessions.get(sessionId)
    if (orch) return orch as unknown as ProductFlowSession
    const row = demoApiSessions.find((s) => s.id === sessionId)
    if (row) return row
    throw new Error('Session not found (demo)')
  }

  async getProductFlowSessionCurrentStep(sessionId: string): Promise<unknown> {
    return buildStepResponse(sessionId)
  }

  async sendProductFlowSessionMessage(): Promise<unknown> {
    return {}
  }

  async sendProductFlowSessionMessageSync(): Promise<unknown> {
    return {}
  }

  async nextStep(sessionId: string): Promise<unknown> {
    const orch = demoOrchestrationSessions.get(sessionId)
    if (orch && orch.currentStepIndex < 4) {
      orch.currentStepIndex += 1
      orch.updatedAt = Date.now()
    }
    return { currentStep: buildStepResponse(sessionId) }
  }

  async startStep(): Promise<unknown> {
    return {}
  }

  async completeStep(): Promise<unknown> {
    return {}
  }

  async runAutomation(): Promise<unknown> {
    return {}
  }

  async acknowledgeStep(sessionId: string, stepIndex: number): Promise<ProductFlowSession> {
    return this.getProductFlowSession(sessionId)
  }

  async retryStep(sessionId: string): Promise<ProductFlowSession> {
    return this.getProductFlowSession(sessionId)
  }

  async bootstrapStep(): Promise<unknown> {
    return {}
  }

  async getStepUpdates(): Promise<unknown> {
    return []
  }

  async sendStepUpdate(): Promise<unknown> {
    return {}
  }

  async addSessionUpdate(): Promise<unknown> {
    return {}
  }

  async createConversation(): Promise<unknown> {
    return {}
  }

  async updateConversation(): Promise<unknown> {
    return {}
  }

  async deleteConversation(): Promise<unknown> {
    return {}
  }

  async createEmailOutreach(): Promise<unknown> {
    return {}
  }

  async getEmailOutreach(): Promise<unknown> {
    return {}
  }

  async updateEmailOutreach(): Promise<unknown> {
    return {}
  }

  async sendEmailOutreach(): Promise<unknown> {
    return {}
  }

  async addFollowUp(): Promise<unknown> {
    return {}
  }

  async deleteEmailOutreach(): Promise<unknown> {
    return {}
  }

  async removeSessionResult(): Promise<unknown> {
    return {}
  }

  async getConversationSession(): Promise<unknown> {
    return {}
  }

  async getConversationSessionForProductFlowSession(): Promise<unknown> {
    return {}
  }

  async searchSessionEvents(): Promise<unknown> {
    return { items: [], totalCount: 0 }
  }

  async closeSession(sessionId: string): Promise<ProductFlowSession> {
    const s = await this.getProductFlowSession(sessionId)
    return { ...s, status: 'CLOSED' }
  }

  async reenterStep(): Promise<unknown> {
    return {}
  }

  async getSessionTaskStats(_sessionId: string): Promise<ProductFlowSessionTaskStatsResponse> {
    const z: ApiTaskStats = { total: 0, open: 0, completed: 0, failed: 0, cancelled: 0 }
    return z
  }

  async resolveConversationSessionParticipants(
    _sessionId: string,
    conversationSessionIds: string[],
  ): Promise<import('@/types/api').ConversationSessionParticipantsResolveResponse> {
    const by: Record<string, import('@/types/api').ParticipantSummaryResponse[]> = {}
    for (const id of conversationSessionIds) {
      by[id] = [{ displayName: 'Demo participant', email: 'supplier@example.com' }]
    }
    return { byConversationSessionId: by }
  }

  async getSessionTasks(sessionId: string): Promise<ProductFlowSessionTaskPageResponse> {
    return {
      items: [],
      totalCount: 0,
      page: 0,
      pageSize: 20,
      totalPages: 0,
    }
  }

  async resolveTask(
    _sessionId: string,
    _taskId: string,
    _status: 'COMPLETED' | 'FAILED' | 'CANCELLED',
  ): Promise<ProductFlowSessionTask> {
    return {
      id: 'task-demo',
      productFlowSessionId: 'pfs-novus-001',
      taskType: 'EMAIL_RECIPIENT',
      status: 'COMPLETED',
    }
  }

  async mockConversationCompletion(): Promise<ProductFlowSessionTask> {
    return this.resolveTask('pfs-novus-001', 'task-demo', 'COMPLETED')
  }

  async getTaskMessages(): Promise<TaskMessagePageResponse> {
    return { items: [], totalCount: 0, page: 0, pageSize: 20, totalPages: 0 }
  }

  async sendTaskMessage(taskId: string, content: string): Promise<TaskMessage> {
    return {
      id: `tm-${Date.now()}`,
      taskId,
      role: 'MANAGER',
      content,
      channel: 'APP',
      createdAt: Date.now(),
    }
  }

  async getTaskMessageCount(): Promise<{ count: number }> {
    return { count: 0 }
  }

  async getTaskMessageAttachmentUrl(): Promise<{ url: string }> {
    return { url: 'about:blank' }
  }

  async batchImportParticipants(
    _assemblyId: string,
    participants: ParticipantImportItem[],
    _upsert: boolean,
  ): Promise<BatchParticipantResult> {
    return {
      created: [],
      updated: [],
      conflicts: [],
      errors: [],
    }
  }

  async getConversation(): Promise<unknown> {
    return {}
  }

  async getSessionMessages(sessionId: string): Promise<unknown> {
    const now = Date.now()
    const list: ProductFlowSessionMessage[] = [
      {
        id: `${sessionId}-m1`,
        productFlowSessionId: sessionId,
        role: 'ASSISTANT',
        content:
          'Your AgileOne onboarding session is ready. Upload your **COI** first — we validate coverage and named insured against program minimums before SPE sees it.',
        authorId: 'assistant',
        createdAt: now - 120_000,
      },
      {
        id: `${sessionId}-m2`,
        productFlowSessionId: sessionId,
        role: 'USER',
        content: 'Uploaded COI — $1M GL, AgileOne named as certificate holder.',
        authorId: 'supplier',
        createdAt: now - 60_000,
      },
    ]
    return list
  }

  async getConsolePublishedTriggers(): Promise<import('@/types/orchestration-dashboard-types').WorkflowTriggerItem[]> {
    return []
  }

  async kickoffConsoleTrigger(): Promise<import('@/types/orchestration-dashboard-types').TriggerExecutionResponse> {
    return {} as import('@/types/orchestration-dashboard-types').TriggerExecutionResponse
  }

  async getMediaForTrigger(): Promise<string> {
    return 'about:blank'
  }

  async uploadMediaForTrigger(
    _triggerId: string,
    file: File,
    _onProgress?: (p: { loaded: number; total: number; percentage: number }) => void,
    description?: string,
    name?: string,
  ): Promise<MediaFile> {
    return {
      id: `media-${file.name}`,
      name: name ?? file.name,
      description,
    } as MediaFile
  }

  async deleteTriggerMedia(): Promise<void> {}

  async getEntitySpec(): Promise<EntitySpec> {
    return {} as EntitySpec
  }

  async searchEntities(): Promise<{ results: Entity[]; totalCount: number }> {
    return { results: [], totalCount: 0 }
  }

  async getDataViewDetails(): Promise<DataView> {
    return {} as DataView
  }

  async searchDataViewData(
    _assemblyId: string,
    _workflowId: string,
    _dataViewId: string,
    queryBuilder: DataViewQuery,
  ): Promise<{
    items: Entity[]
    totalCount: number
    page: number
    pageSize: number
    totalPages: number
    sortConfig?: { field: string; fieldType: 'ATTRIBUTE' | 'METADATA' | 'CUSTOM'; order: string }
  }> {
    return {
      items: [],
      totalCount: 0,
      page: queryBuilder.page ?? 0,
      pageSize: queryBuilder.pageSize ?? 20,
      totalPages: 0,
    }
  }

  async enrichSearchDataView(): Promise<{
    items: Entity[]
    totalCount: number
    page: number
    pageSize: number
    totalPages: number
  }> {
    return { items: [], totalCount: 0, page: 0, pageSize: 20, totalPages: 0 }
  }

  async typeaheadCities(_query: string): Promise<GeolocationTypeaheadResponse<GeolocationCityResult>> {
    return { results: [], total: 0, page: 0, pageSize: 20 }
  }

  async searchProductFlowSessionEvents(
    _sessionId: string,
    body?: ProductFlowSessionEventSearchRequest,
  ): Promise<{
    items: ProductFlowSessionEvent[]
    totalCount: number
    page: number
    pageSize: number
    totalPages: number
  }> {
    const page = (body as { page?: number } | undefined)?.page ?? 0
    const pageSize = (body as { pageSize?: number } | undefined)?.pageSize ?? 20
    return { items: [], totalCount: 0, page, pageSize, totalPages: 0 }
  }

  async sendMessageStream(
    sessionId: string,
    request: MessageRequest,
    onEvent: (event: SSEEvent) => void,
  ): Promise<void> {
    const text =
      `**Demo mode:** Simulated assistant response for session \`${sessionId}\`.\n\n` +
      `You said: _${request.message}_\n\n` +
      'In production, streamed tokens would update supplier state, validation, and tasks here.'
    const parts = text.split(' ')
    for (let i = 0; i < parts.length; i++) {
      onEvent({ type: 'token', data: { content: (i > 0 ? ' ' : '') + parts[i] } })
      await new Promise((r) => setTimeout(r, 12))
    }
    onEvent({ type: 'done', data: null })
  }

  async getConversationSessionById(conversationSessionId: string): Promise<unknown> {
    const row = demoConversationSessions.find((c) => c.id === conversationSessionId)
    return row ?? { id: conversationSessionId, type: 'VIDEO_CALL', conversationId: 'demo', messages: [], participants: [] }
  }

  async searchConversationSessions(
    assemblyId: string,
    _params: SessionSearchParams,
  ): Promise<SessionSearchResponse> {
    const rows = demoConversationSessions.filter((c) => c.assemblyLineID === assemblyId || assemblyId === DEMO_ASSEMBLY_ID)
    return {
      sessions: rows as unknown as ConversationSession[],
      totalCount: rows.length,
      page: 0,
      pageSize: 20,
      totalPages: 1,
    }
  }

  async getConversationRecordingSignedUrl(): Promise<string> {
    return 'about:blank'
  }

  async getConversationItemMediaUrl(): Promise<string> {
    return 'about:blank'
  }

  async getParticipantsBatch(ids: string[]): Promise<Participant[]> {
    return demoParticipants.filter((p) => ids.includes(p.id))
  }

  async getConversationAsTemplate(): Promise<unknown> {
    return {}
  }

  async getConversationTemplateConversations(): Promise<unknown> {
    return { items: [], totalCount: 0 }
  }

  async createConversationInStep(): Promise<unknown> {
    return {}
  }

  async updateConversationInStep(): Promise<unknown> {
    return {}
  }

  async getEmailOutreachInStep(): Promise<unknown> {
    return {}
  }

  async updateEmailOutreachInStep(): Promise<unknown> {
    return {}
  }

  async sendEmailOutreachInStep(): Promise<unknown> {
    return {}
  }

  async addFollowUpInStep(): Promise<unknown> {
    return {}
  }

  async searchTeamMembers(): Promise<unknown> {
    return { items: [], total: 0 }
  }

  async searchParticipantsDirectory(
    assemblyId: string,
    params: ParticipantSearchRequest,
  ): Promise<ParticipantSearchPageResponse> {
    let items = demoParticipants.filter((p) => p.domainOwnerId === assemblyId || assemblyId === DEMO_ASSEMBLY_ID)
    if (params.search?.trim()) {
      const q = params.search.toLowerCase()
      items = items.filter(
        (p) =>
          p.email?.toLowerCase().includes(q) ||
          p.company?.toLowerCase().includes(q) ||
          `${p.firstName ?? ''} ${p.lastName ?? ''}`.toLowerCase().includes(q),
      )
    }
    const page = params.page ?? 0
    const pageSize = params.pageSize ?? 25
    const slice = items.slice(page * pageSize, page * pageSize + pageSize)
    return { items: slice, total: items.length, page, pageSize }
  }

  async createParticipantForAssembly(assemblyId: string, body: Participant): Promise<Participant> {
    return {
      ...body,
      id: body.id || `part-${Date.now()}`,
      domainOwner: 'ASSEMBLY_LINE',
      domainOwnerId: assemblyId,
      email: (body.email ?? '').toLowerCase(),
    }
  }

  async updateParticipantForAssembly(_assemblyId: string, _participantId: string, body: Participant): Promise<Participant> {
    return body
  }

  async listIntegrationConnections(assemblyId: string): Promise<IntegrationConnection[]> {
    const t = Date.now()
    return [
      {
        id: 'conn-sp-demo',
        assemblyId,
        providerType: 'SHAREPOINT',
        status: 'CONNECTED',
        displayName: 'SharePoint — AgileOne program library (demo)',
        connectedByTeamMemberId: DEMO_TEAM_MEMBER_ID,
        autoSyncEnabled: true,
        targetFolderPath: '/AgileOne/Suppliers',
        createdAt: t,
        updatedAt: t,
      },
    ]
  }

  async createSftpConnection(body: import('@/types/api').SftpConnectionRequest): Promise<IntegrationConnection> {
    const t = Date.now()
    return {
      id: 'sftp-demo',
      assemblyId: body.assemblyId ?? DEMO_ASSEMBLY_ID,
      providerType: 'SFTP',
      status: 'CONNECTED',
      displayName: body.host ?? 'sftp',
      connectedByTeamMemberId: DEMO_TEAM_MEMBER_ID,
      autoSyncEnabled: false,
      createdAt: t,
      updatedAt: t,
    }
  }

  async deleteIntegrationConnection(): Promise<void> {}

  async toggleAutoSync(id: string, enabled: boolean): Promise<IntegrationConnection> {
    const t = Date.now()
    return {
      id,
      assemblyId: DEMO_ASSEMBLY_ID,
      providerType: 'SHAREPOINT',
      status: 'CONNECTED',
      displayName: 'SharePoint',
      connectedByTeamMemberId: DEMO_TEAM_MEMBER_ID,
      autoSyncEnabled: enabled,
      createdAt: t,
      updatedAt: t,
    }
  }

  async updateConnectionTarget(id: string): Promise<IntegrationConnection> {
    const t = Date.now()
    return {
      id,
      assemblyId: DEMO_ASSEMBLY_ID,
      providerType: 'GOOGLE_DRIVE',
      status: 'CONNECTED',
      displayName: 'Drive',
      connectedByTeamMemberId: DEMO_TEAM_MEMBER_ID,
      autoSyncEnabled: false,
      createdAt: t,
      updatedAt: t,
    }
  }

  async listGoogleDriveFolders(): Promise<import('@/types/api').FolderEntry[]> {
    return []
  }

  async createGoogleDriveFolder(): Promise<import('@/types/api').FolderEntry> {
    return { id: 'f1', name: 'Demo' }
  }

  async listSharePointDrives(): Promise<import('@/types/api').FolderEntry[]> {
    return [{ id: 'drive-demo', name: 'AgileOne — Suppliers' }]
  }

  async listSharePointFolders(): Promise<import('@/types/api').FolderEntry[]> {
    return []
  }

  async getGoogleOAuthUrl(): Promise<{ authorizationUrl: string }> {
    return { authorizationUrl: 'about:blank' }
  }

  async getSharePointOAuthUrl(): Promise<{ authorizationUrl: string }> {
    return { authorizationUrl: 'about:blank' }
  }

  async triggerExport(): Promise<ExportJob> {
    return {} as ExportJob
  }

  async getExportJobStatus(jobId: string): Promise<ExportJob> {
    return { id: jobId } as ExportJob
  }

  async retryExportJob(jobId: string): Promise<ExportJob> {
    return { id: jobId } as ExportJob
  }

  async listExportHistory(): Promise<ExportJob[]> {
    return []
  }
}

export const commsAPI = new MockCommsAPI() as unknown as LiveCommsAPI
