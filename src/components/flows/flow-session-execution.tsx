import { useState, useRef, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
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
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, Send, Loader2, ChevronRight, CheckCircle2, AlertCircle, Play, MessageSquare, LayoutList, XCircle, PenLine, ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import {
  useSessionMessages,
  useCurrentStep,
  useCompleteStep,
  useMoveToNextStep,
  useStartStep,
  useRunAutomation,
  useAcknowledgeStep,
  useConsoleWorkflowTriggers,
  useProductFlowSession,
  useCloseSession,
  useReenterStep,
  useInfiniteProductFlowSessionEvents,
  queryKeys,
} from "@/hooks/use-comms-api";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { InformationStep } from "@/components/flows/flow-steps/information-step";
import { DataViewStep } from "@/components/flows/flow-steps/data-view-step";
import { ConversationCreatorStep } from "@/components/flows/flow-steps/conversation-creator-step";
import { ConversationCreatorFromTemplateStep } from "@/components/flows/flow-steps/conversation-creator-from-template-step";
import { EmailOutreachCreatorStep } from "@/components/flows/flow-steps/email-outreach-creator-step";
import ActionExecutionModal from "@/components/flows/action-execution-modal";
import { BuildAndQueryChatPanel, FlowBuilderStarterSection } from "@/components/flows/build-and-query-chat-panel";
import { FlowSessionResultsTab } from "@/components/flows/flow-session-results-tab";
import { FlowStepActions, FlowStepContent, FlowStepFormInner } from "@/components/flows/flow-step-layout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type {
  ProductFlowSession,
  ActionFlowStep,
  TriggerExecutionResponse,
  TriggerInputValue,
  EmailOutreach,
  ProductFlowSessionEvent,
} from "@/types/orchestration-dashboard-types";
import {
  extractCompletedByFromMessage,
  sessionEventCardBadgeText,
  sessionEventDisplayTime,
  sessionEventTypeUserLabel,
  stripCompletedByLineFromMessage,
} from "@/components/flows/flow-session-event-helpers";

interface OptimisticMessage {
  content: string;
  createdAtMs: number;
}

