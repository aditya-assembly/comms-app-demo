import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  GoogleDriveLogo, ArrowSquareOut, Trash,
  CloudArrowUp, CheckCircle, XCircle, SpinnerGap,
  Clock, Folder, FolderOpen, PlugsConnected, Warning,
  CaretRight, House, ArrowClockwise, FolderPlus, Info,
} from '@phosphor-icons/react'
import { Server } from 'lucide-react'
import { toast } from 'sonner'
import { commsAPI } from '@/services/comms-api'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import type {
  IntegrationConnection, ExportJob,
  SftpConnectionRequest, ExportRequest, ProductFlowSession, FolderEntry,
} from '@/types/api'

const STATUS_BADGE: Record<string, string> = {
  CONNECTED: 'bg-green-100 text-green-700',
  DISCONNECTED: 'bg-gray-100 text-gray-500',
  ERROR: 'bg-red-100 text-red-700',
}

const JOB_ICON: Record<string, React.ReactNode> = {
  PENDING: <Clock size={16} className="text-muted-foreground" />,
  IN_PROGRESS: <SpinnerGap size={16} className="text-blue-500 animate-spin" />,
  COMPLETED: <CheckCircle size={16} weight="fill" className="text-green-600" />,
  FAILED: <XCircle size={16} weight="fill" className="text-red-600" />,
}

