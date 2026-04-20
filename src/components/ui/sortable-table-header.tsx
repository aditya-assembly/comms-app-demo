import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SORT_ORDERS } from "@/config/constants";

interface SortableTableHeaderProps {
  children: React.ReactNode;
  sortKey: string;
  currentSort?: string;
  currentOrder?: string;
  onSort: (sortKey: string) => void;
  className?: string;
  align?: "left" | "center" | "right";
}

export function SortableTableHeader({ children, sortKey, currentSort, currentOrder, onSort, className, align = "left" }: SortableTableHeaderProps) {
  const isActive = currentSort === sortKey;
  const isAsc = currentOrder === SORT_ORDERS.ASC;
  const isDesc = currentOrder === SORT_ORDERS.DESC;

  const getSortIcon = () => {
    if (!isActive) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground/50" />;
    }
    if (isAsc) {
      return <ArrowUp className="h-4 w-4 text-foreground" />;
    }
    if (isDesc) {
      return <ArrowDown className="h-4 w-4 text-foreground" />;
    }
    return <ArrowUpDown className="h-4 w-4 text-muted-foreground/50" />;
  };

  const getJustifyContent = () => {
    switch (align) {
      case "center":
        return "justify-center";
      case "right":
        return "justify-end";
      default:
        return "justify-start";
    }
  };

  return (
    <TableHead className={cn("p-0", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onSort(sortKey);
        }}
        className={cn("h-auto w-full px-3 py-2 font-medium hover:bg-accent/50 transition-colors flex items-center gap-2 relative z-10", getJustifyContent(), isActive && "text-foreground bg-accent/30")}
        style={{ pointerEvents: 'auto' }}
      >
        <span className="truncate">{children}</span>
        {getSortIcon()}
      </Button>
    </TableHead>
  );
}
