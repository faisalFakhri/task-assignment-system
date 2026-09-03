/* eslint-disable react/set-state-in-effect */
import { useMemo, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTasks } from '../context/TaskContext'
import type { TaskHistory, TaskStatus } from '../types/task.types'
import { getRemainingDays, TODAY_STR, isInDateRange } from '../lib/dateUtils'
import StatusBadge from '../components/StatusBadge'
import TaskTypeBadge from '../components/TaskTypeBadge'
import DeadlineIndicator from '../components/DeadlineIndicator'
import { fieldLabel, resolveDisplayValue } from '../lib/historyDisplay'

type FilterMode = 'created' | 'target'

const ALL_STATUSES: TaskStatus[] = ['Open', 'Assign', 'In Progress', 'QC', 'Hold', 'Reopen', 'Reject', 'Done']

const STATUS_CONFIG: Record<TaskStatus, { tint: string; accent: string; dot: string }> = {
  Open:        { tint: 'glass-tint-open',     accent: 'from-sky-400 to-blue-500',     dot: 'bg-sky-400' },
  Assign:      { tint: 'glass-tint-assign',   accent: 'from-amber-400 to-orange-400', dot: 'bg-amber-400' },
  'In Progress': { tint: 'glass-tint-progress', accent: 'from-cyan-400 to-sky-500',    dot: 'bg-cyan-400' },
  QC:          { tint: 'glass-tint-qc',       accent: 'from-violet-400 to-fuchsia-400', dot: 'bg-violet-400' },
  Hold:        { tint: 'glass-tint-hold',     accent: 'from-slate-400 to-slate-500',  dot: 'bg-slate-400' },
  Reopen:      { tint: 'glass-tint-reopen',   accent: 'from-orange-400 to-amber-400', dot: 'bg-orange-400' },
  Reject:      { tint: 'glass-tint-reject',   accent: 'from-red-400 to-rose-400',     dot: 'bg-red-400' },
  Done:        { tint: 'glass-tint-done',     accent: 'from-emerald-400 to-teal-400', dot: 'bg-emerald-400' },
}

function addDays(dateStr: string, delta: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + delta)
  return d.toISOString().slice(0, 10)
}
function firstDayOfMonth(dateStr: string): string {
  return dateStr.slice(0, 7) + '-01'
}

