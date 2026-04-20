import { Button } from "@/components/ui/button";
import { Loader2, RotateCcw, Info, Play, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useTriggerForm } from "@/hooks/use-trigger-form";
import { ActionFieldGroups } from "../action-field-groups";
import type { WorkflowTriggerItem, TriggerExecutionResponse } from "@/types/api";
import { FlowStepFormInner } from "@/components/flows/flow-step-layout";

// ── Props ──────────────────────────────────────────────────────────────────────

interface InlineActionFormProps {
  trigger: WorkflowTriggerItem;
  assemblyId: string;
  workflowId: string;
  onExecutionSuccess: (response: TriggerExecutionResponse) => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function InlineActionForm({ trigger, assemblyId, workflowId, onExecutionSuccess }: InlineActionFormProps) {
  const form = useTriggerForm({
    trigger,
    assemblyId,
    workflowId,
    active: true,
  });

  if (!form.isLoaded) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleExecute = () => {
    form.handleExecute(onExecutionSuccess);
  };

  return (
    <FlowStepFormInner className="space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary-bg border border-border-light">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-text-primary">{trigger.name}</h3>
            <p className="text-xs text-text-muted mt-0.5">Configure and run this action</p>
          </div>
        </div>

        {trigger.description && (
          <div className="flex items-start gap-2.5 p-3 bg-info-bg rounded-lg border border-border-light">
            <Info className="h-4 w-4 text-info flex-shrink-0 mt-0.5" />
            <span className="text-sm leading-relaxed text-text-primary">{trigger.description}</span>
          </div>
        )}
      </motion.div>

      {/* Form fields */}
      <ActionFieldGroups form={form} action={trigger} assemblyId={assemblyId} workflowId={workflowId} />

      {/* Action footer */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="flex items-center justify-between pt-4 border-t border-border-light"
      >
        <div className="flex items-center">
          {form.hasUnsavedChanges() && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2 }}>
              <Button
                variant="ghost"
                onClick={() => form.resetForm()}
                disabled={form.isExecuting}
                className="gap-2 h-10 px-4 hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
              >
                <motion.div animate={{ rotate: 0 }} whileHover={{ rotate: -180 }} transition={{ duration: 0.3 }}>
                  <RotateCcw className="h-4 w-4" />
                </motion.div>
                Reset Form
              </Button>
            </motion.div>
          )}
        </div>

        <motion.div whileHover={{ scale: form.isExecuting || !form.isFormValid ? 1 : 1.03 }} whileTap={{ scale: form.isExecuting || !form.isFormValid ? 1 : 0.97 }}>
          <Button
            onClick={handleExecute}
            disabled={form.isExecuting || !form.isFormValid}
            size="lg"
            className="gap-2.5 h-12 px-10 bg-gradient-to-r from-primary to-primary/90 hover:from-primary hover:to-primary/85 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            title={!form.isFormValid ? "Please complete all required fields" : ""}
          >
            {form.isExecuting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="animate-pulse">Running...</span>
              </>
            ) : (
              <>
                <Play className="h-5 w-5" />
                Run Action
              </>
            )}
          </Button>
        </motion.div>
      </motion.div>
    </FlowStepFormInner>
  );
}
