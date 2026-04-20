import type { EventSessionManager } from "@/lib/event-session-manager";
import type { TriggerInputItem } from "@/types/api";

export interface DataViewAttributeInputProps {
  input: TriggerInputItem;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  isRequired: boolean;
  error: boolean;
  assemblyId: string;
  workflowId: string;
  disabled: boolean;
  eventManager?: EventSessionManager | null;
}

/**
 * Placeholder: full data-view picker lives in the orchestration dashboard.
 */
export function DataViewAttributeInput({ input }: DataViewAttributeInputProps) {
  return (
    <div className="rounded-lg border border-border-light bg-muted/30 p-4 text-sm text-muted-foreground">
      Data view field &quot;{input.name}&quot; is not supported in Comms App yet. Configure this action in the orchestration
      dashboard if you need data view selection.
    </div>
  );
}
