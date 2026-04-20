export const SESSION_VALIDITY_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export const LOGOUT_REASONS = {
  MANUAL:         'MANUAL',
  SESSION_EXPIRED:'SESSION_EXPIRED',
  UNAUTHORIZED:   'UNAUTHORIZED',
} as const

export const OTP_REF = 'comms-app'

export const APP_NAME = 'Comms'

export const DISPATCHER_UI = {
  PAGE_TITLE:         'Work Dispatcher',
  PAGE_SUBTITLE:      'Confirm options to start a flow or open a run · sidebar lists recent sessions.',
  RAIL_TITLE:         'Comms Sessions',
  RAIL_SUBTITLE:      'Most recently updated (any status). Search and load more below.',
  RAIL_SEARCH_PLACEHOLDER: 'Search sessions…',
  RAIL_SHOW_MORE:     'Show more',
  RAIL_SHOW_MORE_LOADING: 'Loading…',
  RAIL_EMPTY:         'No sessions yet.',
  RAIL_NO_MATCHES:    'No sessions match your search.',
  OPTION_PICK_SEARCH_PLACEHOLDER: 'Search options…',
  OPTION_PICK_NO_MATCHES: 'No options match your search.',
  ACTIVE_SESSIONS:    'Active',
  COMPLETED_SESSIONS: 'Completed',
  SIDEBAR_RECENT:     'Recent',
  SHOW_SESSIONS:      'Sessions',
  HIDE_SESSIONS:      'Hide sessions',
  NONE:               'None yet',
  SESSION_IN_PROGRESS:'Session in progress',
  SESSION_OPEN_RUN_HINT: 'Open to configure and manage this run.',
  OPEN_RUN_AND_SETUP: 'Open & Set Up',
  INPUT_PLACEHOLDER:  'What do you need to communicate next…',
} as const

/** OPTION_PICK kinds shown in Comms dispatcher chat (flows and product-flow runs only). */
export const DISPATCHER_OPTION_PICK_CLIENT_KINDS = ['PRODUCT_FLOW', 'PRODUCT_FLOW_SESSION'] as const

export function isDispatcherOptionPickKindShown(kind: string | undefined): boolean {
  const k = kind?.trim()
  if (!k) return false
  return (DISPATCHER_OPTION_PICK_CLIENT_KINDS as readonly string[]).includes(k)
}

/** When OPTION_PICK has more than this many rows, show search + scroll. */
export const DISPATCHER_OPTION_PICK_SCROLL_THRESHOLD = 4

/** Page size for recent session lists (server max 100). */
export const DISPATCHER_RAIL_PAGE_SIZE = 20

export {
  SORT_ORDERS,
  SOP_STEP_TYPES,
} from './orchestration-constants'
