import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  ChevronDown,
  Circle,
  ExternalLink,
  Loader2,
  MessageSquare,
  Wrench,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { TaskMessagePanel } from "@/components/flows/task-message-panel";
import {
  useConversationSessionParticipantSummaries,
  useInfiniteProductFlowSessionEvents,
  useMockConversationCompletion,
  useResolveTask,
  useSessionTaskStats,
  useSessionTasks,
} from "@/hooks/use-comms-api";
import { cn } from "@/lib/utils";
import type { ProductFlowSession, ProductFlowSessionEvent } from "@/types/orchestration-dashboard-types";
import type {
  ParticipantSummaryResponse,
  ProductFlowSessionTask,
  ProductFlowSessionTaskStatsResponse,
  ProductFlowSessionTaskStatus,
} from "@/types/api";
import {
  conversationCompletedHeadline,
  displayNameFromEmail,
  extractScorePercentFromMessage,
  fallbackSummaryTextFromMessage,
  extractCompletedByFromMessage,
  parseConversationCompletedPayload,
  sessionEventDisplayTime,
  type ConversationCompletedPayload,
} from "@/components/flows/flow-session-event-helpers";
import { toast } from "sonner";

function taskTypeUserLabel(taskType: string | undefined): string {
  if (!taskType?.trim()) return "Task";
  return taskType
    .split("_")
    .filter(Boolean)
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

function taskDisplayLabel(task: { label?: string; description?: string; taskType?: string }): string {
  const label = task.label?.trim();
  if (label) return label;
  const desc = task.description?.trim();
  if (desc) return desc;
  return taskTypeUserLabel(task.taskType);
}

const TASK_STATUS_CONFIG: Record<
  ProductFlowSessionTaskStatus,
  { icon: typeof Circle; label: string; className: string }
> = {
  OPEN: { icon: Circle, label: "Open", className: "text-blue-600 dark:text-blue-400" },
  COMPLETED: { icon: CheckCircle2, label: "Completed", className: "text-green-600 dark:text-green-400" },
  FAILED: { icon: XCircle, label: "Failed", className: "text-destructive" },
  CANCELLED: { icon: AlertTriangle, label: "Cancelled", className: "text-muted-foreground" },
};

/** Same totals as GET .../tasks/stats (session task entity). */
function SessionTaskStatsStrip({ stats }: { stats: ProductFlowSessionTaskStatsResponse | undefined }) {
  if (!stats) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 rounded-lg border border-border/60 bg-muted/20 p-3">
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Total</p>
        <p className="text-lg font-semibold tabular-nums">{stats.total}</p>
      </div>
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wide text-blue-600 dark:text-blue-400">Open</p>
        <p className="text-lg font-semibold tabular-nums text-blue-600 dark:text-blue-400">{stats.open}</p>
      </div>
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wide text-green-600 dark:text-green-400">Completed</p>
        <p className="text-lg font-semibold tabular-nums text-green-600 dark:text-green-400">{stats.completed}</p>
      </div>
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wide text-destructive">Failed</p>
        <p className="text-lg font-semibold tabular-nums text-destructive">{stats.failed}</p>
      </div>
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Cancelled</p>
        <p className="text-lg font-semibold tabular-nums text-muted-foreground">{stats.cancelled}</p>
      </div>
    </div>
  );
}

