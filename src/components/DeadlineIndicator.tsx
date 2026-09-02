import type { Task } from '../types/task.types'
import { getDeadlineState, formatDeadlineText } from '../lib/dateUtils'

interface DeadlineIndicatorProps {
  task: Task
}

export default function DeadlineIndicator({ task }: DeadlineIndicatorProps) {
  const state = getDeadlineState(task)
  
  const styles = {
    Overdue: 'bg-red-50 text-red-700 border-red-200 font-semibold',
    'Due Today': 'bg-amber-100 text-amber-800 border-amber-300 font-semibold',
    'Near Deadline': 'bg-orange-50 text-orange-700 border-orange-200',
    Safe: 'bg-gray-50 text-gray-600 border-gray-200',
    'No Target': 'bg-gray-50 text-gray-400 border-gray-200 italic',
  }

  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-mono ${styles[state]}`}>
      {formatDeadlineText(task)}
    </span>
  )
}
