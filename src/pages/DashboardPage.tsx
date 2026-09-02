/* eslint-disable react/set-state-in-effect */
import { useMemo, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTasks } from '../context/TaskContext'
import type { TaskHistory } from '../types/task.types'
import { getRemainingDays, TODAY_STR } from '../lib/dateUtils'
import StatusBadge from '../components/StatusBadge'
import TaskTypeBadge from '../components/TaskTypeBadge'
import DeadlineIndicator from '../components/DeadlineIndicator'
import { fieldLabel, resolveDisplayValue } from '../lib/historyDisplay'

export default function DashboardPage() {
  const { tasks, consultants, clients, programmers, loading, error, fetchRecentHistory } = useTasks()
  const [recentActivity, setRecentActivity] = useState<TaskHistory[]>([])
  const [loadingActivity, setLoadingActivity] = useState(true)
  const [activityError, setActivityError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoadingActivity(true)
    setActivityError(null)
    fetchRecentHistory(20)
      .then(list => {
        if (active) {
          setRecentActivity(list)
          setLoadingActivity(false)
        }
      })
      .catch(err => {
        if (active) {
          setActivityError(err.message || 'Failed to load activity.')
          setLoadingActivity(false)
        }
      })
    return () => { active = false }
  }, [fetchRecentHistory])

  const masters = useMemo(() => ({ consultants, clients, programmers }), [consultants, clients, programmers])

  const activeTasksList = useMemo(() => tasks.filter(t => !t.archived), [tasks])

  const stats = useMemo(() => {
    const totalActive = activeTasksList.filter(t => t.status !== 'Done').length
    const open = activeTasksList.filter(t => t.status === 'Open').length
    const assigned = activeTasksList.filter(t => t.status === 'Assign').length
    
    const overdue = activeTasksList.filter(t => {
      if (t.status === 'Done' || !t.targetDate) return false
      const remaining = getRemainingDays(t.targetDate)
      return remaining !== null && remaining < 0
    }).length

    const dueToday = activeTasksList.filter(t => {
      if (t.status === 'Done' || !t.targetDate) return false
      const remaining = getRemainingDays(t.targetDate)
      return remaining === 0
    }).length

    const completedThisMonth = activeTasksList.filter(t => {
      if (t.status !== 'Done' || !t.completedAt) return false
      const compDate = new Date(t.completedAt)
      return compDate.getFullYear() === 2026 && compDate.getMonth() === 7 // August is index 7
    }).length

    return { totalActive, open, assigned, overdue, dueToday, completedThisMonth }
  }, [activeTasksList])

  const overdueTasks = useMemo(() => {
    return activeTasksList
      .filter(t => {
        if (t.status === 'Done' || !t.targetDate) return false
        const rem = getRemainingDays(t.targetDate)
        return rem !== null && rem < 0
      })
      .slice(0, 5)
  }, [activeTasksList])

  const upcomingDeadlines = useMemo(() => {
    return activeTasksList
      .filter(t => {
        if (t.status === 'Done' || !t.targetDate) return false
        const rem = getRemainingDays(t.targetDate)
        return rem !== null && rem >= 0 && rem <= 3
      })
      .sort((a, b) => {
        const remA = getRemainingDays(a.targetDate) ?? 999
        const remB = getRemainingDays(b.targetDate) ?? 999
        return remA - remB
      })
      .slice(0, 5)
  }, [activeTasksList])

  const currentTasks = useMemo(() => {
    return activeTasksList
      .filter(t => t.status !== 'Done')
      .slice(0, 5)
  }, [activeTasksList])

  return (
    <div className="space-y-6 text-sm text-gray-800">
      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-xs font-mono text-red-700 flex justify-between items-center">
          <span>Error: {error}</span>
          <button onClick={() => window.location.reload()} className="underline font-bold">[Retry]</button>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center font-mono text-xs text-gray-500">
          Loading dashboard metrics...
        </div>
      ) : (
        <>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-gray-900">Dashboard</h2>
            <p className="text-xs text-gray-500 mt-0.5">Overview of active assignments and deadlines relative to {TODAY_STR}</p>
          </div>

          {/* Grid of stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 border-y border-gray-200 py-4 bg-gray-50/20 px-3">
            {[
              { label: 'Active Tasks', value: stats.totalActive, color: 'text-gray-900' },
              { label: 'Open', value: stats.open, color: 'text-blue-600' },
              { label: 'Assigned', value: stats.assigned, color: 'text-amber-600' },
              { label: 'Overdue', value: stats.overdue, color: stats.overdue > 0 ? 'text-red-600 font-bold' : 'text-gray-500' },
              { label: 'Due Today', value: stats.dueToday, color: stats.dueToday > 0 ? 'text-orange-600 font-bold' : 'text-gray-500' },
              { label: 'Completed This Month', value: stats.completedThisMonth, color: 'text-emerald-600' },
            ].map((stat) => (
              <div key={stat.label} className="space-y-1">
                <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase font-mono">{stat.label}</div>
                <div className={`text-xl tracking-tight font-semibold font-mono tabular-nums ${stat.color}`}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Lists of tasks (height auto, no fixed constraints to avoid empty vertical slots) */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Overdue Section */}
            <div className="flex flex-col bg-white border border-gray-200 rounded p-4 h-fit">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                <span className="text-xs font-bold text-red-600 uppercase tracking-wider font-mono">Overdue ({stats.overdue})</span>
                <Link to="/tasks?filter=overdue" className="text-[10px] text-gray-400 font-mono hover:text-gray-600">[View All]</Link>
              </div>
              {overdueTasks.length === 0 ? (
                <div className="text-xs text-gray-400 font-mono italic py-2">No overdue tasks.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {overdueTasks.map(task => (
                    <div key={task.id} className="py-2.5 space-y-1 font-mono text-xs">
                      <div className="flex justify-between items-start gap-2">
                        <Link to={`/tasks?id=${task.id}`} className="font-semibold text-gray-900 hover:underline hover:text-blue-600">{task.id}</Link>
                        <DeadlineIndicator task={task} />
                      </div>
                      <div className="text-gray-600 truncate text-[11px]">{task.client} // {task.screenReport}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Near Deadline Section */}
            <div className="flex flex-col bg-white border border-gray-200 rounded p-4 h-fit">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider font-mono">Upcoming Deadlines</span>
                <Link to="/tasks?filter=assigned" className="text-[10px] text-gray-400 font-mono hover:text-gray-600">[View All]</Link>
              </div>
              {upcomingDeadlines.length === 0 ? (
                <div className="text-xs text-gray-400 font-mono italic py-2">No tasks due in 3 days.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {upcomingDeadlines.map(task => (
                    <div key={task.id} className="py-2.5 space-y-1 font-mono text-xs">
                      <div className="flex justify-between items-start gap-2">
                        <Link to={`/tasks?id=${task.id}`} className="font-semibold text-gray-900 hover:underline hover:text-blue-600">{task.id}</Link>
                        <DeadlineIndicator task={task} />
                      </div>
                      <div className="text-gray-600 truncate text-[11px]">{task.client} // {task.screenReport}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Current Tasks */}
            <div className="flex flex-col bg-white border border-gray-200 rounded p-4 h-fit">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider font-mono">Active Assignments</span>
                <Link to="/tasks?filter=all" className="text-[10px] text-gray-400 font-mono hover:text-gray-600">[View All]</Link>
              </div>
              {currentTasks.length === 0 ? (
                <div className="text-xs text-gray-400 font-mono italic py-2">No active assignments.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {currentTasks.map(task => (
                    <div key={task.id} className="py-2.5 space-y-1 font-mono text-xs">
                      <div className="flex justify-between items-start gap-2">
                        <Link to={`/tasks?id=${task.id}`} className="font-semibold text-gray-900 hover:underline hover:text-blue-600">{task.id}</Link>
                        <div className="flex gap-1.5 shrink-0">
                          <StatusBadge status={task.status} />
                          <TaskTypeBadge type={task.type} />
                        </div>
                      </div>
                      <div className="text-gray-600 truncate text-[11px]">{task.client} // {task.screenReport}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="border-t border-gray-200 pt-6 space-y-3">
            <h3 className="text-xs font-bold text-gray-400 font-mono tracking-wider uppercase">Recent Activity</h3>
            <div className="border border-gray-200 rounded bg-gray-50/30 text-xs divide-y divide-gray-200">
              {loadingActivity ? (
                <div className="p-4 text-gray-400 font-mono italic text-center">Loading activity...</div>
              ) : activityError ? (
                <div className="p-4 text-red-500 font-mono italic text-center">Failed to load activity.</div>
              ) : recentActivity.length === 0 ? (
                <div className="p-4 text-gray-400 font-mono italic text-center">No recent activity.</div>
              ) : (
                recentActivity.map((log) => {
                  const dateStr = log.timestamp
                  return (
                    <div key={log.id} className="p-3 flex flex-col sm:flex-row sm:justify-between gap-2 hover:bg-gray-50/50 transition-colors">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Link to={`/tasks?id=${log.taskId}`} className="font-semibold font-mono text-gray-900 hover:underline hover:text-blue-600">{log.taskId}</Link>
                        <span className="text-gray-300 font-mono">|</span>
                        <span className={`inline-flex rounded px-1.5 py-0.2 text-[10px] font-bold font-mono ${
                          log.action === 'CREATE' ? 'bg-blue-50 text-blue-700' :
                          log.action === 'COMPLETE' ? 'bg-emerald-50 text-emerald-700' :
                          log.action === 'ARCHIVE' ? 'bg-gray-100 text-gray-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {log.action}
                        </span>
                        <span className="text-gray-600">
                          {log.action === 'CREATE' && 'Task created'}
                          {log.action === 'COMPLETE' && 'Task marked Done'}
                          {log.action === 'ARCHIVE' && 'Task archived'}
                          {log.action === 'UPDATE' && (
                            <span>
                              Changed <span className="font-semibold text-gray-800">{fieldLabel(log.field)}</span>: "{resolveDisplayValue(log.field, log.oldValue, masters)}" &rarr; "{resolveDisplayValue(log.field, log.newValue, masters)}"
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="text-gray-400 text-[10px] font-mono whitespace-nowrap self-start sm:self-center">{dateStr}</div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
