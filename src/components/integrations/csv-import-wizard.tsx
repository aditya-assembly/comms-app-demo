import { useCallback, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CloudArrowUp, Check, Warning, X, FileText, ArrowsClockwise } from "@phosphor-icons/react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { commsAPI } from "@/services/comms-api";
import type {
  ParticipantImportItem,
  BatchParticipantResult,
  ParticipantImportConflict,
  ParticipantImportError,
} from "@/types/api";

type WizardStep = "upload" | "map" | "import" | "results";

const BATCH_SIZE = 10;

const PARTICIPANT_FIELDS: { key: string; label: string; required: boolean }[] = [
  { key: "email", label: "Email", required: true },
  { key: "firstName", label: "First Name", required: true },
  { key: "lastName", label: "Last Name", required: false },
  { key: "phone", label: "Phone", required: false },
  { key: "company", label: "Company", required: false },
  { key: "role", label: "Role", required: false },
  { key: "reference", label: "Reference", required: false },
  { key: "tags", label: "Tags", required: false },
  { key: "preferredChannel", label: "Preferred Channel", required: false },
];

const AUTO_MAP: Record<string, string> = {
  email: "email",
  "e-mail": "email",
  email_address: "email",
  emailaddress: "email",
  firstname: "firstName",
  first_name: "firstName",
  "first name": "firstName",
  name: "firstName",
  lastname: "lastName",
  last_name: "lastName",
  "last name": "lastName",
  surname: "lastName",
  phone: "phone",
  telephone: "phone",
  phone_number: "phone",
  mobile: "phone",
  company: "company",
  organization: "company",
  organisation: "company",
  role: "role",
  title: "role",
  job_title: "role",
  jobtitle: "role",
  "job title": "role",
  reference: "reference",
  ref: "reference",
  tags: "tags",
  preferredchannel: "preferredChannel",
  preferred_channel: "preferredChannel",
  channel: "preferredChannel",
};

const STEPS: { key: WizardStep; label: string }[] = [
  { key: "upload", label: "Upload" },
  { key: "map", label: "Map Columns" },
  { key: "import", label: "Import" },
  { key: "results", label: "Results" },
];

function stepIndex(s: WizardStep): number {
  return STEPS.findIndex((x) => x.key === s);
}

interface CsvImportWizardProps {
  onClose: () => void;
}

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map((line) =>
    line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""))
  );
  return { headers, rows };
}

function autoDetectMappings(headers: string[]): Record<number, string> {
  const mappings: Record<number, string> = {};
  const usedFields = new Set<string>();
  for (let i = 0; i < headers.length; i++) {
    const normalized = headers[i].toLowerCase().trim();
    const field = AUTO_MAP[normalized];
    if (field && !usedFields.has(field)) {
      mappings[i] = field;
      usedFields.add(field);
    }
  }
  return mappings;
}

function buildImportItems(
  rows: string[][],
  mappings: Record<number, string>
): ParticipantImportItem[] {
  return rows
    .map((row) => {
      const item: Record<string, unknown> = {};
      for (const [colIdx, field] of Object.entries(mappings)) {
        const val = row[Number(colIdx)]?.trim();
        if (!val) continue;
        if (field === "tags") {
          item[field] = val.split(";").map((t) => t.trim()).filter(Boolean);
        } else {
          item[field] = val;
        }
      }
      return item as unknown as ParticipantImportItem;
    })
    .filter((item) => item.email && item.firstName);
}

function fieldLabel(key: string): string {
  return PARTICIPANT_FIELDS.find((f) => f.key === key)?.label ?? key;
}

