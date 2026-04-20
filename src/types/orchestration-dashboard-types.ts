import type {
  TicketState,
  TaskStatus,
  SOPUpdateType,
  TriggerType,
  TaskItemType,
  CommentType,
  AssignmentType,
  TeamMemberType,
  TeamMemberRole,
  DataViewType,
  DataViewLayout,
  AttributeType,
  FilterOperator,
  VectorSearchType,
  DataViewSortField,
  SortOrder,
  ApiResponseStatus,
  ENTITY_FILTER_TYPE,
} from "@/config/orchestration-constants";
import type { ParticipantPreferredChannel, ParticipantRecordStatus } from "./participant-enums";

// Re-export types that are used in components
export type { FilterOperator };

// TypeScript interfaces for API responses based on official documentation

// Console Message Types
export interface ConsoleMessageComponent {
  type: string;
  metadata?: {
    ticketId?: string;
    updateType?: string;
    timestamp?: number;
  };
}

export interface ConsoleMessageItem {
  id: string;
  message: string;
  component?: ConsoleMessageComponent;
  createdAt: number;
  updatedAt: number;
}

export interface ConsoleMessagesResponse {
  requestedCount: number;
  messages: ConsoleMessageItem[];
  totalCount: number;
}

// Authentication Types
export interface OTPGenerateRequest {
  email: string;
}

export interface OTPGenerateResponse {
  status: string;
  message: string;
}

export interface OTPLoginRequest {
  email: string;
  code: string;
  ref: string;
}

export interface OTPLoginResponse {
  status: string;
  message: string;
}

/** Response from POST /auth/sso/complete-web; includes email from IdP so client can set auth without waiting for getTeamMemberAccessInfo. */
export interface SsoCompleteResponse {
  message: string;
  email: string;
  teamMemberID: string;
  name: string;
}

// Team Member Access Info (Endpoint 1)
export interface TeamMemberInfo {
  teamMemberID: string;
  organizationID: string;
  primaryTeam: string;
  name: string;
  /** Present when returned from SSO/login flows. */
  email?: string;
  type: TeamMemberType;
  teamMemberType: TeamMemberType;
  teamMemberRole: TeamMemberRole;
  ownedAssemblyLines: AssemblyLine[];
}

export interface AssemblyLine {
  assemblyLineID: string;
  orgID: string;
  name: string;
  description: string;
  workflows: WorkflowInfo[];
}

export interface WorkflowInfo {
  workflowID: string;
  name: string;
  description: string;
  processes: WorkflowProcessInfo[];
}

export interface WorkflowProcessInfo {
  name: string;
  description: string;
}

// SOP Types (Endpoint 2 & 3) - Based on actual example.json structure
export interface SOP {
  id: string;
  name: string;
  description: string;
  assemblyId: string;
  businessContext: string;
  slaNotes: string;
  processes: SOPProcess[];
  createdAt?: number | null;
  updatedAt?: number;
  createdBy?: string | null;
  version?: string;
  active?: boolean;
}

// SOP List Item (for search results)
export interface SOPListItem {
  id: string;
  name: string;
  description: string;
  assemblyId: string;
  businessContext: string;
  version?: string;
  active?: boolean;
  createdAt?: number | null;
  createdBy?: string | null;
}

export interface SOPTrigger {
  id?: string;
  name: string;
  description?: string;
  type: string;
  triggerWhen?: string;
  triggerWhat?: string;
  requiredInputsList: TriggerInputItem[];
  optionalInputsList: TriggerInputItem[];
  published?: boolean;
}

export interface SOPException {
  id?: string;
  name: string;
  description?: string;
  instructions?: string;
}

// Operator interfaces for SOP steps
export interface RetryPolicy {
  maxAttempts: number;
  delay: number;
}

export interface Conditional {
  condition: string;
  onTrue?: Operator;
  onFalse?: Operator;
}

export interface Operator {
  type: string;
  timeout?: number;
  instructions?: string;
  retryPolicy?: RetryPolicy;
  conditionals?: Conditional[];
  waitTime?: number;
  waitCondition?: string;
  doneCondition?: string;
  onEach?: Operator;
  onException?: Operator;
  onFailure?: Operator;
}

export interface ExecutionType {
  type: string;
  name?: string;
  details?: string;
}

export interface SOPProcess {
  id: string;
  name: string;
  description: string;
  completedStateLabel: string;
  steps: SOPStep[];
  triggers?: SOPTrigger[];
  exceptions?: SOPException[];
}

export interface SOPStep {
  id: string;
  name: string;
  description: string;
  validation: string;
  toolsDependencies: string[];
  smeDependencies: string[];
  requiredContext: string[];
  steps?: SOPStep[];
  subSteps?: SOPStep[];
  stepType?: "AI" | "HIL" | "INTEGRATION";
  // Additional fields present in actual data
  operator?: Operator;
  executoconfigrType?: ExecutionType;
  executionType?: ExecutionType; // Alternative naming in some data
  completedStateLabel?: string;
}

export interface SOPUpdateRequest {
  sopId: string;
  updateType: SOPUpdateType;
  processName?: string;
  stepName?: string;
  triggerName?: string;
  exceptionName?: string;
  updateMessage: string;
  reason?: string;
}

// Type alias for backward compatibility
export type SOPUpdate = SOPUpdateRequest;

export interface SOPUpdateResponse {
  status: string;
  message: string;
}

// Workflow Ticket Types (Endpoints 4, 5, 6, 7)
export interface WorkflowTicket {
  id: string;
  workflowId: string;
  workflowName: string;
  workflowVersion: string;
  workflowState?: WorkflowState;
  name: string;
  description: string;
  createdBy: string;
  createdAt: number;
  state: TicketState;
  externalExecutionId: string;
  updates: TicketUpdate[];
}

// Workflow Ticket List Item (for search results)
export interface WorkflowTicketListItem {
  id: string;
  workflowId: string;
  workflowName: string;
  workflowVersion: string;
  workflowState?: WorkflowState;
  name: string;
  description: string;
  createdBy: string;
  createdAt: number;
  state: TicketState;
  externalExecutionId: string;
  updatesCount: number;
}

export interface WorkflowState {
  name: string;
  description: string;
  status: string;
}

export interface TicketUpdate {
  author: string;
  message: string;
  mediaList: MediaFile[];
}

export interface TicketStatusUpdate {
  newState: TicketState;
  message?: string;
  author?: string;
}

// Type alias for backward compatibility
export type WorkflowTicketStatusUpdate = TicketStatusUpdate;

// Trigger Input Types
export interface TriggerInputFileObject {
  id: string;
  name: string;
  size: number;
  type: string;
  content?: string; // Base64 encoded content or file path
  url?: string; // URL to the file
  metadata?: Record<string, unknown>; // Additional metadata
}

export type TriggerInputValue = string | number | boolean | string[] | TriggerInputFileObject | MediaFile | MediaFile[] | Record<string, unknown>;

// Template Media object from backend
export interface TemplateMedia {
  id: string;
  name: string;
  description?: string;
  media?: string; // CloudFront URL
  thumbnail?: string;
  sizeMB?: number;
  uploadComplete?: boolean;
  owners?: string[];
}

/** Event published when user selects an entity. Event key format: entitySpecId.attributeName.keyName */
export interface EntityAttributeEventConfig {
  eventKey: string;
  attributePath?: string | null; // "id" or nested path; for multi-select always "id"
  attributeType?: string;
  description?: string;
}

/** Subscription to another attribute's event; when event is published, filter is applied. */
export interface EntityAttributeSubscriptionConfig {
  eventKey: string;
  sourceAttributeName: string;
  filterAttributePath: string;
  filterOperator?: string; // default $eq
  required: boolean;
  description?: string;
}

export interface TriggerInputItem {
  name: string;
  description: string | null;
  type: string;
  // Additional fields for FILE type inputs
  fileTypes?: string[]; // Supported file types like ["CSV", "PDF", "XLSX"] - empty or undefined means all types allowed
  templateMedia?: TemplateMedia; // Template media object with details and URL
  // Additional fields for ENTITY type inputs
  entitySpecId?: string; // Entity spec ID for entity selection
  entityFilters?: EntityFilter[]; // Filters to apply when querying entities
  displayAttributes?: string[]; // Attribute names to display for entities
  currentState?: string[]; // Current state values to filter entities by (e.g., ["IMPORTED", "RESUME_SCORED"])
  multiSelect?: boolean; // Allow multiple entity selection when true
  searchAttribute?: string;
  /** Events this attribute publishes when an entity is selected. */
  publishedEvents?: EntityAttributeEventConfig[];
  /** Events this attribute subscribes to; filters are updated when those events are published. */
  subscriptions?: EntityAttributeSubscriptionConfig[];
  // Additional fields for ARRAY type inputs
  allowedOptions?: string[]; // Allowed values for array inputs - if empty or undefined, any values are allowed
}

export interface TriggerInputDefinition {
  type: "STRING" | "NUMBER" | "BOOLEAN" | "ARRAY" | "FILE_OBJECT" | "FILE" | "MEDIA_JSON" | "OBJECT";
  description?: string;
  required?: boolean;
  defaultValue?: TriggerInputValue;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    allowedValues?: string[];
  };
}

// Workflow Trigger Types (Endpoint 8)
export interface WorkflowTriggerItem {
  id: string;
  workflowID: string;
  name: string;
  description: string;
  externalID: string;
  type: TriggerType;
  requiredInputsList: TriggerInputItem[];
  optionalInputsList: TriggerInputItem[];
  requiredInputsAsMap?: Record<string, string>;
  optionalInputsAsMap?: Record<string, string>;
  webHookCallProperties?: {
    url: string;
    method: string;
    contentType: string;
    authenticationMethod?: {
      type: string;
      username: string;
      password: string;
    };
  };
  published?: boolean;
  groupName?: string;
  groupDescription?: string;
}

// Trigger Execution Response (from kickoff endpoint)
export interface TriggerExecutionResponse {
  id: string; // Ticket ID
  workflowId: string;
  workflowName: string;
  workflowVersion: string;
  processName: string;
  triggerId: string;
  workflowState: {
    name: string;
    description: string;
    status: string;
  };
  externalExecutionId: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: number;
  state: TicketState;
  updates: TicketUpdate[];
}

// Workflow Task Assignee (for multi-assignment support)
export interface WorkflowTaskAssignee {
  assigneeId: string;
  assigneeName: string;
  assigneeType: TeamMemberType;
  assigneeEmail?: string;
  assignedAt: number;
  assignedBy?: string;
  isPrimary?: boolean;
  primary?: boolean; // Alternative property name for isPrimary
}

