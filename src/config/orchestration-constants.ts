// Application Constants and Enums

// Console Configuration
export const CONSOLE_CONFIG = {
  DEFAULT_MESSAGE_COUNT: 50,
} as const;

/** Right-rail Builder panel — shown above the message thread when empty (all product flow steps). */
export const FLOW_BUILDER_TAGLINE =
  "Ask the assistant to help configure this step.";

/** Short example prompts users can send with one tap from the Builder panel. */
export const FLOW_BUILDER_STARTER_PROMPTS: readonly string[] = [
  "What should I do here?",
  "Review my setup and suggest improvements",
  "Update the title and description",
];

// Flow Session — Builder panel (conversation creator step)
export const FLOW_CONVERSATION_CHAT_BANNER =
  "Create or edit this conversation with the assistant.";

// Flow Session — Builder panel (email outreach creator step)
export const FLOW_EMAIL_OUTREACH_CHAT_BANNER =
  "Create or edit this outreach with the assistant.";

// Console Screen Types
export const CONSOLE_SCREENS = {
  /** Assembly-scoped dispatcher chat (leftmost console tab). */
  DISPATCHER: "dispatcher",
  FLOWS: "flows",
  ACTIONS: "actions",
  DATA: "data",
  UPDATES: "updates",
  CHAT: "chat",
  CONFIG: "config",
} as const;

export type ConsoleScreen = (typeof CONSOLE_SCREENS)[keyof typeof CONSOLE_SCREENS];

// Feature Flags - Toggle these to show/hide upcoming features
export const FEATURE_FLAGS = {
  CONSOLE_MESSAGE_INPUT: false, // Show the message input in Console
  CONSOLE_CHAT_TAB: false, // Show the chat tab in Console (preserves functionality for future)
  TASK_AGENT_MESSAGE_INPUT: false, // Show the message input in Task Agent
  SHOW_MARKDOWN_DATA_VIEWS: false, // Show Markdown type in Data Views list
  SHOW_CHART_DATA_VIEWS: false, // Show Chart type in Data Views list
  ENABLE_CONVERSATIONS: true, // Show Conversations under Agents in sidebar
  ENABLE_AGENTIC_SEARCH: true, // Show Agentic Search under Agents in sidebar
  ENABLE_REFERENCE_SEARCH: false, // Enable search by name in reference selection modals (requires backend support)
} as const;

// Workflow Ticket States
export const TICKET_STATES = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
} as const;

export type TicketState = (typeof TICKET_STATES)[keyof typeof TICKET_STATES];

// Ticket Priorities (from actual data)
export const TICKET_PRIORITIES = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
} as const;

export type TicketPriority = (typeof TICKET_PRIORITIES)[keyof typeof TICKET_PRIORITIES];

// Ticket Statuses (from actual data - different from workflow states)
export const TICKET_STATUSES = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
} as const;

export type TicketStatus = (typeof TICKET_STATUSES)[keyof typeof TICKET_STATUSES];

// Workflow Task Status
export const TASK_STATUS = {
  PENDING: "PENDING",
  OPEN: "OPEN",
  IN_PROGRESS: "IN_PROGRESS",
  IN_REVIEW: "IN_REVIEW",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  FAILED: "FAILED",
} as const;

export type TaskStatus = (typeof TASK_STATUS)[keyof typeof TASK_STATUS];

// Task Status Labels for human-friendly display
export const TASK_STATUS_LABELS = {
  [TASK_STATUS.PENDING]: "Pending",
  [TASK_STATUS.OPEN]: "Open",
  [TASK_STATUS.IN_PROGRESS]: "In Progress",
  [TASK_STATUS.IN_REVIEW]: "In Review",
  [TASK_STATUS.COMPLETED]: "Completed",
  [TASK_STATUS.CANCELLED]: "Cancelled",
  [TASK_STATUS.FAILED]: "Failed",
} as const;

// SOP Update Types - Updated to match API specification
export const SOP_UPDATE_TYPES = {
  SOP: "SOP",
  PROCESS: "PROCESS",
  STEP: "STEP",
  TRIGGER: "TRIGGER",
  EXCEPTION: "EXCEPTION",
  OTHER: "OTHER",
} as const;

export type SOPUpdateType = (typeof SOP_UPDATE_TYPES)[keyof typeof SOP_UPDATE_TYPES];

// UI-specific update context types (for initialContext.type)
export const SOP_UPDATE_CONTEXT_TYPES = {
  SOP: "SOP",
  PROCESS: "PROCESS",
  STEP: "STEP",
  SUBSTEP: "SUBSTEP", // UI-specific for sub-step handling
  TRIGGER: "TRIGGER",
  EXCEPTION: "EXCEPTION",
} as const;

export type SOPUpdateContextType = (typeof SOP_UPDATE_CONTEXT_TYPES)[keyof typeof SOP_UPDATE_CONTEXT_TYPES];

// Workflow Trigger Types - Comprehensive list
export const TRIGGER_TYPES = {
  START_PROCESS: "START_PROCESS",
  CREATE_REVIEW: "CREATE_REVIEW",
  PROCESS_START: "PROCESS_START",
  PROCESS_FAILURE: "PROCESS_FAILURE",
  PROCESS_EXCEPTION: "PROCESS_EXCEPTION",
  PROCESS_COMPLETE: "PROCESS_COMPLETE",
  STEP_START: "STEP_START",
  STEP_COMPLETE: "STEP_COMPLETE",
  STEP_FAILURE: "STEP_FAILURE",
  STEP_EXCEPTION: "STEP_EXCEPTION",
  CRON: "CRON",
} as const;

export type TriggerType = (typeof TRIGGER_TYPES)[keyof typeof TRIGGER_TYPES];

// Input Data Types
export const INPUT_DATA_TYPES = {
  STRING: "STRING",
  TEXT: "TEXT",
  NUMBER: "NUMBER",
  INTEGER: "INTEGER",
  FLOAT: "FLOAT",
  BOOLEAN: "BOOLEAN",
  ARRAY: "ARRAY",
  LIST: "LIST",
  OBJECT: "OBJECT",
  JSON: "JSON",
  FILE: "FILE",
  FILE_OBJECT: "FILE_OBJECT",
  MEDIA_JSON: "MEDIA_JSON",
  ENTITY: "ENTITY",
  DATE: "DATE",
  DATAVIEW: "DATAVIEW",
} as const;

export type InputDataType = (typeof INPUT_DATA_TYPES)[keyof typeof INPUT_DATA_TYPES];

export const INPUT_DATA_TYPE_VALUES: string[] = Object.values(INPUT_DATA_TYPES);

// Product flow step types (must match ProductFlowStepType in types/api)
export const FLOW_STEP_TYPES = {
  INFORMATION: "INFORMATION",
  DATAVIEW: "DATAVIEW",
  ACTION: "ACTION",
} as const;

// Task Item Types
export const TASK_ITEM_TYPES = {
  CHECKLIST: "CHECKLIST",
  APPROVAL: "APPROVAL",
  REVIEW: "REVIEW",
  TASK: "TASK",
  EXCEPTION: "EXCEPTION",
  ERROR: "ERROR",
} as const;

export type TaskItemType = (typeof TASK_ITEM_TYPES)[keyof typeof TASK_ITEM_TYPES];

// Team Member Roles
export const TEAM_MEMBER_ROLES = {
  GUEST: "GUEST",
  RECRUITER: "RECRUITER",
  INTERNAL_ADMIN: "INTERNAL_ADMIN",
  ORCHESTRATION_ADMIN: "ORCHESTRATION_ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
  ORG_ADMIN: "ORG_ADMIN",
  ASSEMBLY_LINE_ADMIN: "ASSEMBLY_LINE_ADMIN",
  ASSEMBLY_LINE_CONTRIBUTOR: "ASSEMBLY_LINE_CONTRIBUTOR",
} as const;

export type TeamMemberRole = (typeof TEAM_MEMBER_ROLES)[keyof typeof TEAM_MEMBER_ROLES];

// Human-readable display names for team member roles
export const ROLE_DISPLAY_NAMES: Record<string, string> = {
  [TEAM_MEMBER_ROLES.GUEST]: "Guest",
  [TEAM_MEMBER_ROLES.RECRUITER]: "Recruiter",
  [TEAM_MEMBER_ROLES.INTERNAL_ADMIN]: "Internal Admin",
  [TEAM_MEMBER_ROLES.ORCHESTRATION_ADMIN]: "Orchestration Admin",
  [TEAM_MEMBER_ROLES.SUPER_ADMIN]: "Super Admin",
  [TEAM_MEMBER_ROLES.ORG_ADMIN]: "Org Admin",
  [TEAM_MEMBER_ROLES.ASSEMBLY_LINE_ADMIN]: "Workspace Admin",
  [TEAM_MEMBER_ROLES.ASSEMBLY_LINE_CONTRIBUTOR]: "Workspace Collaborator",
};

// Roles that have permission to invite team members
export const ROLES_WITH_INVITE_PERMISSION: readonly TeamMemberRole[] = [
  TEAM_MEMBER_ROLES.SUPER_ADMIN,
  TEAM_MEMBER_ROLES.INTERNAL_ADMIN,
  TEAM_MEMBER_ROLES.ORCHESTRATION_ADMIN,
  TEAM_MEMBER_ROLES.ORG_ADMIN,
  TEAM_MEMBER_ROLES.ASSEMBLY_LINE_ADMIN,
];

