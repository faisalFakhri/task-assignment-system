import { useState, useEffect } from 'react'
import FontPicker from '../components/FontPicker'

export default function SettingsPage() {
  const [walkerOn, setWalkerOn] = useState<boolean>(() => {
    try { const v = localStorage.getItem('footer_walker_enabled'); return v === null ? true : v === '1' } catch { return true }
  })
  useEffect(() => {
    try { localStorage.setItem('footer_walker_enabled', walkerOn ? '1' : '0') } catch {}
    window.dispatchEvent(new Event('walker-toggle'))
  }, [walkerOn])

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="glass-strong rounded-2xl px-5 py-4">
        <h2 className="text-sm font-semibold tracking-tight text-white font-mono">SYSTEM_SETTINGS</h2>
        <p className="text-xs text-white/40 font-mono mt-0.5">Thresholds &amp; constants · dark glass Varian C · Supabase backend</p>
      </div>
      <div className="glass rounded-2xl p-5">
        <FontPicker />
      </div>
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-white font-mono">FOOTER_WALKER · Pixel Cat 🐱</div>
            <div className="text-[11px] font-mono text-white/40 mt-0.5">Kucing pixel jalan di footer — klik dia buat ganti arah + bubble chat</div>
          </div>
          <button
            onClick={() => setWalkerOn((v) => !v)}
            className={`relative inline-flex h-7 w-12 items-center rounded-full border transition-colors ${walkerOn ? 'bg-violet-500/90 border-violet-400/30' : 'bg-white/10 border-white/15'}`}
            aria-label="Toggle footer walker"
          >
            <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${walkerOn ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
        <div className="mt-2 text-[11px] font-mono text-white/25">{walkerOn ? 'ON — lagi jalan di footer bawah' : 'OFF — kucing lagi tidur 😴'}</div>
      </div>
      <div className="glass rounded-2xl p-4 space-y-0 font-mono text-xs divide-y divide-white/5">
        <div className="flex justify-between items-center py-3">
          <span className="font-semibold text-white/60">DATABASE_PROVIDER</span>
          <span className="text-white/80">Supabase Postgres</span>
        </div>
        <div className="flex justify-between items-center py-3">
          <span className="font-semibold text-white/60">ATTACHMENT_STORAGE</span>
          <span className="text-white/80">Supabase Storage (public)</span>
        </div>
        <div className="flex justify-between items-center py-3">
          <span className="font-semibold text-white/60">DEADLINE_WARNING_THRESHOLD</span>
          <span className="text-white/80">3 Days</span>
        </div>
        <div className="flex justify-between items-center py-3">
          <span className="font-semibold text-white/60">MAX_ATTACHMENT_SIZE</span>
          <span className="text-white/80">5 MB</span>
        </div>
        <div className="flex justify-between items-center py-3">
          <span className="font-semibold text-white/60">ALLOWED_TASK_TYPES</span>
          <span className="text-white/80">Bugs, Improvements</span>
        </div>
        <div className="flex justify-between items-center py-2 pt-3">
          <span className="font-semibold text-white/30 text-[11px]">UI_VARIANT</span>
          <span className="glass-subtle rounded-full px-2.5 py-1 text-[11px] text-white/50 border border-white/10">Varian C · dark glass · blur 16-20</span>
        </div>
      </div>
    </div>
  )
}
