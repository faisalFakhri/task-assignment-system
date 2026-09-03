import type { Task } from '../types/task.types'
import { getDeadlineState, formatDeadlineText } from '../lib/dateUtils'

interface DeadlineIndicatorProps {
  task: Task
}
export default function DeadlineIndicator({ task }: DeadlineIndicatorProps) {
  const state = getDeadlineState(task)
  const styles = {
    Overdue: 'bg-red-400/15 text-red-300 border-red-400/20 font-semibold',
    'Due Today': 'bg-amber-400/15 text-amber-300 border-amber-400/20 font-semibold',
    'Near Deadline': 'bg-orange-400/15 text-orange-300 border-orange-400/20',
    Safe: 'bg-white/5 text-white/60 border-white/10',
    'No Target': 'bg-white/[0.03] text-white/30 border-white/5 italic',
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-mono ${styles[state]}`}>
      {formatDeadlineText(task)}
    </span>
  )
}