// Team Member Types
export const TEAM_MEMBER_TYPES = {
  TEAM_MEMBER: "TEAM_MEMBER",
  ASSEMBLY_PARTNER: "ASSEMBLY_PARTNER",
  EXTERNAL_PARTNER: "EXTERNAL_PARTNER",
  ASSEMBLY_ORCHESTRATOR: "ASSEMBLY_ORCHESTRATOR",
} as const;

export type TeamMemberType = (typeof TEAM_MEMBER_TYPES)[keyof typeof TEAM_MEMBER_TYPES];

// Human-readable display names for team member types
export const MEMBER_TYPE_DISPLAY_NAMES: Record<string, string> = {
  [TEAM_MEMBER_TYPES.TEAM_MEMBER]: "Team Member",
  [TEAM_MEMBER_TYPES.ASSEMBLY_PARTNER]: "Workspace Partner",
  [TEAM_MEMBER_TYPES.EXTERNAL_PARTNER]: "External Partner",
  [TEAM_MEMBER_TYPES.ASSEMBLY_ORCHESTRATOR]: "Orchestrator",
};

// Resource Tab IDs
export const RESOURCE_TABS = {
  TEAM: "team",
  ASSEMBLY: "assembly",
  EXTERNAL: "external",
  ORCHESTRATOR: "orchestrator",
} as const;

export type ResourceTab = (typeof RESOURCE_TABS)[keyof typeof RESOURCE_TABS];

// Dashboard Metric Tabs
export const DASHBOARD_TABS = {
  TASKS: "tasks",
  TICKETS: "tickets",
} as const;

export type DashboardTab = (typeof DASHBOARD_TABS)[keyof typeof DASHBOARD_TABS];

// Comment Types (using the same values as team member types since comments are created by team members)
export const COMMENT_TYPES = {
  TEAM_MEMBER: "TEAM_MEMBER",
  ASSEMBLY_PARTNER: "ASSEMBLY_PARTNER",
  EXTERNAL_PARTNER: "EXTERNAL_PARTNER",
  ASSEMBLY_ORCHESTRATOR: "ASSEMBLY_ORCHESTRATOR",
} as const;

export type CommentType = (typeof COMMENT_TYPES)[keyof typeof COMMENT_TYPES];

// Assignment Types
export const ASSIGNMENT_TYPES = {
  TEAM_MEMBER: "TEAM_MEMBER",
  ASSEMBLY_PARTNER: "ASSEMBLY_PARTNER",
  EXTERNAL_PARTNER: "EXTERNAL_PARTNER",
  ASSEMBLY_ORCHESTRATOR: "ASSEMBLY_ORCHESTRATOR",
} as const;

export type AssignmentType = (typeof ASSIGNMENT_TYPES)[keyof typeof ASSIGNMENT_TYPES];

// Assignment Type Labels
export const ASSIGNMENT_TYPE_LABELS = {
  [ASSIGNMENT_TYPES.TEAM_MEMBER]: "Team Member",
  [ASSIGNMENT_TYPES.ASSEMBLY_PARTNER]: "Partner",
  [ASSIGNMENT_TYPES.EXTERNAL_PARTNER]: "External Partner",
  [ASSIGNMENT_TYPES.ASSEMBLY_ORCHESTRATOR]: "Orchestration Platform",
} as const;

// SOP Step Types
export const SOP_STEP_TYPES = {
  AI: "AI",
  HIL: "HIL",
  INTEGRATION: "INTEGRATION",
} as const;

// Execution Types
export const EXECUTION_TYPES = {
  SME: "sme",
  AI_AUTOMATION: "ai_automation",
  MANUAL: "manual",
  SYNC_NODE: "sync_node",
  ASYNC_NODE: "async_node",
  ASYNC_API: "async_api",
} as const;

export type ExecutionTypeValue = (typeof EXECUTION_TYPES)[keyof typeof EXECUTION_TYPES];

// Execution Type Labels
export const EXECUTION_TYPE_LABELS = {
  [EXECUTION_TYPES.SME]: "SME",
  [EXECUTION_TYPES.AI_AUTOMATION]: "AI Automation",
  [EXECUTION_TYPES.MANUAL]: "Manual",
  [EXECUTION_TYPES.SYNC_NODE]: "Synchronous Node",
  [EXECUTION_TYPES.ASYNC_NODE]: "Asynchronous Node",
  [EXECUTION_TYPES.ASYNC_API]: "Async API",
} as const;

export const SOP_UPDATE_REQUEST_BUTTON_LABEL = "Request Update";

export type SOPStepType = (typeof SOP_STEP_TYPES)[keyof typeof SOP_STEP_TYPES];

// DataView Types
export const DATA_VIEW_TYPES = {
  TABLE: "TABLE",
  CHART: "CHART",
  MARKDOWN: "MARKDOWN",
  JOIN_TABLE: "JOIN_TABLE",
} as const;

export type DataViewType = (typeof DATA_VIEW_TYPES)[keyof typeof DATA_VIEW_TYPES];

// DataView Layout Types
export const DATA_VIEW_LAYOUTS = {
  TABLE: "TABLE",
  CARD: "CARD",
  LIST: "LIST",
} as const;

export type DataViewLayout = (typeof DATA_VIEW_LAYOUTS)[keyof typeof DATA_VIEW_LAYOUTS];

// DataView Attribute Types
export const ATTRIBUTE_TYPES = {
  STRING: "STRING",
  STRING_ARRAY: "STRING_ARRAY",
  NUMBER_INTEGER: "NUMBER_INTEGER",
  NUMBER_DOUBLE: "NUMBER_DOUBLE",
  BOOLEAN: "BOOLEAN",
  DATE: "DATE",
  DATE_TIME: "DATE_TIME",
  JSON: "JSON",
  MEDIA: "MEDIA",
  REFERENCE: "REFERENCE",
  LOCATION: "LOCATION",
} as const;

export type AttributeType = (typeof ATTRIBUTE_TYPES)[keyof typeof ATTRIBUTE_TYPES];

// Data View Cell Display Types (for rendering)
export const DATA_VIEW_CELL_DISPLAY_TYPES = {
  BOOLEAN: "boolean",
  JSON: "json",
  ARRAY: "array",
  URL: "url",
  DATE: "date",
  NUMBER: "number",
  MARKDOWN: "markdown",
  TEXT: "text",
} as const;

export type DataViewCellDisplayType = (typeof DATA_VIEW_CELL_DISPLAY_TYPES)[keyof typeof DATA_VIEW_CELL_DISPLAY_TYPES];

// Entity Filter Operators
export const FILTER_OPERATORS = {
  EQ: "$eq",
  NE: "$ne",
  GT: "$gt",
  GTE: "$gte",
  LT: "$lt",
  LTE: "$lte",
  IN: "$in",
  NIN: "$nin",
  REGEX: "$regex",
  CONTAINS: "$contains",
  STARTS_WITH: "$startsWith",
  ENDS_WITH: "$endsWith",
  EXISTS: "$exists",
  SIZE: "$size",
  NEAR: "$near",
} as const;

export type FilterOperator = (typeof FILTER_OPERATORS)[keyof typeof FILTER_OPERATORS];

// Geolocation Constants
export const GEOLOCATION_COUNTRIES = [
  { code: "US", display: "United States" },
  { code: "CA", display: "Canada" },
] as const;

export const GEOLOCATION_DISTANCE_OPTIONS: { miles: number, value: number }[] = [
  { miles: 10, value: 16093 },
  { miles: 20, value: 32187 },
  { miles: 25, value: 40233 },
  { miles: 50, value: 80467 },
  { miles: 100, value: 160934 },
] as const;

/** Backend / rounding may yield metres slightly off preset integers; used for $near distance matching in UI. */
export const GEO_DISTANCE_PRESET_MATCH_EPSILON_METERS = 2;

/**
 * Maps API $near distance (metres) to the closest dashboard preset bucket so distance Selects stay populated.
 */
export function snapDistanceMetersToGeoPreset(meters: number | undefined | null): number | undefined {
  if (meters == null || !Number.isFinite(meters) || meters <= 0) {
    return undefined;
  }
  const withinEpsilon = GEOLOCATION_DISTANCE_OPTIONS.find(
    (d) => Math.abs(d.value - meters) <= GEO_DISTANCE_PRESET_MATCH_EPSILON_METERS
  );
  if (withinEpsilon) {
    return withinEpsilon.value;
  }
  return GEOLOCATION_DISTANCE_OPTIONS.reduce((best, d) =>
    Math.abs(d.value - meters) < Math.abs(best.value - meters) ? d : best
  ).value;
}

/** Miles-to-metres conversion factor (matches backend Location model). */
export const MILES_TO_METRES = 1609.344;

/** Default debounce delay for typeahead / search inputs (ms). */
export const TYPEAHEAD_DEBOUNCE_MS = 300;

/** Default geolocation country code for location search inputs. */
export const DEFAULT_GEOLOCATION_COUNTRY_CODE = "US";

/** Browser geolocation display label used in location filter UIs. */
export const BROWSER_GEOLOCATION_LABEL = "Current location";

/** Default radius in miles when no radius is specified for location searches. */
export const DEFAULT_LOCATION_RADIUS_MILES = 10;

/** Duration for the live-results pulse animation (ms). */
export const LIVE_RESULTS_PULSE_DURATION_MS = 1000;