// Workflow Task Assignee Request (for multi-assignment requests)
export interface WorkflowTaskAssigneeRequest {
  assigneeId: string;
  assigneeType: TeamMemberType;
  isPrimary?: boolean;
  primary?: boolean; // Alternative property name for isPrimary
  notes?: string;
}

// Workflow Task Reassignment Request (for multi-assignment)
export interface WorkflowTaskReassignmentRequest {
  assignees: WorkflowTaskAssigneeRequest[];
  reason?: string;
  reassignedBy?: string; // Auto-populated by backend
}

// Workflow Task Types (Endpoints 9, 10, 11, 12)
export interface WorkflowTask {
  id: string;
  workflowID: string;
  assemblyID: string;
  name: string;
  description: string;
  instructions: string;
  assignedTo: AssignmentType;
  assignedToId: string;
  assignedToName: string;
  assignees?: WorkflowTaskAssignee[]; // Multi-assignment support
  resourceGroup?: {
    id: string;
    name: string;
  } | null;
  status: TaskStatus;
  workflowTaskItems: WorkflowTaskItem[];
  validationInstructions: string;
  createdAt: number | null;
  completeBy: number | null;
  taskResponseID: string | null;
  completedAt: number | null;
  workflowTaskItemResponses: WorkflowTaskItemResponse[];
  completedTaskItemsCount: number;
  webHookCallProperties: unknown | null;
}

// Workflow Task List Item (for search results)
export interface WorkflowTaskListItem {
  id: string;
  workflowID: string;
  assemblyID: string;
  name: string;
  description: string;
  instructions: string;
  assignedTo: AssignmentType;
  assignedToId: string;
  assignedToName: string;
  assignees?: WorkflowTaskAssignee[]; // Multi-assignment support
  resourceGroup?: {
    id: string;
    name: string;
  } | null;
  status: TaskStatus;
  workflowTaskItemsCount: number;
  validationInstructions: string;
  createdAt: number | null;
  completeBy: number | null;
  taskResponseID: string | null;
  completedAt: number | null;
  completedTaskItemsCount: number;
  webHookCallProperties: unknown | null;
}

export interface WorkflowTaskItem {
  id: string | null;
  title: string;
  description: string;
  type: TaskItemType | null;
  instructions: string;
  responseOptions: string[];
  responseSchema: string;
  mediaList: MediaFile[];
}

export interface WorkflowTaskResponse {
  id: string;
  workflowID: string;
  assemblyID: string;
  taskID: string;
  name: string;
  createdAt: number;
  completedAt: number | null;
  workflowTaskItemResponses: WorkflowTaskItemResponse[];
  completedTaskItemsCount: number;
}

export interface WorkflowTaskItemResponse {
  type: TaskItemType | null;
  taskItemId: string;
  response: string;
  mediaList: MediaFile[];
  comments: TaskComment[];
  completed: boolean;
  completedAt?: number;
}

export interface WorkflowTaskItemResponseRequest {
  type?: TaskItemType; // Optional in request
  taskItemId: string; // Required
  response: string; // Required
  mediaList?: MediaFile[]; // Optional
  comments?: TaskComment[]; // Optional
  completed?: boolean; // Optional
  completedAt?: number; // Optional
}

export interface TaskComment {
  authorID: string;
  author: string;
  id: string;
  message: string;
  type: CommentType;
  createdAt: number;
}

export interface MediaFile {
  id: string; // Unique media identifier
  name: string; // File name
  thumbnail: string | null; // Thumbnail URL or null
  media: string; // URL or path to the file
  sizeMB: number; // File size in megabytes
  uploadComplete: boolean; // Boolean indicating upload completion
  description: string | null; // File description or null
  owners: string[]; // Array of user IDs with access
}

// Search Parameters
export interface WorkflowTaskSearchParams {
  search?: string;
  workflowID?: string;
  assemblyID?: string;
  assignedToId?: string;
  status?: TaskStatus[]; // Array of TaskStatus enums
  page?: number;
  pageSize?: number;
  sortBy?: "ID" | "CREATED_AT";
  sortOrder?: "ASC" | "DESC";
}

export interface WorkflowTicketSearchParams {
  searchQuery?: string;
  workflowId?: string;
  state?: TicketState[]; // Array of TicketState enums
  externalExecutionId?: string;
  createdAfter?: number; // Unix timestamp (int64)
  createdBefore?: number; // Unix timestamp (int64)
  page?: number;
  pageSize?: number;
  sortBy?: "ID" | "CREATED_AT";
  sortOrder?: "ASC" | "DESC";
}

// SOP Search Parameters - Based on RequirementsSOPSearchParams schema
export interface SOPSearchParams {
  searchQuery?: string;
  name?: string;
  assemblyId?: string;
  businessContext?: string;
  createdBy?: string;
  isActive?: boolean;
  createdAfter?: number; // Unix timestamp (int64)
  createdBefore?: number; // Unix timestamp (int64)
  page?: number;
  pageSize?: number;
  sortBy?: "ID" | "CREATED_AT" | "NAME";
  sortOrder?: "ASC" | "DESC";
}

// SOP Search Response
export interface SOPSearchResponse {
  sops: SOPListItem[];
  totalCount: number;
  hasMore: boolean;
  page: number;
  pageSize: number;
}

// Extended search params for client-side filtering
export interface ExtendedTicketSearchParams extends Omit<WorkflowTicketSearchParams, "state"> {
  state?: TicketState;
  status?: string; // For ticket status filtering (client-side)
  priority?: string; // For priority filtering (client-side)
}

// Workflow Tickets Query Options
export interface WorkflowTicketsOptions {
  state?: TicketState;
  limit?: number; // 1-1000, default 50
  offset?: number; // >= 0, default 0
}

// Paginated Response Types
export interface PaginatedTicketsResponse {
  tickets: WorkflowTicketListItem[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  page?: number; // For search responses
  pageSize?: number; // For search responses
}

export interface PaginatedTasksResponse {
  tasks: WorkflowTaskListItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit?: number;
  offset?: number;
  page?: number;
  pageSize?: number;
  hasMore: boolean;
}

// Error Response Type
export interface ApiErrorResponse {
  status: "BAD_REQUEST" | "UNAUTHORIZED" | "NOT_FOUND" | "ERROR";
  message: string;
}

export interface ApiError extends Error {
  status?: number;
  response?: {
    status: number;
    statusText: string;
  };
}

// Resources Types
export interface TeamMember {
  id: string;
  organizationID: string;
  primaryTeam: string;
  name: string;
  /** Present when returned from resource / search APIs that include email. */
  email?: string;
  role: TeamMemberRole;
  type?: TeamMemberType;
}

export interface AssemblyPartner {
  firstName: string;
  lastName: string;
  assemblyEmail: string;
  profilePicture?: string;
  capabilities: string[];
  skills: string[];
  bio?: string;
}

export interface ResourcesResponse {
  teamMembers: TeamMember[];
  assemblyPartners: AssemblyPartner[];
}

// Assembly and Workflow interfaces
export interface Assembly {
  assemblyLineID: string;
  name: string;
  workflows?: WorkflowInfo[];
  status?: string;
  type?: string;
}

// Chart data interfaces
export interface ChartDataPoint {
  name: string;
  value: number;
  value2?: number;
  [key: string]: string | number | undefined;
}

// Ticket interfaces for operator console
export interface TicketItem {
  id: string;
  name?: string;
  title?: string;
  status: string;
  ticket_id?: string;
  progress?: number;
  description?: string;
  checklist?: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
}

// Chat message interfaces
export interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  type: "system" | "user" | "ticket_created" | "ticket_status";
  ticket?: TicketItem;
}

// Slash command interface
export interface SlashCommand {
  command: string;
  label: string;
  description: string;
}

// Tooltip payload interfaces for charts
export interface TooltipPayload {
  dataKey: string;
  value: number;
  color: string;
  name?: string;
}

export interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

export interface LegendPayload {
  value: string;
  dataKey?: string;
  color?: string;
}

export interface CustomLegendProps {
  payload?: LegendPayload[];
}

// Data configuration interfaces
export interface DataConfig {
  dashboard: Record<string, unknown>;
  resources: Record<string, unknown>;
  sopManager: Record<string, unknown>;
  tickets: Record<string, unknown>;
  partner: Record<string, unknown>;
  [key: string]: Record<string, unknown>;
}

// Metrics Types for new workflow-level metrics endpoints

// Define TimePeriod constants
export const METRICS_TIME_PERIOD = {
  DAY: "DAY",
  WEEK: "WEEK",
  MONTH: "MONTH",
  QUARTER: "QUARTER",
  LAST_X_DAYS: "LAST_X_DAYS",
} as const;

// Derive type from const object
export type MetricsTimePeriod = typeof METRICS_TIME_PERIOD[keyof typeof METRICS_TIME_PERIOD];

export interface MetricsQueryRequest {
  workflowID: string;
  processName: string; // Now required for all metrics API calls
  startDate?: string;
  endDate?: string;
  timePeriod?: MetricsTimePeriod;
  lastXDays?: number;
}

// New MetricsRequest type that matches the API schema for single-day endpoints
export interface MetricsRequest {
  workflowID: string;
  processName: string;
  date?: string; // For single-day requests
  startDate?: string;
  endDate?: string;
  timePeriod?: MetricsTimePeriod;
  lastXDays?: number;
}

export interface AggregatedMetrics {
  totalCount: number | null;
  completedCount: number | null;
  failedCount: number | null;
  cancelledCount: number | null;
  averageCompletionTimeMinutes: number | null;
  medianCompletionTimeMinutes: number | null;
  percentile95CompletionTimeMinutes: number | null;
  statusCounts: Record<string, number>;
  completionStats: Record<string, unknown>;
}

// Metrics response types updated to match new API structure

// Single day task metrics (task-specific field names)
export interface SingleDayTaskMetrics {
  id: string | null;
  workflowID: string;
  processName: string;
  dateKey: string;
  createdAt: string | null;
  updatedAt: string | null;
  statusCounts: Record<string, number>;
  taskCompletionStats: Record<string, unknown>;
  assigneeCompletionStats: Record<string, unknown>;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  cancelledTasks: number;
  averageCompletionTimeMinutes: number | null;
  medianCompletionTimeMinutes: number | null;
  percentile95CompletionTimeMinutes: number | null;
}

// Single day ticket metrics (ticket-specific field names)
export interface SingleDayTicketMetrics {
  id: string | null;
  workflowID: string;
  processName: string;
  dateKey: string;
  createdAt: string | null;
  updatedAt: string | null;
  stateCounts: Record<string, number>;
  ticketCompletionStats: Record<string, unknown>;
  assigneeCompletionStats: Record<string, unknown>;
  totalTickets: number;
  completedTickets: number;
  failedTickets: number;
  cancelledTickets: number;
  averageCompletionTimeMinutes: number | null;
  medianCompletionTimeMinutes: number | null;
  percentile95CompletionTimeMinutes: number | null;
}

