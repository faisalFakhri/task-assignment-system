import type { TaskStatus } from '../types/task.types'

interface StatusBadgeProps {
  status: TaskStatus
}
export default function StatusBadge({ status }: StatusBadgeProps) {
  const styles = {
    Open: 'bg-sky-400/15 text-sky-300 border-sky-400/20',
    Assign: 'bg-amber-400/15 text-amber-300 border-amber-400/20',
    Done: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/20',
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium font-mono ${styles[status]}`}>
      {status}
    </span>
  )
}
