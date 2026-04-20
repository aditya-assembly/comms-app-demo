import { cva, type VariantProps } from "class-variance-authority";

/** Badge variants. Use these instead of ad-hoc className overrides for color/semantics. */
export const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary-hover",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-surface-highlight",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:opacity-90",
        outline: "border border-border bg-muted/20 text-foreground hover:bg-muted/30",
        muted: "border border-border bg-muted/30 text-muted-foreground hover:bg-muted/40",
        success: "border-transparent bg-success text-primary-foreground hover:opacity-90",
        warning: "border-transparent bg-warning text-primary-foreground hover:opacity-90",
        info: "border-transparent bg-info text-primary-foreground hover:opacity-90",
        primarySoft: "border border-primary/20 bg-primary/10 text-primary hover:bg-primary/15",
        accentSoft: "border border-accent/20 bg-accent-bg text-accent hover:bg-accent/10",
        successSoft: "border border-success/20 bg-success-bg text-success hover:opacity-90",
        warningSoft: "border border-warning/20 bg-warning-bg text-warning hover:opacity-90",
        destructiveSoft: "border border-destructive/20 bg-error-bg text-destructive hover:opacity-90",
        infoSoft: "border border-info/20 bg-info-bg text-info hover:opacity-90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

export const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary-hover",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:opacity-90",
        outline: "border border-input bg-background shadow-sm hover:bg-primary/10 hover:border-primary hover:text-primary",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-surface-highlight",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        /** Use for delete/trash actions so hover stays destructive (no accent/teal) for accessibility. */
        ghostDestructive: "text-destructive hover:bg-destructive/10 hover:text-destructive",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-[hsl(var(--emerald-600))] text-white shadow hover:bg-[hsl(var(--emerald-600))]/90",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export const toggleVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline: "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-9 px-3",
        sm: "h-8 px-2",
        lg: "h-10 px-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export const navigationMenuTriggerStyle = cva(
  "group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
);
