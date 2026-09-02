import type { TaskType } from '../types/task.types'

interface TaskTypeBadgeProps {
  type: TaskType
}

export default function TaskTypeBadge({ type }: TaskTypeBadgeProps) {
  const styles = {
    Bugs: 'bg-rose-50 text-rose-700 border-rose-200',
    Improvements: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  }

  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-medium font-mono ${styles[type]}`}>
      {type === 'Bugs' ? 'Bug' : 'Improvement'}
    </span>
  )
}
