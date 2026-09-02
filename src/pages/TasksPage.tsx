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

  // Sorting State
  const [sortField, setSortField] = useState<SortField>('id')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10 // Increased from 8 to 10 for better desktop flow

  // Sync state with search params (e.g. navigation from Dashboard or sidebar)
  const urlFilter = searchParams.get('filter')
  const urlId = searchParams.get('id')

  useEffect(() => {
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
    setCurrentPage(1)
  }, [urlFilter])

  useEffect(() => {
    if (urlId) {
      setSelectedTaskId(urlId)
      setActivePanel('detail')
    }
  }, [urlId])

  // Get distinct metadata for filter dropdowns directly from tasks
  const sqlServers = useMemo(() => {
    const set = new Set(tasks.map(t => t.sqlServer).filter(Boolean))
    return Array.from(set)
  }, [tasks])

  const databases = useMemo(() => {
    const set = new Set(tasks.map(t => t.database).filter(Boolean))
    return Array.from(set)
  }, [tasks])

  // Get current header category title based on urlFilter
  const getHeaderTitle = () => {
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
    if (filterStatus && urlFilter !== 'open' && urlFilter !== 'assigned' && urlFilter !== 'completed') count++
    if (filterSqlServer) count++
    if (filterDatabase) count++
    if (filterOverdueOnly && urlFilter !== 'overdue') count++
    if (searchQuery.trim()) count++
    return count
  }, [filterConsultant, filterType, filterClient, filterProgrammer, filterStatus, filterSqlServer, filterDatabase, filterOverdueOnly, searchQuery, urlFilter])

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
    <div className="flex h-[calc(100vh-80px)] relative overflow-hidden gap-4 text-sm text-gray-800">
      {/* List Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-xs font-mono text-red-700 flex justify-between items-center shrink-0">
            <span>Error: {error}</span>
            <button onClick={() => window.location.reload()} className="underline font-bold">[Retry]</button>
          </div>
        )}

        {/* Page Title & Search Header */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center mb-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-gray-900 flex items-center gap-2">
              <span>{getHeaderTitle()}</span>
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-mono font-normal">
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
                className="w-full rounded border border-gray-200 px-3 py-1.5 focus:border-blue-500 focus:outline-none placeholder-gray-400 bg-white"
              />
            </div>
            <button
              onClick={handleOpenCreate}
              className="rounded border border-blue-600 bg-blue-600 text-white px-3 py-1.5 font-semibold hover:bg-blue-700 transition-colors shrink-0"
            >
              New Task
            </button>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="rounded border border-gray-200 bg-gray-50 text-gray-700 px-3 py-1.5 hover:bg-gray-100 transition-colors shrink-0 font-mono"
              >
                Clear filters ({activeFiltersCount})
              </button>
            )}
          </div>
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8 mb-4 text-xs border-b border-gray-100 pb-4 bg-gray-50/20 p-2 rounded">
          <div>
            <select
              value={filterConsultant}
              onChange={e => setFilterConsultant(e.target.value)}
              className={`w-full rounded border p-1 bg-white focus:outline-none focus:border-blue-400 ${
                filterConsultant ? 'border-blue-500 bg-blue-50/10 font-semibold' : 'border-gray-200'
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
              className={`w-full rounded border p-1 bg-white focus:outline-none focus:border-blue-400 ${
                filterType ? 'border-blue-500 bg-blue-50/10 font-semibold' : 'border-gray-200'
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
              className={`w-full rounded border p-1 bg-white focus:outline-none focus:border-blue-400 ${
                filterClient ? 'border-blue-500 bg-blue-50/10 font-semibold' : 'border-gray-200'
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
              className={`w-full rounded border p-1 bg-white focus:outline-none focus:border-blue-400 ${
                filterProgrammer ? 'border-blue-500 bg-blue-50/10 font-semibold' : 'border-gray-200'
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
              className={`w-full rounded border p-1 bg-white focus:outline-none focus:border-blue-400 ${
                filterStatus ? 'border-blue-500 bg-blue-50/10 font-semibold' : 'border-gray-200'
              }`}
              disabled={urlFilter === 'open' || urlFilter === 'assigned' || urlFilter === 'completed'}
            >
              <option value="">Status</option>
              <option value="Open">Open</option>
              <option value="Assign">Assign</option>
              <option value="Done">Done</option>
            </select>
          </div>
          <div>
            <select
              value={filterSqlServer}
              onChange={e => setFilterSqlServer(e.target.value)}
              className={`w-full rounded border p-1 bg-white focus:outline-none focus:border-blue-400 ${
                filterSqlServer ? 'border-blue-500 bg-blue-50/10 font-semibold' : 'border-gray-200'
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
              className={`w-full rounded border p-1 bg-white focus:outline-none focus:border-blue-400 ${
                filterDatabase ? 'border-blue-500 bg-blue-50/10 font-semibold' : 'border-gray-200'
              }`}
            >
              <option value="">Database</option>
              {databases.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className={`flex items-center justify-center border rounded p-1 bg-white ${
            filterOverdueOnly ? 'border-blue-500 bg-blue-50/10 font-semibold' : 'border-gray-200'
          }`}>
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filterOverdueOnly}
                onChange={e => setFilterOverdueOnly(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 h-3w-3"
                disabled={urlFilter === 'overdue'}
              />
              <span>Overdue</span>
            </label>
          </div>
        </div>

        {/* Tasks Table */}
        <div className="flex-1 border border-gray-200 rounded overflow-auto bg-white min-h-0 relative">
          {loading ? (
            <div className="p-12 h-full flex flex-col items-center justify-center font-mono text-xs text-gray-500">
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
            <table className="min-w-full divide-y divide-gray-200 text-left text-[12px] font-sans table-fixed">
              <thead className="bg-gray-50 sticky top-0 z-10 font-mono text-[10px] text-gray-500 uppercase tracking-wider">
                <tr>
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
                      className={`px-3 py-2 font-bold cursor-pointer hover:bg-gray-100 ${col.width}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{col.label}</span>
                        {sortField === col.field && (
                          <span className="text-[10px] text-gray-400">{sortOrder === 'asc' ? '▲' : '▼'}</span>
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
              <tbody className="divide-y divide-gray-200 bg-white">
                {paginatedTasks.map(task => {
                  const isSelected = selectedTaskId === task.id
                  return (
                    <tr
                      key={task.id}
                      onClick={() => handleRowClick(task.id)}
                      className={`cursor-pointer hover:bg-blue-50/10 transition-colors ${
                        isSelected ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      <td className="whitespace-nowrap px-3 py-2 font-bold text-gray-900 font-mono">{task.id}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-gray-600 truncate">{task.consultant}</td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <TaskTypeBadge type={task.type} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-gray-900 truncate font-semibold">
                        {task.client}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-gray-600 truncate">{task.screenReport}</td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-gray-600 truncate">
                        {task.programmer || <span className="italic text-gray-400">unassigned</span>}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-gray-500 font-mono">{task.targetDate || '-'}</td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <DeadlineIndicator task={task} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRowClick(task.id)
                          }}
                          className="text-[11px] text-blue-600 hover:text-blue-800 hover:underline font-semibold"
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

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100 font-sans text-xs">
            <div className="text-gray-400">
              Showing {(currentPage - 1) * itemsPerPage + 1} -{' '}
              {Math.min(currentPage * itemsPerPage, sortedTasks.length)} of {sortedTasks.length} tasks
            </div>
            <div className="flex items-center gap-1 font-mono">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                className="rounded border border-gray-200 bg-white px-2 py-1 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white"
              >
                [PREV]
              </button>
              <span className="px-2 text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                className="rounded border border-gray-200 bg-white px-2 py-1 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white"
              >
                [NEXT]
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Side Panel Drawer (Overlay on small screens, split layout on large screen) */}
      {activePanel && (
        <div className="absolute inset-y-0 right-0 z-40 w-full sm:w-[500px] lg:w-[600px] lg:relative lg:inset-auto lg:z-10 bg-white border-l border-gray-200 flex flex-col h-full shadow-2xl lg:shadow-none animate-in slide-in-from-right duration-150">
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
