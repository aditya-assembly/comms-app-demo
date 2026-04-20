import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { X, Save, Plus, Trash2, Upload, FileIcon, Loader2, Info, HelpCircle, ExternalLink } from "lucide-react";
import type { ConversationItem } from "./types";
import { toast } from "sonner";
import {
  CONVERSATION_ITEM_TYPE_QUESTION,
  CONVERSATION_ITEM_TYPE_DISCUSSION,
  CONVERSATION_ITEM_TYPE_WALK_THROUGH,
  CONVERSATION_ITEM_TYPE_MEDIA_REQUEST,
  CONVERSATION_ITEM_TYPE_REVIEW_MATERIAL,
  CONVERSATION_ITEM_TYPE_CUSTOMER_SUPPORT,
  CONVERSATION_ITEM_TYPE_FORM_DATA,
  CONVERSATION_ITEM_TYPE_SUMMARY,
  FORM_FIELD_TYPE_STRING,
  FORM_FIELD_TYPE_STRING_ARRAY,
  FORM_FIELD_TYPE_NUMBER_INTEGER,
  FORM_FIELD_TYPE_NUMBER_DOUBLE,
  FORM_FIELD_TYPE_BOOLEAN,
  FORM_FIELD_TYPE_DATE,
  FORM_FIELD_TYPE_JSON,
} from "./constants";

interface ConversationItemEditorProps {
  item: ConversationItem;
  onSave: (item: ConversationItem) => void;
  onCancel: () => void;
  conversationId?: string;
  readOnly?: boolean;
}

interface FormField {
  fieldName: string;
  fieldLabel: string;
  fieldDescription: string;
  fieldType:
    | typeof FORM_FIELD_TYPE_STRING
    | typeof FORM_FIELD_TYPE_STRING_ARRAY
    | typeof FORM_FIELD_TYPE_NUMBER_INTEGER
    | typeof FORM_FIELD_TYPE_NUMBER_DOUBLE
    | typeof FORM_FIELD_TYPE_BOOLEAN
    | typeof FORM_FIELD_TYPE_DATE
    | typeof FORM_FIELD_TYPE_JSON;
  defaultValue: string | null;
  required: boolean;
  options: string[];
}

interface MediaItem {
  id: string;
  name: string;
  thumbnail: string | null;
  media: string;
  sizeMB: number;
  uploadComplete: boolean;
  description: string | null;
  owners: string[];
}

const itemTypes: ConversationItem["type"][] = [
  CONVERSATION_ITEM_TYPE_QUESTION,
  CONVERSATION_ITEM_TYPE_DISCUSSION,
  CONVERSATION_ITEM_TYPE_MEDIA_REQUEST,
  CONVERSATION_ITEM_TYPE_REVIEW_MATERIAL,
  CONVERSATION_ITEM_TYPE_WALK_THROUGH,
  CONVERSATION_ITEM_TYPE_FORM_DATA,
  CONVERSATION_ITEM_TYPE_CUSTOMER_SUPPORT,
  CONVERSATION_ITEM_TYPE_SUMMARY,
];

const typeLabels: Record<ConversationItem["type"], string> = {
  [CONVERSATION_ITEM_TYPE_QUESTION]: "Question",
  [CONVERSATION_ITEM_TYPE_DISCUSSION]: "Discussion",
  [CONVERSATION_ITEM_TYPE_MEDIA_REQUEST]: "Media Request",
  [CONVERSATION_ITEM_TYPE_REVIEW_MATERIAL]: "Review Material",
  [CONVERSATION_ITEM_TYPE_WALK_THROUGH]: "Walk Through",
  [CONVERSATION_ITEM_TYPE_FORM_DATA]: "Form Data",
  [CONVERSATION_ITEM_TYPE_CUSTOMER_SUPPORT]: "Customer Support",
  [CONVERSATION_ITEM_TYPE_SUMMARY]: "Summary",
};