function SessionTasksList({ sessionId }: { sessionId: string }) {
  const [page, setPage] = useState(0);
  const [taskSearchInput, setTaskSearchInput] = useState("");
  const [debouncedTaskSearch, setDebouncedTaskSearch] = useState("");
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedTaskSearch(taskSearchInput.trim()), 300);
    return () => window.clearTimeout(t);
  }, [taskSearchInput]);
  useEffect(() => {
    setPage(0);
  }, [debouncedTaskSearch]);

  const { data, isLoading, isFetching } = useSessionTasks(sessionId, page, 20, debouncedTaskSearch);
  const resolveTaskMutation = useResolveTask();
  const [confirmResolve, setConfirmResolve] = useState<{ taskId: string; label: string } | null>(null);
  const [messageTask, setMessageTask] = useState<{ taskId: string; label: string } | null>(null);

  const tasks = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const hasSearch = debouncedTaskSearch.length > 0;
  const listEmpty = totalCount === 0;

  const handleResolve = async (taskId: string, status: "COMPLETED" | "FAILED" | "CANCELLED") => {
    await resolveTaskMutation.mutateAsync({ sessionId, taskId, status });
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-8 justify-center text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        Loading tasks…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {(!listEmpty || hasSearch) && (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-medium text-muted-foreground">
          {totalCount} matching task{totalCount !== 1 ? "s" : ""}
        </p>
        <Input
          type="search"
          placeholder="Search tasks…"
          value={taskSearchInput}
          onChange={(e) => setTaskSearchInput(e.target.value)}
          className="h-9 text-sm max-w-md sm:max-w-xs"
          aria-label="Search tasks"
        />
      </div>
      )}
      <div className="flex items-center justify-end min-h-[1rem]">
        {isFetching && !isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
      </div>
      {listEmpty ? (
        hasSearch ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No tasks match &quot;{debouncedTaskSearch}&quot;. Try a different search or clear the filter.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">No tasks for this session.</p>
        )
      ) : (
      <div className="rounded-lg border border-border/60 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10" />
              <TableHead>Label</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Type</TableHead>
              <TableHead className="hidden md:table-cell">Created</TableHead>
              <TableHead className="w-[80px] text-center">Messages</TableHead>
              <TableHead className="w-[100px] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => {
              const config = TASK_STATUS_CONFIG[task.status] ?? TASK_STATUS_CONFIG.OPEN;
              const StatusIcon = config.icon;
              const isOpen = task.status === "OPEN";
              const isResolving = resolveTaskMutation.isPending;
              return (
                <TableRow key={task.id}>
                  <TableCell>
                    <StatusIcon className={cn("h-4 w-4", config.className)} />
                  </TableCell>
                  <TableCell>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{taskDisplayLabel(task)}</p>
                      {task.description && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{task.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={cn("inline-flex items-center gap-1 text-xs font-medium", config.className)}>
                      <StatusIcon className="h-3 w-3" />
                      {config.label}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="inline-flex rounded border px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground">
                      {task.taskType?.replace(/_/g, " ") ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground whitespace-nowrap">
                    {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 text-xs"
                      onClick={() => setMessageTask({ taskId: task.id, label: taskDisplayLabel(task) })}
                    >
                      <MessageSquare className="h-3 w-3" />
                      {(task.messageCount ?? 0) > 0 && (
                        <span className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold min-w-[16px] h-4 px-1">
                          {task.messageCount}
                        </span>
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    {isOpen ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1 text-xs"
                        disabled={isResolving}
                        onClick={() => setConfirmResolve({ taskId: task.id, label: taskDisplayLabel(task) })}
                      >
                        {isResolving ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                        Complete
                      </Button>
                    ) : (
                      <span className={cn("text-xs font-medium", config.className)}>{config.label}</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      )}
      {!listEmpty && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </div>
      )}

      <AlertDialog open={!!confirmResolve} onOpenChange={(open) => { if (!open) setConfirmResolve(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              Mark <span className="font-medium text-foreground">{confirmResolve?.label}</span> as completed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmResolve) {
                  void handleResolve(confirmResolve.taskId, "COMPLETED");
                  setConfirmResolve(null);
                }
              }}
            >
              Complete Task
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={!!messageTask} onOpenChange={(open) => { if (!open) setMessageTask(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
          <SheetHeader className="sr-only">
            <SheetTitle>Task Messages</SheetTitle>
          </SheetHeader>
          {messageTask && (
            <TaskMessagePanel
              taskId={messageTask.taskId}
              taskLabel={messageTask.label}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

const SUMMARY_PREVIEW_LEN = 120;

/** Must stay aligned with {@code ConversationSessionParticipantLookup} server cap. */
const MAX_CONVERSATION_SESSION_PARTICIPANT_LOOKUP = 100;

type ConversationSortKey = "time" | "score" | "email";

interface CompletedConversationRow {
  ev: ProductFlowSessionEvent;
  payload: ConversationCompletedPayload | null;
  primaryEmail: string | undefined;
  displayName: string;
  completedAtMs: number;
  score: number | undefined;
  summaryText: string | undefined;
  /** From participant directory via conversation session ids (authoritative when present). */
  participantSummaries?: ParticipantSummaryResponse[];
}

function buildCompletedConversationRow(
  ev: ProductFlowSessionEvent,
  participantSummaries?: ParticipantSummaryResponse[] | null,
): CompletedConversationRow {
  const payload = parseConversationCompletedPayload(ev);
  const fromLine = extractCompletedByFromMessage(ev.message);
  const fromDirectory = participantSummaries?.[0];
  const primaryEmail =
    fromDirectory?.email?.trim().toLowerCase() ??
    payload?.completedByEmails?.[0]?.trim().toLowerCase() ??
    (fromLine?.includes("@") ? fromLine.trim().toLowerCase() : undefined);
  const displayNameRaw = fromDirectory?.displayName?.trim();
  const displayName =
    (displayNameRaw && displayNameRaw !== "—" ? displayNameRaw : undefined) ??
    (primaryEmail ? displayNameFromEmail(primaryEmail) : "—");
  const completedAtMs =
    typeof payload?.conversationEndedAt === "number"
      ? payload.conversationEndedAt
      : typeof ev.lastModifiedAt === "number"
        ? ev.lastModifiedAt
        : 0;
  const score =
    typeof payload?.scoredRubric?.score === "number"
      ? payload.scoredRubric.score
      : extractScorePercentFromMessage(ev.message);
  const summaryText =
    (typeof payload?.summary === "string" && payload.summary.trim()
      ? payload.summary.trim()
      : undefined) ?? fallbackSummaryTextFromMessage(ev.message);
  return {
    ev,
    payload,
    primaryEmail,
    displayName,
    completedAtMs,
    score,
    summaryText,
    participantSummaries: participantSummaries && participantSummaries.length > 0 ? participantSummaries : undefined,
  };
}

function sortCompletedConversationRows(
  rows: CompletedConversationRow[],
  sortKey: ConversationSortKey,
  sortDir: "asc" | "desc",
): CompletedConversationRow[] {
  const out = [...rows];
  const dir = sortDir === "asc" ? 1 : -1;
  out.sort((a, b) => {
    if (sortKey === "time") {
      return (a.completedAtMs - b.completedAtMs) * dir;
    }
    if (sortKey === "email") {
      return (a.primaryEmail ?? "").localeCompare(b.primaryEmail ?? "") * dir;
    }
    const sa = a.score;
    const sb = b.score;
    const na = sa == null || Number.isNaN(sa);
    const nb = sb == null || Number.isNaN(sb);
    if (na && nb) return 0;
    if (na) return 1;
    if (nb) return -1;
    return (sa - sb) * dir;
  });
  return out;
}

function formatPercentScore(n: number | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  if (n === Math.floor(n)) return String(Math.round(n));
  return n.toFixed(1);
}

function ConversationSortButton({
  label,
  active,
  sortDir,
  onClick,
}: {
  label: string;
  active: boolean;
  sortDir: "asc" | "desc";
  onClick: () => void;
}) {
  const Icon = !active ? ArrowUpDown : sortDir === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-left font-medium text-foreground hover:underline underline-offset-4"
    >
      {label}
      <Icon className={cn("h-3.5 w-3.5 shrink-0", active ? "text-primary" : "text-muted-foreground/50")} aria-hidden />
    </button>
  );
}

function CompletedConversationScoringDialog({
  row,
  open,
  onOpenChange,
  onOpenConversationSession,
}: {
  row: CompletedConversationRow | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onOpenConversationSession?: (conversationSessionId: string) => void;
}) {
  if (!row) return null;
  const rub = row.payload?.scoredRubric;
  const criteria = rub?.criteriaScores ? Object.entries(rub.criteriaScores) : [];
  const refId = row.ev.referenceId?.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-2 space-y-1">
          <DialogTitle className="text-lg leading-snug pr-8">
            {row.displayName !== "—" ? row.displayName : conversationCompletedHeadline(row.ev)}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="text-sm text-muted-foreground space-y-2">
              {row.participantSummaries && row.participantSummaries.length > 0 ? (
                <ul className="list-none space-y-1.5">
                  {row.participantSummaries.map((p, idx) => (
                    <li key={p.participantId ?? p.email ?? `p-${idx}`}>
                      <span className="font-medium text-foreground">{p.displayName?.trim() || "—"}</span>
                      {p.email ? <span className="text-muted-foreground"> · {p.email}</span> : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>
                  {row.primaryEmail ? row.primaryEmail : "Participant email not recorded"}
                  {typeof rub?.score === "number" ? ` · Overall ${formatPercentScore(rub.score)}%` : ""}
                </p>
              )}
              {row.participantSummaries && row.participantSummaries.length > 0 && typeof rub?.score === "number" ? (
                <p>Overall score: {formatPercentScore(rub.score)}%</p>
              ) : null}
            </div>
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(85vh-8rem)] px-6">
          <div className="space-y-5 pb-6 pr-3">
            {row.summaryText ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Summary</p>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{row.summaryText}</p>
              </div>
            ) : null}
            {rub?.scoringSummary ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                  Scoring narrative
                </p>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{rub.scoringSummary}</p>
              </div>
            ) : null}
            {criteria.length > 0 ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Criteria</p>
                <div className="rounded-md border border-border/80 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[55%]">Criterion</TableHead>
                        <TableHead className="text-right tabular-nums">Score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {criteria.map(([name, val]) => (
                        <TableRow key={name}>
                          <TableCell className="text-sm">{name}</TableCell>
                          <TableCell className="text-right tabular-nums text-sm font-medium">
                            {formatPercentScore(val)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : null}
            {!row.summaryText && !rub?.scoringSummary && criteria.length === 0 ? (
              <p className="text-sm text-muted-foreground">No structured scoring payload for this completion.</p>
            ) : null}
          </div>
        </ScrollArea>
        <div className="flex flex-col-reverse gap-2 border-t border-border/60 px-6 py-4 sm:flex-row sm:justify-end">
          {onOpenConversationSession && refId ? (
            <Button type="button" className="gap-1.5" onClick={() => onOpenConversationSession(refId)}>
              <ExternalLink className="h-4 w-4" />
              Open full conversation session
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CompletedConversationsList({
  session,
  taskStats,
  onOpenConversationSession,
}: {
  session: ProductFlowSession;
  taskStats: ProductFlowSessionTaskStatsResponse | undefined;
  onOpenConversationSession?: (conversationSessionId: string) => void;
}) {
  const [convSearch, setConvSearch] = useState("");
  const [debouncedConvSearch, setDebouncedConvSearch] = useState("");
  const [sortKey, setSortKey] = useState<ConversationSortKey>("time");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [detailRow, setDetailRow] = useState<CompletedConversationRow | null>(null);

  /** Close the scoring dialog before opening the session overlay so Radix modal focus/pointer handling cannot block the overlay (e.g. Back). */
  const openConversationAndCloseDetail = useCallback(
    (conversationSessionId: string) => {
      setDetailRow(null);
      onOpenConversationSession?.(conversationSessionId);
    },
    [onOpenConversationSession],
  );

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedConvSearch(convSearch.trim()), 300);
    return () => window.clearTimeout(t);
  }, [convSearch]);

  const eventsQuery = useInfiniteProductFlowSessionEvents(session.id, {
    pageSize: 25,
    enabled: Boolean(session.id),
    filters: { eventType: "CONVERSATION_SESSION_COMPLETED" },
    searchText: debouncedConvSearch || undefined,
  });

  const items = useMemo(
    () => eventsQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [eventsQuery.data],
  );

  const withRef = useMemo(
    () =>
      items.filter(
        (ev: ProductFlowSessionEvent) =>
          ev.referenceId &&
          (ev.referenceType === "CONVO_SESSION" || ev.referenceType === undefined),
      ),
    [items],
  );

  const conversationSessionIdsForLookup = useMemo(() => {
    const ids = new Set<string>();
    for (const ev of withRef) {
      const id = ev.referenceId?.trim();
      if (id) ids.add(id);
    }
    return Array.from(ids).slice(0, MAX_CONVERSATION_SESSION_PARTICIPANT_LOOKUP);
  }, [withRef]);

  const { data: resolvedParticipants, isFetching: isResolvingParticipants } =
    useConversationSessionParticipantSummaries(
      session.id,
      conversationSessionIdsForLookup,
      Boolean(session.id) && conversationSessionIdsForLookup.length > 0,
    );

  const rows = useMemo(() => {
    const by = resolvedParticipants?.byConversationSessionId ?? {};
    return withRef.map((ev: ProductFlowSessionEvent) => {
      const rid = ev.referenceId?.trim();
      const summaries = rid ? by[rid] : undefined;
      return buildCompletedConversationRow(ev, summaries);
    });
  }, [withRef, resolvedParticipants]);

  const sortedRows = useMemo(
    () => sortCompletedConversationRows(rows, sortKey, sortDir),
    [rows, sortKey, sortDir],
  );

  const handleSort = (key: ConversationSortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir(key === "email" ? "asc" : "desc");
  };

  const taskStatsPreamble = (
    <>
      <SessionTaskStatsStrip stats={taskStats} />
      <p className="text-[11px] text-muted-foreground">
        Counts match session tasks (same source as{" "}
        <span className="font-medium text-foreground">GET …/tasks/stats</span>). Expand{" "}
        <span className="font-medium text-foreground">Tasks</span> below to search or resolve tasks.
      </p>
    </>
  );

  if (eventsQuery.isLoading && items.length === 0) {
    return (
      <div className="space-y-3">
        {taskStatsPreamble}
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading completed conversations…
        </div>
      </div>
    );
  }

  if (withRef.length === 0 && !debouncedConvSearch) {
    return (
      <div className="space-y-3">
        {taskStatsPreamble}
        <p className="text-sm text-muted-foreground py-4">
          No conversation-completed events yet. When a conversation finishes, it will appear here.
        </p>
      </div>
    );
  }

  if (withRef.length === 0 && debouncedConvSearch) {
    return (
      <div className="space-y-3">
        {taskStatsPreamble}
        <Input
          type="search"
          placeholder="Search by participant, time, or message…"
          value={convSearch}
          onChange={(e) => setConvSearch(e.target.value)}
          className="h-9 text-sm"
          aria-label="Search completed conversations"
        />
        <p className="text-sm text-muted-foreground py-4">
          No completed conversations match “{debouncedConvSearch}”. Try a different search.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {taskStatsPreamble}
      <Input
        type="search"
        placeholder="Search by participant, time, or message…"
        value={convSearch}
        onChange={(e) => setConvSearch(e.target.value)}
        className="h-9 text-sm"
        aria-label="Search completed conversations"
      />
      <div className="flex items-center gap-2 min-h-[1.25rem]">
        <p className="text-[11px] text-muted-foreground flex-1">
          Newest completions load first. Column sorts apply to loaded rows — use Load more to widen the sort.
        </p>
        {isResolvingParticipants && conversationSessionIdsForLookup.length > 0 ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Loading participants…
          </span>
        ) : null}
      </div>
      <div className="rounded-lg border border-border/60 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="min-w-[120px]">Name</TableHead>
              <TableHead className="min-w-[160px] hidden sm:table-cell">
                <ConversationSortButton
                  label="Email"
                  active={sortKey === "email"}
                  sortDir={sortDir}
                  onClick={() => handleSort("email")}
                />
              </TableHead>
              <TableHead className="min-w-[100px] whitespace-nowrap">
                <ConversationSortButton
                  label="Completed"
                  active={sortKey === "time"}
                  sortDir={sortDir}
                  onClick={() => handleSort("time")}
                />
              </TableHead>
              <TableHead className="w-[72px] text-right tabular-nums">
                <ConversationSortButton
                  label="Score"
                  active={sortKey === "score"}
                  sortDir={sortDir}
                  onClick={() => handleSort("score")}
                />
              </TableHead>
              <TableHead className="min-w-[200px] hidden md:table-cell">Summary</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRows.map((row) => {
              const ev = row.ev;
              const key = ev.id ?? `${ev.referenceId}-${ev.lastModifiedAt}`;
              const sum = row.summaryText ?? "";
              const truncated = sum.length > SUMMARY_PREVIEW_LEN;
              const shortSum = truncated ? `${sum.slice(0, SUMMARY_PREVIEW_LEN).trim()}…` : sum;
              return (
                <TableRow key={key}>
                  <TableCell className="text-sm font-medium align-top">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-1.5">
                        <span>{row.displayName}</span>
                        {row.participantSummaries && row.participantSummaries.length > 1 ? (
                          <span className="text-[10px] font-normal rounded border border-border/80 px-1 py-0 text-muted-foreground">
                            +{row.participantSummaries.length - 1}
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-muted-foreground truncate sm:hidden mt-0.5">
                        {row.primaryEmail ?? "—"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground align-top hidden sm:table-cell max-w-[200px] truncate">
                    {row.primaryEmail ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap align-top">
                    {row.completedAtMs ? new Date(row.completedAtMs).toLocaleString() : sessionEventDisplayTime(ev)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm font-medium align-top">
                    {formatPercentScore(row.score)}
                    {row.score != null ? "%" : ""}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground align-top hidden md:table-cell max-w-[280px]">
                    {sum ? (
                      <span>
                        {shortSum}{" "}
                        {(truncated || row.payload?.scoredRubric) && (
                          <button
                            type="button"
                            className="text-primary font-medium hover:underline"
                            onClick={() => setDetailRow(row)}
                          >
                            More
                          </button>
                        )}
                      </span>
                    ) : row.payload?.scoredRubric ? (
                      <button
                        type="button"
                        className="text-primary font-medium hover:underline"
                        onClick={() => setDetailRow(row)}
                      >
                        View scoring
                      </button>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-right align-top">
                    <div className="flex flex-col items-end gap-1 sm:flex-row sm:justify-end">
                      {onOpenConversationSession && ev.referenceId ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1 text-xs"
                          onClick={() => openConversationAndCloseDetail(ev.referenceId as string)}
                        >
                          <ExternalLink className="h-3 w-3" />
                          Open
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs md:hidden"
                        onClick={() => setDetailRow(row)}
                      >
                        Details
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {eventsQuery.hasNextPage ? (
        <div className="flex justify-center pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={eventsQuery.isFetchingNextPage}
            onClick={() => eventsQuery.fetchNextPage()}
          >
            {eventsQuery.isFetchingNextPage ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Load more
          </Button>
        </div>
      ) : null}

      <CompletedConversationScoringDialog
        row={detailRow}
        open={detailRow != null}
        onOpenChange={(o) => {
          if (!o) setDetailRow(null);
        }}
        onOpenConversationSession={openConversationAndCloseDetail}
      />
    </div>
  );
}

function hasConversationIdInEvents(session: ProductFlowSession): boolean {
  const registry = session.stepRegistry ?? session.events ?? {};
  return Object.keys(registry).some((k) => k.endsWith(".CONVERSATION_ID") && registry[k]);
}

function MockCompletionSection({ sessionId }: { sessionId: string }) {
  const [email, setEmail] = useState("");
  const mockCompletionMutation = useMockConversationCompletion();

  const run = async () => {
    const e = email.trim();
    if (!e) {
      toast.error("Enter the participant email address");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      toast.error("Enter a valid email address");
      return;
    }
    try {
      await mockCompletionMutation.mutateAsync({ sessionId, email: e });
      setEmail("");
    } catch {
      // toast in mutation
    }
  };

  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl border border-border/60 bg-muted/10 px-4 py-3 text-left hover:bg-muted/30"
        >
          <Wrench className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">Simulate conversation completion</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Creates a mock conversation session, records a timeline event, and completes the matching email task (dev).
            </p>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 space-y-3 rounded-xl border border-border/60 bg-card/80 p-4">
          <div className="space-y-1.5">
            <Label htmlFor="mock-completion-email" className="text-xs text-muted-foreground">
              Participant email (EMAIL_RECIPIENT task)
            </Label>
            <Input
              id="mock-completion-email"
              type="email"
              autoComplete="email"
              placeholder="name@company.com"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              className="h-9 text-sm max-w-md"
            />
          </div>
          <Button
            type="button"
            size="sm"
            disabled={mockCompletionMutation.isPending}
            onClick={() => void run()}
          >
            {mockCompletionMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Run simulation
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export interface FlowSessionResultsTabProps {
  session: ProductFlowSession;
  assemblyId: string;
  onOpenConversationSession?: (conversationSessionId: string) => void;
}

export function FlowSessionResultsTab({ session, assemblyId: _assemblyId, onOpenConversationSession }: FlowSessionResultsTabProps) {
  const showMock = hasConversationIdInEvents(session);
  const { data: taskStats } = useSessionTaskStats(session.id, true);

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-6 overflow-x-hidden overflow-y-auto overscroll-y-contain pr-2 scrollbar-thin pb-24">
      {showMock ? <MockCompletionSection sessionId={session.id} /> : null}

      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Completed conversations</CardTitle>
          <p className="text-xs text-muted-foreground font-normal">
            Conversations that finished during this flow session (newest first). Open a row for full scoring detail or
            the full conversation session.
          </p>
        </CardHeader>
        <CardContent>
          <CompletedConversationsList
            session={session}
            taskStats={taskStats}
            onOpenConversationSession={onOpenConversationSession}
          />
        </CardContent>
      </Card>

      <Collapsible defaultOpen={false} className="group">
        <Card className="border-border/60 overflow-hidden">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-start gap-2 text-left hover:bg-muted/20 transition-colors px-6 py-4 sm:items-center"
            >
              <MessageSquare className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground sm:mt-0" />
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold leading-tight">Tasks</p>
                <p className="text-xs text-muted-foreground font-normal mt-0.5">
                  Expand to search, view, and resolve session tasks. Totals are shown above with completed conversations.
                </p>
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 pb-6">
              <SessionTasksList sessionId={session.id} />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
