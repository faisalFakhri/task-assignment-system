import type { TaskStatus } from '../types/task.types'

interface StatusBadgeProps {
  status: TaskStatus
}
export default function StatusBadge({ status }: StatusBadgeProps) {
  const styles: Record<string, string> = {
    Open: 'bg-sky-400/15 text-sky-300 border-sky-400/20',
    Assign: 'bg-amber-400/15 text-amber-300 border-amber-400/20',
    Done: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/20',
    QC: 'bg-violet-400/15 text-violet-300 border-violet-400/20',
    Reject: 'bg-red-400/15 text-red-300 border-red-400/20',
    Reopen: 'bg-orange-400/15 text-orange-300 border-orange-400/20',
    Hold: 'bg-slate-400/15 text-slate-300 border-slate-400/20',
    'In Progress': 'bg-cyan-400/15 text-cyan-300 border-cyan-400/20',
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium font-mono ${styles[status] || 'bg-white/10 text-white/60 border-white/10'}`}>
      {status}
    </span>
  )
}
