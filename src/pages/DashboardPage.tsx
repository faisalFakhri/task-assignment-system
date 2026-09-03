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
      .then(list => { if (active) { setRecentActivity(list); setLoadingActivity(false) } })
      .catch(err => { if (active) { setActivityError(err.message || 'Failed to load activity.'); setLoadingActivity(false) } })
    return () => { active = false }
  }, [fetchRecentHistory])

  const masters = useMemo(() => ({ consultants, clients, programmers }), [consultants, clients, programmers])
  const activeTasksList = useMemo(() => tasks.filter(t => !t.archived), [tasks])
  const stats = useMemo(() => {
    const totalActive = activeTasksList.filter(t => t.status !== 'Done').length
    const open = activeTasksList.filter(t => t.status === 'Open').length
    const assigned = activeTasksList.filter(t => t.status === 'Assign').length
    const overdue = activeTasksList.filter(t => { if (t.status === 'Done' || !t.targetDate) return false; const r = getRemainingDays(t.targetDate); return r !== null && r < 0 }).length
    const dueToday = activeTasksList.filter(t => { if (t.status === 'Done' || !t.targetDate) return false; return getRemainingDays(t.targetDate) === 0 }).length
    const completedThisMonth = activeTasksList.filter(t => { if (t.status !== 'Done' || !t.completedAt) return false; const d = new Date(t.completedAt); return d.getFullYear() === 2026 && d.getMonth() === 7 }).length
    return { totalActive, open, assigned, overdue, dueToday, completedThisMonth }
  }, [activeTasksList])

  const overdueTasks = useMemo(() => activeTasksList.filter(t => { if (t.status === 'Done' || !t.targetDate) return false; const r = getRemainingDays(t.targetDate); return r !== null && r < 0 }).slice(0, 5), [activeTasksList])
  const upcomingDeadlines = useMemo(() => activeTasksList.filter(t => { if (t.status === 'Done' || !t.targetDate) return false; const r = getRemainingDays(t.targetDate); return r !== null && r >= 0 && r <= 3 }).sort((a,b) => (getRemainingDays(a.targetDate) ?? 999) - (getRemainingDays(b.targetDate) ?? 999)).slice(0, 5), [activeTasksList])
  const currentTasks = useMemo(() => activeTasksList.filter(t => t.status !== 'Done').slice(0, 5), [activeTasksList])

  return (
    <div className="space-y-4">
      {error && (
        <div className="glass rounded-2xl border-red-400/20 bg-red-500/10 p-3 text-xs font-mono text-red-300 flex justify-between items-center">
          <span>Error: {error}</span>
          <button onClick={() => window.location.reload()} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-900">[Retry]</button>
        </div>
      )}
      {loading ? (
        <div className="glass rounded-2xl p-12 text-center font-mono text-xs text-white/40">Loading dashboard metrics...</div>
      ) : (
        <>
          <div className="glass-strong rounded-2xl px-5 py-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-white">Dashboard</h2>
              <p className="text-xs text-white/40 font-mono mt-0.5">Overview relative to {TODAY_STR} · Supabase · {activeTasksList.length} active tasks</p>
            </div>
            <span className="hidden sm:inline-flex items-center gap-2 glass-subtle rounded-full px-3 py-1 text-[11px] font-mono text-white/50">dark glass · Varian C</span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: 'Active Tasks', value: stats.totalActive, sub: 'total', glow: '', accent: 'from-violet-500 to-fuchsia-400' },
              { label: 'Open', value: stats.open, sub: 'needs triage', glow: 'glow-violet', accent: 'from-sky-400 to-blue-500' },
              { label: 'Assigned', value: stats.assigned, sub: 'in progress', glow: 'glow-cyan', accent: 'from-cyan-400 to-blue-500' },
              { label: 'Overdue', value: stats.overdue, sub: stats.overdue > 0 ? 'needs attention' : 'all clear', glow: stats.overdue > 0 ? 'glow-amber' : '', accent: 'from-amber-400 to-red-400' },
              { label: 'Due Today', value: stats.dueToday, sub: stats.dueToday > 0 ? 'due today' : '—', glow: '', accent: 'from-amber-400 to-orange-400' },
              { label: 'Done (Aug)', value: stats.completedThisMonth, sub: 'this month', glow: '', accent: 'from-emerald-400 to-teal-400' },
            ].map((stat) => (
              <div key={stat.label} className={`glass rounded-2xl p-4 relative overflow-hidden ${stat.glow}`}>
                <div className={`absolute -top-8 -right-8 w-20 h-20 rounded-full blur-2xl opacity-20 bg-gradient-to-br ${stat.accent}`} />
                <div className="text-[10px] font-bold tracking-widest text-white/35 uppercase font-mono">{stat.label}</div>
                <div className="mt-1 text-xl font-semibold font-mono tabular-nums text-white">{stat.value}</div>
                <div className="text-[11px] font-mono text-white/30 truncate">{stat.sub}</div>
                <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden"><div className={`h-full rounded-full bg-gradient-to-r ${stat.accent}`} style={{ width: `${Math.min(100, Math.max(12, stat.value * 7))}%` }} /></div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
                <span className="text-xs font-bold text-red-300 uppercase tracking-wider font-mono">Overdue ({stats.overdue})</span>
                <Link to="/tasks?filter=overdue" className="text-[10px] text-white/30 font-mono hover:text-white/60">[View All]</Link>
              </div>
              {overdueTasks.length === 0 ? <div className="text-xs text-white/30 font-mono italic py-2">No overdue tasks.</div> : (
                <div className="divide-y divide-white/5">
                  {overdueTasks.map(task => (
                    <div key={task.id} className="py-2.5 space-y-1 font-mono text-xs">
                      <div className="flex justify-between items-start gap-2">
                        <Link to={`/tasks?id=${task.id}`} className="font-semibold text-white hover:text-violet-300">{task.id}</Link>
                        <DeadlineIndicator task={task} />
                      </div>
                      <div className="text-white/45 truncate text-[11px]">{task.client} // {task.screenReport}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">Upcoming Deadlines</span>
                <Link to="/tasks?filter=assigned" className="text-[10px] text-white/30 font-mono hover:text-white/60">[View All]</Link>
              </div>
              {upcomingDeadlines.length === 0 ? <div className="text-xs text-white/30 font-mono italic py-2">No tasks due in 3 days.</div> : (
                <div className="divide-y divide-white/5">
                  {upcomingDeadlines.map(task => (
                    <div key={task.id} className="py-2.5 space-y-1 font-mono text-xs">
                      <div className="flex justify-between items-start gap-2">
                        <Link to={`/tasks?id=${task.id}`} className="font-semibold text-white hover:text-violet-300">{task.id}</Link>
                        <DeadlineIndicator task={task} />
                      </div>
                      <div className="text-white/45 truncate text-[11px]">{task.client} // {task.screenReport}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
                <span className="text-xs font-bold text-white/80 uppercase tracking-wider font-mono">Active Assignments</span>
                <Link to="/tasks?filter=all" className="text-[10px] text-white/30 font-mono hover:text-white/60">[View All]</Link>
              </div>
              {currentTasks.length === 0 ? <div className="text-xs text-white/30 font-mono italic py-2">No active assignments.</div> : (
                <div className="divide-y divide-white/5">
                  {currentTasks.map(task => (
                    <div key={task.id} className="py-2.5 space-y-1 font-mono text-xs">
                      <div className="flex justify-between items-start gap-2">
                        <Link to={`/tasks?id=${task.id}`} className="font-semibold text-white hover:text-violet-300">{task.id}</Link>
                        <div className="flex gap-1.5 shrink-0"><StatusBadge status={task.status} /><TaskTypeBadge type={task.type} /></div>
                      </div>
                      <div className="text-white/45 truncate text-[11px]">{task.client} // {task.screenReport}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="glass rounded-2xl p-4">
            <h3 className="text-[10px] font-bold tracking-widest text-white/30 uppercase font-mono">Recent Activity · task_history</h3>
            <div className="mt-3 rounded-xl overflow-hidden border border-white/5 divide-y divide-white/5">
              {loadingActivity ? <div className="p-4 text-white/30 font-mono italic text-center text-xs">Loading activity...</div>
              : activityError ? <div className="p-4 text-red-300 font-mono italic text-center text-xs">Failed to load activity.</div>
              : recentActivity.length === 0 ? <div className="p-4 text-white/30 font-mono italic text-center text-xs">No recent activity.</div>
              : recentActivity.map((log) => (
                  <div key={log.id} className="p-3 flex flex-col sm:flex-row sm:justify-between gap-2 hover:bg-white/[0.03]">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <Link to={`/tasks?id=${log.taskId}`} className="font-semibold font-mono text-white hover:text-violet-300">{log.taskId}</Link>
                      <span className="text-white/15 font-mono">|</span>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold font-mono border ${log.action === 'CREATE' ? 'bg-sky-400/15 text-sky-300 border-sky-400/20' : log.action === 'COMPLETE' ? 'bg-emerald-400/15 text-emerald-300 border-emerald-400/20' : log.action === 'ARCHIVE' ? 'bg-white/5 text-white/40 border-white/10' : 'bg-amber-400/15 text-amber-300 border-amber-400/20'}`}>{log.action}</span>
                      <span className="text-white/50">
                        {log.action === 'CREATE' && 'Task created'}
                        {log.action === 'COMPLETE' && 'Task marked Done'}
                        {log.action === 'ARCHIVE' && 'Task archived'}
                        {log.action === 'UPDATE' && <span>Changed <span className="font-semibold text-white">{fieldLabel(log.field)}</span>: <span className="text-white/30 line-through">{resolveDisplayValue(log.field, log.oldValue, masters)}</span> → <span className="text-white">{resolveDisplayValue(log.field, log.newValue, masters)}</span></span>}
                      </span>
                    </div>
                    <div className="text-white/25 text-[10px] font-mono whitespace-nowrap self-start sm:self-center">{log.timestamp}</div>
                  </div>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