// Vector Search Types
export const VECTOR_SEARCH_TYPES = {
  SIMILARITY: "SIMILARITY",
  HYBRID: "HYBRID",
} as const;

export type VectorSearchType = (typeof VECTOR_SEARCH_TYPES)[keyof typeof VECTOR_SEARCH_TYPES];

// DataView Sort Fields
export const DATA_VIEW_SORT_FIELDS = {
  ID: "ID",
  NAME: "NAME",
  CREATED_AT: "CREATED_AT",
} as const;

export type DataViewSortField = (typeof DATA_VIEW_SORT_FIELDS)[keyof typeof DATA_VIEW_SORT_FIELDS];

// DataView Sort Labels
export const DATA_VIEW_SORT_LABELS = {
  NAME_ASC: "Name (A-Z)",
  NAME_DESC: "Name (Z-A)",
  CREATED_AT_ASC: "Oldest First",
  CREATED_AT_DESC: "Newest First",
  NAME: "Name",
  CREATED: "Created",
  ASCENDING: "A-Z",
  DESCENDING_NAME: "Z-A",
  DESCENDING_DATE: "Newest",
  ASCENDING_DATE: "Oldest",
} as const;

// Entity Filter Type constant
export const ENTITY_FILTER_TYPE = "DocumentEntityFilter" as const;

// API Response Status
export const API_RESPONSE_STATUS = {
  SUCCESS: "SUCCESS",
  BAD_REQUEST: "BAD_REQUEST",
  UNAUTHORIZED: "UNAUTHORIZED",
  NOT_FOUND: "NOT_FOUND",
  ERROR: "ERROR",
} as const;

export type ApiResponseStatus = (typeof API_RESPONSE_STATUS)[keyof typeof API_RESPONSE_STATUS];

// Validation Constants
export const VALIDATION = {
  LIMITS: {
    TICKET_LIMIT_MIN: 1,
    TICKET_LIMIT_MAX: 1000,
    TICKET_LIMIT_DEFAULT: 50,
    OFFSET_MIN: 0,
    PAGE_SIZE_MIN: 1,
    PAGE_SIZE_MAX: 1000, // General API max
    /** DataView list and export: max 300 records per request. */
    DATAVIEW_PAGE_SIZE_MAX: 300,
    /** Agentic search: max 100 results per request. */
    AGENTIC_SEARCH_PAGE_SIZE_MAX: 100,
    /**
     * Data View rank flow (runRanking=false): pre-select this many rows from page 1 for ranking by default.
     * Must be ≤ {@link #AGENTIC_SEARCH_PAGE_SIZE_MAX}.
     */
    AGENTIC_RANK_DEFAULT_AUTO_SELECT_COUNT: 25,
    PAGE_SIZE_DEFAULT: 10,
    PAGE_MIN: 0,
  },
  REQUIRED_FIELDS: {
    ASSEMBLY_ID: "Workspace ID is required",
    WORKFLOW_ID: "Workflow ID is required",
    TICKET_ID: "Ticket ID is required",
    SOP_ID: "SOP ID is required",
    UPDATE_TYPE: "Update type is required",
    UPDATE_MESSAGE: "Update message is required",
    NEW_STATE: "New state is required",
    TASK_ID: "Task ID is required",
    TASK_RESPONSE_NAME: "Task response name is required",
    TASK_ITEM_ID: "Task item ID is required for each task item response",
    TASK_ITEM_TYPE: "Task item response type is required",
    TASK_ITEM_RESPONSE: "Task item response content is required",
    COMMENT_AUTHOR: "Comment author is required",
    COMMENT_AUTHOR_ID: "Comment author ID is required",
    COMMENT_MESSAGE: "Comment message is required",
    COMMENT_TYPE: "Comment type is required",
    RESPONSE_ID: "Response ID is required",
    TASK_ITEM_RESPONSE_CONTENT: "Task item response content is required",
    DATAVIEW_ID: "DataView ID is required",
    ENTITY_ID: "Entity ID is required",
  },
  CONDITIONAL_FIELDS: {
    PROCESS_NAME: "Process name is required for process and step updates",
    STEP_NAME: "Step name is required for step updates",
    TRIGGER_NAME: "Trigger name is required for trigger updates",
    EXCEPTION_NAME: "Exception name is required for exception updates",
  },
  INVALID_VALUES: {
    LIMIT_RANGE: "Limit must be between 1 and 1000",
    OFFSET_NEGATIVE: "Offset must be non-negative",
    PAGE_SIZE_RANGE: "Page size must be between 1 and 1000",
    /** Dataview: page size must be between 1 and 300. */
    DATAVIEW_PAGE_SIZE_RANGE: "Page size must be between 1 and 300",
    PAGE_NEGATIVE: "Page must be non-negative",
    INVALID_STATE: (state: string, validStates: string[]) => `Invalid state: ${state}. Must be one of: ${validStates.join(", ")}`,
  },
} as const;

// UI Messages - Organized by Feature for Selective Imports

// Invite Member Messages
export const INVITE_MESSAGES = {
  SUCCESS: {
    MEMBER_INVITED: "Invitation sent successfully! They'll receive an email with instructions to join.",
  },
  ERROR: {
    MISSING_FIELDS: "Please fill in all required fields before sending the invitation.",
    AUTHENTICATION_REQUIRED: "Your session has expired. Please sign in again to continue.",
    INSUFFICIENT_PERMISSIONS: "You don't have permission to invite members to this workspace. Please contact an administrator.",
    USER_ALREADY_EXISTS: "This person is already part of this workspace.",
    EMAIL_SYSTEM_ERROR: "We couldn't send the invitation email. Please try again in a few moments.",
    GENERIC_ERROR: "Something went wrong while sending the invitation. Please try again.",
  },
} as const;

// Common/Shared Messages - Used across multiple features
export const COMMON_MESSAGES = {
  SUCCESS: {
    LINK_COPIED: "Link copied to clipboard",
  },
  ERROR: {
    LOAD_FAILED: "Unable to load information right now. Please refresh the page or try again in a moment.",
    AUTHENTICATION_REQUIRED: "Your session has expired. Please sign in again to continue.",
    ACCESS_DENIED: "You don't have permission to access this section. Please contact your administrator if you believe this is a mistake.",
    RESOURCE_NOT_FOUND: "The information you're looking for couldn't be found. It may have been moved or removed. Please verify that you are on the correct workspace and workflow.",
    TOO_MANY_REQUESTS: "You're making requests too quickly. Please wait a moment before trying again.",
    RATE_LIMIT_EXCEEDED: "You're working too fast! Please wait a few seconds before continuing.",
    SERVER_ERROR: "Something went wrong on our end. Please try again in a few minutes.",
    SERVICE_UNAVAILABLE: "The system is temporarily unavailable for maintenance. Please try again shortly.",
    COPY_FAILED: "Couldn't copy the link. Please try selecting and copying it manually.",
    NO_ASSEMBLIES_TITLE: "No Workspaces Available",
    NO_ASSEMBLIES_DESCRIPTION: "You don't have access to any workspaces. Please contact your administrator.",
  },
  LOADING: {
    ASSEMBLIES: "Loading...",
  },
  EMPTY_STATES: {
    NO_ASSEMBLY_SELECTED: "No workspace selected. Please select a workspace to view tickets",
    NO_ASSEMBLIES_AVAILABLE: "No workspaces available.",
    NO_ASSEMBLY_PARTNERS: "No partners are available for this workspace.",
    NO_ASSEMBLY_PARTNERS_SEARCH: "No partners match your search criteria.",
  },
  PLACEHOLDERS: {
    SELECT_ASSEMBLY: "Select Workspace",
    LOADING_ASSEMBLIES: "Loading...",
  },
  LABELS: {
    ASSEMBLY: "Workspace",
    WORKFLOW: "Workflow",
    TICKET: "Ticket",
    STATUS: "Status",
    CREATED_BY: "Created By",
    CREATED_AT: "Created At",
    PRIORITY: "Priority",
    ACTIONS: "Actions",
    SEARCH: "Search",
    FILTER: "Filter",
    RESET: "Reset",
    APPLY: "Apply",
    CANCEL: "Cancel",
    SAVE: "Save",
    DELETE: "Delete",
    EDIT: "Edit",
    VIEW: "View",
    LOADING: "Loading...",
    ERROR: "Error",
    SUCCESS: "Success",
    WARNING: "Warning",
    INFO: "Info",
    CONFIRM: "Confirm",
    YES: "Yes",
    NO: "No",
    OK: "OK",
    CLOSE: "Close",
    BACK: "Back",
    NEXT: "Next",
    PREVIOUS: "Previous",
    PREVIOUS_PAGE: "Go to previous page",
    NEXT_PAGE: "Go to next page",
    SUBMIT: "Submit",
    REFRESH: "Refresh",
    RETRY: "Retry",
    UPLOAD: "Upload",
    DOWNLOAD: "Download",
    EXPORT: "Export",
    IMPORT: "Import",
    SETTINGS: "Settings",
    PROFILE: "Profile",
    LOGOUT: "Logout",
    LOGIN: "Login",
    SIGNUP: "Sign Up",
    NO_ASSEMBLY_SELECTED_HEADER: "No Workspace Selected",
    SELECT_ASSEMBLY_DASHBOARD: "Please select a workspace to view dashboard metrics.",
    SELECT_ASSEMBLY_SOPS: "Please select a workspace to view SOPs.",
    SELECT_ASSEMBLY_RESOURCES: "Please select a workspace to view resources.",
    SELECT_ASSEMBLY_SIDEBAR: "Select a workspace from the header to continue",
    SLOW_DOWN_TITLE: "Slow Down",
    // Common labels
    USER: "User",
    NONE: "None",
    NONE_SELECTED: "None selected",
  },
  NAVIGATION: {
    METRICS: "Metrics",
    SOPS: "SOPs",
    SOP_MANAGER: "SOP Manager",
    TICKETS: "Tickets",
    RESOURCES: "Resources",
    CONSOLE: "Console",
    TASKS: "Tasks",
    PROFILE: "Profile",
    SETTINGS: "Settings",
    LOGOUT: "Logout",
    SELECT_ASSEMBLY_DROPDOWN: "Select Workspace",
  },
  ACTIONS: {
    REQUEST_UPDATE: "Request Update",
    EDIT_SOP: "Edit SOP",
    CLONE_SOP: "Clone SOP",
    EXPORT_PDF: "Export as PDF",
    ARCHIVE_SOP: "Archive SOP",
    SHARE: "Share",
    PRINT: "Print",
  },
} as const;

