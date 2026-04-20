import { USE_CASES, type UseCase } from './useCases'

/** Hero mock: four non-hiring flows, then recruiting. */
export const HERO_DEMO_SLUGS = [
  'vendor-onboarding',
  'compliance-verification',
  'client-intake',
  'product-training',
  'candidate-screening',
] as const

export type HeroDemoSlug = (typeof HERO_DEMO_SLUGS)[number]

export type HeroSessionRow = {
  id: string
  label: string
  count: string
  status: 'done' | 'active' | 'paused'
  modeLabel: string
  detailLine: string
}

export const HERO_TAB_LABEL: Record<HeroDemoSlug, string> = {
  'vendor-onboarding': 'Vendor onboarding',
  'compliance-verification': 'Compliance',
  'client-intake': 'Client intake',
  'product-training': 'Training',
  'candidate-screening': 'Recruiting',
}

/** Sidebar rows per demo — clicking updates the session detail panel. */
export const HERO_SIDEBAR_BY_SLUG: Record<HeroDemoSlug, HeroSessionRow[]> = {
  'vendor-onboarding': [
    { id: 'vo-1', label: 'Vendor Onboarding', count: '9/12', status: 'active', modeLabel: 'Async · Email', detailLine: 'Harbor Health — W-9, COI, NDA, banking details' },
    { id: 'vo-2', label: 'Supplier recertification', count: '18/18', status: 'done', modeLabel: 'Async · Email', detailLine: 'Q4 cycle complete — approved to pay' },
    { id: 'vo-3', label: 'Contractor insurance', count: '4/7', status: 'active', modeLabel: 'Async · Email', detailLine: 'Three policies need endorsement updates' },
    { id: 'vo-4', label: 'Payment setup queue', count: '2/12', status: 'paused', modeLabel: 'Async · Email', detailLine: 'Paused for treasury review' },
  ],
  'compliance-verification': [
    { id: 'cv-1', label: 'Compliance Verification', count: '22/30', status: 'active', modeLabel: 'Async · Email', detailLine: 'COI renewals vs contract dates & endorsements' },
    { id: 'cv-2', label: 'SOC evidence window', count: '40/40', status: 'done', modeLabel: 'Async · Email', detailLine: 'Audit pack exported — all items PASS' },
    { id: 'cv-3', label: 'Privacy DPIA follow-ups', count: '3/8', status: 'active', modeLabel: 'Async · Email', detailLine: 'Flagged CONDITIONAL — legal review' },
    { id: 'cv-4', label: 'License verification (EU)', count: '0/14', status: 'paused', modeLabel: 'Async · Email', detailLine: 'Waiting on vendor legal contact' },
  ],
  'client-intake': [
    { id: 'ci-1', label: 'Client Intake', count: '1/1', status: 'active', modeLabel: 'Async · Email', detailLine: 'Veridian Care — pre-kickoff discovery' },
    { id: 'ci-2', label: 'Enterprise pilot scope', count: '3/5', status: 'active', modeLabel: 'Async · Email', detailLine: 'Stakeholders & constraints still open' },
    { id: 'ci-3', label: 'Renewal risk review', count: '2/2', status: 'done', modeLabel: 'Async · Email', detailLine: 'Brief synced to CS — agenda drafted' },
    { id: 'ci-4', label: 'Partner onboarding', count: '0/3', status: 'paused', modeLabel: 'Async · Email', detailLine: 'Kickoff moved; sessions paused' },
  ],
  'product-training': [
    { id: 'pt-1', label: 'Product Training', count: '18/24', status: 'active', modeLabel: 'Async · Email', detailLine: 'Helix CRM — pipeline feature + checks' },
    { id: 'pt-2', label: 'Enablement: security basics', count: '120/120', status: 'done', modeLabel: 'Async · Email', detailLine: 'All roles passed — exceptions: none' },
    { id: 'pt-3', label: 'Launch playbook drill', count: '7/10', status: 'active', modeLabel: 'Async · Email', detailLine: 'Remediation flags for 2 AEs' },
    { id: 'pt-4', label: 'Compliance micro-module', count: '0/80', status: 'paused', modeLabel: 'Async · Email', detailLine: 'Scheduled after policy sign-off' },
  ],
  'candidate-screening': [
    { id: 'cs-1', label: 'Candidate Screening', count: '5/8', status: 'active', modeLabel: 'Async · Email + SMS', detailLine: 'Warehouse leads — rubric scoring in progress' },
    { id: 'cs-2', label: 'Engineering screens', count: '12/12', status: 'done', modeLabel: 'Async · Email', detailLine: 'Shortlist delivered — 4 advance' },
    { id: 'cs-3', label: 'Support hiring loop', count: '3/6', status: 'active', modeLabel: 'Async · SMS', detailLine: 'Knockout rules applied; 1 partial' },
    { id: 'cs-4', label: 'Exec search — round 1', count: '1/4', status: 'paused', modeLabel: 'Sync · Phone', detailLine: 'Reschedule after travel conflict' },
  ],
}

export function getHeroDemos(): Array<{ slug: HeroDemoSlug; useCase: UseCase; sessions: HeroSessionRow[]; tabLabel: string }> {
  return HERO_DEMO_SLUGS.map(slug => ({
    slug,
    useCase: USE_CASES.find(u => u.slug === slug)!,
    sessions: HERO_SIDEBAR_BY_SLUG[slug],
    tabLabel: HERO_TAB_LABEL[slug],
  }))
}

/** Rough participant count for "Session created × N" from dispatch copy. */
export function heroParticipantCount(uc: UseCase): string {
  const m = uc.dispatchExample.match(/\b(\d{1,3})\b/)
  return m ? m[1] : '—'
}

/** Short AI response from conversation brief. */
export function heroAiSummary(uc: UseCase): string {
  const t = uc.conversationBrief
  if (t.length <= 220) return t
  return `${t.slice(0, 217)}…`
}