function formatDate(ms: number | undefined) {
  if (!ms) return '—'
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function ExportIntegrationsPanel() {
  const assemblyId = useWorkspaceStore((s) => s.selectedAssemblyId)
  const queryClient = useQueryClient()
  const [sftpDialogOpen, setSftpDialogOpen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null)
  const [folderPickerConnection, setFolderPickerConnection] = useState<IntegrationConnection | null>(null)

  const { data: connections = [] } = useQuery({
    queryKey: ['integration-connections', assemblyId],
    queryFn: () => commsAPI.listIntegrationConnections(assemblyId!),
    enabled: !!assemblyId,
  })

  const { data: exportHistory = [] } = useQuery({
    queryKey: ['export-history', assemblyId],
    queryFn: () => commsAPI.listExportHistory(assemblyId!),
    enabled: !!assemblyId,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => commsAPI.deleteIntegrationConnection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integration-connections'] })
      toast.success('Connection removed')
    },
    onError: () => toast.error('Failed to remove connection'),
  })

  const toggleAutoSyncMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => commsAPI.toggleAutoSync(id, enabled),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['integration-connections'] })
      toast.success(vars.enabled ? 'Auto-sync enabled' : 'Auto-sync disabled')
    },
    onError: () => toast.error('Failed to toggle auto-sync'),
  })

  const openOAuthPopup = useCallback(
    (provider: 'GOOGLE_DRIVE' | 'SHAREPOINT', authorizationUrl: string) => {
      const popup = window.open(authorizationUrl, '_blank', 'width=600,height=700')
      if (!popup) {
        toast.error('Popup blocked — please allow popups for this site')
        return
      }

      const finalize = async (success: boolean) => {
        await queryClient.invalidateQueries({ queryKey: ['integration-connections'] })
        if (!success) {
          toast.error('Authorization was cancelled or failed')
          return
        }
        if (!assemblyId) return
        const updated = await commsAPI.listIntegrationConnections(assemblyId)
        const conn = updated.find((c) => c.providerType === provider && !c.targetFolderPath)
        if (conn) setFolderPickerConnection(conn)
      }

      let done = false
      const cleanup = () => {
        if (done) return
        done = true
        clearInterval(interval)
        window.removeEventListener('message', onMessage)
      }

      const onMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return
        const data = event.data as { type?: string; success?: boolean } | null
        if (!data || data.type !== 'integration-oauth-result') return
        cleanup()
        finalize(!!data.success)
      }
      window.addEventListener('message', onMessage)

      const interval = setInterval(() => {
        if (popup.closed) {
          cleanup()
          // If the popup closed without posting a message (e.g., user closed it
          // manually before the backend redirected), still refresh and try to
          // surface a folder picker if a new connection slipped in.
          finalize(true)
        }
      }, 500)
    },
    [assemblyId, queryClient],
  )

  const handleConnectGoogle = useCallback(async () => {
    if (!assemblyId) return
    try {
      const { authorizationUrl } = await commsAPI.getGoogleOAuthUrl(assemblyId)
      openOAuthPopup('GOOGLE_DRIVE', authorizationUrl)
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to start Google OAuth'
      if (msg.includes('not configured')) {
        toast.error('Credential storage is not configured — contact your administrator')
      } else {
        toast.error(msg)
      }
    }
  }, [assemblyId, openOAuthPopup])

  const handleConnectSharePoint = useCallback(async () => {
    if (!assemblyId) return
    try {
      const { authorizationUrl } = await commsAPI.getSharePointOAuthUrl(assemblyId)
      openOAuthPopup('SHAREPOINT', authorizationUrl)
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to start SharePoint OAuth'
      if (msg.includes('not configured')) {
        toast.error('SharePoint OAuth is not configured — contact your administrator')
      } else {
        toast.error(msg)
      }
    }
  }, [assemblyId, openOAuthPopup])

  if (!assemblyId) {
    return (
      <div className="text-sm text-muted-foreground p-4">Select a workspace first.</div>
    )
  }

  const connectedProviders = new Set(connections.map((c) => c.providerType))
  const needsSetup = (c: IntegrationConnection) => !c.targetFolderPath && c.providerType !== 'SFTP'

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Connected Services
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {connectedProviders.has('GOOGLE_DRIVE') ? (
            connections.filter((c) => c.providerType === 'GOOGLE_DRIVE').map((c) => (
              <ConnectionCard
                key={c.id}
                connection={c}
                icon={<GoogleDriveLogo size={24} weight="fill" />}
                onDelete={() => deleteMutation.mutate(c.id)}
                onToggleAutoSync={(enabled) => toggleAutoSyncMutation.mutate({ id: c.id, enabled })}
                onExport={() => { setSelectedConnectionId(c.id); setExportDialogOpen(true) }}
                onPickFolder={needsSetup(c) ? () => setFolderPickerConnection(c) : undefined}
                onChangeFolder={() => setFolderPickerConnection(c)}
              />
            ))
          ) : (
            <ConnectButton
              label="Google Drive"
              icon={<GoogleDriveLogo size={24} weight="fill" className="text-blue-500" />}
              onClick={handleConnectGoogle}
            />
          )}

          {connectedProviders.has('SFTP') ? (
            connections.filter((c) => c.providerType === 'SFTP').map((c) => (
              <ConnectionCard
                key={c.id}
                connection={c}
                icon={<Server size={24} />}
                onDelete={() => deleteMutation.mutate(c.id)}
                onToggleAutoSync={(enabled) => toggleAutoSyncMutation.mutate({ id: c.id, enabled })}
                onExport={() => { setSelectedConnectionId(c.id); setExportDialogOpen(true) }}
              />
            ))
          ) : (
            <ConnectButton
              label="SFTP"
              icon={<Server size={24} className="text-gray-600" />}
              onClick={() => setSftpDialogOpen(true)}
            />
          )}

          {connectedProviders.has('SHAREPOINT') ? (
            connections.filter((c) => c.providerType === 'SHAREPOINT').map((c) => (
              <ConnectionCard
                key={c.id}
                connection={c}
                icon={<PlugsConnected size={24} weight="fill" />}
                onDelete={() => deleteMutation.mutate(c.id)}
                onToggleAutoSync={(enabled) => toggleAutoSyncMutation.mutate({ id: c.id, enabled })}
                onExport={() => { setSelectedConnectionId(c.id); setExportDialogOpen(true) }}
                onPickFolder={needsSetup(c) ? () => setFolderPickerConnection(c) : undefined}
                onChangeFolder={() => setFolderPickerConnection(c)}
              />
            ))
          ) : (
            <ConnectButton
              label="SharePoint"
              icon={<PlugsConnected size={24} className="text-blue-600" />}
              onClick={handleConnectSharePoint}
            />
          )}
        </div>
      </div>

      {exportHistory.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Export History
          </h3>
          <div className="rounded-xl border divide-y">
            {exportHistory.map((job) => (
              <ExportJobRow key={job.id} job={job} assemblyId={assemblyId} />
            ))}
          </div>
        </div>
      )}

      <SftpConnectionDialog
        open={sftpDialogOpen}
        onOpenChange={setSftpDialogOpen}
        assemblyId={assemblyId}
      />

      {selectedConnectionId && (
        <ExportSessionPickerDialog
          // Remount the dialog every time we open it for a (possibly new)
          // connection so its internal state (selected sessions, active job,
          // FAILED status) is fully reset between exports.
          key={selectedConnectionId + ':' + (exportDialogOpen ? 'open' : 'closed')}
          open={exportDialogOpen}
          onOpenChange={(v) => {
            setExportDialogOpen(v)
            if (!v) setSelectedConnectionId(null)
          }}
          assemblyId={assemblyId}
          connectionId={selectedConnectionId}
        />
      )}

      {folderPickerConnection && (
        <FolderPickerDialog
          connection={folderPickerConnection}
          onClose={() => {
            setFolderPickerConnection(null)
            queryClient.invalidateQueries({ queryKey: ['integration-connections'] })
          }}
        />
      )}
    </div>
  )
}

