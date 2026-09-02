import type { TaskStatus } from '../types/task.types'

interface StatusBadgeProps {
  status: TaskStatus
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const styles = {
    Open: 'bg-blue-50 text-blue-700 border-blue-200',
    Assign: 'bg-amber-50 text-amber-700 border-amber-200',
    Done: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  }

  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-medium font-mono ${styles[status]}`}>
      {status}
    </span>
  )
}
