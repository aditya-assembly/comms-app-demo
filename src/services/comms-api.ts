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
  syncApiSessionFromOrch,
  upsertSession,
} from '@/demo/mock-store'
import { getDemoConversationTemplate } from '@/demo/demo-conversation-templates'
import { getDemoTriggersForWorkflow } from '@/demo/demo-workflow-triggers'
import {
  buildMockStepResponse,
  getProductFlowForSession,
  reconcileProductFlowStepSessions,
} from '@/demo/flow-orchestration-mock'
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
  TriggerInputValue,
} from '@/types/api'
import type {
  BootstrapRequest,
  CompleteStepResponse,
  Conversation,
  ConversationSession,
  CreateSessionRequest,
  CreateSessionResponse,
  DataView,
  DataViewQuery,
  EmailOutreach,
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
  RunAutomationRequest,
  SessionSearchParams,
  SessionSearchResponse,
  SSEEvent,
  ProductFlowSession as OrchProductFlowSession,
  StepResponse,
  TriggerExecutionResponse,
  WorkflowTriggerItem,
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

const demoConversationsById = new Map<string, Conversation>()
const demoEmailOutreachByStepKey = new Map<string, EmailOutreach>()

function sessionStepKey(sessionId: string, stepIndex: number): string {
  return `${sessionId}:${stepIndex}`
}

function getOrEnsureOrch(sessionId: string): OrchProductFlowSession {
  let orch = demoOrchestrationSessions.get(sessionId)
  if (orch) {
    reconcileProductFlowStepSessions(orch)
    return orch
  }
  const row = demoApiSessions.find((s) => s.id === sessionId)
  if (!row) throw new Error('Session not found (demo)')
  const o: OrchProductFlowSession = {
    id: row.id,
    productFlowId: row.productFlowId ?? DEMO_PRODUCT_FLOW_ID,
    name: row.name,
    userQuery: row.userQuery ?? null,
    teamMemberId: row.teamMemberId ?? DEMO_TEAM_MEMBER_ID,
    assemblyId: row.assemblyId ?? DEMO_ASSEMBLY_ID,
    workflowId: row.workflowId ?? DEMO_WORKFLOW_ID,
    currentStepIndex: row.currentStepIndex ?? 0,
    status: row.status === 'COMPLETED' ? 'COMPLETED' : 'ACTIVE',
    createdAt: row.createdAt ?? Date.now(),
    updatedAt: row.updatedAt ?? Date.now(),
    stepSessions: [],
    messages: [],
    metadata: row.metadata as Record<string, string> | undefined,
  }
  reconcileProductFlowStepSessions(o)
  demoOrchestrationSessions.set(sessionId, o)
  syncApiSessionFromOrch(o)
  return o
}

function buildStepResponse(sessionId: string): StepResponse {
  return buildMockStepResponse(getOrEnsureOrch(sessionId))
}

function demoAssistantReply(userText: string): string {
  const t = userText.toLowerCase()
  const first = AGILEONE_SUPPLIER_TEMPLATES[0]
  if (
    t.includes('template') ||
    t.includes('recommend') ||
    t.includes('which flow') ||
    t.includes('what should i run') ||
    t.includes('start onboarding') ||
    t.includes('pick a flow')
  ) {
    return (
      `**Default pick (first template):** **${first.name}** — ${first.description}\n\n` +
      `Open **Templates** to start any catalog flow. Mention **healthcare**, **recert**, **1099**, **multi-state**, **legal**, **venda**, or **sharepoint** and I’ll point at the closest match.`
    )
  }
  const keywordHints: { k: string; id: string }[] = [
    { k: 'healthcare', id: 'pf-supplier-onboarding-healthcare' },
    { k: 'recert', id: 'pf-supplier-recertification' },
    { k: '1099', id: 'pf-1099-sole-prop-onboarding' },
    { k: 'multi-state', id: 'pf-supplier-multistate' },
    { k: 'multi state', id: 'pf-supplier-multistate' },
    { k: 'legal', id: 'pf-msa-sow-legal-package' },
    { k: 'msa', id: 'pf-msa-sow-legal-package' },
    { k: 'venda', id: 'pf-post-approval-venda-handoff' },
    { k: 'sharepoint', id: 'pf-post-approval-venda-handoff' },
    { k: 'staffing', id: 'pf-supplier-onboarding-domestic' },
    { k: 'general', id: 'pf-supplier-onboarding-domestic' },
    { k: 'domestic', id: 'pf-supplier-onboarding-domestic' },
  ]
  for (const { k, id } of keywordHints) {
    if (t.includes(k)) {
      const flow = findSupplierTemplateById(id)
      if (flow) {
        return `**Template match:** **${flow.name}**\n\n${flow.description}\n\nUse **Templates** to launch it (first template in the list is **${first.name}** if you want the default domestic path).`
      }
    }
  }
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
    'Here in **demo mode**, use **Templates** or **Sessions** to walk supplier onboarding flows with scripted data.'
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
    const tpl = findSupplierTemplateById(request.productFlowId) ?? AGILEONE_SUPPLIER_TEMPLATES[0]
    const id = `pfs-demo-${Date.now()}`
    const created = Date.now()
    const orch: OrchProductFlowSession = {
      id,
      productFlowId: tpl.id!,
      name: request.note?.trim() || tpl.name || 'New supplier onboarding session',
      userQuery: request.userQuery ?? null,
      teamMemberId: DEMO_TEAM_MEMBER_ID,
      assemblyId: request.assemblyId,
      workflowId: request.workflowId ?? tpl.workflowId,
      currentStepIndex: 0,
      status: 'ACTIVE',
      createdAt: created,
      updatedAt: created,
      stepSessions: [],
      messages: [],
    }
    reconcileProductFlowStepSessions(orch)
    demoOrchestrationSessions.set(id, orch)
    syncApiSessionFromOrch(orch)
    return {
      session: getOrEnsureOrch(id) as unknown as OrchProductFlowSession,
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
    return getOrEnsureOrch(sessionId) as unknown as ProductFlowSession
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

  async nextStep(sessionId: string, body?: unknown): Promise<CompleteStepResponse> {
    const orch = getOrEnsureOrch(sessionId)
    const flow = getProductFlowForSession(orch.productFlowId)
    const n = flow.flowSteps.length
    const idx = orch.currentStepIndex
    const outputData = (body as { outputData?: Record<string, unknown> } | undefined)?.outputData
    const curSs = orch.stepSessions?.find((s) => s.stepIndex === idx)
    if (curSs) {
      curSs.status = 'COMPLETED'
      curSs.outputData = { ...curSs.outputData, ...outputData }
      curSs.updatedAt = Date.now()
    }
    if (idx < n - 1) {
      orch.currentStepIndex = idx + 1
    } else {
      orch.status = 'COMPLETED'
    }
    orch.updatedAt = Date.now()
    reconcileProductFlowStepSessions(orch)
    syncApiSessionFromOrch(orch)
    const completedStep = orch.stepSessions!.find((s) => s.stepIndex === idx)!
    return {
      completedStep,
      currentStep: buildMockStepResponse(orch),
      transition: {
        type: 'AUTO',
        fromStepIndex: idx,
        toStepIndex: Math.min(idx + 1, Math.max(0, n - 1)),
        timestamp: Date.now(),
      },
    }
  }

  async startStep(sessionId: string, stepIndex: number, _body?: unknown): Promise<unknown> {
    const orch = getOrEnsureOrch(sessionId)
    const ss = orch.stepSessions?.find((s) => s.stepIndex === stepIndex)
    if (ss && ss.status === 'PENDING') {
      ss.status = 'IN_PROGRESS'
      ss.startedAt = Date.now()
      orch.updatedAt = Date.now()
      reconcileProductFlowStepSessions(orch)
      syncApiSessionFromOrch(orch)
    }
    return { currentStep: buildStepResponse(sessionId) }
  }

  async completeStep(sessionId: string, stepIndex: number, body?: unknown): Promise<unknown> {
    const outputData = (body as { outputData?: Record<string, unknown> } | undefined)?.outputData
    void stepIndex
    return this.nextStep(sessionId, { outputData })
  }

  async runAutomation(
    sessionId: string,
    stepIndex: number,
    _request?: RunAutomationRequest,
  ): Promise<CompleteStepResponse> {
    const orch = getOrEnsureOrch(sessionId)
    const flow = getProductFlowForSession(orch.productFlowId)
    const stepDef = flow.flowSteps[stepIndex]
    const ss = orch.stepSessions?.find((s) => s.stepIndex === stepIndex)
    if (ss) {
      ss.status = 'COMPLETED'
      ss.outputData = {
        ...ss.outputData,
        ticketId: `demo-ticket-${Date.now()}`,
        ticketName: stepDef?.name ?? 'Automation',
        workflowId: orch.workflowId ?? '',
      }
      ss.updatedAt = Date.now()
    }
    const n = flow.flowSteps.length
    if (stepIndex < n - 1) {
      orch.currentStepIndex = stepIndex + 1
    } else {
      orch.status = 'COMPLETED'
    }
    orch.updatedAt = Date.now()
    reconcileProductFlowStepSessions(orch)
    syncApiSessionFromOrch(orch)
    const completedStep = orch.stepSessions!.find((s) => s.stepIndex === stepIndex)!
    return {
      completedStep,
      currentStep: buildMockStepResponse(orch),
      transition: {
        type: 'AUTO',
        fromStepIndex: stepIndex,
        toStepIndex: Math.min(stepIndex + 1, Math.max(0, n - 1)),
        timestamp: Date.now(),
      },
    }
  }

  async acknowledgeStep(sessionId: string, stepIndex: number): Promise<ProductFlowSession> {
    const orch = getOrEnsureOrch(sessionId)
    const flow = getProductFlowForSession(orch.productFlowId)
    const last = flow.flowSteps.length - 1
    const ss = orch.stepSessions?.find((s) => s.stepIndex === stepIndex)
    if (ss) {
      ss.status = 'COMPLETED'
      ss.updatedAt = Date.now()
    }
    if (stepIndex >= last) {
      orch.status = 'COMPLETED'
    } else {
      orch.currentStepIndex = stepIndex + 1
    }
    orch.updatedAt = Date.now()
    reconcileProductFlowStepSessions(orch)
    syncApiSessionFromOrch(orch)
    return getOrEnsureOrch(sessionId) as unknown as ProductFlowSession
  }

  async retryStep(sessionId: string, _stepIndex: number): Promise<ProductFlowSession> {
    return this.getProductFlowSession(sessionId)
  }

  async bootstrapStep(sessionId: string, stepIndex: number, request?: BootstrapRequest): Promise<unknown> {
    const orch = getOrEnsureOrch(sessionId)
    const flow = getProductFlowForSession(orch.productFlowId)
    const step = flow.flowSteps[stepIndex]
    if (step?.type !== 'EMAIL_OUTREACH_CREATOR') {
      return {}
    }
    const key = sessionStepKey(sessionId, stepIndex)
    const instructions = request?.instructions?.trim()
    const id = `eo-demo-${sessionId}-${stepIndex}`
    const outreach: EmailOutreach = {
      id,
      name: 'AgileOne supplier invite (demo)',
      to: [{ email: 'supplier.contact@example.com', name: 'Supplier contact' }],
      initialOutreach: {
        title: 'Complete your AgileOne onboarding',
        body:
          (instructions ? `Notes: ${instructions}\n\n` : '') +
          'This is a **demo** draft. Adjust recipients, body, and send window before sending.',
      },
      status: 'DRAFT',
    }
    demoEmailOutreachByStepKey.set(key, outreach)
    const ss = orch.stepSessions?.find((s) => s.stepIndex === stepIndex)
    if (ss) {
      ss.emailOutreachId = id
      ss.outputData = { ...ss.outputData, emailOutreachId: id, emailOutreach: outreach }
      ss.updatedAt = Date.now()
    }
    orch.updatedAt = Date.now()
    syncApiSessionFromOrch(orch)
    return outreach
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

  async getSessionMessages(sessionId: string, _stepIndex?: number, _limit?: number): Promise<unknown> {
    void _stepIndex
    void _limit
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

  async getConsolePublishedTriggers(assemblyId: string, workflowId: string): Promise<WorkflowTriggerItem[]> {
    void assemblyId
    return getDemoTriggersForWorkflow(workflowId)
  }

  async kickoffConsoleTrigger(
    _assemblyId: string,
    workflowId: string,
    triggerId: string,
    _inputs: Record<string, TriggerInputValue>,
    _forTesting = false,
  ): Promise<TriggerExecutionResponse> {
    void _inputs
    void _forTesting
    const t = Date.now()
    const name =
      getDemoTriggersForWorkflow(workflowId).find((x) => x.id === triggerId)?.name ?? 'Demo action'
    return {
      id: `ticket-${t}`,
      workflowId,
      workflowName: 'Supplier onboarding (demo)',
      workflowVersion: '1',
      processName: 'Console trigger',
      triggerId,
      workflowState: { name: 'RUNNING', description: '', status: 'ACTIVE' },
      externalExecutionId: `ext-${t}`,
      name,
      description: 'Demo execution',
      createdBy: DEMO_TEAM_MEMBER_ID,
      createdAt: t,
      state: 'OPEN',
      updates: [],
    } as unknown as TriggerExecutionResponse
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

  async getConversationAsTemplate(templateConversationId: string): Promise<unknown> {
    return getDemoConversationTemplate(templateConversationId)
  }

  async getConversationTemplateConversations(): Promise<unknown> {
    return { items: [], totalCount: 0 }
  }

  async createConversationInStep(sessionId: string, stepIndex: number, request: unknown): Promise<unknown> {
    const payload = request as {
      sourceConversationId?: string
      name?: string
      assemblyLineID?: string
    }
    const orch = getOrEnsureOrch(sessionId)
    const id = `conv-demo-${sessionId}-${stepIndex}`
    const base = getDemoConversationTemplate(payload.sourceConversationId ?? 'ctpl-supplier-onboarding')
    const conv: Conversation = {
      ...base,
      id,
      name: payload.name?.trim() || base.name,
      assemblyLineID: payload.assemblyLineID ?? DEMO_ASSEMBLY_ID,
    }
    demoConversationsById.set(id, conv)
    const ss = orch.stepSessions?.find((s) => s.stepIndex === stepIndex)
    if (ss) {
      ss.conversationConfigId = id
      ss.outputData = { ...ss.outputData, conversationConfigId: id }
      ss.updatedAt = Date.now()
    }
    orch.updatedAt = Date.now()
    syncApiSessionFromOrch(orch)
    return conv
  }

  async updateConversationInStep(sessionId: string, stepIndex: number, request: unknown): Promise<unknown> {
    const payload = request as { conversationId?: string; name?: string }
    const id = payload.conversationId
    if (!id) return {}
    const prev = demoConversationsById.get(id)
    const next: Conversation = {
      ...(prev ?? getDemoConversationTemplate('ctpl-supplier-onboarding')),
      ...payload,
      id,
      assemblyLineID: prev?.assemblyLineID ?? DEMO_ASSEMBLY_ID,
    }
    demoConversationsById.set(id, next)
    const orch = getOrEnsureOrch(sessionId)
    void stepIndex
    orch.updatedAt = Date.now()
    syncApiSessionFromOrch(orch)
    return next
  }

  async getEmailOutreachInStep(sessionId: string, stepIndex: number): Promise<unknown> {
    const key = sessionStepKey(sessionId, stepIndex)
    const cached = demoEmailOutreachByStepKey.get(key)
    if (cached) return cached
    const orch = getOrEnsureOrch(sessionId)
    const ss = orch.stepSessions?.find((s) => s.stepIndex === stepIndex)
    return (ss?.outputData?.emailOutreach as EmailOutreach | undefined) ?? null
  }

  async updateEmailOutreachInStep(sessionId: string, stepIndex: number, request: unknown): Promise<unknown> {
    const payload = request as { emailOutreach?: Partial<EmailOutreach>; emailOutreachId?: string }
    const key = sessionStepKey(sessionId, stepIndex)
    const prev =
      demoEmailOutreachByStepKey.get(key) ??
      ({ id: payload.emailOutreachId } as EmailOutreach)
    const merged: EmailOutreach = { ...prev, ...payload.emailOutreach, id: prev.id ?? payload.emailOutreachId }
    demoEmailOutreachByStepKey.set(key, merged)
    const orch = getOrEnsureOrch(sessionId)
    const ss = orch.stepSessions?.find((s) => s.stepIndex === stepIndex)
    if (ss) {
      ss.emailOutreachId = merged.id ?? ss.emailOutreachId
      ss.outputData = { ...ss.outputData, emailOutreachId: merged.id, emailOutreach: merged }
      ss.updatedAt = Date.now()
      orch.updatedAt = Date.now()
    }
    syncApiSessionFromOrch(orch)
    return merged
  }

  async sendEmailOutreachInStep(sessionId: string, stepIndex: number, _request?: unknown): Promise<unknown> {
    void sessionId
    void stepIndex
    return { sent: true, message: 'Demo mode — email not sent.', recipientCount: 1 }
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
