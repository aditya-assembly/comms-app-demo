import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { MultiSelect } from "@/components/ui/multi-select";
import { Loader2, Plus, X, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { commsAPI } from "@/services/comms-api";
import { MediaUpload, AttachedFiles } from "@/components/shared";
import { formatFieldName, getInputTypeIcon, getInputTypeTooltip, getAcceptedMimeTypes } from "./console-utils";
import { INPUT_DATA_TYPES } from "@/config/orchestration-constants";
import { DataViewAttributeInput } from "./dataviews";
import { EntityAttributeInput } from "./entity-attribute-input";
import { ReferenceTemplateFiles } from "./reference-template-files";
import type { EventSessionManager } from "@/lib/event-session-manager";
import type { TriggerInputValue, MediaFile, TriggerInputItem, WorkflowTriggerItem } from "@/types/orchestration-dashboard-types";
import type { TriggerFormData } from "@/hooks/use-trigger-form";

// ── Props ──────────────────────────────────────────────────────────────────────

interface ActionInputFieldProps {
  input: TriggerInputItem;
  isRequired: boolean;
  value: TriggerInputValue;
  onChange: (key: string, value: TriggerInputValue) => void;
  isFieldEmpty: (value: TriggerInputValue, type: string) => boolean;
  isExecuting: boolean;
  assemblyId: string;
  workflowId: string;
  eventManager: EventSessionManager | null;
  action: WorkflowTriggerItem;
  templateMediaUrls: Record<string, string>;
  loadingTemplateIds: Set<string>;
  deletingMediaIds: Set<string>;
  setDeletingMediaIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  onRemoveFile: (inputKey: string, mediaId: string) => void;
  onUpdateField: (field: keyof TriggerFormData, value: TriggerFormData[keyof TriggerFormData] | ((prev: TriggerFormData[keyof TriggerFormData]) => TriggerFormData[keyof TriggerFormData])) => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function ActionInputField({
  input,
  isRequired,
  value,
  onChange,
  isFieldEmpty,
  isExecuting,
  assemblyId,
  workflowId,
  eventManager,
  action,
  templateMediaUrls,
  loadingTemplateIds,
  deletingMediaIds,
  setDeletingMediaIds,
  onRemoveFile,
  onUpdateField,
}: ActionInputFieldProps) {
  const { name: key, type, description, fileTypes, templateMedia } = input;
  const inputKey = `input-${key}`;

  return (
    <motion.div
      key={inputKey}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="group space-y-2 p-3 rounded-xl border border-border-light bg-surface-elevated hover:border-primary/50 transition-colors duration-200"
    >
      {/* Field header: icon + label + required indicator + description */}
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2.5">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="p-1.5 rounded-md bg-primary-bg border border-border-light group-hover:scale-110 transition-transform duration-200 cursor-help">
                    {getInputTypeIcon(type)}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  <p>{getInputTypeTooltip(type)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Label htmlFor={key} className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors duration-200">
                  {key}
                </Label>
                {isRequired && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.2 }} className="relative">
                    <motion.div
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="w-2 h-2 rounded-full bg-destructive shadow-lg shadow-destructive/50"
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="absolute inset-0 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p className="text-xs font-medium">This field is required</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
          {description && (
            <div className="pl-8">
              <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
            </div>
          )}
        </div>
      </div>

      {/* DataView Input */}
      {type === INPUT_DATA_TYPES.DATAVIEW && (
        <DataViewAttributeInput
          input={input}
          key={key}
          value={value as string | string[]}
          onChange={(val) => onChange(key, val)}
          isRequired={isRequired}
          error={isRequired && isFieldEmpty(value, type)}
          assemblyId={assemblyId}
          workflowId={workflowId}
          disabled={isExecuting}
          eventManager={eventManager ?? undefined}
        />
      )}

      {/* Boolean Input */}
        {type === INPUT_DATA_TYPES.BOOLEAN && (
          <BooleanField value={value} onChange={(v) => onChange(key, v)} isRequired={isRequired} isFieldEmpty={isFieldEmpty} type={type} />
        )}

        {/* Entity Input */}
        {type === INPUT_DATA_TYPES.ENTITY && (
          <EntityAttributeInput
            input={input}
            key={key}
            value={value as string | string[]}
            onChange={(val) => onChange(key, val)}
            isRequired={isRequired}
            error={isRequired && isFieldEmpty(value, type)}
            assemblyId={assemblyId}
            workflowId={workflowId}
            disabled={isExecuting}
            eventManager={eventManager ?? undefined}
          />
        )}

        {/* Array Input */}
        {type === INPUT_DATA_TYPES.ARRAY && (
          <ArrayField input={input} value={value} onChange={(v) => onChange(key, v)} isRequired={isRequired} isFieldEmpty={isFieldEmpty} type={type} description={description} />
        )}

        {/* Text/String Input */}
        {(type === INPUT_DATA_TYPES.TEXT || type === INPUT_DATA_TYPES.STRING) && (
          <Textarea
            id={key}
            value={value as string}
            onChange={(e) => onChange(key, e.target.value)}
            placeholder={`Enter ${formatFieldName(key).toLowerCase()}...`}
            className={`min-h-[100px] text-sm font-medium bg-surface border-2 focus:ring-0 rounded-xl transition-all duration-200 resize-none px-4 py-3 ${
              isRequired && isFieldEmpty(value, type)
                ? "border-error focus:ring-0 focus:border-error"
                : "border-border-light focus:ring-0 focus:border-primary hover:border-primary"
            }`}
          />
        )}

        {/* JSON Object Input */}
        {type === INPUT_DATA_TYPES.OBJECT && (
          <ObjectField inputKey={key} value={value} onChange={(v) => onChange(key, v)} isRequired={isRequired} isFieldEmpty={isFieldEmpty} type={type} />
        )}

        {/* Number Input */}
        {type === INPUT_DATA_TYPES.NUMBER && (
          <NumberField inputKey={key} value={value} onChange={(v) => onChange(key, v)} isRequired={isRequired} isFieldEmpty={isFieldEmpty} type={type} />
        )}

        {/* Date Input */}
        {type === INPUT_DATA_TYPES.DATE && (
          <DatePicker
            value={value as string | number | null}
            onChange={(v) => onChange(key, v)}
            placeholder={`Select ${formatFieldName(key).toLowerCase()}...`}
            disabled={isExecuting}
            className={`w-full ${
              isRequired && isFieldEmpty(value, type)
                ? "border-error"
                : ""
            }`}
          />
        )}

        {/* File Upload Input */}
        {(type === INPUT_DATA_TYPES.FILE_OBJECT || type === INPUT_DATA_TYPES.FILE || type === INPUT_DATA_TYPES.MEDIA_JSON) && (
          <FileField
            inputKey={key}
            type={type}
            value={value}
            onChange={(v) => onChange(key, v)}
            fileTypes={fileTypes}
            templateMedia={templateMedia}
            templateMediaUrls={templateMediaUrls}
            loadingTemplateIds={loadingTemplateIds}
            deletingMediaIds={deletingMediaIds}
            setDeletingMediaIds={setDeletingMediaIds}
            onRemoveFile={onRemoveFile}
            onUpdateField={onUpdateField}
            action={action}
          />
        )}

    </motion.div>
  );
}

// ── Sub-components for complex field types ──────────────────────────────────────

interface BooleanFieldProps {
  value: TriggerInputValue;
  onChange: (value: boolean) => void;
  isRequired: boolean;
  isFieldEmpty: (value: TriggerInputValue, type: string) => boolean;
  type: string;
}

function BooleanField({ value, onChange, isRequired, isFieldEmpty, type }: BooleanFieldProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-300 ${
        value === true
          ? "bg-success-bg border-success dark:border-success/60"
          : "bg-surface-elevated border-border-light hover:border-border"
      } ${isRequired && isFieldEmpty(value, type) ? "border-error" : ""}`}
    >
      <div className="flex items-center gap-3">
        <motion.div
          animate={{ scale: value === true ? 1.1 : 1 }}
          className={`w-4 h-4 rounded-full transition-all duration-300 ${
            value === true ? "bg-success shadow-lg shadow-success/30" : "bg-muted-foreground/50"
          }`}
        />
        <span className="text-sm font-semibold text-foreground">{value === true ? "Enabled" : "Disabled"}</span>
      </div>
      <Switch checked={value === true} onCheckedChange={onChange} className="data-[state=checked]:bg-success" />
    </motion.div>
  );
}

interface ArrayFieldProps {
  input: TriggerInputItem;
  value: TriggerInputValue;
  onChange: (value: TriggerInputValue) => void;
  isRequired: boolean;
  isFieldEmpty: (value: TriggerInputValue, type: string) => boolean;
  type: string;
  description: string | null;
}

function ArrayField({ input, value, onChange, isRequired, isFieldEmpty, type, description }: ArrayFieldProps) {
  if (input.allowedOptions && input.allowedOptions.length > 0) {
    return (
      <div
        className={`bg-surface border-2 rounded-xl p-4 transition-all duration-200 ${
          isRequired && isFieldEmpty(value, type) ? "border-error" : "border-border-light hover:border-primary"
        }`}
      >
        <MultiSelect
          options={input.allowedOptions.map((opt) => ({ value: opt, label: opt }))}
          value={Array.isArray(value) ? (value as string[]) : []}
          onValueChange={(newValue) => onChange(newValue)}
          placeholder="Select one or more options..."
          searchable={true}
          searchPlaceholder="Search options..."
          showSelectAll={true}
          className="w-full"
        />
        {description && <p className="text-xs text-muted-foreground mt-2">{description}</p>}
      </div>
    );
  }

  return (
    <div
      className={`bg-surface border-2 rounded-xl p-4 transition-all duration-200 ${
        isRequired && isFieldEmpty(value, type) ? "border-error" : "border-border-light hover:border-primary"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">Items</span>
          <Badge variant="secondary" className="text-xs px-2 py-0.5">
            {((value as string[]) || []).length}
          </Badge>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...((value as string[]) || []), ""])} className="h-8 gap-1.5 text-xs font-semibold">
          <Plus className="h-3 w-3" />
          Add Item
        </Button>
      </div>

      <div className="space-y-2 max-h-[200px] overflow-y-auto scrollbar-thin pr-2">
        {((value as string[]) || []).map((item, index) => (
          <motion.div key={index} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground w-8">{index + 1}.</span>
            <Input
              value={item}
              onChange={(e) => {
                const newArray = [...(value as string[])];
                newArray[index] = e.target.value;
                onChange(newArray);
              }}
              placeholder={`Enter item ${index + 1}`}
              className="flex-1 h-9 text-sm bg-background/50"
            />
            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onChange((value as string[]).filter((_, i) => i !== index))}
              className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
            >
              <X className="h-4 w-4" />
            </motion.button>
          </motion.div>
        ))}

        {(!value || (value as string[]).length === 0) && (
          <div className="text-center py-6 text-muted-foreground">
            <div className="text-xs">No items added yet</div>
          </div>
        )}
      </div>
    </div>
  );
}

