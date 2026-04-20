import type { ProductFlowSession, ProductFlowSessionStatus, Participant } from '@/types/api'
import type { ProductFlowSession as OrchSession, ConversationSession } from '@/types/orchestration-dashboard-types'
import {
  AGILEONE_SUPPLIER_TEMPLATES,
  DEMO_ASSEMBLY_ID,
  DEMO_PRODUCT_FLOW_ID,
  DEMO_WORKFLOW_ID,
} from './supplier-template-flows'

export {
  AGILEONE_SUPPLIER_TEMPLATES,
  DEMO_ASSEMBLY_ID,
  DEMO_PRODUCT_FLOW_ID,
  DEMO_WORKFLOW_ID,
  findSupplierTemplateById,
} from './supplier-template-flows'
export const SUPPLIER_ONBOARDING_FLOW = AGILEONE_SUPPLIER_TEMPLATES[0]

export const DEMO_TEAM_MEMBER_ID = 'tm-demo-spe'

const now = Date.now()
const day = 86_400_000

function makeOrchSession(
  id: string,
  name: string,
  listStatus: ProductFlowSessionStatus,
  company: string,
  stageLabel: string,
): OrchSession {
  const created = now - Math.floor(3 + Math.random() * 17) * day
  const completed = listStatus === 'COMPLETED'
  return {
    id,
    productFlowId: DEMO_PRODUCT_FLOW_ID,
    name,
    userQuery: `Onboard ${company} for AgileOne MSP — ${stageLabel}`,
    teamMemberId: DEMO_TEAM_MEMBER_ID,
    assemblyId: DEMO_ASSEMBLY_ID,
    workflowId: DEMO_WORKFLOW_ID,
    currentStepIndex: completed ? 4 : listStatus === 'ACTIVE' ? 0 : 2,
    status: completed ? 'COMPLETED' : 'ACTIVE',
    createdAt: created,
    updatedAt: created + day,
    stepSessions: [
      {
        id: `${id}-s0`,
        productFlowSessionId: id,
        stepIndex: 0,
        stepType: 'INFORMATION',
        status: 'COMPLETED',
        updates: [
          {
            id: `${id}-u1`,
            productFlowStepSessionId: `${id}-s0`,
            type: 'INFO',
            title: 'Session plan generated',
            message:
              'Opening email, agenda, document requirements, validation rules, and reminder schedule (Day 3 / Day 7) are configured.',
            sourceSystem: 'demo',
            createdAt: created + 60_000,
          },
        ],
        retryCount: 0,
        createdAt: created,
        updatedAt: created + 60_000,
      },
      {
        id: `${id}-s1`,
        productFlowSessionId: id,
        stepIndex: 1,
        stepType: 'EMAIL_OUTREACH_CREATOR',
        status: listStatus === 'ACTIVE' ? 'IN_PROGRESS' : 'COMPLETED',
        updates: [],
        retryCount: 0,
        createdAt: created + 120_000,
        updatedAt: created + 180_000,
      },
    ],
    messages: [],
    metadata: {
      demoStage: stageLabel,
      company,
      supplierOnboardingId: `soi-${id.replace(/^pfs-/, '')}`,
    },
  }
}

function apiSessionFromOrch(o: OrchSession, listStatus: ProductFlowSessionStatus): ProductFlowSession {
  return {
    id: o.id,
    name: o.name,
    userQuery: o.userQuery,
    productFlowId: o.productFlowId,
    teamMemberId: o.teamMemberId,
    assemblyId: o.assemblyId,
    workflowId: o.workflowId,
    status: listStatus,
    currentStepIndex: o.currentStepIndex,
    stepSessions: o.stepSessions?.map((s) => ({
      stepIndex: s.stepIndex,
      status: s.status,
      name: s.stepType,
    })),
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    metadata: o.metadata as Record<string, unknown>,
  }
}

const seedPairs: { orch: OrchSession; listStatus: ProductFlowSessionStatus }[] = [
  { orch: makeOrchSession('pfs-novus-001', 'Novus Staffing LLC — onboarding', 'IN_PROGRESS', 'Novus Staffing LLC', 'In progress'), listStatus: 'IN_PROGRESS' },
  { orch: makeOrchSession('pfs-harbor-002', 'Harbor Ridge Contractors', 'ACTIVE', 'Harbor Ridge Contractors', 'Invited'), listStatus: 'ACTIVE' },
  { orch: makeOrchSession('pfs-summit-003', 'Summit Field Services', 'IN_PROGRESS', 'Summit Field Services', 'Pending SPE review'), listStatus: 'IN_PROGRESS' },
  { orch: makeOrchSession('pfs-pioneer-004', 'Pioneer Clinical Staffing', 'COMPLETED', 'Pioneer Clinical Staffing', 'Approved'), listStatus: 'COMPLETED' },
  { orch: makeOrchSession('pfs-apex-005', 'Apex Industrial Partners', 'IN_PROGRESS', 'Apex Industrial Partners', 'Needs info'), listStatus: 'IN_PROGRESS' },
]

