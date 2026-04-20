import { useState, useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { commsAPI } from "@/services/comms-api";
import { EventSessionManager } from "@/lib/event-session-manager";
import type { WorkflowTriggerItem, TriggerInputValue, MediaFile, TriggerExecutionResponse, TriggerInputItem } from "@/types/api";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface TriggerFormData extends Record<string, unknown> {
  inputs: Record<string, TriggerInputValue>;
}

export interface UseTriggerFormOptions {
  trigger: WorkflowTriggerItem | null;
  assemblyId: string;
  workflowId: string;
  /** Controls EventSessionManager creation. In the modal this maps to `isOpen`, for inline forms it is always `true`. */
  active: boolean;
}

export interface UseTriggerFormReturn {
  // Form state
  formData: TriggerFormData;
  isLoaded: boolean;
  isExecuting: boolean;
  isFormValid: boolean;
  hasUnsavedChanges: () => boolean;

  // Input handling
  handleInputChange: (key: string, value: TriggerInputValue) => void;
  updateField: (field: keyof TriggerFormData, value: TriggerFormData[keyof TriggerFormData] | ((prev: TriggerFormData[keyof TriggerFormData]) => TriggerFormData[keyof TriggerFormData])) => void;
  removeFileFromInput: (inputKey: string, mediaId: string) => void;
  isFieldEmpty: (value: TriggerInputValue, type: string) => boolean;

  // Form actions
  handleExecute: (onSuccess?: (response: TriggerExecutionResponse) => void, onClose?: () => void) => Promise<void>;
  resetForm: () => void;

  // Media state
  templateMediaUrls: Record<string, string>;
  loadingTemplateIds: Set<string>;
  deletingMediaIds: Set<string>;
  setDeletingMediaIds: React.Dispatch<React.SetStateAction<Set<string>>>;

  // Event manager
  eventManager: EventSessionManager | null;

  // Parsed inputs
  requiredInputs: TriggerInputItem[];
  optionalInputs: TriggerInputItem[];
  hasRequiredInputs: boolean;
  hasOptionalInputs: boolean;
}

// ── Field emptiness check (shared between validation and rendering) ────────────

export function isFieldEmpty(value: TriggerInputValue, type: string): boolean {
  if (value === undefined || value === null || value === "") {
    return true;
  }

  if (type === "ENTITY" || type === "DATAVIEW") {
    if (typeof value === "string" && value.trim() === "") return true;
    if (Array.isArray(value) && value.length === 0) return true;
    if (typeof value !== "string" && !Array.isArray(value)) return true;
  }

  if (type === "ARRAY" && Array.isArray(value) && value.length === 0) {
    return true;
  }

  if ((type === "MEDIA_JSON" || type === "FILE_OBJECT" || type === "FILE") && (!value || (Array.isArray(value) && value.length === 0))) {
    return true;
  }

  if (type === "OBJECT" && (!value || (typeof value === "object" && Object.keys(value as Record<string, unknown>).length === 0))) {
    return true;
  }

  return false;
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useTriggerForm({ trigger, assemblyId, workflowId, active }: UseTriggerFormOptions): UseTriggerFormReturn {
  const [isExecuting, setIsExecuting] = useState(false);
  const [deletingMediaIds, setDeletingMediaIds] = useState<Set<string>>(new Set());
  const [templateMediaUrls, setTemplateMediaUrls] = useState<Record<string, string>>({});
  const [loadingTemplateIds, setLoadingTemplateIds] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState<TriggerFormData>({ inputs: {} });

  const eventManager = useMemo(() => {
    if (!active || !trigger) return null;
    return new EventSessionManager();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, trigger?.id]);

  const updateField = useCallback((field: keyof TriggerFormData, value: TriggerFormData[keyof TriggerFormData] | ((prev: TriggerFormData[keyof TriggerFormData]) => TriggerFormData[keyof TriggerFormData])) => {
    setFormData((prev) => ({
      ...prev,
      [field]: typeof value === "function" ? (value as (prev: TriggerFormData[keyof TriggerFormData]) => TriggerFormData[keyof TriggerFormData])(prev[field]) : value,
    }));
  }, []);

  const resetForm = useCallback(() => setFormData({ inputs: {} }), []);

  const hasUnsavedChanges = useCallback(() => Object.keys(formData.inputs).length > 0, [formData.inputs]);

  const isLoaded = true;

  // ── Derived input lists ──────────────────────────────────────────────────────

  const requiredInputs = useMemo(() => trigger?.requiredInputsList || [], [trigger?.requiredInputsList]);
  const optionalInputs = useMemo(() => trigger?.optionalInputsList || [], [trigger?.optionalInputsList]);
  const hasRequiredInputs = requiredInputs.length > 0;
  const hasOptionalInputs = optionalInputs.length > 0;

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const handleInputChange = useCallback(
    (key: string, value: TriggerInputValue) => {
      updateField("inputs", (currentInputs: Record<string, TriggerInputValue>) => ({
        ...currentInputs,
        [key]: value,
      }));
    },
    [updateField]
  );

  const removeFileFromInput = useCallback(
    (inputKey: string, mediaId: string) => {
      updateField("inputs", (currentInputs: Record<string, TriggerInputValue>) => ({
        ...currentInputs,
        [inputKey]: ((currentInputs[inputKey] as MediaFile[]) || []).filter((file: MediaFile) => file.id !== mediaId),
      }));
    },
    [updateField]
  );

  // ── Template media fetching ──────────────────────────────────────────────────

  useEffect(() => {
    if (!active || !trigger) return;

    const fetchTemplateMediaUrls = async () => {
      const allInputs = [...(trigger.requiredInputsList || []), ...(trigger.optionalInputsList || [])];
      const inputsWithTemplates = allInputs.filter((input) => input.templateMedia?.id);

      for (const input of inputsWithTemplates) {
        const templateId = input.templateMedia!.id;
        if (templateMediaUrls[templateId] || loadingTemplateIds.has(templateId)) continue;

        setLoadingTemplateIds((prev) => new Set([...prev, templateId]));
        try {
          const url = await commsAPI.getMediaForTrigger(trigger.id, templateId);
          setTemplateMediaUrls((prev) => ({ ...prev, [templateId]: url }));
        } catch (error) {
          console.error(`Failed to fetch template media for ${templateId}:`, error);
        } finally {
          setLoadingTemplateIds((prev) => {
            const newSet = new Set(prev);
            newSet.delete(templateId);
            return newSet;
          });
        }
      }
    };

    fetchTemplateMediaUrls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, trigger]);

  // ── Validation ───────────────────────────────────────────────────────────────

  const validateRequiredFields = useCallback(() => {
    if (!hasRequiredInputs) return true;

    const missingFields = requiredInputs.filter((input) => {
      return isFieldEmpty(formData.inputs[input.name], input.type);
    });

    return missingFields.length === 0;
  }, [hasRequiredInputs, requiredInputs, formData.inputs]);

  const isFormValid = validateRequiredFields();

  // ── Execution ────────────────────────────────────────────────────────────────

  const handleExecute = useCallback(
    async (onSuccess?: (response: TriggerExecutionResponse) => void, onClose?: () => void) => {
      if (!trigger) return;

      setIsExecuting(true);
      try {
        const allInputAttributes = [...requiredInputs, ...optionalInputs];
        const inputNames = new Set(allInputAttributes.map((attr) => attr.name));

        // Filter to only include inputs defined in the trigger
        const processedInputs: Record<string, TriggerInputValue> = {};
        Object.keys(formData.inputs).forEach((key) => {
          if (inputNames.has(key)) {
            processedInputs[key] = formData.inputs[key];
          }
        });

        // Validate input values before execution
        const requiredInputNames = new Set(requiredInputs.map((attr) => attr.name));

        for (const attribute of allInputAttributes) {
          if (attribute.type === "ARRAY" && attribute.allowedOptions && attribute.allowedOptions.length > 0) {
            const value = processedInputs[attribute.name];
            if (value !== undefined && Array.isArray(value)) {
              const invalidValues = (value as string[]).filter((v) => !attribute.allowedOptions!.includes(v));
              if (invalidValues.length > 0) {
                toast.error(`Invalid values for ${attribute.name}: ${invalidValues.join(", ")}. Allowed values: ${attribute.allowedOptions.join(", ")}`);
                setIsExecuting(false);
                return;
              }
            }
          }

          if (attribute.type === "ENTITY") {
            const value = processedInputs[attribute.name];
            if (value !== undefined) {
              const isRequired = requiredInputNames.has(attribute.name);

              // Empty-value checks only apply to required fields — optional entity fields
              // can legitimately be empty (e.g. user selected then deselected all values)
              if (isRequired) {
                if (typeof value === "string" && value.trim() === "") {
                  toast.error(`Invalid entity value for ${attribute.name}. Please select a valid entity.`);
                  setIsExecuting(false);
                  return;
                }
                if (Array.isArray(value) && value.length === 0) {
                  toast.error(`Invalid entity value for ${attribute.name}. Please select at least one entity.`);
                  setIsExecuting(false);
                  return;
                }
              }

              // Type guard: if a value is present and non-empty, it must be a string or array.
              // This catches corrupted data — never triggers for "" or [] since those are valid types.
              if (typeof value !== "string" && !Array.isArray(value)) {
                toast.error(`Invalid entity value for ${attribute.name}. Please select a valid entity.`);
                setIsExecuting(false);
                return;
              }
            }
          }
        }

        const response = await commsAPI.kickoffConsoleTrigger(assemblyId, workflowId, trigger.id, processedInputs);

        toast.success("Action ran successfully - Ticket created!");
        onSuccess?.(response);
        resetForm();
        onClose?.();
      } catch (error) {
        console.error("Trigger execution failed:", error);
        toast.error("Error executing the trigger");
      } finally {
        setIsExecuting(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trigger, requiredInputs, optionalInputs, formData.inputs, assemblyId, workflowId]
  );

  return {
    formData,
    isLoaded,
    isExecuting,
    isFormValid,
    hasUnsavedChanges,
    handleInputChange,
    updateField,
    removeFileFromInput,
    isFieldEmpty,
    handleExecute,
    resetForm,
    templateMediaUrls,
    loadingTemplateIds,
    deletingMediaIds,
    setDeletingMediaIds,
    eventManager,
    requiredInputs,
    optionalInputs,
    hasRequiredInputs,
    hasOptionalInputs,
  };
}
