import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { formatStatus, getStatusVariant, cn } from "@/lib/utils";
import type { BadgeVariant } from "@/lib/ui-variants";
import { User, Bot, Plug, Clock, PlayCircle, CheckCircle2, XCircle, Eye, AlertOctagon, FolderOpen } from "lucide-react";
import { SOP_STEP_TYPES } from "@/config/constants";

interface StatusBadgeProps {
  status: string;
  className?: string;
  /** When provided, overrides automatic variant (e.g. from getBadgeVariantForTaskStatus for task headers). */
  variant?: BadgeVariant;
  withIcon?: boolean;
}

/**
 * StatusBadge - A standardized badge component for displaying status values
 * Automatically formats status text (e.g., "IN_PROGRESS" -> "In Progress")
 * and applies appropriate colors based on the status type
 */
const getStatusIcon = (status: string) => {
  const normalized = status?.toUpperCase();
  switch (normalized) {
    case "PENDING":
      return <Clock className="h-3 w-3" />;
    case "OPEN":
      return <FolderOpen className="h-3 w-3" />;
    case "IN_PROGRESS":
      return <PlayCircle className="h-3 w-3" />;
    case "IN_REVIEW":
      return <Eye className="h-3 w-3" />;
    case "COMPLETED":
      return <CheckCircle2 className="h-3 w-3" />;
    case "CANCELLED":
      return <XCircle className="h-3 w-3" />;
    case "FAILED":
    case "POST_ACTION_FAILED":
      return <AlertOctagon className="h-3 w-3" />;
    case "CLOSED":
    case "ABANDONED":
      return <XCircle className="h-3 w-3" />;
    default:
      return null;
  }
};

export const StatusBadge = React.forwardRef<HTMLDivElement, StatusBadgeProps>(({ status, className, variant, withIcon = true, ...props }, ref) => {
  const formattedStatus = formatStatus(status);
  const statusVariant = variant || getStatusVariant(status);

  return (
    <Badge ref={ref} variant={statusVariant} className={cn("flex items-center gap-1.5", className)} {...props}>
      {withIcon && getStatusIcon(status)}
      <span>{formattedStatus}</span>
    </Badge>
  );
});

StatusBadge.displayName = "StatusBadge";

interface StepTypeBadgeProps {
  stepType: "AI" | "HIL" | "INTEGRATION";
  className?: string;
}

/**
 * StepTypeBadge - A specialized badge component for displaying SOP step types
 * Shows appropriate icons and colors for AI, HIL (Human In Loop), and INTEGRATION steps
 */
export const StepTypeBadge = React.forwardRef<HTMLDivElement, StepTypeBadgeProps>(({ stepType, className, ...props }, ref) => {
  const getStepTypeConfig = (type: string) => {
    switch (type) {
      case SOP_STEP_TYPES.AI:
        return {
          icon: <Bot className="h-3 w-3" />,
          label: "AI",
          className: "bg-success-bg text-success border-success/40",
        };
      case SOP_STEP_TYPES.HIL:
        return {
          icon: <User className="h-3 w-3" />,
          label: "Human In Loop",
          className: "bg-info-bg text-info border-info/40",
        };
      case SOP_STEP_TYPES.INTEGRATION:
        return {
          icon: <Plug className="h-3 w-3" />,
          label: "Integration",
          className: "bg-primary-bg text-primary border-primary/40",
        };
      default:
        return {
          icon: <Bot className="h-3 w-3" />,
          label: stepType,
          className: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950/50 dark:text-gray-300 dark:border-gray-800",
        };
    }
  };

  const config = getStepTypeConfig(stepType);

  return (
    <Badge ref={ref} variant="outline" className={cn("text-xs flex items-center gap-1.5 px-2 py-1 font-medium", config.className, className)} {...props}>
      {config.icon}
      {config.label}
    </Badge>
  );
});

StepTypeBadge.displayName = "StepTypeBadge";
