import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, RotateCcw, Info, Play, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useTriggerForm } from "@/hooks/use-trigger-form";
import { ActionFieldGroups } from "./action-field-groups";
import type { WorkflowTriggerItem, TriggerExecutionResponse, TriggerInputValue } from "@/types/api";

interface ActionExecutionModalProps {
  trigger: WorkflowTriggerItem | null;
  isOpen: boolean;
  onClose: () => void;
  assemblyId: string;
  workflowId: string;
  /** When provided, used instead of default form execution (e.g. product flow runAutomation). */
  onExecute?: (triggerInputs: Record<string, TriggerInputValue>) => Promise<TriggerExecutionResponse>;
  onExecutionSuccess?: (response: TriggerExecutionResponse) => void;
}

export default function ActionExecutionModal({ trigger, isOpen, onClose, assemblyId, workflowId, onExecute, onExecutionSuccess }: ActionExecutionModalProps) {
  const form = useTriggerForm({
    trigger,
    assemblyId,
    workflowId,
    active: isOpen,
  });

  if (!trigger || !form.isLoaded) return null;

  const handleExecute = async () => {
    if (onExecute) {
      const response = await onExecute(form.formData.inputs);
      onExecutionSuccess?.(response);
      onClose();
    } else {
      form.handleExecute(onExecutionSuccess, onClose);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col bg-surface border border-border-light shadow-2xl">
        <DialogHeader className="space-y-4 flex-shrink-0 pr-12 pb-6 border-b border-border-light">
          <DialogTitle className="flex items-center gap-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="p-3 rounded-xl bg-primary-bg border border-border-light shadow-sm"
            >
              <Sparkles className="h-6 w-6 text-primary" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <motion.h2 initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="text-2xl font-bold text-text-primary">
                {trigger.name}
              </motion.h2>
              <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.2 }} className="text-sm text-text-muted mt-1">
                Configure and run this action
              </motion.p>
            </div>
          </DialogTitle>

          {trigger.description && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }}>
              <DialogDescription asChild>
                <div className="flex items-start gap-3 p-4 bg-info-bg rounded-xl border border-border-light">
                  <Info className="h-5 w-5 text-info flex-shrink-0 mt-0.5" />
                  <span className="text-sm leading-relaxed text-text-primary">{trigger.description}</span>
                </div>
              </DialogDescription>
            </motion.div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto scrollbar-thin space-y-6 py-6 px-2">
          <ActionFieldGroups form={form} action={trigger} assemblyId={assemblyId} workflowId={workflowId} />
        </div>

        <DialogFooter className="flex-shrink-0 pt-6 border-t border-border-light bg-surface">
          <div className="flex items-center justify-between w-full gap-4">
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

            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={onClose} disabled={form.isExecuting} className="h-11 px-6">
                Cancel
              </Button>
              <motion.div whileHover={{ scale: form.isExecuting || !form.isFormValid ? 1 : 1.05 }} whileTap={{ scale: form.isExecuting || !form.isFormValid ? 1 : 0.95 }}>
                <Button
                  onClick={handleExecute}
                  disabled={form.isExecuting || !form.isFormValid}
                  className="gap-2 h-11 px-8 bg-gradient-to-r from-primary to-primary/90 hover:from-primary hover:to-primary/85 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  title={!form.isFormValid ? "Please complete all required fields" : ""}
                >
                  {form.isExecuting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="animate-pulse">Running...</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Run Action
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