// Authentication Feature Messages
export const AUTH_MESSAGES = {
  ERROR: {
    NETWORK_ERROR: "Connection issue detected. Please check your internet connection and try again.",
    MISSING_CREDENTIALS: "Please fill in all required fields to continue.",
    INVALID_CODE: "The verification code you entered is not valid. Please double-check the code or request a new one.",
    TOO_MANY_LOGIN_ATTEMPTS: "Too many sign-in attempts. Please wait a few minutes before trying again.",
    LOGIN_FAILED: "Sign-in was unsuccessful. Please check your details and try again.",
    OTP_GENERATION_FAILED: "Couldn't send verification code. Please try again or contact support.",
    ENTER_EMAIL: "Please enter your email address to continue.",
    ENTER_EMAIL_AND_CODE: "Please enter both your email address and the verification code.",
    ENTER_EMAIL_AND_PASSWORD: "Please enter both your email address and password.",
  },
  LABELS: {
    ASSEMBLY_COLON: "Workspace:",
    CHANGE_ASSEMBLY: "Change Workspace",
    WELCOME_USER: "Welcome back",
    EMAIL: "Email",
    VERIFICATION_CODE: "Verification Code",
    PASSWORD: "Password",
    SIGN_IN: "Sign In",
    SIGNING_IN: "Signing in...",
    SEND_CODE: "Send Verification Code",
    SENDING_CODE: "Sending Code...",
    CHANGE_EMAIL: "Change Email",
    LOGGING_IN: "Logging in...",
  },
  PLACEHOLDERS: {
    ENTER_EMAIL: "Enter your email",
    ENTER_CODE: "Enter 6-digit code",
    ENTER_PASSWORD: "Enter your password",
  },
  DESCRIPTIONS: {
    LOGIN_DESCRIPTION: "Sign in to access the orchestration dashboard",
    OTP_DESCRIPTION: "Enter the verification code sent to your email",
  },
} as const;

// Dashboard/Metrics Feature Messages
export const DASHBOARD_MESSAGES = {
  TITLES: {
    DASHBOARD: "Dashboard",
    OVERVIEW_FOR: "Overview for",
  },
  LABELS: {
    DASHBOARD: "Dashboard",
    DASHBOARD_DESCRIPTION: "View key metrics and analytics for your workflows",
    TIME_RANGE: "Time Range",
    TOTAL_SOPS: "Total SOPs",
    TOTAL_PROCESSES: "Total Processes",
    TOTAL_STEPS: "Total Steps",
    ASSEMBLY_STATUS: "Workspace Status",
    ACTIVE_TICKETS: "Active Tickets",
    COMPLETION_RATE: "Completion Rate",
    AVERAGE_RESOLUTION_TIME: "Average Resolution Time",
    RECENT_ACTIVITY: "Recent Activity",
    LOADING_DASHBOARD: "Loading dashboard...",
    REFRESHING: "Refreshing...",
    REFRESH: "Refresh",
    AVAILABLE_PROCEDURES: "Available procedures",
    ACROSS_ALL_SOPS: "Across all SOPs",
    TOTAL_WORKFLOW_STEPS: "Total workflow steps",
    CURRENT_STATE: "Current state",
    ACTIVE: "Active",
    ASSEMBLY_INFORMATION: "Workspace Information",
    ASSEMBLY_DETAILS: "Details about the current workspace",
    ASSEMBLY_ID: "Workspace ID",
    NAME: "Name",
    UNKNOWN: "Unknown",
    ORGANIZATION: "Organization",
    WORKFLOWS: "Workflows",
    SOP_SUMMARY: "SOP Summary",
    SOP_OVERVIEW: "Overview of Standard Operating Procedures",
    PROCESSES: "processes",
    COMPLETION: "Completion",
    MORE_SOPS: "And",
    MORE_SOPS_SUFFIX: "more SOPs...",
    NO_SOPS_AVAILABLE: "No SOPs available for this workspace.",
    NO_SOPS_FOUND: "No SOPs Found",
    NO_SOPS_DESCRIPTION: "There are no SOPs available for this workspace.",
    ACTIVITY_TRACKING: "Activity Tracking",
    ACTIVITY_DESCRIPTION: "Activity monitoring will be available when workflow tracking is implemented.",
    SALES_OVERVIEW: "Sales Overview",
    PERFORMANCE_TRENDS: "Performance Trends",
    KEY_METRICS: "Key Metrics",
    LAST_UPDATED: "Last Updated",
    DATA_SOURCE: "Data Source",
    SELECTED_WORKFLOW: "Selected Workflow",
    PERFORMANCE_METRICS: "Performance Metrics",
    QUALITY_METRICS: "Quality Metrics",
    TREND_ANALYSIS: "Trend Analysis",
    PERFORMANCE_CHART_PLACEHOLDER: "Performance charts will be available when implemented",
    QUALITY_CHART_PLACEHOLDER: "Quality charts will be available when implemented",
    TRENDS_CHART_PLACEHOLDER: "Trend analysis will be available when implemented",
  },
  LOADING: {
    REFRESHING: "Refreshing...",
  },
  ACTIONS: {
    REFRESH: "Refresh",
  },
  TABS: {
    OVERVIEW: "Overview",
    PERFORMANCE: "Performance",
    QUALITY: "Quality",
    TRENDS: "Trends",
    SOPS: "SOPs",
    ACTIVITY: "Activity",
  },
  TIME_RANGES: {
    LAST_24_HOURS: "Last 24 Hours",
    LAST_7_DAYS: "Last 7 Days",
    LAST_30_DAYS: "Last 30 Days",
    LAST_90_DAYS: "Last 90 Days",
    HOURS_24: "24 Hours",
    DAYS_7: "7 Days",
    DAYS_30: "30 Days",
    DAYS_90: "90 Days",
  },
} as const;

// SOP Feature Messages
export const SOP_MESSAGES = {
  SUCCESS: {
    SOP_UPDATE_CREATED: "Your update request has been submitted successfully!",
  },
  ERROR: {
    SOP_UPDATE_FAILED: "Unable to submit your update request right now. Please try again or contact support.",
  },
  LOADING: {
    SOPS: "Loading SOPs...",
    SOP_LOADING: "Please wait while we load the SOP details.",
  },
  EMPTY_STATES: {
    NO_PROCESS_DATA: "No Process Data",
    NO_PROCESS_DATA_DESCRIPTION: "This SOP doesn't have detailed process information available.",
    NO_PROCESSES: "No Processes",
    NO_PROCESSES_DESCRIPTION: "This SOP doesn't have any processes configured.",
  },
  LABELS: {
    BUSINESS_CONTEXT: "Business Context",
    STAKEHOLDERS: "Stakeholders",
    DESCRIPTION: "Description",
    SLA_NOTES: "SLA Notes",
    VALIDATION: "Validation: ",
    REQUIRED_CONTEXT: "Required Context: ",
    CONFIGURATION: "Configuration",
    CONFIGURATION_DESCRIPTION: "Configuration details will be available when implemented.",
    DOCUMENTATION: "Documentation",
    DOCUMENTATION_DESCRIPTION: "Documentation will be available when implemented.",
    METRICS: "Metrics",
    METRICS_DESCRIPTION: "Metrics will be available when implemented.",
    PROCESS_NAME: "Process Name",
    PROCESS_DESCRIPTION: "Process Description",
    STEP_NAME: "Step Name",
    STEP_DESCRIPTION: "Step Description",
    STEP_VALIDATION: "Validation Criteria",
    TOOLS_DEPENDENCIES: "Tools Dependencies (comma-separated)",
    SME_DEPENDENCIES: "SME Dependencies (comma-separated)",
    STEP_REQUIRED_CONTEXT: "Required Context",
    SOP_NAME: "SOP Name",
    SOP_DESCRIPTION: "SOP Description",
    COMPLETED_STATE_LABEL: "Completed State Label",
    STEPS: "Steps",
  },
  PLACEHOLDERS: {
    SEARCH_SOPS: "Search SOPs by name or description...",
    SEARCH_PROCESS: "Search processes and steps...",
    SELECT_CATEGORY: "Select category to update...",
    SELECT_PROCESS: "Select a process...",
    SELECT_STEP_CONDITIONAL: "Select a step...",
    SELECT_PROCESS_FIRST: "Select a process first",
    DESCRIBE_UPDATE: "Describe the update you need...",
  },
  FILTERS: {
    ALL: "All",
    SME: "SME",
    AI_AUTOMATION: "AI Automation",
  },
  PROCESS: {
    INSTRUCTIONS: "Instructions:",
    RETRY_POLICY: "Retry Policy:",
    CONDITIONALS: "Conditionals:",
    CONDITION: "Condition:",
    ON_TRUE: "On True:",
    ON_FALSE: "On False:",
    WAIT_TIME: "Wait Time:",
    WAIT_CONDITION: "Wait Condition:",
    DONE_CONDITION: "Done Condition:",
    ON_EACH: "On Each:",
    TRIGGERS: "Triggers:",
    WHEN: "When:",
    WHAT: "What:",
    EXCEPTIONS: "Exceptions:",
    EXCEPTION_INSTRUCTIONS: "Instructions:",
  },
  UPDATE_REQUEST_SUCCESS: "Update request submitted successfully",
  UPDATE_REQUEST_FAILED: "Failed to submit update request",
  NO_STEPS_AVAILABLE: "No steps available for this process",
  SELECT_PROCESS_FIRST_MESSAGE: "Select a process first",
} as const;

