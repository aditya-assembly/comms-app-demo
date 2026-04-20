import type { ProductFlow } from '@/types/orchestration-dashboard-types'

/** Shared assembly for all AgileOne MSP demo templates */
export const DEMO_ASSEMBLY_ID = 'asm-demo-agileone-msp'

const now = Date.now()
const day = 86_400_000

const information = (name: string, description: string, content = '') =>
  ({ type: 'INFORMATION' as const, name, description, content })

const emailOutreach = (name: string, description: string) =>
  ({ type: 'EMAIL_OUTREACH_CREATOR' as const, name, description })

const fromTemplate = (name: string, description: string, templateConversationId: string) =>
  ({
    type: 'CONVERSATION_CREATOR_FROM_TEMPLATE' as const,
    name,
    description,
    templateConversationId,
  })

const action = (name: string, description: string, workflowTriggerId: string) =>
  ({ type: 'ACTION' as const, name, description, workflowTriggerId })

/**
 * Product flow templates for the AgileOne supplier / contractor onboarding demo.
 * Shown under Templates in the Comms shell; each can start a mocked session.
 */
export const AGILEONE_SUPPLIER_TEMPLATES: ProductFlow[] = [
  {
    id: 'pf-supplier-onboarding-domestic',
    name: 'Supplier onboarding — General Staffing (domestic)',
    description:
      'Full MSP path: COI, W-9, MSA, ACH, capability profile, conditional addenda. Reminders Day 3 / 7; SPE review gate.',
    assemblyId: DEMO_ASSEMBLY_ID,
    workflowId: 'wf-agileone-general-staffing',
    createdAt: now - 14 * day,
    flowSteps: [
      information('Program overview & checklist', 'What the supplier will complete in this program'),
      emailOutreach('Invite & resumable link', 'Email + web conversational UI'),
      fromTemplate('Guided document collection', 'COI, W-9, MSA, ACH, profile', 'ctpl-supplier-onboarding'),
      action('Auto-validation & exceptions', 'Coverage checks, OCR match, routing', 'trg-validation'),
      information('SPE review gate', 'Approve / needs info / reject'),
    ],
  },
  {
    id: 'pf-supplier-onboarding-healthcare',
    name: 'Supplier onboarding — Healthcare',
    description:
      'Higher COI limits, HIPAA / BAA addenda, facility access attestations, and healthcare-specific capability tags.',
    assemblyId: DEMO_ASSEMBLY_ID,
    workflowId: 'wf-agileone-healthcare',
    createdAt: now - 12 * day,
    flowSteps: [
      information('Healthcare program rules', 'HIPAA, BAA, and site-access requirements'),
      emailOutreach('Clinical staffing invite', 'Resumable link with healthcare checklist'),
      fromTemplate('Clinical compliance packet', 'COI, BAA, W-9, MSA, immunization / badge where required', 'ctpl-supplier-healthcare'),
      action('Clinical validation', 'Named insured, endorsements, expiry vs client contract', 'trg-healthcare-validation'),
      information('SPE clinical review', 'Program-specific approval'),
    ],
  },
  {
    id: 'pf-supplier-recertification',
    name: 'Annual recertification — COI & attestations',
    description:
      'Lightweight renewal: COI refresh, W-9 delta check, re-attestation. Triggers ~60 days before COI expiry in production.',
    assemblyId: DEMO_ASSEMBLY_ID,
    workflowId: 'wf-agileone-recert',
    createdAt: now - 10 * day,
    flowSteps: [
      information('Renewal scope', 'What changed since last approval'),
      emailOutreach('Renewal invite', 'Single link; prior artifacts pre-filled where allowed'),
      fromTemplate('COI & attestations only', 'Upload new COI; confirm no material change', 'ctpl-supplier-recert'),
      action('Diff vs prior filing', 'Flag deltas for SPE only if needed', 'trg-recert-diff'),
    ],
  },
  {
    id: 'pf-supplier-multistate',
    name: 'Multi-state operations — addenda pack',
    description:
      'Emphasis on state-specific addenda (e.g. CA, NY, TX) layered on top of the standard domestic pack.',
    assemblyId: DEMO_ASSEMBLY_ID,
    workflowId: 'wf-agileone-multistate',
    createdAt: now - 9 * day,
    flowSteps: [
      information('Operating states capture', 'Where the supplier places workers'),
      emailOutreach('Multi-state invite', 'Resumable; addenda unlock by state'),
      fromTemplate('Standard + state addenda', 'Per-state PDFs and acknowledgments', 'ctpl-supplier-multistate'),
      action('Addenda completeness', 'Required docs per state vs operations', 'trg-addenda-check'),
      information('SPE compliance review', 'State coverage sign-off'),
    ],
  },
  {
    id: 'pf-1099-sole-prop-onboarding',
    name: '1099 / sole proprietor — fast track',
    description:
      'W-9 and banking-heavy path for smaller vendors; reduced MSA scope where policy allows.',
    assemblyId: DEMO_ASSEMBLY_ID,
    workflowId: 'wf-agileone-1099',
    createdAt: now - 8 * day,
    flowSteps: [
      information('Sole prop eligibility', 'TIN match and banking rules'),
      emailOutreach('Fast-track invite', 'Mobile-friendly'),
      fromTemplate('W-9, ACH, light MSA', 'Streamlined conversation', 'ctpl-supplier-1099'),
      action('TIN / ACH verification', 'OCR + micro-deposit simulation', 'trg-1099-verify'),
    ],
  },
  {
    id: 'pf-msa-sow-legal-package',
    name: 'MSA + SOW legal package',
    description:
      'For suppliers needing executed MSA plus statement-of-work or rate card before staffing starts.',
    assemblyId: DEMO_ASSEMBLY_ID,
    workflowId: 'wf-agileone-msa-sow',
    createdAt: now - 7 * day,
    flowSteps: [
      information('Legal package overview', 'MSA, SOW, rate card, insurance cross-check'),
      emailOutreach('Legal invite', 'Sequential e-sign where configured'),
      fromTemplate('Document collection', 'Upload drafts; e-sign placeholders', 'ctpl-supplier-legal'),
      action('Legal & risk checklist', 'Parity with client paper', 'trg-legal-check'),
      information('SPE + legal handoff', 'Approval to go-live'),
    ],
  },
  {
    id: 'pf-post-approval-venda-handoff',
    name: 'Post-approval — Venda & SharePoint filing',
    description:
      'Optional follow-on flow after SPE approval: file to SharePoint library, trigger Venda / vendor portal setup (demo narrative).',
    assemblyId: DEMO_ASSEMBLY_ID,
    workflowId: 'wf-agileone-post-approval',
    createdAt: now - 6 * day,
    flowSteps: [
      information('Downstream actions', 'Where artifacts land and what Venda needs'),
      action('SharePoint folder provisioning', 'Program / supplier folder structure', 'trg-sharepoint-provision'),
      action('Venda setup request', 'Payment terms and vendor record', 'trg-venda-setup'),
      information('Completion notice', 'Supplier notified; SPE CC optional'),
    ],
  },
]

/** Primary template id (sessions seed data reference this) */
export const DEMO_PRODUCT_FLOW_ID = AGILEONE_SUPPLIER_TEMPLATES[0].id as string

/** Primary workflow id (matches first template; seed sessions use this) */
export const DEMO_WORKFLOW_ID = AGILEONE_SUPPLIER_TEMPLATES[0].workflowId as string

export function findSupplierTemplateById(productFlowId: string): ProductFlow | undefined {
  return AGILEONE_SUPPLIER_TEMPLATES.find((f) => f.id === productFlowId)
}