const typeDescriptions: Record<ConversationItem["type"], string> = {
  [CONVERSATION_ITEM_TYPE_QUESTION]: "Ask a direct question to gather specific information from the user.",
  [CONVERSATION_ITEM_TYPE_DISCUSSION]: "Engage in a more opinionated discussion with 2-3 exchanges to explore ideas.",
  [CONVERSATION_ITEM_TYPE_MEDIA_REQUEST]: "Request media documents or files from the user.",
  [CONVERSATION_ITEM_TYPE_REVIEW_MATERIAL]: "Show a document to the user and then have a discussion about it.",
  [CONVERSATION_ITEM_TYPE_WALK_THROUGH]: "Deep dive analysis - analyze something in great detail step-by-step.",
  [CONVERSATION_ITEM_TYPE_FORM_DATA]: "Collect structured information through a form with multiple fields.",
  [CONVERSATION_ITEM_TYPE_CUSTOMER_SUPPORT]: "Allow users to ask questions and have the agent provide answers and support.",
  [CONVERSATION_ITEM_TYPE_SUMMARY]: "Generate a structured summary of the conversation or session.",
};

const promptExamples: Record<string, { description: string; example: string }> = {
  questionPrompt: {
    description: "Instruct the agent on how to ask the question to the user.",
    example: "Please ask the candidate to describe their experience with analyzing marketing data and the tools they have used.",
  },
  discussionPrompt: {
    description: "Guide the agent on facilitating a discussion with follow-ups.",
    example: "Ask the candidate to discuss how they would approach creating a marketing strategy for a new product launch. Follow up with questions about their reasoning and decision-making process.",
  },
  walkThroughPrompt: {
    description: "Provide step-by-step instructions for the agent to guide the user through a detailed analysis.",
    example: "Guide the candidate step-by-step through how they would plan and execute a marketing campaign, asking for details at each phase.",
  },
  mediaRequestPrompt: {
    description: "Tell the agent what media to request and how to ask for it.",
    example: "Please upload your most recent CV or resume for the Marketing Analyst position.",
  },
  validationInstructions: {
    description: "Explain how the agent should validate or verify the submitted media.",
    example: "Please check if the uploaded document is a CV or a resume.",
  },
  reviewPrompt: {
    description: "Instruct the agent on how to present the material and conduct the discussion.",
    example: "Ask the candidate their opinion on the report presented in the case study and then follow up on how they would improve it.",
  },
  issuePrompt: {
    description: "Guide the agent on how to invite and understand the user's questions or issues.",
    example: "Invite the candidate to ask any questions they may have about the hiring process.",
  },
  resolutionPrompt: {
    description: "Instruct the agent on how to provide solutions and answer questions.",
    example: "Provide clear and accurate information about the hiring process, including interview stages, timelines, and next steps.",
  },
  instructions: {
    description: "Tell the agent how to help users complete the form effectively.",
    example: "Guide the user through filling out their personal information, explaining why each field is needed and ensuring accuracy.",
  },
  fieldDescription: {
    description: "Explain to the agent what information to collect and how to guide the user.",
    example: "Your legal full name as it appears on official documents.",
  },
};

const fieldTypes = [
  { value: FORM_FIELD_TYPE_STRING, label: "Text" },
  { value: FORM_FIELD_TYPE_STRING_ARRAY, label: "Multiple Choice" },
  { value: FORM_FIELD_TYPE_NUMBER_INTEGER, label: "Integer Number" },
  { value: FORM_FIELD_TYPE_NUMBER_DOUBLE, label: "Decimal Number" },
  { value: FORM_FIELD_TYPE_BOOLEAN, label: "Yes/No" },
  { value: FORM_FIELD_TYPE_DATE, label: "Date" },
  { value: FORM_FIELD_TYPE_JSON, label: "JSON Data" },
];

