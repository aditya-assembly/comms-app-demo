import type { DataViewFlowStep } from "@/types/orchestration-dashboard-types";

interface DataViewStepProps {
  step: DataViewFlowStep;
  assemblyId: string;
  workflowId: string;
}

/** Placeholder: full DataViewDetail UI is not ported into Comms App. */
export function DataViewStep({ step }: DataViewStepProps) {
  return (
    <div className="rounded-lg border border-border-light bg-muted/30 p-6 text-sm text-muted-foreground">
      Data view &quot;{step.dataViewId}&quot; cannot be opened inside Comms App yet. Use the orchestration dashboard to work with
      this data view.
    </div>
  );
}
