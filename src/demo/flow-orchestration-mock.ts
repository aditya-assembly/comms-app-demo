/**
 * Demo-only product flow session orchestration: aligns {@link ProductFlowSession}
 * step state with template {@link ProductFlow.flowSteps} so FlowSessionExecution
 * receives real INFORMATION / EMAIL / TEMPLATE / ACTION steps (not a single stub).
 */
import type {
  ProductFlow,
  ProductFlowSession as OrchSession,
  ProductFlowStepSession,
  ProductFlowStepUnion,
  StepResponse,
} from '@/types/orchestration-dashboard-types'
import { AGILEONE_SUPPLIER_TEMPLATES, findSupplierTemplateById } from '@/demo/supplier-template-flows'

export function getProductFlowForSession(productFlowId: string | undefined): ProductFlow {
  return findSupplierTemplateById(productFlowId ?? '') ?? AGILEONE_SUPPLIER_TEMPLATES[0]
}

function stepTypeFromUnion(step: ProductFlowStepUnion): ProductFlowStepSession['stepType'] {
  return step.type as ProductFlowStepSession['stepType']
}

export function cloneFlowStep(step: ProductFlowStepUnion): ProductFlowStepUnion {
  return JSON.parse(JSON.stringify(step)) as ProductFlowStepUnion
}

/**
 * Rebuilds {@link OrchSession.stepSessions} from the product flow definition and
 * {@link OrchSession.currentStepIndex}. Call after loading or mutating session state.
 */
export function reconcileProductFlowStepSessions(orch: OrchSession): void {
  const flow = getProductFlowForSession(orch.productFlowId)
  const definitions = flow.flowSteps
  const n = definitions.length
  if (n === 0) {
    orch.stepSessions = []
    return
  }

  const sessionDone = orch.status === 'COMPLETED'
  const cur = sessionDone ? n - 1 : Math.min(Math.max(0, orch.currentStepIndex), n - 1)
  orch.currentStepIndex = cur

  const existing = new Map<number, ProductFlowStepSession>()
  for (const s of orch.stepSessions ?? []) {
    existing.set(s.stepIndex, s)
  }

  const next: ProductFlowStepSession[] = []
  for (let i = 0; i < n; i++) {
    const prev = existing.get(i)
    let status: ProductFlowStepSession['status']
    if (sessionDone || i < cur) {
      status = 'COMPLETED'
    } else if (i === cur) {
      status = 'IN_PROGRESS'
    } else {
      status = 'PENDING'
    }

    const stepUnion = definitions[i]
    const merged: ProductFlowStepSession = {
      id: prev?.id ?? `${orch.id}-step-${i}`,
      productFlowSessionId: orch.id,
      stepIndex: i,
      stepType: stepTypeFromUnion(stepUnion),
      status,
      updates: prev?.updates ?? [],
      retryCount: prev?.retryCount ?? 0,
      createdAt: prev?.createdAt ?? orch.createdAt,
      updatedAt: orch.updatedAt,
      inputData: prev?.inputData,
      outputData: prev?.outputData,
      emailOutreachId: prev?.emailOutreachId ?? null,
      conversationConfigId: prev?.conversationConfigId ?? null,
      metadata: prev?.metadata,
    }
    next.push(merged)
  }
  orch.stepSessions = next
}

/**
 * Builds the current-step payload for the product flow session agent API.
 * {@link StepResponse.sessionStatus} must stay **ACTIVE** while steps are runnable;
 * use **COMPLETED** only when the flow is finished (FlowSessionExecution completion UI).
 */
export function buildMockStepResponse(orch: OrchSession): StepResponse {
  reconcileProductFlowStepSessions(orch)
  const flow = getProductFlowForSession(orch.productFlowId)
  const steps = flow.flowSteps
  const n = steps.length
  const lastIdx = Math.max(0, n - 1)
  const sessionCompleted = orch.status === 'COMPLETED'
  const idx = sessionCompleted ? lastIdx : Math.min(Math.max(0, orch.currentStepIndex), lastIdx)
  const step = cloneFlowStep(steps[idx])
  const stepSession = orch.stepSessions?.find((s) => s.stepIndex === idx)
  const hasNext = !sessionCompleted && idx < lastIdx

  const sessionStatus: StepResponse['sessionStatus'] = sessionCompleted ? 'COMPLETED' : 'ACTIVE'

  const pending = stepSession?.status === 'PENDING'
  const inProgress = stepSession?.status === 'IN_PROGRESS'

  return {
    stepIndex: idx,
    step,
    stepSession,
    progress: {
      current: sessionCompleted ? n : idx + 1,
      total: n,
      percentage: n > 0 ? Math.round(((sessionCompleted ? n : idx + 1) / n) * 100) : 0,
    },
    transition: {
      willAutoAdvance: false,
      requiresManualAdvance: true,
      hasNextStep: hasNext,
      nextStep: hasNext ? cloneFlowStep(steps[idx + 1]) : undefined,
      nextStepWillAutoAdvance: false,
    },
    canStart: pending && !sessionCompleted,
    canComplete: inProgress && !sessionCompleted,
    canMoveToNext:
      !sessionCompleted &&
      stepSession?.status === 'COMPLETED' &&
      idx < lastIdx,
    sessionStatus,
    previousStepOutput: idx > 0 ? orch.stepSessions?.find((s) => s.stepIndex === idx - 1)?.outputData : undefined,
  }
}
