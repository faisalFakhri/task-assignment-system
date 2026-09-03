/* eslint-disable react/set-state-in-effect */
import { useState, useEffect, useMemo, useRef } from 'react'
import { useTasks } from '../context/TaskContext'
import { useToast } from '../context/ToastContext'
import type { TaskStatus, TaskType } from '../types/task.types'
import {
  formatFileSize,
  type PendingAttachmentFile,
  uploadFilesSequentially,
  validateAttachmentFile,
} from '../lib/attachments'

interface TaskFormProps {
  taskId?: string
  onClose: () => void
  onSubmitSuccess: () => void
}

export default function TaskForm({ taskId, onClose, onSubmitSuccess }: TaskFormProps) {
  const { tasks, consultants, programmers, clients, createTask, updateTask, uploadAttachment } = useTasks()
  const { addToast } = useToast()

  const isEditMode = !!taskId
  const taskToEdit = useMemo(() => tasks.find(t => t.id === taskId), [tasks, taskId])

  // Form Fields State
  const [consultant, setConsultant] = useState('')
  const [type, setType] = useState<TaskType>('Bugs')
  const [client, setClient] = useState('')
  const [screenReport, setScreenReport] = useState('')
  const [request, setRequest] = useState('')
  const [status, setStatus] = useState<TaskStatus>('Open')
  const [programmer, setProgrammer] = useState('')
  const [sqlServer, setSqlServer] = useState('')
  const [database, setDatabase] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [notes, setNotes] = useState('')

  // Submitting and form error states
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Local pending attachment files (held in memory until Save)
  const [pendingFiles, setPendingFiles] = useState<PendingAttachmentFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingFilesRef = useRef<PendingAttachmentFile[]>([])

  // Validation Error State
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Initialize fields in edit/create modes
  useEffect(() => {
    if (isEditMode && taskToEdit) {
      setConsultant(taskToEdit.consultant)
      setType(taskToEdit.type)
      setClient(taskToEdit.client)
      setScreenReport(taskToEdit.screenReport)
      setRequest(taskToEdit.request)
      setStatus(taskToEdit.status)
      setProgrammer(taskToEdit.programmer)
      setSqlServer(taskToEdit.sqlServer)
      setDatabase(taskToEdit.database)
      setTargetDate(taskToEdit.targetDate || '')
      setNotes(taskToEdit.notes)
    } else {
      setConsultant('')
      setType('Bugs')
      setClient('')
      setScreenReport('')
      setRequest('')
      setStatus('Open')
      setProgrammer('')
      setSqlServer('')
      setDatabase('')
      setTargetDate('')
      setNotes('')
    }
  }, [isEditMode, taskToEdit])

  useEffect(() => {
    pendingFilesRef.current = pendingFiles
  }, [pendingFiles])

  // Revoke object URLs when the form unmounts (close/cancel/submit)
  useEffect(() => {
    return () => {
      pendingFilesRef.current.forEach(p => URL.revokeObjectURL(p.previewUrl))
    }
  }, [])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!consultant) newErrors.consultant = 'Consultant requester is required'
    if (!type) newErrors.type = 'Task type is required'
    if (!client) newErrors.client = 'Client name is required'
    if (!screenReport.trim()) newErrors.screenReport = 'Screen / Report name is required'
    if (!request.trim()) newErrors.request = 'Request description is required'
    if (!status) newErrors.status = 'Initial status is required'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    if (!validate()) return

    setSubmitting(true)
    setSubmitError(null)

    const taskPayload = {
      consultant,
      type,
      client,
      screenReport: screenReport.trim(),
      request: request.trim(),
      status,
      programmer,
      sqlServer: sqlServer.trim(),
      database: database.trim(),
      targetDate: targetDate || null,
      notes: notes.trim(),
    }

    try {
      if (isEditMode && taskId) {
        await updateTask(taskId, taskPayload)
        addToast('success', `Task ${taskId} updated successfully.`)
        onSubmitSuccess()
      } else {
        addToast('info', 'Creating task...')
        const newTaskId = await createTask(taskPayload)

        if (pendingFiles.length > 0) {
          const result = await uploadFilesSequentially(
            pendingFiles,
            newTaskId,
            payload => uploadAttachment(payload),
            (count, total) => addToast('info', `Uploading ${count} of ${total}...`)
          )

          if (result.failed.length > 0) {
            addToast('success', `Task created successfully. ${result.succeeded} of ${pendingFiles.length} attachments uploaded.`)
            addToast('error', `Failed: ${result.failed.join(', ')}`)
          } else {
            addToast('success', `Task created successfully. ${result.succeeded} attachment${result.succeeded === 1 ? '' : 's'} uploaded.`)
          }
        } else {
          addToast('success', 'Task created successfully.')
        }
        onSubmitSuccess()
      }
    } catch (err: any) {
      console.error(err)
      const friendlyMsg = err.message || 'Something went wrong. Please try again.'
      setSubmitError(friendlyMsg)
      addToast('error', isEditMode ? `Unable to update task: ${friendlyMsg}` : `Unable to create task: ${friendlyMsg}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    e.target.value = ''

    const accepted: PendingAttachmentFile[] = []
    selected.forEach(file => {
      const errorMsg = validateAttachmentFile(file)
      if (errorMsg) {
        addToast('error', `${file.name}: ${errorMsg}`)
        return
      }
      const isDuplicate = pendingFiles.some(
        p => p.file.name === file.name && p.file.size === file.size && p.file.lastModified === file.lastModified
      )
      if (isDuplicate) {
        addToast('error', `${file.name} is already in the list.`)
        return
      }
      accepted.push({ file, description: '', previewUrl: URL.createObjectURL(file) })
    })

    if (accepted.length > 0) {
      setPendingFiles(prev => [...prev, ...accepted])
    }
  }

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => {
      const next = [...prev]
      const removed = next.splice(index, 1)[0]
      URL.revokeObjectURL(removed.previewUrl)
      return next
    })
  }

  const updateFileDescription = (index: number, description: string) => {
    setPendingFiles(prev => prev.map((p, i) => (i === index ? { ...p, description } : p)))
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full text-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 p-4 shrink-0 glass-subtle">
        <span className="font-semibold text-sm text-white font-mono">
          {isEditMode ? `Edit Task: ${taskId}` : 'Create New Task'}
        </span>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-slate-900 hover:bg-white/90 disabled:opacity-50 min-w-[70px] text-center shadow-lg shadow-black/20"
          >
            {submitting ? (isEditMode ? 'Updating...' : 'Saving...') : 'Save'}
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="rounded-full glass-subtle border border-white/10 px-3 py-1 text-xs text-white/60 hover:text-white disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Body Scroll */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {submitError && (
          <div className="glass rounded-2xl border-red-400/20 bg-red-500/10 p-3 text-xs font-mono text-red-300">
            Error: {submitError}
          </div>
        )}
        {/* Section: Assignment */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-white/30 font-mono tracking-wider uppercase border-b border-white/5 pb-1">
            Assignment
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-white/50 mb-1">
                Consultant *
              </label>
              <select
                value={consultant}
                onChange={e => setConsultant(e.target.value)}
                className={`w-full rounded-xl bg-slate-800/90 border px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-400/50 focus:ring-1 focus:ring-violet-400/20 ${
                  errors.consultant ? 'border-red-400/40 bg-red-500/10' : 'border-white/10'
                }`}
              >
                <option value="">Choose Consultant</option>
                {consultants.filter(c => c.active || c.name === consultant).map(c => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.consultant && <p className="text-[10px] text-red-300 mt-1 font-mono">{errors.consultant}</p>}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-white/50 mb-1">
                Client *
              </label>
              <select
                value={client}
                onChange={e => setClient(e.target.value)}
                className={`w-full rounded-xl bg-slate-800/90 border px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-400/50 focus:ring-1 focus:ring-violet-400/20 ${
                  errors.client ? 'border-red-400/40 bg-red-500/10' : 'border-white/10'
                }`}
              >
                <option value="">Choose Client</option>
                {clients.map(c => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.client && <p className="text-[10px] text-red-300 mt-1 font-mono">{errors.client}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-white/50 mb-1">
                Type *
              </label>
              <select
                value={type}
                onChange={e => setType(e.target.value as TaskType)}
                className="w-full rounded-xl bg-slate-800/90 border border-white/10 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-400/50 focus:ring-1 focus:ring-violet-400/20"
              >
                <option value="Bugs">Bugs</option>
                <option value="Improvements">Improvements</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-white/50 mb-1">
                Status *
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as TaskStatus)}
                className="w-full rounded-xl bg-slate-800/90 border border-white/10 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-400/50 focus:ring-1 focus:ring-violet-400/20"
              >
                <option value="QC">QC</option>
                <option value="Open">Open</option>
                <option value="Done">Done</option>
                <option value="Reject">Reject</option>
                <option value="Reopen">Reopen</option>
                <option value="Hold">Hold</option>
                <option value="Assign">Assign</option>
                <option value="In Progress">In Progress</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-white/50 mb-1">
              Screen / Report Name *
            </label>
            <input
              type="text"
              value={screenReport}
              onChange={e => setScreenReport(e.target.value)}
              placeholder="e.g. Sales Invoice Screen"
              className={`w-full rounded-xl bg-slate-800/90 border px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-400/50 focus:ring-1 focus:ring-violet-400/20 ${
                errors.screenReport ? 'border-red-400/40 bg-red-500/10' : 'border-white/10'
              }`}
            />
            {errors.screenReport && <p className="text-[10px] text-red-300 mt-1 font-mono">{errors.screenReport}</p>}
          </div>
        </div>

        {/* Section: Request */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-white/30 font-mono tracking-wider uppercase border-b border-white/5 pb-1">
            Request
          </h3>
          <div>
            <label className="block text-[11px] font-semibold text-white/50 mb-1">
              Request Description *
            </label>
            <textarea
              value={request}
              onChange={e => setRequest(e.target.value)}
              placeholder="Provide detail requirement description..."
              rows={4}
              className={`w-full rounded-xl bg-slate-800/90 border px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-400/50 focus:ring-1 focus:ring-violet-400/20 leading-relaxed ${
                errors.request ? 'border-red-400/40 bg-red-500/10' : 'border-white/10'
              }`}
            />
            {errors.request && <p className="text-[10px] text-red-300 mt-1 font-mono">{errors.request}</p>}
          </div>
        </div>

        {/* Section: Technical */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-white/30 font-mono tracking-wider uppercase border-b border-white/5 pb-1">
            Technical
          </h3>
          
          <div>
            <label className="block text-[11px] font-semibold text-white/50 mb-1">
              Assigned Programmer
            </label>
            <select
              value={programmer}
              onChange={e => setProgrammer(e.target.value)}
              className="w-full rounded-xl bg-slate-800/90 border border-white/10 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-400/50 focus:ring-1 focus:ring-violet-400/20"
            >
            <option value="">Unassigned</option>
            {programmers.filter(p => p.active || p.name === programmer).map(p => (
              <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-white/50 mb-1">
                SQL Server
              </label>
              <input
                type="text"
                value={sqlServer}
                onChange={e => setSqlServer(e.target.value)}
                placeholder="SRV-SAP-DB01"
                className="w-full rounded-xl bg-slate-800/90 border border-white/10 px-3 py-2.5 text-sm text-white font-mono placeholder:text-white/30 focus:outline-none focus:border-violet-400/50 focus:ring-1 focus:ring-violet-400/20"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-white/50 mb-1">
                Database Name
              </label>
              <input
                type="text"
                value={database}
                onChange={e => setDatabase(e.target.value)}
                placeholder="DB_PROD"
                className="w-full rounded-xl bg-slate-800/90 border border-white/10 px-3 py-2.5 text-sm text-white font-mono placeholder:text-white/30 focus:outline-none focus:border-violet-400/50 focus:ring-1 focus:ring-violet-400/20"
              />
            </div>
          </div>
        </div>

        {/* Section: Schedule */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-white/30 font-mono tracking-wider uppercase border-b border-white/5 pb-1">
            Schedule
          </h3>
          <div>
            <label className="block text-[11px] font-semibold text-white/50 mb-1">
              Target Date (Deadline)
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={e => setTargetDate(e.target.value)}
              className="w-full rounded-xl bg-slate-800/90 border border-white/10 px-3 py-2.5 text-sm text-white font-mono placeholder:text-white/30 focus:outline-none focus:border-violet-400/50 focus:ring-1 focus:ring-violet-400/20"
            />
          </div>
        </div>

        {/* Section: Additional Information */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-white/30 font-mono tracking-wider uppercase border-b border-white/5 pb-1">
            Additional Information
          </h3>
          
          <div>
            <label className="block text-[11px] font-semibold text-white/50 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Internal notes..."
              rows={2}
              className="w-full rounded-xl glass-subtle border border-white/10 p-2.5 focus:outline-none focus:border-violet-400/50 glass-subtle text-xs leading-relaxed"
            />
          </div>

          {/* Local Attachments Section (Create Mode Only) */}
          {!isEditMode && (
            <div className="space-y-3 pt-2">
              <label className="block text-[11px] font-semibold text-white/50">
                Attachments ({pendingFiles.length})
              </label>

              {pendingFiles.length > 0 && (
                <div className="space-y-2 glass-subtle p-2.5 border border-white/10 rounded">
                  {pendingFiles.map((att, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <img
                        src={att.previewUrl}
                        alt={att.file.name}
                        className="h-10 w-14 object-cover rounded border border-white/10 glass-subtle shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-white/60 font-semibold truncate">{att.file.name}</div>
                        <div className="text-[10px] text-white/30 font-mono">{formatFileSize(att.file.size)}</div>
                        <input
                          type="text"
                          placeholder="Description (Optional)"
                          value={att.description}
                          onChange={e => updateFileDescription(idx, e.target.value)}
                          className="mt-1 w-full rounded border border-white/10 p-1 focus:outline-none focus:border-violet-400/50 glass-subtle text-[11px]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removePendingFile(idx)}
                        className="text-red-500 hover:underline text-[10px] shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2 border border-white/10 rounded p-3 glass-subtle">
                <div className="text-[10px] text-white/30 font-bold uppercase tracking-wider font-mono">Add Attachment</div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-full bg-white/10 border border-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15"
                >
                  Choose images...
                </button>
                <p className="text-[10px] text-white/30 font-mono">PNG, JPEG, or WebP. Max 5 MB per file.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  )
}