export interface TaskMetricsSingleDayResponse {
  workflowID: string;
  processName: string;
  date: string;
  metrics: SingleDayTaskMetrics;
}

export interface TicketMetricsSingleDayResponse {
  workflowID: string;
  processName: string;
  date: string;
  metrics: SingleDayTicketMetrics;
}

// Multi-day aggregated metrics (simplified structure)
export interface SimplifiedAggregatedMetrics {
  totalCount: number;
  completedCount: number;
  failedCount: number;
  cancelledCount: number;
  averageCompletionTimeMinutes: number | null;
}

export interface TaskMetricsResponse {
  workflowID: string;
  processName: string;
  startDate: string;
  endDate: string;
  timePeriod: string;
  aggregatedMetrics: SimplifiedAggregatedMetrics;
}

export interface TicketMetricsResponse {
  workflowID: string;
  processName: string;
  startDate: string;
  endDate: string;
  timePeriod: string;
  aggregatedMetrics: SimplifiedAggregatedMetrics;
}

// Process information for filtering
export interface WorkflowProcess {
  id: string;
  name: string;
  description?: string;
  workflowID: string;
}

// DataView Types - Based on DataView API Guide
export interface Attribute {
  name?: string;
  value?: unknown;
  /** For REFERENCE type: display values keyed by displayedReferenceEntityAttributes. Set by backend on dataview search/enrich responses. */
  resolvedDisplay?: Record<string, unknown>;
}

export interface AttributeSpec {
  name: string;
  displayName?: string; // Human-readable display name for the attribute; falls back to formatted name if not provided
  description?: string;
  type: AttributeType;
  defaultValue?: unknown;
  searchable: boolean;
  caseInsensitive: boolean;
  sortable: boolean;
  filterable: boolean;
  unique: boolean;
  required: boolean;
  vectorDBIndexed: boolean;
  bm25SearchIndexed?: boolean;
  validationRegex?: string;
  validationRegexDescription?: string; // Human-readable description of what the regex validates
  pii: boolean;
  deprecated: boolean;
  allowUpdate?: boolean;
  // STRING/STRING_ARRAY-specific optional constraints
  allowedValues?: string[]; // if not null/empty - list of allowed values for STRING or STRING_ARRAY type attributes
  // MEDIA-specific optional constraints
  maxFileSizeBytes?: number; // if null, no size restriction
  allowedMimeTypes?: string[]; // if null/empty, no type restriction
  referenceEntitySpecID?: string; // if type is REFERENCE, the entity spec ID being referenced
  displayedReferenceEntityAttributes?: string[]; // if type is REFERENCE, list of attribute names to display for referenced entities
  oneReferenceOnly?: boolean; // if type is REFERENCE, if true, allows only one reference (one-to-one relationship)
  // NUMBER_INTEGER/NUMBER_DOUBLE-specific optional constraints
  numberUpperRange?: number; // if not null - upper bound for NUMBER_INTEGER or NUMBER_DOUBLE type attributes
  numberLowerRange?: number; // if not null - lower bound for NUMBER_INTEGER or NUMBER_DOUBLE type attributes
  // LOCATION-specific optional constraints
  geospatialIndexed?: boolean; // if type is LOCATION, whether a 2dsphere index is created for geospatial queries
}

export interface StateLifecycle {
  states: string[];
  transitions: Record<string, string[]>;
  initialState: string;
  finalStates: string[];
}

export interface EntityDocQueryBuilder {
  objectSpecID?: string;
  assemblyID?: string;
  currentState?: string[];
  uniqueName?: string;
  entityID?: string;
  /** Multiple entity IDs for batch fetch. When set, query matches any of these IDs. */
  entityIDs?: string[];
  includeDeleted?: boolean;
  page?: number;
  pageSize?: number;
  entityFilters?: EntityFilter[];
}

// Simplified query structure for DataView search/enrich endpoints
export interface DataViewQuery {
  entityFilters?: (EntityFilter | EntityFilterGroup)[];
  currentState?: string[];
  page?: number;
  pageSize?: number;
  sortConfig?: SortConfig;
  /** BM25 text search query. When present and EntitySpec has bm25SearchConfig, backend uses documentSearchWithBm25. */
  searchQuery?: string;
  /** When true, backend resolves REFERENCE attributes to display values (for export only). */
  resolveReferences?: boolean;
  /** When true (and resolveReferences is true), resolve all refs per cell and all displayedReferenceEntityAttributes (e.g. for export). */
  expandReferenceAttributes?: boolean;
}

/** Row from `product_flow_session_events` (team-member search + admin CRUD). */
export interface ProductFlowSessionEvent {
  id?: string;
  productFlowSessionId?: string;
  assemblyId?: string;
  productFlowId?: string;
  eventType?: string;
  eventName?: string;
  eventStatus?: string;
  message?: string;
  stepIndex?: number;
  referenceType?: string;
  referenceId?: string;
  payloadJSON?: string;
  metadata?: string;
  sourceSystem?: string;
  sourceId?: string;
  correlationId?: string;
  name?: string;
  lastModifiedAt?: number;
}

/** Body for POST `/v0/product-flow-sessions/{sessionId}/events/search` */
export interface ProductFlowSessionEventSearchRequest extends DataViewQuery {
  searchText?: string;
}

/** Body for POST `/v0/product-flow-sessions/{sessionId}/events/pivot` */
export interface ProductFlowSessionEventPivotRequest {
  start: string;
  end: string;
  xDimension: string;
  yDimension: string;
  timeBucket: string;
}

export interface ProductFlowSessionEventPivotCell {
  xKey: string;
  yKey: string;
  count: number;
}

export interface ProductFlowSessionEventPivotResponse {
  xLabels: string[];
  yLabels: string[];
  cells: ProductFlowSessionEventPivotCell[];
}

/** Dispatcher agent UI block (v1); see docs/DISPATCHER_AGENT_PLAN.md */
export interface DispatcherAgentUiBlockV1 {
  v: number;
  kind: "OPEN_PRODUCT_FLOW_SESSION";
  productFlowSessionId: string;
  highlightStepIndex?: number;
  sessionLabel?: string;
}

export interface DispatcherAgentMessage {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: number;
  uiBlocks?: DispatcherAgentUiBlockV1[];
}

