// --- Auth / Team Member ---

export interface OwnedWorkflow {
  id: string
  name: string
  description?: string
}

export interface OwnedAssemblyLine {
  assemblyLineID: string
  orgID?: string
  name: string
  description?: string
  workflows?: OwnedWorkflow[]
}

export interface CommsAppInfo {
  teamMemberID: string
  name: string
  email?: string
  organizationID?: string
  primaryTeam?: string
  teamMemberType?: string
  teamMemberRole?: string
  ownedAssemblyLines?: OwnedAssemblyLine[]
}

// --- Dispatcher Agent ---

/** One row in an OPTION_PICK dispatcher block */
export interface DispatcherPickOption {
  id: string
  label: string
  subtitle?: string
}

export interface DispatcherAgentUiBlockV1 {
  v?: number
  kind: string
  /** OPEN_PRODUCT_FLOW_SESSION */
  productFlowSessionId?: string
  sessionLabel?: string
  /** OPTION_PICK — user taps; client POSTs pickSelectionKind + pickSelectedId */
  pickPrompt?: string
  pickSelectionKind?: string
  pickOptions?: DispatcherPickOption[]
}

export interface DispatcherAgentMessage {
  id?: string
  role: 'USER' | 'ASSISTANT'
  content?: string
  uiBlocks?: DispatcherAgentUiBlockV1[]
  createdAt?: number
}

export interface DispatcherAgentSession {
  id: string
  assemblyId: string
  teamMemberId: string
  messages: DispatcherAgentMessage[]
  focusedProductFlowSessionId?: string
  createdAt?: number
  updatedAt?: number
}

export interface DispatcherAgentMessageRequest {
  message: string
  referencedSessionIds?: string[]
  focusedProductFlowSessionId?: string
  /** Structured selection from OPTION_PICK (both required together) */
  pickSelectionKind?: string
  pickSelectedId?: string
}

// --- Product Flow Sessions ---

export type ProductFlowSessionStatus = 'ACTIVE' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED' | 'CLOSED' | 'POST_ACTION_FAILED'

export interface FlowSessionResult {
  id: string
  label?: string
  value?: string
  metadata?: Record<string, unknown>
}

export interface StepSession {
  stepIndex: number
  status: string
  startedAt?: number
  completedAt?: number
  [key: string]: unknown
}

export interface ProductFlowSession {
  id: string
  name?: string
  /** Captured at session creation (e.g. dispatcher user message). */
  userQuery?: string | null
  productFlowId?: string
  teamMemberId?: string
  assemblyId?: string
  workflowId?: string
  status: ProductFlowSessionStatus
  currentStepIndex?: number
  stepSessions?: StepSession[]
  messages?: unknown[]
  sessionResults?: FlowSessionResult[]
  metadata?: Record<string, unknown>
  createdAt?: number
  updatedAt?: number
  openTaskCount?: number
  completedTaskCount?: number
}

export type ProductFlowSessionTaskStatus = 'OPEN' | 'COMPLETED' | 'FAILED' | 'CANCELLED'

export interface ProductFlowSessionTask {
  id: string
  productFlowSessionId: string
  assemblyId?: string
  stepIndex?: number
  taskType: 'EMAIL_RECIPIENT' | 'CONVERSATION_PARTICIPANT'
  status: ProductFlowSessionTaskStatus
  referenceId?: string
  secondaryReferenceId?: string
  label?: string
  description?: string
  metadata?: Record<string, string>
  messageCount?: number
  createdAt?: number
  updatedAt?: number
  completedAt?: number
}

export type TaskMessageRole = 'MANAGER' | 'RECIPIENT' | 'SYSTEM' | 'ASSISTANT'
export type TaskMessageChannel = 'APP' | 'EMAIL' | 'SMS'

export interface TaskMessageAttachment {
  id?: string
  name?: string
  media?: string
  url?: string
  sizeMB?: number
  uploadComplete?: boolean
  description?: string
}

export interface TaskMessage {
  id: string
  taskId: string
  productFlowSessionId?: string
  assemblyId?: string
  role: TaskMessageRole
  content: string
  authorId?: string
  authorDisplayName?: string
  channel: TaskMessageChannel
  attachments?: TaskMessageAttachment[]
  emailMessageId?: string
  inReplyToMessageId?: string
  metadata?: Record<string, string>
  createdAt?: number
}

