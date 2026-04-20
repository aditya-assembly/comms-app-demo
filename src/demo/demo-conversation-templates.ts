/**
 * Minimal template {@link Conversation} payloads for CONVERSATION_CREATOR_FROM_TEMPLATE steps.
 * IDs match {@link supplier-template-flows} {@code templateConversationId} values.
 */
import { DEMO_ASSEMBLY_ID } from '@/demo/supplier-template-flows'
import type { Conversation, ConversationItem } from '@/types/orchestration-dashboard-types'

const baseItems = (title: string): ConversationItem[] => [
  {
    type: 'QUESTION',
    title: `${title} — document checklist`,
    description: 'Supplier completes uploads and attestations in a guided flow.',
  },
  {
    type: 'MEDIA_REQUEST',
    title: 'Certificate of insurance',
    description: 'Minimum limits and named insured per program.',
  },
  {
    type: 'FORM_DATA',
    title: 'W-9 & banking',
    description: 'OCR-assisted EIN match and ACH details.',
  },
]

const templates: Record<string, Omit<Conversation, 'assemblyLineID'> & { assemblyLineID?: string }> = {
  'ctpl-supplier-onboarding': {
    id: 'ctpl-supplier-onboarding',
    name: 'Supplier onboarding — document collection',
    assemblyLineID: DEMO_ASSEMBLY_ID,
    conversationItems: baseItems('General staffing'),
    completionNotificationEmails: [],
  },
  'ctpl-supplier-healthcare': {
    id: 'ctpl-supplier-healthcare',
    name: 'Healthcare compliance packet',
    assemblyLineID: DEMO_ASSEMBLY_ID,
    conversationItems: baseItems('Healthcare'),
    completionNotificationEmails: [],
  },
  'ctpl-supplier-recert': {
    id: 'ctpl-supplier-recert',
    name: 'COI & attestations renewal',
    assemblyLineID: DEMO_ASSEMBLY_ID,
    conversationItems: baseItems('Recertification'),
    completionNotificationEmails: [],
  },
  'ctpl-supplier-multistate': {
    id: 'ctpl-supplier-multistate',
    name: 'Multi-state addenda',
    assemblyLineID: DEMO_ASSEMBLY_ID,
    conversationItems: baseItems('Multi-state'),
    completionNotificationEmails: [],
  },
  'ctpl-supplier-1099': {
    id: 'ctpl-supplier-1099',
    name: '1099 fast track',
    assemblyLineID: DEMO_ASSEMBLY_ID,
    conversationItems: baseItems('Sole prop'),
    completionNotificationEmails: [],
  },
  'ctpl-supplier-legal': {
    id: 'ctpl-supplier-legal',
    name: 'MSA + SOW legal package',
    assemblyLineID: DEMO_ASSEMBLY_ID,
    conversationItems: baseItems('Legal'),
    completionNotificationEmails: [],
  },
}

export function getDemoConversationTemplate(templateConversationId: string): Conversation {
  const row = templates[templateConversationId]
  if (row) {
    return { ...row, assemblyLineID: DEMO_ASSEMBLY_ID } as Conversation
  }
  return {
    id: templateConversationId,
    name: 'Conversation template (demo)',
    assemblyLineID: DEMO_ASSEMBLY_ID,
    conversationItems: baseItems('Demo'),
    completionNotificationEmails: [],
  }
}
