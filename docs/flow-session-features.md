# Flow Session Execution — Feature Review & Gap Analysis

This document reviews the complete session execution UI in the **assembly-orchestrator-dashboard-v2** and identifies what the comms-app currently has vs what's missing or broken.

---

## 1. How Sessions Open — Container & Space

### Dashboard behavior
- Sessions open in a **FlowSessionDrawer** — a bottom-anchored drawer that animates to **100vh** (full viewport height).
- The `FlowSessionExecution` component gets the entire viewport minus a thin drawer handle bar (~60px).
- This gives the session execution UI **maximum available space** for the two-panel layout.

### Comms-app current behavior
- Sessions open in a **Sheet** (right-side slide-over) constrained to `sm:max-w-2xl` (~672px).
- This is **far too narrow** for the two-panel split layout that `FlowSessionExecution` needs.
- The sheet background was missing CSS variables (fixed), but the width constraint is the root cause of the "broken" appearance.

### Required fix
- Either make the sheet **full-width** (`max-w-none` or `max-w-[95vw]`), or switch to a **full-screen overlay / page** when a session is opened.
- The dashboard uses `100vh` height for the drawer — the comms-app should give equivalent space.

---

## 2. Active Session — Two-Panel Split Layout

When a session is **ACTIVE** (not completed/abandoned), the `FlowSessionExecution` renders a horizontal split:

### Left panel — Step Execution (~60% width, scrollable)
This is the core of the session experience. The left side renders the **current product flow step** with step-type-specific UI:

| Step Type | Component | What it renders |
|-----------|-----------|-----------------|
| **INFORMATION** | `InformationStep` | Markdown content from `step.content` or `step.description`. Read-only display with typography. |
| **ACTION** | `ActionStepRenderer` (inline in flow-session-execution.tsx) | Loads workflow triggers via `useConsoleWorkflowTriggers`, resolves trigger by `step.workflowTriggerId`, renders `ActionExecutionModal` for input configuration, calls `useRunAutomation` to execute. Shows success card with pulsing "Processing" indicator after execution. |
| **CONVERSATION_CREATOR** | `ConversationCreatorStep` (1,177 lines) | Full conversation wizard: describe-or-pick-template tabs, create with AI, manage items (add/edit/delete), advanced options (language, video/screen/chat toggles, completion emails), save updates. Supports draft sync from chat metadata. |
| **CONVERSATION_CREATOR_FROM_TEMPLATE** | `ConversationCreatorFromTemplateStep` (816 lines) | Template-based wizard: loads template via `useConversationAsTemplate`, per-item question editor, add/remove items, full editor mode, advanced options, create/save flow. |
| **EMAIL_OUTREACH_CREATOR** | `EmailOutreachCreatorStep` (343 lines) | Bootstrap overlay with optional instructions, then `EmailOutreachEditor` for editing recipients, subject, body, send time window, follow-ups. Supports send and add-follow-up. |
| **DATAVIEW** | `DataViewStep` | In the dashboard, delegates to `DataViewDetail` which renders a full data view with entity search, columns, filters. In comms-app: **stub placeholder only**. |

**Step state UI includes:**
- **PENDING + canStart**: "Step is ready to start" card with Start Step button.
- **IN_PROGRESS**: Step name/description + type-specific body (above).
- **COMPLETED + canMoveToNext**: Green success card with "Next Step" or "Done" button.
- **FAILED**: Red error card with error message and Retry button.

### Right panel — Build & Query + Updates (~384px fixed width)
The right side has a **tabbed interface** with two tabs:

#### Tab 1: "Build and Query" (chat)
- Component: `BuildAndQueryChatPanel`
- Renders step-scoped messages from `useSessionMessages(sessionId, stepIndex, 50)`
- Shows contextual banner for CONVERSATION_CREATOR and EMAIL_OUTREACH_CREATOR steps
- Full message streaming via SSE: parent `FlowSessionExecution` handles `sendMessageStream` which emits `token`, `message`, `metadata`, `done`, `error` events
- User messages render as plain text bubbles; assistant messages render as Markdown with syntax highlighting
- Optimistic user message display before server confirmation
- Streaming assistant bubble with "Streaming..." indicator
- Textarea input (3 rows, Shift+Enter for newline, Enter to send)

**Metadata patching (reactive):**
When the stream emits a `metadata` event with `shouldRefresh`, the handler extracts draft fields (`draftConversationName`, `draftConversationDescription`, `draftConversationItemsJson`, `draftConversationPatchUpdatedAt`) and merges them into `draftMetadataPatch`. This patch is applied to the step metadata passed to conversation creator steps, so draft changes from the AI appear immediately in the step UI without a full refetch.

