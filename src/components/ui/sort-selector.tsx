import { ArrowUp, ArrowDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { SORT_ORDERS } from "@/config/constants";

export interface SortOption {
  value: string;
  label: string;
  field: string;
  order: typeof SORT_ORDERS.ASC | typeof SORT_ORDERS.DESC;
}

export interface SortSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SortOption[];
  placeholder?: string;
  className?: string;
  showIcon?: boolean;
}

export function SortSelector({ value, onValueChange, options, placeholder = "Sort by", className, showIcon = true }: SortSelectorProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={cn("w-[240px] bg-background hover:bg-accent/50 transition-colors", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="min-w-[240px]">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} className="cursor-pointer hover:bg-accent focus:bg-accent">
            <div className="flex items-center gap-3 w-full py-1">
              {showIcon && (
                <div className="flex items-center">
                  {option.order === SORT_ORDERS.ASC ? <ArrowUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ArrowDown className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>
              )}
              <span className="flex-1 font-medium">{option.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
