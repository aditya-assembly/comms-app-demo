import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import {
  MessageSquare,
  Loader2,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  Trash2,
  Video,
  Monitor,
  Pencil,
  Copy,
  ExternalLink,
  ListChecks,
  Settings2,
} from "lucide-react";
import { useCreateConversationInStep, useConversationAsTemplate, useConversation, useUpdateConversationInStep } from "@/hooks/use-comms-api";
import { useAuthStore } from "@/stores/auth-store";
import LoadingScreen from "@/components/shared/ui/loading-screen";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn, isValidEmail } from "@/lib/utils";
import { ensureCompletionEmailsIncludeMember, mergeTemplateCompletionEmails } from "@/lib/completion-notification-emails";
import { toast } from "sonner";
import type {
  ConversationCreatorFromTemplateFlowStep,
  Conversation,
  ConversationItem,
  StepConversationItem,
} from "@/types/orchestration-dashboard-types";
import type { ConversationItem as ConversationItemLocal } from "@/components/features/conversations/types";
import {
  ConversationItemFromTemplateQuestions,
  ITEM_TYPE_LABELS,
} from "@/components/features/conversations/conversation-item-from-template-questions";
import { ConversationItemEditor } from "@/components/features/conversations/conversation-item-editor";
import { getConversationUrl } from "@/components/features/conversations/constants";
import { FlowStepActions, FlowStepFormInner } from "@/components/flows/flow-step-layout";
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

const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "zh", label: "Chinese" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "pt", label: "Portuguese" },
];

interface ConversationCreatorFromTemplateStepProps {
  step: ConversationCreatorFromTemplateFlowStep;
  conversationConfigId?: string | null;
  stepMetadata?: Record<string, string> | null;
  onConversationCreated?: (conversation: Conversation) => void;
  onComplete?: () => void;
  isLastStep?: boolean;
  sessionId?: string;
  stepIndex?: number;
}

