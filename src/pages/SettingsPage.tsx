import FontPicker from '../components/FontPicker'

export default function SettingsPage() {
  return (
    <div className="space-y-4 max-w-3xl">
      <div className="glass-strong rounded-2xl px-5 py-4">
        <h2 className="text-sm font-semibold tracking-tight text-white font-mono">SYSTEM_SETTINGS</h2>
        <p className="text-xs text-white/40 font-mono mt-0.5">Thresholds &amp; constants · dark glass Varian C · Supabase backend</p>
      </div>
      <div className="glass rounded-2xl p-5">
        <FontPicker />
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
