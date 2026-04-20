import { useState, useEffect } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface DatePickerProps {
  /** Current value - can be milliseconds (number/string) or ISO date string */
  value?: string | number | Date | null;
  /** Callback when date changes - returns milliseconds as string */
  onChange: (value: string) => void;
  /** Placeholder text when no date is selected */
  placeholder?: string;
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Custom class name for the trigger button */
  className?: string;
}

/**
 * Parse date value - handles milliseconds (number/string), ISO strings, and Date objects
 */
function parseValue(val: string | number | Date | null | undefined): Date | undefined {
  if (val === null || val === undefined || val === "") return undefined;

  // Handle Date objects directly
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? undefined : val;
  }

  // If it's a number or string that's all digits, treat as milliseconds
  if (typeof val === "number" || /^\d+$/.test(String(val))) {
    const date = new Date(Number(val));
    return isNaN(date.getTime()) ? undefined : date;
  }

  // Otherwise, try to parse as ISO string
  const date = new Date(val);
  return isNaN(date.getTime()) ? undefined : date;
}

/**
 * Date picker component with month/year navigation.
 * Returns milliseconds timestamp as string when date is selected.
 */
export function DatePicker({
  value,
  onChange,
  placeholder = "Pick date",
  disabled = false,
  className = "",
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(parseValue(value));
  const [displayMonth, setDisplayMonth] = useState<Date>(selectedDate || new Date());

  // Update when value prop changes
  useEffect(() => {
    const parsed = parseValue(value);
    setSelectedDate(parsed);
    if (parsed) {
      setDisplayMonth(parsed);
    } else {
      setDisplayMonth(new Date());
    }
  }, [value]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // Create date at local midnight and convert to UTC timestamp for backend
      const localMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
      setSelectedDate(localMidnight);
      // Send UTC timestamp to backend
      onChange(String(localMidnight.getTime()));
      setOpen(false);
    } else {
      setSelectedDate(date);
    }
  };

  const formatDisplayValue = (date: Date | undefined) => {
    if (!date) return placeholder;
    // Display in user's local timezone
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={`h-8 min-w-[180px] w-auto justify-start text-left font-normal ${className}`}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDisplayValue(selectedDate)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-6" align="start">
        <div className="space-y-6">
          {/* Month/Year Navigation */}
          <div className="flex items-center justify-center gap-3">
            <Select
              value={displayMonth.getMonth().toString()}
              onValueChange={(monthValue) => {
                const newDate = new Date(displayMonth);
                newDate.setMonth(parseInt(monthValue));
                setDisplayMonth(newDate);
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue>{MONTHS[displayMonth.getMonth()]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="number"
              value={displayMonth.getFullYear()}
              onChange={(e) => {
                const year = parseInt(e.target.value);
                if (!isNaN(year) && year > 0) {
                  const newDate = new Date(displayMonth);
                  newDate.setFullYear(year);
                  setDisplayMonth(newDate);
                }
              }}
              onFocus={(e) => e.target.select()}
              placeholder="Year"
              className="w-[100px] text-center font-medium"
            />
          </div>

          {/* Calendar Grid */}
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            month={displayMonth}
            onMonthChange={setDisplayMonth}
            className="w-full"
            classNames={{
              months: "w-full",
              month: "w-full space-y-4",
              table: "w-full",
              head_row: "flex justify-between",
              row: "flex w-full justify-between mt-2",
              head_cell: "w-10 font-normal text-[0.8rem]",
              cell: "w-10 h-10 text-center text-sm p-0 relative",
              day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100",
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
