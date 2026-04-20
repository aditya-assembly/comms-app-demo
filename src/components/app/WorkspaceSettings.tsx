import { useState, useEffect, useMemo } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X, Check, Search } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useWorkspaceStore } from '@/stores/workspace-store'
import type { OwnedAssemblyLine } from '@/types/api'

function matchesWorkspaceSearch(ws: OwnedAssemblyLine, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const name = ws.name?.toLowerCase() ?? ''
  const desc = ws.description?.toLowerCase() ?? ''
  const id = ws.assemblyLineID?.toLowerCase() ?? ''
  const workflowHit =
    ws.workflows?.some(
      (w) =>
        w.name?.toLowerCase().includes(q) ||
        (w.description?.toLowerCase() ?? '').includes(q) ||
        (w.id?.toLowerCase() ?? '').includes(q),
    ) ?? false
  return name.includes(q) || desc.includes(q) || id.includes(q) || workflowHit
}

export function WorkspaceSettings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const commsInfo = useAuthStore((s) => s.commsInfo)
  const { selectedAssemblyId, setWorkspace } = useWorkspaceStore()
  const workspaces = commsInfo?.ownedAssemblyLines ?? []
  const [search, setSearch] = useState('')

  const filteredWorkspaces = useMemo(
    () => workspaces.filter((ws) => matchesWorkspaceSearch(ws, search)),
    [workspaces, search],
  )

  useEffect(() => {
    if (open) setSearch('')
  }, [open])

  // Auto-select first workspace if none chosen
  useEffect(() => {
    if (!selectedAssemblyId && workspaces.length > 0) {
      const first = workspaces[0]
      setWorkspace(first.assemblyLineID, first.name)
    }
  }, [workspaces, selectedAssemblyId, setWorkspace])

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 flex max-h-[min(90vh,40rem)] w-full max-w-md flex-col bg-white rounded-2xl border border-gray-100 shadow-xl focus:outline-none">
          <div className="shrink-0 border-b border-gray-100 px-6 py-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-gray-900">Workspace Settings</h2>
              <DialogPrimitive.Close className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                <X className="w-4 h-4" />
              </DialogPrimitive.Close>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden px-6 pb-6 pt-4">
            {workspaces.length === 0 ? (
              <p className="text-sm text-gray-400">No workspaces found for your account.</p>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col gap-3">
                <div className="shrink-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Select workspace</p>
                  <div className="relative mt-2">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden />
                    <input
                      type="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by name, description, or ID…"
                      autoComplete="off"
                      className="w-full rounded-xl border border-gray-200 bg-[#F8FAFC] py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-brand-indigo/40 focus:ring-2 focus:ring-brand-indigo/15"
                    />
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 -mr-1">
                  <div className="space-y-2 pb-1">
                    {filteredWorkspaces.length === 0 ? (
                      <p className="py-6 text-center text-sm text-gray-400">No workspaces match your search.</p>
                    ) : (
                      filteredWorkspaces.map((ws) => {
                        const isSelected = selectedAssemblyId === ws.assemblyLineID
                        return (
                          <button
                            key={ws.assemblyLineID}
                            type="button"
                            onClick={() => {
                              setWorkspace(ws.assemblyLineID, ws.name)
                              onClose()
                            }}
                            className={`flex w-full items-start justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                              isSelected
                                ? 'border-brand-indigo/40 bg-brand-ghost ring-1 ring-brand-indigo/20'
                                : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900">{ws.name}</p>
                              {ws.description ? (
                                <p className="mt-0.5 line-clamp-2 text-xs text-gray-400">{ws.description}</p>
                              ) : null}
                            </div>
                            {isSelected ? (
                              <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-indigo" />
                            ) : null}
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