interface ObjectFieldProps {
  inputKey: string;
  value: TriggerInputValue;
  onChange: (value: TriggerInputValue) => void;
  isRequired: boolean;
  isFieldEmpty: (value: TriggerInputValue, type: string) => boolean;
  type: string;
}

function ObjectField({ inputKey, value, onChange, isRequired, isFieldEmpty, type }: ObjectFieldProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Enter valid JSON format</span>
        <motion.div
          animate={{
            backgroundColor: value && typeof value === "object" ? "rgb(34 197 94)" : "rgb(239 68 68)",
          }}
          className="w-2 h-2 rounded-full"
        />
      </div>
      <Textarea
        id={inputKey}
        value={typeof value === "object" ? JSON.stringify(value, null, 2) : (value as string) || ""}
        onChange={(e) => {
          try {
            const parsed = JSON.parse(e.target.value);
            onChange(parsed);
          } catch {
            onChange(e.target.value);
          }
        }}
        placeholder='{\n  "key": "value"\n}'
        className={`min-h-[120px] font-mono text-sm bg-surface border-2 focus:ring-0 rounded-xl transition-all duration-200 resize-none px-4 py-3 ${
          isRequired && isFieldEmpty(value, type)
            ? "border-error focus:ring-0 focus:border-error"
            : "border-border-light focus:ring-0 focus:border-primary hover:border-primary"
        }`}
      />
    </div>
  );
}

