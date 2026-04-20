import type { ProductFlowSessionEvent } from "@/types/orchestration-dashboard-types";

/** Structured payload for CONVERSATION_SESSION_COMPLETED events (see ConversationCompletedEventMessageFormatter). */
export interface ConversationCompletedPayload {
  conversationSessionId?: string;
  conversationId?: string;
  conversationEndedAt?: number;
  sessionComplete?: boolean;
  summary?: string;
  summaryPresent?: boolean;
  completedByEmails?: string[];
  scoredRubric?: {
    score?: number;
    scoringSummary?: string;
    criteriaScores?: Record<string, number>;
  };
}

export function sessionEventDisplayTime(event: ProductFlowSessionEvent): string {
  const ms = event.lastModifiedAt;
  if (ms == null || typeof ms !== "number") {
    return "—";
  }
  return new Date(ms).toLocaleString();
}

/** Step index from the event document (0-based when present). */
export function sessionEventStepIndex(event: ProductFlowSessionEvent): number | undefined {
  const raw = event.stepIndex;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw;
  }
  return undefined;
}

/** User-facing title for session event type (no SCREAMING_SNAKE in UI). */
export function sessionEventTypeUserLabel(eventType: string | undefined): string {
  if (!eventType?.trim()) return "Update";
  const u = eventType.toUpperCase().replace(/\s/g, "_");
  if (u === "CONVERSATION_SESSION_COMPLETED") return "Conversation completed";
  return eventType
    .split("_")
    .filter(Boolean)
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

/** User-facing label for event status (badges). */
export function sessionEventStatusUserLabel(status: string | undefined): string {
  if (!status?.trim()) return "";
  const u = status.toUpperCase();
  if (u === "SUCCEEDED") return "Completed";
  if (u === "FAILED") return "Failed";
  if (u === "PENDING" || u === "IN_PROGRESS" || u === "OPEN") return "In progress";
  if (u === "CANCELLED") return "Cancelled";
  return status.replace(/_/g, " ");
}

/** Badge text: prefer human status, else human event type. */
export function sessionEventCardBadgeText(ev: ProductFlowSessionEvent): string {
  const statusLabel = sessionEventStatusUserLabel(ev.eventStatus);
  if (statusLabel) return statusLabel;
  return sessionEventTypeUserLabel(ev.eventType);
}

/**
 * Parses "Completed by" line from conversation-completed markdown (set by backend).
 */
export function extractCompletedByFromMessage(message: string | undefined): string | undefined {
  if (!message) return undefined;
  const m = message.match(/\*\*Completed by:\*\*\s*([^\n]+)/i);
  return m?.[1]?.trim() || undefined;
}

/** Primary one-line title for completed-conversation cards (participant when available). */
export function conversationCompletedHeadline(ev: { eventName?: string; message?: string }): string {
  const by = extractCompletedByFromMessage(ev.message);
  if (by) {
    return `Conversation completed by ${by}`;
  }
  return ev.eventName?.trim() || "Conversation completed";
}

/** Removes the completed-by line so the body can render without duplicating it next to a headline. */
export function stripCompletedByLineFromMessage(message: string | undefined): string | undefined {
  if (!message?.trim()) return message;
  return message
    .replace(/\n*- \*\*Completed by:\*\*[^\n]*/gi, "")
    .replace(/\n*- \*\*Participant:\*\*[^\n]*/gi, "")
    .trim();
}

/**
 * Parses payloadJSON from a session event (safe for missing/invalid JSON).
 */
export function parseConversationCompletedPayload(
  ev: ProductFlowSessionEvent,
): ConversationCompletedPayload | null {
  const raw = ev.payloadJSON?.trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ConversationCompletedPayload;
  } catch {
    return null;
  }
}

/** Human-friendly label from email local-part (e.g. "jane.doe" → "Jane Doe"). */
export function displayNameFromEmail(email: string | undefined): string {
  if (!email?.includes("@")) return email?.trim() || "—";
  const local = email.split("@")[0]?.trim() ?? "";
  if (!local) return "—";
  return local
    .replace(/[._+-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/** Fallback score from markdown message line `- **Score:** 82%`. */
export function extractScorePercentFromMessage(message: string | undefined): number | undefined {
  if (!message) return undefined;
  const m = message.match(/\*\*Score:\*\*\s*([0-9]+(?:\.[0-9]+)?)\s*%/i);
  if (!m?.[1]) return undefined;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : undefined;
}

/** Plain-text summary fallback when payload has no summary (first chunk of message body). */
export function fallbackSummaryTextFromMessage(message: string | undefined): string | undefined {
  const stripped = stripCompletedByLineFromMessage(message);
  if (!stripped?.trim()) return undefined;
  const noMd = stripped
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/^[-*]\s+/gm, "")
    .trim();
  const firstBlock = noMd.split(/\n\n+/)[0]?.trim();
  return firstBlock || undefined;
}
