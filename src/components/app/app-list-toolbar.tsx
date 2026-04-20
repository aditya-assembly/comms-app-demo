import type { ReactNode } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Outer bar: use directly under the shell header on list screens. */
export const appListToolbarBarClass =
  'px-5 py-3 border-b border-[#E2E8F0] bg-white shrink-0'

/** Inner row: filters + search + actions. */
export function AppListToolbarRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex flex-wrap items-center gap-3', className)}>{children}</div>
}

/**
 * Pill-style filter control (status chips) — same family as session status filters.
 */
export function AppListFilterSegmentGroup({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-xl bg-[#F1F5F9] p-1 shrink-0">{children}</div>
  )
}

export const appListFilterSegmentButtonClass = (active: boolean) =>
  cn(
    'text-xs font-semibold px-3 py-1.5 rounded-lg transition-all',
    active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
  )

/** Secondary filters: dropdowns, tag field — same height as search. */
export const appListFilterControlClass =
  'h-10 rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-gray-700 outline-none transition-colors focus:border-brand-indigo/40 min-w-0'

export const appListToolbarMetaClass = 'text-xs text-gray-400 shrink-0'

type AppListSearchFieldProps = {
  value: string
  onChange: (value: string) => void
  placeholder: string
  className?: string
  'aria-label'?: string
  /** Show clear control when non-empty (default true). */
  clearable?: boolean
}

/**
 * Shared search field: icon, height, border, focus — use on Templates, Sessions, Conversations, People.
 */
export function AppListSearchField({
  value,
  onChange,
  placeholder,
  className,
  'aria-label': ariaLabel,
  clearable = true,
}: AppListSearchFieldProps) {
  return (
    <div className={cn('relative min-w-[200px] max-w-xl flex-1', className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] pl-9 pr-9 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-brand-indigo/40 focus:bg-white"
      />
      {clearable && value ? (
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          onClick={() => onChange('')}
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  )
}

type AppListToolbarIconButtonProps = {
  onClick: () => void
  disabled?: boolean
  children: ReactNode
  title?: string
}

/** Outline action (e.g. Refresh) — matches search height. */
export function AppListToolbarIconButton({ onClick, disabled, children, title }: AppListToolbarIconButtonProps) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white px-3 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
    >
      {children}
    </button>
  )
}
