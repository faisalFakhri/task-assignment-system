import type { TaskType } from '../types/task.types'

interface TaskTypeBadgeProps {
  type: TaskType
}
export default function TaskTypeBadge({ type }: TaskTypeBadgeProps) {
  const styles = {
    Bugs: 'bg-rose-400/15 text-rose-300 border-rose-400/20',
    Improvements: 'bg-violet-400/15 text-violet-300 border-violet-400/20',
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium font-mono ${styles[type]}`}>
      {type === 'Bugs' ? 'Bug' : 'Improvement'}
    </span>
  )
}
