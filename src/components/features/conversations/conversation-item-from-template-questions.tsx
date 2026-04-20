import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea, TEXTAREA_SCROLL_AFTER_10_ROWS } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import type { ConversationItem as ConversationItemDashboard } from "@/types/orchestration-dashboard-types";
import type { ConversationItem as ConversationItemLocal } from "./types";

function coerceInputString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function coerceInputNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && !Number.isNaN(value) ? value : fallback;
}

function coerceSwitchBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

const ITEM_TYPE_LABELS: Record<string, string> = {
  QUESTION: "Question",
  DISCUSSION: "Discussion",
  MEDIA_REQUEST: "Media Request",
  REVIEW_MATERIAL: "Review Material",
  WALK_THROUGH: "Walk Through",
  FORM_DATA: "Form Data",
  CUSTOMER_SUPPORT: "Customer Support",
  SUMMARY: "Summary",
};

export interface ConversationItemFromTemplateQuestionsProps {
  item: ConversationItemDashboard | ConversationItemLocal;
  onChange: (updated: ConversationItemDashboard | ConversationItemLocal) => void;
  allowFullEdit?: boolean;
}

export function ConversationItemFromTemplateQuestions({
  item,
  onChange,
  allowFullEdit = true,
}: ConversationItemFromTemplateQuestionsProps) {
  const update = (partial: Partial<ConversationItemDashboard | ConversationItemLocal>) => {
    onChange({ ...item, ...partial });
  };

  const type = (item.type || "QUESTION") as string;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Title</Label>
        <Input
          value={item.title ?? ""}
          onChange={(e) => update({ title: e.target.value })}
          placeholder="What should this item be called?"
        />
      </div>
      <div className="space-y-2">
        <Label>Description (optional)</Label>
        <Textarea
          value={item.description ?? ""}
          onChange={(e) => update({ description: e.target.value })}
          placeholder="Any description for this item?"
          rows={2}
          className={TEXTAREA_SCROLL_AFTER_10_ROWS}
        />
      </div>

      {type === "DISCUSSION" && (
        <>
          <div className="space-y-2">
            <Label>What is the discussion about?</Label>
            <Textarea value={coerceInputString((item as Record<string, unknown>).discussion)} onChange={(e) => update({ discussion: e.target.value })} placeholder="Topic of the discussion" rows={3} className={TEXTAREA_SCROLL_AFTER_10_ROWS} />
          </div>
          <div className="space-y-2">
            <Label>How should the agent run the discussion?</Label>
            <Textarea value={coerceInputString((item as Record<string, unknown>).discussionPrompt)} onChange={(e) => update({ discussionPrompt: e.target.value })} placeholder="Instructions for the agent" rows={3} className={TEXTAREA_SCROLL_AFTER_10_ROWS} />
          </div>
          <div className="space-y-2">
            <Label>Do you want a summary? If so, what should it capture?</Label>
            <Textarea value={coerceInputString((item as Record<string, unknown>).summaryPrompt)} onChange={(e) => update({ summaryPrompt: e.target.value })} placeholder="Summary instructions" rows={2} className={TEXTAREA_SCROLL_AFTER_10_ROWS} />
          </div>
        </>
      )}

      {type === "MEDIA_REQUEST" && (
        <>
          <div className="space-y-2">
            <Label>What do you want to ask the user to upload?</Label>
            <Textarea value={coerceInputString((item as Record<string, unknown>).mediaRequestPrompt)} onChange={(e) => update({ mediaRequestPrompt: e.target.value })} placeholder="Describe the media request" rows={3} className={TEXTAREA_SCROLL_AFTER_10_ROWS} />
          </div>
          <div className="space-y-2">
            <Label>Allowed media types (e.g. PDF, DOCX)</Label>
            <Input
              value={Array.isArray((item as Record<string, unknown>).allowedMediaTypes) ? ((item as Record<string, unknown>).allowedMediaTypes as string[]).join(", ") : ""}
              onChange={(e) => update({ allowedMediaTypes: e.target.value ? e.target.value.split(",").map((s) => s.trim()).filter(Boolean) : [] })}
              placeholder="PDF, DOCX, XLSX"
            />
          </div>
          <div className="space-y-2">
            <Label>Formatting guidelines</Label>
            <Textarea value={coerceInputString((item as Record<string, unknown>).formattingGuidelines)} onChange={(e) => update({ formattingGuidelines: e.target.value })} placeholder="Any formatting requirements" rows={2} className={TEXTAREA_SCROLL_AFTER_10_ROWS} />
          </div>
          <div className="space-y-2">
            <Label>How should the agent validate the upload?</Label>
            <Textarea value={coerceInputString((item as Record<string, unknown>).validationInstructions)} onChange={(e) => update({ validationInstructions: e.target.value })} placeholder="Validation instructions" rows={2} className={TEXTAREA_SCROLL_AFTER_10_ROWS} />
          </div>
        </>
      )}

      {type === "QUESTION" && (
        <>
          <div className="space-y-2">
            <Label>What is the question?</Label>
            <Textarea value={coerceInputString((item as Record<string, unknown>).question)} onChange={(e) => update({ question: e.target.value })} placeholder="The question to ask" rows={3} className={TEXTAREA_SCROLL_AFTER_10_ROWS} />
          </div>
          <div className="space-y-2">
            <Label>How should the agent ask it?</Label>
            <Textarea value={coerceInputString((item as Record<string, unknown>).questionPrompt)} onChange={(e) => update({ questionPrompt: e.target.value })} placeholder="Instructions for asking" rows={3} className={TEXTAREA_SCROLL_AFTER_10_ROWS} />
          </div>
          <div className="space-y-2">
            <Label>How should the agent structure the answer?</Label>
            <Textarea value={coerceInputString((item as Record<string, unknown>).answerCreationPrompt)} onChange={(e) => update({ answerCreationPrompt: e.target.value })} placeholder="Answer structure instructions" rows={2} className={TEXTAREA_SCROLL_AFTER_10_ROWS} />
          </div>
        </>
      )}

      {type === "REVIEW_MATERIAL" && (
        <>
          <div className="space-y-2">
            <Label>Material to review</Label>
            {(item as Record<string, unknown>).material && typeof (item as Record<string, unknown>).material === "object" ? (
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                <p className="font-medium">
                  Template material: {((item as Record<string, unknown>).material as { name?: string })?.name ?? "File"}
                </p>
                <p className="text-muted-foreground mt-1">
                  Keeping template material. To use a different file, edit the conversation after creation.
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No material in template. Add material after creating the conversation.</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>How should the agent present and discuss it?</Label>
            <Textarea value={coerceInputString((item as Record<string, unknown>).reviewPrompt)} onChange={(e) => update({ reviewPrompt: e.target.value })} placeholder="Presentation instructions" rows={3} className={TEXTAREA_SCROLL_AFTER_10_ROWS} />
          </div>
          <div className="space-y-2">
            <Label>How should the agent summarize the review?</Label>
            <Textarea value={coerceInputString((item as Record<string, unknown>).reviewResultsPrompt)} onChange={(e) => update({ reviewResultsPrompt: e.target.value })} placeholder="Summary instructions" rows={2} className={TEXTAREA_SCROLL_AFTER_10_ROWS} />
          </div>
        </>
      )}

      {type === "WALK_THROUGH" && (
        <>
          <div className="space-y-2">
            <Label>What should the walk-through cover?</Label>
            <Textarea value={coerceInputString((item as Record<string, unknown>).walkThroughPrompt)} onChange={(e) => update({ walkThroughPrompt: e.target.value })} placeholder="Walk-through content" rows={3} className={TEXTAREA_SCROLL_AFTER_10_ROWS} />
          </div>
          <div className="space-y-2">
            <Label>Max number of follow-up questions</Label>
            <Input type="number" min={0} value={coerceInputNumber((item as Record<string, unknown>).maxNumFollowUps, 5)} onChange={(e) => update({ maxNumFollowUps: parseInt(e.target.value, 10) || 0 })} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Enable screen share for this step</Label>
            <Switch checked={coerceSwitchBoolean((item as Record<string, unknown>).enableScreenShare)} onCheckedChange={(v) => update({ enableScreenShare: v })} />
          </div>
        </>
      )}

      {type === "CUSTOMER_SUPPORT" && (
        <>
          <div className="space-y-2">
            <Label>What issue category does this cover?</Label>
            <Input value={coerceInputString((item as Record<string, unknown>).issue)} onChange={(e) => update({ issue: e.target.value })} placeholder="Issue category" />
          </div>
          <div className="space-y-2">
            <Label>How should the agent understand the issue?</Label>
            <Textarea value={coerceInputString((item as Record<string, unknown>).issuePrompt)} onChange={(e) => update({ issuePrompt: e.target.value })} placeholder="Understanding instructions" rows={3} className={TEXTAREA_SCROLL_AFTER_10_ROWS} />
          </div>
          <div className="space-y-2">
            <Label>How should the agent resolve it?</Label>
            <Textarea value={coerceInputString((item as Record<string, unknown>).resolutionPrompt)} onChange={(e) => update({ resolutionPrompt: e.target.value })} placeholder="Resolution instructions" rows={3} className={TEXTAREA_SCROLL_AFTER_10_ROWS} />
          </div>
        </>
      )}

      {type === "FORM_DATA" && (
        <>
          <div className="space-y-2">
            <Label>Form title</Label>
            <Input value={coerceInputString((item as Record<string, unknown>).formTitle)} onChange={(e) => update({ formTitle: e.target.value })} placeholder="Form title" />
          </div>
          <div className="space-y-2">
            <Label>Form description</Label>
            <Textarea value={coerceInputString((item as Record<string, unknown>).formDescription)} onChange={(e) => update({ formDescription: e.target.value })} placeholder="Form description" rows={2} className={TEXTAREA_SCROLL_AFTER_10_ROWS} />
          </div>
          <div className="space-y-2">
            <Label>Instructions for the agent</Label>
            <Textarea value={coerceInputString((item as Record<string, unknown>).instructions)} onChange={(e) => update({ instructions: e.target.value })} placeholder="How the agent should help users complete the form" rows={3} className={TEXTAREA_SCROLL_AFTER_10_ROWS} />
          </div>
          {allowFullEdit && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4">
              <p className="text-sm text-muted-foreground">
                To add or edit form fields, use the Full editor button above.
              </p>
            </div>
          )}
        </>
      )}

      {type === "SUMMARY" && (
        <div className="space-y-2">
          <Label>Summary fields</Label>
          <p className="text-xs text-muted-foreground">
            Fields the agent will extract from the conversation. Each field has a name and description.
          </p>
          {(((item as Record<string, unknown>).summaryFields as { name?: string; description?: string }[]) ?? []).map((f, idx) => (
            <div key={idx} className="flex gap-2 items-start">
              <Input
                value={coerceInputString(f.name)}
                onChange={(e) => {
                  const fields = [...(((item as Record<string, unknown>).summaryFields as object[]) ?? [])];
                  (fields[idx] as Record<string, unknown>).name = e.target.value;
                  update({ summaryFields: fields });
                }}
                placeholder="Field name"
                className="flex-1"
              />
              <Input
                value={coerceInputString((f as Record<string, unknown>).description)}
                onChange={(e) => {
                  const fields = [...(((item as Record<string, unknown>).summaryFields as object[]) ?? [])];
                  (fields[idx] as Record<string, unknown>).description = e.target.value;
                  update({ summaryFields: fields });
                }}
                placeholder="Description"
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive shrink-0"
                onClick={() => {
                  const fields = (((item as Record<string, unknown>).summaryFields as object[]) ?? []).filter((_, i) => i !== idx);
                  update({ summaryFields: fields });
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const fields = [...(((item as Record<string, unknown>).summaryFields as object[]) ?? [])];
              fields.push({ name: "", description: "" });
              update({ summaryFields: fields });
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add field
          </Button>
        </div>
      )}
    </div>
  );
}

export { ITEM_TYPE_LABELS };
