import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WorkspaceState {
  /** Currently selected workspace (assemblyId) */
  selectedAssemblyId: string | null
  selectedAssemblyName: string | null
  setWorkspace: (assemblyId: string, name: string) => void
  clearWorkspace: () => void
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      selectedAssemblyId: null,
      selectedAssemblyName: null,
      setWorkspace: (assemblyId, name) => set({ selectedAssemblyId: assemblyId, selectedAssemblyName: name }),
      clearWorkspace: () => set({ selectedAssemblyId: null, selectedAssemblyName: null }),
    }),
    { name: 'comms-demo-workspace' }
  )
)