#### Tab 2: "Updates"
- Component: `SessionUpdatesList`
- **Legacy step updates**: Flattens all `session.stepSessions[].updates[]`, sorted by `createdAt` descending. Each card shows: type badge (STATUS_CHANGE, PROGRESS, ERROR, SUCCESS, INFO with color coding), step number, timestamp, optional title, message as Markdown.
- **Session events**: Uses `useInfiniteProductFlowSessionEvents` with 350ms debounced search. Cards show: status badge (SUCCEEDED, FAILED, PENDING, INFO), step index, display time, event name/type, message as Markdown, reference type/id.
- **Display logic**: Legacy cards shown only when events API errors or returns zero rows (pre-migration fallback).
- **Pagination**: "Load more events" button when `hasNextPage`.

---

## 3. Completed Session — Three-Tab View

When `currentStep.sessionStatus === "COMPLETED"`, the entire view switches to a **single-column layout** (no left/right split) using `FlowStepContent wide` (~90% width). The header shows a green "Completed" badge instead of step progress.

### Tab 1: "Updates"
Same `SessionUpdatesList` component as the active session's right panel (legacy step updates + session events with search + pagination).

### Tab 2: "Responses" (`FlowSessionResultsTab`, 1,329 lines)
This is the most complex tab. It includes:

#### Event Table (sub-tab "Event table")
- Full-width scrollable table with columns: Time, Type, Status, Name, Message, View
- **Search**: Text input with 350ms debounce, passed to `useInfiniteProductFlowSessionEvents`
- **Filters**: Event type, event status (text inputs for exact match), date/time range (start/end datetime-local inputs), Apply/Clear buttons
- **Message preview**: Markdown preview with 3-line clamp and "View full" button opening a dialog with full Markdown rendering
- **"View attached"**: For events with `referenceType === "CONVO_SESSION"`, opens `ViewAttachedModal` which loads the full conversation session and renders `ConversationTranscriptViewer`
- **Infinite scroll**: "Load more events" when `hasNextPage`
- Event status coloring: SUCCEEDED (emerald), FAILED (rose), PENDING (amber), INFO (slate)

#### Summary Grid (sub-tab "Summary grid")
- **Pivot form**: Time range (datetime-local inputs), column dimension and row dimension selects from `PIVOT_DIMENSION_OPTIONS` (eventType, eventStatus, eventName, referenceType, stepIndex, lastModifiedAt)
- **Validation**: Row and column must be different; start must be before end
- **API call**: `useProductFlowSessionEventsPivot` with ISO dates, dimensions, `timeBucket: "day"`
- **Result display**: `PivotResultTable` renders a matrix/heatmap-style table with row labels, column labels, and count cells

#### Legacy Results (fallback when events API errors)
- If the events API fails (`!eventsConfigured`), shows:
  - Amber banner explaining the fallback
  - `SessionResultCard` list: collapsible cards with conversation session titles, rubric score badges (color tiers: 80+ green, 60+ blue, else rose), remove button, and `ConversationSessionResultCard` body (loads conversation session, shows messages/items, "View full session" link, `ConversationTranscriptViewer`)

#### Mocking Methods (development/testing collapsible)
- Visible when `(session.status === "COMPLETED" && hasConversationInEvents) || eventsConfigured`
- **Generate mock conversation session**: Posts `MOCK_CONVERSATION_SESSION` update
- **Post mock session event**: Preset select (MOCK, STEP_UPDATE, CONVERSATION_SESSION_COMPLETED, EMAIL_SENT), optional email recipient for EMAIL_SENT preset

### Tab 3: "Query" (completed session chat)
- Component: `CompletedSessionChat` (separate from `BuildAndQueryChatPanel`)
- Fetches **all messages across all steps** (`useSessionMessages(sessionId, undefined, 50)` — no `stepIndex`)
- Same streaming pattern as active chat (SSE via `sendMessageStream`)
- Single-line Input (vs multiline Textarea in active chat)
- Full Markdown rendering for assistant messages with syntax highlighting

---

## 4. Header

### Active session header (single row)
- **Back button**: Ghost button with ArrowLeft + "Back" label
- **Flow title**: `session.name` or `Session {id.slice(0, 8)}`, with tooltip combining `session.name` and `session.note`
- **Step progress**: "Step {current}/{total} ({percentage}%)"
- **Step status pill**: Color-coded badge (IN_PROGRESS = yellow, COMPLETED = green, FAILED = red, else muted)