interface NumberFieldProps {
  inputKey: string;
  value: TriggerInputValue;
  onChange: (value: string) => void;
  isRequired: boolean;
  isFieldEmpty: (value: TriggerInputValue, type: string) => boolean;
  type: string;
}

function NumberField({ inputKey, value, onChange, isRequired, isFieldEmpty, type }: NumberFieldProps) {
  return (
    <div className="flex items-center gap-3">
      <Input
        id={inputKey}
        type="number"
        value={value as string}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        className={`flex-1 h-11 text-sm font-medium bg-surface border-2 focus:ring-0 rounded-xl transition-all duration-200 px-4 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
          isRequired && isFieldEmpty(value, type)
            ? "border-error focus:ring-0 focus:border-error"
            : "border-border-light focus:ring-0 focus:border-primary hover:border-primary"
        }`}
      />
      <div className="flex gap-2">
        <motion.button
          type="button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            const currentVal = parseFloat(value as string) || 0;
            onChange(String(currentVal - 1));
          }}
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-surface-elevated border-2 border-border-light hover:bg-surface-highlight hover:border-primary/50 text-text-primary transition-all duration-200"
        >
          <Minus className="h-4 w-4" />
        </motion.button>
        <motion.button
          type="button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            const currentVal = parseFloat(value as string) || 0;
            onChange(String(currentVal + 1));
          }}
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-surface-elevated border-2 border-border-light hover:bg-surface-highlight hover:border-primary/50 text-text-primary transition-all duration-200"
        >
          <Plus className="h-4 w-4" />
        </motion.button>
      </div>
    </div>
  );
}

