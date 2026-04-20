import ReactMarkdown from "react-markdown";
import type { InformationFlowStep } from "@/types/orchestration-dashboard-types";
import { FlowStepFormInner } from "@/components/flows/flow-step-layout";

interface InformationStepProps {
  step: InformationFlowStep;
}

export function InformationStep({ step }: InformationStepProps) {
  // Use content field if available, fallback to description
  const markdownContent = step.content || step.description;

  return (
    <FlowStepFormInner>
      <div className="prose prose-sm max-w-none dark:prose-invert text-foreground prose-p:text-foreground prose-headings:text-foreground prose-li:text-foreground prose-strong:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-code:text-foreground prose-code:bg-muted prose-pre:bg-muted prose-blockquote:border-primary prose-blockquote:text-text-secondary">
        {markdownContent ? (
          <ReactMarkdown>{markdownContent}</ReactMarkdown>
        ) : (
          <p className="text-muted-foreground">No information provided for this step.</p>
        )}
      </div>
    </FlowStepFormInner>
  );
}