### Completed session header
- Same back button and title
- No step progress
- Green "Completed" badge with CheckCircle2

---

## 5. Step Navigation Flow

| Action | Handler | Mutation | Behavior |
|--------|---------|----------|----------|
| **Start / Retry** | `handleStartStep` | `useStartStep` | Starts step with `inputData: previousStepOutput` |
| **Complete step** | `handleCompleteStep` | `useCompleteStep` | Completes with `outputData: stepOutputData`, clears state, refetches |
| **Next step** | `handleMoveToNext` | `useMoveToNextStep` | Advances with optional `outputData`, clears state, refetches |
| **Finish flow** | `handleCompleteSession` | `useAcknowledgeStep` (INFORMATION with no next) or `useMoveToNextStep` | Completes and finishes the session |

Auto-advance: After ACTION execution, if `completeStepResponse.transition.type === "AUTO"`, the next-step button is hidden (auto-advanced).

---

## 6. Layout Components (`flow-step-layout.tsx`)

| Component | Purpose |
|-----------|---------|
| `FlowStepContent` | Outer shell with width variants: default (~60%), `wide` (~90%), `fullWidth` (100%) |
| `FlowStepFormInner` | Inner form column: default (`max-w-2xl`), `variant="conversation"` (`max-w-4xl`), `fullWidth` |
| `FlowStepActions` | Flex row for action buttons (Next Step, Done, Complete, etc.) |

---

## 7. Current State in Comms-App

### What EXISTS (full implementations, same line counts as dashboard)
- `flow-session-execution.tsx` — 1,595 lines, full implementation
- `build-and-query-chat-panel.tsx` — 222 lines, full implementation
- `flow-session-results-tab.tsx` — 1,328 lines, full implementation
- `flow-step-layout.tsx` — 86 lines, full implementation
- `action-execution-modal.tsx` — 129 lines, full implementation
- `flow-session-event-helpers.ts` — 18 lines, full implementation
- `information-step.tsx` — 25 lines, full implementation
- `action-step.tsx` — 81 lines, full implementation
- `conversation-creator-step.tsx` — 1,176 lines, full implementation
- `conversation-creator-from-template-step.tsx` — 815 lines, full implementation
- `email-outreach-creator-step.tsx` — 342 lines, full implementation

### What's MISSING or BROKEN

1. **Container width (CRITICAL)**: The Sheet that hosts `FlowSessionExecution` is constrained to `sm:max-w-2xl` (~672px). The dashboard gives it 100vh full screen. This makes the entire session view look broken because:
   - The left/right split can't fit (left panel ~60%, right panel ~384px fixed width = needs ~960px minimum)
   - Conversation and email step wizards need even more width
   - The completed session's Responses tab with its event table needs full width

2. **`data-view-step.tsx`**: 17-line stub with "use orchestration dashboard" message. Dashboard has a full `DataViewDetail` component. (This was an intentional omission — the DataView component tree is very deep and pulls in entity search, columns, filters, etc.)

3. **Shared component stubs**: Several imported shared components are minimal stubs:
   - `MediaUpload`, `AttachedFiles`, `MediaGrid` (null components)
   - `ConversationTranscriptViewer` (minimal)
   - `LoadingScreen` (minimal)
   - `ConversationItemEditor` (may be incomplete)
   - `ConversationItemFromTemplateQuestions` (may be incomplete)

---

## 8. Recommended Fixes (Priority Order)

1. **Widen the session container** — Change the Sheet from `sm:max-w-2xl` to near-full-screen, or replace with a full-page overlay. This alone will make the entire session execution UI functional since all the code is already there.

2. **Verify CSS variables** — The shadcn CSS variables and Tailwind mappings were just added. Verify that `bg-card`, `bg-background`, `text-foreground`, `bg-muted`, `text-primary`, `border-border`, etc. all resolve correctly in the flow session components.

3. **Test step rendering** — With the wider container, test each step type (INFORMATION, ACTION, CONVERSATION_CREATOR, EMAIL_OUTREACH_CREATOR) to verify they render correctly.

4. **Test completed session** — Verify the Updates, Responses, and Query tabs all function with real data.

5. **Shared component gaps** — If `ConversationTranscriptViewer` or `ConversationItemEditor` are needed for full functionality, port them from the dashboard.

6. **DataView step** — Port `DataViewDetail` if data view steps are used in production flows.