interface FileFieldProps {
  inputKey: string;
  type: string;
  value: TriggerInputValue;
  onChange: (value: TriggerInputValue) => void;
  fileTypes?: string[];
  templateMedia?: TriggerInputItem["templateMedia"];
  templateMediaUrls: Record<string, string>;
  loadingTemplateIds: Set<string>;
  deletingMediaIds: Set<string>;
  setDeletingMediaIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  onRemoveFile: (inputKey: string, mediaId: string) => void;
  onUpdateField: (field: keyof TriggerFormData, value: TriggerFormData[keyof TriggerFormData] | ((prev: TriggerFormData[keyof TriggerFormData]) => TriggerFormData[keyof TriggerFormData])) => void;
  action: WorkflowTriggerItem;
}

function FileField({
  inputKey,
  type,
  value,
  onChange,
  fileTypes,
  templateMedia,
  templateMediaUrls,
  loadingTemplateIds,
  deletingMediaIds,
  setDeletingMediaIds,
  onRemoveFile,
  onUpdateField,
  action,
}: FileFieldProps) {
  return (
    <div className="space-y-3">
      {/* Template media loading/display */}
      {templateMedia && templateMedia.id && (
        <>
          {loadingTemplateIds.has(templateMedia.id) ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl border border-border/40 shadow-sm overflow-hidden bg-card/50"
            >
              <div className="p-6">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-bg border border-primary/30 shadow-sm">
                    <Loader2 className="h-4 w-4 text-primary animate-spin" />
                  </div>
                  <div className="text-left">
                    <h5 className="font-semibold text-sm text-foreground">Loading Reference Template</h5>
                    <p className="text-xs text-muted-foreground">Fetching template file...</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            templateMediaUrls[templateMedia.id] && (
              <ReferenceTemplateFiles
                templateMedia={{
                  id: templateMedia.id,
                  name: templateMedia.name || "Template File",
                  sizeMB: templateMedia.sizeMB ?? 0,
                  description: templateMedia.description ?? "",
                  uploadComplete: true,
                  media: templateMediaUrls[templateMedia.id],
                  thumbnail: null,
                  owners: [],
                }}
                triggerId={action.id}
              />
            )
          )}
        </>
      )}

      {/* Attached files */}
      {(type === INPUT_DATA_TYPES.MEDIA_JSON || type === INPUT_DATA_TYPES.FILE_OBJECT || type === INPUT_DATA_TYPES.FILE) && Array.isArray(value) && value.length > 0 && (
        <AttachedFiles
          mediaList={value as MediaFile[]}
          triggerId={action.id}
          title="Attached Files"
          description="Files attached to this input"
          showDelete={true}
          deletingMediaIds={deletingMediaIds}
          onDelete={async (mediaId) => {
            setDeletingMediaIds((prev) => new Set([...prev, mediaId]));
            try {
              await commsAPI.deleteTriggerMedia(action.id, mediaId);
              onRemoveFile(inputKey, mediaId);
            } catch (error) {
              console.error("Failed to delete media:", error);
              toast.error("Failed to delete file");
            } finally {
              setDeletingMediaIds((prev) => {
                const newSet = new Set(prev);
                newSet.delete(mediaId);
                return newSet;
              });
            }
          }}
          defaultExpanded={true}
        />
      )}

      {/* Upload area */}
      {(type === INPUT_DATA_TYPES.MEDIA_JSON || ((type === INPUT_DATA_TYPES.FILE_OBJECT || type === INPUT_DATA_TYPES.FILE) && (!Array.isArray(value) || value.length === 0))) && (
        <MediaUpload
          key={`media-upload-${inputKey}-${action.id}`}
          uploadFunction={(file, onProgress, description, name) => commsAPI.uploadMediaForTrigger(action.id, file, onProgress, description, name)}
          deleteFunction={(mediaId) => commsAPI.deleteTriggerMedia(action.id, mediaId)}
          onFilesUploaded={(files: MediaFile[]) => {
            if (files.length > 0) {
              if (type === INPUT_DATA_TYPES.MEDIA_JSON) {
                onUpdateField("inputs", (currentInputs: Record<string, TriggerInputValue>) => {
                  const currentFiles = Array.isArray(currentInputs[inputKey]) ? (currentInputs[inputKey] as MediaFile[]) : [];
                  return {
                    ...currentInputs,
                    [inputKey]: [...currentFiles, ...files],
                  };
                });
              } else if (type === INPUT_DATA_TYPES.FILE_OBJECT || type === INPUT_DATA_TYPES.FILE) {
                onChange([files[0]]);
              }
            }
          }}
          onUploadError={(error) => {
            console.error("Media upload error:", error);
          }}
          maxFiles={type === INPUT_DATA_TYPES.MEDIA_JSON ? 10 : 1}
          title={`Upload ${type === INPUT_DATA_TYPES.MEDIA_JSON ? "Files" : "File"}`}
          description={`Select ${type === INPUT_DATA_TYPES.MEDIA_JSON ? "one or more files" : "a file"} to upload`}
          className="mt-2"
          allowedTypes={fileTypes && fileTypes.length > 0 ? getAcceptedMimeTypes(fileTypes) : undefined}
          fileTypeDisplay={fileTypes}
        />
      )}
    </div>
  );
}
