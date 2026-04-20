import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea, TEXTAREA_SCROLL_AFTER_10_ROWS_LG } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Collapsible,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MessageSquare, Loader2, ChevronRight, CheckCircle2, ChevronDown, ChevronUp, X, Pencil, Trash2, Video, Monitor, Eye, Search, Copy, ExternalLink, ListChecks, Settings2 } from "lucide-react";
import { useCreateConversationInStep, useConversationTemplateSearch, useConversation, useUpdateConversationInStep } from "@/hooks/use-comms-api";
import { useAuthStore } from "@/stores/auth-store";
import LoadingScreen from "@/components/shared/ui/loading-screen";
import { cn, isValidEmail } from "@/lib/utils";
import { ensureCompletionEmailsIncludeMember, mergeTemplateCompletionEmails } from "@/lib/completion-notification-emails";
import { toast } from "sonner";
import type {
  ConversationCreatorFlowStep,
  Conversation,
  ConversationTemplate,
  CreateConversationRequest,
} from "@/types/orchestration-dashboard-types";
import type { ConversationFormData, ConversationItem } from "@/components/features/conversations/types";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/** Languages supported by Conversation (ISO 639-1). Must match internal-admin-orchestrator Conversations types (2-letter codes only). */
const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "af", label: "Afrikaans" },
  { code: "ar", label: "Arabic" },
  { code: "hy", label: "Armenian" },
  { code: "az", label: "Azerbaijani" },
  { code: "be", label: "Belarusian" },
  { code: "bs", label: "Bosnian" },
  { code: "bg", label: "Bulgarian" },
  { code: "ca", label: "Catalan" },
  { code: "zh", label: "Chinese" },
  { code: "hr", label: "Croatian" },
  { code: "cs", label: "Czech" },
  { code: "da", label: "Danish" },
  { code: "nl", label: "Dutch" },
  { code: "et", label: "Estonian" },
  { code: "fi", label: "Finnish" },
  { code: "fr", label: "French" },
  { code: "gl", label: "Galician" },
  { code: "de", label: "German" },
  { code: "el", label: "Greek" },
  { code: "he", label: "Hebrew" },
  { code: "hi", label: "Hindi" },
  { code: "hu", label: "Hungarian" },
  { code: "is", label: "Icelandic" },
  { code: "id", label: "Indonesian" },
  { code: "it", label: "Italian" },
  { code: "ja", label: "Japanese" },
  { code: "kn", label: "Kannada" },
  { code: "kk", label: "Kazakh" },
  { code: "ko", label: "Korean" },
  { code: "lv", label: "Latvian" },
  { code: "lt", label: "Lithuanian" },
  { code: "mk", label: "Macedonian" },
  { code: "ms", label: "Malay" },
  { code: "mr", label: "Marathi" },
  { code: "mi", label: "Maori" },
  { code: "ne", label: "Nepali" },
  { code: "no", label: "Norwegian" },
  { code: "fa", label: "Persian" },
  { code: "pl", label: "Polish" },
  { code: "pt", label: "Portuguese" },
  { code: "ro", label: "Romanian" },
  { code: "ru", label: "Russian" },
  { code: "sr", label: "Serbian" },
  { code: "sk", label: "Slovak" },
  { code: "sl", label: "Slovenian" },
  { code: "es", label: "Spanish" },
  { code: "sw", label: "Swahili" },
  { code: "sv", label: "Swedish" },
  { code: "tl", label: "Tagalog" },
  { code: "ta", label: "Tamil" },
  { code: "th", label: "Thai" },
  { code: "tr", label: "Turkish" },
  { code: "uk", label: "Ukrainian" },
  { code: "ur", label: "Urdu" },
  { code: "vi", label: "Vietnamese" },
  { code: "cy", label: "Welsh" },
];

const typeLabels: Record<string, string> = {
  QUESTION: "Question",
  DISCUSSION: "Discussion",
  MEDIA_REQUEST: "Media Request",
  REVIEW_MATERIAL: "Review Material",
  WALK_THROUGH: "Walk Through",
  FORM_DATA: "Form Data",
  CUSTOMER_SUPPORT: "Customer Support",
  SUMMARY: "Summary",
};

