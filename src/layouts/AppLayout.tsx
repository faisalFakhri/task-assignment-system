/* eslint-disable react/set-state-in-effect */
import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { TODAY_STR } from '../lib/dateUtils'

interface NavItem {
  to: string
  label: string
  exact?: boolean
}

interface NavSection {
  title: string
  items: NavItem[]
}

const SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [{ to: '/dashboard', label: 'Dashboard', exact: true }],
  },
  {
    title: 'Tasks',
    items: [
      { to: '/tasks?filter=all', label: 'All Tasks' },
      { to: '/tasks?filter=open', label: 'Open' },
      { to: '/tasks?filter=assigned', label: 'Assigned' },
      { to: '/tasks?filter=overdue', label: 'Overdue' },
    ],
  },
  {
    title: 'History',
    items: [
      { to: '/tasks?filter=completed', label: 'Completed' },
      { to: '/tasks?filter=archived', label: 'Archived' },
    ],
  },
  {
    title: 'Master Data',
    items: [
      { to: '/master/clients', label: 'Clients' },
      { to: '/master/consultants', label: 'Consultants' },
      { to: '/master/programmers', label: 'Programmers' },
    ],
  },
  {
    title: 'Configuration',
    items: [{ to: '/settings', label: 'Settings' }],
  },
]

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  const isLinkActive = (to: string) => {
    const currentPath = location.pathname + location.search
    if (to.includes('?')) {
      return currentPath === to
    }
    return location.pathname === to
  }

  const renderNavItems = (items: NavItem[]) => (
    <div className="space-y-0.5">
      {items.map((item) => {
        const active = isLinkActive(item.to)
        return (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setSidebarOpen(false)}
            className={`block px-3 py-1.5 text-xs font-mono font-medium border-l-2 transition-colors ${
              active
                ? 'bg-blue-50 text-blue-700 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {item.label}
          </NavLink>
        )
      })}
    </div>
  )

  return (
    <div className="flex h-screen bg-white text-gray-900 overflow-hidden font-sans">
      {/* Sidebar for Desktop */}
      <aside className="hidden w-56 shrink-0 border-r border-gray-200 bg-gray-50/50 md:flex md:flex-col">
        <div className="flex h-12 items-center border-b border-gray-200 px-4 font-semibold text-gray-800 text-sm">
          Task Assignment
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          {SECTIONS.map((section) => (
            <div key={section.title} className="space-y-1">
              <div className="px-3 text-[10px] font-bold tracking-wider text-gray-400 uppercase font-mono">
                {section.title}
              </div>
              {renderNavItems(section.items)}
            </div>
          ))}
        </nav>
      </aside>

      {/* Sidebar Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-56 transform bg-white border-r border-gray-200 transition-transform duration-200 ease-in-out md:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-12 items-center justify-between border-b border-gray-200 px-4 font-semibold text-gray-800 text-sm">
          <span>Task Assignment</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded p-1 hover:bg-gray-100 font-mono text-xs font-normal"
          >
            [close]
          </button>
        </div>
        <nav className="p-3 space-y-4 overflow-y-auto">
          {SECTIONS.map((section) => (
            <div key={section.title} className="space-y-1">
              <div className="px-3 text-[10px] font-bold tracking-wider text-gray-400 uppercase font-mono">
                {section.title}
              </div>
              {renderNavItems(section.items)}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-12 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-mono md:hidden hover:bg-gray-100"
            >
              MENU
            </button>
            <div className="hidden md:block text-xs text-gray-500">
              Internal Task &amp; Assignment Management
            </div>
          </div>
          <div className="text-xs font-mono text-gray-500">
            System Date: <span className="font-semibold text-gray-700">{TODAY_STR}</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6 bg-white">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