// Tickets Feature Messages
export const TICKETS_MESSAGES = {
  SUCCESS: {
    TICKET_STATUS_UPDATED: "Status updated successfully!",
    TICKET_STATUS_UPDATED_SUCCESS: "The ticket status has been updated successfully!",
  },
  ERROR: {
    TICKET_UPDATE_FAILED: "Unable to update the ticket status right now. Please try again or refresh the page.",
  },
  LOADING: {
    TICKETS: "Loading tickets...",
    TICKET_DETAILS: "Loading ticket details...",
  },
  EMPTY_STATES: {
    NO_TICKETS: "No tickets found matching your criteria",
    NO_TICKETS_FOUND: "No tickets found matching your criteria.",
    TICKET_NOT_FOUND: "The requested ticket could not be found",
    SELECT_WORKFLOW: "Please select a workflow to view tickets",
    SELECT_WORKFLOW_TO_VIEW: "Please select a workflow to view tickets",
  },
  LABELS: {
    TICKET_MANAGEMENT: "Ticket Management",
    VIEW_AND_MANAGE: "View and manage processing tickets",
    FAILED_TO_LOAD: "Failed to load tickets",
    TICKETS: "Tickets",
    SELECTED_WORKFLOW: "selected workflow",
    TASK_INFORMATION: "Task Information",
    TASK_ID: "ID:",
    TASK_STATUS: "Status:",
    TASK_CREATED: "Created:",
    TASK_WORKFLOW: "Workflow:",
    ASSIGNED_TO: "Assigned to:",
    TASK_DESCRIPTION: "Description:",
    TASK_INSTRUCTIONS: "Instructions",
    TASK_COMMUNICATION: "Task Communication",
    NO_MESSAGES_YET: "No messages yet. Start a conversation about this task.",
    SELECT_TASK_TO_VIEW_DETAILS: "Select a task to view details",
  },
  PLACEHOLDERS: {
    TYPE_MESSAGE_ABOUT_TASK: "Type a message about this task...",
  },
  STATUS_UPDATE: {
    AUTHOR: "current_user",
    MESSAGE_PREFIX: "Status updated to",
    MESSAGE_SUFFIX: "from dashboard",
  },
} as const;

// Operator Feature Messages
export const OPERATOR_MESSAGES = {
  SUCCESS: {
    TASK_RESPONSE_CREATED: "Your response has been saved successfully!",
    TASK_ITEM_RESPONSE_ADDED: "Response added successfully!",
  },
  ERROR: {
    TASK_RESPONSE_FAILED: "Unable to save your response right now. Please try again or contact support.",
    TASK_ITEM_RESPONSE_FAILED: "Unable to add your response. Please try again or refresh the page.",
  },
  LOADING: {
    TASKS: "Loading tasks...",
    WORKFLOWS: "Loading workflows...",
  },
  EMPTY_STATES: {
    NO_TASKS: "No tasks found for the selected workflow",
    NO_WORKFLOWS: "No workflows available for this workspace",
  },
  LABELS: {
    WELCOME_CONSOLE: "Welcome to the Operator Console! Type / to see list of available triggers for the selected workflow.",
    OPERATOR_CONSOLE: "Operator Console",
    CONSOLE_DESCRIPTION: "Interactive console for managing tasks and workflows",
    TASKS: "Tasks",
    TASKS_DESCRIPTION: "Manage workflow tasks and assignments",
    SELECT_WORKFLOW: "Select Workflow",
    DUE: "Due:",
    START_TASK: "Start Task",
    MARK_COMPLETE: "Mark Complete",
    NO_WORKFLOW_SELECTED: "No Workflow Selected",
    NO_WORKFLOW_SELECTED_DESCRIPTION: "Please select a workflow to view tasks.",
    SELECTED: "Selected:",
    TASK_INFORMATION: "Task Information",
    TASK_ID: "ID:",
    TASK_STATUS: "Status:",
    TASK_CREATED: "Created:",
    TASK_WORKFLOW: "Workflow:",
    ASSIGNED_TO: "Assigned to:",
    TASK_DESCRIPTION: "Description:",
    TASK_INSTRUCTIONS: "Instructions",
    TASK_COMMUNICATION: "Task Communication",
    NO_MESSAGES_YET: "No messages yet. Start a conversation about this task.",
    SELECT_TASK_TO_VIEW_DETAILS: "Select a task to view details",
    // Status Labels
    ALL_STATUS: "All Status",
    PENDING: "Pending",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    // Assignment Labels
    ALL_ASSIGNED: "All Assigned",
    ASSIGNED_TO_ME: "Assigned to Me",
    MY_TEAM: "My Team",
    UNASSIGNED: "Unassigned",
    // Loading and Error States
    LOADING_TASKS: "Loading tasks...",
    NO_TASKS_FOUND: "No Tasks Found",
    ERROR_LOADING_TASKS: "Failed to load tasks",
    NO_TASKS_DESCRIPTION: "There are no tasks available for the selected workflow.",
    // Console specific labels
    SYSTEM: "System",
    SHOW_HELP: "Show Help",
    LIST_TASKS: "List Tasks",
    SYSTEM_STATUS: "System Status",
    REFRESH_DATA: "Refresh Data",
  },
  COMMANDS: {
    HELP: "/help",
    TASKS: "/tasks",
    STATUS: "/status",
    REFRESH: "/refresh",
    TRIGGERS: "/triggers",
  },
  DESCRIPTIONS: {
    HELP_DESCRIPTION: "Display available commands and usage information",
    TASKS_DESCRIPTION: "Show current workflow tasks",
    STATUS_DESCRIPTION: "Display system and workspace status",
    REFRESH_DESCRIPTION: "Reload current data from API",
    TRIGGERS_DESCRIPTION: "Show available published triggers for the current workflow",
  },
  PLACEHOLDERS: {
    CONSOLE_INPUT: "Type a command or message...",
    SELECT_WORKFLOW: "Select a workflow...",
    TYPE_MESSAGE_ABOUT_TASK: "Type a message about this task...",
    SEARCH_TASKS: "Search tasks by name...",
    ALL_STATUS_PLACEHOLDER: "All Status",
    ALL_ASSIGNED_PLACEHOLDER: "All Assigned",
  },
  PAGES: {
    CONSOLE_TITLE: "Operator Console",
    CONSOLE_DESCRIPTION: "Monitor and manage workflow operations",
    TASKS_TITLE: "Operator Tasks",
    TASKS_DESCRIPTION: "View and manage assigned workflow tasks",
  },
  ACTIONS: {
    CLEAR_FILTERS: "Clear filters",
    SEND_MESSAGE: "Send",
    START_TASK: "Start",
    COMPLETE_TASK: "Complete",
  },
} as const;

// Resources Feature Messages
export const RESOURCES_MESSAGES = {
  LOADING: {
    RESOURCES: "Loading resources...",
  },
  EMPTY_STATES: {
    NO_RESOURCES: "No resources found",
  },
  LABELS: {
    NO_ASSEMBLY_PARTNERS_FOUND: "No Partners Found",
  },
  SUCCESS: {
    INVITE_SENT: "Invite sent successfully",
  },
  ERROR: {
    INVITE_FAILED: "Failed to invite team member",
  },
} as const;

// Branding Messages
export const BRANDING_MESSAGES = {
  APP_NAME: "Orchestration Platform",
  LOGO_ALT: "Logo",
  POWERED_BY: "Powered by Assembly Industries",
} as const;

// Logo Paths
export const LOGO_PATHS = {
  DEFAULT: "/Assembly-Logo-Simple-Light.png",
} as const;

// Theme Messages
export const THEME_MESSAGES = {
  LABELS: {
    TOGGLE_THEME: "Toggle theme",
    LIGHT: "Light",
    DARK: "Dark",
    SYSTEM: "System",
  },
} as const;