const LOCAL_CONVERSATION_ITEM_TYPE_SET = new Set<ConversationItem["type"]>([
  "QUESTION",
  "DISCUSSION",
  "MEDIA_REQUEST",
  "REVIEW_MATERIAL",
  "WALK_THROUGH",
  "FORM_DATA",
  "CUSTOMER_SUPPORT",
  "SUMMARY",
]);

function normalizeConversationItemType(type: string | undefined): ConversationItem["type"] {
  if (type && LOCAL_CONVERSATION_ITEM_TYPE_SET.has(type as ConversationItem["type"])) {
    return type as ConversationItem["type"];
  }
  return "QUESTION";
}

function conversationToFormData(conversation: Conversation): ConversationFormData {
  const rubric = conversation.scoringRubric as { scoringRubricInstructions?: string; criteria?: Record<string, string>; jsonMode?: string; jsonSchema?: string } | undefined;
  return {
    name: conversation.name || "",
    description: conversation.description || "",
    language: conversation.language || "en",
    videoEnabled: conversation.videoEnabled || false,
    screenShareEnabled: conversation.screenShareEnabled || false,
    chatWindowEnabled: conversation.chatWindowEnabled || false,
    allowAnyoneToStartConversation: conversation.allowAnyoneToStartConversation ?? false,
    scoringRubric: {
      scoringRubricInstructions: rubric?.scoringRubricInstructions || "",
      criteria: rubric?.criteria || {},
      jsonMode: rubric?.jsonMode || "NONE",
      jsonSchema: rubric?.jsonSchema,
    },
    completionNotificationEmails: conversation.completionNotificationEmails
      ? Array.from(conversation.completionNotificationEmails)
      : [],
    conversationItems: (conversation.conversationItems || []).map((item) => ({
      ...item,
      id: item.id || "",
      title: item.title || "",
      type: normalizeConversationItemType(item.type),
    })),
  };
}

interface TemplatePickerWithCardsProps {
  assemblyId: string;
  selectedTemplate: ConversationTemplate | null;
  onSelect: (template: ConversationTemplate | null) => void;
  disabled?: boolean;
}

