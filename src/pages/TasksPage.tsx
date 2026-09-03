/* eslint-disable react/set-state-in-effect */
import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTasks } from '../context/TaskContext'
import { getRemainingDays } from '../lib/dateUtils'
import { mockConsultants } from '../data/mockData'
import StatusBadge from '../components/StatusBadge'
import TaskTypeBadge from '../components/TaskTypeBadge'
import DeadlineIndicator from '../components/DeadlineIndicator'
import EmptyState from '../components/EmptyState'
import TaskDetail from '../components/TaskDetail'
import { exportTeamAri } from '../lib/excelTeamAri'
import TaskForm from '../components/TaskForm'

type SortField = 'id' | 'consultant' | 'type' | 'client' | 'screenReport' | 'status' | 'programmer' | 'targetDate'
type SortOrder = 'asc' | 'desc'

export default function TasksPage() {
  const { tasks, clients, programmers, loading, error } = useTasks()
  const [searchParams, setSearchParams] = useSearchParams()

  // Panel state
  const [activePanel, setActivePanel] = useState<'detail' | 'create' | 'edit' | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  // Filters State
  const [searchQuery, setSearchQuery] = useState('')
  const [filterConsultant, setFilterConsultant] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterClient, setFilterClient] = useState('')
  const [filterProgrammer, setFilterProgrammer] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSqlServer, setFilterSqlServer] = useState('')
  const [filterDatabase, setFilterDatabase] = useState('')
  const [filterOverdueOnly, setFilterOverdueOnly] = useState(false)

  // Export selection — checkbox per row (so export tidak harus semua)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Sorting State
  const [sortField, setSortField] = useState<SortField>('id')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10 // Increased from 8 to 10 for better desktop flow

  // Sync state with search params (e.g. navigation from Dashboard or sidebar)
  const urlFilter = searchParams.get('filter')
  const urlStatus = searchParams.get('status')
  const urlId = searchParams.get('id')

  const ALLOWED_STATUSES = ['QC','Open','Assign','Done','Reject','Reopen','Hold','In Progress'] as const

  useEffect(() => {
    // Status param from sidebar has priority — e.g. /tasks?status=QC
    if (urlStatus && (ALLOWED_STATUSES as readonly string[]).includes(urlStatus)) {
      setFilterStatus(urlStatus)
      setFilterOverdueOnly(false)
      setCurrentPage(1)
      return
    }
    // Reset filters and apply presets based on the main category filter
    if (urlFilter) {
      setFilterConsultant('')
      setFilterType('')
      setFilterClient('')
      setFilterProgrammer('')
      setFilterStatus('')
      setFilterOverdueOnly(false)

      if (urlFilter === 'open') {
        setFilterStatus('Open')
      } else if (urlFilter === 'assigned') {
        setFilterStatus('Assign')
      } else if (urlFilter === 'completed') {
        setFilterStatus('Done')
      } else if (urlFilter === 'overdue') {
        setFilterOverdueOnly(true)
      }
    }
    // When navigating to /tasks?filter=all or plain /tasks, clear status-driven filter
    if (!urlFilter && !urlStatus) {
      // keep current dropdown value — don't force reset, just paginate
    }
    setCurrentPage(1)
  }, [urlFilter, urlStatus])

  useEffect(() => {
    if (urlId) {
      setSelectedTaskId(urlId)
      setActivePanel('detail')
    }
  }, [urlId])

  // Auto-prune selection if task removed/archived
  useEffect(() => {
    setSelectedIds(prev => {
      const keep = new Set<string>()
      const validIds = new Set(tasks.map(x => x.id))
      prev.forEach(id => { if (validIds.has(id)) keep.add(id) })
      return keep.size === prev.size ? prev : keep
    })
  }, [tasks])

  // Get distinct metadata for filter dropdowns directly from tasks
  const sqlServers = useMemo(() => {
    const set = new Set(tasks.map(t => t.sqlServer).filter(Boolean))
    return Array.from(set)
  }, [tasks])

  const databases = useMemo(() => {
    const set = new Set(tasks.map(t => t.database).filter(Boolean))
    return Array.from(set)
  }, [tasks])

  // Get current header category title based on urlFilter / urlStatus
  const getHeaderTitle = () => {
    if (urlStatus && (ALLOWED_STATUSES as readonly string[]).includes(urlStatus)) {
      return `${urlStatus} Tasks`
    }
    switch (urlFilter) {
      case 'open':
        return 'Open Tasks'
      case 'assigned':
        return 'Assigned Tasks'
      case 'overdue':
        return 'Overdue Tasks'
      case 'completed':
        return 'Completed Tasks'
      case 'archived':
        return 'Archived Tasks'
      default:
        return 'All Active Tasks'
    }
  }

  // Count active filters (except sidebar query params)
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filterConsultant) count++
    if (filterType) count++
    if (filterClient) count++
    if (filterProgrammer) count++
    const statusDrivenBySidebar = !!(urlStatus && (ALLOWED_STATUSES as readonly string[]).includes(urlStatus)) || urlFilter === 'open' || urlFilter === 'assigned' || urlFilter === 'completed'
    if (filterStatus && !statusDrivenBySidebar) count++
    if (filterSqlServer) count++
    if (filterDatabase) count++
    if (filterOverdueOnly && urlFilter !== 'overdue') count++
    if (searchQuery.trim()) count++
    return count
  }, [filterConsultant, filterType, filterClient, filterProgrammer, filterStatus, filterSqlServer, filterDatabase, filterOverdueOnly, searchQuery, urlFilter, urlStatus])

  // Process & Filter Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // 1. Sidebar Category Filters (completed/archived)
      if (urlFilter === 'archived') {
        if (!task.archived) return false
      } else {
        if (task.archived) return false
        if (urlFilter === 'completed' && task.status !== 'Done') return false
      }

      // 2. Global search match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const match =
          task.id.toLowerCase().includes(query) ||
          task.client.toLowerCase().includes(query) ||
          task.screenReport.toLowerCase().includes(query) ||
          task.request.toLowerCase().includes(query) ||
          task.consultant.toLowerCase().includes(query) ||
          task.programmer.toLowerCase().includes(query) ||
          task.sqlServer.toLowerCase().includes(query) ||
          task.database.toLowerCase().includes(query) ||
          task.notes.toLowerCase().includes(query)

        if (!match) return false
      }

      // 3. Dropdown Filters
      if (filterConsultant && task.consultant !== filterConsultant) return false
      if (filterType && task.type !== filterType) return false
      if (filterClient && task.client !== filterClient) return false
      if (filterProgrammer && task.programmer !== filterProgrammer) return false
      if (filterStatus && task.status !== filterStatus) return false
      if (filterSqlServer && task.sqlServer !== filterSqlServer) return false
      if (filterDatabase && task.database !== filterDatabase) return false

      // 4. Overdue filter
      if (filterOverdueOnly) {
        if (task.status === 'Done' || !task.targetDate) return false
        const rem = getRemainingDays(task.targetDate)
        if (rem === null || rem >= 0) return false
      }

      return true
    })
  }, [tasks, urlFilter, searchQuery, filterConsultant, filterType, filterClient, filterProgrammer, filterStatus, filterSqlServer, filterDatabase, filterOverdueOnly])

  // Sort Tasks
  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      let valA = a[sortField] ?? ''
      let valB = b[sortField] ?? ''

      if (sortField === 'id') {
        const numA = parseInt(a.id.replace('TASK-', ''))
        const numB = parseInt(b.id.replace('TASK-', ''))
        return sortOrder === 'asc' ? numA - numB : numB - numA
      }

      if (sortField === 'targetDate') {
        const dateA = valA ? new Date(valA).getTime() : 9999999999999
        const dateB = valB ? new Date(valB).getTime() : 9999999999999
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
      }

      valA = String(valA).toLowerCase()
      valB = String(valB).toLowerCase()

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredTasks, sortField, sortOrder])

  // Pagination logic
  const paginatedTasks = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return sortedTasks.slice(startIndex, startIndex + itemsPerPage)
  }, [sortedTasks, currentPage, itemsPerPage])

  const totalPages = Math.ceil(sortedTasks.length / itemsPerPage)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const handleRowClick = (taskId: string) => {
    setSelectedTaskId(taskId)
    setActivePanel('detail')
    const params = new URLSearchParams(searchParams)
    params.set('id', taskId)
    setSearchParams(params)
  }

  const handleClosePanel = () => {
    setActivePanel(null)
    setSelectedTaskId(null)
    const params = new URLSearchParams(searchParams)
    params.delete('id')
    setSearchParams(params)
  }

  const handleExport = async (mode: 'selection' | 'filtered' | 'all' = 'selection') => {
    try {
      if (mode === 'selection' && selectedIds.size > 0) {
        const picked = filteredTasks.filter(x => selectedIds.has(x.id))
        const list = picked.length ? picked : tasks.filter(x => selectedIds.has(x.id))
        if (!list.length) { alert('Tidak ada task terpilih yang cocok dengan filter.'); return }
        await exportTeamAri(list)
        return
      }
      if (mode === 'filtered') {
        if (!filteredTasks.length) { alert('Tidak ada data untuk di-export (filter kosong).'); return }
        await exportTeamAri(filteredTasks)
        return
      }
      // all = semua task aktif (atau filtered jika ada)
      const list = filteredTasks.length ? filteredTasks : tasks.filter(x => !x.archived)
      if (!list.length) { alert('Tidak ada data untuk di-export.'); return }
      await exportTeamAri(list)
    } catch (err: any) {
      alert(err.message || 'Export gagal')
    }
  }
  const selectedCount = selectedIds.size
  const filteredIds = new Set(filteredTasks.map(x => x.id))
  const allFilteredSelected = filteredTasks.length > 0 && filteredTasks.every(x => selectedIds.has(x.id))
  const toggleAllFiltered = () => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (allFilteredSelected) {
        filteredTasks.forEach(x => next.delete(x.id))
      } else {
        filteredTasks.forEach(x => next.add(x.id))
      }
      return next
    })
  }
  const toggleOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const handleOpenCreate = () => {
    setActivePanel('create')
    setSelectedTaskId(null)
  }

  const handleEditClick = (taskId: string) => {
    setSelectedTaskId(taskId)
    setActivePanel('edit')
  }

  const clearAllFilters = () => {
    setSearchQuery('')
    setFilterConsultant('')
    setFilterType('')
    setFilterClient('')
    setFilterProgrammer('')
    setFilterStatus('')
    setFilterSqlServer('')
    setFilterDatabase('')
    setFilterOverdueOnly(false)
  }

  return (
    <div className="flex h-[calc(100vh-80px)] relative overflow-hidden gap-4 text-sm">
      {/* List Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {error && (
          <div className="mb-4 rounded-2xl glass border-red-400/20 bg-red-500/10 p-3 text-xs font-mono text-red-300 flex justify-between items-center shrink-0">
            <span>Error: {error}</span>
            <button onClick={() => window.location.reload()} className="underline font-bold">[Retry]</button>
          </div>
        )}

        {/* Page Title & Search Header */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center mb-4">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-white flex items-center gap-2">
              <span>{getHeaderTitle()}</span>
              <span className="text-xs glass-subtle text-white/50 px-2 py-0.5 rounded-full font-mono font-normal border border-white/5">
                {filteredTasks.length} tasks
              </span>
            </h2>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto font-sans text-xs">
            <div className="relative w-full sm:w-64 font-sans text-xs">
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-xl glass-subtle border border-white/10 px-3 py-1.5 focus:outline-none placeholder:text-white/25 text-white"
              />
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <button
                onClick={() => handleExport('selection')}
                disabled={selectedCount===0}
                className="rounded-full glass border border-white/10 text-white px-3 py-1.5 text-xs font-semibold hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title={selectedCount? `Export ${selectedCount} terpilih ke TEAM ARI (.xlsx)` : 'Pilih task dulu (centang di tabel)'}
              >
                Export Pilihan{selectedCount? ` (${selectedCount})`:''}
              </button>
              <button
                onClick={() => handleExport('filtered')}
                disabled={filteredTasks.length===0}
                className="rounded-full glass border border-white/10 text-white/70 px-3 py-1.5 text-xs font-semibold hover:bg-white/5 transition-colors disabled:opacity-30"
                title="Export hasil filter saat ini"
              >
                Export Filter ({filteredTasks.length})
              </button>
            </div>
            <button
              onClick={handleOpenCreate}
              className="rounded-full bg-white text-slate-900 px-4 py-1.5 font-semibold hover:bg-white/90 transition-colors shrink-0"
            >
              New Task
            </button>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="rounded-full glass-subtle text-white/70 px-3 py-1.5 hover:bg-white/5 transition-colors shrink-0 font-mono border border-white/10"
              >
                Clear filters ({activeFiltersCount})
              </button>
            )}
          </div>
        </div>

        {selectedCount > 0 && (
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-white/50">{selectedCount} terpilih</span>
            <button onClick={() => setSelectedIds(new Set())} className="rounded-full glass-subtle border border-white/10 px-2.5 py-1 text-white/60 hover:text-white">Clear pilihan</button>
            <button onClick={() => handleExport('selection')} className="rounded-full bg-white text-slate-900 px-3 py-1 font-semibold">Export Pilihan</button>
          </div>
        )}
        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8 mb-4 text-xs glass rounded-2xl p-3 font-mono">
          <div>
            <select
              value={filterConsultant}
              onChange={e => setFilterConsultant(e.target.value)}
              className={`w-full rounded-xl bg-slate-800/90 border border-white/10 px-2.5 py-2 text-xs text-white focus:outline-none focus:border-violet-400/40 focus:ring-1 focus:ring-violet-400/20 ${
                filterConsultant ? 'border-violet-400/40 bg-violet-500/10 font-semibold text-white' : 'border-white/10 text-white/70'
              }`}
            >
              <option value="">Consultant</option>
              {mockConsultants.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className={`w-full rounded-xl bg-slate-800/90 border border-white/10 px-2.5 py-2 text-xs text-white focus:outline-none focus:border-violet-400/40 focus:ring-1 focus:ring-violet-400/20 ${
                filterType ? 'border-violet-400/40 bg-violet-500/10 font-semibold text-white' : 'border-white/10 text-white/70'
              }`}
            >
              <option value="">Type</option>
              <option value="Bugs">Bug</option>
              <option value="Improvements">Improvement</option>
            </select>
          </div>
          <div>
            <select
              value={filterClient}
              onChange={e => setFilterClient(e.target.value)}
              className={`w-full rounded-xl bg-slate-800/90 border border-white/10 px-2.5 py-2 text-xs text-white focus:outline-none focus:border-violet-400/40 focus:ring-1 focus:ring-violet-400/20 ${
                filterClient ? 'border-violet-400/40 bg-violet-500/10 font-semibold text-white' : 'border-white/10 text-white/70'
              }`}
            >
              <option value="">Client</option>
              {clients.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={filterProgrammer}
              onChange={e => setFilterProgrammer(e.target.value)}
              className={`w-full rounded-xl bg-slate-800/90 border border-white/10 px-2.5 py-2 text-xs text-white focus:outline-none focus:border-violet-400/40 focus:ring-1 focus:ring-violet-400/20 ${
                filterProgrammer ? 'border-violet-400/40 bg-violet-500/10 font-semibold text-white' : 'border-white/10 text-white/70'
              }`}
            >
              <option value="">Programmer</option>
              {programmers.map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className={`w-full rounded-xl bg-slate-800/90 border border-white/10 px-2.5 py-2 text-xs text-white focus:outline-none focus:border-violet-400/40 focus:ring-1 focus:ring-violet-400/20 ${
                filterStatus ? 'border-violet-400/40 bg-violet-500/10 font-semibold text-white' : 'border-white/10 text-white/70'
              }`}
              disabled={!!urlStatus || urlFilter === 'open' || urlFilter === 'assigned' || urlFilter === 'completed'}
            >
              <option value="">Status</option>
              <option value="QC">QC</option>
              <option value="Open">Open</option>
              <option value="Assign">Assign</option>
              <option value="Done">Done</option>
              <option value="Reject">Reject</option>
              <option value="Reopen">Reopen</option>
              <option value="Hold">Hold</option>
              <option value="In Progress">In Progress</option>
            </select>
          </div>
          <div>
            <select
              value={filterSqlServer}
              onChange={e => setFilterSqlServer(e.target.value)}
              className={`w-full rounded-xl bg-slate-800/90 border border-white/10 px-2.5 py-2 text-xs text-white focus:outline-none focus:border-violet-400/40 focus:ring-1 focus:ring-violet-400/20 ${
                filterSqlServer ? 'border-violet-400/40 bg-violet-500/10 font-semibold text-white' : 'border-white/10 text-white/70'
              }`}
            >
              <option value="">SQL Server</option>
              {sqlServers.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={filterDatabase}
              onChange={e => setFilterDatabase(e.target.value)}
              className={`w-full rounded-xl bg-slate-800/90 border border-white/10 px-2.5 py-2 text-xs text-white focus:outline-none focus:border-violet-400/40 focus:ring-1 focus:ring-violet-400/20 ${
                filterDatabase ? 'border-violet-400/40 bg-violet-500/10 font-semibold text-white' : 'border-white/10 text-white/70'
              }`}
            >
              <option value="">Database</option>
              {databases.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className={`flex items-center justify-center border rounded-xl p-1 glass-subtle border-white/10 ${
            filterOverdueOnly ? 'border-violet-400/40 bg-violet-500/10 font-semibold text-white' : 'border-white/10 text-white/70'
          }`}>
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filterOverdueOnly}
                onChange={e => setFilterOverdueOnly(e.target.checked)}
                className="rounded text-violet-500 focus:ring-violet-500 h-3w-3"
                disabled={urlFilter === 'overdue'}
              />
              <span>Overdue</span>
            </label>
          </div>
        </div>

        {/* Tasks Table */}
        <div className="flex-1 glass rounded-2xl overflow-auto min-h-0 relative">
          {loading ? (
            <div className="p-12 h-full flex flex-col items-center justify-center font-mono text-xs text-white/30">
              Loading database...
            </div>
          ) : sortedTasks.length === 0 ? (
            <div className="p-12 h-full flex items-center justify-center">
              <EmptyState
                title="No tasks match the current filters."
                description="Try clearing some filter criteria, revising your keyword search, or navigate to a different view."
                actionLabel="Reset all filters"
                onAction={clearAllFilters}
              />
            </div>
          ) : (
            <table className="min-w-full divide-y divide-white/5 text-left text-[12px] font-sans table-fixed">
              <thead className="bg-white/[0.04] backdrop-blur sticky top-0 z-10 font-mono text-[10px] text-white/40 uppercase tracking-wider">
                <tr>
                  <th className="px-2 py-2 w-8">
                    <input type="checkbox" checked={allFilteredSelected} onChange={toggleAllFiltered} className="rounded border-white/20 bg-slate-800 text-violet-500 focus:ring-violet-500" title={allFilteredSelected? 'Batal pilih semua (halaman filter)' : 'Pilih semua (hasil filter)'} />
                  </th>
                  {[
                    { field: 'id', label: 'ID', width: 'w-24' },
                    { field: 'consultant', label: 'Consultant', width: 'w-28' },
                    { field: 'type', label: 'Type', width: 'w-28' },
                    { field: 'client', label: 'Client', width: 'w-48' },
                    { field: 'screenReport', label: 'Screen / Report', width: 'w-52' },
                    { field: 'status', label: 'Status', width: 'w-24' },
                    { field: 'programmer', label: 'Programmer', width: 'w-32' },
                    { field: 'targetDate', label: 'Target', width: 'w-28' },
                  ].map(col => (
                    <th
                      key={col.field}
                      scope="col"
                      onClick={() => handleSort(col.field as SortField)}
                      className={`px-3 py-2 font-bold cursor-pointer hover:bg-white/5 ${col.width}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{col.label}</span>
                        {sortField === col.field && (
                          <span className="text-[10px] text-white/30">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                        )}
                      </div>
                    </th>
                  ))}
                  <th scope="col" className="px-3 py-2 font-bold w-32">
                    Days Left
                  </th>
                  <th scope="col" className="px-3 py-2 font-bold w-16 text-center">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedTasks.map(task => {
                  const isSelected = selectedTaskId === task.id
                  return (
                    <tr
                      key={task.id}
                      onClick={() => handleRowClick(task.id)}
                      className={`cursor-pointer hover:bg-white/[0.04] transition-colors ${
                        isSelected ? 'bg-white/5' : ''
                      }`}
                    >
                      <td className="px-2 py-2" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedIds.has(task.id)} onChange={() => toggleOne(task.id)} className="rounded border-white/20 bg-slate-800 text-violet-500 focus:ring-violet-500" />
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 font-bold text-white font-mono">{task.id}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-white/60 truncate">{task.consultant}</td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <TaskTypeBadge type={task.type} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-white truncate font-semibold">
                        {task.client}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-white/60 truncate">{task.screenReport}</td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-white/60 truncate">
                        {task.programmer || <span className="italic text-white/25">unassigned</span>}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-white/40 font-mono">{task.targetDate || '-'}</td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <DeadlineIndicator task={task} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRowClick(task.id)
                          }}
                          className="text-[11px] text-violet-300 hover:text-violet-200 hover:underline font-semibold"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex sm:hidden gap-2 mt-3">
          <button onClick={() => handleExport('selection')} disabled={selectedCount===0} className="flex-1 rounded-full glass border border-white/10 px-3 py-2 text-xs font-semibold text-white disabled:opacity-30">Export Pilihan{selectedCount? ` (${selectedCount})`:''}</button>
          <button onClick={() => handleExport('filtered')} disabled={filteredTasks.length===0} className="flex-1 rounded-full glass border border-white/10 px-3 py-2 text-xs font-semibold text-white/70 disabled:opacity-30">Export Filter</button>
        </div>
        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5 font-sans text-xs">
            <div className="text-white/35">
              Showing {(currentPage - 1) * itemsPerPage + 1} -{' '}
              {Math.min(currentPage * itemsPerPage, sortedTasks.length)} of {sortedTasks.length} tasks
            </div>
            <div className="flex items-center gap-1 font-mono">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                className="rounded-full glass-subtle border border-white/10 px-3 py-1 text-white/70 hover:bg-white/5 disabled:opacity-40"
              >
                [PREV]
              </button>
              <span className="px-2 text-white/60">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                className="rounded-full glass-subtle border border-white/10 px-3 py-1 text-white/70 hover:bg-white/5 disabled:opacity-40"
              >
                [NEXT]
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Side Panel Drawer (Overlay on small screens, split layout on large screen) */}
      {activePanel && (
        <div className="absolute inset-y-0 right-0 z-40 w-full sm:w-[500px] lg:w-[600px] lg:relative lg:inset-auto lg:z-10 glass-strong border-l border-white/10 flex flex-col h-full shadow-2xl lg:shadow-none animate-in slide-in-from-right duration-150">
          {activePanel === 'detail' && selectedTaskId && (
            <TaskDetail
              taskId={selectedTaskId}
              onClose={handleClosePanel}
              onEdit={handleEditClick}
            />
          )}

          {activePanel === 'create' && (
            <TaskForm
              onClose={handleClosePanel}
              onSubmitSuccess={handleClosePanel}
            />
          )}

          {activePanel === 'edit' && selectedTaskId && (
            <TaskForm
              taskId={selectedTaskId}
              onClose={() => setActivePanel('detail')}
              onSubmitSuccess={() => setActivePanel('detail')}
            />
          )}
        </div>
      )}
    </div>
  )
}
