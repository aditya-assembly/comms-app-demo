import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown, Search, X, CheckSquare, XCircle, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  showSelectAll?: boolean;
  selectAllLabel?: string;
  clearAllLabel?: string;
  renderOptionIcon?: (option: MultiSelectOption, isSelected: boolean) => ReactNode;
}

export function MultiSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select options...",
  className,
  searchable = false,
  searchPlaceholder = "Search...",
  showSelectAll = true,
  selectAllLabel = "Select all",
  clearAllLabel = "Clear",
  renderOptionIcon,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const handleToggle = (optionValue: string) => {
    const newValue = value.includes(optionValue) ? value.filter((v) => v !== optionValue) : [...value, optionValue];
    onValueChange(newValue);
  };

  const filteredOptions = useMemo(() => {
    if (!searchable || query.trim() === "") return options;
    const q = query.toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(q) || opt.value.toLowerCase().includes(q));
  }, [options, query, searchable]);

  const selectedOptions = useMemo(() => options.filter((option) => value.includes(option.value)), [options, value]);
  const selectedLabels = useMemo(() => selectedOptions.map((option) => option.label), [selectedOptions]);

  const displayText = selectedLabels.length === 0 ? placeholder : `${selectedLabels.length} selected`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className={cn("h-10 px-3 items-center justify-between gap-2 pr-2 w-auto", className)}>
          <span className="truncate text-left text-muted-foreground">{displayText}</span>
          {value.length > 0 && (
            <X
              className="h-4 w-4 shrink-0 opacity-60 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onValueChange([]);
              }}
            />
          )}
          <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0 bg-surface border-border-light">
        {(searchable || showSelectAll) && (
          <div className="p-2 border-b">
            {searchable && (
              <div className="relative">
                <div className="absolute left-2 inset-y-0 flex items-center pointer-events-none">
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={searchPlaceholder} className="pl-7 h-8" />
              </div>
            )}
            {showSelectAll && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Button variant="secondary" size="sm" className="h-8 px-2 justify-center" onClick={() => onValueChange(options.map((o) => o.value))}>
                  <CheckSquare className="h-4 w-4 mr-1.5" /> {selectAllLabel}
                </Button>
                <Button variant="outline" size="sm" className="h-8 px-2 justify-center" onClick={() => onValueChange([])}>
                  <XCircle className="h-4 w-4 mr-1.5" /> {clearAllLabel}
                </Button>
              </div>
            )}
          </div>
        )}
        <div className="max-h-60 overflow-auto p-1" role="listbox" aria-multiselectable>
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-6 text-sm text-muted-foreground text-center">No options</div>
          ) : (
            filteredOptions.map((option) => {
              const isSelected = value.includes(option.value);
              return (
                <div
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  className={cn(
                    "group flex items-center gap-3 rounded-md px-2.5 py-2 text-sm cursor-pointer transition-all hover:bg-surface-highlight hover:text-text-primary",
                    isSelected && "bg-primary-bg text-primary border border-border-light"
                  )}
                  onClick={() => handleToggle(option.value)}
                >
                  <span className="inline-flex items-center justify-center">
                    {renderOptionIcon ? (
                      <span className={cn("transition-colors", isSelected ? "text-primary" : "text-text-muted group-hover:text-text-primary")}>{renderOptionIcon(option, isSelected)}</span>
                    ) : isSelected ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </span>
                  <span className={cn("flex-1 leading-6 transition-colors", isSelected && "font-medium text-primary")}>{option.label}</span>
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