function TemplatePickerWithCards({ assemblyId, selectedTemplate, onSelect, disabled }: TemplatePickerWithCardsProps) {
  const [search, setSearch] = useState("");
  const { templates, isLoading } = useConversationTemplateSearch(assemblyId, search, {
    page: 0,
    pageSize: 20,
  });

  // When a template is selected, show only the selection—no list clutter
  if (selectedTemplate) {
    return (
      <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="font-medium text-foreground">{selectedTemplate.name}</div>
            {selectedTemplate.description && (
              <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{selectedTemplate.description}</p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => onSelect(null)}
            className="shrink-0"
          >
            Change template
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 shrink-0 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search templates..."
          disabled={disabled}
          className={cn(
            "h-10 pl-9 rounded-md border border-border bg-muted/50 text-sm transition-colors placeholder:text-muted-foreground",
            "focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary/40 focus-visible:bg-muted/80",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        />
      </div>

      <div className="max-h-[280px] overflow-y-auto space-y-2 pr-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : templates.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {search ? "No templates found." : "No templates available."}
          </p>
        ) : (
          templates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelect(t)}
              disabled={disabled}
              className={cn(
                "w-full rounded-lg border p-4 text-left transition-all hover:border-primary/40 hover:bg-muted/50",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2"
              )}
            >
              <div className="font-medium text-foreground">{t.name}</div>
              {t.description && (
                <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{t.description}</p>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

interface ConversationCreatorStepProps {
  step: ConversationCreatorFlowStep;
  /** Assembly line ID for conversation APIs and updates (from session context). */
  assemblyId: string;
  conversationConfigId?: string | null;
  stepMetadata?: Record<string, string> | null;
  onConversationCreated?: (conversation: Conversation) => void;
  onComplete?: () => void;
  isLastStep?: boolean;
  sessionId?: string;
  stepIndex?: number;
  /** From session — pre-fills "Describe the conversation" when empty (e.g. dispatcher user message). */
  sessionUserQuery?: string | null;
}

export function ConversationCreatorStep({
  step: _step,
  assemblyId,
  conversationConfigId,
  stepMetadata,
  onConversationCreated,
  onComplete,
  isLastStep = false,
  sessionId,
  stepIndex,
  sessionUserQuery,
}: ConversationCreatorStepProps) {
  void _step;
  const userEmail = useAuthStore((s) => s.user?.email);
  const memberEmailNorm = useMemo(() => {
    const e = userEmail?.trim().toLowerCase();
    return e && isValidEmail(e) ? e : null;
  }, [userEmail]);
  const [prompt, setPrompt] = useState("");
  const sessionUserQuerySeededRef = useRef(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ConversationTemplate | null>(null);
  const [customInstructions, setCustomInstructions] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [language, setLanguage] = useState("en");
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [screenShareEnabled, setScreenShareEnabled] = useState(false);
  const [chatWindowEnabled, setChatWindowEnabled] = useState(false);
  const [notificationEmails, setNotificationEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [detailsNewEmail, setDetailsNewEmail] = useState("");
  const [editingItem, setEditingItem] = useState<ConversationItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [postCreateItemsOpen, setPostCreateItemsOpen] = useState(false);
  const [postCreateAdvancedOpen, setPostCreateAdvancedOpen] = useState(false);

  const [createdConversation, setCreatedConversation] = useState<Conversation | null>(null);
  const [formData, setFormData] = useState<ConversationFormData | null>(null);
  const [activeTab, setActiveTab] = useState<"describe" | "template">("describe");
  const [customInstructionsOpen, setCustomInstructionsOpen] = useState(false);

  const templateNotifyInitRef = useRef<string | null>(null);

  const hasConversationId = Boolean(conversationConfigId && String(conversationConfigId).trim());

  const {
    data: existingConversation,
    isLoading: isLoadingConversation,
    error: conversationError,
    refetch: refetchConversation,
  } = useConversation(
    conversationConfigId || "",
    hasConversationId,
    assemblyId || undefined
  );

  const createMutation = useCreateConversationInStep();
  const updateMutation = useUpdateConversationInStep();
  const [saveSuccess, setSaveSuccess] = useState(false);

  const displayConversation = createdConversation ?? existingConversation;
  const hasConversation = Boolean(displayConversation);
  const hasDraftFromChat = Boolean(stepMetadata?.draftConversationPatchUpdatedAt) && !hasConversation;

  useEffect(() => {
    sessionUserQuerySeededRef.current = false;
  }, [sessionId]);

  useEffect(() => {
    const q = sessionUserQuery?.trim();
    if (!q || sessionUserQuerySeededRef.current) return;
    setPrompt((p) => {
      if (p.trim()) return p;
      sessionUserQuerySeededRef.current = true;
      return q;
    });
  }, [sessionUserQuery, sessionId]);

  useEffect(() => {
    if (!memberEmailNorm) return;
    setNotificationEmails((prev) => ensureCompletionEmailsIncludeMember(prev, memberEmailNorm));
  }, [memberEmailNorm]);

  useEffect(() => {
    if (!selectedTemplate) {
      templateNotifyInitRef.current = null;
    }
  }, [selectedTemplate]);

  useEffect(() => {
    if (!selectedTemplate?.id || hasConversation) return;
    if (templateNotifyInitRef.current === selectedTemplate.id) return;
    templateNotifyInitRef.current = selectedTemplate.id;
    setNotificationEmails((prev) =>
      mergeTemplateCompletionEmails(selectedTemplate.completionNotificationEmails, prev, memberEmailNorm)
    );
  }, [selectedTemplate?.id, selectedTemplate?.completionNotificationEmails, hasConversation, memberEmailNorm]);

  // Apply chat draft updates before first save (same pattern as conversation-creator-from-template-step).
  useEffect(() => {
    if (hasConversation) return;
    if (!stepMetadata?.draftConversationPatchUpdatedAt) return;

    const draftName = stepMetadata.draftConversationName;
    const draftDescription = stepMetadata.draftConversationDescription;
    const draftItemsJson = stepMetadata.draftConversationItemsJson;

    let parsedItems: Array<{ id?: string; title?: string; type?: string; description?: string }> | null = null;
    if (draftItemsJson?.trim()) {
      try {
        parsedItems = JSON.parse(draftItemsJson) as Array<{ id?: string; title?: string; type?: string; description?: string }>;
      } catch (e) {
        console.error("Failed to parse draft conversation items from metadata:", e);
      }
    }

    const mappedItems: ConversationItem[] = (parsedItems ?? []).map((it) => ({
      ...it,
      id: it.id ?? "",
      title: it.title ?? "",
      type: normalizeConversationItemType(it.type),
    }));

    if (parsedItems !== null) {
      setLocalItems(mappedItems);
    }

    if (draftName?.trim() || draftDescription !== undefined) {
      setFormData((prev) => {
        const base =
          prev ??
          conversationToFormData({
            name: "",
            description: "",
            assemblyLineID: assemblyId ?? "",
            conversationItems: [],
          });
        const updates: Partial<ConversationFormData> = {};
        if (draftName?.trim()) updates.name = draftName;
        if (draftDescription !== undefined) updates.description = draftDescription;
        if (parsedItems !== null) updates.conversationItems = mappedItems;
        return { ...base, ...updates };
      });
    }
  }, [stepMetadata?.draftConversationPatchUpdatedAt, hasConversation, stepMetadata, assemblyId]);

  // Sync from API: initial load (no createdConversation) or external update (chat updated conversation)
  useEffect(() => {
    if (!existingConversation) return;
    const isInitialLoad = !createdConversation;
    const isSameConversation = createdConversation?.id === existingConversation.id;
    if (isInitialLoad || isSameConversation) {
      setCreatedConversation(existingConversation);
      setFormData(() => {
        const fd = conversationToFormData(existingConversation);
        return {
          ...fd,
          completionNotificationEmails: ensureCompletionEmailsIncludeMember(
            fd.completionNotificationEmails,
            memberEmailNorm
          ),
        };
      });
      // Sync localItems so form reflects agent updates (e.g. when agent adds/edits items via chat)
      const items = (existingConversation.conversationItems ?? []).map((item) => ({
        ...item,
        id: item.id || "",
        title: item.title || "",
        type: normalizeConversationItemType(item.type),
      }));
      setLocalItems(items);
    }
  }, [existingConversation, createdConversation, memberEmailNorm]);

  useEffect(() => {
    if (displayConversation && !formData) {
      const fd = conversationToFormData(displayConversation);
      setFormData({
        ...fd,
        completionNotificationEmails: ensureCompletionEmailsIncludeMember(
          fd.completionNotificationEmails,
          memberEmailNorm
        ),
      });
    }
  }, [displayConversation, formData, memberEmailNorm]);

  useEffect(() => {
    if (!memberEmailNorm || !hasConversation) return;
    setFormData((prev) => {
      if (!prev) return prev;
      const next = ensureCompletionEmailsIncludeMember(prev.completionNotificationEmails, memberEmailNorm);
      const cur = prev.completionNotificationEmails ?? [];
      if (next.length === cur.length && next.every((e, i) => e === cur[i])) return prev;
      return { ...prev, completionNotificationEmails: next };
    });
  }, [memberEmailNorm, hasConversation]);

  const conversationItems = useMemo((): ConversationItem[] => {
    const items = displayConversation?.conversationItems ?? formData?.conversationItems ?? [];
    return items.map((item) => ({
      ...item,
      id: item.id || "",
      title: item.title || "",
      type: normalizeConversationItemType(item.type),
    }));
  }, [displayConversation?.conversationItems, formData?.conversationItems]);

  const [localItems, setLocalItems] = useState<ConversationItem[]>(conversationItems);
  const prevConvIdRef = useRef<string | null>(null);
  useEffect(() => {
    const convId = displayConversation?.id ?? null;
    if (convId !== prevConvIdRef.current) {
      prevConvIdRef.current = convId;
      setLocalItems(conversationItems);
    }
  }, [displayConversation?.id, conversationItems]);

  const handleCreate = useCallback(async () => {
    if (!sessionId || stepIndex === undefined || !assemblyId) return;

    const hasPrompt = prompt.trim().length > 0;
    const hasTemplate = selectedTemplate != null;

    if (!hasPrompt && !hasTemplate) return;

    try {
      let request: CreateConversationRequest;
      if (hasTemplate) {
        request = {
          sourceConversationId: selectedTemplate!.id,
          name: selectedTemplate!.name,
          customInstructions: customInstructions.trim() || undefined,
          videoEnabled,
          screenShareEnabled,
          chatWindowEnabled,
          completionNotificationEmails: notificationEmails.length > 0 ? notificationEmails : undefined,
          language: language || undefined,
        };
      } else {
        request = {
          name: prompt.trim().length > 50 ? prompt.trim().slice(0, 47) + "..." : prompt.trim(),
          conversationPrompt: prompt.trim(),
          videoEnabled,
          screenShareEnabled,
          chatWindowEnabled,
          completionNotificationEmails: notificationEmails.length > 0 ? notificationEmails : undefined,
          language: language || undefined,
        };
      }

      const conversation = await createMutation.mutateAsync({
        sessionId,
        stepIndex,
        request,
      });
      setCreatedConversation(conversation);
      const fd = conversationToFormData(conversation);
      setFormData({
        ...fd,
        completionNotificationEmails: ensureCompletionEmailsIncludeMember(
          fd.completionNotificationEmails,
          memberEmailNorm
        ),
      });
      onConversationCreated?.(conversation);
    } catch (err) {
      console.error("Failed to create conversation:", err);
    }
  }, [
    sessionId,
    stepIndex,
    assemblyId,
    prompt,
    selectedTemplate,
    customInstructions,
    videoEnabled,
    screenShareEnabled,
    chatWindowEnabled,
    notificationEmails,
    language,
    memberEmailNorm,
    createMutation,
    onConversationCreated,
  ]);

  const handleSave = useCallback(async () => {
    if (!sessionId || stepIndex === undefined || !displayConversation?.id || !assemblyId) return;

    const currentFormData = formData ?? conversationToFormData(displayConversation);
    const mappedItems = localItems.map((item) => ({
      id: item.id || undefined,
      type: item.type,
      title: item.title || "",
      description: item.description,
    }));

    const completionEmails = currentFormData.completionNotificationEmails;
    await updateMutation.mutateAsync({
      sessionId,
      stepIndex,
      request: {
        name: currentFormData.name,
        description: currentFormData.description,
        assemblyLineId: assemblyId,
        language: currentFormData.language || undefined,
        videoEnabled: currentFormData.videoEnabled,
        screenShareEnabled: currentFormData.screenShareEnabled,
        chatWindowEnabled: currentFormData.chatWindowEnabled,
        completionNotificationEmails:
          completionEmails != null && completionEmails.length > 0 ? completionEmails : undefined,
        conversationItems: mappedItems,
      },
    });
    setFormData((prev) => (prev ? { ...prev, conversationItems: localItems } : null));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  }, [sessionId, stepIndex, assemblyId, formData, localItems, updateMutation, displayConversation]);

  const handleAddEmail = () => {
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed || !isValidEmail(trimmed) || notificationEmails.some((e) => e.trim().toLowerCase() === trimmed)) return;
    setNotificationEmails((p) => [...p, trimmed]);
    setNewEmail("");
  };

  const handleRemoveEmail = (email: string) => {
    setNotificationEmails((p) => p.filter((e) => e !== email));
  };

  const handleAddDetailsEmail = () => {
    const trimmed = detailsNewEmail.trim().toLowerCase();
    if (!trimmed || !isValidEmail(trimmed)) return;
    const current = formData?.completionNotificationEmails ?? [];
    if (current.some((e) => e.trim().toLowerCase() === trimmed)) return;
    setFormData((p) => (p ? { ...p, completionNotificationEmails: [...current, trimmed] } : null));
    setDetailsNewEmail("");
  };

  const handleRemoveDetailsEmail = (email: string) => {
    setFormData((p) =>
      p
        ? {
            ...p,
            completionNotificationEmails: (p.completionNotificationEmails ?? []).filter((e) => e !== email),
          }
        : null
    );
  };

  const handleDeleteItem = (itemId: string) => {
    setLocalItems((p) => p.filter((i) => i.id !== itemId));
    setItemToDelete(null);
  };

  if (conversationError && hasConversationId) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-4">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load conversation</p>
          <p className="text-sm text-muted-foreground mb-4">{String(conversationError)}</p>
          <Button onClick={() => refetchConversation()} variant="default">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (hasConversationId && isLoadingConversation) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingScreen variant="inline" message="Loading conversation..." />
      </div>
    );
  }


  if (editingItem) {
    return (
      <FlowStepFormInner>
      <ConversationItemEditor
        item={editingItem}
        onSave={(updated) => {
          const item = {
            ...updated,
            id: updated.id ?? "",
            title: updated.title ?? "",
            type: updated.type,
          };
          setLocalItems((p) =>
            p.map((i) => (i.id === item.id ? { ...item, title: item.title || i.title || "" } : i))
          );
          setEditingItem(null);
        }}
        onCancel={() => setEditingItem(null)}
      />
      </FlowStepFormInner>
    );
  }

  if (hasConversation && displayConversation) {
    const description = displayConversation.description || "No description";
    const conversationUrl = getConversationUrl(
      displayConversation.id ?? "",
      displayConversation.allowAnyoneToStartConversation
    );

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <FlowStepFormInner variant="conversation">
        <Card>
          <CardContent className="pt-6 space-y-5">
            {/* 1. What this conversation does */}
            <div className="rounded-lg border border-border bg-muted/30 p-4 shadow-sm">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">What this conversation does</h3>
              <div className="text-base font-medium text-foreground leading-relaxed max-h-32 overflow-y-auto prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-p:text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-ul:my-1 prose-ol:my-1">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{description}</ReactMarkdown>
              </div>
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
            {localItems.length > 0 && (
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
                      <span className="block text-sm font-medium text-foreground">Conversation Items ({localItems.length})</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {postCreateItemsOpen ? "Click to hide" : "The agenda items that make up this conversation — view, edit, or remove"}
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
                    <TooltipProvider>
                      <div className="space-y-2">
                        {localItems.map((item) => {
                          const isExpanded = expandedItemId === item.id;
                          return (
                            <div
                              key={item.id}
                              className="rounded-lg border bg-card overflow-hidden"
                            >
                              <div className="flex items-center justify-between p-3">
                                <div>
                                  <span className="font-medium text-sm">{item.title || "Untitled"}</span>
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    {typeLabels[item.type] || item.type}
                                  </span>
                                </div>
                                <div className="flex gap-1">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn("h-8 w-8", isExpanded && "bg-muted")}
                                        onClick={() =>
                                          setExpandedItemId(isExpanded ? null : item.id)
                                        }
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{isExpanded ? "Hide details" : "View details"}</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() =>
                                          setEditingItem({
                                            ...item,
                                            id: item.id || "",
                                            title: item.title || "",
                                          } as ConversationItem)
                                        }
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Edit</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                        onClick={() => setItemToDelete(item.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Delete</TooltipContent>
                                  </Tooltip>
                                </div>
                              </div>
                              {isExpanded && (
                                <div className="border-t bg-muted/20 px-3 py-3 text-sm space-y-2">
                                  <p className="font-medium text-foreground">{item.title || "Untitled"}</p>
                                  {item.description ? (
                                    <p className="text-muted-foreground whitespace-pre-wrap">{item.description}</p>
                                  ) : (
                                    <p className="text-muted-foreground italic">No description</p>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </TooltipProvider>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

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
                  <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <Label className="text-muted-foreground flex items-center gap-1.5 shrink-0">Language</Label>
                      <Select
                        value={(formData?.language ?? displayConversation.language ?? "en")}
                        onValueChange={(v) => setFormData((p) => (p ? { ...p, language: v } : null))}
                      >
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
                      <Label className="text-muted-foreground flex items-center gap-1.5">
                        <Video className="h-3.5 w-3.5" />
                        Video
                      </Label>
                      <Switch
                        checked={formData?.videoEnabled ?? displayConversation.videoEnabled ?? false}
                        onCheckedChange={(v) => setFormData((p) => (p ? { ...p, videoEnabled: v } : null))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-muted-foreground flex items-center gap-1.5">
                        <Monitor className="h-3.5 w-3.5" />
                        Screen share
                      </Label>
                      <Switch
                        checked={formData?.screenShareEnabled ?? displayConversation.screenShareEnabled ?? false}
                        onCheckedChange={(v) => setFormData((p) => (p ? { ...p, screenShareEnabled: v } : null))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-muted-foreground flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5" />
                        Chat window
                      </Label>
                      <Switch
                        checked={formData?.chatWindowEnabled ?? displayConversation.chatWindowEnabled ?? false}
                        onCheckedChange={(v) => setFormData((p) => (p ? { ...p, chatWindowEnabled: v } : null))}
                      />
                    </div>
                    <div>
                      <Label className="text-muted-foreground block mb-2">Completion notification emails</Label>
                      <div className="flex gap-2">
                        <Input
                          type="email"
                          placeholder="email@example.com"
                          value={detailsNewEmail}
                          onChange={(e) => setDetailsNewEmail(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddDetailsEmail())}
                        />
                        <Button variant="outline" size="sm" onClick={handleAddDetailsEmail} disabled={!detailsNewEmail.trim()}>
                          Add
                        </Button>
                      </div>
                      {((formData?.completionNotificationEmails ?? displayConversation.completionNotificationEmails)?.length ?? 0) > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(formData?.completionNotificationEmails ?? displayConversation.completionNotificationEmails ?? []).map((email) => (
                            <span
                              key={email}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-xs"
                            >
                              {email}
                              <button
                                type="button"
                                onClick={() => handleRemoveDetailsEmail(email)}
                                className="hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending || saveSuccess}
                variant={saveSuccess ? "outline" : "default"}
                className={cn("gap-2 transition-all duration-300", saveSuccess && "border-green-500 text-green-600 dark:text-green-400")}
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
                  "Save"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {onComplete && (
          <div className="pt-4 border-t border-border/40">
            <FlowStepActions>
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
            </FlowStepActions>
          </div>
        )}

        <AlertDialog open={!!itemToDelete} onOpenChange={(o) => !o && setItemToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete item</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this conversation item?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => itemToDelete && handleDeleteItem(itemToDelete)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        </FlowStepFormInner>
      </motion.div>
    );
  }

  const canCreate = prompt.trim().length > 0 || selectedTemplate != null;

  const handleTabChange = (value: string) => {
    if (value === "describe") {
      setSelectedTemplate(null);
      setCustomInstructions("");
      setCustomInstructionsOpen(false);
    } else {
      setPrompt("");
    }
    setActiveTab(value as "describe" | "template");
  };

  const handleSelectTemplate = (t: ConversationTemplate | null) => {
    setSelectedTemplate(t);
    if (t) {
      setPrompt("");
    } else {
      setCustomInstructions("");
      setCustomInstructionsOpen(false);
    }
  };

  const handlePromptChange = (v: string) => {
    setPrompt(v);
    if (v.trim()) setSelectedTemplate(null);
  };

  // No overlay — simple inline form. Step title + description are shown by parent Card.
  return (
    <FlowStepFormInner variant="conversation" className="pt-8 flex flex-col items-stretch space-y-14">
      {hasDraftFromChat && (
        <div className="w-full rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground">
          Chat changes are ready in draft mode. Click <span className="font-semibold">Create conversation</span> to save them.
        </div>
      )}
      <Label className="text-2xl font-semibold text-foreground block text-center">
        What do you want to get done?
      </Label>

      {/* Step 1: Describe or choose template */}
      <div className="w-full space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
            1
          </span>
          <span className="text-sm font-medium text-foreground">Describe or choose a template</span>
        </div>
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="describe">Describe the conversation</TabsTrigger>
            <TabsTrigger value="template">Choose template</TabsTrigger>
          </TabsList>

          <TabsContent value="describe" className="mt-4">
            <div className="max-w-2xl rounded-lg border-2 border-border bg-muted/30 p-3 shadow-sm ring-1 ring-border/50 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-colors">
              <Textarea
                id="conversation-prompt"
                placeholder="e.g. Conduct a customer support call for billing questions, collect order details and preferred resolution..."
                value={prompt}
                onChange={(e) => handlePromptChange(e.target.value)}
                rows={6}
                className={cn(
                  "resize-y text-base w-full !border-0 !outline-none !ring-0 bg-transparent shadow-none focus-visible:!ring-0 focus-visible:!outline-none",
                  TEXTAREA_SCROLL_AFTER_10_ROWS_LG
                )}
                disabled={createMutation.isPending}
              />
            </div>
          </TabsContent>

          <TabsContent value="template" className="mt-4">
            <TemplatePickerWithCards
              assemblyId={assemblyId || ""}
              selectedTemplate={selectedTemplate}
              onSelect={handleSelectTemplate}
              disabled={createMutation.isPending}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Step 2: Custom instructions (optional) - only when template selected */}
      {selectedTemplate && (
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/20 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                2
              </span>
              <div>
                <span className="text-sm font-medium text-foreground block">Custom instructions (optional)</span>
                <span className="text-xs text-muted-foreground">Add instructions that complement the template</span>
              </div>
            </div>
            <Switch
              checked={customInstructionsOpen}
              onCheckedChange={setCustomInstructionsOpen}
            />
          </div>
          {customInstructionsOpen && (
            <div className="max-w-2xl rounded-lg border-2 border-border bg-background p-4 shadow-sm">
              <Textarea
                id="custom-instructions"
                placeholder="e.g. Focus on enterprise customers, emphasize ROI and security..."
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                rows={4}
                className={cn("resize-y text-base w-full", TEXTAREA_SCROLL_AFTER_10_ROWS_LG)}
                disabled={createMutation.isPending}
              />
            </div>
          )}
        </div>
      )}

      {/* Step 2 or 3: Advanced options (optional) - step 2 when describe, step 3 when template */}
      <div className="w-full space-y-4">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setAdvancedOpen((o) => !o)}
          onKeyDown={(e) => e.key === "Enter" && setAdvancedOpen((o) => !o)}
          className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/20 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
              {selectedTemplate ? "3" : "2"}
            </span>
            <div>
              <span className="text-sm font-medium text-foreground block">Advanced options (optional)</span>
              <span className="text-xs text-muted-foreground">Language, video, notifications, and more</span>
            </div>
          </div>
          <Switch
            checked={advancedOpen}
            onCheckedChange={setAdvancedOpen}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        {advancedOpen && (
          <div className="rounded-lg border-2 border-border bg-background p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <Label className="text-sm">Language</Label>
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
              <Label className="text-sm">Video</Label>
              <Switch checked={videoEnabled} onCheckedChange={setVideoEnabled} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Screen share</Label>
              <Switch checked={screenShareEnabled} onCheckedChange={setScreenShareEnabled} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Chat window</Label>
              <Switch checked={chatWindowEnabled} onCheckedChange={setChatWindowEnabled} />
            </div>
            <div>
              <Label className="text-sm block mb-2">Completion notification emails</Label>
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
                    <span
                      key={email}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-xs"
                    >
                      {email}
                      <button
                        type="button"
                        onClick={() => handleRemoveEmail(email)}
                        className="hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      <div className="pt-6 flex justify-center">
        <Button
          onClick={handleCreate}
          disabled={!canCreate || createMutation.isPending}
          className="gap-2 px-8 text-base"
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
      </div>
    </FlowStepFormInner>
  );
}
