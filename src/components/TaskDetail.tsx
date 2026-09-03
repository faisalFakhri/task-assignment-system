/* eslint-disable react/set-state-in-effect */
import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useTasks } from '../context/TaskContext'
import { useToast } from '../context/ToastContext'
import type { TaskHistory, Attachment } from '../types/task.types'
import StatusBadge from './StatusBadge'
import TaskTypeBadge from './TaskTypeBadge'
import DeadlineIndicator from './DeadlineIndicator'
import ImageViewer from './ImageViewer'
import ConfirmDialog from './ConfirmDialog'
import { fieldLabel, resolveDisplayValue } from '../lib/historyDisplay'
import { uploadFilesSequentially, validateAttachmentFile } from '../lib/attachments'

interface TaskDetailProps {
  taskId: string
  onClose: () => void
  onEdit: (taskId: string) => void
}

export default function TaskDetail({ taskId, onClose, onEdit }: TaskDetailProps) {
  const { tasks, consultants, clients, programmers, archiveTask, fetchTaskHistory, fetchTaskAttachments, uploadAttachment, deleteAttachment } = useTasks()
  const { addToast } = useToast()
  const [activeImageIndex, setActiveImageIndex] = useState<number>(-1)
  const [taskHistory, setTaskHistory] = useState<TaskHistory[]>([])
  const [taskAttachments, setTaskAttachments] = useState<Attachment[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [loadingAttachments, setLoadingAttachments] = useState(true)
  const [historyError, setHistoryError] = useState(false)
  const [attachmentsError, setAttachmentsError] = useState(false)
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set())
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const addFilesRef = useRef<HTMLInputElement>(null)
  const [deleteTarget, setDeleteTarget] = useState<Attachment | null>(null)
  const [deleting, setDeleting] = useState(false)
  const task = useMemo(() => tasks.find(t => t.id === taskId), [tasks, taskId])
  const masters = useMemo(() => ({ consultants, clients, programmers }), [consultants, clients, programmers])
  const loadDetails = useCallback(async () => {
    setLoadingHistory(true); setLoadingAttachments(true); setHistoryError(false); setAttachmentsError(false); setBrokenImages(new Set())
    try { const hist = await fetchTaskHistory(taskId); setTaskHistory(hist) } catch { setHistoryError(true) } finally { setLoadingHistory(false) }
    try { const atts = await fetchTaskAttachments(taskId); setTaskAttachments(atts) } catch { setAttachmentsError(true) } finally { setLoadingAttachments(false) }
  }, [taskId, fetchTaskHistory, fetchTaskAttachments])
  useEffect(() => { loadDetails() }, [loadDetails])
  if (!task) return <div className="p-4 font-mono text-xs text-white/40">Task not found: {taskId}</div>
  const handleArchive = async () => {
    setArchiving(true)
    try { await archiveTask(task.id); addToast('success', `Task ${task.id} archived.`); setShowArchiveConfirm(false); onClose() }
    catch (err: any) { addToast('error', err.message || 'Archive failed'); setArchiving(false) }
  }
  const handleAddFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []); e.target.value = ''; if (!selected.length) return
    const pending = selected.filter(f => { const m = validateAttachmentFile(f); if (m) { addToast('error', `${f.name}: ${m}`); return false } return true }).map(file => ({ file, description: '', previewUrl: URL.createObjectURL(file) }))
    if (!pending.length) return; setUploading(true)
    try {
      const result = await uploadFilesSequentially(pending, taskId, p => uploadAttachment(p), (c,t) => addToast('info', `Uploading ${c} of ${t}...`))
      if (result.failed.length) { addToast('success', `${result.succeeded} of ${pending.length} uploaded.`); addToast('error', `Failed: ${result.failed.join(', ')}`) }
      else addToast('success', `Attachment${pending.length===1?'':'s'} uploaded.`)
    } finally { pending.forEach(p => URL.revokeObjectURL(p.previewUrl)); setUploading(false); await loadDetails() }
  }
  const handlePasteUpload = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return
    const pasted: File[] = []
    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      if (it.type.startsWith('image/')) {
        const f = it.getAsFile()
        if (f) {
          const ext = f.type.split('/')[1] || 'png'
          const name = !f.name || f.name === 'image.png' ? `Screenshot-${Date.now()}-${i}.${ext}` : f.name
          const renamed = f.name === name ? f : new File([f], name, { type: f.type })
          pasted.push(renamed)
        }
      }
    }
    if (!pasted.length) return
    e.preventDefault()
    const pending = pasted.filter(f => { const m = validateAttachmentFile(f); if (m) { addToast('error', `${f.name}: ${m}`); return false } return true }).map(file => ({ file, description: '', previewUrl: URL.createObjectURL(file) }))
    if (!pending.length) return
    addToast('info', `Pasting ${pending.length} screenshot...`)
    setUploading(true)
    try {
      const result = await uploadFilesSequentially(pending, taskId, p => uploadAttachment(p), (c,t) => addToast('info', `Uploading ${c} of ${t}...`))
      if (result.failed.length) { addToast('success', `${result.succeeded} of ${pending.length} uploaded.`); addToast('error', `Failed: ${result.failed.join(', ')}`) }
      else addToast('success', `${pending.length} screenshot pasted & uploaded.`)
    } finally { pending.forEach(p => URL.revokeObjectURL(p.previewUrl)); setUploading(false); await loadDetails() }
  }
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return; setDeleting(true)
    try { await deleteAttachment(deleteTarget.id); addToast('success', 'Attachment deleted.'); setDeleteTarget(null); await loadDetails() }
    catch (err: any) { addToast('error', err.message || 'Delete failed') } finally { setDeleting(false) }
  }
  return (
    <div className="flex flex-col h-full text-sm" onPaste={handlePasteUpload}>
      <div className="flex items-center justify-between border-b border-white/10 p-4 shrink-0 glass-subtle">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-sm text-white">{task.id}</span>
          <StatusBadge status={task.status} />
          <TaskTypeBadge type={task.type} />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onEdit(task.id)} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-900 hover:bg-white/90">Edit</button>
          {!task.archived && <button onClick={() => setShowArchiveConfirm(true)} className="rounded-full bg-red-500/15 border border-red-400/20 px-3 py-1 text-xs font-medium text-red-300 hover:bg-red-500/20">Archive</button>}
          <button onClick={onClose} className="rounded-full glass-subtle border border-white/10 px-3 py-1 text-xs text-white/60 hover:text-white">Close</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div className="glass rounded-2xl p-4">
          <div className="text-[10px] font-bold tracking-widest text-white/30 font-mono uppercase">Client &amp; Screen</div>
          <div className="text-base font-bold text-white leading-tight mt-1">{task.client}</div>
          <div className="text-xs text-white/50 font-mono">{task.screenReport}</div>
        </div>
        <div className="glass rounded-2xl p-4 grid grid-cols-2 gap-4 text-xs">
          <div><span className="block text-[10px] font-bold tracking-widest text-white/30 font-mono uppercase mb-1">Consultant</span><span className="text-white font-medium">{task.consultant}</span></div>
          <div><span className="block text-[10px] font-bold tracking-widest text-white/30 font-mono uppercase mb-1">Programmer</span><span className={`font-medium ${!task.programmer ? 'italic text-white/30' : 'text-white'}`}>{task.programmer || 'Unassigned'}</span></div>
          <div><span className="block text-[10px] font-bold tracking-widest text-white/30 font-mono uppercase mb-1">Target Date</span><span className="text-white/80 font-mono">{task.targetDate || 'No Target'}</span></div>
          <div><span className="block text-[10px] font-bold tracking-widest text-white/30 font-mono uppercase mb-1">Deadline</span><DeadlineIndicator task={task} /></div>
          <div><span className="block text-[10px] font-bold tracking-widest text-white/30 font-mono uppercase mb-1">SQL Server</span><span className="text-white/60 font-mono">{task.sqlServer || '-'}</span></div>
          <div><span className="block text-[10px] font-bold tracking-widest text-white/30 font-mono uppercase mb-1">Database</span><span className="text-white/60 font-mono">{task.database || '-'}</span></div>
        </div>
        <div className="glass rounded-2xl p-4 space-y-2">
          <div className="text-[10px] font-bold tracking-widest text-white/30 font-mono uppercase">Request Details</div>
          <div className="glass-subtle rounded-xl p-3 text-xs text-white/80 whitespace-pre-wrap leading-relaxed border border-white/5">{task.request}</div>
        </div>
        <div className="glass rounded-2xl p-4 space-y-2">
          <div className="text-[10px] font-bold tracking-widest text-white/30 font-mono uppercase">Additional Notes</div>
          <div className="glass-subtle rounded-xl p-3 text-xs text-white/60 leading-relaxed whitespace-pre-wrap border border-white/5">{task.notes || <span className="italic text-white/25 font-mono">No notes logged.</span>}</div>
        </div>
        <div className="glass rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-bold tracking-widest text-white/30 font-mono uppercase">Attachments ({loadingAttachments ? '...' : taskAttachments.length})</div>
            <span className="text-[9px] font-mono text-white/25 hidden sm:inline">Ctrl+V paste</span>
            <button type="button" onClick={() => addFilesRef.current?.click()} disabled={uploading} className="rounded-full glass-subtle border border-white/10 px-3 py-1 text-[10px] font-semibold text-white/60 hover:text-white disabled:opacity-40">{uploading ? 'Uploading...' : '+ Add'}</button>
          </div>
          <input ref={addFilesRef} type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden" onChange={handleAddFiles} />
          {loadingAttachments ? <div className="text-xs text-white/30 font-mono">Loading attachments...</div>
          : attachmentsError ? <div className="text-xs text-red-300 font-mono">Failed to load attachments.</div>
          : taskAttachments.length === 0 ? <div className="text-xs text-white/25 italic font-mono">No attachments yet.</div>
          : (
            <div className="grid grid-cols-2 gap-2">
              {taskAttachments.map((att, idx) => (
                <div key={att.id} onClick={() => setActiveImageIndex(idx)} className="group relative cursor-pointer rounded-xl overflow-hidden border border-white/10 glass-subtle hover:border-violet-400/30">
                  {brokenImages.has(att.id) ? <div className="h-20 grid place-items-center bg-white/[0.03] text-[10px] text-white/25 font-mono">Image unavailable</div>
                  : <img src={att.fileUrl} alt={att.description || att.fileName} onError={() => setBrokenImages(s => new Set(s).add(att.id))} className="h-20 w-full object-cover" />}
                  <div className="p-1.5 text-[9px] font-mono text-white/40 truncate border-t border-white/5">{att.fileName}</div>
                  <button type="button" onClick={e => { e.stopPropagation(); setDeleteTarget(att) }} className="absolute top-1 right-1 rounded-full bg-black/60 backdrop-blur px-2 py-0.5 text-[9px] font-semibold text-white opacity-0 group-hover:opacity-100 hover:bg-red-600">Delete</button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="glass rounded-2xl p-4 space-y-3">
          <div className="text-[10px] font-bold tracking-widest text-white/30 font-mono uppercase">Activity History</div>
          {loadingHistory ? <div className="text-xs text-white/30 font-mono">Loading activity...</div>
          : historyError ? <div className="text-xs text-red-300 font-mono">Failed to load activity.</div>
          : (
            <div className="space-y-3 font-mono text-[11px] relative pl-4 border-l border-white/10">
              {taskHistory.map(log => (
                <div key={log.id} className="relative">
                  <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-white/20 border border-white/20 shadow-[0_0_8px_rgba(255,255,255,0.15)]" />
                  <div className="flex justify-between text-[9px] text-white/25"><span className="font-semibold tracking-wide">{log.action}</span><span>{log.timestamp}</span></div>
                  <div className="text-white/60 text-xs font-sans mt-0.5">
                    {log.action === 'CREATE' && 'Task created'}
                    {log.action === 'COMPLETE' && 'Task marked Done'}
                    {log.action === 'ARCHIVE' && 'Task archived'}
                    {log.action === 'UPDATE' && <span>Changed <span className="font-semibold text-white">{fieldLabel(log.field)}</span>: <span className="line-through text-white/25">{resolveDisplayValue(log.field, log.oldValue, masters)}</span> → <span className="font-semibold text-white">{resolveDisplayValue(log.field, log.newValue, masters)}</span></span>}
                  </div>
                </div>
              ))}
              {taskHistory.length === 0 && <div className="text-xs text-white/25 italic">No activity yet.</div>}
            </div>
          )}
        </div>
      </div>
      {activeImageIndex >= 0 && <ImageViewer key={activeImageIndex} images={taskAttachments} currentIndex={activeImageIndex} onIndexChange={setActiveImageIndex} onClose={() => setActiveImageIndex(-1)} />}
      <ConfirmDialog open={showArchiveConfirm} title="Archive task?" message={`Task ${task.id} will be moved to Archived.`} confirmLabel="Archive Task" destructive loading={archiving} onConfirm={handleArchive} onCancel={() => setShowArchiveConfirm(false)} />
      <ConfirmDialog open={deleteTarget !== null} title="Delete attachment?" message="This attachment will be removed." confirmLabel="Delete Attachment" destructive loadingLabel="Deleting..." loading={deleting} onConfirm={handleDeleteConfirm} onCancel={() => setDeleteTarget(null)} />
    </div>
  )
}