export const demoOrchestrationSessions: Map<string, OrchSession> = new Map(
  seedPairs.map(({ orch }) => [orch.id, { ...orch, stepSessions: orch.stepSessions?.map((s) => ({ ...s })) }]),
)

export let demoApiSessions: ProductFlowSession[] = seedPairs.map(({ orch, listStatus }) => apiSessionFromOrch(orch, listStatus))

export const demoParticipants: Participant[] = [
  {
    id: 'part-novus',
    reference: 'soi-novus-001',
    firstName: 'Jordan',
    lastName: 'Reyes',
    email: 'j.reyes@novusstaffing.example',
    company: 'Novus Staffing LLC',
    phone: '+1 312 555 0142',
    domainOwner: 'ASSEMBLY_LINE',
    domainOwnerId: DEMO_ASSEMBLY_ID,
    tags: ['supplier', 'general-staffing', 'il'],
    status: 'ACTIVE',
    aiGeneratedSummary:
      'Primary contact for AgileOne — General Staffing. COI uploaded; MSA e-sign in progress.',
  },
  {
    id: 'part-harbor',
    reference: 'soi-harbor-002',
    firstName: 'Sam',
    lastName: 'Okonkwo',
    email: 's.okonkwo@harborridge.example',
    company: 'Harbor Ridge Contractors',
    domainOwner: 'ASSEMBLY_LINE',
    domainOwnerId: DEMO_ASSEMBLY_ID,
    tags: ['supplier', 'healthcare', 'ca'],
    status: 'PENDING',
  },
  {
    id: 'part-summit',
    reference: 'soi-summit-003',
    firstName: 'Taylor',
    lastName: 'Nguyen',
    email: 't.nguyen@summitfield.example',
    company: 'Summit Field Services',
    domainOwner: 'ASSEMBLY_LINE',
    domainOwnerId: DEMO_ASSEMBLY_ID,
    tags: ['supplier', 'general-staffing', 'tx'],
    status: 'ACTIVE',
  },
]

export const demoConversationSessions: ConversationSession[] = [
  {
    id: 'conv-demo-001',
    type: 'VIDEO_CALL',
    conversationId: 'ctpl-supplier-onboarding',
    assemblyLineID: DEMO_ASSEMBLY_ID,
    workflowID: DEMO_WORKFLOW_ID,
    sessionComplete: false,
    createdAt: now - 2 * day,
    title: 'Novus Staffing — document collection',
    summary: 'COI validated; W-9 extracted; awaiting MSA e-sign.',
    messages: [],
    participants: ['part-novus'],
  },
  {
    id: 'conv-demo-002',
    type: 'VIDEO_CALL',
    conversationId: 'ctpl-supplier-onboarding',
    assemblyLineID: DEMO_ASSEMBLY_ID,
    workflowID: DEMO_WORKFLOW_ID,
    sessionComplete: true,
    createdAt: now - 9 * day,
    title: 'Pioneer Clinical — completed onboarding',
    summary: 'All documents passed validation. SPE approved.',
    messages: [],
    participants: ['part-novus'],
  },
]

let dispatcherMessages: import('@/types/api').DispatcherAgentMessage[] = [
  {
    role: 'ASSISTANT',
    content:
      'Welcome to the **AgileOne Supplier Onboarding** demo workspace. I can help you draft invites, review pipeline health, or explain exception handling for COIs and MSAs.\n\nTry: *"Which suppliers have a COI expiring in 30 days?"* or open **Program dashboard** in the sidebar.',
    createdAt: now - 3600_000,
  },
]

export function getDispatcherMessages() {
  return dispatcherMessages
}

export function pushDispatcherMessages(msgs: import('@/types/api').DispatcherAgentMessage[]) {
  dispatcherMessages = [...dispatcherMessages, ...msgs]
}

export function upsertSession(s: ProductFlowSession) {
  const idx = demoApiSessions.findIndex((x) => x.id === s.id)
  if (idx >= 0) demoApiSessions[idx] = s
  else demoApiSessions = [s, ...demoApiSessions]
}