function getCreatedAtMs(value: string | number | Date | undefined): number {
  if (typeof value === "number") return value;
  if (value instanceof Date) return value.getTime();
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

const UPDATE_TYPE_COLORS: Record<string, string> = {
  INFO: "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300",
  WARNING: "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-300",
  ERROR: "bg-red-50 border-red-200 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-300",
  SUCCESS: "bg-green-50 border-green-200 text-green-700 dark:bg-green-950 dark:border-green-800 dark:text-green-300",
};

function sessionEventBadgeClass(eventStatus?: string): string {
  if (!eventStatus) return "bg-muted text-muted-foreground border-border";
  const s = eventStatus.toUpperCase();
  if (s === "COMPLETED" || s === "SUCCESS" || s === "SENT") return UPDATE_TYPE_COLORS.SUCCESS;
  if (s === "FAILED" || s === "ERROR") return UPDATE_TYPE_COLORS.ERROR;
  if (s === "PENDING" || s === "IN_PROGRESS" || s === "OPEN") return UPDATE_TYPE_COLORS.INFO;
  if (s === "CANCELLED") return UPDATE_TYPE_COLORS.WARNING;
  return "bg-muted text-muted-foreground border-border";
}

function SessionUpdatesList({
  session,
  onOpenConversationSession,
}: {
  session: ProductFlowSession;
  onOpenConversationSession?: (conversationSessionId: string) => void;
}) {
  const [eventsSearchInput, setEventsSearchInput] = useState("");
  const [debouncedEventsSearch, setDebouncedEventsSearch] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedEventsSearch(eventsSearchInput.trim()), 350);
    return () => window.clearTimeout(t);
  }, [eventsSearchInput]);

  const eventsQuery = useInfiniteProductFlowSessionEvents(session.id, {
    searchText: debouncedEventsSearch,
    pageSize: 20,
    enabled: !!session.id,
  });

  const allUpdates = useMemo(
    () =>
      (session.stepSessions ?? [])
        .flatMap((ss) =>
          (ss.updates ?? []).map((u) => ({ ...u, stepIndex: ss.stepIndex }))
        )
        .sort((a, b) => b.createdAt - a.createdAt),
    [session.stepSessions]
  );

  const eventEntities = eventsQuery.data?.pages.flatMap((p) => p.items) ?? [];
  const hasStepUpdates = allUpdates.length > 0;
  const showLegacyStepUpdates = hasStepUpdates && (eventsQuery.isError || eventEntities.length === 0);

  if (!hasStepUpdates && eventsQuery.isError && !eventsQuery.isLoading) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center py-8">
        <p className="text-sm text-muted-foreground">No updates yet</p>
      </div>
    );
  }

  if (!hasStepUpdates && !eventsQuery.isError && eventsQuery.isLoading && eventEntities.length === 0) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center py-8 gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        Loading updates…
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto space-y-6 pr-2 scrollbar-thin bg-background rounded-md p-3">
      {showLegacyStepUpdates && (
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Step updates
          </h3>
          {allUpdates.map((update) => (
            <Card key={update.id} className="bg-card border-2 border-border shadow-md">
              <CardContent className="p-4 text-foreground">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className={cn("text-xs px-2 py-0.5 rounded font-medium border", UPDATE_TYPE_COLORS[update.type] ?? "bg-muted text-muted-foreground border-border")}>
                    {update.type}
                  </span>
                  <span className="text-xs text-foreground font-medium">
                    Step {update.stepIndex + 1} · {new Date(update.createdAt).toLocaleString()}
                  </span>
                </div>
                {update.title && <p className="text-base font-semibold text-foreground mb-2">{update.title}</p>}
                {update.message && (
                  <div className={cn("text-base text-foreground prose prose-sm max-w-none dark:prose-invert", "prose-p:my-1.5 prose-ul:my-1 prose-li:my-0")}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{update.message}</ReactMarkdown>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      <section className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Session events</h3>
          {!eventsQuery.isError && (
            <div className="flex flex-col gap-1 max-w-md w-full">
              <Input
                value={eventsSearchInput}
                onChange={(e) => setEventsSearchInput(e.target.value)}
                placeholder="Search message, name, or type…"
                className="h-9 text-sm"
              />
            </div>
          )}
        </div>
        {eventsQuery.isError && !eventsQuery.isLoading && (
          <p className="text-xs text-muted-foreground">Session events could not be loaded.</p>
        )}
        {eventsQuery.isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Loading events…
          </div>
        )}
        {!eventsQuery.isLoading && !eventsQuery.isError && eventEntities.length === 0 && (
          <p className="text-sm text-muted-foreground">No session events match your search.</p>
        )}
        {!eventsQuery.isError &&
          eventEntities.map((ev: ProductFlowSessionEvent) => {
            const eventName = ev.eventName;
            const rawMessage = ev.message;
            const completedBy = extractCompletedByFromMessage(rawMessage);
            const messageBody = stripCompletedByLineFromMessage(rawMessage);
            const eventStatus = ev.eventStatus;
            const refType = ev.referenceType;
            const refId = ev.referenceId;
            const isConvoSessionRef =
              Boolean(refId) && (refType === "CONVO_SESSION" || refType === undefined);
            const badgeLabel = sessionEventCardBadgeText(ev);
            const titleText = eventName?.trim() || sessionEventTypeUserLabel(ev.eventType);
            return (
              <Card key={ev.id ?? `${refType}-${refId}-${ev.lastModifiedAt}`} className="bg-card border-2 border-border shadow-md">
                <CardContent className="p-4 text-foreground">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={cn("text-xs px-2 py-0.5 rounded font-medium border", sessionEventBadgeClass(eventStatus))}>
                      {badgeLabel}
                    </span>
                    <span className="text-xs text-foreground font-medium text-right">
                      {sessionEventDisplayTime(ev)}
                    </span>
                  </div>
                  {titleText ? (
                    <p className="text-base font-semibold text-foreground mb-1">{titleText}</p>
                  ) : null}
                  {completedBy ? (
                    <p className="text-sm text-muted-foreground mb-2">
                      Completed by <span className="text-foreground font-medium">{completedBy}</span>
                    </p>
                  ) : null}
                  {messageBody ? (
                    <div className={cn("text-base text-foreground prose prose-sm max-w-none dark:prose-invert", "prose-p:my-1.5 prose-ul:my-1 prose-li:my-0")}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{messageBody}</ReactMarkdown>
                    </div>
                  ) : null}
                  {onOpenConversationSession && isConvoSessionRef && refId ? (
                    <div className="mt-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1 text-xs"
                        onClick={() => onOpenConversationSession(refId)}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Open conversation
                      </Button>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        {!eventsQuery.isError && eventsQuery.hasNextPage && (
          <div className="flex justify-center pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={eventsQuery.isFetchingNextPage}
              onClick={() => eventsQuery.fetchNextPage()}
            >
              {eventsQuery.isFetchingNextPage ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading…
                </>
              ) : (
                "Load more"
              )}
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}

function CompletedSessionChat({
  sessionId,
  stepIndex,
}: {
  sessionId: string;
  stepIndex: number;
}) {
  const [message, setMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [optimisticUserMessage, setOptimisticUserMessage] = useState<OptimisticMessage | null>(null);
  const streamingContentRef = useRef("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Omit stepIndex to fetch all messages across steps (chat may have occurred in any step)
  const { data: messages = [], isLoading, refetch: refetchMessages } = useSessionMessages(
    sessionId,
    undefined,
    50,
    { enabled: true }
  );

  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      });
    });
    return () => cancelAnimationFrame(rafId);
  }, [messages.length, streamingContent, optimisticUserMessage]);

  useEffect(() => {
    if (
      optimisticUserMessage &&
      messages.some(
        (msg) =>
          msg.role === "USER" &&
          msg.content.trim() === optimisticUserMessage.content.trim() &&
          getCreatedAtMs(msg.createdAt) >= optimisticUserMessage.createdAtMs - 2_000
      )
    ) {
      setOptimisticUserMessage(null);
    }
  }, [messages, optimisticUserMessage]);

  const sendChatText = async (rawText: string) => {
    const messageToSend = rawText.trim();
    if (!messageToSend || isStreaming) return;

    setOptimisticUserMessage({
      content: messageToSend,
      createdAtMs: Date.now(),
    });
    setMessage("");
    setIsStreaming(true);
    setStreamingContent("");
    streamingContentRef.current = "";

    try {
      const { commsAPI } = await import("@/services/comms-api");
      await commsAPI.sendMessageStream(
        sessionId,
        { message: messageToSend, stepIndex },
        (event) => {
          if (event.type === "token") {
            const token = event.data?.content || "";
            streamingContentRef.current += token;
            setStreamingContent(streamingContentRef.current);
          } else if (event.type === "message" && !streamingContentRef.current) {
            const content = event.data?.content || "";
            streamingContentRef.current = content;
            setStreamingContent(content);
          } else if (event.type === "metadata" && event.data?.shouldRefresh) {
            refetchMessages();
          } else if (event.type === "done") {
            setIsStreaming(false);
            setStreamingContent("");
            streamingContentRef.current = "";
            refetchMessages();
          } else if (event.type === "error") {
            setIsStreaming(false);
            setStreamingContent("");
            streamingContentRef.current = "";
            setOptimisticUserMessage(null);
            toast.error("Message failed", { description: event.data?.message || "Failed to send message" });
          }
        }
      );
    } catch (error) {
      setIsStreaming(false);
      setStreamingContent("");
      streamingContentRef.current = "";
      setOptimisticUserMessage(null);
      toast.error("Message failed", { description: error instanceof Error ? error.message : "Failed to send message" });
    }
  };

  const handleSendMessage = async () => {
    await sendChatText(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  const hasContent = messages.length > 0 || optimisticUserMessage || streamingContent;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2 scrollbar-thin min-h-0 bg-background/50 rounded-md p-3">
        {isLoading && !optimisticUserMessage && !streamingContent ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !hasContent ? (
          <div className="py-2">
            <FlowBuilderStarterSection disabled={isStreaming} onSelectPrompt={(text) => void sendChatText(text)} />
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex", msg.role === "USER" ? "justify-end" : "justify-start")}
              >
                <Card
                  className={cn(
                    "max-w-[85%]",
                    msg.role === "USER" ? "bg-primary text-primary-foreground" : "bg-background border-2 border-border text-foreground"
                  )}
                >
                  <CardContent className="p-3">
                    {msg.role === "USER" ? (
                      <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                    ) : (
                      <div className="prose prose-sm max-w-none dark:prose-invert prose-p:text-foreground prose-p:text-sm prose-p:my-1 prose-headings:text-foreground prose-headings:font-semibold prose-strong:text-foreground prose-code:text-foreground prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:text-foreground">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}
                    <div className={cn("text-xs mt-1", msg.role === "USER" ? "text-primary-foreground/80" : "text-muted-foreground")}>
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            {optimisticUserMessage &&
              !messages.some(
                (m) =>
                  m.role === "USER" &&
                  m.content.trim() === optimisticUserMessage.content.trim() &&
                  getCreatedAtMs(m.createdAt) >= optimisticUserMessage.createdAtMs - 2_000
              ) && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
                <Card className="max-w-[85%] bg-primary text-primary-foreground">
                  <CardContent className="p-3">
                    <div className="text-sm whitespace-pre-wrap">{optimisticUserMessage.content}</div>
                    <div className="text-xs mt-1 text-primary-foreground/90">
                      {new Date(optimisticUserMessage.createdAtMs).toLocaleTimeString()}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
            {streamingContent && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                <Card className="max-w-[85%] bg-background border-2 border-border text-foreground">
                  <CardContent className="p-3">
                    <div className="prose prose-sm max-w-none dark:prose-invert prose-p:text-foreground prose-p:text-sm prose-p:my-1 prose-headings:text-foreground prose-headings:font-semibold prose-strong:text-foreground prose-code:text-foreground prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:text-foreground">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                        {streamingContent}
                      </ReactMarkdown>
                    </div>
                    {isStreaming && (
                      <div className="flex items-center gap-2 mt-2">
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Streaming...</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      <div className="flex-shrink-0 border-t-2 border-border pt-4 mt-2">
        <div className="flex items-center gap-3 bg-background rounded-lg border-2 border-border shadow-md p-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isStreaming}
            className="flex-1 h-12 text-base bg-background border-0 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 placeholder:text-muted-foreground"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || isStreaming}
            size="icon"
            className="h-12 w-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
          >
            {isStreaming ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface FlowSessionExecutionProps {
  session: ProductFlowSession;
  onBack: () => void;
  assemblyId: string;
  workflowId?: string;
  onOpenConversationSession?: (conversationSessionId: string) => void;
}

export function FlowSessionExecution({
  session,
  onBack,
  assemblyId,
  workflowId,
  onOpenConversationSession,
}: FlowSessionExecutionProps) {
  const [stepOutputData, setStepOutputData] = useState<Record<string, unknown> | null>(null);
  const [createdConversationId, setCreatedConversationId] = useState<string | null>(null);
  const [createdEmailOutreachId, setCreatedEmailOutreachId] = useState<string | null>(null);

  const [completedViewTab, setCompletedViewTab] = useState<"updates" | "responses" | "queries">("updates");

  const { data: fullSession } = useProductFlowSession(session.id, { enabled: true });
  const sessionWithSteps: ProductFlowSession = (fullSession ?? session) as ProductFlowSession;
  const closeSessionMutation = useCloseSession();
  const reenterStepMutation = useReenterStep();
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [editStepConfirm, setEditStepConfirm] = useState<{ stepIndex: number; name: string } | null>(null);

  // Streaming state
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const streamingContentRef = useRef("");
  
  // Optimistic user message (shown immediately before API response)
  const [optimisticUserMessage, setOptimisticUserMessage] = useState<OptimisticMessage | null>(null);
  const [draftMetadataPatch, setDraftMetadataPatch] = useState<Record<string, string> | null>(null);

  const { data: currentStep, isLoading: isLoadingStep, refetch: refetchCurrentStep } = useCurrentStep(
    session.id,
    { enabled: true }
  );

  const { data: messages = [], refetch: refetchMessages } = useSessionMessages(
    session.id,
    currentStep?.stepIndex,
    50,
    { enabled: true }
  );

  const queryClient = useQueryClient();
  const completeStepMutation = useCompleteStep();
  const moveToNextStepMutation = useMoveToNextStep();
  const startStepMutation = useStartStep();
  const acknowledgeStepMutation = useAcknowledgeStep();

  // Clear optimistic message when it appears in fetched messages
  useEffect(() => {
    if (
      optimisticUserMessage &&
      messages.some(
        (msg) =>
          msg.role === "USER" &&
          msg.content.trim() === optimisticUserMessage.content.trim() &&
          getCreatedAtMs(msg.createdAt) >= optimisticUserMessage.createdAtMs - 2_000
      )
    ) {
      setOptimisticUserMessage(null);
    }
  }, [messages, optimisticUserMessage]);

  // Refetch current step after mutations
  useEffect(() => {
    if (completeStepMutation.isSuccess || moveToNextStepMutation.isSuccess || acknowledgeStepMutation.isSuccess) {
      refetchCurrentStep();
    }
  }, [completeStepMutation.isSuccess, moveToNextStepMutation.isSuccess, acknowledgeStepMutation.isSuccess, refetchCurrentStep]);

  // Clear localStorage when session completes
  useEffect(() => {
    if (currentStep?.sessionStatus === "COMPLETED") {
      localStorage.removeItem('currentFlowSessionId');
    }
  }, [currentStep?.sessionStatus]);

  // Auto-poll when session is IN_PROGRESS (post-actions running, tasks resolving)
  useEffect(() => {
    if (currentStep?.sessionStatus !== "IN_PROGRESS") return;
    const interval = setInterval(() => {
      refetchCurrentStep();
    }, 5000);
    return () => clearInterval(interval);
  }, [currentStep?.sessionStatus, refetchCurrentStep]);

  useEffect(() => {
    // Reset transient draft patch when step changes.
    setDraftMetadataPatch(null);
  }, [currentStep?.stepIndex]);

  const handleSendMessage = async (messageText: string) => {
    const messageToSend = messageText.trim();
    if (!messageToSend || isStreaming) return;

    // Show user message immediately (optimistic UI)
    setOptimisticUserMessage({
      content: messageToSend,
      createdAtMs: Date.now(),
    });
    setIsStreaming(true);
    setStreamingContent("");
    streamingContentRef.current = "";

    try {
      const { commsAPI } = await import("@/services/comms-api");
      
      await commsAPI.sendMessageStream(
        session.id,
        {
          message: messageToSend,
          stepIndex: currentStep?.stepIndex,
        },
        (event) => {
          try {
            const debugPayload = JSON.stringify({
              sessionId: session.id,
              stepIndex: currentStep?.stepIndex,
              type: event.type,
              data: event.data ?? null,
            });
            console.log(`[FlowSessionExecution][chat-event] ${debugPayload}`);
          } catch (e) {
            console.log("[FlowSessionExecution][chat-event] Failed to stringify event payload", e);
          }
          if (event.type === "token") {
            // Raw streaming fragments for live typing effect
            const token = event.data?.content || "";
            streamingContentRef.current += token;
            setStreamingContent(streamingContentRef.current);
          } else if (event.type === "message") {
            // Complete message from LLM - could also append to streaming content
            // For now, we'll use this as a backup if no tokens were sent
            if (!streamingContentRef.current) {
              const content = event.data?.content || "";
              streamingContentRef.current = content;
              setStreamingContent(content);
            }
          } else if (event.type === "function_call") {
            // LLM is calling a function - could show an indicator
            // The description field provides human-friendly text
          } else if (event.type === "metadata") {
            // Session state update - check if conversation/email was updated by function call
            if (event.data?.shouldRefresh) {
              const draftPatch: Record<string, string> = {};
              if (typeof event.data?.draftConversationName === "string") {
                draftPatch.draftConversationName = event.data.draftConversationName;
              }
              if (typeof event.data?.draftConversationDescription === "string") {
                draftPatch.draftConversationDescription = event.data.draftConversationDescription;
              }
              if (typeof event.data?.draftConversationItemsJson === "string") {
                draftPatch.draftConversationItemsJson = event.data.draftConversationItemsJson;
              }
              if (typeof event.data?.draftConversationPatchUpdatedAt === "string") {
                draftPatch.draftConversationPatchUpdatedAt = event.data.draftConversationPatchUpdatedAt;
              }
              if (Object.keys(draftPatch).length > 0) {
                try {
                  console.log(
                    `[FlowSessionExecution][draft-patch] ${JSON.stringify({
                      sessionId: session.id,
                      stepIndex: currentStep?.stepIndex,
                      draftPatch,
                    })}`
                  );
                } catch (e) {
                  console.log("[FlowSessionExecution][draft-patch] Failed to stringify draft patch", e);
                }
                setDraftMetadataPatch((prev) => ({ ...(prev ?? {}), ...draftPatch }));
              }
              refetchCurrentStep?.();
              refetchMessages?.();
              // Use conversationConfigId from metadata (backend sends after refresh) or fallback to current step
              const convId = (event.data?.conversationConfigId as string | undefined) ??
                currentStep?.stepSession?.conversationConfigId ??
                (typeof currentStep?.stepSession?.outputData?.conversationConfigId === "string"
                  ? currentStep.stepSession.outputData.conversationConfigId
                  : null);
              if (convId && assemblyId) {
                // Invalidate and refetch immediately so ConversationCreatorStep shows updated data
                queryClient.invalidateQueries({ queryKey: queryKeys.conversation(convId, assemblyId) });
                queryClient.refetchQueries({ queryKey: queryKeys.conversation(convId, assemblyId) });
              }
              // Invalidate email outreach cache so EmailOutreachCreatorStep refetches if applicable
              if (currentStep?.stepIndex != null) {
                queryClient.invalidateQueries({
                  queryKey: queryKeys.emailOutreachInStep(session.id, currentStep.stepIndex),
                });
              }
            }
          } else if (event.type === "done") {
            setIsStreaming(false);
            setStreamingContent("");
            streamingContentRef.current = "";
            // Refresh messages to get the complete saved message
            // The useEffect hook will automatically clear the optimistic message when it appears in messages
            refetchMessages();
          } else if (event.type === "error") {
            setIsStreaming(false);
            setStreamingContent("");
            streamingContentRef.current = "";
            setOptimisticUserMessage(null); // Clear optimistic message on error
            const errorMessage = event.data?.message || "Failed to send message";
            console.error("Streaming error:", errorMessage);
            toast.error("Message failed", {
              description: errorMessage,
            });
          }
        }
      );
    } catch (error) {
      console.error("Failed to send message:", error);
      setIsStreaming(false);
      setStreamingContent("");
      streamingContentRef.current = "";
      setOptimisticUserMessage(null); // Clear optimistic message on error
      const errorMessage = error instanceof Error ? error.message : "Failed to send message";
      toast.error("Message failed", {
        description: errorMessage,
      });
    }
  };

  const handleCompleteStep = async () => {
    if (!currentStep) return;

    try {
      await completeStepMutation.mutateAsync({
        sessionId: session.id,
        stepIndex: currentStep.stepIndex,
        request: {
          outputData: stepOutputData || undefined,
        },
      });

      // Clear output data after completion
      setStepOutputData(null);

      // Refetch current step to get updated state
      // If auto-advance occurred, response.currentStep contains the next step
      // If manual advance needed, canMoveToNext will be true after refetch
      refetchCurrentStep();
    } catch (error) {
      console.error("Failed to complete step:", error);
    }
  };

  const handleMoveToNext = async () => {
    if (!currentStep) return;

    try {
      await moveToNextStepMutation.mutateAsync({
        sessionId: session.id,
        request: {
          outputData: stepOutputData || undefined,
        },
      });

      // Clear output data after moving
      setStepOutputData(null);
      
      // Refetch to get the new current step
      await refetchCurrentStep();
    } catch (error) {
      console.error("Failed to move to next step:", error);
    }
  };

  const handleCompleteSession = async () => {
    if (!currentStep) return;

    const step = currentStep.step;

    try {
      // If it's an INFORMATION step on the last step, use acknowledge
      if (step.type === "INFORMATION" && !currentStep.transition.hasNextStep) {
        await acknowledgeStepMutation.mutateAsync({
          sessionId: session.id,
          stepIndex: currentStep.stepIndex,
        });
      } else {
        // For other step types, use moveToNext which will complete the session if it's the last step
        await moveToNextStepMutation.mutateAsync({
          sessionId: session.id,
          request: {
            outputData: stepOutputData || undefined,
          },
        });
      }

      // Clear output data
      setStepOutputData(null);
      refetchCurrentStep();
    } catch (error) {
      console.error("Failed to complete session:", error);
    }
  };

  const handleStartStep = async () => {
    if (!currentStep) return;

    try {
      await startStepMutation.mutateAsync({
        sessionId: session.id,
        stepIndex: currentStep.stepIndex,
        request: {
          inputData: currentStep.previousStepOutput || undefined,
        },
      });
    } catch (error) {
      console.error("Failed to start step:", error);
    }
  };


  if (isLoadingStep) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentStep) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-sm font-medium text-foreground">Unable to load current step</p>
      </div>
    );
  }

  if (currentStep.sessionStatus === "COMPLETED" || currentStep.sessionStatus === "IN_PROGRESS" || currentStep.sessionStatus === "CLOSED") {
    const isInProgress = currentStep.sessionStatus === "IN_PROGRESS";
    const isClosed = currentStep.sessionStatus === "CLOSED";

    return (
      <div className="flex flex-col h-full min-h-0 w-full overflow-hidden">
        <FlowStepContent wide className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex shrink-0 items-center gap-2 border-b border-border/40 px-3 py-2.5 sm:gap-3 sm:px-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="h-8 shrink-0 gap-1.5 px-2 text-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="text-xs">Back</span>
            </Button>
            <h3
              className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground sm:text-base"
              title={session.note ? `${session.name ?? ""}\n${session.note}`.trim() : (session.name ?? undefined)}
            >
              {session.name?.trim() || "Flow session"}
            </h3>
            {(currentStep.editableSteps?.length ?? 0) > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 shrink-0 gap-1 text-xs"
                    disabled={reenterStepMutation.isPending}
                  >
                    {reenterStepMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <PenLine className="h-3 w-3" />}
                    Edit
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {currentStep.editableSteps!.map((es) => (
                    <DropdownMenuItem
                      key={es.stepIndex}
                      onClick={() => setEditStepConfirm({ stepIndex: es.stepIndex, name: es.name })}
                    >
                      <PenLine className="mr-2 h-3.5 w-3.5" />
                      {es.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <AlertDialog open={!!editStepConfirm} onOpenChange={(open) => { if (!open) setEditStepConfirm(null); }}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Edit &ldquo;{editStepConfirm?.name}&rdquo;?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will re-open the session builder at this step. You&apos;ll walk through subsequent steps to review changes. Post-actions (e.g. task creation) will re-run with deduplication.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      if (!editStepConfirm) return;
                      reenterStepMutation.mutate(
                        { sessionId: session.id, stepIndex: editStepConfirm.stepIndex },
                        {
                          onSuccess: () => {
                            toast.success(`Re-entered "${editStepConfirm.name}" for editing`);
                            setEditStepConfirm(null);
                            refetchCurrentStep();
                          },
                        }
                      );
                    }}
                  >
                    Edit Step
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            {isInProgress ? (
              <>
                <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 sm:text-sm">
                  <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                  In Progress
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 shrink-0 gap-1 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                  disabled={closeSessionMutation.isPending}
                  onClick={() => setShowCloseConfirm(true)}
                >
                  {closeSessionMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                  Close
                </Button>
                <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Close this session?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will close the session even if there are unresolved tasks. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => {
                          closeSessionMutation.mutate(session.id, {
                            onSuccess: () => {
                              toast.success("Session closed");
                              refetchCurrentStep();
                            },
                          });
                        }}
                      >
                        Close Session
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            ) : isClosed ? (
              <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground sm:text-sm">
                <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Closed
              </span>
            ) : (
              <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400 sm:text-sm">
                <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Completed
              </span>
            )}
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <Tabs
              value={completedViewTab}
              onValueChange={(v) => setCompletedViewTab(v as "updates" | "responses" | "queries")}
              className="flex-1 min-h-0 flex flex-col overflow-hidden rounded-xl border border-border/80 bg-card/40 shadow-sm backdrop-blur-sm"
            >
              <TabsList className="flex-shrink-0 w-full mb-0 h-11 rounded-none rounded-t-xl border-b border-border/60 bg-muted/30 p-1">
                <TabsTrigger value="updates" className="flex-1 gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <LayoutList className="h-4 w-4" />
                  Updates
                </TabsTrigger>
                <TabsTrigger value="responses" className="flex-1 gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <LayoutList className="h-4 w-4" />
                  Responses
                </TabsTrigger>
                <TabsTrigger value="queries" className="flex-1 gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <MessageSquare className="h-4 w-4" />
                  Queries
                </TabsTrigger>
              </TabsList>
              <TabsContent value="updates" forceMount className="flex-1 min-h-0 mt-0 overflow-hidden data-[state=inactive]:hidden flex flex-col p-3 sm:p-4">
                <FlowStepFormInner className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  <SessionUpdatesList
                    session={sessionWithSteps}
                    onOpenConversationSession={onOpenConversationSession}
                  />
                </FlowStepFormInner>
              </TabsContent>
              <TabsContent value="responses" forceMount className="flex-1 min-h-0 mt-0 overflow-hidden data-[state=inactive]:hidden flex flex-col p-3 sm:p-4 pt-3">
                <FlowStepFormInner fullWidth className="flex-1 min-h-0 flex flex-col overflow-hidden min-w-0">
                  <FlowSessionResultsTab
                    session={sessionWithSteps}
                    assemblyId={assemblyId}
                    onOpenConversationSession={onOpenConversationSession}
                  />
                </FlowStepFormInner>
              </TabsContent>
              <TabsContent value="queries" forceMount className="flex-1 min-h-0 mt-0 overflow-hidden data-[state=inactive]:hidden flex flex-col p-3 sm:p-4">
                <FlowStepFormInner className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  <CompletedSessionChat sessionId={session.id} stepIndex={currentStep.stepIndex} />
                </FlowStepFormInner>
              </TabsContent>
            </Tabs>
          </div>
        </FlowStepContent>
      </div>
    );
  }

  if (currentStep.sessionStatus === "ABANDONED" || currentStep.sessionStatus === "POST_ACTION_FAILED") {
    const isFailed = currentStep.sessionStatus === "POST_ACTION_FAILED";
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {isFailed ? 'Processing Failed' : 'Flow Abandoned'}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {isFailed ? 'One or more actions failed while processing this flow. Please try again or contact support.'
            : 'This flow session has been abandoned.'}
        </p>
        <Button onClick={onBack} variant="outline">
          Back to Sessions
        </Button>
      </div>
    );
  }

  const stepSession = currentStep.stepSession;
  const step = currentStep.step;
  const isStepPending = stepSession?.status === "PENDING";
  const isStepInProgress = stepSession?.status === "IN_PROGRESS";
  const isStepCompleted = stepSession?.status === "COMPLETED";
  const isStepFailed = stepSession?.status === "FAILED";
  const isLastStep = !currentStep.transition.hasNextStep;

  const builderPanelWide =
    step.type === "CONVERSATION_CREATOR" ||
    step.type === "CONVERSATION_CREATOR_FROM_TEMPLATE" ||
    step.type === "EMAIL_OUTREACH_CREATOR";

  return (
    <div
      className="flex min-h-0 w-full flex-1 flex-col gap-6 overflow-hidden sm:gap-8"
      style={{ height: '100%' }}
    >
      {/* Header: current step title + run name + optional step description (single place; body has no duplicate title) */}
      <div className="flex shrink-0 flex-col border-b border-border/40 bg-background/80">
        <div className="flex items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="h-8 shrink-0 gap-1.5 px-2 text-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="text-xs">Back</span>
          </Button>
          <div className="min-w-0 flex-1">
            <h3
              className="truncate text-sm font-semibold text-foreground sm:text-base"
              title={step.name}
            >
              {step.name}
            </h3>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <p className="whitespace-nowrap text-[11px] font-medium text-muted-foreground sm:text-xs">
              Step {currentStep.progress.current}/{currentStep.progress.total}{" "}
              <span className="text-foreground">({currentStep.progress.percentage.toFixed(0)}%)</span>
            </p>
            {stepSession ? (
              <span
                className={cn(
                  "whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide sm:text-xs",
                  isStepInProgress
                    ? "border-yellow-500/30 bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"
                    : isStepCompleted
                    ? "border-green-500/30 bg-green-500/20 text-green-700 dark:text-green-400"
                    : isStepFailed
                    ? "border-red-500/30 bg-red-500/20 text-red-700 dark:text-red-400"
                    : "border-border/60 bg-muted/50 text-muted-foreground",
                )}
              >
                {stepSession.status}
              </span>
            ) : null}
          </div>
        </div>
        {step.description?.trim() && step.type !== "INFORMATION" ? (
          <div className="border-t border-border/20 px-3 py-1.5 sm:px-4">
            <p className="truncate text-[11px] text-muted-foreground">{step.description.trim()}</p>
          </div>
        ) : null}
      </div>

      {/* Main Content Area - Step (left) + Builder assistant (right) */}
      <div
        className="min-h-0 flex-1"
        style={{ display: 'flex', gap: '0.75rem', minHeight: 0, overflow: 'hidden' }}
      >
        {/* Left Side - Step Execution */}
        <div style={{ flex: '1 1 0%', overflowY: 'auto', minHeight: 0 }} className="pb-2 pr-1">
        <FlowStepContent
          fullWidth={
            step.type === "CONVERSATION_CREATOR" ||
            step.type === "CONVERSATION_CREATOR_FROM_TEMPLATE" ||
            step.type === "EMAIL_OUTREACH_CREATOR"
          }
          className="space-y-3"
        >
        {/* Current Step Display */}
        {isStepPending && currentStep.canStart && (
          <div className="mb-3">
            <Card className="border-border/40 bg-card">
              <CardContent className="p-4">
                <div className="text-center space-y-4">
                  <p className="text-base text-muted-foreground">Step is ready to start</p>
                  <Button onClick={handleStartStep} disabled={startStepMutation.isPending} size="lg">
                    {startStepMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Start Step
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Email outreach: no outer Card — avoids nested fixed-height shells and CardContent padding fights */}
        {isStepInProgress && step.type === "EMAIL_OUTREACH_CREATOR" && (
          <div className="mb-3 w-full min-w-0">
            <EmailOutreachCreatorStep
              step={step}
              assemblyId={assemblyId}
              emailOutreachId={
                stepSession?.emailOutreachId ??
                (typeof stepSession?.outputData?.emailOutreachId === "string"
                  ? stepSession.outputData.emailOutreachId
                  : null) ??
                createdEmailOutreachId
              }
              emailOutreach={stepSession?.outputData?.emailOutreach as EmailOutreach | undefined}
              sessionId={session.id}
              stepIndex={currentStep.stepIndex}
              onEmailOutreachCreated={async (outreach: EmailOutreach) => {
                setCreatedEmailOutreachId(outreach.id || null);
                setStepOutputData({
                  emailOutreachId: outreach.id,
                  emailOutreach: outreach,
                });
              }}
              onComplete={async () => {
                if (createdEmailOutreachId || stepSession?.emailOutreachId) {
                  const outputData = {
                    emailOutreachId: createdEmailOutreachId || stepSession?.emailOutreachId,
                  };
                  setStepOutputData(outputData);
                  if (isLastStep) {
                    await handleCompleteSession();
                  } else {
                    await handleMoveToNext();
                  }
                }
              }}
              isLastStep={isLastStep}
            />
          </div>
        )}

        {isStepInProgress && step.type !== "EMAIL_OUTREACH_CREATOR" && (
          <div className="mb-3">
            <Card className="border-border/40 bg-card">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Title/description: session header above */}
                  {step.type === "ACTION" && (
                    <ActionStepRenderer
                      step={step}
                      sessionId={session.id}
                      stepIndex={currentStep.stepIndex}
                      assemblyId={assemblyId}
                      workflowId={workflowId || ""}
                      canComplete={currentStep.canComplete}
                      willAutoAdvance={currentStep.transition.willAutoAdvance}
                      isLastStep={isLastStep}
                      onExecutionSuccess={(outputData) => {
                        // Store output data from automation execution
                        setStepOutputData(outputData);
                      }}
                      onComplete={handleCompleteStep}
                      isCompleting={completeStepMutation.isPending}
                      onStepComplete={() => {
                        // Refetch current step after automation completes
                        refetchCurrentStep();
                      }}
                    />
                  )}

                  {step.type === "INFORMATION" && (
                    <div>
                      <InformationStep step={step} />
                      {/* INFORMATION steps: Use /next-step directly (completes current and moves to next) */}
                      {/* According to guide: User clicks "Next" → Call /next-step */}
                      {/* /next-step completes the current step (if IN_PROGRESS) and starts the next step */}
                      {/* Show "Next" button when step is IN_PROGRESS (canComplete) OR when canMoveToNext is true OR if it's the last step */}
                      {(isStepInProgress || currentStep.canMoveToNext || isLastStep) && (
                        <div className="mt-4 pt-4 border-t border-border/40">
                          <FlowStepActions>
                          <Button
                            onClick={isLastStep ? handleCompleteSession : handleMoveToNext}
                            disabled={moveToNextStepMutation.isPending || acknowledgeStepMutation.isPending}
                            className="gap-2"
                            size="lg"
                          >
                            {(moveToNextStepMutation.isPending || acknowledgeStepMutation.isPending) ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {isLastStep ? "Completing..." : "Moving..."}
                              </>
                            ) : (
                              <>
                                {isLastStep ? "Done" : "Next Step"}
                                {!isLastStep && <ChevronRight className="h-4 w-4" />}
                                {isLastStep && <CheckCircle2 className="h-4 w-4" />}
                              </>
                            )}
                          </Button>
                          </FlowStepActions>
                        </div>
                      )}
                    </div>
                  )}

                  {step.type === "DATAVIEW" && (
                    <div>
                      <DataViewStep
                        step={step}
                        assemblyId={assemblyId}
                        workflowId={workflowId || ""}
                      />
                      {/* Show button if canMoveToNext OR if it's the last step (for DATAVIEW, there's nothing to "finish", just complete) */}
                      {(currentStep.canMoveToNext || isLastStep) && (
                        <div className="mt-4 pt-4 border-t border-border/40">
                          <FlowStepActions>
                          <Button
                            onClick={isLastStep ? handleCompleteSession : handleMoveToNext}
                            disabled={moveToNextStepMutation.isPending || acknowledgeStepMutation.isPending}
                            className="gap-2"
                            size="lg"
                          >
                            {(moveToNextStepMutation.isPending || acknowledgeStepMutation.isPending) ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {isLastStep ? "Completing..." : "Moving..."}
                              </>
                            ) : (
                              <>
                                {isLastStep ? "Done" : "Next Step"}
                                {!isLastStep && <ChevronRight className="h-4 w-4" />}
                                {isLastStep && <CheckCircle2 className="h-4 w-4" />}
                              </>
                            )}
                          </Button>
                          </FlowStepActions>
                        </div>
                      )}
                    </div>
                  )}

                  {step.type === "CONVERSATION_CREATOR_FROM_TEMPLATE" && (
                    <div className="pt-6">
                      <ConversationCreatorFromTemplateStep
                        step={step}
                        assemblyId={assemblyId}
                        conversationConfigId={
                          stepSession?.conversationConfigId ??
                          (typeof stepSession?.outputData?.conversationConfigId === "string"
                            ? stepSession.outputData.conversationConfigId
                            : null) ??
                          createdConversationId
                        }
                        stepMetadata={{ ...(stepSession?.metadata ?? {}), ...(draftMetadataPatch ?? {}) }}
                        sessionId={session.id}
                        stepIndex={currentStep.stepIndex}
                        onConversationCreated={async (conversation) => {
                          setCreatedConversationId(conversation.id || null);
                          setStepOutputData({
                            conversationConfigId: conversation.id,
                            conversationUrl: conversation.id ? `https://app.assembly.com/conversation/${conversation.id}` : undefined,
                          });
                        }}
                        onComplete={async () => {
                          if (createdConversationId || stepSession?.conversationConfigId) {
                            const outputData = {
                              conversationConfigId: createdConversationId || stepSession?.conversationConfigId,
                            };
                            setStepOutputData(outputData);
                            if (isLastStep) {
                              await handleCompleteSession();
                            } else {
                              await handleMoveToNext();
                            }
                          }
                        }}
                        isLastStep={isLastStep}
                      />
                    </div>
                  )}

                  {step.type === "CONVERSATION_CREATOR" && (
                    <div className="pt-6">
                      <ConversationCreatorStep
                        step={step}
                        assemblyId={assemblyId}
                        sessionUserQuery={sessionWithSteps.userQuery}
                        conversationConfigId={
                          stepSession?.conversationConfigId ??
                          (typeof stepSession?.outputData?.conversationConfigId === "string"
                            ? stepSession.outputData.conversationConfigId
                            : null) ??
                          createdConversationId
                        }
                        stepMetadata={{ ...(stepSession?.metadata ?? {}), ...(draftMetadataPatch ?? {}) }}
                        sessionId={session.id}
                        stepIndex={currentStep.stepIndex}
                        onConversationCreated={async (conversation) => {
                          // Store the conversation ID
                          setCreatedConversationId(conversation.id || null);
                          // Store in output data for step completion
                          setStepOutputData({
                            conversationConfigId: conversation.id,
                            conversationUrl: conversation.id ? `https://app.assembly.com/conversation/${conversation.id}` : undefined,
                          });
                        }}
                        onComplete={async () => {
                          // Complete the step with the conversation ID
                          if (createdConversationId || stepSession?.conversationConfigId) {
                            const outputData = {
                              conversationConfigId: createdConversationId || stepSession?.conversationConfigId,
                            };
                            setStepOutputData(outputData);
                            
                            if (isLastStep) {
                              await handleCompleteSession();
                            } else {
                              await handleMoveToNext();
                            }
                          }
                        }}
                        isLastStep={isLastStep}
                      />
                    </div>
                  )}

                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Show "Next" button when step is completed and manual advance is available */}
        {/* canMoveToNext is true when: step is COMPLETED AND has next step AND willAutoAdvance: false */}
        {isStepCompleted && currentStep.canMoveToNext && (
          <div className="mb-3">
            <Card className="border-green-500/40 bg-green-500/5">
              <CardContent className="p-4">
                <div className="text-center space-y-3">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                  <p className="text-sm font-medium text-foreground">Step completed successfully</p>
                  {currentStep.transition.hasNextStep ? (
                    <p className="text-xs text-muted-foreground">
                      Ready to proceed to next step
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      This is the final step. Complete the flow to finish.
                    </p>
                  )}
                  <FlowStepActions className="justify-center">
                    <Button
                      onClick={isLastStep ? handleCompleteSession : handleMoveToNext}
                      disabled={moveToNextStepMutation.isPending || acknowledgeStepMutation.isPending}
                      className="gap-2"
                      size="lg"
                    >
                      {(moveToNextStepMutation.isPending || acknowledgeStepMutation.isPending) ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {isLastStep ? "Completing..." : "Moving..."}
                        </>
                      ) : (
                        <>
                          {isLastStep ? "Done" : "Next Step"}
                          {!isLastStep && <ChevronRight className="h-4 w-4" />}
                          {isLastStep && <CheckCircle2 className="h-4 w-4" />}
                        </>
                      )}
                    </Button>
                  </FlowStepActions>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {isStepFailed && (
          <div className="mb-3">
            <Card className="border-red-500/40 bg-red-500/5">
              <CardContent className="p-4">
                <div className="text-center space-y-3">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Step failed</p>
                    {stepSession.errorMessage && (
                      <p className="text-xs text-muted-foreground mt-1">{stepSession.errorMessage}</p>
                    )}
                  </div>
                  <Button
                    onClick={handleStartStep}
                    disabled={startStepMutation.isPending}
                    variant="outline"
                  >
                    {startStepMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Retrying...
                      </>
                    ) : (
                      "Retry Step"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        </FlowStepContent>
        </div>

        {/* Right Side — Builder (assistant chat for this step) */}
        <div
          className={cn(
            "border-l-2 border-border/60 bg-muted/50 dark:bg-muted/30 rounded-lg p-3 shadow-lg h-full flex flex-col min-h-0 overflow-hidden",
            builderPanelWide ? "w-[32rem] min-w-[32rem]" : "w-96 min-w-96"
          )}
          style={{ flexShrink: 0, alignSelf: "stretch" }}
        >
          <div className="mb-2 flex shrink-0 items-center gap-2 px-0.5">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">Builder</span>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            <BuildAndQueryChatPanel
              sessionId={session.id}
              stepIndex={currentStep?.stepIndex}
              stepType={step.type}
              initialUserQuery={sessionWithSteps.userQuery}
              onSendMessage={handleSendMessage}
              isStreaming={isStreaming}
              streamingContent={streamingContent}
              optimisticUserMessage={optimisticUserMessage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Automation Step Renderer Component
interface ActionStepRendererProps {
  step: ActionFlowStep;
  sessionId: string;
  stepIndex: number;
  assemblyId: string;
  workflowId: string;
  canComplete: boolean;
  willAutoAdvance: boolean;
  isLastStep: boolean;
  onExecutionSuccess: (outputData: Record<string, unknown>) => void;
  onComplete: () => void;
  isCompleting: boolean;
  onStepComplete: () => void;
}

function ActionStepRenderer({
  step,
  sessionId,
  stepIndex,
  assemblyId,
  workflowId,
  canComplete: _canComplete,
  willAutoAdvance: _willAutoAdvance,
  isLastStep,
  onExecutionSuccess,
  onComplete,
  isCompleting,
  onStepComplete,
}: ActionStepRendererProps) {
  const [executionResponse, setExecutionResponse] = useState<TriggerExecutionResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [didAutoAdvance, setDidAutoAdvance] = useState(false);

  const runAutomationMutation = useRunAutomation();

  // Fetch the trigger details
  const { data: triggers, isLoading: isLoadingTriggers } = useConsoleWorkflowTriggers(assemblyId, workflowId, {
    enabled: !!assemblyId && !!workflowId,
  });

  // Find the trigger that matches this step's workflowTriggerId
  const trigger = triggers?.find((t) => t.id === step.workflowTriggerId);

  const handleExecuteSuccess = async (triggerInputs: Record<string, TriggerInputValue>): Promise<TriggerExecutionResponse> => {
    // Call the new runAutomation endpoint
    const completeStepResponse = await runAutomationMutation.mutateAsync({
      sessionId,
      stepIndex,
      request: {
        triggerInputs: triggerInputs as Record<string, unknown>,
        forTesting: false,
      },
    });

    // ⚠️ CRITICAL: Check if session is completed (last step)
    // According to documentation: "Always check sessionStatus in response after completing any step"
    if (completeStepResponse.currentStep.sessionStatus === "COMPLETED") {
      // Session completed - the completion screen will be shown by parent component
      // after refetchCurrentStep detects sessionStatus === "COMPLETED"
      setExecutionResponse({
        id: "",
        name: "Flow completed",
        workflowId: "",
      } as TriggerExecutionResponse);
      setIsModalOpen(false);
      onStepComplete(); // This will trigger refetch and show completion screen
      return {
        id: "",
        name: "Flow completed",
        workflowId: "",
      } as TriggerExecutionResponse;
    }

    // Check if auto-advance occurred
    setDidAutoAdvance(completeStepResponse.transition.type === "AUTO");

    // Extract output data from completed step
    const outputData = completeStepResponse.completedStep.outputData as Record<string, unknown>;
    // Create a minimal TriggerExecutionResponse for compatibility with ActionExecutionModal
    const triggerResponse = {
      id: (outputData.ticketId as string) || "",
      name: (outputData.ticketName as string) || "Automation executed",
      workflowId: (outputData.workflowId as string) || "",
    } as TriggerExecutionResponse;

    setExecutionResponse(triggerResponse);
    setIsModalOpen(false);
    
    // Call onExecutionSuccess with output data
    onExecutionSuccess(outputData);
    
    // Call onStepComplete to refresh the current step
    onStepComplete();

    return triggerResponse;
  };

  if (isLoadingTriggers) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!trigger) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-sm font-medium text-foreground">Trigger not found</p>
        <p className="text-xs text-muted-foreground mt-1">The workflow trigger for this step could not be found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Automation Form Modal */}
      <ActionExecutionModal
        trigger={trigger}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        assemblyId={assemblyId}
        workflowId={workflowId}
        onExecute={handleExecuteSuccess}
        onExecutionSuccess={(response) => {
          setExecutionResponse(response);
        }}
      />

      {/* Automation Execution UI */}
      {!executionResponse ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <Card className="border-border/40">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-lg mb-2">{trigger.name}</h4>
                  {trigger.description && <p className="text-sm text-muted-foreground">{trigger.description}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <Button onClick={() => setIsModalOpen(true)} className="gap-2" size="lg">
                    <Play className="h-4 w-4" />
                    Run Automation
                  </Button>
                  <p className="text-xs text-muted-foreground">Execute the automation to proceed.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          <Card className="border-success/30 bg-success-bg">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-success-bg flex items-center justify-center border border-success/30 shadow-sm">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <h4 className="text-base font-semibold text-success mb-1">
                      Automation Executed Successfully
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">{executionResponse.name}</span> has been created and is now being processed.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                    <span className="text-xs font-medium text-success uppercase tracking-wide">
                      Processing
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Step Button - Only show if automation didn't auto-advance */}
          {/* For last step, this button shouldn't appear since session will be completed */}
          {executionResponse && !didAutoAdvance && !isLastStep && (
            <div className="pt-4 border-t border-border/40">
              <FlowStepActions>
              <Button
                onClick={onComplete}
                disabled={isCompleting}
                className="gap-2"
                size="lg"
              >
                {isCompleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Moving to next step...
                  </>
                ) : (
                  <>
                    <ChevronRight className="h-4 w-4" />
                    Next Step
                  </>
                )}
              </Button>
              </FlowStepActions>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
