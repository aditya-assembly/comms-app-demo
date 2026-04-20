import * as React from "react";

import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

/** Visible height for about 10 lines; extra content scrolls (default text-sm). */
export const TEXTAREA_SCROLL_AFTER_10_ROWS = "max-h-[13.5rem] overflow-y-auto";

/** Same for text-base / leading-6 (e.g. conversation creator prompt). */
export const TEXTAREA_SCROLL_AFTER_10_ROWS_LG = "max-h-[16rem] overflow-y-auto leading-6";

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "focus-border-only flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-0 focus:border-primary focus-visible:outline-none focus-visible:ring-0 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
