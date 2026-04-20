import { useState, useEffect } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface DateTimePickerProps {
  /** Current value - can be milliseconds (number/string) or ISO date string */
  value?: string | number | Date | null;
  /** Callback when datetime changes - returns milliseconds as string */
  onChange: (value: string) => void;
  /** Placeholder text when no date is selected */
  placeholder?: string;
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Custom class name for the trigger button */
  className?: string;
}

interface TimeValue {
  hours: number;
  minutes: number;
  ampm: "AM" | "PM";
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
 * Get time value from a Date object
 */
function getTimeValue(date: Date | undefined): TimeValue {
  if (!date) return { hours: 12, minutes: 0, ampm: "PM" };
  const hours = date.getHours();
  return {
    hours: hours === 0 ? 12 : hours > 12 ? hours - 12 : hours,
    minutes: date.getMinutes(),
    ampm: (hours >= 12 ? "PM" : "AM") as "AM" | "PM",
  };
}

/**
 * Convert 12-hour time to 24-hour
 */
function to24Hour(timeValue: TimeValue): number {
  if (timeValue.ampm === "PM" && timeValue.hours !== 12) {
    return timeValue.hours + 12;
  }
  if (timeValue.ampm === "AM" && timeValue.hours === 12) {
    return 0;
  }
  return timeValue.hours;
}

/**
 * Date and time picker component with month/year navigation and AM/PM time selection.
 * Returns milliseconds timestamp as string when saved.
 */
export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick date & time",
  disabled = false,
  className = "",
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState<Date | undefined>(parseValue(value));
  const [displayMonth, setDisplayMonth] = useState<Date>(selectedDateTime || new Date());
  const [timeValue, setTimeValue] = useState<TimeValue>(() => getTimeValue(parseValue(value)));

  // Update when value prop changes
  useEffect(() => {
    const parsed = parseValue(value);
    setSelectedDateTime(parsed);
    if (parsed) {
      setDisplayMonth(parsed);
      setTimeValue(getTimeValue(parsed));
    } else {
      // Reset to default if value is cleared
      setDisplayMonth(new Date());
      setTimeValue({ hours: 12, minutes: 0, ampm: "AM" });
    }
  }, [value]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // Preserve the time when selecting a new date
      const newDateTime = new Date(date);
      const hours24 = to24Hour(timeValue);
      newDateTime.setHours(hours24, timeValue.minutes, 0, 0);
      setSelectedDateTime(newDateTime);
    } else {
      setSelectedDateTime(date);
    }
  };

  const handleTimeChange = (field: "hours" | "minutes", newValue: number) => {
    const newTimeValue = { ...timeValue, [field]: newValue };
    setTimeValue(newTimeValue);
    updateDateTime(newTimeValue);
  };

  const handleAmPmChange = (newAmPm: "AM" | "PM") => {
    const newTimeValue = { ...timeValue, ampm: newAmPm };
    setTimeValue(newTimeValue);
    updateDateTime(newTimeValue);
  };

  const updateDateTime = (newTimeValue: TimeValue) => {
    if (selectedDateTime) {
      const newDateTime = new Date(selectedDateTime);
      const hours24 = to24Hour(newTimeValue);
      newDateTime.setHours(hours24, newTimeValue.minutes, 0, 0);
      setSelectedDateTime(newDateTime);
    }
  };

  const handleSave = () => {
    if (selectedDateTime) {
      // Send as Unix timestamp (string in milliseconds)
      onChange(String(selectedDateTime.getTime()));
    }
    setOpen(false);
  };

  const formatDisplayValue = (date: Date | undefined) => {
    if (!date) return placeholder;
    return format(date, "MMM d, yyyy 'at' h:mm a");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={`h-8 min-w-[200px] w-auto justify-start text-left font-normal ${className}`}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDisplayValue(selectedDateTime)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-6" align="start">
        <div className="space-y-6">
          {/* Date Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Select Date</h3>

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
              selected={selectedDateTime}
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

          {/* Time Selection */}
          <div className="border-t pt-4">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Select Time</h3>

              <div className="flex items-center justify-center gap-3">
                <Input
                  type="number"
                  min="1"
                  max="12"
                  value={timeValue.hours}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (val >= 1 && val <= 12) {
                      handleTimeChange("hours", val);
                    }
                  }}
                  className="w-16 h-10 text-center text-lg font-mono"
                />

                <span className="text-lg font-bold text-muted-foreground">:</span>

                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={timeValue.minutes.toString().padStart(2, "0")}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (val >= 0 && val <= 59) {
                      handleTimeChange("minutes", val);
                    }
                  }}
                  className="w-16 h-10 text-center text-lg font-mono"
                />

                <div className="flex gap-2 ml-2">
                  <Button
                    variant={timeValue.ampm === "AM" ? "default" : "outline"}
                    onClick={() => handleAmPmChange("AM")}
                    className="h-10 px-4 text-sm font-medium"
                  >
                    AM
                  </Button>
                  <Button
                    variant={timeValue.ampm === "PM" ? "default" : "outline"}
                    onClick={() => handleAmPmChange("PM")}
                    className="h-10 px-4 text-sm font-medium"
                  >
                    PM
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="min-w-[80px]">
              Save
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
