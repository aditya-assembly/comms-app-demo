import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { InlineActionForm } from "./inline-action-form";
import type { ActionFlowStep, TriggerExecutionResponse } from "@/types/orchestration-dashboard-types";
import { useConsoleWorkflowTriggers } from "@/hooks/use-comms-api";

interface ActionStepProps {
  step: ActionFlowStep;
  assemblyId: string;
  workflowId: string;
}

export function ActionStep({ step, assemblyId, workflowId }: ActionStepProps) {
  const [executionResponse, setExecutionResponse] = useState<TriggerExecutionResponse | null>(null);

  const { data: triggers, isLoading: isLoadingTriggers } = useConsoleWorkflowTriggers(assemblyId, workflowId, {
    enabled: !!assemblyId && !!workflowId,
  });

  const trigger = triggers?.find((t) => t.id === step.workflowTriggerId);

  const handleExecuteSuccess = (response: TriggerExecutionResponse) => {
    setExecutionResponse(response);
    toast.success("Action executed successfully!");
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
      {!executionResponse ? (
        <InlineActionForm trigger={trigger} assemblyId={assemblyId} workflowId={workflowId} onExecutionSuccess={handleExecuteSuccess} />
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="space-y-4">
          <Card className="border-emerald-200/60 dark:border-emerald-700/40 bg-gradient-to-br from-emerald-50/90 to-green-50/70 dark:from-emerald-950/40 dark:to-green-950/30">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-800/50 dark:to-emerald-700/40 flex items-center justify-center border border-emerald-300/40 dark:border-emerald-600/30 shadow-sm">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <h4 className="text-base font-semibold text-success mb-1">Action Executed Successfully</h4>
                    <p className="text-sm text-success/90">
                      <span className="font-medium">{executionResponse.name}</span> has been created and is now being processed.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                    <span className="text-xs font-medium text-success uppercase tracking-wide">Processing</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
