export const PARTICIPANT_RECORD_STATUS_VALUES = ["ACTIVE", "INACTIVE", "ARCHIVED", "PENDING"] as const;

export type ParticipantRecordStatus = (typeof PARTICIPANT_RECORD_STATUS_VALUES)[number];

export const PARTICIPANT_RECORD_STATUS_OPTIONS: ReadonlyArray<{ value: ParticipantRecordStatus; label: string }> = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "ARCHIVED", label: "Archived" },
  { value: "PENDING", label: "Pending" },
];

export type ParticipantPreferredChannel = "EMAIL" | "SMS";

export const PARTICIPANT_PREFERRED_CHANNEL_OPTIONS: ReadonlyArray<{ value: ParticipantPreferredChannel; label: string }> = [
  { value: "EMAIL", label: "Email" },
  { value: "SMS", label: "SMS" },
];

export type ParticipantDomainOwnerOption = "NONE" | "ASSEMBLY_LINE" | "ORG";

export const PARTICIPANT_DOMAIN_OWNER_OPTIONS: ReadonlyArray<{ value: ParticipantDomainOwnerOption; label: string }> = [
  { value: "NONE", label: "Legacy (NONE)" },
  { value: "ASSEMBLY_LINE", label: "Assembly line" },
  { value: "ORG", label: "Organization" },
];

export function isParticipantRecordStatus(value: string | undefined | null): value is ParticipantRecordStatus {
  return value != null && (PARTICIPANT_RECORD_STATUS_VALUES as readonly string[]).includes(value);
}

export const PARTICIPANT_STATUS_UNSET = "__unset__";

export function participantStatusSelectOptions(current?: string | null): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [];
  const canonical = new Set<string>(PARTICIPANT_RECORD_STATUS_VALUES as readonly string[]);
  if (current && String(current).trim() && !canonical.has(String(current).trim())) {
    out.push({ value: current, label: `Legacy (${current})` });
  }
  out.push(...PARTICIPANT_RECORD_STATUS_OPTIONS);
  return out;
}

export function participantStatusSelectValue(status: string | undefined | null): string {
  if (status == null || String(status).trim() === "") return PARTICIPANT_STATUS_UNSET;
  return status;
}
