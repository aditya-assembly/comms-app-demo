/**
 * Mock published workflow triggers for product-flow ACTION steps in comms-app-demo.
 * IDs match {@link supplier-template-flows} action steps' {@code workflowTriggerId}.
 */
import { TRIGGER_TYPES } from '@/config/orchestration-constants'
import type { WorkflowTriggerItem } from '@/types/orchestration-dashboard-types'

function trigger(
  id: string,
  workflowID: string,
  name: string,
  description: string,
): WorkflowTriggerItem {
  return {
    id,
    workflowID,
    name,
    description,
    externalID: id,
    type: TRIGGER_TYPES.START_PROCESS,
    requiredInputsList: [],
    optionalInputsList: [],
    published: true,
  }
}

/** One entry per ACTION step trigger id used in AgileOne demo templates. */
export const DEMO_WORKFLOW_TRIGGERS: WorkflowTriggerItem[] = [
  trigger(
    'trg-validation',
    'wf-agileone-general-staffing',
    'Auto-validation & exceptions',
    'Demo: simulates COI/W-9/MSA checks and exception routing.',
  ),
  trigger(
    'trg-healthcare-validation',
    'wf-agileone-healthcare',
    'Clinical validation',
    'Demo: healthcare endorsements and expiry checks.',
  ),
  trigger(
    'trg-recert-diff',
    'wf-agileone-recert',
    'Diff vs prior filing',
    'Demo: compares renewal packet to last approval.',
  ),
  trigger(
    'trg-addenda-check',
    'wf-agileone-multistate',
    'Addenda completeness',
    'Demo: required state addenda vs operations footprint.',
  ),
  trigger(
    'trg-1099-verify',
    'wf-agileone-1099',
    'TIN / ACH verification',
    'Demo: TIN match and micro-deposit simulation.',
  ),
  trigger(
    'trg-legal-check',
    'wf-agileone-msa-sow',
    'Legal & risk checklist',
    'Demo: MSA/SOW parity with client paper.',
  ),
  trigger(
    'trg-sharepoint-provision',
    'wf-agileone-post-approval',
    'SharePoint folder provisioning',
    'Demo: program/supplier folder structure.',
  ),
  trigger(
    'trg-venda-setup',
    'wf-agileone-post-approval',
    'Venda setup request',
    'Demo: vendor portal / payment terms handoff.',
  ),
]

export function getDemoTriggersForWorkflow(workflowId: string): WorkflowTriggerItem[] {
  return DEMO_WORKFLOW_TRIGGERS.filter((t) => t.workflowID === workflowId)
}
