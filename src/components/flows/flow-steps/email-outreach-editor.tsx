import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isValidEmail, cn } from "@/lib/utils";
import DOMPurify from "dompurify";
import { Check, CheckCircle2, ChevronDown, ChevronRight, ChevronUp, Download, Loader2, Minus, Plus, Upload, Users, Contact, PenLine, FileSpreadsheet, X } from "lucide-react";
import { useTeamMembersSearch, useParticipantsDirectorySearch } from "@/hooks/use-comms-api";
import type { EmailOutreach, EmailContent, SendTimeWindow, EmailReceiver, ParticipantSearchRequest } from "@/types/orchestration-dashboard-types";
import { FlowStepActions } from "@/components/flows/flow-step-layout";

const EMAIL_LIST_LABELS = {
  to: "To",
  cc: "CC",
  bcc: "BCC",
} as const;

const SAMPLE_CSV = `name,email
John Doe,john.doe@example.com
Jane Smith,jane.smith@example.com
Bob Wilson,bob.wilson@example.com`;

const POPULAR_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "America/Toronto",
  "America/Vancouver",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Amsterdam",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Asia/Dubai",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Pacific/Auckland",
  "UTC",
];


function normalizeReceivers(val: EmailReceiver[] | string[] | undefined): EmailReceiver[] {
  if (!val || !Array.isArray(val)) return [];
  return val.map((item) =>
    typeof item === "string" ? { email: item } : { name: item.name, email: item.email }
  );
}

function parseCsvReceivers(csvText: string): EmailReceiver[] {
  const lines = csvText.split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headerParts = lines[0].split(/[,\t]/).map((h) => h.trim().toLowerCase());
  const nameIdx = headerParts.findIndex((h) => h === "name");
  const emailIdx = headerParts.findIndex((h) => h === "email");
  if (emailIdx < 0 || nameIdx < 0) return []; // Both name and email columns required
  const receivers: EmailReceiver[] = [];
  const seen = new Set<string>();
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(/[,\t]/).map((p) => p.trim());
    const email = parts[emailIdx] ?? "";
    if (!email || !isValidEmail(email) || seen.has(email.toLowerCase())) continue;
    seen.add(email.toLowerCase());
    const name = (parts[nameIdx] ?? "").trim();
    if (!name) continue; // Skip rows without name - both name and email are required
    receivers.push({ name, email });
  }
  return receivers;
}

function secondsToDelay(seconds: number): { days: number; hours: number; secs: number } {
  let s = Math.max(0, Math.floor(seconds));
  const days = Math.floor(s / 86400);
  s -= days * 86400;
  const hours = Math.floor(s / 3600);
  s -= hours * 3600;
  return { days, hours, secs: s };
}

function delayToSeconds(days: number, hours: number, secs: number): number {
  return days * 86400 + hours * 3600 + secs;
}

