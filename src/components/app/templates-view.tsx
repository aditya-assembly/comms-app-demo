import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Play, Eye, GitBranch, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { useAuthStore } from '@/stores/auth-store'
import {
  useCreateProductFlowSession,
  useProductFlowsByAssembly,
  queryKeys,
} from '@/hooks/use-comms-api'
import type { ProductFlow, ProductFlowStepUnion } from '@/types/orchestration-dashboard-types'
import { cn } from '@/lib/utils'
import {
  appListToolbarBarClass,
  AppListToolbarRow,
  AppListSearchField,
  AppListToolbarIconButton,
  appListToolbarMetaClass,
} from '@/components/app/app-list-toolbar'

const INITIAL_VISIBLE = 8
const LOAD_MORE = 8

function stepSummary(step: ProductFlowStepUnion, index: number): string {
  const n = step.name?.trim() || `Step ${index + 1}`
  return `${step.type}: ${n}`
}

interface TemplatesViewProps {
  onOpenSession: (sessionId: string) => void
}

export function TemplatesView({ onOpenSession }: TemplatesViewProps) {
  const queryClient = useQueryClient()
  const { selectedAssemblyId } = useWorkspaceStore()
  const assemblyId = selectedAssemblyId ?? ''
  const user = useAuthStore((s) => s.user)

  const [search, setSearch] = useState('')
  const [previewFlow, setPreviewFlow] = useState<ProductFlow | null>(null)
  const [pendingRun, setPendingRun] = useState<ProductFlow | null>(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE)

  const { data: flows = [], isLoading, isFetching, refetch } = useProductFlowsByAssembly(assemblyId, {
    enabled: Boolean(assemblyId),
  })

  const createSessionMutation = useCreateProductFlowSession()

  const defaultNote = useMemo(() => {
    const who = user?.name?.trim() || 'User'
    return `Created by ${who} at ${new Date().toLocaleString()}`
  }, [user?.name])

  useEffect(() => {
    if (pendingRun) {
      setNoteDraft(defaultNote)
    }
  }, [pendingRun, defaultNote])

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE)
  }, [search, flows.length])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return flows
    return flows.filter(
      (f) =>
        f.name?.toLowerCase().includes(q) ||
        (f.description ?? '').toLowerCase().includes(q),
    )
  }, [flows, search])

  const visibleFlows = filtered.slice(0, visibleCount)

  const handleRunClick = useCallback((flow: ProductFlow) => {
    setPendingRun(flow)
  }, [])

  const handleConfirmRun = useCallback(async () => {
    const flow = pendingRun
    if (!flow?.id || !assemblyId) return
    const wf = flow.workflowId
    if (!wf) return
    const note = noteDraft.trim() || defaultNote
    setPendingRun(null)
    try {
      const response = await createSessionMutation.mutateAsync({
        productFlowId: flow.id,
        assemblyId,
        workflowId: wf,
        note,
      })
      const sessionId = response.session.id
      // Server createSessionWithStepResponse auto-starts step 0; refresh caches before opening detail.
      await queryClient.invalidateQueries({ queryKey: queryKeys.currentStep(sessionId) })
      await queryClient.invalidateQueries({ queryKey: queryKeys.productFlowSession(sessionId) })
      onOpenSession(sessionId)
    } catch {
      /* toast from mutation */
    }
  }, [pendingRun, assemblyId, noteDraft, defaultNote, createSessionMutation, onOpenSession, queryClient])

  if (!assemblyId) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm text-gray-400">Select a workspace in Settings to view flow templates.</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#F8FAFC]">
      <div className={appListToolbarBarClass}>
        <AppListToolbarRow>
          <AppListSearchField
            value={search}
            onChange={setSearch}
            placeholder="Search templates…"
          />
          <AppListToolbarIconButton onClick={() => void refetch()} disabled={isFetching} title="Refresh">
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
          </AppListToolbarIconButton>
          <span className={appListToolbarMetaClass}>
            {filtered.length} template{filtered.length === 1 ? '' : 's'}
          </span>
        </AppListToolbarRow>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="mx-auto max-w-md py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm border border-[#E2E8F0]">
              <GitBranch className="h-7 w-7 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600">
              {search.trim() ? 'No templates match your search' : 'No product flow templates in this workspace'}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Templates are scoped to this assembly, same as the orchestration console.
            </p>
          </div>
        ) : (
          <>
            <div className="mx-auto flex max-w-2xl flex-col gap-4 pb-6">
              {visibleFlows.map((flow, index) => (
                <Card
                  key={flow.id ?? `flow-${index}`}
                  className="border border-[#E2E8F0] bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-ghost border border-brand-indigo/20">
                        <GitBranch className="h-5 w-5 text-brand-indigo" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-semibold text-gray-900">{flow.name || 'Untitled template'}</h3>
                        {flow.description ? (
                          <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{flow.description}</p>
                        ) : null}
                        <p className="mt-2 text-xs text-gray-400">
                          {(flow.flowSteps?.length ?? 0)} step
                          {(flow.flowSteps?.length ?? 0) === 1 ? '' : 's'}
                          {flow.workflowId ? (
                            <span className="ml-2 font-mono text-[10px] opacity-80">workflow {flow.workflowId.slice(0, 8)}…</span>
                          ) : null}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 rounded-lg border-[#E2E8F0]"
                        onClick={() => setPreviewFlow(flow)}
                      >
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        Preview
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="h-9 rounded-lg btn-primary"
                        onClick={() => handleRunClick(flow)}
                        disabled={!flow.id || !flow.workflowId || createSessionMutation.isPending}
                      >
                        <Play className="mr-1.5 h-3.5 w-3.5" />
                        Start
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {filtered.length > visibleCount && (
              <div className="flex justify-center pb-8">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setVisibleCount((c) => Math.min(c + LOAD_MORE, filtered.length))}
                >
                  Show more ({filtered.length - visibleCount} left)
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <Sheet open={previewFlow != null} onOpenChange={(o) => !o && setPreviewFlow(null)}>
        <SheetContent className="w-full overflow-y-auto border-l border-[#E2E8F0] bg-white p-0 sm:max-w-lg">
          {previewFlow && (
            <div className="flex h-full flex-col">
              <div className="border-b border-[#E2E8F0] px-5 py-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Template</p>
                <h2 className="mt-1 text-lg font-bold text-gray-900">{previewFlow.name}</h2>
                {previewFlow.description ? (
                  <p className="mt-2 text-sm text-gray-500">{previewFlow.description}</p>
                ) : null}
              </div>
              <div className="flex-1 space-y-3 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Steps</p>
                <ol className="list-decimal space-y-2 pl-5 text-sm text-gray-700">
                  {(previewFlow.flowSteps ?? []).map((step, i) => (
                    <li key={`${previewFlow.id}-s-${i}`}>{stepSummary(step, i)}</li>
                  ))}
                </ol>
                {!(previewFlow.flowSteps?.length ?? 0) ? (
                  <p className="text-sm text-gray-400">No steps listed for this template.</p>
                ) : null}
              </div>
              <div className="border-t border-[#E2E8F0] px-5 py-4">
                <Button
                  type="button"
                  className="w-full btn-primary"
                  onClick={() => {
                    setPreviewFlow(null)
                    handleRunClick(previewFlow)
                  }}
                  disabled={!previewFlow.id || !previewFlow.workflowId}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Start this template
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={pendingRun != null} onOpenChange={(o) => !o && setPendingRun(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Start session</DialogTitle>
            <DialogDescription>
              {pendingRun?.name
                ? `Create a new run from “${pendingRun.name}” with an optional note.`
                : 'Create a new product flow session.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <label className="text-xs font-medium text-gray-500" htmlFor="tmpl-note">
              Session note
            </label>
            <textarea
              id="tmpl-note"
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              rows={4}
              className={cn(
                'w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-sm text-gray-900',
                'outline-none focus:border-brand-indigo/40 focus:ring-2 focus:ring-brand-indigo/15',
              )}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setPendingRun(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="btn-primary"
              onClick={() => void handleConfirmRun()}
              disabled={createSessionMutation.isPending}
            >
              {createSessionMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting…
                </>
              ) : (
                'Create & open'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
