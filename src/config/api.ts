const API_VERSION = import.meta.env.VITE_API_VERSION || 'v0'

/** Routes backed by CommsAppAPI facades (same behavior as legacy paths under /v0/...). */
const C = '/comms-app'
const OD = `${C}/orchestration-dashboard`

export const API_CONFIG = {
  API_VERSION,

  ENDPOINTS: {
    AUTH: {
      GENERATE_OTP:    '/auth/team_member/one-time-code',
      LOGIN:           '/auth/team_member/login',
      LOGOUT:          '/auth/team_member/logout',
      SSO_AUTHORIZE:   '/auth/sso/authorize',
      SSO_COMPLETE_WEB:'/auth/sso/complete-web',
    },

    COMMS_APP: {
      INFO: `${C}/info`,
    },

    DISPATCHER_AGENT: {
      SESSION:  (assemblyId: string) => `${C}/dispatcher-agent/assemblies/${assemblyId}/session`,
      MESSAGES: (assemblyId: string) => `${C}/dispatcher-agent/assemblies/${assemblyId}/messages`,
    },

    /** Product flow definitions (templates) — Comms facade paths. */
    PRODUCT_FLOWS: {
      GET_BY_ASSEMBLY: (assemblyId: string) => `${OD}/${assemblyId}/product-flows`,
      GET_BY_ID: (assemblyId: string, workflowId: string, productFlowId: string) =>
        `${OD}/${assemblyId}/workflow/${workflowId}/product-flows/${productFlowId}`,
    },

    PRODUCT_FLOW_SESSIONS: {
      CREATE:           `${C}/product-flow-session-agent/sessions`,
      SEARCH:           `${C}/product-flow-session-agent/sessions/search`,
      GET:              (sessionId: string) => `${C}/product-flow-session-agent/sessions/${sessionId}`,
      GET_CURRENT_STEP: (sessionId: string) => `${C}/product-flow-session-agent/sessions/${sessionId}/current-step`,
      NEXT_STEP:        (sessionId: string) => `${C}/product-flow-session-agent/sessions/${sessionId}/next-step`,
      START_STEP:       (sessionId: string, stepIndex: number) => `${C}/product-flow-session-agent/sessions/${sessionId}/steps/${stepIndex}/start`,
      COMPLETE_STEP:    (sessionId: string, stepIndex: number) => `${C}/product-flow-session-agent/sessions/${sessionId}/steps/${stepIndex}/complete`,
      RUN_AUTOMATION:   (sessionId: string, stepIndex: number) => `${C}/product-flow-session-agent/sessions/${sessionId}/steps/${stepIndex}/run-automation`,
      ACKNOWLEDGE_STEP: (sessionId: string, stepIndex: number) => `${C}/product-flow-session-agent/sessions/${sessionId}/steps/${stepIndex}/acknowledge`,
      RETRY_STEP:       (sessionId: string, stepIndex: number) => `${C}/product-flow-session-agent/sessions/${sessionId}/steps/${stepIndex}/retry`,
      SEND_MESSAGE:     (sessionId: string) => `${C}/product-flow-session-agent/sessions/${sessionId}/messages`,
      SEND_MESSAGE_SYNC:(sessionId: string) => `${C}/product-flow-session-agent/sessions/${sessionId}/messages/sync`,
      GET_MESSAGES:     (sessionId: string) => `${C}/product-flow-session-agent/sessions/${sessionId}/messages`,
      GET_STEP_UPDATES: (sessionId: string, stepIndex: number) => `${C}/product-flow-session-agent/sessions/${sessionId}/steps/${stepIndex}/updates`,
      BOOTSTRAP:        (sessionId: string, stepIndex: number) => `${C}/product-flow-session-agent/sessions/${sessionId}/steps/${stepIndex}/bootstrap`,
      CREATE_CONVERSATION:  (sessionId: string, stepIndex: number) => `${C}/product-flow-session-agent/sessions/${sessionId}/steps/${stepIndex}/operations/create-conversation`,
      UPDATE_CONVERSATION:  (sessionId: string, stepIndex: number) => `${C}/product-flow-session-agent/sessions/${sessionId}/steps/${stepIndex}/operations/update-conversation`,
      DELETE_CONVERSATION:  (sessionId: string, stepIndex: number) => `${C}/product-flow-session-agent/sessions/${sessionId}/steps/${stepIndex}/operations/delete-conversation`,
      CREATE_EMAIL_OUTREACH:(sessionId: string, stepIndex: number) => `${C}/product-flow-session-agent/sessions/${sessionId}/steps/${stepIndex}/operations/create-email-outreach`,
      GET_EMAIL_OUTREACH:   (sessionId: string, stepIndex: number) => `${C}/product-flow-session-agent/sessions/${sessionId}/steps/${stepIndex}/operations/get-email-outreach`,
      UPDATE_EMAIL_OUTREACH:(sessionId: string, stepIndex: number) => `${C}/product-flow-session-agent/sessions/${sessionId}/steps/${stepIndex}/operations/update-email-outreach`,
      SEND_EMAIL_OUTREACH:  (sessionId: string, stepIndex: number) => `${C}/product-flow-session-agent/sessions/${sessionId}/steps/${stepIndex}/operations/send-email-outreach`,
      ADD_FOLLOW_UP:        (sessionId: string, stepIndex: number) => `${C}/product-flow-session-agent/sessions/${sessionId}/steps/${stepIndex}/operations/add-follow-up`,
      DELETE_EMAIL_OUTREACH:(sessionId: string, stepIndex: number) => `${C}/product-flow-session-agent/sessions/${sessionId}/steps/${stepIndex}/operations/delete-email-outreach`,
      SEND_STEP_UPDATE:     (sessionId: string, stepIndex: number) => `${C}/product-flow-session-agent/sessions/${sessionId}/steps/${stepIndex}/updates`,
      ADD_SESSION_UPDATE:   (sessionId: string) => `${C}/product-flow-session-agent/sessions/${sessionId}/updates`,
      REMOVE_SESSION_RESULT:(sessionId: string, resultId: string) => `${C}/product-flow-session-agent/sessions/${sessionId}/session-results/${resultId}`,
      GET_CONVERSATION_SESSION: (sessionId: string, conversationSessionId: string) =>
        `${C}/product-flow-session-agent/sessions/${sessionId}/conversation-sessions/${conversationSessionId}`,
      EVENTS_SEARCH: (sessionId: string) => `${C}/product-flow-sessions/${sessionId}/events/search`,
      CLOSE:         (sessionId: string) => `${C}/product-flow-session-agent/sessions/${sessionId}/close`,
      REENTER_STEP:  (sessionId: string, stepIndex: number) =>
        `${C}/product-flow-session-agent/sessions/${sessionId}/steps/${stepIndex}/reenter`,
      MOCK_CONVERSATION_COMPLETION: (sessionId: string) =>
        `${C}/product-flow-session-agent/sessions/${sessionId}/mock-conversation-completion`,
      TASKS:         (sessionId: string) => `${C}/product-flow-session-agent/sessions/${sessionId}/tasks`,
      TASKS_STATS:   (sessionId: string) => `${C}/product-flow-session-agent/sessions/${sessionId}/tasks/stats`,
      TASK_MESSAGES: (taskId: string) => `${C}/task-messages/tasks/${taskId}/messages`,
      TASK_MESSAGE_COUNT: (taskId: string) => `${C}/task-messages/tasks/${taskId}/messages/count`,
      TASK_MESSAGE_MEDIA: (taskId: string, mediaId: string) => `${C}/task-messages/tasks/${taskId}/messages/media/${mediaId}`,
      INTEGRATIONS_PARTICIPANT_BATCH: () => `${C}/integrations/participants/batch`,
      INTEGRATIONS_CONNECTIONS: () => `${C}/integrations/connections`,
      INTEGRATIONS_CONNECTION: (id: string) => `${C}/integrations/connections/${id}`,
      INTEGRATIONS_CONNECTION_AUTO_SYNC: (id: string) => `${C}/integrations/connections/${id}/auto-sync`,
      INTEGRATIONS_CONNECTION_TARGET: (id: string) => `${C}/integrations/connections/${id}/target`,
      INTEGRATIONS_GOOGLE_FOLDERS: (id: string) => `${C}/integrations/connections/${id}/google-drive/folders`,
      INTEGRATIONS_GOOGLE_FOLDER_CREATE: (id: string) => `${C}/integrations/connections/${id}/google-drive/folders`,
      INTEGRATIONS_SHAREPOINT_DRIVES: (id: string) => `${C}/integrations/connections/${id}/sharepoint/drives`,
      INTEGRATIONS_SHAREPOINT_FOLDERS: (id: string) => `${C}/integrations/connections/${id}/sharepoint/folders`,
      INTEGRATIONS_GOOGLE_AUTHORIZE: () => `${C}/integrations/connections/oauth/google/authorize`,
      INTEGRATIONS_SHAREPOINT_AUTHORIZE: () => `${C}/integrations/connections/oauth/sharepoint/authorize`,
      INTEGRATIONS_EXPORT: () => `${C}/integrations/export`,
      INTEGRATIONS_EXPORT_JOB: (jobId: string) => `${C}/integrations/export/${jobId}`,
      INTEGRATIONS_EXPORT_JOB_RETRY: (jobId: string) => `${C}/integrations/export/${jobId}/retry`,
      INTEGRATIONS_EXPORT_HISTORY: () => `${C}/integrations/export/history`,
      RESOLVE_CONVERSATION_SESSION_PARTICIPANTS: (sessionId: string) =>
        `${C}/product-flow-session-agent/sessions/${sessionId}/conversation-sessions/participants/resolve`,
    },

    PARTICIPANTS: {
      SEARCH: (assemblyId: string) => `${OD}/${assemblyId}/participants/search`,
      CREATE: (assemblyId: string) => `${OD}/${assemblyId}/participants`,
      UPDATE: (assemblyId: string, participantId: string) => `${OD}/${assemblyId}/participants/${participantId}`,
    },

    CONVERSATIONS: {
      GET: (id: string) => `${OD}/conversations-app/conversation/${id}`,
      /** Matches OrchestrationDashboardConversationsAppAPI GET /conversation/{id}/as-template */
      GET_AS_TEMPLATE: (id: string) =>
        `${OD}/conversations-app/conversation/${id}/as-template`,
    },

    /** Conversation template listing (same paths as assembly-orchestrator-dashboard-v2). */
    CONVERSATION_TEMPLATES: {
      CONVERSATIONS: (assemblyId: string) =>
        `${OD}/conversations-app/conversation-template/conversations?assemblyID=${encodeURIComponent(assemblyId)}`,
    },

    ASSIGNMENT: {
      TEAM_MEMBERS_SEARCH: (assemblyId: string) =>
        `${OD}/assignment/${assemblyId}/team-members/search`,
    },

    CONVERSATION_SESSIONS: {
      GET: (id: string) => `${OD}/conversations-app/conversation/session/${id}`,
      DELETE: (id: string) => `${OD}/conversations-app/conversation/session/${id}`,
      SEARCH: (assemblyId: string) =>
        `${OD}/conversations-app/conversation/session/search?assemblyID=${encodeURIComponent(assemblyId)}`,
      SUMMARIES: (assemblyId: string, conversationId: string) =>
        `${OD}/conversations-app/conversation/session/summaries?assemblyID=${encodeURIComponent(assemblyId)}&conversationId=${encodeURIComponent(conversationId)}`,
      RECORDING_SIGNED_URL: (sessionId: string, mediaPath: string) =>
        `${OD}/conversations-app/conversation/session/${sessionId}/recording?mediaPath=${encodeURIComponent(mediaPath)}`,
      /** Presigned URL for conversation media (matches dashboard CONVERSATION_ITEM_MEDIA). */
      CONVERSATION_MEDIA: (conversationId: string, mediaId: string) =>
        `${OD}/conversations-app/conversation/${conversationId}/media/${mediaId}`,
    },

    /** CommsAppAdminDelegator — participant batch for conversation session cards */
    COMMS_ADMIN: {
      PARTICIPANTS_BATCH: `${C}/admin/participants/batch`,
    },

    MEDIA: {
      UPLOAD_ENTITY_MEDIA: (assemblyId: string, workflowId: string, entitySpecId: string) =>
        `${OD}/${assemblyId}/workflow/${workflowId}/entity/spec/${entitySpecId}/media`,
    },

    ORCHESTRATION: {
      /** Console triggers (Comms facade under /comms-app/orchestration-dashboard). */
      CONSOLE_PUBLISHED_TRIGGERS: (assemblyId: string, workflowId: string) =>
        `${OD}/console/${assemblyId}/workflow/${workflowId}/triggers/published`,
      CONSOLE_KICKOFF_TRIGGER: (assemblyId: string, workflowId: string, triggerId: string) =>
        `${OD}/console/${assemblyId}/workflow/${workflowId}/triggers/${triggerId}/kickoff`,
      /** Data view / entity / geo: not facaded on CommsAppAPI; call orchestration-dashboard directly. */
      ENTITY_SPEC: (assemblyId: string, workflowId: string, entitySpecId: string) =>
        `/orchestration-dashboard/${assemblyId}/workflow/${workflowId}/entityspec/${entitySpecId}`,
      ENTITY_SEARCH: (assemblyId: string, workflowId: string) =>
        `/orchestration-dashboard/${assemblyId}/workflow/${workflowId}/entity/search`,
      DATA_VIEW_DETAILS: (assemblyId: string, workflowId: string, dataViewId: string) =>
        `/orchestration-dashboard/${assemblyId}/workflow/${workflowId}/dataviews/${dataViewId}`,
      DATA_VIEW_SEARCH_DATA: (assemblyId: string, workflowId: string, dataViewId: string) =>
        `/orchestration-dashboard/${assemblyId}/workflow/${workflowId}/dataviews/${dataViewId}/search`,
      DATA_VIEW_ENRICH_SEARCH: (assemblyId: string, workflowId: string, dataViewId: string) =>
        `/orchestration-dashboard/${assemblyId}/workflow/${workflowId}/dataviews/${dataViewId}/enrich/search`,
      GEO_TYPEAHEAD_CITIES: '/orchestration-dashboard/geolocation/typeahead/cities',
    },

    TRIGGER_MEDIA: {
      UPLOAD: (triggerId: string) => `${C}/media/triggers/${triggerId}`,
      GET: (triggerId: string, mediaId: string) => `${C}/media/triggers/${triggerId}/media/${mediaId}`,
      DELETE: (triggerId: string, mediaId: string) => `${C}/media/triggers/${triggerId}/media/${mediaId}`,
    },
  },

  STATUS_CODES: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504,
  } as const,

  REQUEST: {
    TIMEOUT: 300_000,
    DATA_VIEW_SEARCH_TIMEOUT: parseInt(import.meta.env.VITE_DATA_VIEW_SEARCH_TIMEOUT || '300000', 10),
  },

  FEATURES: {
    ENABLE_DEBUG_LOGGING: import.meta.env.VITE_API_DEBUG === 'true',
  },
} as const

export const HTTP_STATUS_CODES = API_CONFIG.STATUS_CODES