function PromptGuidance({ promptKey }: { promptKey: string }) {
  const guidance = promptExamples[promptKey];
  if (!guidance) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="h-5 w-5 p-0 hover:bg-muted">
          <Info className="h-4 w-4 text-blue-500" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-4" align="start">
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <HelpCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">How to write this prompt</h4>
              <p className="text-sm text-muted-foreground">{guidance.description}</p>
            </div>
          </div>
          <div className="space-y-2 pt-2 border-t">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Example:</p>
            <p className="text-sm bg-muted p-3 rounded-md border italic">&quot;{guidance.example}&quot;</p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function ConversationItemEditor({ item, onSave, onCancel, conversationId: _conversationId, readOnly = false }: ConversationItemEditorProps) {
  const [editedItem, setEditedItem] = useState<ConversationItem>({ ...item });
  const [showErrors, setShowErrors] = useState(false);

  const validateItem = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!editedItem.title?.trim()) {
      errors.push("Title is required");
    }

    switch (editedItem.type) {
      case CONVERSATION_ITEM_TYPE_QUESTION:
        if (!editedItem.question || !(editedItem.question as string).trim()) errors.push("Question text is required");
        if (!editedItem.questionPrompt || !(editedItem.questionPrompt as string).trim()) errors.push("Question prompt is required");
        break;
      case CONVERSATION_ITEM_TYPE_DISCUSSION:
        if (!editedItem.discussionPrompt || !(editedItem.discussionPrompt as string).trim()) errors.push("Discussion prompt is required");
        break;
      case CONVERSATION_ITEM_TYPE_WALK_THROUGH:
        if (!editedItem.walkThroughPrompt || !(editedItem.walkThroughPrompt as string).trim()) errors.push("Walk through prompt is required");
        break;
      case CONVERSATION_ITEM_TYPE_MEDIA_REQUEST:
        if (!editedItem.mediaRequestPrompt || !(editedItem.mediaRequestPrompt as string).trim()) errors.push("Media request prompt is required");
        break;
      case CONVERSATION_ITEM_TYPE_REVIEW_MATERIAL:
        if (!editedItem.reviewPrompt || !(editedItem.reviewPrompt as string).trim()) errors.push("Review prompt is required");
        if (!editedItem.material) errors.push("Material file is required");
        break;
      case CONVERSATION_ITEM_TYPE_CUSTOMER_SUPPORT:
        if (!editedItem.issue || !(editedItem.issue as string).trim()) errors.push("Issue description is required");
        if (!editedItem.issuePrompt || !(editedItem.issuePrompt as string).trim()) errors.push("Issue prompt is required");
        if (!editedItem.resolutionPrompt || !(editedItem.resolutionPrompt as string).trim()) errors.push("Resolution prompt is required");
        break;
      case CONVERSATION_ITEM_TYPE_FORM_DATA: {
        if (!editedItem.formTitle || !(editedItem.formTitle as string).trim()) errors.push("Form title is required");
        if (!editedItem.instructions || !(editedItem.instructions as string).trim()) errors.push("Instructions are required");
        const fields = (editedItem.fields as FormField[]) || [];
        if (fields.length === 0) {
          errors.push("At least one form field is required");
        } else {
          fields.forEach((field, index) => {
            if (!field.fieldName?.trim()) errors.push(`Field ${index + 1}: Field name is required`);
            if (!field.fieldLabel?.trim()) errors.push(`Field ${index + 1}: Field label is required`);
            if (!field.fieldDescription?.trim()) errors.push(`Field ${index + 1}: Field description is required`);
            if (field.fieldType === FORM_FIELD_TYPE_STRING_ARRAY && (!field.options || field.options.length === 0)) {
              errors.push(`Field ${index + 1}: At least one option is required for multiple choice fields`);
            }
          });
        }
        break;
      }
    }

    return { isValid: errors.length === 0, errors };
  };

  const handleSave = () => {
    if (readOnly) return;
    const validation = validateItem();
    if (!validation.isValid) {
      setShowErrors(true);
      toast.error("Please fill in all required fields", { description: validation.errors[0] });
      return;
    }
    onSave(editedItem);
  };

  const hasFieldError = (fieldName: string): boolean => {
    if (!showErrors) return false;
    const value = editedItem[fieldName];
    if (value === null || value === undefined) return true;
    if (typeof value === "string" && !value.trim()) return true;
    return false;
  };

  const updateField = (field: string, value: unknown) => {
    setEditedItem((prev) => ({ ...prev, [field]: value }));
  };

  const removeMediaItem = (fieldName: string, index?: number) => {
    if (index !== undefined) {
      const items = (editedItem[fieldName] as MediaItem[]) || [];
      updateField(fieldName, items.filter((_, i) => i !== index));
    } else {
      updateField(fieldName, null);
    }
  };

  const addFormField = () => {
    const fields = (editedItem.fields as FormField[]) || [];
    const newField: FormField = {
      fieldName: "",
      fieldLabel: "",
      fieldDescription: "",
      fieldType: FORM_FIELD_TYPE_STRING,
      defaultValue: null,
      required: false,
      options: [],
    };
    updateField("fields", [...fields, newField]);
  };

  const updateFormField = (index: number, field: Partial<FormField>) => {
    const fields = [...((editedItem.fields as FormField[]) || [])];
    fields[index] = { ...fields[index], ...field };
    updateField("fields", fields);
  };

  const removeFormField = (index: number) => {
    const fields = (editedItem.fields as FormField[]) || [];
    updateField("fields", fields.filter((_, i) => i !== index));
  };

  const addOption = (fieldIndex: number) => {
    const fields = [...((editedItem.fields as FormField[]) || [])];
    fields[fieldIndex].options = [...fields[fieldIndex].options, ""];
    updateField("fields", fields);
  };

  const updateOption = (fieldIndex: number, optionIndex: number, value: string) => {
    const fields = [...((editedItem.fields as FormField[]) || [])];
    fields[fieldIndex].options[optionIndex] = value;
    updateField("fields", fields);
  };

  const removeOption = (fieldIndex: number, optionIndex: number) => {
    const fields = [...((editedItem.fields as FormField[]) || [])];
    fields[fieldIndex].options = fields[fieldIndex].options.filter((_, i) => i !== optionIndex);
    updateField("fields", fields);
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }} className="w-full">
      <Card className="shadow-xl border-2 border-border">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{readOnly ? "View Conversation Item" : "Edit Conversation Item"}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {readOnly ? "View the details of this conversation item" : "Update the details of this conversation item"}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6 max-h-[70vh] overflow-y-auto">
          {showErrors && !readOnly && !validateItem().isValid && (
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-md">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-foreground">Please complete the required fields</h4>
                  <ul className="mt-2 text-sm text-destructive list-disc pl-6 space-y-1 list-outside">
                    {validateItem().errors.slice(0, 5).map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                    {validateItem().errors.length > 5 && <li>... and {validateItem().errors.length - 5} more</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4 pb-4 border-b">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Basic Information</h3>
            <div className="space-y-2">
              <Label htmlFor="itemType">Item Type</Label>
              <Select value={editedItem.type} onValueChange={(value: ConversationItem["type"]) => setEditedItem((prev) => ({ ...prev, type: value }))} disabled={readOnly}>
                <SelectTrigger id="itemType">
                  <SelectValue>{typeLabels[editedItem.type]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {itemTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      <div className="flex flex-col py-1">
                        <span className="font-medium">{typeLabels[type]}</span>
                        <span className="text-xs text-muted-foreground mt-0.5">{typeDescriptions[type]}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="itemTitle">Title <span className="text-destructive">*</span></Label>
              <Input id="itemTitle" value={editedItem.title} onChange={(e) => updateField("title", e.target.value)} placeholder="Enter item title" readOnly={readOnly}
                className={hasFieldError("title") ? "border-destructive" : ""} />
              {hasFieldError("title") && <p className="text-xs text-destructive">Title is required</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="itemDescription">Description</Label>
              <Textarea id="itemDescription" value={(editedItem.description as string) || ""} onChange={(e) => updateField("description", e.target.value)} placeholder="Enter item description" rows={3} readOnly={readOnly} />
            </div>
          </div>

          {/* Type-specific fields */}
          {editedItem.type === CONVERSATION_ITEM_TYPE_QUESTION && (
            <>
              <div className="space-y-4 pb-4 border-b">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Display Fields</h3>
                <div className="space-y-2">
                  <Label htmlFor="question">Question Text <span className="text-destructive">*</span></Label>
                  <Textarea id="question" value={(editedItem.question as string) || ""} onChange={(e) => updateField("question", e.target.value)} placeholder="The question displayed to the user" rows={3} readOnly={readOnly} className={hasFieldError("question") ? "border-destructive" : ""} />
                  {hasFieldError("question") && <p className="text-xs text-destructive">Question text is required</p>}
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Agent Instructions</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="questionPrompt">Question Prompt <span className="text-destructive">*</span></Label>
                    <PromptGuidance promptKey="questionPrompt" />
                  </div>
                  <Textarea id="questionPrompt" value={(editedItem.questionPrompt as string) || ""} onChange={(e) => updateField("questionPrompt", e.target.value)} placeholder="Instructions for the agent" rows={3} readOnly={readOnly} className={hasFieldError("questionPrompt") ? "border-destructive" : ""} />
                  {hasFieldError("questionPrompt") ? <p className="text-xs text-destructive">Question prompt is required</p> : <p className="text-xs text-muted-foreground">Guides the agent on how to phrase this question</p>}
                </div>
              </div>
            </>
          )}

          {editedItem.type === CONVERSATION_ITEM_TYPE_DISCUSSION && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Agent Instructions</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="discussionPrompt">Discussion Prompt <span className="text-destructive">*</span></Label>
                  <PromptGuidance promptKey="discussionPrompt" />
                </div>
                <Textarea id="discussionPrompt" value={(editedItem.discussionPrompt as string) || ""} onChange={(e) => updateField("discussionPrompt", e.target.value)} placeholder="Instructions for the discussion" rows={4} readOnly={readOnly} className={hasFieldError("discussionPrompt") ? "border-destructive" : ""} />
                {hasFieldError("discussionPrompt") ? <p className="text-xs text-destructive">Discussion prompt is required</p> : <p className="text-xs text-muted-foreground">Guides the agent on how to facilitate this discussion</p>}
              </div>
            </div>
          )}

          {editedItem.type === CONVERSATION_ITEM_TYPE_WALK_THROUGH && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Agent Instructions</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="walkThroughPrompt">Walk Through Prompt <span className="text-destructive">*</span></Label>
                  <PromptGuidance promptKey="walkThroughPrompt" />
                </div>
                <Textarea id="walkThroughPrompt" value={(editedItem.walkThroughPrompt as string) || ""} onChange={(e) => updateField("walkThroughPrompt", e.target.value)} placeholder="Step-by-step instructions" rows={4} readOnly={readOnly} className={hasFieldError("walkThroughPrompt") ? "border-destructive" : ""} />
                {hasFieldError("walkThroughPrompt") ? <p className="text-xs text-destructive">Walk through prompt is required</p> : <p className="text-xs text-muted-foreground">Detailed steps for the agent to walk the user through</p>}
              </div>
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="enableScreenShare">Enable Screen Share</Label>
                  <p className="text-xs text-muted-foreground">Allow screen sharing during this walk-through</p>
                </div>
                <Switch id="enableScreenShare" checked={(editedItem.enableScreenShare as boolean) || false} onCheckedChange={(checked) => updateField("enableScreenShare", checked)} disabled={readOnly} />
              </div>
            </div>
          )}

          {editedItem.type === CONVERSATION_ITEM_TYPE_MEDIA_REQUEST && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Agent Instructions</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="mediaRequestPrompt">Media Request Prompt <span className="text-destructive">*</span></Label>
                  <PromptGuidance promptKey="mediaRequestPrompt" />
                </div>
                <Textarea id="mediaRequestPrompt" value={(editedItem.mediaRequestPrompt as string) || ""} onChange={(e) => updateField("mediaRequestPrompt", e.target.value)} placeholder="Instructions for what media to request" rows={3} readOnly={readOnly} className={hasFieldError("mediaRequestPrompt") ? "border-destructive" : ""} />
                {hasFieldError("mediaRequestPrompt") ? <p className="text-xs text-destructive">Media request prompt is required</p> : <p className="text-xs text-muted-foreground">Guides the agent on what media to request</p>}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="validationInstructions">Validation Instructions (Optional)</Label>
                  <PromptGuidance promptKey="validationInstructions" />
                </div>
                <Textarea id="validationInstructions" value={(editedItem.validationInstructions as string) || ""} onChange={(e) => updateField("validationInstructions", e.target.value)} placeholder="Instructions for validating submitted media" rows={3} readOnly={readOnly} />
              </div>
              <div className="space-y-2">
                <Label>Reference Media Items (Optional)</Label>
                <p className="text-xs text-muted-foreground mb-2">Upload example media files to show users what format/type is expected</p>
                {((editedItem.referenceMediaItems as MediaItem[]) || []).map((mediaItem, index) => (
                  <div key={mediaItem.id} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                    <FileIcon className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm flex-1 truncate">{mediaItem.name}</span>
                    <span className="text-xs text-muted-foreground">{mediaItem.sizeMB.toFixed(2)} MB</span>
                    {!readOnly && (
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeMediaItem("referenceMediaItems", index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {editedItem.type === CONVERSATION_ITEM_TYPE_REVIEW_MATERIAL && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Agent Instructions</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="reviewPrompt">Review Prompt <span className="text-destructive">*</span></Label>
                  <PromptGuidance promptKey="reviewPrompt" />
                </div>
                <Textarea id="reviewPrompt" value={(editedItem.reviewPrompt as string) || ""} onChange={(e) => updateField("reviewPrompt", e.target.value)} placeholder="Instructions for reviewing the material" rows={3} readOnly={readOnly} className={hasFieldError("reviewPrompt") ? "border-destructive" : ""} />
                {hasFieldError("reviewPrompt") ? <p className="text-xs text-destructive">Review prompt is required</p> : <p className="text-xs text-muted-foreground">Guides the agent on how to present and discuss the review material</p>}
              </div>
              <div className="space-y-2">
                <Label>Material to Review <span className="text-destructive">*</span></Label>
                {editedItem.material && typeof editedItem.material === "object" ? (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                    <FileIcon className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm flex-1 truncate">{(editedItem.material as MediaItem).name}</span>
                    <span className="text-xs text-muted-foreground">{(editedItem.material as MediaItem).sizeMB.toFixed(2)} MB</span>
                    {(editedItem.material as MediaItem).id && (
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="View in new tab">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    {!readOnly && (
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeMediaItem("material")}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ) : null}
                {!editedItem.material && !readOnly && (
                  <Button type="button" variant="outline" size="sm" className={`w-full ${hasFieldError("material") ? "border-destructive" : ""}`} disabled>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Review Material
                  </Button>
                )}
                {hasFieldError("material") && <p className="text-xs text-destructive">Material file is required</p>}
              </div>
            </div>
          )}

          {editedItem.type === CONVERSATION_ITEM_TYPE_CUSTOMER_SUPPORT && (
            <>
              <div className="space-y-4 pb-4 border-b">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Display Fields</h3>
                <div className="space-y-2">
                  <Label htmlFor="issue">Issue <span className="text-destructive">*</span></Label>
                  <Textarea id="issue" value={(editedItem.issue as string) || ""} onChange={(e) => updateField("issue", e.target.value)} placeholder="Brief description of the issue" rows={2} readOnly={readOnly} className={hasFieldError("issue") ? "border-destructive" : ""} />
                  {hasFieldError("issue") && <p className="text-xs text-destructive">Issue description is required</p>}
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Agent Instructions</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="issuePrompt">Issue Prompt <span className="text-destructive">*</span></Label>
                    <PromptGuidance promptKey="issuePrompt" />
                  </div>
                  <Textarea id="issuePrompt" value={(editedItem.issuePrompt as string) || ""} onChange={(e) => updateField("issuePrompt", e.target.value)} placeholder="Instructions for understanding the issue" rows={3} readOnly={readOnly} className={hasFieldError("issuePrompt") ? "border-destructive" : ""} />
                  {hasFieldError("issuePrompt") ? <p className="text-xs text-destructive">Issue prompt is required</p> : <p className="text-xs text-muted-foreground">Guides the agent on how to gather information about the issue</p>}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="resolutionPrompt">Resolution Prompt <span className="text-destructive">*</span></Label>
                    <PromptGuidance promptKey="resolutionPrompt" />
                  </div>
                  <Textarea id="resolutionPrompt" value={(editedItem.resolutionPrompt as string) || ""} onChange={(e) => updateField("resolutionPrompt", e.target.value)} placeholder="Instructions for resolving the issue" rows={3} readOnly={readOnly} className={hasFieldError("resolutionPrompt") ? "border-destructive" : ""} />
                  {hasFieldError("resolutionPrompt") ? <p className="text-xs text-destructive">Resolution prompt is required</p> : <p className="text-xs text-muted-foreground">Guides the agent on how to resolve the issue</p>}
                </div>
              </div>
            </>
          )}

          {editedItem.type === CONVERSATION_ITEM_TYPE_FORM_DATA && (
            <>
              <div className="space-y-4 pb-4 border-b">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Display Fields</h3>
                <div className="space-y-2">
                  <Label htmlFor="formTitle">Form Title <span className="text-destructive">*</span></Label>
                  <Input id="formTitle" value={(editedItem.formTitle as string) || ""} onChange={(e) => updateField("formTitle", e.target.value)} placeholder="Title of the form" readOnly={readOnly} className={hasFieldError("formTitle") ? "border-destructive" : ""} />
                  {hasFieldError("formTitle") && <p className="text-xs text-destructive">Form title is required</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="formDescription">Form Description</Label>
                  <Textarea id="formDescription" value={(editedItem.formDescription as string) || ""} onChange={(e) => updateField("formDescription", e.target.value)} placeholder="Brief description of the form's purpose" rows={2} readOnly={readOnly} />
                </div>
              </div>
              <div className="space-y-4 pb-4 border-b">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Agent Instructions</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="instructions">Instructions <span className="text-destructive">*</span></Label>
                    <PromptGuidance promptKey="instructions" />
                  </div>
                  <Textarea id="instructions" value={(editedItem.instructions as string) || ""} onChange={(e) => updateField("instructions", e.target.value)} placeholder="Instructions for helping users complete the form" rows={3} readOnly={readOnly} className={hasFieldError("instructions") ? "border-destructive" : ""} />
                  {hasFieldError("instructions") ? <p className="text-xs text-destructive">Instructions are required</p> : <p className="text-xs text-muted-foreground">Guides the agent on how to assist users filling the form</p>}
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Form Fields</h3>
                    <p className="text-xs text-muted-foreground mt-1">Define the fields collected in this form</p>
                  </div>
                  {!readOnly && (
                    <Button type="button" size="sm" onClick={addFormField}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Field
                    </Button>
                  )}
                </div>
                {((editedItem.fields as FormField[]) || []).map((field, fieldIndex) => (
                  <Card key={fieldIndex} className="p-4 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <h4 className="text-sm font-medium">Field {fieldIndex + 1}</h4>
                      {!readOnly && (
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeFormField(fieldIndex)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Field Name (Internal) <span className="text-destructive">*</span></Label>
                        <Input value={field.fieldName} onChange={(e) => updateFormField(fieldIndex, { fieldName: e.target.value })} placeholder="fieldName" readOnly={readOnly} className={showErrors && !field.fieldName?.trim() ? "border-destructive" : ""} />
                      </div>
                      <div className="space-y-2">
                        <Label>Field Label (Displayed) <span className="text-destructive">*</span></Label>
                        <Input value={field.fieldLabel} onChange={(e) => updateFormField(fieldIndex, { fieldLabel: e.target.value })} placeholder="Field Label" readOnly={readOnly} className={showErrors && !field.fieldLabel?.trim() ? "border-destructive" : ""} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Label>Field Description <span className="text-destructive">*</span></Label>
                        <PromptGuidance promptKey="fieldDescription" />
                      </div>
                      <Textarea value={field.fieldDescription} onChange={(e) => updateFormField(fieldIndex, { fieldDescription: e.target.value })} placeholder="Instructions for collecting this information" rows={2} readOnly={readOnly} className={showErrors && !field.fieldDescription?.trim() ? "border-destructive" : ""} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Field Type</Label>
                        <Select value={field.fieldType} onValueChange={(value: FormField["fieldType"]) => updateFormField(fieldIndex, { fieldType: value })} disabled={readOnly}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {fieldTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between space-x-2">
                        <Label>Required Field</Label>
                        <Switch checked={field.required} onCheckedChange={(checked) => updateFormField(fieldIndex, { required: checked })} disabled={readOnly} />
                      </div>
                    </div>
                    {field.fieldType === FORM_FIELD_TYPE_STRING_ARRAY && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Options <span className="text-destructive">*</span></Label>
                          {!readOnly && (
                            <Button type="button" variant="outline" size="sm" onClick={() => addOption(fieldIndex)}>
                              <Plus className="h-3 w-3 mr-1" />Add Option
                            </Button>
                          )}
                        </div>
                        {field.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center gap-2">
                            <Input value={option} onChange={(e) => updateOption(fieldIndex, optionIndex, e.target.value)} placeholder={`Option ${optionIndex + 1}`} readOnly={readOnly} />
                            {!readOnly && (
                              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeOption(fieldIndex, optionIndex)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
                {(!editedItem.fields || (editedItem.fields as FormField[]).length === 0) && (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    <p className="text-sm">No fields added yet</p>
                    <p className="text-xs mt-1">{readOnly ? "No form fields defined." : "Click \"Add Field\" to create your first form field"}</p>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            {readOnly ? (
              <Button variant="outline" onClick={onCancel}>Close</Button>
            ) : (
              <>
                <Button variant="outline" onClick={onCancel}>Cancel</Button>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