// Legacy UI_MESSAGES object for backward compatibility (will be deprecated)
export const UI_MESSAGES = {
  COMMON: COMMON_MESSAGES,
  AUTH: AUTH_MESSAGES,
  DASHBOARD: DASHBOARD_MESSAGES,
  SOP: SOP_MESSAGES,
  TICKETS: TICKETS_MESSAGES,
  OPERATOR: OPERATOR_MESSAGES,
  RESOURCES: RESOURCES_MESSAGES,
  BRANDING: BRANDING_MESSAGES,
  THEME: THEME_MESSAGES,
} as const;

// API Standards Configuration
export const API_STANDARDS = {
  AUTHENTICATION: {
    BEARER_TOKEN_PREFIX: "Bearer ",
    BASIC_AUTH_PREFIX: "Basic ",
    SESSION_TOKEN_KEY: "sessionToken",
    OTP_REF: "ASSEMBLY_DASHBOARD_DEV",
    SESSION_VALIDITY_MS: 7 * 24 * 60 * 60 * 1000, // 7 days
    SESSION_EXPIRY_UI_DELAY_MS: 2000, // Display session expired message for 2 seconds
    LOGOUT_REASONS: {
      MANUAL: "manual" as const,
      SESSION_EXPIRED: "session_expired" as const,
      UNAUTHORIZED: "unauthorized" as const,
    },
    LOGIN_METHODS: {
      OTP: "otp" as const,
      TEST_LOGIN: "test_login" as const,
    },
  },
  RATE_LIMITING: {
    DEFAULT_LIMIT: 10,
    DEFAULT_WINDOW: 1000, // 1 second
    MUTATION_LIMIT: 5,
    MUTATION_WINDOW: 1000, // 1 second
    QUERY_LIMIT: 15,
    QUERY_WINDOW: 1000, // 1 second
    AUTH_LIMIT: 2,
    AUTH_WINDOW: 5000, // 5 seconds
  },
  LOGGING: {
    DEVELOPMENT_LEVEL: "debug",
    PRODUCTION_LEVEL: "info",
    MAX_LOG_LENGTH: 1000,
    SENSITIVE_FIELDS: ["password", "token", "authorization", "sessionToken"],
  },
} as const;

// Search Configuration
export const SEARCH_CONFIG = {
  DEBOUNCE_DELAY: 500, // ms
  CACHE_TIME: 5 * 60 * 1000, // 5 minutes
  STALE_TIME: 1 * 60 * 1000, // 1 minute
  // Pagination defaults
  DEFAULT_PAGE: 0, // 0-based indexing for API
  DEFAULT_PAGE_SIZE_TICKETS: 10,
  DEFAULT_PAGE_SIZE_TASKS: 10,
  DEFAULT_PAGE_SIZE_SOPS: 10,
} as const;

// UI Component Variants
export const UI_VARIANTS = {
  BADGE: {
    DEFAULT: "default",
    SECONDARY: "secondary",
    DESTRUCTIVE: "destructive",
    OUTLINE: "outline",
  },
  BUTTON: {
    DEFAULT: "default",
    DESTRUCTIVE: "destructive",
    OUTLINE: "outline",
    SECONDARY: "secondary",
    GHOST: "ghost",
    LINK: "link",
  },
  ALERT: {
    DEFAULT: "default",
    DESTRUCTIVE: "destructive",
  },
  CARD: {
    DEFAULT: "default",
  },
} as const;

// Resource Status Values
export const RESOURCE_STATUS = {
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
  ERROR: "error",
  LOADING: "loading",
} as const;

export type ResourceStatus = (typeof RESOURCE_STATUS)[keyof typeof RESOURCE_STATUS];

// Theme Values
export const THEME_VALUES = {
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
} as const;

export type ThemeValue = (typeof THEME_VALUES)[keyof typeof THEME_VALUES];

// SOP Tab Values
export const SOP_TABS = {
  OVERVIEW: "overview",
  PROCESS: "process",
  METRICS: "metrics",
} as const;

export type SOPTab = (typeof SOP_TABS)[keyof typeof SOP_TABS];

// Task Tab Values
export const TASK_TABS = {
  OVERVIEW: "overview",
  TASK_AGENT: "task-agent",
  TASK_ITEMS: "task-items",
} as const;

export type TaskTab = (typeof TASK_TABS)[keyof typeof TASK_TABS];

// Ticket Tab Values
export const TICKET_TABS = {
  OVERVIEW: "overview",
  UPDATES: "updates",
} as const;

export type TicketTab = (typeof TICKET_TABS)[keyof typeof TICKET_TABS];

// SOP Status Values
export const SOP_STATUS_VALUES = {
  ACTIVE: "active",
  DRAFT: "draft",
  ARCHIVED: "archived",
  REVIEW: "review",
} as const;

export type SOPStatusValue = (typeof SOP_STATUS_VALUES)[keyof typeof SOP_STATUS_VALUES];

// Environment Variable Names
export const ENV_VARS = {
  API_URL: "VITE_API_URL",
  API_ENV: "VITE_API_ENV",
  API_VERSION: "VITE_API_VERSION",
  ENABLE_DEV_TOOLS: "VITE_ENABLE_DEV_TOOLS",
  API_DEBUG: "VITE_API_DEBUG",
  ENABLE_ANALYTICS: "VITE_ENABLE_ANALYTICS",
  POSTHOG_KEY: "VITE_POSTHOG_KEY",
} as const;

// DOM Element IDs
export const DOM_IDS = {
  ROOT: "root",
} as const;

// App Environment Values (must match Assembly Copilot accepted values)
export const APP_ENVIRONMENTS = {
  PRODUCTION: "prod",
  STAGING: "staging",
  DEVELOPMENT: "dev",
  LOCAL: "local",
} as const;

export type AppEnvironment = (typeof APP_ENVIRONMENTS)[keyof typeof APP_ENVIRONMENTS];

// Assembly Copilot Configuration
export const COPILOT_CONFIG = {
  PLATFORM: "orchestration-dashboard",
  ENVIRONMENT: import.meta.env.VITE_API_ENV as AppEnvironment,
  AUTH: {
    ENDPOINTS: {
      VERIFY: "/orchestration-dashboard/info",
      ONE_TIME_CODE: "/auth/team_member/one-time-code",
      LOGIN: "/auth/team_member/login",
      LOGOUT: "/auth/team_member/logout",
    },
  },
  STARTER_PROMPTS: [
    {
      id: "get-started",
      title: "Get Started",
      query: "What can you help me with?",
      prompt:
        "Give me an overview of what you can help me with on this dashboard. Summarize the key areas you can assist with — such as workflows, tickets, tasks, SOPs, and resources — and suggest what I should look at first based on anything that needs attention.",
    },
    {
      id: "open-tickets",
      title: "Open Tickets",
      query: "Show me my open tickets",
      prompt:
        "Show me my open tickets. Prioritize any that are overdue or escalated, and include their current status and assignee.",
    },
    {
      id: "pending-tasks",
      title: "Pending Tasks",
      query: "What tasks are waiting on me?",
      prompt:
        "What tasks are currently assigned to me or awaiting my action? Group them by priority and include deadlines if available.",
    },
    {
      id: "assembly-overview",
      title: "Assembly Overview",
      query: "Give me an overview of this assembly",
      prompt:
        "Give me an overview of this assembly. Include key metrics, active workflows, open tickets, and any items that need immediate attention.",
    },
  ],
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  THEME: "ui-theme",
  ASSEMBLY_THEME: "assembly-theme",
  AUTH_STORAGE: "auth-storage",
  /** Prefix for per-dataview compact reference columns preference. Key = `${DATAVIEW_COMPACT_REFS_PREFIX}${dataViewId}` */
  DATAVIEW_COMPACT_REFS_PREFIX: "dataview-compact-refs-",
  /**
   * Per-user hidden table columns for a data view.
   * Full key: `${DATAVIEW_HIDDEN_COLUMNS_PREFIX}${teamMemberID}:${assemblyId}:${workflowId}:${dataViewId}`
   */
  DATAVIEW_HIDDEN_COLUMNS_PREFIX: "orchestrator:dataview-hidden-cols:",
} as const;

// Content Types
export const CONTENT_TYPES = {
  FORM_URLENCODED: "application/x-www-form-urlencoded",
  JSON: "application/json",
} as const;