function ConnectionCard({
  connection, icon, onDelete, onToggleAutoSync, onExport, onPickFolder, onChangeFolder,
}: {
  connection: IntegrationConnection
  icon: React.ReactNode
  onDelete: () => void
  onToggleAutoSync: (enabled: boolean) => void
  onExport: () => void
  onPickFolder?: () => void
  onChangeFolder?: () => void
}) {
  const hasFolder = !!connection.targetFolderPath

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{connection.displayName}</p>
          <Badge className={`text-[10px] ${STATUS_BADGE[connection.status] || ''}`}>
            {connection.status}
          </Badge>
        </div>
      </div>

      {onPickFolder && !hasFolder && (
        <button
          type="button"
          onClick={onPickFolder}
          className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors"
        >
          <FolderOpen size={14} weight="fill" /> Choose export folder to get started
        </button>
      )}

      {hasFolder && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
            <Folder size={12} className="flex-shrink-0" />
            <span className="truncate">{connection.targetFolderPath}</span>
          </div>
          {onChangeFolder && (
            <button type="button" onClick={onChangeFolder}
              className="text-[10px] text-primary hover:underline flex-shrink-0 ml-2">
              Change
            </button>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Auto-sync</span>
        <Switch
          checked={connection.autoSyncEnabled}
          onCheckedChange={onToggleAutoSync}
        />
      </div>

      {connection.lastSyncAt && (
        <p className="text-xs text-muted-foreground">
          Last sync: {formatDate(connection.lastSyncAt)}
        </p>
      )}

      <Separator />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onExport}
          disabled={!hasFolder && connection.providerType !== 'SFTP'}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <CloudArrowUp size={14} /> Export
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex items-center justify-center rounded-lg border px-2 py-1.5 text-xs text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash size={14} />
        </button>
      </div>
    </div>
  )
}

function ConnectButton({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-start gap-3 rounded-xl border border-dashed bg-white p-4 text-left transition-all hover:border-primary/40 hover:shadow-sm"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted group-hover:bg-primary/10">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">Click to connect</p>
      </div>
    </button>
  )
}

function ExportJobRow({ job, assemblyId }: { job: ExportJob; assemblyId: string }) {
  const queryClient = useQueryClient()
  const percent = job.progress
    ? Math.round((job.progress.uploadedFiles / Math.max(job.progress.totalFiles, 1)) * 100)
    : 0

  const retryMutation = useMutation({
    mutationFn: () => commsAPI.retryExportJob(job.id, assemblyId),
    onSuccess: () => {
      toast.success('Export re-queued')
      queryClient.invalidateQueries({ queryKey: ['export-history'] })
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.message || e?.message || 'Failed to retry export'
      toast.error(msg)
    },
  })

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {JOB_ICON[job.status]}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">
          {job.triggerType === 'AUTO_SYNC' ? 'Auto-sync' : 'Manual export'} — {job.sessionIds.length} session{job.sessionIds.length !== 1 ? 's' : ''}
        </p>
        <p className="text-xs text-muted-foreground">{formatDate(job.createdAt)}</p>
        {job.status === 'IN_PROGRESS' && job.progress && (
          <Progress value={percent} className="h-1.5 mt-1" />
        )}
        {job.errorMessage && (
          <p className="text-xs text-red-500 mt-0.5 truncate">{job.errorMessage}</p>
        )}
      </div>
      {job.status === 'FAILED' && (
        <button
          type="button"
          onClick={() => retryMutation.mutate()}
          disabled={retryMutation.isPending}
          className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/5 disabled:opacity-50 transition-colors"
        >
          {retryMutation.isPending
            ? <SpinnerGap size={12} className="animate-spin" />
            : <ArrowClockwise size={12} />}
          Retry
        </button>
      )}
      {job.exportedFolderUrl && (
        <a href={job.exportedFolderUrl} target="_blank" rel="noopener noreferrer"
          className="text-xs text-primary hover:underline flex items-center gap-1">
          <Folder size={14} /> Open
        </a>
      )}
    </div>
  )
}

