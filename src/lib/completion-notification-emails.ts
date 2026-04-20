export function ensureCompletionEmailsIncludeMember(emails: string[], memberEmail?: string): string[] {
  if (!memberEmail) return emails
  if (emails.includes(memberEmail)) return emails
  return [...emails, memberEmail]
}

export function mergeTemplateCompletionEmails(templateEmails?: string[], existingEmails?: string[]): string[] {
  const set = new Set([...(existingEmails ?? []), ...(templateEmails ?? [])])
  return Array.from(set)
}
