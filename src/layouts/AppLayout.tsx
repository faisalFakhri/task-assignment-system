/* eslint-disable react/set-state-in-effect */
import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { TODAY_STR } from '../lib/dateUtils'
import FontPicker from '../components/FontPicker'

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
  { title: 'Overview', items: [{ to: '/dashboard', label: 'Dashboard', exact: true }] },
  { title: 'Tasks', items: [
    { to: '/tasks?filter=all', label: 'All Tasks' },
    { to: '/tasks?status=QC', label: 'QC' },
    { to: '/tasks?status=Open', label: 'Open' },
    { to: '/tasks?status=Assign', label: 'Assign' },
    { to: '/tasks?status=In%20Progress', label: 'In Progress' },
    { to: '/tasks?status=Hold', label: 'Hold' },
    { to: '/tasks?status=Reopen', label: 'Reopen' },
    { to: '/tasks?status=Reject', label: 'Reject' },
    { to: '/tasks?status=Done', label: 'Done' },
    { to: '/tasks?filter=overdue', label: 'Overdue' },
  ]},
  { title: 'History', items: [
    { to: '/tasks?filter=completed', label: 'Completed' },
    { to: '/tasks?filter=archived', label: 'Archived' },
  ]},
  { title: 'Master Data', items: [
    { to: '/master/clients', label: 'Clients' },
    { to: '/master/consultants', label: 'Consultants' },
    { to: '/master/programmers', label: 'Programmers' },
  ]},
  { title: 'Data', items: [{ to: '/import', label: 'Import (TEAM ARI)' }, { to: '/guide', label: 'Manual Book' }] },
  { title: 'Configuration', items: [{ to: '/settings', label: 'Settings' }] },
]

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const isLinkActive = (to: string) => {
    const currentPath = location.pathname + location.search
    if (to.includes('?')) return currentPath === to
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
            className={`block px-3 py-1.5 text-xs font-mono rounded-xl transition-colors ${
              active ? 'bg-white text-slate-900 font-semibold shadow' : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            {item.label}
          </NavLink>
        )
      })}
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-[#020617] text-slate-200 font-sans relative">
      {/* Ambient mesh — dark glass Varian C */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[#020617]" />
        <div className="absolute -top-[30%] -left-[20%] w-[85%] h-[75%] rounded-full opacity-40" style={{ background: 'radial-gradient(ellipse at center, #4f46e5 0%, #7c3aed 35%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute -top-[10%] -right-[15%] w-[70%] h-[60%] rounded-full opacity-30" style={{ background: 'radial-gradient(ellipse at center, #06b6d4 0%, #3b82f6 40%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute top-[35%] left-[25%] w-[50%] h-[45%] rounded-full opacity-20" style={{ background: 'radial-gradient(ellipse at center, #8b5cf6 0%, transparent 70%)', filter: 'blur(50px)' }} />
        <div className="absolute bottom-0 right-0 w-[60%] h-[40%] rounded-full opacity-15" style={{ background: 'radial-gradient(ellipse at center, #0ea5e9 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      </div>

      {/* Sidebar Desktop — glass */}
      <aside className="hidden w-[248px] shrink-0 flex-col gap-4 p-4 md:flex">
        <div className="glass-strong rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center text-white font-bold text-xs font-mono shadow-lg">TA</div>
            <div>
              <div className="text-[11px] font-semibold tracking-widest text-white font-mono">TASK ASSIGNMENT</div>
              <div className="text-[10px] text-white/40 font-mono -mt-0.5">dark glass · Varian C</div>
            </div>
          </div>
          <nav className="mt-4 space-y-3">
            {SECTIONS.map((section) => (
              <div key={section.title} className="space-y-1">
                <div className="px-3 text-[10px] font-bold tracking-widest text-white/25 uppercase font-mono">{section.title}</div>
                {renderNavItems(section.items)}
              </div>
            ))}
          </nav>
        </div>
        <div className="glass rounded-2xl p-3 flex items-center gap-3">
          <img src="https://i.pravatar.cc/100?img=12" alt="user" className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10" />
          <div className="min-w-0">
            <div className="text-xs font-medium text-white font-mono truncate">Internal</div>
            <div className="text-[10px] text-white/40 font-mono truncate">System · {TODAY_STR}</div>
          </div>
          <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] shrink-0" />
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />}
      {/* Mobile drawer — glass */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[280px] transform p-4 transition-transform duration-200 ease-in-out md:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="glass-strong rounded-2xl p-4 h-full flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center text-white font-bold text-xs font-mono">TA</div>
              <span className="text-xs font-semibold tracking-widest text-white font-mono">TASK ASSIGNMENT</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="rounded-xl glass-subtle px-2 py-1 text-xs font-mono text-white/60">[close]</button>
          </div>
          <nav className="mt-4 space-y-3 overflow-y-auto flex-1">
            {SECTIONS.map((section) => (
              <div key={section.title} className="space-y-1">
                <div className="px-3 text-[10px] font-bold tracking-widest text-white/25 uppercase font-mono">{section.title}</div>
                {renderNavItems(section.items)}
              </div>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <header className="flex h-12 items-center justify-between gap-3 px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setSidebarOpen(true)} className="rounded-xl glass px-3 py-1.5 text-xs font-mono text-white/80 md:hidden">MENU</button>
            <div className="hidden md:block text-xs text-white/45 font-mono truncate">Internal Task &amp; Assignment Management</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden lg:flex"><FontPicker compact /></div>
            <span className="hidden sm:inline-flex items-center gap-2 glass-subtle rounded-full px-3 py-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-mono text-white/60">Supabase</span>
            </span>
            <span className="text-xs font-mono text-white/30 hidden lg:inline">System Date: <span className="font-semibold text-white/70">{TODAY_STR}</span></span>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