// ── Folder Picker (Google Drive & SharePoint) ──

function FolderPickerDialog({ connection, onClose }: {
  connection: IntegrationConnection
  onClose: () => void
}) {
  if (connection.providerType === 'GOOGLE_DRIVE') {
    return <GoogleDriveFolderPicker connection={connection} onClose={onClose} />
  }
  if (connection.providerType === 'SHAREPOINT') {
    return <SharePointFolderPicker connection={connection} onClose={onClose} />
  }
  return null
}

function GoogleDriveFolderPicker({ connection, onClose }: {
  connection: IntegrationConnection
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [breadcrumb, setBreadcrumb] = useState<{ id: string; name: string }[]>([
    { id: 'root', name: 'My Drive' },
  ])
  const [selectedFolder, setSelectedFolder] = useState<{ id: string; name: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [creatingNew, setCreatingNew] = useState(false)
  const [newFolderName, setNewFolderName] = useState('Assembly Exports')
  const [creating, setCreating] = useState(false)

  const currentParentId = breadcrumb[breadcrumb.length - 1].id
  const atRoot = breadcrumb.length === 1

  const { data: folders = [], isLoading } = useQuery({
    queryKey: ['gd-folders', connection.id, currentParentId],
    queryFn: () => commsAPI.listGoogleDriveFolders(connection.id, currentParentId),
  })

  const handleSelect = async () => {
    if (atRoot && !selectedFolder) {
      // Don't let users save "root" as the destination — we create a folder per
      // session at this path, and dumping them at the Drive root is messy.
      toast.error('Pick a folder, or create a new one')
      return
    }
    const target = selectedFolder ?? breadcrumb[breadcrumb.length - 1]
    setSaving(true)
    try {
      const displayName = `Google Drive — ${target.name}`
      await commsAPI.updateConnectionTarget(connection.id, target.id, displayName)
      toast.success(`Export folder set to "${target.name}"`)
      onClose()
    } catch {
      toast.error('Failed to save folder selection')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateFolder = async () => {
    const name = newFolderName.trim()
    if (!name) {
      toast.error('Folder name is required')
      return
    }
    setCreating(true)
    try {
      const created = await commsAPI.createGoogleDriveFolder(connection.id, name, currentParentId)
      await queryClient.invalidateQueries({ queryKey: ['gd-folders', connection.id, currentParentId] })
      setSelectedFolder(created)
      setCreatingNew(false)
      setNewFolderName('Assembly Exports')
      toast.success(`Created "${created.name}"`)
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to create folder'
      toast.error(msg)
    } finally {
      setCreating(false)
    }
  }

  const navigateInto = (folder: FolderEntry) => {
    setBreadcrumb((prev) => [...prev, { id: folder.id, name: folder.name }])
    setSelectedFolder(null)
    setCreatingNew(false)
  }

  const navigateTo = (index: number) => {
    setBreadcrumb((prev) => prev.slice(0, index + 1))
    setSelectedFolder(null)
    setCreatingNew(false)
  }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Choose Google Drive Folder</DialogTitle>
          <DialogDescription>
            Pick or create a folder. Each export will land in a session subfolder inside it.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-2 rounded-lg bg-blue-50 p-2.5 text-[11px] text-blue-800">
          <Info size={14} className="mt-0.5 flex-shrink-0" />
          <span>
            Assembly only has access to folders <strong>it creates</strong> in your Drive,
            so existing folders won't appear here. Use <strong>Create new folder</strong> to
            make a destination — you only need to do this once.
          </span>
        </div>

        <Breadcrumb items={breadcrumb} onNavigate={navigateTo} />

        <div className="max-h-60 overflow-y-auto rounded-lg border divide-y">
          {isLoading ? (
            <div className="flex items-center justify-center p-6">
              <SpinnerGap size={20} className="animate-spin text-muted-foreground" />
            </div>
          ) : folders.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              No folders here yet. Click <strong>Create new folder</strong> below.
            </p>
          ) : (
            folders.map((f) => (
              <FolderRow
                key={f.id}
                folder={f}
                selected={selectedFolder?.id === f.id}
                onSelect={() => setSelectedFolder(selectedFolder?.id === f.id ? null : f)}
                onOpen={() => navigateInto(f)}
              />
            ))
          )}
        </div>

        {creatingNew ? (
          <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
            <Label className="text-xs">
              Create folder in <strong>{breadcrumb[breadcrumb.length - 1].name}</strong>
            </Label>
            <div className="flex gap-2">
              <Input
                autoFocus
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !creating) handleCreateFolder() }}
                placeholder="Folder name"
                className="flex-1"
                disabled={creating}
              />
              <button type="button" onClick={handleCreateFolder} disabled={creating || !newFolderName.trim()}
                className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {creating ? <SpinnerGap size={12} className="animate-spin" /> : <FolderPlus size={12} />}
                Create
              </button>
              <button type="button" onClick={() => { setCreatingNew(false); setNewFolderName('Assembly Exports') }}
                disabled={creating}
                className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setCreatingNew(true)}
            className="inline-flex items-center gap-1.5 self-start rounded-lg border border-dashed px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/5 transition-colors">
            <FolderPlus size={14} /> Create new folder here
          </button>
        )}

        <DialogFooter className="flex gap-2">
          <button type="button" onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSelect}
            disabled={saving || (atRoot && !selectedFolder)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {saving && <SpinnerGap size={14} className="animate-spin" />}
            {selectedFolder
              ? `Select "${selectedFolder.name}"`
              : atRoot
                ? 'Pick or create a folder'
                : `Use "${breadcrumb[breadcrumb.length - 1].name}"`}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SharePointFolderPicker({ connection, onClose }: {
  connection: IntegrationConnection
  onClose: () => void
}) {
  const [selectedDrive, setSelectedDrive] = useState<FolderEntry | null>(null)
  const [breadcrumb, setBreadcrumb] = useState<{ id: string; name: string }[]>([])
  const [selectedFolder, setSelectedFolder] = useState<{ id: string; name: string } | null>(null)
  const [saving, setSaving] = useState(false)

  const { data: drives = [], isLoading: loadingDrives } = useQuery({
    queryKey: ['sp-drives', connection.id],
    queryFn: () => commsAPI.listSharePointDrives(connection.id),
    enabled: !selectedDrive,
  })

  const currentParentId = breadcrumb.length > 0 ? breadcrumb[breadcrumb.length - 1].id : 'root'

  const { data: folders = [], isLoading: loadingFolders } = useQuery({
    queryKey: ['sp-folders', connection.id, selectedDrive?.id, currentParentId],
    queryFn: () => commsAPI.listSharePointFolders(connection.id, selectedDrive!.id, currentParentId),
    enabled: !!selectedDrive,
  })

  const handleSelectDrive = (drive: FolderEntry) => {
    setSelectedDrive(drive)
    setBreadcrumb([{ id: 'root', name: drive.name }])
  }

  const handleSelect = async () => {
    if (!selectedDrive) return
    const target = selectedFolder ?? (breadcrumb.length > 0 ? breadcrumb[breadcrumb.length - 1] : null)
    if (!target) return

    setSaving(true)
    try {
      const targetPath = target.id === 'root' ? null : target.id
      const displayName = `SharePoint — ${selectedDrive.name}${target.id !== 'root' ? ' / ' + target.name : ''}`
      await commsAPI.updateConnectionTarget(connection.id, targetPath ?? selectedDrive.id, displayName)
      toast.success(`Export destination set to "${target.name}"`)
      onClose()
    } catch {
      toast.error('Failed to save folder selection')
    } finally {
      setSaving(false)
    }
  }

  const navigateInto = (folder: FolderEntry) => {
    setBreadcrumb((prev) => [...prev, { id: folder.id, name: folder.name }])
    setSelectedFolder(null)
  }

  const navigateTo = (index: number) => {
    setBreadcrumb((prev) => prev.slice(0, index + 1))
    setSelectedFolder(null)
  }

  const goBackToDrives = () => {
    setSelectedDrive(null)
    setBreadcrumb([])
    setSelectedFolder(null)
  }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Choose SharePoint Destination</DialogTitle>
          <DialogDescription>
            {!selectedDrive ? 'Select a document library.' : 'Select a folder within the library.'}
          </DialogDescription>
        </DialogHeader>

        {!selectedDrive ? (
          <div className="max-h-60 overflow-y-auto rounded-lg border divide-y">
            {loadingDrives ? (
              <div className="flex items-center justify-center p-6">
                <SpinnerGap size={20} className="animate-spin text-muted-foreground" />
              </div>
            ) : drives.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No document libraries found.</p>
            ) : (
              drives.map((d) => (
                <button key={d.id} type="button" onClick={() => handleSelectDrive(d)}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-left hover:bg-muted/50 transition-colors">
                  <Folder size={18} weight="fill" className="text-blue-500 flex-shrink-0" />
                  <span className="text-sm font-medium truncate">{d.name}</span>
                  <CaretRight size={14} className="ml-auto text-muted-foreground" />
                </button>
              ))
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-1 mb-1">
              <button type="button" onClick={goBackToDrives}
                className="text-xs text-primary hover:underline">
                Libraries
              </button>
              <CaretRight size={10} className="text-muted-foreground" />
              <Breadcrumb items={breadcrumb} onNavigate={navigateTo} />
            </div>

            <div className="max-h-60 overflow-y-auto rounded-lg border divide-y">
              {loadingFolders ? (
                <div className="flex items-center justify-center p-6">
                  <SpinnerGap size={20} className="animate-spin text-muted-foreground" />
                </div>
              ) : folders.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">No subfolders. You can select this folder.</p>
              ) : (
                folders.map((f) => (
                  <FolderRow
                    key={f.id}
                    folder={f}
                    selected={selectedFolder?.id === f.id}
                    onSelect={() => setSelectedFolder(selectedFolder?.id === f.id ? null : f)}
                    onOpen={() => navigateInto(f)}
                  />
                ))
              )}
            </div>
          </>
        )}

        <DialogFooter className="flex gap-2">
          <button type="button" onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
            Cancel
          </button>
          {selectedDrive && (
            <button
              type="button"
              onClick={handleSelect}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {saving && <SpinnerGap size={14} className="animate-spin" />}
              {selectedFolder
                ? `Select "${selectedFolder.name}"`
                : `Use "${breadcrumb[breadcrumb.length - 1]?.name ?? 'root'}"`}
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Breadcrumb({ items, onNavigate }: {
  items: { id: string; name: string }[]
  onNavigate: (index: number) => void
}) {
  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground overflow-x-auto">
      {items.map((item, i) => (
        <span key={item.id} className="flex items-center gap-1 flex-shrink-0">
          {i > 0 && <CaretRight size={10} />}
          {i === items.length - 1 ? (
            <span className="font-medium text-foreground flex items-center gap-1">
              {i === 0 && <House size={12} />} {item.name}
            </span>
          ) : (
            <button type="button" onClick={() => onNavigate(i)}
              className="hover:text-primary hover:underline flex items-center gap-1">
              {i === 0 && <House size={12} />} {item.name}
            </button>
          )}
        </span>
      ))}
    </div>
  )
}

function FolderRow({ folder, selected, onSelect, onOpen }: {
  folder: FolderEntry
  selected: boolean
  onSelect: () => void
  onOpen: () => void
}) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 transition-colors ${selected ? 'bg-primary/5' : 'hover:bg-muted/50'}`}>
      <button type="button" onClick={onSelect}
        className="flex items-center gap-2 flex-1 min-w-0 text-left">
        <div className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${selected ? 'bg-primary border-primary' : 'border-gray-300'}`}>
          {selected && <CheckCircle size={12} weight="bold" className="text-white" />}
        </div>
        <Folder size={16} weight={selected ? 'fill' : 'regular'} className={selected ? 'text-primary' : 'text-muted-foreground'} />
        <span className="text-sm truncate">{folder.name}</span>
      </button>
      <button type="button" onClick={onOpen}
        className="flex-shrink-0 p-1 rounded hover:bg-muted transition-colors" title="Open folder">
        <CaretRight size={14} className="text-muted-foreground" />
      </button>
    </div>
  )
}

