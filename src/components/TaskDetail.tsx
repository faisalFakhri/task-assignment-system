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
    setLoadingHistory(true)
    setLoadingAttachments(true)
    setHistoryError(false)
    setAttachmentsError(false)
    setBrokenImages(new Set())

    try {
      const hist = await fetchTaskHistory(taskId)
      setTaskHistory(hist)
    } catch {
      setHistoryError(true)
    } finally {
      setLoadingHistory(false)
    }

    try {
      const atts = await fetchTaskAttachments(taskId)
      setTaskAttachments(atts)
    } catch {
      setAttachmentsError(true)
    } finally {
      setLoadingAttachments(false)
    }
  }, [taskId, fetchTaskHistory, fetchTaskAttachments])

  useEffect(() => {
    loadDetails()
  }, [loadDetails])

  if (!task) {
    return (
      <div className="p-4 font-mono text-xs text-gray-500">
        Task not found: {taskId}
      </div>
    )
  }

  const handleArchive = async () => {
    setArchiving(true)
    try {
      await archiveTask(task.id)
      addToast('success', `Task ${task.id} archived successfully.`)
      setShowArchiveConfirm(false)
      onClose()
    } catch (err: any) {
      addToast('error', `Unable to archive task: ${err.message || 'Something went wrong.'}`)
      setArchiving(false)
    }
  }

  const handleAddFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    e.target.value = ''
    if (selected.length === 0) return

    const pending = selected
      .filter(file => {
        const errorMsg = validateAttachmentFile(file)
        if (errorMsg) {
          addToast('error', `${file.name}: ${errorMsg}`)
          return false
        }
        return true
      })
      .map(file => ({ file, description: '', previewUrl: URL.createObjectURL(file) }))

    if (pending.length === 0) return

    setUploading(true)
    try {
      const result = await uploadFilesSequentially(
        pending,
        taskId,
        payload => uploadAttachment(payload),
        (count, total) => addToast('info', `Uploading ${count} of ${total}...`)
      )
      if (result.failed.length > 0) {
        addToast('success', `${result.succeeded} of ${pending.length} attachments uploaded.`)
        addToast('error', `Failed: ${result.failed.join(', ')}`)
      } else {
        addToast('success', `Attachment${pending.length === 1 ? '' : 's'} uploaded successfully.`)
      }
    } finally {
      pending.forEach(p => URL.revokeObjectURL(p.previewUrl))
      setUploading(false)
      await loadDetails()
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteAttachment(deleteTarget.id)
      addToast('success', 'Attachment deleted successfully.')
      setDeleteTarget(null)
      await loadDetails()
    } catch (err: any) {
      addToast('error', `Unable to delete attachment: ${err.message || 'Something went wrong.'}`)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200 text-sm text-gray-800">
      {/* Detail Header */}
      <div className="flex items-center justify-between border-b border-gray-200 p-4 shrink-0 bg-gray-50/50 h-12">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-sm text-gray-900">{task.id}</span>
          <StatusBadge status={task.status} />
          <TaskTypeBadge type={task.type} />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(task.id)}
            className="rounded border border-blue-600 bg-blue-600 px-3 py-1 font-sans text-xs font-semibold text-white hover:bg-blue-700"
          >
            Edit
          </button>
          {!task.archived && (
            <button
              onClick={() => setShowArchiveConfirm(true)}
              className="rounded border border-red-200 bg-white px-3 py-1 font-sans text-xs font-medium text-red-600 hover:bg-red-50"
            >
              Archive
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded border border-gray-200 bg-white px-2 py-1 font-sans text-xs text-gray-500 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>

      {/* Detail Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Client & Screen Name */}
        <div className="space-y-1">
          <div className="text-[10px] font-bold text-gray-400 font-mono tracking-wider uppercase">Client &amp; Screen</div>
          <div className="text-base font-bold text-gray-900 leading-tight">{task.client}</div>
          <div className="text-xs text-gray-600 font-mono">{task.screenReport}</div>
        </div>

        {/* Assignment Grid */}
        <div className="grid grid-cols-2 gap-4 border-t border-gray-150 pt-4 text-xs font-sans">
          <div>
            <span className="block text-[10px] font-bold text-gray-400 font-mono tracking-wider uppercase mb-0.5">Consultant</span>
            <span className="text-gray-800 font-semibold">{task.consultant}</span>
          </div>
          <div>
            <span className="block text-[10px] font-bold text-gray-400 font-mono tracking-wider uppercase mb-0.5">Programmer</span>
            <span className={`text-gray-800 font-semibold ${!task.programmer ? 'italic text-gray-400' : ''}`}>
              {task.programmer || 'Unassigned'}
            </span>
          </div>
          <div>
            <span className="block text-[10px] font-bold text-gray-400 font-mono tracking-wider uppercase mb-0.5">Target Date</span>
            <span className="text-gray-800 font-mono">{task.targetDate || 'No Target'}</span>
          </div>
          <div>
            <span className="block text-[10px] font-bold text-gray-400 font-mono tracking-wider uppercase mb-0.5">Deadline Status</span>
            <DeadlineIndicator task={task} />
          </div>
        </div>

        {/* Request details */}
        <div className="border-t border-gray-150 pt-4 space-y-2">
          <div className="text-[10px] font-bold text-gray-400 font-mono tracking-wider uppercase">Request Details</div>
          <div className="bg-gray-50 border border-gray-200 rounded p-4 text-xs text-gray-800 whitespace-pre-wrap leading-relaxed">
            {task.request}
          </div>
        </div>

        {/* Technical Data Details */}
        <div className="border-t border-gray-150 pt-4 grid grid-cols-2 gap-4 text-xs font-mono">
          <div>
            <span className="block text-[10px] font-bold text-gray-400 font-mono tracking-wider uppercase mb-0.5">SQL Server</span>
            <span className="text-gray-700">{task.sqlServer || '-'}</span>
          </div>
          <div>
            <span className="block text-[10px] font-bold text-gray-400 font-mono tracking-wider uppercase mb-0.5">Database</span>
            <span className="text-gray-700">{task.database || '-'}</span>
          </div>
        </div>

        {/* Notes */}
        <div className="border-t border-gray-150 pt-4 space-y-2">
          <div className="text-[10px] font-bold text-gray-400 font-mono tracking-wider uppercase">Additional Notes</div>
          <div className="text-xs text-gray-700 bg-yellow-50/20 border border-yellow-100/50 p-3 rounded leading-relaxed whitespace-pre-wrap">
            {task.notes || <span className="italic text-gray-400 font-mono">No notes logged.</span>}
          </div>
        </div>

        {/* Attachments Section */}
        <div className="border-t border-gray-150 pt-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-bold text-gray-400 font-mono tracking-wider uppercase">
              Attachments ({loadingAttachments ? '...' : taskAttachments.length})
            </div>
            <button
              type="button"
              onClick={() => addFilesRef.current?.click()}
              disabled={uploading}
              className="rounded border border-gray-300 bg-white px-2 py-0.5 text-[10px] font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              {uploading ? 'Uploading...' : '+ Add Attachment'}
            </button>
          </div>
          <input
            ref={addFilesRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            className="hidden"
            onChange={handleAddFiles}
          />
          {loadingAttachments ? (
            <div className="text-xs text-gray-400 font-mono">Loading attachments...</div>
          ) : attachmentsError ? (
            <div className="text-xs text-red-500 font-mono">Failed to load attachments.</div>
          ) : taskAttachments.length === 0 ? (
            <div className="text-xs text-gray-400 italic">No attachments yet.</div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {taskAttachments.map((att, idx) => (
                <div
                  key={att.id}
                  onClick={() => setActiveImageIndex(idx)}
                  className="group relative cursor-pointer border border-gray-200 rounded overflow-hidden hover:border-blue-400 bg-gray-50"
                >
                  {brokenImages.has(att.id) ? (
                    <div className="h-20 w-full flex items-center justify-center bg-gray-100 text-[10px] text-gray-400 font-mono">
                      Image unavailable
                    </div>
                  ) : (
                    <img
                      src={att.fileUrl}
                      alt={att.description || att.fileName}
                      onError={() => setBrokenImages(prev => new Set(prev).add(att.id))}
                      className="h-20 w-full object-cover"
                    />
                  )}
                  <div className="p-1 text-[9px] font-mono text-gray-500 truncate bg-white group-hover:text-blue-600">
                    {att.fileName}
                  </div>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation()
                      setDeleteTarget(att)
                    }}
                    className="absolute top-1 right-1 rounded bg-gray-900/60 px-1.5 py-0.5 text-[9px] font-semibold text-white hover:bg-red-600 opacity-0 group-hover:opacity-100"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity History */}
        <div className="border-t border-gray-150 pt-4 space-y-3">
          <div className="text-[10px] font-bold text-gray-400 font-mono tracking-wider uppercase">Activity History</div>
          {loadingHistory ? (
            <div className="text-xs text-gray-400 font-mono pl-4">Loading activity...</div>
          ) : historyError ? (
            <div className="text-xs text-red-500 font-mono pl-4">Failed to load activity history.</div>
          ) : (
            <div className="space-y-3 font-mono text-[11px] text-gray-600 relative pl-4 border-l border-gray-100">
              {taskHistory.map((log) => (
                <div key={log.id} className="relative space-y-0.5">
                  <span className="absolute -left-[20px] top-1.5 h-1.5 w-1.5 rounded-full bg-gray-300 border border-white" />
                  <div className="flex justify-between text-[9px] text-gray-400">
                    <span className="font-semibold">{log.action}</span>
                    <span>{log.timestamp}</span>
                  </div>
                  <div className="text-gray-700 font-sans text-xs">
                    {log.action === 'CREATE' && 'Task created'}
                    {log.action === 'COMPLETE' && 'Task marked Done'}
                    {log.action === 'ARCHIVE' && 'Task archived'}
                    {log.action === 'UPDATE' && (
                      <span>
                        Changed <span className="font-semibold text-gray-800">{fieldLabel(log.field)}</span>:{' '}
                        <span className="line-through text-gray-400">{resolveDisplayValue(log.field, log.oldValue, masters)}</span> &rarr;{' '}
                        <span className="font-semibold">{resolveDisplayValue(log.field, log.newValue, masters)}</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {taskHistory.length === 0 && (
                <div className="text-xs text-gray-400 italic">No activity yet.</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Image Previewer */}
      {activeImageIndex >= 0 && (
        <ImageViewer
          key={activeImageIndex}
          images={taskAttachments}
          currentIndex={activeImageIndex}
          onIndexChange={setActiveImageIndex}
          onClose={() => setActiveImageIndex(-1)}
        />
      )}

      {/* Archive Confirmation Dialog */}
      <ConfirmDialog
        open={showArchiveConfirm}
        title="Archive task?"
        message={`Task ${task.id} will be moved to Archived. It will not be permanently deleted.`}
        confirmLabel="Archive Task"
        destructive
        loading={archiving}
        onConfirm={handleArchive}
        onCancel={() => setShowArchiveConfirm(false)}
      />

      {/* Delete Attachment Confirmation Dialog */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete attachment?"
        message="This attachment will be removed from the task."
        confirmLabel="Delete Attachment"
        destructive
        loadingLabel="Deleting..."
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
