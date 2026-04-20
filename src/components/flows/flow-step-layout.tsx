import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Constrains step body content to ~60% of the parent width (centered).
 * Use for product-flow step UIs so forms and cards are not edge-to-edge.
 */
export const flowStepContentClass = "w-full max-w-[60%] min-w-0 mx-auto";

/**
 * Completed / results shell: ~90% of parent width (centered) for data-dense views (event table, pivot).
 */
export const flowStepContentWideClass = "w-full max-w-[min(100%,90%)] min-w-0 mx-auto";

/**
 * Full width of the parent column (no max-width). Use for conversation wizards so the card spans
 * the step pane; cap labels/inputs with {@link FlowStepFormInner} or field-level max-width.
 */
export const flowStepContentFullClass = "w-full min-w-0";

/**
 * Inner form/readable width inside {@link flowStepContentClass} — keeps inputs and cards
 * from stretching the full width of the 60% column (typical ~42rem cap).
 */
export const flowStepFormInnerClass = "w-full max-w-2xl min-w-0 mx-auto";

/**
 * Wider readable column for conversation creator wizards (item strip + nested editor) without going edge-to-edge on very wide monitors.
 */
export const flowStepFormConversationInnerClass = "w-full max-w-4xl min-w-0 mx-auto";

/** Full width of the parent column (e.g. session event table + pivot). */
export const flowStepFormInnerFullClass = "w-full min-w-0 max-w-none mx-auto";

interface FlowStepContentProps {
  children: ReactNode;
  className?: string;
  /** When true, use {@link flowStepContentWideClass} (~90% width) instead of the default 60% band. */
  wide?: boolean;
  /**
   * When true, use {@link flowStepContentFullClass} (100% of parent). Takes precedence over {@code wide}.
   * Pair with {@link FlowStepFormInner} {@code variant="conversation"} to cap form controls.
   */
  fullWidth?: boolean;
}

export function FlowStepContent({ children, className, wide, fullWidth }: FlowStepContentProps) {
  const shell = fullWidth ? flowStepContentFullClass : wide ? flowStepContentWideClass : flowStepContentClass;
  return <div className={cn(shell, className)}>{children}</div>;
}

interface FlowStepFormInnerProps {
  children: ReactNode;
  className?: string;
  /** When true, drop max-w-2xl so tables and grids can use the full wide column. */
  fullWidth?: boolean;
  /**
   * {@code conversation}: ~56rem max for conversation wizards inside a full-width step shell.
   * Ignored when {@code fullWidth} is true.
   */
  variant?: "default" | "conversation";
}

/** Narrower column for labels, inputs, and primary actions inside a flow step. */
export function FlowStepFormInner({ children, className, fullWidth, variant = "default" }: FlowStepFormInnerProps) {
  const widthClass = fullWidth
    ? flowStepFormInnerFullClass
    : variant === "conversation"
      ? flowStepFormConversationInnerClass
      : flowStepFormInnerClass;
  return <div className={cn(widthClass, className)}>{children}</div>;
}

/**
 * Primary actions row: buttons size to content instead of stretching full width.
 */
interface FlowStepActionsProps {
  children: ReactNode;
  className?: string;
}

export function FlowStepActions({ children, className }: FlowStepActionsProps) {
  return (
    <div className={cn("flex flex-wrap gap-2 items-center", className)}>{children}</div>
  );
}
