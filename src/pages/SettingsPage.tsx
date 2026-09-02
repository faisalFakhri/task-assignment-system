export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-base font-semibold tracking-tight text-gray-900 font-mono">SYSTEM_SETTINGS</h2>
        <p className="text-xs text-gray-500 font-mono mt-0.5">Configure system thresholds and constants (mock settings for Phase 1)</p>
      </div>

      <div className="border border-gray-200 rounded p-4 space-y-4 bg-gray-50/50 font-mono text-xs">
        <div className="flex justify-between items-center py-2 border-b border-gray-200">
          <span className="font-semibold text-gray-700">DATABASE_PROVIDER</span>
          <span className="text-gray-500">Google Sheets (Phase 2+)</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-200">
          <span className="font-semibold text-gray-700">ATTACHMENT_STORAGE</span>
          <span className="text-gray-500">Google Drive (Phase 4+)</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-200">
          <span className="font-semibold text-gray-700">DEADLINE_WARNING_THRESHOLD</span>
          <span className="text-gray-800">3 Days</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-200">
          <span className="font-semibold text-gray-700">MAX_ATTACHMENT_SIZE</span>
          <span className="text-gray-800">5 MB</span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="font-semibold text-gray-700">ALLOWED_TASK_TYPES</span>
          <span className="text-gray-800">Bugs, Improvements</span>
        </div>
      </div>
    </div>
  )
}