export default function DashboardPage() {
  const { tasks, consultants, clients, programmers, loading, error, fetchRecentHistory } = useTasks()
  const [recentActivity, setRecentActivity] = useState<TaskHistory[]>([])
  const [loadingActivity, setLoadingActivity] = useState(true)
  const [activityError, setActivityError] = useState<string | null>(null)

  // Date range filter
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [filterMode, setFilterMode] = useState<FilterMode>('created')

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

  // Active (non-archived) tasks
  const activeTasksList = useMemo(() => tasks.filter(t => !t.archived), [tasks])

  // Apply date range filter
  const filteredByDate = useMemo(() => {
    if (!fromDate && !toDate) return activeTasksList
    return activeTasksList.filter(t => {
      if (filterMode === 'target') {
        if (!t.targetDate) return false
        return isInDateRange(t.targetDate, fromDate, toDate)
      }
      return isInDateRange(t.createdAt, fromDate, toDate)
    })
  }, [activeTasksList, fromDate, toDate, filterMode])

  const hasDateFilter = !!(fromDate || toDate)

  const stats = useMemo(() => {
    const byStatus: Record<string, number> = {}
    ALL_STATUSES.forEach(s => { byStatus[s] = filteredByDate.filter(t => t.status === s).length })
    const total = filteredByDate.length
    const overdue = filteredByDate.filter(t => { if (t.status === 'Done' || !t.targetDate) return false; const r = getRemainingDays(t.targetDate); return r !== null && r < 0 }).length
    const dueToday = filteredByDate.filter(t => { if (t.status === 'Done' || !t.targetDate) return false; return getRemainingDays(t.targetDate) === 0 }).length
    const dueSoon = filteredByDate.filter(t => { if (t.status === 'Done' || !t.targetDate) return false; const r = getRemainingDays(t.targetDate); return r !== null && r >= 1 && r <= 3 }).length
    return { total, byStatus, overdue, dueToday, dueSoon }
  }, [filteredByDate])

  const overdueTasks = useMemo(() => filteredByDate.filter(t => { if (t.status === 'Done' || !t.targetDate) return false; const r = getRemainingDays(t.targetDate); return r !== null && r < 0 }).slice(0, 5), [filteredByDate])
  const upcomingDeadlines = useMemo(() => filteredByDate.filter(t => { if (t.status === 'Done' || !t.targetDate) return false; const r = getRemainingDays(t.targetDate); return r !== null && r >= 0 && r <= 3 }).sort((a,b) => (getRemainingDays(a.targetDate) ?? 999) - (getRemainingDays(b.targetDate) ?? 999)).slice(0, 5), [filteredByDate])
  const currentTasks = useMemo(() => filteredByDate.filter(t => t.status !== 'Done').slice(0, 5), [filteredByDate])

  const applyPreset = (preset: 'today' | '7d' | 'month' | 'reset') => {
    if (preset === 'today') { setFromDate(TODAY_STR); setToDate(TODAY_STR) }
    else if (preset === '7d') { setFromDate(addDays(TODAY_STR, -6)); setToDate(TODAY_STR) }
    else if (preset === 'month') { setFromDate(firstDayOfMonth(TODAY_STR)); setToDate(TODAY_STR) }
    else { setFromDate(''); setToDate('') }
  }

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
              <p className="text-xs text-white/40 font-mono mt-0.5">
                Overview relative to {TODAY_STR} · Supabase · {activeTasksList.length} active tasks
                {hasDateFilter ? <span className="text-violet-300"> · filtered {filteredByDate.length} in range</span> : null}
              </p>
            </div>
            <span className="hidden sm:inline-flex items-center gap-2 glass-subtle rounded-full px-3 py-1 text-[11px] font-mono text-white/50">soft tint · per-status</span>
          </div>

          {/* Date range filter bar */}
          <div className="glass rounded-2xl p-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold tracking-widest text-white/30 uppercase font-mono">Filter Tanggal</span>
              <div className="flex rounded-full glass-subtle p-0.5 border border-white/10">
                <button
                  onClick={() => setFilterMode('created')}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold transition-colors ${filterMode === 'created' ? 'bg-white text-slate-900' : 'text-white/50 hover:text-white'}`}
                >Created</button>
                <button
                  onClick={() => setFilterMode('target')}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold transition-colors ${filterMode === 'target' ? 'bg-white text-slate-900' : 'text-white/50 hover:text-white'}`}
                >Target</button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="rounded-xl glass-subtle border border-white/10 px-2.5 py-1.5 text-xs font-mono text-white bg-transparent focus:outline-none focus:border-violet-400/40" />
              <span className="text-white/25 font-mono text-xs">—</span>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="rounded-xl glass-subtle border border-white/10 px-2.5 py-1.5 text-xs font-mono text-white bg-transparent focus:outline-none focus:border-violet-400/40" />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button onClick={() => applyPreset('today')} className={`px-2.5 py-1 rounded-full text-[11px] font-mono border transition-colors ${fromDate === TODAY_STR && toDate === TODAY_STR ? 'bg-violet-500/20 border-violet-400/30 text-violet-200' : 'glass-subtle border-white/10 text-white/50 hover:text-white'}`}>Hari ini</button>
              <button onClick={() => applyPreset('7d')} className="px-2.5 py-1 rounded-full text-[11px] font-mono glass-subtle border border-white/10 text-white/50 hover:text-white">7 Hari</button>
              <button onClick={() => applyPreset('month')} className="px-2.5 py-1 rounded-full text-[11px] font-mono glass-subtle border border-white/10 text-white/50 hover:text-white">Bulan Ini</button>
              {hasDateFilter && <button onClick={() => applyPreset('reset')} className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-white text-slate-900 font-semibold">Reset</button>}
            </div>
            {hasDateFilter && <span className="text-[11px] font-mono text-white/30">{fromDate || '…'} → {toDate || '…'}</span>}
          </div>

          {/* Per-status cards: Total + 8 statuses */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9">
            {/* Total */}
            <Link to="/tasks?filter=all" className="glass glass-tint-total rounded-2xl p-4 relative overflow-hidden hover:scale-[1.015] transition-transform">
              <div className="absolute -top-8 -right-8 w-20 h-20 rounded-full blur-2xl opacity-20 bg-gradient-to-br from-violet-500 to-cyan-400" />
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
                <span className="text-[10px] font-bold tracking-widest text-white/50 uppercase font-mono">Total</span>
              </div>
              <div className="mt-1 text-xl font-semibold font-mono tabular-nums text-white">{stats.total}</div>
              <div className="text-[11px] font-mono text-white/30 truncate">{hasDateFilter ? 'in range' : 'active'}</div>
              <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" style={{ width: `${Math.min(100, Math.max(12, stats.total * 4))}%` }} /></div>
            </Link>
            {ALL_STATUSES.map(s => {
              const cfg = STATUS_CONFIG[s]
              const v = stats.byStatus[s] ?? 0
              return (
                <Link key={s} to={`/tasks?status=${encodeURIComponent(s)}`} className={`glass ${cfg.tint} rounded-2xl p-4 relative overflow-hidden hover:scale-[1.015] transition-transform`}>
                  <div className={`absolute -top-8 -right-8 w-20 h-20 rounded-full blur-2xl opacity-20 bg-gradient-to-br ${cfg.accent}`} />
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    <span className="text-[10px] font-bold tracking-widest text-white/50 uppercase font-mono truncate">{s}</span>
                  </div>
                  <div className="mt-1 text-xl font-semibold font-mono tabular-nums text-white">{v}</div>
                  <div className="text-[11px] font-mono text-white/30 truncate">{v === 0 ? '—' : v === 1 ? '1 task' : `${v} tasks`}</div>
                  <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden"><div className={`h-full rounded-full bg-gradient-to-r ${cfg.accent}`} style={{ width: `${v === 0 ? 8 : Math.min(100, Math.max(14, v * 12))}%` }} /></div>
                </Link>
              )
            })}
          </div>

          {/* Alert row: Overdue / Due Today / Due Soon */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="glass glass-tint-overdue rounded-2xl p-3.5 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold tracking-widest text-white/40 uppercase font-mono">Overdue</div>
                <div className="text-lg font-semibold font-mono text-white">{stats.overdue}</div>
              </div>
              <span className={`text-[11px] font-mono px-2.5 py-1 rounded-full border ${stats.overdue > 0 ? 'bg-red-500/15 text-red-300 border-red-400/20' : 'bg-white/5 text-white/30 border-white/10'}`}>{stats.overdue > 0 ? 'needs attention' : 'all clear'}</span>
            </div>
            <div className="glass glass-tint-assign rounded-2xl p-3.5 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold tracking-widest text-white/40 uppercase font-mono">Due Today</div>
                <div className="text-lg font-semibold font-mono text-white">{stats.dueToday}</div>
              </div>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-full glass-subtle border border-white/10 text-white/50">{stats.dueToday > 0 ? 'due today' : '—'}</span>
            </div>
            <div className="glass rounded-2xl p-3.5 flex items-center justify-between" style={{ background: 'rgba(186,235,255,0.09)', borderColor: 'rgba(125,211,252,0.18)' }}>
              <div>
                <div className="text-[10px] font-bold tracking-widest text-white/40 uppercase font-mono">Due in 3 Days</div>
                <div className="text-lg font-semibold font-mono text-white">{stats.dueSoon}</div>
              </div>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-full glass-subtle border border-white/10 text-white/50">{stats.dueSoon > 0 ? 'upcoming' : '—'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
                <span className="text-xs font-bold text-red-300 uppercase tracking-wider font-mono">Overdue ({stats.overdue})</span>
                <Link to="/tasks?filter=overdue" className="text-[10px] text-white/30 font-mono hover:text-white/60">[View All]</Link>
              </div>
              {overdueTasks.length === 0 ? <div className="text-xs text-white/30 font-mono italic py-2">No overdue tasks{hasDateFilter ? ' in range' : ''}.</div> : (
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
              {upcomingDeadlines.length === 0 ? <div className="text-xs text-white/30 font-mono italic py-2">No tasks due in 3 days{hasDateFilter ? ' in range' : ''}.</div> : (
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
              {currentTasks.length === 0 ? <div className="text-xs text-white/30 font-mono italic py-2">No active assignments{hasDateFilter ? ' in range' : ''}.</div> : (
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