// ── SFTP Connection Dialog ──

function SftpConnectionDialog({
  open, onOpenChange, assemblyId,
}: {
  open: boolean; onOpenChange: (open: boolean) => void; assemblyId: string
}) {
  const queryClient = useQueryClient()
  const [host, setHost] = useState('')
  const [port, setPort] = useState('22')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [privateKey, setPrivateKey] = useState('')
  const [authMode, setAuthMode] = useState<'password' | 'key'>('password')
  const [displayName, setDisplayName] = useState('')
  const [targetDirectory, setTargetDirectory] = useState('/')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const body: SftpConnectionRequest = {
        assemblyId, displayName, host, port: parseInt(port, 10), username, targetDirectory,
        ...(authMode === 'password' ? { password } : { privateKey }),
      }
      await commsAPI.createSftpConnection(body)
      queryClient.invalidateQueries({ queryKey: ['integration-connections'] })
      toast.success('SFTP connection created')
      onOpenChange(false)
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to create SFTP connection'
      if (msg.includes('not configured')) {
        setError('Credential storage is not configured — contact your administrator')
      } else {
        setError(msg)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const hasCredential = authMode === 'password' ? !!password : !!privateKey

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Connect SFTP</DialogTitle>
          <DialogDescription>Enter your SFTP server details.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label>Display Name</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="My SFTP Server" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2 space-y-1">
              <Label>Host *</Label>
              <Input value={host} onChange={(e) => setHost(e.target.value)} placeholder="sftp.example.com" />
            </div>
            <div className="space-y-1">
              <Label>Port</Label>
              <Input value={port} onChange={(e) => setPort(e.target.value)} type="number" />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Username *</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Authentication *</Label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setAuthMode('password')}
                className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${authMode === 'password' ? 'bg-primary text-white border-primary' : 'hover:bg-muted'}`}>
                Password
              </button>
              <button type="button" onClick={() => setAuthMode('key')}
                className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${authMode === 'key' ? 'bg-primary text-white border-primary' : 'hover:bg-muted'}`}>
                SSH Private Key
              </button>
            </div>
          </div>
          {authMode === 'password' ? (
            <div className="space-y-1">
              <Label>Password *</Label>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
            </div>
          ) : (
            <div className="space-y-1">
              <Label>Private Key (PEM) *</Label>
              <textarea
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;..."
                rows={5}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 font-mono text-xs resize-y"
              />
            </div>
          )}
          <div className="space-y-1">
            <Label>Export Directory</Label>
            <Input
              value={targetDirectory}
              onChange={(e) => setTargetDirectory(e.target.value)}
              placeholder="/exports/assembly"
            />
            <p className="text-[11px] text-muted-foreground">Remote directory where exports will be saved.</p>
          </div>
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700">
              <Warning size={16} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
        <DialogFooter>
          <button
            type="button"
            disabled={submitting || !host || !username || !hasCredential}
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {submitting && <SpinnerGap size={14} className="animate-spin" />}
            Connect
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Export Session Picker ──