export function CsvImportWizard({ onClose }: CsvImportWizardProps) {
  const { selectedAssemblyId } = useWorkspaceStore();
  const [step, setStep] = useState<WizardStep>("upload");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [fileName, setFileName] = useState("");

  const [mappings, setMappings] = useState<Record<number, string>>({});

  const [progress, setProgress] = useState(0);
  const [totalRows, setTotalRows] = useState(0);

  const [createdCount, setCreatedCount] = useState(0);
  const [updatedCount, setUpdatedCount] = useState(0);
  const [allConflicts, setAllConflicts] = useState<ParticipantImportConflict[]>([]);
  const [allErrors, setAllErrors] = useState<ParticipantImportError[]>([]);
  const [overwriting, setOverwriting] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleFileLoad = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const { headers: h, rows: r } = parseCsv(text);
      setHeaders(h);
      setRows(r);
      setFileName(file.name);
      setMappings(autoDetectMappings(h));
      setStep("map");
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && (file.name.endsWith(".csv") || file.type === "text/csv")) {
        handleFileLoad(file);
      }
    },
    [handleFileLoad]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileLoad(file);
    },
    [handleFileLoad]
  );

  const mappedFields = new Set(Object.values(mappings));
  const canProceed = mappedFields.has("email") && mappedFields.has("firstName");
  const mappedCount = Object.keys(mappings).length;

  const setMapping = (colIdx: number, field: string) => {
    setMappings((prev) => {
      const next = { ...prev };
      if (field === "__skip__") {
        delete next[colIdx];
      } else {
        for (const [k, v] of Object.entries(next)) {
          if (v === field) delete next[Number(k)];
        }
        next[colIdx] = field;
      }
      return next;
    });
  };

  const startImport = async () => {
    if (!selectedAssemblyId) return;
    const items = buildImportItems(rows, mappings);
    setTotalRows(items.length);
    setProgress(0);
    setCreatedCount(0);
    setUpdatedCount(0);
    setAllConflicts([]);
    setAllErrors([]);
    setImporting(true);
    setStep("import");

    let created = 0;
    let updated = 0;
    const conflicts: ParticipantImportConflict[] = [];
    const errors: ParticipantImportError[] = [];

    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);
      try {
        const result: BatchParticipantResult = await commsAPI.batchImportParticipants(
          selectedAssemblyId, batch, false
        );
        created += result.created.length;
        updated += result.updated.length;
        conflicts.push(...result.conflicts);
        errors.push(...result.errors);
      } catch (err) {
        for (const item of batch) {
          errors.push({
            importItem: item,
            message: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }
      setProgress(Math.min(i + BATCH_SIZE, items.length));
      setCreatedCount(created);
      setUpdatedCount(updated);
      setAllConflicts([...conflicts]);
      setAllErrors([...errors]);
    }

    setImporting(false);
    setStep("results");
  };

  const handleOverwriteAll = async () => {
    if (!selectedAssemblyId || allConflicts.length === 0) return;
    setOverwriting(true);
    const items = allConflicts.map((c) => c.importItem);
    let newUpdated = 0;
    const remainingErrors: ParticipantImportError[] = [];

    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);
      try {
        const result = await commsAPI.batchImportParticipants(selectedAssemblyId, batch, true);
        newUpdated += result.updated.length + result.created.length;
        remainingErrors.push(...result.errors);
      } catch (err) {
        for (const item of batch) {
          remainingErrors.push({
            importItem: item,
            message: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }
    }

    setUpdatedCount((prev) => prev + newUpdated);
    setAllConflicts([]);
    setAllErrors((prev) => [...prev, ...remainingErrors]);
    setOverwriting(false);
  };

  const currentIdx = stepIndex(step);

  return (
    <div className="max-w-4xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-2">
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 shrink-0">
          <ArrowLeft size={16} />
        </Button>
        <h2 className="text-base font-semibold">CSV Participant Import</h2>
      </div>

      {/* ── Step indicator ── */}
      <div className="flex items-center gap-1 mb-6 ml-11">
        {STEPS.map((s, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          return (
            <div key={s.key} className="flex items-center gap-1">
              {i > 0 && (
                <div className={`h-px w-6 ${done ? "bg-primary" : "bg-border"}`} />
              )}
              <div className="flex items-center gap-1.5">
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
                    done
                      ? "bg-primary text-primary-foreground"
                      : active
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {done ? <Check size={10} weight="bold" /> : i + 1}
                </div>
                <span
                  className={`text-[11px] font-medium ${
                    active ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Step: Upload ── */}
      {step === "upload" && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed p-20 transition-all cursor-pointer ${
            dragOver
              ? "border-primary bg-primary/5 shadow-sm"
              : "border-muted-foreground/20 hover:border-primary/40 hover:bg-muted/30"
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <CloudArrowUp size={32} weight="duotone" className="text-primary" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold">Drop a CSV file here or click to browse</p>
            <p className="text-xs text-muted-foreground">Supports .csv files with headers in the first row</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      )}

      {/* ── Step: Column Mapping ── */}
      {step === "map" && (
        <div className="space-y-6">
          {/* File info bar */}
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 border px-4 py-2.5">
            <FileText size={18} className="text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium truncate block">{fileName}</span>
            </div>
            <Badge variant="secondary" className="shrink-0 font-mono text-[11px]">
              {rows.length} rows
            </Badge>
            <Badge variant="secondary" className="shrink-0 font-mono text-[11px]">
              {headers.length} cols
            </Badge>
          </div>

          {/* Preview table with horizontal scroll */}
          <div className="rounded-xl border bg-white overflow-hidden">
            <div className="px-4 py-2.5 border-b bg-muted/40 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Data Preview
              </span>
              <span className="text-[10px] text-muted-foreground">
                Showing first {Math.min(5, rows.length)} of {rows.length} rows
              </span>
            </div>
            <ScrollArea className="w-full">
              <div className="min-w-max">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="px-3 py-2 text-left font-semibold text-muted-foreground bg-muted/20 sticky left-0 z-10 whitespace-nowrap w-8">
                        #
                      </th>
                      {headers.map((h, i) => {
                        const mapped = mappings[i];
                        return (
                          <th key={i} className="px-3 py-2 text-left whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-foreground">{h}</span>
                              {mapped && (
                                <Badge variant="outline" className="text-[9px] px-1 py-0 font-normal text-primary border-primary/30">
                                  {fieldLabel(mapped)}
                                </Badge>
                              )}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 5).map((row, ri) => (
                      <tr key={ri} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-3 py-2 text-muted-foreground font-mono bg-muted/10 sticky left-0 z-10">
                          {ri + 1}
                        </td>
                        {row.map((cell, ci) => (
                          <td key={ci} className="px-3 py-2 whitespace-nowrap max-w-[220px]">
                            <span className="truncate block" title={cell}>
                              {cell || <span className="text-muted-foreground/40 italic">empty</span>}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>

          {/* Column mapping */}
          <div className="rounded-xl border bg-white overflow-hidden">
            <div className="px-4 py-2.5 border-b bg-muted/40 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Column Mapping
              </span>
              <span className="text-[10px] text-muted-foreground">
                {mappedCount} of {headers.length} mapped
              </span>
            </div>
            <div className="divide-y">
              {headers.map((header, colIdx) => {
                const currentMapping = mappings[colIdx];
                const sampleValues = rows.slice(0, 3).map((r) => r[colIdx]).filter(Boolean);
                const isRequired = currentMapping === "email" || currentMapping === "firstName";

                return (
                  <div
                    key={colIdx}
                    className={`flex items-center gap-4 px-4 py-3 transition-colors ${
                      currentMapping ? "bg-primary/[0.02]" : ""
                    }`}
                  >
                    {/* CSV column name + sample */}
                    <div className="w-48 shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{header}</span>
                        {isRequired && (
                          <span className="text-[9px] font-bold text-primary bg-primary/10 rounded px-1 py-px">
                            REQ
                          </span>
                        )}
                      </div>
                      {sampleValues.length > 0 && (
                        <p className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[180px]" title={sampleValues.join(", ")}>
                          e.g. {sampleValues[0]}
                        </p>
                      )}
                    </div>

                    {/* Arrow */}
                    <ArrowRight size={14} className="text-muted-foreground/40 shrink-0" />

                    {/* Radix Select */}
                    <div className="flex-1 max-w-[240px]">
                      <Select
                        value={currentMapping ?? "__skip__"}
                        onValueChange={(val) => setMapping(colIdx, val)}
                      >
                        <SelectTrigger
                          className={`h-9 text-sm ${
                            currentMapping
                              ? "border-primary/30 bg-primary/[0.03]"
                              : "text-muted-foreground"
                          }`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__skip__">
                            <span className="text-muted-foreground">Skip this column</span>
                          </SelectItem>
                          {PARTICIPANT_FIELDS.map((f) => {
                            const taken = Object.entries(mappings).some(
                              ([k, v]) => v === f.key && Number(k) !== colIdx
                            );
                            return (
                              <SelectItem key={f.key} value={f.key} disabled={taken}>
                                <span className="flex items-center gap-2">
                                  {f.label}
                                  {f.required && (
                                    <span className="text-[9px] text-primary font-bold">*</span>
                                  )}
                                  {taken && (
                                    <span className="text-[9px] text-muted-foreground">(used)</span>
                                  )}
                                </span>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Status indicator */}
                    <div className="w-5 shrink-0">
                      {currentMapping && (
                        <Check size={14} weight="bold" className="text-primary" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Validation message + actions */}
          <div className="flex items-center justify-between">
            <div>
              {!canProceed && (
                <div className="flex items-center gap-2 text-amber-600">
                  <Warning size={14} weight="bold" />
                  <span className="text-xs font-medium">
                    Map at least <strong>Email</strong> and <strong>First Name</strong> to continue
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => { setStep("upload"); setHeaders([]); setRows([]); setMappings({}); }}
              >
                <ArrowLeft size={14} className="mr-1.5" />
                Back
              </Button>
              <Button disabled={!canProceed || !selectedAssemblyId} onClick={() => void startImport()}>
                Import {rows.length} participant{rows.length !== 1 ? "s" : ""}
                <ArrowRight size={14} className="ml-1.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step: Importing ── */}
      {step === "import" && (
        <div className="rounded-2xl border bg-white p-12 flex flex-col items-center gap-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
          <div className="text-center space-y-3 w-full max-w-xs">
            <p className="text-sm font-semibold">
              Importing participants
            </p>
            <Progress value={totalRows > 0 ? (progress / totalRows) * 100 : 0} className="h-2" />
            <p className="text-xs text-muted-foreground font-mono">
              {progress} / {totalRows} processed
            </p>
          </div>
          <div className="flex gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {createdCount} created
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> {allConflicts.length} conflicts
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> {allErrors.length} errors
            </span>
          </div>
        </div>
      )}

      {/* ── Step: Results ── */}
      {step === "results" && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-4 gap-3">
            <SummaryCard label="Created" count={createdCount} variant="success" />
            <SummaryCard label="Updated" count={updatedCount} variant="info" />
            <SummaryCard label="Conflicts" count={allConflicts.length} variant="warning" />
            <SummaryCard label="Errors" count={allErrors.length} variant="error" />
          </div>

          {/* Conflicts */}
          {allConflicts.length > 0 && (
            <div className="rounded-xl border bg-white overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b bg-amber-50/80">
                <div className="flex items-center gap-2">
                  <Warning size={16} weight="fill" className="text-amber-500" />
                  <span className="text-sm font-semibold text-amber-800">
                    {allConflicts.length} existing participant{allConflicts.length !== 1 ? "s" : ""}
                  </span>
                  <span className="text-xs text-amber-600">
                    — these records already exist and were not overwritten
                  </span>
                </div>
                <Button
                  size="sm"
                  disabled={overwriting}
                  onClick={() => void handleOverwriteAll()}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {overwriting ? (
                    <><Loader2 className="h-3 w-3 animate-spin mr-1.5" /> Overwriting…</>
                  ) : (
                    <><ArrowsClockwise size={13} className="mr-1.5" /> Overwrite All</>
                  )}
                </Button>
              </div>
              <ScrollArea className="max-h-[260px]">
                <div className="min-w-max">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">Email</th>
                        <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">CSV Name</th>
                        <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">Existing Name</th>
                        <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">CSV Company</th>
                        <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">Existing Company</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allConflicts.map((c, i) => (
                        <tr key={i} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-2 font-mono">{c.importItem.email}</td>
                          <td className="px-4 py-2 font-medium">
                            {c.importItem.firstName} {c.importItem.lastName ?? ""}
                          </td>
                          <td className="px-4 py-2 text-muted-foreground">
                            {c.existingParticipant.firstName} {c.existingParticipant.lastName ?? ""}
                          </td>
                          <td className="px-4 py-2">{c.importItem.company ?? "—"}</td>
                          <td className="px-4 py-2 text-muted-foreground">{c.existingParticipant.company ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          )}

          {/* Errors */}
          {allErrors.length > 0 && (
            <div className="rounded-xl border bg-white overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b bg-red-50/80">
                <X size={16} weight="bold" className="text-red-500" />
                <span className="text-sm font-semibold text-red-800">
                  {allErrors.length} error{allErrors.length !== 1 ? "s" : ""}
                </span>
              </div>
              <ScrollArea className="max-h-[200px]">
                <div className="min-w-max">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">Email</th>
                        <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">Name</th>
                        <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allErrors.map((e, i) => (
                        <tr key={i} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-2 font-mono">{e.importItem.email ?? "—"}</td>
                          <td className="px-4 py-2">{e.importItem.firstName ?? "—"}</td>
                          <td className="px-4 py-2 text-red-600">{e.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          )}

          {/* No issues */}
          {allConflicts.length === 0 && allErrors.length === 0 && (
            <div className="rounded-2xl border bg-emerald-50/50 p-8 flex flex-col items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <Check size={20} weight="bold" className="text-emerald-600" />
              </div>
              <p className="text-sm font-medium text-emerald-800">All participants imported successfully</p>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={onClose}>Done</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  count,
  variant,
}: {
  label: string;
  count: number;
  variant: "success" | "info" | "warning" | "error";
}) {
  const styles = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    error: "bg-red-50 text-red-700 border-red-200",
  };
  const icons = {
    success: <Check size={14} weight="bold" />,
    info: <Check size={14} weight="bold" />,
    warning: <Warning size={14} weight="bold" />,
    error: <X size={14} weight="bold" />,
  };
  return (
    <div className={`rounded-xl border px-4 py-3.5 text-center ${styles[variant]}`}>
      <div className="flex items-center justify-center gap-1.5 mb-0.5">
        {icons[variant]}
        <span className="text-xl font-bold tabular-nums">{count}</span>
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
    </div>
  );
}