function downloadSampleCsv() {
  const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "email-recipients-sample.csv";
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------------------------------------------------------------------------
 * Add-recipient sub-panels
 * Each panel type ("team" | "people" | "manual" | "csv") is opened from a
 * single "+" dropdown. Only one panel is visible at a time. The selected
 * panel renders inline below the chip list, keeping context without modals.
 * -------------------------------------------------------------------------*/

type AddRecipientPanel = "team" | "people" | "manual" | "csv" | null;

function TeamMemberSearchPanel({
  assemblyId,
  existingEmails,
  onAdd,
  onClose,
}: {
  assemblyId: string;
  existingEmails: Set<string>;
  onAdd: (name: string, email: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data, isLoading } = useTeamMembersSearch(assemblyId, {
    search: debounced || undefined,
    page: 0,
    pageSize: 20,
  });
  const members = (data as { teamMembers?: { id: string; name?: string; email?: string }[] })?.teamMembers ?? [];

  return (
    <div className="rounded-lg border border-border/60 bg-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border/40 px-3 py-2">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Team members</span>
        </div>
        <button type="button" onClick={onClose} className="rounded-md p-1 hover:bg-muted">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <Command shouldFilter={false} className="rounded-none border-none">
        <CommandInput placeholder="Search by name or email…" value={query} onValueChange={setQuery} />
        <CommandList className="max-h-[240px]">
          <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
            {isLoading ? "Searching…" : query.trim() ? "No matches found." : "Type to search your team."}
          </CommandEmpty>
          <CommandGroup className="p-1">
            {members
              .filter((m) => m.email && !existingEmails.has(m.email.toLowerCase()))
              .map((m) => (
                <CommandItem
                  key={m.id}
                  value={`${m.name ?? ""} ${m.email ?? ""}`}
                  onSelect={() => onAdd(m.name ?? "", m.email ?? "")}
                  className="cursor-pointer rounded-md py-2"
                >
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-sm font-medium">{m.name || "Unknown"}</span>
                    <span className="truncate text-xs text-muted-foreground">{m.email}</span>
                  </div>
                </CommandItem>
              ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  );
}

function PeopleSearchPanel({
  assemblyId,
  existingEmails,
  onAdd,
  onClose,
}: {
  assemblyId: string;
  existingEmails: Set<string>;
  onAdd: (name: string, email: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const searchParams: ParticipantSearchRequest = {
    search: debounced || undefined,
    page: 0,
    pageSize: 20,
  };
  const { data, isLoading } = useParticipantsDirectorySearch(assemblyId, searchParams);
  const participants = data?.items ?? [];

  return (
    <div className="rounded-lg border border-border/60 bg-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border/40 px-3 py-2">
        <div className="flex items-center gap-2">
          <Contact className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">People</span>
        </div>
        <button type="button" onClick={onClose} className="rounded-md p-1 hover:bg-muted">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <Command shouldFilter={false} className="rounded-none border-none">
        <CommandInput placeholder="Search by name or email…" value={query} onValueChange={setQuery} />
        <CommandList className="max-h-[240px]">
          <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
            {isLoading ? "Searching…" : query.trim() ? "No matches found." : "Type to search your contacts."}
          </CommandEmpty>
          <CommandGroup className="p-1">
            {participants
              .filter((p) => p.email && !existingEmails.has(p.email.toLowerCase()))
              .map((p) => {
                const displayName = [p.firstName, p.lastName].filter(Boolean).join(" ") || p.email || "Unknown";
                return (
                  <CommandItem
                    key={p.id}
                    value={`${displayName} ${p.email ?? ""}`}
                    onSelect={() => onAdd(displayName, p.email ?? "")}
                    className="cursor-pointer rounded-md py-2"
                  >
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate text-sm font-medium">{displayName}</span>
                      <span className="truncate text-xs text-muted-foreground">{p.email}</span>
                      {p.company && <span className="truncate text-xs text-muted-foreground/70">{p.company}</span>}
                    </div>
                  </CommandItem>
                );
              })}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  );
}

function ManualEntryPanel({
  existingEmails,
  onAdd,
  onClose,
}: {
  existingEmails: Set<string>;
  onAdd: (name: string, email: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName) { setError("Name is required"); return; }
    if (!trimmedEmail) { setError("Email is required"); return; }
    if (!isValidEmail(trimmedEmail)) { setError("Invalid email format"); return; }
    if (existingEmails.has(trimmedEmail.toLowerCase())) { setError("Already added"); return; }
    onAdd(trimmedName, trimmedEmail);
    setName("");
    setEmail("");
    setError(null);
  };

  return (
    <div className="rounded-lg border border-border/60 bg-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border/40 px-3 py-2">
        <div className="flex items-center gap-2">
          <PenLine className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Add manually</span>
        </div>
        <button type="button" onClick={onClose} className="rounded-md p-1 hover:bg-muted">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="p-3 space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="Name"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(null); }}
            className={cn("flex-1 bg-background", error && !name.trim() && "border-destructive")}
            autoFocus
          />
          <Input
            placeholder="Email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(null); }}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSubmit())}
            className={cn("flex-1 bg-background", error && (!email.trim() || !isValidEmail(email.trim())) && "border-destructive")}
          />
          <Button type="button" size="sm" onClick={handleSubmit} disabled={!name.trim() || !email.trim()} className="gap-1.5 shrink-0">
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </div>
  );
}

function CsvUploadPanel({
  existingEmails,
  onImport,
  onClose,
}: {
  existingEmails: Set<string>;
  onImport: (receivers: EmailReceiver[]) => void;
  onClose: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importCount, setImportCount] = useState<number | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const parsed = parseCsvReceivers(text);
      const toAdd = parsed.filter((r) => !existingEmails.has(r.email.toLowerCase()));
      if (toAdd.length > 0) {
        onImport(toAdd);
        setImportCount(toAdd.length);
        setTimeout(() => onClose(), 1200);
      } else {
        setImportCount(0);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="rounded-lg border border-border/60 bg-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border/40 px-3 py-2">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Upload from CSV</span>
        </div>
        <button type="button" onClick={onClose} className="rounded-md p-1 hover:bg-muted">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="p-4 space-y-3">
        <p className="text-xs text-muted-foreground">
          CSV must have <strong>name</strong> and <strong>email</strong> columns (one recipient per row).
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={downloadSampleCsv} className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            Sample CSV
          </Button>
          <Button variant="default" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-1.5">
            <Upload className="h-3.5 w-3.5" />
            Choose file
          </Button>
          <input ref={fileInputRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileSelect} />
        </div>
        {importCount !== null && (
          <p className={cn("text-xs font-medium", importCount > 0 ? "text-emerald-600" : "text-amber-600")}>
            {importCount > 0 ? (
              <span className="flex items-center gap-1"><Check className="h-3.5 w-3.5" /> Imported {importCount} recipient{importCount !== 1 ? "s" : ""}</span>
            ) : (
              "No new recipients found (all duplicates or invalid)."
            )}
          </p>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * EmailListField — main component for To / CC / BCC
 * -------------------------------------------------------------------------*/

interface EmailListFieldProps {
  label: "to" | "cc" | "bcc";
  receivers: EmailReceiver[];
  onChange: (receivers: EmailReceiver[]) => void;
  onCsvUpload?: (receivers: EmailReceiver[]) => void;
  assemblyId?: string;
  disabled?: boolean;
}

function EmailListField({ label, receivers, onChange, onCsvUpload, assemblyId, disabled }: EmailListFieldProps) {
  const [activePanel, setActivePanel] = useState<AddRecipientPanel>(null);
  const existingEmails = new Set(receivers.map((r) => r.email.toLowerCase()));
  const canUseTeamSearch = Boolean(assemblyId && !disabled);

  const handleAddReceiver = (name: string, email: string) => {
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail || !isValidEmail(normalizedEmail)) return;
    if (existingEmails.has(normalizedEmail)) return;
    onChange([...receivers, { name: name?.trim() || undefined, email: normalizedEmail }]);
  };

  const handleRemove = (email: string) => {
    onChange(receivers.filter((r) => r.email !== email));
  };

  const handleCsvImport = (imported: EmailReceiver[]) => {
    const merged = [...receivers];
    const seen = new Set(receivers.map((r) => r.email.toLowerCase()));
    for (const r of imported) {
      if (!seen.has(r.email.toLowerCase())) {
        merged.push(r);
        seen.add(r.email.toLowerCase());
      }
    }
    onChange(merged);
    onCsvUpload?.(merged);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-foreground">{EMAIL_LIST_LABELS[label]}</Label>
        {!disabled && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs">
                <Plus className="h-3.5 w-3.5" />
                Add
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {canUseTeamSearch && (
                <DropdownMenuItem onClick={() => setActivePanel("team")} className="gap-2 cursor-pointer">
                  <Users className="h-4 w-4" />
                  Team members
                </DropdownMenuItem>
              )}
              {canUseTeamSearch && (
                <DropdownMenuItem onClick={() => setActivePanel("people")} className="gap-2 cursor-pointer">
                  <Contact className="h-4 w-4" />
                  People
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => setActivePanel("manual")} className="gap-2 cursor-pointer">
                <PenLine className="h-4 w-4" />
                Add manually
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActivePanel("csv")} className="gap-2 cursor-pointer">
                <FileSpreadsheet className="h-4 w-4" />
                Upload from CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {receivers.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {receivers.map((r) => (
            <span
              key={r.email}
              className="group inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 pl-3 pr-1.5 py-1 text-sm transition-colors hover:bg-muted/70"
            >
              <span className="truncate max-w-[200px]">
                {r.name ? (
                  <>
                    <span className="font-medium">{r.name}</span>
                    <span className="text-muted-foreground ml-1 text-xs">&lt;{r.email}&gt;</span>
                  </>
                ) : (
                  <span className="font-medium">{r.email}</span>
                )}
              </span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(r.email)}
                  className="rounded-full p-0.5 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                  aria-label={`Remove ${r.name || r.email}`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      ) : !disabled ? (
        <p className="text-xs text-muted-foreground py-1">No recipients yet. Click <strong>+ Add</strong> above.</p>
      ) : null}

      {!disabled && activePanel === "team" && canUseTeamSearch && (
        <TeamMemberSearchPanel
          assemblyId={assemblyId!}
          existingEmails={existingEmails}
          onAdd={handleAddReceiver}
          onClose={() => setActivePanel(null)}
        />
      )}
      {!disabled && activePanel === "people" && canUseTeamSearch && (
        <PeopleSearchPanel
          assemblyId={assemblyId!}
          existingEmails={existingEmails}
          onAdd={handleAddReceiver}
          onClose={() => setActivePanel(null)}
        />
      )}
      {!disabled && activePanel === "manual" && (
        <ManualEntryPanel
          existingEmails={existingEmails}
          onAdd={handleAddReceiver}
          onClose={() => setActivePanel(null)}
        />
      )}
      {!disabled && activePanel === "csv" && (
        <CsvUploadPanel
          existingEmails={existingEmails}
          onImport={handleCsvImport}
          onClose={() => setActivePanel(null)}
        />
      )}
    </div>
  );
}

function NumberStepper({
  value,
  onChange,
  min = 0,
  max = 999,
  label,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  label: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9 shrink-0"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <div className="flex flex-col items-center min-w-[4rem]">
        <Input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Math.min(max, Math.max(min, parseInt(e.target.value, 10) || 0)))}
          disabled={disabled}
          className="h-9 w-full text-center bg-background border-input [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-[10px] text-muted-foreground mt-0.5">{label}</span>
      </div>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9 shrink-0"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

interface SendTimeWindowFieldProps {
  value?: SendTimeWindow | null;
  onChange: (v: SendTimeWindow) => void;
  disabled?: boolean;
}

/** Default: all times, all days. User can restrict if desired. */
const DEFAULT_SEND_TIME_WINDOW: SendTimeWindow = {
  timezone: "America/Los_Angeles",
  startTimeOfDay: "00:00",
  endTimeOfDay: "23:59",
  allowedDaysOfWeek: [0, 1, 2, 3, 4, 5, 6],
};

function SendTimeWindowField({ value, onChange, disabled }: SendTimeWindowFieldProps) {
  const [tzOpen, setTzOpen] = useState(false);
  const initializedRef = useRef(false);
  const startTimeOfDay = value?.startTimeOfDay ?? "00:00";
  const endTimeOfDay = value?.endTimeOfDay ?? "23:59";
  const timezone = value?.timezone ?? "America/Los_Angeles";
  const allowedDaysOfWeek = value?.allowedDaysOfWeek ?? [0, 1, 2, 3, 4, 5, 6];

  useEffect(() => {
    if (initializedRef.current || disabled) return;
    if (value == null) {
      initializedRef.current = true;
      onChange(DEFAULT_SEND_TIME_WINDOW);
    }
  }, [value, disabled, onChange]);

  const update = (updates: Partial<SendTimeWindow>) => {
    onChange({
      timezone,
      startTimeOfDay,
      endTimeOfDay,
      allowedDaysOfWeek,
      ...updates,
    });
  };

  const toggleDay = (d: number) => {
    const next = allowedDaysOfWeek.includes(d)
      ? allowedDaysOfWeek.filter((x) => x !== d)
      : [...allowedDaysOfWeek, d].sort((a, b) => a - b);
    update({ allowedDaysOfWeek: next });
  };

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const timezones = POPULAR_TIMEZONES;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <Label className="text-xs font-medium text-muted-foreground">Start time</Label>
          <Input
            type="time"
            value={startTimeOfDay}
            onChange={(e) => update({ startTimeOfDay: e.target.value })}
            disabled={disabled}
            className="mt-1 bg-background border-input"
          />
        </div>
        <div>
          <Label className="text-xs font-medium text-muted-foreground">End time</Label>
          <Input
            type="time"
            value={endTimeOfDay}
            onChange={(e) => update({ endTimeOfDay: e.target.value })}
            disabled={disabled}
            className="mt-1 bg-background border-input"
          />
        </div>
      </div>
      <div>
        <Label className="text-xs font-medium text-muted-foreground">Timezone</Label>
        <Popover open={tzOpen} onOpenChange={setTzOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={tzOpen}
              className="mt-1 w-full justify-between font-normal bg-background"
            >
              {timezone}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search timezone..." className="h-9" />
              <CommandList>
                <CommandEmpty>No timezone found.</CommandEmpty>
                <CommandGroup>
                  {timezones.map((tz) => (
                    <CommandItem
                      key={tz}
                      value={tz}
                      onSelect={() => {
                        update({ timezone: tz });
                        setTzOpen(false);
                      }}
                    >
                      {tz}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      <div>
        <Label className="text-xs font-medium text-muted-foreground">Allowed days</Label>
        <div className="flex gap-2 mt-1 flex-wrap">
          {dayLabels.map((label, d) => (
            <Button
              key={d}
              type="button"
              variant={allowedDaysOfWeek.includes(d) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleDay(d)}
              disabled={disabled}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

const MAX_FOLLOW_UPS = 10;
const BODY_ROWS = 10;
const BODY_MIN_HEIGHT = "min-h-[200px]";

/** Renders email body as HTML when it contains HTML tags; otherwise preserves plain text with line breaks. */
function renderEmailBody(body: string): string {
  if (!body?.trim()) return "";
  if (body.includes("<") && body.includes(">")) {
    return DOMPurify.sanitize(body, {
      ALLOWED_TAGS: ["p", "br", "a", "strong", "em", "b", "i", "u", "ul", "ol", "li", "div", "span"],
      ALLOWED_ATTR: ["href", "target", "rel"],
    });
  }
  return body
    .split("\n")
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("");
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

interface EmailBodyFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  className?: string;
}

function EmailBodyField({ value, onChange, placeholder, disabled, rows = BODY_ROWS, className }: EmailBodyFieldProps) {
  return (
    <Tabs defaultValue="preview" className="w-full">
      <TabsList className="mb-2">
        <TabsTrigger value="preview">Preview</TabsTrigger>
        <TabsTrigger value="edit">Edit HTML</TabsTrigger>
      </TabsList>
      <TabsContent value="preview" className="mt-0">
        <div
          className={cn(
            "rounded-md border-2 border-border bg-background p-4 text-sm text-foreground",
            BODY_MIN_HEIGHT,
            "prose prose-sm max-w-none dark:prose-invert",
            "[&_p]:text-foreground [&_p]:my-2 [&_p]:first:mt-0 [&_p]:last:mb-0",
            "[&_li]:text-foreground [&_span]:text-foreground [&_div]:text-foreground",
            "[&_strong]:text-foreground [&_em]:text-foreground [&_b]:text-foreground [&_i]:text-foreground",
            "[&_a]:text-primary [&_a]:underline",
            "[&_code]:bg-muted [&_code]:text-foreground [&_pre]:bg-muted [&_pre]:border [&_pre]:border-border [&_pre]:text-foreground"
          )}
          dangerouslySetInnerHTML={{ __html: renderEmailBody(value || "") }}
        />
      </TabsContent>
      <TabsContent value="edit" className="mt-0">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={cn("resize-y bg-background font-mono text-sm", BODY_MIN_HEIGHT, className)}
          disabled={disabled}
        />
      </TabsContent>
    </Tabs>
  );
}

interface FollowUpEditorProps {
  followUp: EmailContent;
  index: number;
  onChange: (f: EmailContent) => void;
  onRemove?: () => void;
  onAddNext?: () => void;
  isLast?: boolean;
  canAddMore?: boolean;
  disabled?: boolean;
  defaultOpen?: boolean;
}

function FollowUpEditor({ followUp, index, onChange, onRemove, onAddNext, isLast, canAddMore, disabled, defaultOpen = false }: FollowUpEditorProps) {
  const { days, hours, secs } = secondsToDelay(followUp.followUpAfterSeconds ?? 0);

  const setDelay = (d: number, h: number, s: number) => {
    onChange({ ...followUp, followUpAfterSeconds: delayToSeconds(d, h, s) });
  };

  return (
    <Collapsible defaultOpen={defaultOpen} className="group">
      <Card className="border-border/40 bg-card">
        <div className="flex items-center">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex flex-1 items-center gap-2 p-4 text-left hover:bg-muted/50 transition-colors rounded-lg"
            >
              <ChevronRight className="h-4 w-4 shrink-0 transition-transform group-data-[state=open]:rotate-90" />
              <span className="font-medium text-foreground">Follow-up {index + 1}</span>
            </button>
          </CollapsibleTrigger>
          <div className="flex items-center gap-1 mr-2 shrink-0">
            {isLast && canAddMore && onAddNext && !disabled && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary"
                onClick={onAddNext}
                aria-label="Add follow-up"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
            {onRemove && !disabled && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={onRemove}
                aria-label="Remove follow-up"
              >
                <Minus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 space-y-4">
            <div className="max-w-2xl">
              <Label className="text-xs font-medium text-muted-foreground">Subject</Label>
              <Input
                value={followUp.title ?? ""}
                onChange={(e) => onChange({ ...followUp, title: e.target.value })}
                placeholder="Follow-up subject"
                disabled={disabled}
                className="mt-1 bg-background"
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Body</Label>
              <div className="mt-1">
                <EmailBodyField
                  value={followUp.body ?? ""}
                  onChange={(body) => onChange({ ...followUp, body })}
                  placeholder="Email body (HTML supported)..."
                  disabled={disabled}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground block mb-2">Send after</Label>
              <div className="flex flex-wrap gap-4">
                <NumberStepper
                  value={days}
                  onChange={(d) => setDelay(d, hours, secs)}
                  max={365}
                  label="days"
                  disabled={disabled}
                />
                <NumberStepper
                  value={hours}
                  onChange={(h) => setDelay(days, h, secs)}
                  max={23}
                  label="hours"
                  disabled={disabled}
                />
                <NumberStepper
                  value={secs}
                  onChange={(s) => setDelay(days, hours, s)}
                  max={59}
                  label="seconds"
                  disabled={disabled}
                />
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

interface EmailOutreachEditorProps {
  outreach: EmailOutreach;
  assemblyId?: string;
  onChange: (outreach: EmailOutreach) => void;
  onSave?: () => void;
  isSaving?: boolean;
  onSendOutreach?: () => void;
  isSending?: boolean;
  onAddFollowUp?: () => Promise<void>;
  isAddingFollowUp?: boolean;
  sessionId?: string;
  stepIndex?: number;
}

export function EmailOutreachEditor({
  outreach,
  assemblyId,
  onChange,
  onSave,
  isSaving = false,
  onSendOutreach,
  isSending = false,
  onAddFollowUp,
  isAddingFollowUp = false,
  sessionId,
  stepIndex,
}: EmailOutreachEditorProps) {
  const canSave = Boolean(onSave && sessionId !== undefined && stepIndex !== undefined);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const prevSavingRef = useRef(isSaving);

  useEffect(() => {
    if (prevSavingRef.current && !isSaving) {
      setSaveSuccess(true);
      const t = setTimeout(() => setSaveSuccess(false), 2500);
      return () => clearTimeout(t);
    }
    prevSavingRef.current = isSaving;
  }, [isSaving]);
  const canAddFollowUpViaApi = Boolean(onAddFollowUp && sessionId !== undefined && stepIndex !== undefined);
  const to = normalizeReceivers(outreach.to);
  const cc = normalizeReceivers(outreach.cc);
  const bcc = normalizeReceivers(outreach.bcc);
  const followUps = outreach.followUps ?? [];
  const sendTimeWindow = outreach.defaultSendTimeWindow ?? outreach.sendTimeWindow;

  const setReceivers = (field: "to" | "cc" | "bcc") => (receivers: EmailReceiver[]) => {
    onChange({ ...outreach, [field]: receivers });
  };

  const setFollowUp = (index: number) => (f: EmailContent) => {
    const next = [...followUps];
    next[index] = f;
    onChange({ ...outreach, followUps: next });
  };

  const addFollowUp = async () => {
    if (canAddFollowUpViaApi && onAddFollowUp) {
      await onAddFollowUp();
    } else {
      const newFu: EmailContent = {
        title: "Following up",
        body: "",
        followUpAfterSeconds: 259200,
      };
      onChange({ ...outreach, followUps: [...followUps, newFu] });
    }
  };

  const removeLastFollowUp = () => {
    if (followUps.length <= 1) return;
    onChange({ ...outreach, followUps: followUps.slice(0, -1) });
  };

  const setSendTimeWindow = (v: SendTimeWindow) => {
    onChange({ ...outreach, defaultSendTimeWindow: v, sendTimeWindow: v });
  };

  const [advancedOpen, setAdvancedOpen] = useState(false);

  return (
    <div className="space-y-8 min-w-0">
      {/* 1. Initial outreach first */}
      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground">Initial outreach</h4>
        <Card className="border-border/40 bg-card">
          <CardContent className="p-5 sm:p-6 md:p-8 space-y-5">
            <div className="max-w-2xl">
              <Label className="text-xs font-medium text-muted-foreground">Subject</Label>
              <Input
                value={outreach.initialOutreach?.title ?? ""}
                onChange={(e) =>
                  onChange({
                    ...outreach,
                    initialOutreach: { ...outreach.initialOutreach, title: e.target.value },
                  })
                }
                placeholder="Email subject"
                className="mt-1 bg-background"
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Body</Label>
              <div className="mt-1">
                <EmailBodyField
                  value={outreach.initialOutreach?.body ?? ""}
                  onChange={(body) =>
                    onChange({
                      ...outreach,
                      initialOutreach: { ...outreach.initialOutreach, body },
                    })
                  }
                  placeholder="Email body (HTML supported)..."
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 2. Follow-ups */}
      <section className="space-y-2">
        <h4 className="text-sm font-semibold text-foreground">Follow-ups</h4>
        {isAddingFollowUp && (
          <div className="flex items-center gap-2 py-3 px-4 rounded-lg bg-muted/50 border border-border/60 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            <span>Creating follow-up...</span>
          </div>
        )}
        {followUps.length > 0 && (
          <div className="space-y-2">
            {followUps.map((fu, idx) => (
              <FollowUpEditor
                key={idx}
                followUp={fu}
                index={idx}
                onChange={setFollowUp(idx)}
                onRemove={idx === followUps.length - 1 ? removeLastFollowUp : undefined}
                onAddNext={canAddFollowUpViaApi ? addFollowUp : undefined}
                isLast={idx === followUps.length - 1}
                canAddMore={followUps.length < MAX_FOLLOW_UPS}
                disabled={isAddingFollowUp}
                defaultOpen={false}
              />
            ))}
          </div>
        )}
        {followUps.length === 0 && canAddFollowUpViaApi && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addFollowUp}
            className="gap-1.5"
            disabled={isAddingFollowUp}
          >
            {isAddingFollowUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add follow-up
          </Button>
        )}
      </section>

      {/* 3. To (recipients) - no "Recipients" label, just To field */}
      <section className="space-y-2">
        <EmailListField label="to" receivers={to} onChange={setReceivers("to")} onCsvUpload={(r) => setReceivers("to")(r)} assemblyId={assemblyId} />
      </section>

      {/* 4. Advanced options (collapsed by default) - Send time window, CC, BCC, Reply-to */}
      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <button
          type="button"
          onClick={() => setAdvancedOpen((prev) => !prev)}
          className="flex w-full items-center justify-between py-2.5 px-3 rounded-md hover:bg-muted/50 transition-colors text-sm font-medium text-foreground"
        >
          <span>Advanced options</span>
          {advancedOpen ? (
            <ChevronUp className="h-4 w-4 shrink-0" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0" />
          )}
        </button>
        <CollapsibleContent>
          <div className="pt-4 space-y-6 border-t mt-2">
            <div>
              <h5 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">Send time window</h5>
              <p className="text-xs text-muted-foreground mb-3">Window during which emails may be sent (e.g. 9am–5pm)</p>
              <SendTimeWindowField value={sendTimeWindow} onChange={setSendTimeWindow} />
            </div>
            <div className="space-y-4">
              <EmailListField label="cc" receivers={cc} onChange={setReceivers("cc")} assemblyId={assemblyId} />
              <EmailListField label="bcc" receivers={bcc} onChange={setReceivers("bcc")} assemblyId={assemblyId} />
            </div>
            <div className="max-w-2xl">
              <Label className="text-xs font-medium text-muted-foreground">Reply-to</Label>
              <Input
                type="email"
                placeholder="reply-to@example.com"
                value={outreach.replyTo ?? ""}
                onChange={(e) => onChange({ ...outreach, replyTo: e.target.value || undefined })}
                className="mt-1 bg-background"
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {canSave && (
        <FlowStepActions>
          <Button
            onClick={onSave}
            disabled={isSaving || saveSuccess}
            variant={saveSuccess ? "outline" : "default"}
            className={cn("gap-2 transition-all duration-300", saveSuccess && "border-green-500 text-green-600 dark:text-green-400")}
            size="lg"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : saveSuccess ? (
              <motion.span initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Saved
              </motion.span>
            ) : (
              "Save"
            )}
          </Button>
        </FlowStepActions>
      )}
    </div>
  );
}