// API Error Messages
export const API_ERROR_MESSAGES = {
  OTP_GENERATION: {
    400: "Please enter a valid email address to continue.",
    401: "We couldn't find an account with that email address.",
    404: "We couldn't find an account with that email address.",
    429: "You've requested too many verification codes. Please wait a few minutes before trying again.",
    DEFAULT: "Unable to send verification code right now. Please try again or contact support.",
  },
  LOGIN: {
    400: "Please fill in all required fields to sign in.",
    401: "The verification code you entered is invalid.",
    404: "We couldn't find an account with that email address.",
    429: "Too many sign-in attempts. Please wait a few minutes before trying again.",
    DEFAULT: "Sign-in was unsuccessful. Please try again or contact support.",
  },
  INVITE_MEMBER: {
    400: "Please fill in all required fields before sending the invitation.",
    401: "Your session has expired. Please sign in again to continue.",
    403: "You don't have permission to invite members to this workspace.",
    409: "This person is already part of this workspace.",
    500: "We couldn't send the invitation email. Please try again in a few moments.",
    DEFAULT: "Unable to send invitation right now. Please try again.",
  },
  TASK_REASSIGN: {
    400: "Required fields missing or invalid assignee type.",
    403: "You don't have permission to reassign this task.",
    404: "Task, workflow, workspace, or assignee not found.",
    500: "Failed to reassign task. Please try again.",
    DEFAULT: "Unable to reassign task",
  },
  TASK_REASSIGN_RESOURCE_GROUP: {
    400: "Resource group ID is required.",
    403: "You don't have permission to reassign this task.",
    404: "Task, workflow, workspace, or resource group not found.",
    500: "Failed to reassign task to resource group. Please try again.",
    DEFAULT: "Unable to reassign task to resource group",
  },
  DATAVIEW_UPDATE: {
    400: "The changes you made couldn't be saved. Please check your input and try again.",
    403: "You don't have permission to make changes in this view.",
    404: "This item is no longer available. It may have been moved or removed.",
    500: "Something went wrong while saving your changes. Please try again.",
    DEFAULT: "We couldn't save your changes. Please try again.",
  },
  DATAVIEW_DELETE: {
    400: "This item cannot be removed. Please check if it's still available.",
    403: "You don't have permission to remove items from this view.",
    404: "This item has already been removed or doesn't exist.",
    500: "Something went wrong while removing this item. Please try again.",
    DEFAULT: "We couldn't remove this item. Please try again.",
  },
  GENERIC: {
    DEFAULT: "Something unexpected happened. Please try again or contact support if the problem continues.",
    UNKNOWN_STATUS: "An unexpected error occurred. Please refresh the page or contact support.",
  },
} as const;

// CSS Class Names
export const CSS_CLASSES = {
  THEME_LIGHT: "light",
  THEME_DARK: "dark",
  GLASS: "glass",
  ACCENT_PRIMARY: "accent-primary",
} as const;

// Scroll Behavior
export const SCROLL_BEHAVIOR = {
  SMOOTH: "smooth",
  AUTO: "auto",
  INSTANT: "instant",
} as const;

// Task Types for Console
export const CONSOLE_TASK_TYPES = {
  REVIEW: "review",
  VALIDATION: "validation",
  APPROVAL: "approval",
} as const;

// Tooltip Positions
export const TOOLTIP_POSITIONS = {
  TOP: "top",
  BOTTOM: "bottom",
  LEFT: "left",
  RIGHT: "right",
} as const;

// Component Sizes
export const COMPONENT_SIZES = {
  SM: "sm",
  MD: "md",
  LG: "lg",
  XL: "xl",
} as const;

// Component Variants
export const COMPONENT_VARIANTS = {
  CARD: "card",
  INLINE: "inline",
  DEFAULT: "default",
  PRIMARY: "primary",
  SECONDARY: "secondary",
} as const;

// Route Paths
export const ROUTE_PATHS = {
  ASSEMBLY: "/assembly",
  /** Sidebar-only parent segment; no matching route — expandable Settings group */
  SETTINGS: "settings",
  /** People / participant directory (under Settings) */
  SETTINGS_PARTICIPANTS: "settings/participants",
  SOPS: "sops",
  TICKETS: "tickets",
  RESOURCES: "resources",
  CONSOLE: "console",
  CONSOLE_DATAVIEW: "console/dataview",
  /** Assembly-scoped dispatcher agent (all workflows) */
  DISPATCHER: "dispatcher",
  TASKS: "tasks",
  METRICS: "metrics",
  DASHBOARD: "dashboard",
  APPS: "apps",
  CONVERSATIONS: "apps/conversations",
  AGENTIC_SEARCH: "apps/agentic-search",
} as const;

/** Dispatcher agent UI copy and attachment limits (see docs/DISPATCHER_AGENT_PLAN.md) */
export const DISPATCHER_UI = {
  PAGE_TITLE: "Dispatcher",
  PAGE_SUBTITLE:
    "Ask to start a product flow by name; when a run is created, the setup panel opens automatically. Use the sidebar to browse runs.",
  RAIL_TITLE: "Sessions",
  RAIL_SUBTITLE: "Browse runs in your workspace. Sections start collapsed.",
  SHOW_SESSIONS: "Show sessions",
  HIDE_SESSIONS: "Hide sessions",
  ACTIVE_SESSIONS: "Open",
  COMPLETED_SESSIONS: "Completed",
  NONE: "No sessions",
  INPUT_PLACEHOLDER: "Message the dispatcher…",
  SESSION_IN_PROGRESS: "Session in progress",
  SESSION_OPEN_RUN_HINT: "Continue configuring this run in the flow screen.",
  OPEN_RUN_AND_SETUP: "Open run & setup",
} as const;

export const DISPATCHER_ATTACHMENT_MAX_FILE_BYTES = 25 * 1024 * 1024;
export const DISPATCHER_ATTACHMENT_MAX_FILES = 300;

// Route Patterns
export const ROUTE_PATTERNS = {
  ASSEMBLY_ID: ":assemblyId",
  SOP_ID: ":sopId",
  TICKET_ID: ":ticketId",
  TASK_ID: ":taskId",
  DATAVIEW_ID: ":dataViewId",
} as const;

// URL Parameters
export const URL_PARAMS = {
  TAB: "tab",
  WORKFLOW: "workflow",
  RETURN_TO: "returnTo",
  ACTION: "action",
  // List view parameters
  PAGE: "page",
  PAGE_SIZE: "pageSize",
  SEARCH: "search",
  SORT: "sort",
  ORDER: "order",
  STATUS: "status",
  STATE: "state",
  ROLE: "role",
  TYPE: "type",
  ASSIGNED_TO_ME: "assignedToMe",
} as const;

// Default Values for Data Normalization
export const DEFAULT_VALUES = {
  SOP: {
    DEPARTMENT: "Collections",
    STATUS: "Active",
    OWNER: "System",
    VERSION: "1.0",
  },
  TASK: {
    ASSIGNED_TO: "Unassigned",
    UNKNOWN_USER: "Unknown",
  },
  TICKET: {
    CREATED_BY: "Unassigned",
    UNKNOWN_USER: "Unknown",
  },
  GENERIC: {
    UNKNOWN: "unknown",
    UNASSIGNED: "Unassigned",
    NONE: "None",
    NONE_SELECTED: "None selected",
  },
  PAGINATION: {
    PAGE_SIZE: 10,
  },
  /** Page size options for dataview list and export (up to 300 records). */
  DATAVIEW_PAGE_SIZE_OPTIONS: [10, 25, 50, 100, 300] as const,
  /** Page size options for agentic search dataview (capped at 100 results). */
  AGENTIC_SEARCH_PAGE_SIZE_OPTIONS: [10, 25, 50, 100] as const,
  DATA_VIEW_CELL_TRUNCATION: {
    TEXT: 100,
    URL: 120,
    MARKDOWN: 100,
    JSON: 150,
    ARRAY_PREVIEW_COUNT: 4,
    ARRAY_ITEM_LENGTH: 80,
  },
} as const;

// UI Component Sizes
export const UI_SIZES = {
  BUTTON: {
    DEFAULT: "default",
    SM: "sm",
    LG: "lg",
    ICON: "icon",
  },
  BADGE: {
    DEFAULT: "default",
    SM: "sm",
    LG: "lg",
  },
} as const;

// Message Types for Chat/Console
export const MESSAGE_TYPES = {
  USER: "user",
  SYSTEM: "system",
  TICKET_CREATED: "ticket_created",
  TICKET_STATUS: "ticket_status",
  TRIGGER_EXECUTION_SUCCESS: "trigger_execution_success",
} as const;

export type MessageType = (typeof MESSAGE_TYPES)[keyof typeof MESSAGE_TYPES];

// Common CSS Classes for Animation
export const ANIMATION_VARIANTS = {
  FADE_IN: "fade-in",
  FADE_OUT: "fade-out",
  SLIDE_IN: "slide-in",
  SLIDE_OUT: "slide-out",
} as const;

// Keyboard Event Keys
export const KEYBOARD_KEYS = {
  ENTER: "Enter",
  ESCAPE: "Escape",
  SPACE: " ",
  ARROW_UP: "ArrowUp",
  ARROW_DOWN: "ArrowDown",
  ARROW_LEFT: "ArrowLeft",
  ARROW_RIGHT: "ArrowRight",
} as const;