export interface TaskMessagePageResponse {
  items: TaskMessage[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ProductFlowSessionTaskPageResponse {
  items: ProductFlowSessionTask[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

/** GET .../tasks/stats */
export interface ProductFlowSessionTaskStatsResponse {
  total: number
  open: number
  completed: number
  failed: number
  cancelled: number
}

/** POST .../conversation-sessions/participants/resolve */
export interface ParticipantSummaryResponse {
  participantId?: string
  displayName?: string
  email?: string
}

export interface ConversationSessionParticipantsResolveResponse {
  byConversationSessionId: Record<string, ParticipantSummaryResponse[]>
}

export interface ProductFlowSessionSearchResponse {
  sessions: ProductFlowSession[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export interface ProductFlowSessionSearchRequest {
  assemblyId?: string
  teamMemberId?: string
  status?: ProductFlowSessionStatus
  /** Case-insensitive regex against stored session document (server-side). */
  search?: string
  page?: number
  pageSize?: number
  sortBy?: 'ID' | 'CREATED_AT' | 'UPDATED_AT' | 'COMPLETED_AT'
  sortOrder?: 'ASC' | 'DESC'
}

// --- Participants ---

import type { ParticipantPreferredChannel, ParticipantRecordStatus } from './participant-enums'

export interface Participant {
  id: string
  firstName?: string
  lastName?: string
  email?: string
  reference?: string
  enabled?: boolean
  domainOwner?: 'NONE' | 'ASSEMBLY_LINE' | 'ORG'
  domainOwnerId?: string
  phone?: string
  company?: string
  role?: string
  tags?: string[]
  status?: ParticipantRecordStatus | string
  responseRate?: number
  averageResponseHours?: number
  preferredChannel?: ParticipantPreferredChannel
  sessionsTotal?: number
  sessionsCompleted?: number
  lastActivityAt?: number
  aiGeneratedSummary?: string
  recentSessionIds?: string[]
  channelStats?: { channel?: string; count?: number }[]
  communicationConsent?: Record<string, unknown>
}

export interface ParticipantSearchRequest {
  search?: string
  domainOwner?: Participant['domainOwner']
  domainOwnerId?: string
  status?: string
  tagsAny?: string[]
  page?: number
  pageSize?: number
}

export interface ParticipantSearchPageResponse {
  items: Participant[]
  total: number
  page: number
  pageSize: number
}

// --- Conversations ---

export interface ConversationSession {
  id: string
  [key: string]: unknown
}

// --- SSO ---

export interface SSOResponse {
  email?: string
  teamMemberID?: string
}

// --- Integrations: Participant Import ---

export interface ParticipantImportItem {
  email: string
  firstName: string
  lastName?: string
  phone?: string
  company?: string
  role?: string
  reference?: string
  tags?: string[]
  preferredChannel?: string
  metadata?: Record<string, string>
}

export interface BatchParticipantRequest {
  participants: ParticipantImportItem[]
  upsert: boolean
  assemblyId: string
}

export interface ParticipantImportConflict {
  importItem: ParticipantImportItem
  existingParticipant: Participant
}

export interface ParticipantImportError {
  importItem: ParticipantImportItem
  message: string
}

export interface BatchParticipantResult {
  created: Participant[]
  updated: Participant[]
  conflicts: ParticipantImportConflict[]
  errors: ParticipantImportError[]
}

// ── Export Integrations ──

export interface IntegrationConnection {
  id: string
  assemblyId: string
  providerType: 'GOOGLE_DRIVE' | 'SHAREPOINT' | 'SFTP'
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR'
  displayName: string
  connectedByTeamMemberId: string
  autoSyncEnabled: boolean
  targetFolderPath?: string
  lastSyncAt?: number
  createdAt: number
  updatedAt: number
}

export interface ExportProgress {
  totalSessions: number
  completedSessions: number
  totalFiles: number
  uploadedFiles: number
}

export interface ExportJob {
  id: string
  assemblyId: string
  integrationConnectionId: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  triggerType: 'MANUAL' | 'AUTO_SYNC'
  sessionIds: string[]
  progress?: ExportProgress
  errorMessage?: string
  exportedFolderUrl?: string
  createdAt: number
  updatedAt: number
  completedAt?: number
}

export interface FolderEntry {
  id: string
  name: string
}

export interface SftpConnectionRequest {
  assemblyId: string
  displayName?: string
  host: string
  port: number
  username: string
  password?: string
  privateKey?: string
  targetDirectory?: string
}

export interface ExportRequest {
  assemblyId: string
  connectionId: string
  sessionIds: string[]
}

/** Types shared with orchestration-dashboard console/action UI */
export type {
  ActionFlowStep,
  ProductFlowSessionEvent,
  ProductFlowStepUpdate,
  TriggerExecutionResponse,
  TriggerInputValue,
  TriggerInputItem,
  WorkflowTriggerItem,
  EmailOutreach,
  MediaFile,
} from './orchestration-dashboard-types'