export interface DispatcherAgentSession {
  id: string;
  assemblyId: string;
  teamMemberId: string;
  messages: DispatcherAgentMessage[];
  focusedProductFlowSessionId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface DispatcherAgentMessageRequest {
  message: string;
  referencedSessionIds?: string[];
  focusedProductFlowSessionId?: string;
}

export interface EntityFilter {
  "@type": typeof ENTITY_FILTER_TYPE;
  field: string;
  operator: FilterOperator;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
}

/** Filter group for combining multiple filters with OR/AND logic */
export interface EntityFilterGroup {
  "@type": "EntityFilterGroup";
  /** Logical operator to combine filters. Defaults to "AND" if omitted */
  logicalOperator: "OR" | "AND";
  /** Array of filters or nested filter groups */
  filters: (EntityFilter | EntityFilterGroup)[];
}

/**
 * Leaf-only filter row (field / operator / value). Matches DataView and Agentic untyped leaf JSON;
 * {@code @type} is optional for payloads deserialized by {@code AgenticEntityFiltersDeserializer}.
 */
export interface EntityFilterLeaf {
  "@type"?: typeof ENTITY_FILTER_TYPE;
  field: string;
  operator: FilterOperator;
  value?: unknown;
  fieldType?: string;
}

export interface Entity {
  id: string;
  assemblyID: string;
  name?: string;
  uniqueName?: string;
  description?: string;
  entitySpecID?: string;
  currentState: string;
  currentStateUpdatedAt?: number;
  attributes?: Record<string, Attribute>;
  version?: number;
  lastModifiedAt?: number;
  deleted?: boolean;
  deletedAt?: number;
  /** Similarity score from vector search (0–1). Only present when returned from natural language search. */
  similarityScore?: number;
}

// EntitySearchResult - Simplified DTO for search results
export interface EntitySearchResult {
  id?: string;
  assemblyID?: string;
  name?: string;
  uniqueName?: string;
  entitySpecID?: string;
  currentState?: string;
  attributes?: Record<string, Attribute>;
  version?: number;
  lastModifiedAt?: number;
}

// RankedEntitySearchResult - Extends EntitySearchResult with ranking information from ranker layer
export interface RankedEntitySearchResult extends EntitySearchResult {
  score?: number; // Relevance score from ranker layer. Range is flexible but typically 0.0 to 1.0 or 0.0 to 100.0. Higher scores indicate better match/relevance.
  reasoning?: string; // Reasoning for why this score was assigned. Explains the LLM's thought process and evaluation criteria.
  summary?: string; // Summary about the entity after running the ranker prompt. Provides insights or analysis about the entity based on the prompt evaluation.
}

// BM25 search config (Atlas Search on entity collection)
export interface MongoBm25SearchConfig {
  uri?: string;
  databaseName?: string;
  collectionName?: string;
  searchIndexName?: string;
  bm25IndexStatus?: { status: string; message?: string; lastAttemptedAt?: number };
}

// Entity Spec (for entity specification details)
export interface EntitySpec {
  id: string;
  name: string;
  description?: string;
  assemblyID: string;
  workflowID: string;
  attributes: AttributeSpec[];
  stateLifecycle?: StateLifecycle;
  uniqueNameAttribute?: string;
  displayAttributes?: string[]; // Optional list of attribute names to show when this entity appears as a reference
  bm25SearchConfig?: MongoBm25SearchConfig;
}

// Legacy API response format - some endpoints return attributesSpec object instead of attributes array
export interface EntitySpecWithLegacy extends EntitySpec {
  attributesSpec?: Record<string, AttributeSpec>;
}

// Data View Entity Create Request
export interface DataViewEntityCreateRequest {
  attributes?: Record<string, { name?: string; value: unknown }>;
  name?: string;
  uniqueName?: string;
  description?: string;
  currentState?: string;
  entitySpecID?: string;
  assemblyID?: string;
}

// Data View Validation Error (422 response)
export interface DataViewValidationError {
  errorCode: string;
  fieldName: string;
  userMessage: string;
  details: string;
  suggestedValue?: string;
}

// Base interface for common DataView properties
interface DataViewBase {
  id: string;
  assemblyID: string;
  workflowID: string;
  name: string;
  description?: string;
  instructions?: string;
  type: DataViewType;
  layout?: DataViewLayout;
  headers: AttributeSpec[];
  entityStates?: string[];
  allowCreate?: boolean;
  allowUpdate?: boolean;
  allowDelete?: boolean;
  entitySpecID?: string;
  uniqueNameAttribute?: string;
  groupName?: string;
  groupDescription?: string;
  /** When true, orchestration dashboard shows a preview of each reference (first display field) in the cell. Set in orchestration admin. */
  showReferencePreview?: boolean;
}

// Regular TABLE DataView with queryBuilder
export interface TableDataView extends DataViewBase {
  type: "TABLE";
  queryBuilder: EntityDocQueryBuilder;
  editableFields?: string[]; // List of field names that are allowed to be edited
  allowImport?: boolean; // Enable import functionality when true
}

// Enrichment query types for JOIN_TABLE DataViews
export interface JoinCondition {
  primaryField: string;
  enrichmentField: string;
  primaryFieldType: "ATTRIBUTE" | "METADATA" | "CUSTOM";
  enrichmentFieldType: "ATTRIBUTE" | "METADATA" | "CUSTOM";
  operator: string;
}

export interface EnrichmentJoinConfig {
  joinType: "INNER" | "LEFT_OUTER";
  joinConditions: JoinCondition[];
  enrichmentAlias: string;
  useIndexHints: boolean;
}

export interface SortConfig {
  field: string;
  fieldType: "ATTRIBUTE" | "METADATA" | "CUSTOM";
  order: string;
}

export interface EntityEnrichmentQueryBuilder {
  primaryQuery: EntityDocQueryBuilder;
  enrichmentQuery: EntityDocQueryBuilder;
  sortConfig?: SortConfig | null;
}

// JOIN_TABLE DataView with enrichmentQuery
export interface JoinTableDataView extends DataViewBase {
  type: "JOIN_TABLE";
  enrichmentQuery: EntityEnrichmentQueryBuilder;
}

// Union type for all DataView types
export type DataView = TableDataView | JoinTableDataView;

export interface DataViewSearchParams {
  search?: string;
  assemblyID?: string;
  workflowID?: string;
  name?: string;
  type?: DataViewType[];
  page?: number;
  pageSize?: number;
  sortBy?: DataViewSortField;
  sortOrder?: SortOrder;
}

export interface DataViewListItem {
  id: string;
  assemblyID: string;
  workflowID: string;
  name: string;
  description?: string;
  instructions?: string;
  type: "TABLE" | "JOIN_TABLE" | "CHART";
  totalFields: number;
  allowUpdate: boolean;
  allowDelete: boolean;
  groupName?: string;
  groupDescription?: string;
}

export interface DataViewSearchResponse {
  dataViews: DataViewListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DataViewResponse {
  dataView: DataView;
  data: {
    items: Entity[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

// Enrichment Response Types for JOIN_TABLE DataViews
export interface DataViewEnrichmentResponse {
  enrichmentResults: Entity[]; // Backend now returns Entity objects directly
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface EntityVectorSearchBuilder {
  objectSpecID?: string;
  assemblyID?: string;
  searchQuery: string;
  searchType?: VectorSearchType;
  topK?: number;
  similarityThreshold?: number;
  currentState?: string[];
  entityFilters?: (EntityFilter | EntityFilterGroup)[];
}

// Task Reassignment Types
export interface TaskReassignmentRequest {
  newAssigneeId: string;
  newAssigneeType: AssignmentType;
  reason?: string;
}

export interface ResourceGroupReassignmentRequest {
  resourceGroupId: string;
  reason?: string;
}

// Assignment API Types
export interface TeamMemberSearchRequest {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface TeamMemberSearchResponse {
  teamMembers: TeamMember[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ResourceGroup {
  id: string;
  name: string;
  description: string;
}

export interface ResourceGroupResponse {
  id: string;
  name: string;
  description: string;
}

// Team Invite Types
export interface TeamInviteRequest {
  name: string;
  email: string;
  role: TeamMemberRole;
}

export interface TeamInviteResponse {
  status: ApiResponseStatus;
  message: string;
}

// Status Message Response Type
export interface StatusMessage {
  status: "SUCCESS" | "USER_NOT_FOUND" | "NOT_FOUND" | "USER_ALREADY_EXISTS" | "UNAUTHORIZED" | "ERROR" | "BAD_REQUEST" | "TRUE" | "FALSE" | "FORBIDDEN";
  message: string;
}

// Orchestration Config Types
export interface OrchestrationConfigItem {
  name: string;
  type: AttributeType;
  value: string | string[] | number | boolean | number | MediaFile[] | string[] | Record<string, unknown> | null;
  defaultValue: string | string[] | number | boolean | number | MediaFile[] | string[] | Record<string, unknown> | null;
  /** If true, hidden from dashboard API responses. Defaults to false. */
  hidden?: boolean;
  /** If false, cannot be edited via dashboard. Defaults to true. */
  editable?: boolean;
}

export interface OrchestrationConfig {
  id: string;
  assemblyId: string;
  workflowId: string;
  configurations: OrchestrationConfigItem[];
}

// Email Outreach Types (Product Flow Session Agent)
export interface EmailReceiver {
  name?: string;
  email: string;
  /** Backend may expect this; we set it from email when sending */
  emailAddress?: string;
}

export interface SendTimeWindow {
  /** IANA timezone (e.g. America/New_York) */
  timezone?: string;
  /** Start time of day HH:mm (24-hour) */
  startTimeOfDay?: string;
  /** End time of day HH:mm (24-hour) */
  endTimeOfDay?: string;
  /** Days when sending allowed: 0=Sun, 1=Mon, ..., 6=Sat */
  allowedDaysOfWeek?: number[];
}

export interface EmailContent {
  title?: string;
  body?: string;
  /** Seconds to wait after previous outreach before sending this follow-up */
  followUpAfterSeconds?: number;
}

export interface EmailOutreach {
  id?: string;
  name?: string;
  assemblyLineId?: string;
  to?: EmailReceiver[];
  cc?: EmailReceiver[];
  bcc?: EmailReceiver[];
  replyTo?: string;
  senderId?: string;
  initialOutreach?: EmailContent;
  followUps?: EmailContent[];
  /** Default time window for sending (applies when EmailContent has no sendTimeWindow) */
  defaultSendTimeWindow?: SendTimeWindow;
  /** @deprecated Use defaultSendTimeWindow */
  sendTimeWindow?: SendTimeWindow;
  status?: "DRAFT" | "INITIAL_OUTREACH" | "FOLLOW_UP_1" | "FOLLOW_UP_2" | "COMPLETE";
}

export interface UpdateEmailOutreachRequest {
  emailOutreachId?: string;
  emailOutreach: Partial<EmailOutreach>;
}

export interface SendEmailOutreachRequest {
  emailOutreachId?: string | null;
  /** Current draft from the editor; merged on the server before send so unsaved To/content are applied. */
  emailOutreach?: Partial<EmailOutreach>;
}

export interface SendEmailOutreachResponse {
  sent: boolean;
  /** User-facing explanation when `sent` is false */
  message?: string;
  subject?: string;
  recipientCount?: number;
  recipients?: string[];
}

export interface AddFollowUpRequest {
  emailOutreachId?: string | null;
}

export interface BootstrapRequest {
  instructions?: string;
}

// Product Flow Types
export type ProductFlowStepType = "ACTION" | "DATAVIEW" | "INFORMATION" | "CONVERSATION_CREATOR" | "CONVERSATION_CREATOR_FROM_TEMPLATE" | "EMAIL_OUTREACH_CREATOR";

export interface AgentFeature {
  title: string;
  functionName: AgentFunctionName;
  description: string;
}

export interface ProductFlowStep {
  type: ProductFlowStepType;
  name: string;
  description?: string;
  autoAdvance?: boolean | null;
  agentFeatures?: AgentFeature[];
  updatablePostCompletion?: boolean;
  updatesSessionTitle?: boolean;
}

export interface ActionFlowStep extends ProductFlowStep {
  type: "ACTION";
  workflowTriggerId: string;
}

export interface DataViewFlowStep extends ProductFlowStep {
  type: "DATAVIEW";
  dataViewId: string;
}

export interface InformationFlowStep extends ProductFlowStep {
  type: "INFORMATION";
  content?: string;
}

export interface ConversationCreatorFlowStep extends ProductFlowStep {
  type: "CONVERSATION_CREATOR";
}

export interface ConversationCreatorFromTemplateFlowStep extends ProductFlowStep {
  type: "CONVERSATION_CREATOR_FROM_TEMPLATE";
  templateConversationId: string;
}

export interface EmailOutreachCreatorFlowStep extends ProductFlowStep {
  type: "EMAIL_OUTREACH_CREATOR";
}

export type ProductFlowStepUnion =
  | ActionFlowStep
  | DataViewFlowStep
  | InformationFlowStep
  | ConversationCreatorFlowStep
  | ConversationCreatorFromTemplateFlowStep
  | EmailOutreachCreatorFlowStep;

export interface ProductFlow {
  id?: string;
  name: string;
  description?: string;
  assemblyId: string;
  workflowId: string;
  flowSteps: ProductFlowStepUnion[];
  createdAt?: number;
  /** @deprecated Legacy EntitySpec wiring; session events use `product_flow_session_events` collection. */
  sessionEventEntitySpecId?: string;
  /** @deprecated Legacy DataView wiring; session events use `product_flow_session_events` collection. */
  sessionEventDataViewId?: string;
}

// Flow Session Result - references a result produced during a flow session
export interface FlowSessionResult {
  type: "CONVERSATION_SESSION" | "AGENTIC_SEARCH_SESSION";
  resultId: string;
}

// Product Flow Session Types
export interface ProductFlowSession {
  id: string;
  productFlowId: string;
  name?: string;
  note?: string | null;
  /** User message captured when the session was created (e.g. dispatcher prompt before choosing a flow). */
  userQuery?: string | null;
  teamMemberId: string;
  assemblyId: string;
  workflowId?: string;
  stepSessions: ProductFlowStepSession[];
  messages: ProductFlowSessionMessage[];
  currentStepIndex: number;
  status: "ACTIVE" | "COMPLETED" | "ABANDONED";
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  metadata?: Record<string, string>;
  /** Step output registry (serialized name); legacy API may still send `events`. */
  stepRegistry?: Record<string, unknown>;
  events?: Record<string, unknown>;
  sessionResults?: FlowSessionResult[];
}

export interface ProductFlowStepSession {
  id: string;
  productFlowSessionId: string;
  stepIndex: number;
  stepId?: string;
  stepType: "ACTION" | "DATAVIEW" | "INFORMATION" | "CONVERSATION_CREATOR" | "CONVERSATION_CREATOR_FROM_TEMPLATE" | "EMAIL_OUTREACH_CREATOR";
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  inputData?: Record<string, unknown>;
  outputData?: Record<string, unknown>;
  updates: ProductFlowStepUpdate[];
  errorMessage?: string;
  retryCount: number;
  lastErrorAt?: number;
  startedAt?: number;
  completedAt?: number;
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, string>;
  workflowExecutionId?: string;
  dataViewState?: string;
  acknowledgedAt?: number;
  conversationConfigId?: string | null;
  emailOutreachId?: string | null;
}

export interface ProductFlowSessionMessage {
  id: string;
  productFlowSessionId: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  authorId: string;
  stepIndex?: number;
  createdAt: number;
  metadata?: Record<string, string>;
}

export interface ProductFlowStepUpdate {
  id: string;
  productFlowStepSessionId: string;
  type: "STATUS_CHANGE" | "PROGRESS" | "ERROR" | "SUCCESS" | "INFO";
  title?: string;
  message?: string;
  sourceSystem: string;
  sourceId?: string;
  data?: Record<string, unknown>;
  createdAt: number;
  metadata?: Record<string, string>;
}

export interface StepResponse {
  stepIndex: number;
  step: ProductFlowStepUnion;
  stepSession?: ProductFlowStepSession;
  progress: {
    current: number;
    total: number;
    percentage: number;
  };
  transition: {
    willAutoAdvance: boolean;
    requiresManualAdvance: boolean;
    hasNextStep: boolean;
    nextStep?: ProductFlowStepUnion;
    nextStepWillAutoAdvance?: boolean;
  };
  canStart: boolean;
  canComplete: boolean;
  canMoveToNext: boolean;
  previousStepOutput?: Record<string, unknown>;
  stepRegistry?: Record<string, unknown>;
  events?: Record<string, unknown>;
  sessionStatus: "ACTIVE" | "IN_PROGRESS" | "COMPLETED" | "ABANDONED" | "CLOSED" | "POST_ACTION_FAILED";
  openTaskCount?: number;
  completedTaskCount?: number;
  editableSteps?: Array<{
    stepIndex: number;
    name: string;
    type: ProductFlowStepType;
  }>;
}

export interface CreateSessionRequest {
  productFlowId: string;
  assemblyId: string;
  workflowId?: string;
  note?: string | null;
  userQuery?: string | null;
}

export interface CreateSessionResponse {
  session: ProductFlowSession;
  currentStep: StepResponse;
}

export interface NextStepRequest {
  outputData?: Record<string, unknown>;
}

export interface NextStepResponse {
  completedStep: ProductFlowStepSession;
  currentStep: StepResponse;
  transition: {
    type: "AUTO" | "MANUAL";
    fromStepIndex: number;
    toStepIndex: number;
    timestamp: number;
  };
}

export interface CompleteStepRequest {
  outputData?: Record<string, unknown>;
}

export interface CompleteStepResponse {
  completedStep: ProductFlowStepSession;
  currentStep: StepResponse;
  transition: {
    type: "AUTO" | "MANUAL";
    fromStepIndex: number;
    toStepIndex: number;
    timestamp: number;
  };
}

export interface StartStepRequest {
  inputData?: Record<string, unknown>;
}

export interface RunAutomationRequest {
  triggerInputs?: Record<string, unknown>;
  forTesting?: boolean;
}

export interface StepOperationResponse {
  operationResult: unknown;
  completedStep: ProductFlowStepSession;
  currentStep: StepResponse;
  transition: {
    type: "AUTO" | "MANUAL";
    fromStepIndex: number;
    toStepIndex: number;
    timestamp: number;
  };
}

export interface StepScoringRubric {
  scoringRubricInstructions?: string;
  criteria?: Record<string, string>;
  jsonSchema?: string;
  jsonMode?: "NONE" | "JSON_MODE" | "STRUCTURED_OUTPUT_MODE";
}

export type TTSModel = "OPENAI" | "ELEVENLABS" | "AZURE" | "CARTESIA" | "DEEPGRAM";

export interface CreateConversationRequest {
  name?: string;
  conversationPrompt?: string;
  sourceConversationId?: string;
  customInstructions?: string;
  assemblyLineID?: string;
  systemPromptID?: string;
  completionTriggerID?: string;
  workflowID?: string;
  language?: string;
  ttsModel?: TTSModel;
  keyterms?: string[];
  videoEnabled?: boolean;
  screenShareEnabled?: boolean;
  recordingEnabled?: boolean;
  chatWindowEnabled?: boolean;
  allowAnyParticipantToStartConversation?: boolean;
  allowAnyoneToStartConversation?: boolean;
  type?: ConversationType;
  metadata?: Record<string, string>;
  mcpUrl?: string;
  completionNotificationEmails?: string[];
  scoringRubric?: StepScoringRubric;
  conversationItems?: ConversationItem[];
}

export interface StepConversationItem {
  id?: string;
  type: "QUESTION" | "DISCUSSION" | "MEDIA_REQUEST" | "REVIEW_MATERIAL" | "WALK_THROUGH" | "FORM_DATA" | "CUSTOMER_SUPPORT" | "SUMMARY";
  title: string;
  description?: string;
}

export interface UpdateConversationRequest {
  conversationId?: string;
  name?: string;
  description?: string;
  systemPromptId?: string;
  assemblyLineId?: string;
  conversationItems?: StepConversationItem[];
  language?: string;
  videoEnabled?: boolean;
  screenShareEnabled?: boolean;
  recordingEnabled?: boolean;
  chatWindowEnabled?: boolean;
  allowAnyParticipantToStartConversation?: boolean;
  allowAnyoneToStartConversation?: boolean;
  type?: "VIDEO_CALL" | "AUDIO_CALL" | "CHAT";
  workflowID?: string;
  scoringRubric?: StepScoringRubric;
  keyterms?: string[];
  completionNotificationEmails?: string[];
}

export interface DeleteConversationRequest {
  conversationId?: string;
}

export interface MessageRequest {
  message: string;
  stepIndex?: number;
}

export interface MessageResponse {
  message: string;
}

export interface SessionMetadata {
  sessionId: string;
  currentStepIndex: number;
  status: string;
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
  shouldRefresh?: boolean;
  conversationConfigId?: string;
  emailOutreachId?: string;
  draftConversationName?: string;
  draftConversationDescription?: string;
  draftConversationItemsJson?: string;
  draftConversationPatchUpdatedAt?: string;
}

export type SSEEventType = "metadata" | "token" | "message" | "function_call" | "error" | "done";

export type SSEEvent =
  | { type: "metadata"; data: SessionMetadata }
  | { type: "token"; data: { content: string } }
  | { type: "message"; data: { content: string; reasoning?: string } }
  | { type: "function_call"; data: { name: string; description?: string } }
  | { type: "error"; data: { message: string } }
  | { type: "done"; data: null };

export const AgentFunctionNames = {
  GET_CONVERSATION_CONFIG: "GetConversationConfig",
  CREATE_CONVERSATION_CONFIG: "CreateConversationConfig",
  UPDATE_CONVERSATION_CONFIG: "UpdateConversationConfig",
  DELETE_CONVERSATION_CONFIG: "DeleteConversationConfig",
} as const;

export type AgentFunctionName = (typeof AgentFunctionNames)[keyof typeof AgentFunctionNames];

export interface ProductFlowSessionSearchParams {
  search?: string;
  assemblyId: string;
  workflowId?: string;
  status?: "ACTIVE" | "COMPLETED" | "ABANDONED";
  teamMemberId?: string;
  productFlowId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "ID" | "CREATED_AT" | "UPDATED_AT" | "COMPLETED_AT";
  sortOrder?: "ASC" | "DESC";
}

export interface PaginatedProductFlowSessionSearchResponse {
  sessions: ProductFlowSession[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Conversations App Types
export interface ConversationSearchParams {
  conversationId?: string;
  workflowID?: string;
  assemblyLineID?: string;
  search?: string;
  /** Filter by creator team member ID (exact match). */
  createdBy?: string;
  /** When true, filter to conversations created by the authenticated user. Resolved server-side from session. */
  createdByMe?: boolean;
  /** Filter by minimum creation time (ISO-8601). Only conversations with createdAt >= this value. */
  createdAfter?: string;
  /** Filter by conversation types (e.g. ["VIDEO_CALL", "AUDIO_CALL"]). When set, only conversations with type in this list are returned. */
  types?: string[];
  page?: number;
  pageSize?: number;
}

export interface ConversationSearchResponse {
  conversations: Conversation[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ConversationsByIdsRequest {
  ids: string[];
}

export interface ConversationsByIdsResponse {
  conversations: Conversation[];
  totalCount: number;
  requestedCount: number;
  foundCount: number;
}

// Conversation Group Types
export const CONVERSATION_TYPES = {
  INCOMING_CALL: "INCOMING_CALL",
  OUTGOING_CALL: "OUTGOING_CALL",
  VIDEO_CALL: "VIDEO_CALL",
  ASSISTANT_CHAT: "ASSISTANT_CHAT",
  FORM_FILLER: "FORM_FILLER",
} as const;

export type ConversationType = (typeof CONVERSATION_TYPES)[keyof typeof CONVERSATION_TYPES];

// Conversation types to exclude from group listings
export const EXCLUDED_CONVERSATION_TYPES: ConversationType[] = [
  CONVERSATION_TYPES.ASSISTANT_CHAT,
  CONVERSATION_TYPES.FORM_FILLER,
];

// Conversation type labels for human-friendly display
export const CONVERSATION_TYPE_LABELS: Record<ConversationType, string> = {
  [CONVERSATION_TYPES.INCOMING_CALL]: "Incoming Call",
  [CONVERSATION_TYPES.OUTGOING_CALL]: "Outgoing Call",
  [CONVERSATION_TYPES.VIDEO_CALL]: "Video Call",
  [CONVERSATION_TYPES.ASSISTANT_CHAT]: "Assistant Chat",
  [CONVERSATION_TYPES.FORM_FILLER]: "Form Filler",
};

export interface ConversationGroup {
  id?: string;
  name: string;
  description?: string;
  assemblyLineID: string;
  supportedConversationTypes?: ConversationType[];
  conversationIds?: string[];
}

export interface ConversationGroupSearchParams {
  conversationGroupId?: string;
  assemblyLineID?: string;
  supportedConversationTypes?: ConversationType[];
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedConversationGroupSearchResponse {
  conversationGroups: ConversationGroup[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ConversationCreatorRequest {
  name: string;
  conversationPrompt: string;
  assemblyLineID: string;
  language?: string;
  videoEnabled?: boolean;
  screenShareEnabled?: boolean;
  recordingEnabled?: boolean;
  chatWindowEnabled?: boolean;
  allowAnyParticipantToStartConversation?: boolean;
  allowAnyoneToStartConversation?: boolean;
  workflowID?: string;
  systemPromptID?: string;
  type?: "VIDEO_CALL" | "AUDIO_CALL" | "OUTGOING_CALL";
  ttsModel?: {
    type: "OPENAI" | "ELEVEN_LABS" | "CARTESIA";
    modelName?: string;
    voiceID?: string;
    emotion?: string;
  };
  keyterms?: string[];
  summaryPrompt?: string;
  scoringRubric?: {
    scoringRubricInstructions?: string;
    criteria?: Record<string, string>;
  };
  metadata?: Record<string, string>;
  mcpUrl?: string;
  completionNotificationEmails?: string[];
  /** Do not send from client; API sets createdBy from session team member ID. */
  createdBy?: string;
}

export interface Conversation {
  id?: string;
  name: string;
  description?: string;
  language?: string;
  prompt?: string;
  attachments?: MediaFile[];
  conversationItems?: ConversationItem[];
  videoEnabled?: boolean;
  screenShareEnabled?: boolean;
  recordingEnabled?: boolean;
  chatWindowEnabled?: boolean;
  workflowID?: string;
  assemblyLineID: string;
  webHookCallProperties?: unknown;
  systemPromptID?: string;
  allowAnyParticipantToStartConversation?: boolean;
  allowAnyoneToStartConversation?: boolean;
  type?: ConversationType;
  ttsModel?: {
    type: "OPENAI" | "ELEVEN_LABS" | "CARTESIA";
    modelName?: string;
    voiceID?: string;
    emotion?: string;
  };
  keyterms?: string[];
  summaryPrompt?: string;
  scoringRubric?: {
    scoringRubricInstructions?: string;
    criteria?: Record<string, string>;
  };
  metadata?: Record<string, string>;
  mcpUrl?: string;
  completionNotificationEmails?: string[];
  createdAt?: string;
  /** Team member ID of the creator (set by API from session). */
  createdBy?: string;
  /** Email of the creator (set by API from session, for UI display only). */
  createdByEmail?: string;
}

export interface ConversationItem {
  id?: string;
  type: "QUESTION" | "DISCUSSION" | "MEDIA_REQUEST" | "REVIEW_MATERIAL" | "WALK_THROUGH" | "FORM_DATA" | "CUSTOMER_SUPPORT" | "SUMMARY";
  title?: string;
  description?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface SessionSearchParams {
  sessionID?: string;
  conversationId?: string;
  workflowID?: string;
  assemblyLineID?: string;
  search?: string;
  participantIds?: string[];
  /** Filter by completion: true = completed only, false = open only, undefined = all */
  sessionComplete?: boolean;
  /** Filter by session end time: only sessions with conversationEndedAt >= this value (epoch ms) */
  endedAfter?: number;
  /** Filter by conversation types (e.g. ["VIDEO_CALL"]). When set, only sessions whose conversation has type in this list are returned. */
  types?: string[];
  /** createdAt or summaryScore, optional leading '-' for descending; default from UI is -createdAt */
  sort?: string;
  page?: number;
  pageSize?: number;
}

export interface SessionSearchResponse {
  sessions: ConversationSession[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ConversationSessionSummariesResponse {
  session_summaries: {
    open: number;
    completed: number;
    total: number;
  };
}

/** Participant as returned by the participants batch API (e.g. for session cards). */
export interface Participant {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  reference?: string;
  enabled?: boolean;
  domainOwner?: "NONE" | "ASSEMBLY_LINE" | "ORG";
  domainOwnerId?: string;
  phone?: string;
  company?: string;
  role?: string;
  tags?: string[];
  /** Prefer {@link ParticipantRecordStatus}; other strings may appear in legacy data. */
  status?: ParticipantRecordStatus | string;
  responseRate?: number;
  averageResponseHours?: number;
  preferredChannel?: ParticipantPreferredChannel;
  sessionsTotal?: number;
  sessionsCompleted?: number;
  lastActivityAt?: number;
  aiGeneratedSummary?: string;
  recentSessionIds?: string[];
  channelStats?: { channel?: string; count?: number }[];
  communicationConsent?: Record<string, unknown>;
}

export interface ParticipantSearchRequest {
  search?: string;
  domainOwner?: Participant["domainOwner"];
  domainOwnerId?: string;
  status?: string;
  tagsAny?: string[];
  page?: number;
  pageSize?: number;
}

export interface ParticipantSearchPageResponse {
  items: Participant[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ConversationSession {
  id: string;
  type: "INCOMING_CALL" | "OUTGOING_CALL" | "VIDEO_CALL" | "ASSISTANT_CHAT";
  conversationId: string;
  workflowID?: string;
  assemblyLineID?: string;
  roomName?: string;
  title?: string;
  messages: Message[];
  conversationItemResponses?: ConversationItemResponse[];
  recordings?: ConversationRecording[];
  conversationStartedAt?: number;
  conversationEndedAt?: number | null;
  createdAt?: number;
  participants: string[];
  sessionComplete: boolean;
  webhookStatus?: ConversationWebhookStatus;
  metadata?: Record<string, string>;
  scoredRubric?: ScoredRubric | null;
  summary?: string;
  feedback?: ConversationSessionFeedback | null;
}

export interface Message {
  id?: string;
  senderId?: string;
  sender?: string;
  role?: string;
  author?: string;
  content?: string;
  message?: string;
  timestamp?: number;
  createdAt?: number;
  messageType?: string;
  type?: string;
  media?: MediaFile[];
  attachments?: MediaFile[];
  context?: string;
}

export interface ConversationItemResponse {
  type: "QUESTION" | "DISCUSSION" | "MEDIA_REQUEST" | "REVIEW_MATERIAL" | "WALK_THROUGH" | "FORM_DATA" | "CUSTOMER_SUPPORT" | "SUMMARY";
  conversationItem: ConversationItem;
  messages: Message[];
  answer?: string | null;
  answerer?: string | null;
  requestedMedia?: MediaFile[];
  summary?: string | null;
  walkThroughSteps?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fieldResponses?: Record<string, any>;
  formSubmissionId?: string;
  submittedBy?: string;
  submittedAt?: number;
  submissionStatus?: string;
  validationErrors?: Record<string, string>;
  conversationItemId?: string;
  itemId?: string;
  response?: string;
  timestamp?: number;
}

export interface ConversationRecording {
  id?: string;
  mediaPath?: string;
  url?: string;
  startTime?: string;
  endTime?: string;
  duration?: string | number;
  createdAt?: number;
}

export interface ConversationWebhookStatus {
  id?: string;
  conversationSessionId?: string;
  webhookUrl?: string;
  status?: "PENDING" | "SUCCESS" | "FAILED" | "RETRYING";
  attemptCount?: number;
  maxRetries?: number;
  delivered?: boolean;
  deliveryAttempts?: number;
  lastAttemptAt?: number;
  error?: string;
}

export interface ScoredRubric {
  score?: number;
  scores?: Record<string, number>;
  overallScore?: number;
  scoringSummary?: string;
  feedback?: string;
  criteriaScores?: Record<string, number>;
  jsonResponse?: string;
}

export interface ConversationSessionFeedback {
  rating?: number;
  thumbsUp?: boolean;
  comments?: string;
  feedback?: string;
  timestamp?: number;
}

export interface ConversationTemplateSearchParams {
  searchQuery?: string;
  name?: string;
  description?: string;
  assemblyID?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "ID" | "CREATED_AT" | "UPDATED_AT" | "NAME";
  sortOrder?: "ASC" | "DESC";
}

export interface ConversationTemplateSearchResponse {
  templates: ConversationTemplate[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** TTS model shape for persona / conversation (matches backend serialization). */
export interface ConversationTtsModel {
  type: "OPENAI" | "ELEVEN_LABS" | "CARTESIA";
  modelName?: string;
  voiceID?: string;
  emotion?: string;
}

/** A persona is an agent character with name, description, voice (TTS), system prompt, and optional sample audio. */
export interface ConversationTemplatePersona {
  name: string;
  description?: string;
  systemPromptID?: string;
  ttsModel?: ConversationTtsModel;
  /** Media ID of sample audio (set when creating persona in admin). */
  sampleAudioMediaId?: string;
  /** Short-lived presigned URL for playback (included in GET personas response). */
  sampleAudioUrl?: string;
}

export interface ConversationTemplate {
  id: string;
  assemblyID: string;
  name: string;
  description?: string;
  /** Personas from the conversation creator config (name, description, systemPromptID, ttsModel). */
  personas?: ConversationTemplatePersona[];
  category?: string;
  icon?: string;
  type?: ConversationType;
  prompt?: string;
  videoEnabled?: boolean;
  screenShareEnabled?: boolean;
  recordingEnabled?: boolean;
  chatWindowEnabled?: boolean;
  transcriptionEnabled?: boolean;
  ttsModel?: string;
  popularity?: number;
  conversationTemplateIds?: string[];
  conversationCreatorPromptID?: string;
  conversationItems?: ConversationItem[];
  scoringRubric?: {
    scoringRubricInstructions?: string;
    criteria?: Record<string, string>;
  };
  summaryPrompt?: string;
  completionNotificationEmails?: string[];
  createdAt?: number;
  updatedAt?: number;
}

// Agentic Search Types - AttributeSpec is already defined above, this is just for reference
// Note: The AttributeSpec interface is defined earlier in this file (line 896)
// If you need agentic-search-specific AttributeSpec, extend the base one

/**
 * Entity agentic search filters use the same JSON shape as DataViewQuery.entityFilters:
 * {@link EntityFilter} leaves (typically DocumentEntityFilter) and optional {@link EntityFilterGroup}
 * nodes. Top-level items are ANDed; within a group, filters are combined by the group's logicalOperator.
 */
export type AgenticEntityFilters = (EntityFilter | EntityFilterGroup)[];

// LOCATION / Geolocation Types
export interface GeoJSONPoint {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

export interface LocationFilterValue {
  street1: string | null;
  street2: string | null;
  postalCode: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  geoJSON: GeoJSONPoint | null;
  distance?: number; // Only for $near (radius); meters, matches API Location model
}

export interface GeolocationStateResult {
  id: string;
  value: string;
  country: string;
  code: string;
  display: string;
  type: string;
  enabled: boolean;
}

export interface GeolocationCityResult {
  id: string;
  type: string;
  value: string;
  display: string;
  country: string;
  state: string;
  geoJSON: GeoJSONPoint;
}

export interface GeolocationTypeaheadResponse<T> {
  results: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** Legacy alias for typed document filter rows; prefer {@link EntityFilter} / {@link EntityFilterLeaf}. */
export interface DocumentEntityFilter {
  "@type": "DocumentEntityFilter";
  field: string;
  operator: "$eq" | "$ne" | "$in" | "$nin" | "$gt" | "$gte" | "$lt" | "$lte" | "$regex" | "$contains" | "$startsWith" | "$endsWith" | "$exists" | "$size";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
}

/** Typed vector metadata filter row (legacy interface name). */
export interface VectorEntityFilter {
  "@type": "VectorEntityFilter";
  field: string;
  operator: "$eq" | "$ne" | "$in" | "$nin" | "$gt" | "$gte" | "$lt" | "$lte";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
}

/** Matches backend {@code SearchQuestionInputKind}. */
export type SearchQuestionInputKind = "FREE_TEXT" | "LOCATION_NEAR_CITY";

/**
 * Structured location answer for {@code LOCATION_NEAR_CITY} questions.
 * {@code distanceMeters} matches DataView / entity {@code $near} (metres).
 */
export interface SearchQuestionLocationAnswer {
  geoJSON: GeoJSONPoint;
  distanceMeters: number;
  city?: string;
  state?: string;
  country?: string;
}

export interface SearchQuestion {
  title: string;
  description?: string;
  isRequired?: boolean; // Default false - if true, user cannot skip
  saveIntoSearchContext?: boolean;
  /** Default {@code FREE_TEXT}. */
  inputKind?: SearchQuestionInputKind;
  /** Entity LOCATION attribute for programmatic {@code $near} (entity configs). */
  locationAttributeName?: string;
  locationRadiusStepMiles?: number;
  locationDefaultRadiusMiles?: number;
  locationMaxRadiusMiles?: number;
}

export interface SearchQuestionResponse {
  title: string;
  answer: string;
  locationAnswer?: SearchQuestionLocationAnswer;
}

export interface AgenticSearchQuery {
  query?: string; // Natural language query string
  criteria?: string[]; // EXA search criteria (binary filters); only for ExternalDataAgenticSearchConfig
  entityFilters?: AgenticEntityFilters;
  limit?: number; // Limit on number of results to return
  runRanking?: boolean; // Whether to execute RankerLayer on external data search results
  searchQuestionResponses?: SearchQuestionResponse[];
  /** Optional additional instructions to append to the ranking prompt. Example: "Rank by English proficiency." */
  rankingPromptAppend?: string;
  /** Optional free-text exclusions / deprioritization hints for the ranker (sandboxed in the prompt). */
  rankingExclusions?: string;
}

// Re-rank request for re-ranking entities using config with custom prompts
export interface RerankRequest {
  configID: string; // AgenticSearchConfig ID to use for ranking configuration
  sessionID: string; // AgenticSearchSession ID to fetch entities from
  prompt?: string; // Override prompt for ranking/scoring entities (optional)
  scoreDefinitionPrompt?: string; // Override score definition prompt (optional)
  userQuery?: string; // The user's original search query — gives the LLM context about intent (optional)
}

// Re-query request for re-querying an existing EntityAgenticSearchSession
export interface RequeryRequest {
  query?: string; // Natural language query string (optional - uses session searchQuery/description if not provided)
  entityFilters?: AgenticEntityFilters;
  limit?: number; // Limit on number of results to return (optional, min: 1, max: 100)
  behavior?: "append" | "override"; // append: add new results to existing; override: replace (default)
}

export interface GenerateCriteriaRequest {
  query: string;
  configID?: string;
}

export interface GenerateCriteriaResponse {
  criteria: string[];
}

export interface GenerateQueryRequest {
  query?: string;
  configID: string;
  searchQuestionResponses?: SearchQuestionResponse[];
  entityFilters?: AgenticEntityFilters;
}

export interface ExaQueryAndCriteria {
  query: string;
  criteria: string[];
  entityFilters?: AgenticEntityFilters;
}

// EXA external data search request (overrides config defaults)
export interface ExaExternalDataSearchRequest {
  query: string; // Required: Natural language search query
  criteria?: string[]; // Override criteria (replaces config.defaultCriteria)
  fields?: ExaFieldConfig[]; // Override fields (replaces config.fields)
  limit?: number; // Maximum number of results to return (min: 1, max: 100)
  runRanking?: boolean; // Whether to execute RankerLayer on external data search results
  searchQuestionResponses?: SearchQuestionResponse[];
  /** Optional additional instructions to append to the ranking prompt. Example: "Rank by English proficiency." */
  rankingPromptAppend?: string;
}

export interface RankedEntity {
  id: string; // Required: Entity ID or uniqueName
  score?: number; // Relevance score from ranker layer (min: 0)
  reasoning?: string; // Reasoning for the score
  summary?: string; // Summary of the entity
}

/** Exa REST /search rows after hits are stored (execute preview); not ranker output. */
export interface ExaRestSearchResultRow {
  /**
   * Assembly storage entity id for rank-entities. Often omitted on the wire; the UI fills this from
   * {@link AgenticSearchResponse.rankedEntities}[i] zipped with {@link AgenticSearchResponse.exaRestSearchResults}.
   */
  entityId?: string;
  displayTitle?: string | null;
  url?: string | null;
  /** Legacy; REST preview rows typically omit this (use attributes / displayTitle). */
  summary?: string | null;
  imageUrl?: string | null;
  attributes?: Record<string, string>;
}

export interface PaginationInfo {
  pagesProcessed?: number;
  totalRecordsCollected?: number;
  targetRecords?: number;
  completed?: boolean;
}

export interface ExecutionMetadata {
  queryLayerExecutionTimeMs?: number;
  outputLayerExecutionTimeMs?: number;
  rankerLayerExecutionTimeMs?: number;
  totalExecutionTimeMs?: number;
  queryLayerEntityCount?: number;
  outputLayerEntityCount?: number;
  rankerLayerEntityCount?: number;
  paginationInfo?: PaginationInfo;
}

export interface AgenticSearchError {
  stage: "QUERY_LAYER" | "OUTPUT_LAYER" | "RANKER_LAYER" | "NONE";
  message: string;
  errorType?: string;
  queryIndex?: number | null;
  details?: string | null;
  retryable: boolean;
}

export interface SessionProgress {
  percentage?: number | null;
  message: string;
  entitiesProcessed?: number | null;
}

export interface AgenticSearchResponse {
  rankedEntities: RankedEntity[];
  /** Populated for Exa REST execute preview; full stored-hit shape for dashboards. */
  exaRestSearchResults?: ExaRestSearchResultRow[];
  metadata?: ExecutionMetadata;
  errors?: AgenticSearchError[];
}

/** External (Exa) agentic search config JSON discriminators: webset vs Exa REST /search. */
export type ExternalAgenticSearchConfigType = "EXTERNAL_DATA_AGENTIC" | "EXTERNAL_DATA";

// Base AgenticSearchConfig (polymorphic)
export type AgenticSearchConfig = EntityAgenticSearchConfig | ExternalDataAgenticSearchConfig;

// Entity Agentic Search Configuration (for internal entity database)
export interface EntityAgenticSearchConfig {
  type: "ENTITY_DB";
  id: string;
  name: string;
  description?: string;
  assemblyID: string;
  dataViewID: string;
  availableHeaders: AttributeSpec[];
  resultHeaders?: AttributeSpec[];
  /** Column order for results table (static + attribute ids). When set, table columns follow this order. */
  resultColumnOrder?: string[] | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  queryLayer: any; // QueryLayer config - complex nested structure
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  outputLayer: any; // OutputLayer config
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rankerLayer: any; // RankerLayer config
  paginate?: boolean;
  untilNumberOfRecords?: number;
  searchQuestions?: SearchQuestion[];
  /** When true: Search runs full pipeline. When false (default): Search is DataView-only; no session until Rank. */
  runRanking?: boolean;
}

// External Data Agentic Search Configuration (for external data sources)
export interface ExternalDataAgenticSearchConfig {
  type: ExternalAgenticSearchConfigType;
  id: string;
  name: string;
  description?: string;
  assemblyID: string;
  integrationType: "EXA";
  tpDataConfig: ExaDataConfig;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rankerLayer: any; // RankerLayer config
  availableHeaders: AttributeSpec[];
  resultHeaders?: AttributeSpec[];
  /** Column order for results table (static + attribute ids). When set, table columns follow this order. */
  resultColumnOrder?: string[] | null;
  paginate?: boolean;
  untilNumberOfRecords?: number;
  outputSyncEntitySpecID?: string; // EntitySpec ID where search results will be stored asynchronously
  outputSyncIdentityAttribute?: IdentifierType; // Default: ID
  outputSyncIdentityAttributeName?: string; // Attribute name when outputSyncIdentityAttribute is ATTRIBUTE
  metadata?: Record<string, unknown>; // Integration-specific configuration parameters
  searchQuestions?: SearchQuestion[];
  /** When false, results are typically ranked in a follow-up step (Exa REST flow). */
  runRanking?: boolean;
}

// Third-party data configuration
export interface TPDataConfig {
  type: string;
  maxConcurrentQueries?: number;
}

// EXA field configuration
export interface ExaFieldConfig {
  name: string;
  enriched?: boolean;
}

// EXA entity type
export type ExaEntityType = "PERSON" | "COMPANY" | "ARTICLE" | "RESEARCH_PAPER";

// EXA data configuration
export interface ExaDataConfig extends TPDataConfig {
  type: "EXA";
  secretServiceID: string; // AWS Secrets Manager secret name for EXA API key
  entityType: ExaEntityType; // PERSON, COMPANY, ARTICLE, or RESEARCH_PAPER
  fields: ExaFieldConfig[]; // Required, minItems: 1
  defaultCriteria: string[]; // Required, minItems: 1
  maxResults?: number; // Default: 10, min: 1, max: 100
  maxConcurrentQueries?: number; // Default: 5
}

// EXA session data
export interface ExaSessionData {
  type: "EXA";
  websetId: string;
  searchId?: string;
  processedUrls?: string[];
  runRanking?: boolean; // Whether to execute RankerLayer on external data search results
  /** True after ranker output was applied for this session (API session-level signal). */
  rankingOutputApplied?: boolean;
  /** Search query used for this session. For Update Query modal pre-fill. */
  searchQuery?: string;
  /** User's requested result limit. For Update Query modal pre-fill. */
  userQueryLimit?: number;
}

// Identifier type for entity matching
export type IdentifierType = "ID" | "UNIQUE_NAME" | "ATTRIBUTE";

export interface AgenticSearchItem {
  agenticSearchConfigID: string;
  type?: "ENTITY_DB" | ExternalAgenticSearchConfigType;
  name?: string;
  description?: string;
  assemblyID: string;
  /** Absent for external (Exa) configs. */
  dataViewID?: string | null;
  querySources: string[];
  rankerDescription?: string;
  availableHeaders: AttributeSpec[];
  resultHeaders?: AttributeSpec[];
}

export interface AgenticSearchConfigSearchParams {
  searchQuery?: string;
  dataViewID?: string;
  page: number;
  pageSize: number;
  sortBy?: "ID" | "ASSEMBLY_ID" | "DATA_VIEW_ID";
  sortOrder?: "ASC" | "DESC";
}

export interface AgenticSearchConfigSearchResponse {
  configs: AgenticSearchItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type OnboardingStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export interface AgenticSearchSettings {
  onboardingStatus?: OnboardingStatus;
  [key: string]: unknown;
}

export type SearchContext = Record<string, string>;

/** API payload for set search context - nested under context key */
export interface SearchContextPayload {
  context: SearchContext;
}

// Base AgenticSearchSession (matches OpenAPI spec)
export const AgenticSearchSessionStatus = ["PENDING", "IN_PROGRESS", "COMPLETED", "FAILED", "CANCELLED"] as const;

export interface AgenticSearchSessionBase {
  type: "ENTITY_DB" | "EXTERNAL_DATA" | "EXTERNAL_DATA_AGENTIC";
  id: string;
  assemblyID: string;
  searchConfigID: string;
  agenticSearchConfig?: AgenticSearchConfig;
  status: typeof AgenticSearchSessionStatus[number];
  currentStage: "QUERY_LAYER" | "OUTPUT_LAYER" | "RANKER_LAYER" | "NONE";
  progress?: SessionProgress;
  error?: AgenticSearchError;
  retryCount?: number;
  maxRetries?: number;
  storeIntermediateResults?: boolean;
  createdAt?: number;
  startedAt?: number;
  completedAt?: number;
  name?: string;
  description?: string;
  result?: AgenticSearchResponse; // Execution result when status is COMPLETED
}

// Entity Agentic Search Session
export interface EntityAgenticSearchSession extends AgenticSearchSessionBase {
  type: "ENTITY_DB";
  queryLayerResults?: Record<string, string[]>; // Map from query config index to list of entity IDs
  outputLayerResults?: string[]; // List of entity IDs after combine/merge, filtering, sorting, and limit
}

// External Data Agentic Search Session
export interface ExternalDataAgenticSearchSession extends AgenticSearchSessionBase {
  type: "EXTERNAL_DATA" | "EXTERNAL_DATA_AGENTIC";
  tpSessionData?: ExaSessionData;
}

// Union type for AgenticSearchSession
export type AgenticSearchSession = EntityAgenticSearchSession | ExternalDataAgenticSearchSession;

/** Redirect payload when runRanking=false: navigate to DataView with query/filters. No session until Rank. */
export interface DataViewSearchRedirect {
  configID: string;
  dataViewID: string;
  workflowID: string;
  query?: string;
  entityFilters?: AgenticEntityFilters;
}

// Simplified response from executeSearch (may only include essential fields)
export interface AgenticSearchExecuteResponse {
  sessionID: string; // Maps to id in full session
  status: typeof AgenticSearchSessionStatus[number];
  currentStage: "QUERY_LAYER" | "OUTPUT_LAYER" | "RANKER_LAYER" | "NONE";
  result?: AgenticSearchResponse;
  progress?: SessionProgress;
  /** When runRanking=false for entity config: redirect to DataView. No session until Rank. */
  dataViewSearchRedirect?: DataViewSearchRedirect;
}

export interface AgenticSearchSessionItem {
  sessionID: string;
  searchConfigID: string;
  assemblyID: string;
  status: typeof AgenticSearchSessionStatus[number];
  currentStage: "QUERY_LAYER" | "OUTPUT_LAYER" | "RANKER_LAYER" | "NONE";
  progress?: SessionProgress;
  error?: AgenticSearchError;
  createdAt: number;
  startedAt?: number | null;
  completedAt?: number | null;
  configName?: string | null;
  configDescription?: string | null;
  /** Natural language query used for the search. May be returned as `description` from API. */
  description?: string | null;
  query?: string | null;
  /** Session source: ENTITY_DB = platform data; EXTERNAL_* = Exa webset or REST. */
  type?: "ENTITY_DB" | "EXTERNAL_DATA" | "EXTERNAL_DATA_AGENTIC";
  /** Team member ID of the user who created this session. Used for "Created by me" client-side filtering. */
  requesterTeamMemberID?: string | null;
  /** Team member name of the user who created this session. */
  requesterTeamMemberName?: string | null;
}

export interface AgenticSearchSessionSearchParams {
  searchQuery?: string;
  status?: typeof AgenticSearchSessionStatus[number];
  /** When true, backend filters sessions to those created by the authenticated team member (from session). */
  createdByMe?: boolean;
  page: number;
  pageSize: number;
  sortBy?: "ID" | "ASSEMBLY_ID" | "STATUS" | "CREATED_AT" | "STARTED_AT" | "COMPLETED_AT";
  sortOrder?: "ASC" | "DESC";
}

export interface AgenticSearchSessionSearchResponse {
  sessions: AgenticSearchSessionItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginatedSegmentedResults<T, S extends string | number | symbol> {
  results: T[];
  total: number;
  counts: Record<S, number>;
  page: number;
  pageSize: number;
}

export interface AgenticSearchResults {
  sessionID: string;
  searchConfigID?: string;
  name?: string; // Session name
  description?: string; // Session description - contains the natural language query if it exists
  requesterName?: string; // Requester name
  requesterId?: string; // Requester ID
  assemblyID: string;
  status: typeof AgenticSearchSessionStatus[number];
  currentStage: "QUERY_LAYER" | "OUTPUT_LAYER" | "RANKER_LAYER" | "NONE";
  progress?: SessionProgress;
  result: (EntitySearchResult | RankedEntitySearchResult)[]; // When ranking information is available, contains RankedEntitySearchResult objects. Otherwise, contains EntitySearchResult objects.
  error?: AgenticSearchError;
  createdAt: number;
  startedAt?: number | null;
  completedAt?: number | null;
  configName?: string | null;
  configDescription?: string | null;
  /** Session type: ENTITY_DB, EXTERNAL_DATA (Exa REST), or EXTERNAL_DATA_AGENTIC (webset). */
  type?: "ENTITY_DB" | "EXTERNAL_DATA" | "EXTERNAL_DATA_AGENTIC";
  /** EXA session data for external data sessions. Contains searchQuery, userQueryLimit for Update Query modal. */
  tpSessionData?: ExaSessionData;
  /** Criteria used for external data (EXA) search. For Update Query modal pre-fill. */
  criteria?: string[];
  /** Search question responses (Q&A pairs) when search was executed via Q&A flow. */
  searchQuestionResponses?: SearchQuestionResponse[];
  /** Actual search query used (LLM-translated). For entity sessions, used for requery modal pre-fill. */
  searchQuery?: string;
  /** Entity filters used when executed (DataView-shaped tree). For entity sessions, used for requery modal pre-fill. */
  entityFilters?: AgenticEntityFilters;
  /** Result limit used when executed. For entity sessions, used for requery modal pre-fill. */
  limit?: number;
  /**
   * True when results reflect LLM ranker output. False for raw external candidates (e.g. webset with
   * runRanking off) until ranking is applied. Session-level flag from the API.
   */
  resultsRanked?: boolean;
  /** True while an async rank/rerank task is running (API mirrors AgenticSearchSession). */
  rankingInProgress?: boolean;
}

// Search List Types
export interface SearchListItem {
  entityId: string;
  name?: string;
  notes?: string;
  score?: number; // Score between 0 and 100
  reasoning?: string; // Reasoning from RankedEntitySearchResult
  summary?: string; // Summary from RankedEntitySearchResult
}

export interface SearchList {
  id: string;
  name: string;
  description?: string;
  items: SearchListItem[];
  originSessionId?: string;
  originSearchConfigId?: string;
  assemblyID: string;
  collaborators?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface SearchListWithEntities extends Omit<SearchList, "items"> {
  items: SearchListItem[];
  entities: EntitySearchResult[]; // Resolved EntitySearchResult DTOs
}

// SearchListItemResult - combines SearchListItem metadata with EntitySearchResult data
export interface SearchListItemResult extends EntitySearchResult {
  itemName?: string | null; // Name from SearchListItem
  notes?: string | null; // Notes from SearchListItem
  score?: number | null; // Score from SearchListItem (0-100)
  reasoning?: string | null; // Reasoning from SearchListItem
  summary?: string | null; // Summary from SearchListItem
}

// SearchListWithResults - response from /list/{id}/results endpoint
export interface SearchListWithResults {
  id: string;
  assemblyID: string;
  name: string;
  description?: string | null;
  originSessionId?: string | null;
  originSearchConfigId?: string | null;
  collaborators?: SearchListCollaborator[];
  createdAt: number;
  updatedAt: number;
  items: SearchListItemResult[]; // Items with resolved entity data
}

export interface SearchListSearchParams {
  searchQuery?: string;
  assemblyID?: string;
  originSessionId?: string;
  originSearchConfigId?: string;
  name?: string;
  description?: string;
  page: number;
  pageSize: number;
  sortBy?: "ID" | "ASSEMBLY_ID" | "NAME" | "CREATED_AT" | "UPDATED_AT" | "ORIGIN_SESSION_ID" | "ORIGIN_SEARCH_CONFIG_ID";
  sortOrder?: "ASC" | "DESC";
}

export interface SearchListSearchResponse {
  lists: SearchList[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SearchListItemsSearchParams {
  searchQuery?: string;
  entitySpecID?: string;
  minScore?: number;
  maxScore?: number;
  page: number;
  pageSize: number;
  sortBy?: "SCORE" | "NAME" | "ENTITY_ID" | "CREATED_AT";
  sortOrder?: "ASC" | "DESC";
}

export interface SearchListItemsSearchResponse {
  items: SearchListItemResult[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AddEntitiesToListRequest {
  entityIds: string[];
  listId?: string; // If provided, add to existing list
  listName?: string; // Required if creating new list
  listDescription?: string; // Optional description for new list
  // Optional: map of entityId to score/reasoning/summary to carry over from ranked results
  entityData?: Record<string, { score?: number; reasoning?: string; summary?: string }>;
}

export interface DeleteItemsFromListRequest {
  entityIds: string[];
}

export interface SearchListCollaborator {
  id: string;
  name?: string | null;
  email?: string | null;
}

export interface SearchListCollaboratorsResponse {
  collaborators: SearchListCollaborator[];
}

export interface AddCollaboratorsRequest {
  teamMemberIDs: string[];
}
