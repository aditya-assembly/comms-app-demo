import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merges Tailwind classes; later wins (e.g. `p-0` overrides default `p-6` on CardContent). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Detect if a string looks like a URL (with or without protocol).
 */
export function isUrl(str: string): boolean {
  try {
    const urlPattern = /^(https?:\/\/|www\.|ftp:\/\/)/i
    if (urlPattern.test(str)) {
      return true
    }
    const domainPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}(\/.*)?$/
    return domainPattern.test(str)
  } catch {
    return false
  }
}

export function formatUrl(url: string): string {
  // Add protocol if missing
  if (!url.match(/^https?:\/\//i) && !url.match(/^ftp:\/\//i)) {
    return 'https://' + url;
  }
  return url;
}
export function formatStatus(status: string): string {
  if (!status) return "";

  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' {
  const normalizedStatus = status?.toLowerCase()
  switch (normalizedStatus) {
    case 'completed':
    case 'resolved':
    case 'success':
      return 'success'
    case 'in_progress':
    case 'active':
    case 'processing':
      return 'info'
    case 'pending':
    case 'waiting':
    case 'draft':
      return 'warning'
    case 'failed':
    case 'post_action_failed':
    case 'error':
    case 'cancelled':
      return 'destructive'
    case 'closed':
    case 'abandoned':
    case 'blocked':
    case 'on_hold':
    case 'paused':
      return 'secondary'
    default:
      return 'outline'
  }
}

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}
