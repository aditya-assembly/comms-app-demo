import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  message?: string;
}

export function EmptyState({ icon, title, message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4 text-center flex-1 w-full">
      {icon && <div className="text-muted-foreground">{icon}</div>}
      <h3 className="text-lg font-semibold">{title}</h3>
      {message && <p className="text-muted-foreground mt-2 max-w-sm">{message}</p>}
    </div>
  );
}