// Filter Constants
export const FILTER_VALUES = {
  ALL_STATUS: "ALL_STATUS",
  ALL_ASSIGNED: "ALL_ASSIGNED",
  ALL_STATES: "ALL_STATES",
  ALL_PRIORITIES: "All", // For compatibility with existing TicketFilters component
  ALL_STATUSES: "All", // For compatibility with existing TicketFilters component
  ALL_DEPARTMENTS: "All", // For SOP department filters
  ALL_ROLES: "ALL", // For resource role filters
  ALL_EXEC_TYPES: "ALL", // For process execution type filters
  ALL_STEP_TYPES: "ALL", // For SOP step type filters
  // SOP Status Filter Values
  ALL: "ALL",
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;

// SOP Sort Options (for dropdown UI)
// TODO: Enable NAME sorting when backend support is added
export const SOP_SORT_OPTIONS = {
  CREATED_DESC: {
    value: "CREATED_DESC",
    label: "Created (Newest First)",
    field: "CREATED_AT",
    order: "DESC",
  },
  CREATED_ASC: {
    value: "CREATED_ASC",
    label: "Created (Oldest First)",
    field: "CREATED_AT",
    order: "ASC",
  },
  // NAME_ASC: {
  //   value: "NAME_ASC",
  //   label: "Name (A-Z)",
  //   field: "NAME",
  //   order: "ASC",
  // },
  // NAME_DESC: {
  //   value: "NAME_DESC",
  //   label: "Name (Z-A)",
  //   field: "NAME",
  //   order: "DESC",
  // },
} as const;

export type SOPSortOption = keyof typeof SOP_SORT_OPTIONS;

// SOP Sort Fields (backend supported for API calls)
// TODO: Enable these sort fields when backend support is added
export const SOP_SORT_FIELDS = {
  CREATED_AT: "CREATED_AT",
  // NAME: "NAME",
} as const;

export type SOPSortField = (typeof SOP_SORT_FIELDS)[keyof typeof SOP_SORT_FIELDS];

// Task Sort Fields (backend supported)
// TODO: Enable these sort fields when backend support is added
export const TASK_SORT_FIELDS = {
  CREATED_AT: "CREATED_AT",
  // NAME: "NAME",
  // STATUS: "STATUS",
  // PROGRESS: "PROGRESS",
  // ASSIGNED_TO: "ASSIGNED_TO",
  // DUE_DATE: "DUE_DATE",
  // TASK_ITEMS_COUNT: "TASK_ITEMS_COUNT",
} as const;

export type TaskSortField = (typeof TASK_SORT_FIELDS)[keyof typeof TASK_SORT_FIELDS];

// Ticket Sort Fields (backend supported)
// TODO: Enable these sort fields when backend support is added
export const TICKET_SORT_FIELDS = {
  CREATED_AT: "CREATED_AT",
  // NAME: "NAME",
  // STATUS: "STATUS",
  // STATE: "STATE",
  // VERSION: "VERSION",
  // CREATED_BY: "CREATED_BY",
  // UPDATES_COUNT: "UPDATES_COUNT",
} as const;

export type TicketSortField = (typeof TICKET_SORT_FIELDS)[keyof typeof TICKET_SORT_FIELDS];

// SOP Step Type Labels
export const SOP_STEP_TYPE_LABELS = {
  [SOP_STEP_TYPES.AI]: "AI",
  [SOP_STEP_TYPES.HIL]: "Human In Loop",
  [SOP_STEP_TYPES.INTEGRATION]: "Integration",
  ALL_STEP_TYPES: "All Step Types",
} as const;

// SOP Status Filter Labels
export const SOP_STATUS_FILTER_LABELS = {
  [FILTER_VALUES.ALL]: "All",
  [FILTER_VALUES.ACTIVE]: "Active",
  [FILTER_VALUES.INACTIVE]: "Inactive",
} as const;

// Workflow Selector Messages
export const WORKFLOW_MESSAGES = {
  LABELS: {
    SELECT_WORKFLOW: "Select Workflow",
    SELECTED: "Selected",
  },
  DESCRIPTIONS: {
    CHOOSE_WORKFLOW: "Choose a workflow to continue",
  },
  PLACEHOLDERS: {
    SELECT_WORKFLOW: "Select a workflow...",
  },
} as const;

// Sort constants
export const SORT_FIELDS = {
  CREATED_AT: "CREATED_AT",
  NAME: "NAME",
  STATUS: "STATUS",
  STATE: "STATE",
  VERSION: "VERSION",
  CREATED_BY: "CREATED_BY",
  UPDATES_COUNT: "UPDATES_COUNT",
  PROGRESS: "PROGRESS",
  ASSIGNED_TO: "ASSIGNED_TO",
  DUE_DATE: "DUE_DATE",
  TASK_ITEMS_COUNT: "TASK_ITEMS_COUNT",
} as const;

export type SortField = (typeof SORT_FIELDS)[keyof typeof SORT_FIELDS];

export const SORT_ORDERS = {
  ASC: "ASC",
  DESC: "DESC",
} as const;

export type SortOrder = (typeof SORT_ORDERS)[keyof typeof SORT_ORDERS];

export const DATA_VIEW_MESSAGES = {
  ERROR: {
    LOAD_DATA_VIEWS: "Failed to load data views",
    LOAD_DATA_VIEWS_DESC: "Failed to load data views for the workflow. Please verify that you are on the correct workspace and workflow.",
    LOAD_DATA_VIEW_DETAILS: "Failed to load data view details",
    LOAD_DATA_VIEW_CONFIG: "Failed to load data view configuration. Please verify that you are on the correct workspace and workflow.",
    LOAD_DATA: "Failed to load data",
    LOAD_DATA_FROM_VIEW: "Failed to load data from the data view",
    SEARCH_FAILED: "Search failed",
    SEARCH_DATA: "Failed to search data",
    VECTOR_SEARCH_FAILED: "Vector search failed",
    VECTOR_SEARCH: "Failed to perform vector search",
    LOAD_ENTITY_SPEC: "Failed to load entity specification",
    LOAD_ENTITY_SCHEMA: "Failed to load entity schema information",
    DATA_VIEW_ID_REQUIRED: "DataView ID is required",
    SEARCH_QUERY_REQUIRED: "Search query is required for vector search",
    UPDATE_FAILED: "Unable to save changes",
    UPDATE_FAILED_DESC: "We couldn't save your changes. Please try again.",
    UPDATE_NOT_ALLOWED: "Updates not allowed",
    UPDATE_NOT_ALLOWED_DESC: "You don't have permission to update this item.",
    UPDATE_NOT_ALLOWED_FIELD: "Field update not allowed",
    UPDATE_NOT_ALLOWED_FIELD_DESC: "This field cannot be modified.",
    DELETE_FAILED: "Unable to remove item",
    DELETE_FAILED_DESC: "We couldn't remove this item. Please try again.",
    DELETE_NOT_ALLOWED: "Deletion not allowed",
    DELETE_NOT_ALLOWED_DESC: "You don't have permission to delete this item.",
    ENTITY_NOT_FOUND: "Item not found",
    ENTITY_NOT_FOUND_DESC: "This item is no longer available in this view.",
    INVALID_DATA: "Invalid data",
    INVALID_DATA_DESC: "The data you provided is not valid. Please check and try again.",
    CREATE_FAILED: "Failed to create record",
    CREATE_FAILED_DESC: "Failed to create record",
  },
  SUCCESS: {
    UPDATE_ENTITY: "Changes saved",
    UPDATE_ENTITY_DESC: "Your changes have been saved successfully.",
    DELETE_ENTITY: "Item removed",
    DELETE_ENTITY_DESC: "The item has been removed from the list.",
    CREATE_ENTITY: "Record created successfully",
    CREATE_ENTITY_DESC: "The new record has been created.",
  },
} as const;

export const DATA_VIEW_TYPE_LABELS: Record<DataViewType, string> = {
  [DATA_VIEW_TYPES.TABLE]: "Table",
  [DATA_VIEW_TYPES.CHART]: "Chart",
  [DATA_VIEW_TYPES.MARKDOWN]: "Markdown",
  [DATA_VIEW_TYPES.JOIN_TABLE]: "Enriched Table",
} as const;

/** Human-readable labels for agentic search execution stages. */
export const AGENTIC_SEARCH_STAGE_LABELS: Record<string, string> = {
  QUERY_LAYER: "Query Layer",
  OUTPUT_LAYER: "Output Layer",
  RANKER_LAYER: "Ranker Layer",
  NONE: "None",
} as const;

/** Agentic search config type discriminators (matches API AgenticSearchConfig.type). */
export const AGENTIC_SEARCH_CONFIG_TYPES = {
  ENTITY_DB: "ENTITY_DB",
  EXTERNAL_DATA: "EXTERNAL_DATA",
  EXTERNAL_DATA_AGENTIC: "EXTERNAL_DATA_AGENTIC",
} as const;

/** Agentic search session statuses (matches API AgenticSearchSessionStatus). */
export const AGENTIC_SEARCH_SESSION_STATUSES = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
} as const;

/** Agentic search execution stage discriminators (matches API AgenticSearchSession.currentStage). */
export const AGENTIC_SEARCH_STAGES = {
  QUERY_LAYER: "QUERY_LAYER",
  OUTPUT_LAYER: "OUTPUT_LAYER",
  RANKER_LAYER: "RANKER_LAYER",
  NONE: "NONE",
} as const;

/** Prefix used by the API for rank follow-on session names. */
export const AGENTIC_SEARCH_RANK_SESSION_NAME_PREFIX = "Rank:";

/** Maximum number of webset search criteria the API accepts. */
export const AGENTIC_SEARCH_MAX_CRITERIA = 5;

/** Default poll interval for agentic search session results (ms). */
export const AGENTIC_SEARCH_DEFAULT_POLL_MS = 10_000;

/** Max character length for the primary name in Exa REST preview cards before truncation. */
export const EXA_REST_PREVIEW_NAME_TRUNCATE_LENGTH = 140;

export const DATA_VIEW_TYPE_ICONS: Record<DataViewType, string> = {
  [DATA_VIEW_TYPES.TABLE]: "Table",
  [DATA_VIEW_TYPES.CHART]: "BarChart",
  [DATA_VIEW_TYPES.MARKDOWN]: "FileText",
  [DATA_VIEW_TYPES.JOIN_TABLE]: "TableProperties",
} as const;

// Entity fields that should be excluded from filter options
export const ENTITY_EXCLUDED_FILTER_FIELDS = {
  NAME: "name",
  CURRENT_STATE: "currentState",
} as const;