function ExportSessionPickerDialog({
  open, onOpenChange, assemblyId, connectionId,
}: {
  open: boolean; onOpenChange: (open: boolean) => void; assemblyId: string; connectionId: string
}) {
  const queryClient = useQueryClient()
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set())
  const [exporting, setExporting] = useState(false)
  const [activeJobId, setActiveJobId] = useState<string | null>(null)

  const { data: sessionsData } = useQuery({
    queryKey: ['sessions-for-export', assemblyId],
    queryFn: () => commsAPI.searchProductFlowSessions({ assemblyId, page: 0, pageSize: 50 }),
    enabled: open && !!assemblyId,
  })

  const sessions: ProductFlowSession[] = sessionsData?.sessions ?? []

  const { data: jobStatus } = useQuery({
    queryKey: ['export-job', activeJobId],
    queryFn: () => commsAPI.getExportJobStatus(activeJobId!, assemblyId),
    enabled: !!activeJobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === 'PENDING' || status === 'IN_PROGRESS' ? 2000 : false
    },
  })

  const handleExport = async () => {
    if (selectedSessions.size === 0) return
    setExporting(true)
    try {
      const job = await commsAPI.triggerExport({
        assemblyId, connectionId, sessionIds: Array.from(selectedSessions),
      })
      setActiveJobId(job.id)
      toast.success('Export started')
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to start export'
      toast.error(msg)
      setExporting(false)
    }
  }

  const handleStartOver = () => {
    setActiveJobId(null)
    setExporting(false)
  }

  const handleRetry = async () => {
    if (!activeJobId) return
    setExporting(true)
    try {
      await commsAPI.retryExportJob(activeJobId, assemblyId)
      // Force the status query to refetch so refetchInterval re-engages
      // (it stops once status is COMPLETED/FAILED).
      queryClient.invalidateQueries({ queryKey: ['export-job', activeJobId] })
      queryClient.invalidateQueries({ queryKey: ['export-history'] })
      toast.success('Export re-queued')
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to retry export'
      toast.error(msg)
      setExporting(false)
    }
  }

  const toggleSession = (id: string) => {
    setSelectedSessions((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  const isComplete = jobStatus?.status === 'COMPLETED' || jobStatus?.status === 'FAILED'
  const progressPercent = jobStatus?.progress
    ? Math.round((jobStatus.progress.uploadedFiles / Math.max(jobStatus.progress.totalFiles, 1)) * 100)
    : 0

  useEffect(() => {
    if (isComplete && jobStatus) {
      queryClient.invalidateQueries({ queryKey: ['export-history'] })
      setExporting(false)
      if (jobStatus.status === 'COMPLETED') {
        toast.success('Export completed successfully')
      } else if (jobStatus.status === 'FAILED') {
        toast.error(jobStatus.errorMessage || 'Export failed')
      }
    }
  }, [isComplete, jobStatus, queryClient])

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!exporting || isComplete) onOpenChange(v) }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Export Sessions</DialogTitle>
          <DialogDescription>Select sessions to export to the connected provider.</DialogDescription>
        </DialogHeader>

        {activeJobId && jobStatus ? (
          <div className="py-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              {JOB_ICON[jobStatus.status]} {jobStatus.status}
            </div>
            {jobStatus.progress && (
              <>
                <Progress value={progressPercent} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {jobStatus.progress.uploadedFiles} / {jobStatus.progress.totalFiles} files uploaded
                  ({jobStatus.progress.completedSessions} / {jobStatus.progress.totalSessions} sessions)
                </p>
              </>
            )}
            {jobStatus.errorMessage && (
              <p className="text-xs text-red-500">{jobStatus.errorMessage}</p>
            )}
            {jobStatus.exportedFolderUrl && (
              <a href={jobStatus.exportedFolderUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                <ArrowSquareOut size={14} /> View in provider
              </a>
            )}
            {isComplete && (
              <div className="mt-2 flex gap-2">
                {jobStatus.status === 'FAILED' && (
                  <>
                    <button type="button" onClick={handleRetry} disabled={exporting}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 transition-colors">
                      {exporting && <SpinnerGap size={14} className="animate-spin" />}
                      <ArrowClockwise size={14} /> Retry
                    </button>
                    <button type="button" onClick={handleStartOver}
                      className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
                      Start over
                    </button>
                  </>
                )}
                <button type="button" onClick={() => onOpenChange(false)}
                  className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
                  Close
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="max-h-64 overflow-y-auto divide-y rounded-lg border">
              {sessions.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">No sessions found.</p>
              ) : (
                sessions.map((s) => (
                  <label key={s.id}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedSessions.has(s.id)}
                      onChange={() => toggleSession(s.id)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.name || s.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.status} — {formatDate(s.createdAt)}
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>
            <DialogFooter>
              <button
                type="button"
                disabled={selectedSessions.size === 0 || exporting}
                onClick={handleExport}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {exporting && <SpinnerGap size={14} className="animate-spin" />}
                Export {selectedSessions.size > 0 ? `(${selectedSessions.size})` : ''}
              </button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