export function ConversationCreatorFromTemplateStep({
  step,
  assemblyId,
  conversationConfigId,
  stepMetadata,
  onConversationCreated,
  onComplete,
  isLastStep = false,
  sessionId,
  stepIndex,
}: ConversationCreatorFromTemplateStepProps) {
  const templateConversationId = step.templateConversationId;
  const userEmail = useAuthStore((s) => s.user?.email);
  const memberEmailNorm = useMemo(() => {
    const e = userEmail?.trim().toLowerCase();
    return e && isValidEmail(e) ? e : null;
  }, [userEmail]);

  const templateEmailsInitKeyRef = useRef<string | null>(null);

  const [title, setTitle] = useState("");
  const [items, setItems] = useState<ConversationItem[]>([]);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [language, setLanguage] = useState("en");
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [screenShareEnabled, setScreenShareEnabled] = useState(false);
  const [chatWindowEnabled, setChatWindowEnabled] = useState(false);
  const [notificationEmails, setNotificationEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [createdConversation, setCreatedConversation] = useState<Conversation | null>(null);
  const [postCreateItemsOpen, setPostCreateItemsOpen] = useState(false);
  const [postCreateAdvancedOpen, setPostCreateAdvancedOpen] = useState(false);

  const hasExistingConversation = Boolean(conversationConfigId && String(conversationConfigId).trim());

  const {
    data: templateConversation,
    isLoading: isLoadingTemplate,
    error: templateError,
    refetch: refetchTemplate,
  } = useConversationAsTemplate(templateConversationId, !!templateConversationId);

  const { data: existingConversation } = useConversation(
    conversationConfigId || "",
    hasExistingConversation,
    assemblyId || undefined
  );

  const createMutation = useCreateConversationInStep();
  const updateMutation = useUpdateConversationInStep();
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!memberEmailNorm) return;
    setNotificationEmails((prev) => ensureCompletionEmailsIncludeMember(prev, memberEmailNorm));
  }, [memberEmailNorm]);

  useEffect(() => {
    const key = `${templateConversationId ?? ""}:${templateConversation?.id ?? ""}`;
    if (!templateConversation || createdConversation) return;
    if (templateEmailsInitKeyRef.current === key) return;
    templateEmailsInitKeyRef.current = key;
    setNotificationEmails((prev) =>
      mergeTemplateCompletionEmails(templateConversation.completionNotificationEmails, prev, memberEmailNorm)
    );
  }, [templateConversation, createdConversation, memberEmailNorm, templateConversationId]);

  // Initialize from template
  useEffect(() => {
    if (templateConversation) {
      setTitle((prev) => prev || templateConversation.name || "");
      setItems((prev) => {
        if (prev.length > 0) return prev;
        return (templateConversation.conversationItems ?? []).map((it) => ({
          ...it,
          id: undefined,
          title: it.title ?? "",
        }));
      });
    }
  }, [templateConversation]);

  // When returning to step after creation, show existing conversation; also sync when chat updates it
  useEffect(() => {
    if (!existingConversation) return;
    const isInitialLoad = !createdConversation;
    const isSameConversation = createdConversation?.id === existingConversation.id;
    if (isInitialLoad || isSameConversation) {
      setCreatedConversation(existingConversation);
      // Sync local form state when existingConversation changes (e.g. agent updated via chat)
      setTitle(existingConversation.name ?? "");
      setItems(
        (existingConversation.conversationItems ?? []).map((it) => ({
          ...it,
          id: undefined,
          title: it.title ?? "",
        }))
      );
      setLanguage(existingConversation.language ?? "en");
      setVideoEnabled(Boolean(existingConversation.videoEnabled));
      setScreenShareEnabled(Boolean(existingConversation.screenShareEnabled));
      setChatWindowEnabled(Boolean(existingConversation.chatWindowEnabled));
      setNotificationEmails(
        ensureCompletionEmailsIncludeMember(
          Array.from(existingConversation.completionNotificationEmails ?? []),
          memberEmailNorm
        )
      );
    }
  }, [existingConversation, createdConversation, memberEmailNorm]);

  // Apply chat draft updates before first save (stored in step session metadata by backend).
  useEffect(() => {
    if (createdConversation) return;
    if (!stepMetadata) return;
    const patchUpdatedAt = stepMetadata.draftConversationPatchUpdatedAt;
    if (!patchUpdatedAt) return;

    const draftName = stepMetadata.draftConversationName;
    const draftItemsJson = stepMetadata.draftConversationItemsJson;

    if (draftName && draftName.trim()) {
      setTitle(draftName);
    }
    if (draftItemsJson && draftItemsJson.trim()) {
      try {
        const parsed = JSON.parse(draftItemsJson) as ConversationItem[];
        setItems(
          (parsed ?? []).map((it) => ({
            ...it,
            id: undefined,
            title: it.title ?? "",
          }))
        );
      } catch (e) {
        console.error("Failed to parse draft conversation items from metadata:", e);
      }
    }
  }, [stepMetadata?.draftConversationPatchUpdatedAt, createdConversation, stepMetadata]);

  const handleAddItem = useCallback(() => {
    setItems((prev) => [
      ...prev,
      {
        type: "QUESTION",
        title: "New item",
        description: "",
      } as ConversationItem,
    ]);
    setCurrentItemIndex(items.length);
  }, [items.length]);

  const handleRemoveItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
    setCurrentItemIndex((prev) => Math.max(0, Math.min(prev, items.length - 2)));
    setItemToDelete(null);
  }, [items.length]);

  const handleItemChange = useCallback((index: number, updated: ConversationItem | ConversationItemLocal) => {
    setItems((prev) => {
      const next = [...prev];
      const { id: _id, ...rest } = updated as ConversationItem & { id?: string };
      next[index] = { ...rest, id: undefined } as ConversationItem;
      return next;
    });
  }, []);

  const handleCreate = useCallback(async () => {
    if (!sessionId || stepIndex === undefined || !assemblyId || !templateConversationId) return;

    const itemsToSend = items.map((it) => {
      const { id: _id, ...rest } = it;
      return { ...rest };
    });

    try {
      const conversation = await createMutation.mutateAsync({
        sessionId,
        stepIndex,
        request: {
          sourceConversationId: templateConversationId,
          assemblyLineID: assemblyId,
          name: title.trim() || templateConversation?.name || "New conversation",
          conversationItems: itemsToSend,
          language: language || undefined,
          videoEnabled,
          screenShareEnabled,
          chatWindowEnabled,
          completionNotificationEmails: notificationEmails.length > 0 ? notificationEmails : undefined,
        },
      });
      setCreatedConversation(conversation);
      setNotificationEmails(
        ensureCompletionEmailsIncludeMember(
          Array.from(conversation.completionNotificationEmails ?? []),
          memberEmailNorm
        )
      );
      onConversationCreated?.(conversation);
    } catch (err) {
      console.error("Failed to create conversation from template:", err);
      toast.error("Failed to create conversation", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }, [
    sessionId,
    stepIndex,
    assemblyId,
    templateConversationId,
    title,
    templateConversation?.name,
    items,
    language,
    videoEnabled,
    screenShareEnabled,
    chatWindowEnabled,
    notificationEmails,
    memberEmailNorm,
    createMutation,
    onConversationCreated,
  ]);

  const handleAddEmail = () => {
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed || !isValidEmail(trimmed) || notificationEmails.some((e) => e.trim().toLowerCase() === trimmed)) return;
    setNotificationEmails((p) => [...p, trimmed]);
    setNewEmail("");
  };

  const handleRemoveEmail = (email: string) => {
    setNotificationEmails((p) => p.filter((e) => e !== email));
  };

  const handleSave = useCallback(async () => {
    if (!sessionId || stepIndex === undefined || !assemblyId || !createdConversation?.id) return;

    const itemsToSend: StepConversationItem[] = items.map((it) => {
      const { id: _id, ...rest } = it;
      return {
        ...rest,
        title: rest.title ?? "",
      };
    });

    try {
      const updatedConversation = await updateMutation.mutateAsync({
        sessionId,
        stepIndex,
        request: {
          conversationId: createdConversation.id,
          name: title.trim() || createdConversation.name || "Updated conversation",
          assemblyLineId: assemblyId,
          language: language || undefined,
          videoEnabled,
          screenShareEnabled,
          chatWindowEnabled,
          completionNotificationEmails: notificationEmails.length > 0 ? notificationEmails : undefined,
          conversationItems: itemsToSend,
        },
      });
      setCreatedConversation(updatedConversation);
      setNotificationEmails(
        ensureCompletionEmailsIncludeMember(
          Array.from(updatedConversation.completionNotificationEmails ?? []),
          memberEmailNorm
        )
      );
      onConversationCreated?.(updatedConversation);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error("Failed to update conversation from template step:", err);
      toast.error("Failed to save conversation", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }, [
    sessionId,
    stepIndex,
    assemblyId,
    createdConversation?.id,
    createdConversation?.name,
    title,
    language,
    videoEnabled,
    screenShareEnabled,
    chatWindowEnabled,
    notificationEmails,
    memberEmailNorm,
    items,
    updateMutation,
    onConversationCreated,
  ]);

  if (templateError && templateConversationId) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-4">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load template conversation</p>
          <p className="text-sm text-muted-foreground mb-4">{String(templateError)}</p>
          <Button onClick={() => refetchTemplate()} variant="default">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (isLoadingTemplate || !templateConversation) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingScreen variant="inline" message="Loading template..." />
      </div>
    );
  }

  // Editing a single item in full editor (FORM_DATA, SUMMARY, or "Edit" button)
  if (editingItemIndex !== null && items[editingItemIndex]) {
    const item = items[editingItemIndex];
    return (
      <FlowStepFormInner>
        <ConversationItemEditor
          item={{
            ...item,
            id: item.id ?? `temp-${editingItemIndex}`,
            title: item.title ?? "",
          } as ConversationItemLocal}
          onSave={(updated) => {
            handleItemChange(editingItemIndex, updated);
            setEditingItemIndex(null);
          }}
          onCancel={() => setEditingItemIndex(null)}
        />
      </FlowStepFormInner>
    );
  }

  // Post-create: show conversation details
  if (createdConversation) {
    const conversationUrl = getConversationUrl(
      createdConversation.id ?? "",
      createdConversation.allowAnyoneToStartConversation
    );
    const description = createdConversation.description || "";
    const displayItems =
      items.length > 0
        ? items
        : (createdConversation.conversationItems ?? []).map((it) => ({
            ...it,
            id: undefined,
            title: it.title ?? "",
          }));

    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <FlowStepFormInner variant="conversation">
        <Card>
          <CardContent className="pt-6 space-y-5">
            {/* 1. What this conversation does */}
            <div className="rounded-lg border border-border bg-muted/30 p-4 shadow-sm">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">What this conversation does</h3>
              {description ? (
                <div className="text-base font-medium text-foreground leading-relaxed max-h-32 overflow-y-auto prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-p:text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-ul:my-1 prose-ol:my-1">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{description}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No description available</p>
              )}
            </div>

            {/* 2. Copy URL — always visible */}
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                <h3 className="text-sm font-medium text-foreground">Share this conversation</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Copy the link below to try this conversation in a new window or share it with others.
              </p>
              <div className="flex items-center gap-2">
                <Input value={conversationUrl} readOnly className="font-mono text-sm flex-1" />
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 shrink-0"
                  onClick={async () => {
                    await navigator.clipboard.writeText(conversationUrl);
                    toast.success("URL copied to clipboard");
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy URL
                </Button>
              </div>
            </div>

            {/* 3. Conversation Items — collapsible */}
            <Collapsible open={postCreateItemsOpen} onOpenChange={setPostCreateItemsOpen}>
              <button
                type="button"
                onClick={() => setPostCreateItemsOpen((prev) => !prev)}
                aria-expanded={postCreateItemsOpen}
                className="w-full flex items-center justify-between gap-3 rounded-lg border border-dashed border-border/80 bg-muted/20 py-3 px-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <ListChecks className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-foreground">Conversation Items ({displayItems.length})</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {postCreateItemsOpen ? "Click to hide" : "The agenda items that make up this conversation — view details"}
                    </span>
                  </span>
                </span>
                {postCreateItemsOpen ? (
                  <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
              </button>
              <CollapsibleContent>
                <div className="pt-3 space-y-2">
                  {displayItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No conversation items configured.</p>
                  ) : (
                    displayItems.map((item, idx) => (
                      <div key={`${idx}-${item.title ?? "item"}`} className="rounded-lg border bg-card p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-sm">{item.title || `Item ${idx + 1}`}</span>
                          <span className="text-xs text-muted-foreground">
                            {ITEM_TYPE_LABELS[item.type as string] ?? item.type}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.description}</p>
                        )}
                        {"question" in item && item.question && (
                          <p className="text-sm"><span className="text-muted-foreground">Question:</span> {String(item.question)}</p>
                        )}
                        {"discussionPrompt" in item && item.discussionPrompt && (
                          <p className="text-sm"><span className="text-muted-foreground">Discussion prompt:</span> {String(item.discussionPrompt)}</p>
                        )}
                        {"mediaRequestPrompt" in item && item.mediaRequestPrompt && (
                          <p className="text-sm"><span className="text-muted-foreground">Media request:</span> {String(item.mediaRequestPrompt)}</p>
                        )}
                        {"reviewPrompt" in item && item.reviewPrompt && (
                          <p className="text-sm"><span className="text-muted-foreground">Review prompt:</span> {String(item.reviewPrompt)}</p>
                        )}
                        {"issuePrompt" in item && item.issuePrompt && (
                          <p className="text-sm"><span className="text-muted-foreground">Issue prompt:</span> {String(item.issuePrompt)}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* 4. Advanced Options — collapsible */}
            <Collapsible open={postCreateAdvancedOpen} onOpenChange={setPostCreateAdvancedOpen}>
              <button
                type="button"
                onClick={() => setPostCreateAdvancedOpen((prev) => !prev)}
                aria-expanded={postCreateAdvancedOpen}
                className="w-full flex items-center justify-between gap-3 rounded-lg border border-dashed border-border/80 bg-muted/20 py-3 px-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <Settings2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-foreground">Advanced Options</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {postCreateAdvancedOpen ? "Click to hide" : "Language, video, screen share, notifications, and more"}
                    </span>
                  </span>
                </span>
                {postCreateAdvancedOpen ? (
                  <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
              </button>
              <CollapsibleContent>
                <div className="pt-3">
                  <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Language</span>
                      <span className="font-medium">{language || createdConversation.language || "en"}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Video</span>
                      <span className="font-medium">{videoEnabled ? "Enabled" : "Disabled"}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Screen share</span>
                      <span className="font-medium">{screenShareEnabled ? "Enabled" : "Disabled"}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Chat window</span>
                      <span className="font-medium">{chatWindowEnabled ? "Enabled" : "Disabled"}</span>
                    </div>
                    <div className="space-y-2 pt-2 border-t border-border/60">
                      <span className="text-sm text-muted-foreground">Completion notification emails</span>
                      {notificationEmails.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {notificationEmails.map((email) => (
                            <span key={email} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-xs">
                              {email}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">None</p>
                      )}
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="pt-4 border-t border-border/40">
              <FlowStepActions className="gap-2">
                <Button
                  onClick={handleSave}
                  disabled={updateMutation.isPending || saveSuccess}
                  variant="outline"
                  className={cn("gap-2 transition-all duration-300", saveSuccess && "border-green-500 text-green-600 dark:text-green-400")}
                  size="lg"
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : saveSuccess ? (
                    <motion.span initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Saved
                    </motion.span>
                  ) : (
                    "Save conversation"
                  )}
                </Button>
                {onComplete && (
                  <Button onClick={onComplete} className="gap-2" size="lg">
                    {isLastStep ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Done
                      </>
                    ) : (
                      <>
                        Next Step
                        <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </FlowStepActions>
            </div>
          </CardContent>
        </Card>
        </FlowStepFormInner>
      </motion.div>
    );
  }

  // Wizard: title, items, advanced, create
  const currentItem = items[currentItemIndex];
  const totalItems = items.length;

  return (
    <FlowStepFormInner variant="conversation" className="space-y-6">
      <div className="space-y-2 max-w-2xl">
        <Label>Conversation title</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={templateConversation.name || "Enter title"}
        />
      </div>

      {/* Items wizard */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Conversation items ({totalItems})</Label>
          <Button variant="outline" size="sm" onClick={handleAddItem} className="gap-1">
            <Plus className="h-4 w-4" />
            Add item
          </Button>
        </div>

        {totalItems === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-muted-foreground">
            <p className="text-sm">No items. Add an item to customize the conversation.</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={handleAddItem}>
              Add first item
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 flex-wrap">
              {items.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentItemIndex(idx)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                    currentItemIndex === idx
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80 text-foreground"
                  )}
                >
                  {idx + 1}. {item.title || ITEM_TYPE_LABELS[item.type as string] || "Item"}
                </button>
              ))}
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-muted-foreground">
                    Item {currentItemIndex + 1} of {totalItems} — {ITEM_TYPE_LABELS[currentItem?.type as string] ?? currentItem?.type}
                  </span>
                  <div className="flex gap-1">
                    {currentItem?.type === "FORM_DATA" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingItemIndex(currentItemIndex)}
                        className="gap-1"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Full editor
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setItemToDelete(currentItemIndex)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <ConversationItemFromTemplateQuestions
                  item={currentItem}
                  onChange={(updated) => handleItemChange(currentItemIndex, updated)}
                />

                <div className="flex justify-between mt-6 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentItemIndex((p) => Math.max(0, p - 1))}
                    disabled={currentItemIndex === 0}
                    className="gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={() => setCurrentItemIndex((p) => Math.min(totalItems - 1, p + 1))}
                    disabled={currentItemIndex >= totalItems - 1}
                    className="gap-1"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Advanced options */}
      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <button
          type="button"
          onClick={() => setAdvancedOpen((o) => !o)}
          className="flex items-center justify-between w-full max-w-full py-2.5 px-3 rounded-md hover:bg-muted/50 text-sm font-medium text-left"
        >
          <span>Advanced options</span>
          {advancedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        <CollapsibleContent>
          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4 mt-2">
            <div className="flex items-center justify-between gap-4">
              <Label>Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5">
                <Video className="h-3.5 w-3.5" />
                Video
              </Label>
              <Switch checked={videoEnabled} onCheckedChange={setVideoEnabled} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5">
                <Monitor className="h-3.5 w-3.5" />
                Screen share
              </Label>
              <Switch checked={screenShareEnabled} onCheckedChange={setScreenShareEnabled} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                Chat window
              </Label>
              <Switch checked={chatWindowEnabled} onCheckedChange={setChatWindowEnabled} />
            </div>
            <div>
              <Label className="block mb-2">Completion notification emails</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddEmail())}
                />
                <Button variant="outline" size="sm" onClick={handleAddEmail} disabled={!newEmail.trim()}>
                  Add
                </Button>
              </div>
              {notificationEmails.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {notificationEmails.map((email) => (
                    <span key={email} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-xs">
                      {email}
                      <button type="button" onClick={() => handleRemoveEmail(email)} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="pt-4">
        <FlowStepActions>
          <Button
            onClick={handleCreate}
            disabled={createMutation.isPending || updateMutation.isPending || !title.trim()}
            className="gap-2"
            size="lg"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <MessageSquare className="h-4 w-4" />
                Create conversation
              </>
            )}
          </Button>
        </FlowStepActions>
      </div>

      <AlertDialog open={itemToDelete !== null} onOpenChange={(o) => !o && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this conversation item?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => itemToDelete !== null && handleRemoveItem(itemToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </FlowStepFormInner>
  );
}
