type Section = { id: string; title: string; icon: string }

const SECTIONS: Section[] = [
  { id: 'quick', title: 'Mulai Cepat', icon: '⚡' },
  { id: 'tasks', title: 'Kelola Task', icon: '📋' },
  { id: 'status', title: 'Status & Sidebar', icon: '🏷️' },
  { id: 'master', title: 'Master Data', icon: '🗂️' },
  { id: 'import-export', title: 'Import & Export (TEAM ARI)', icon: '📊' },
  { id: 'attachments', title: 'Lampiran & Paste', icon: '📎' },
  { id: 'deadline', title: 'Deadline & Sisa Hari', icon: '⏰' },
  { id: 'sheets', title: 'Sinkron ke Sheets', icon: '🔗' },
  { id: 'faq', title: 'FAQ & Troubleshooting', icon: '❓' },
]

function Anchor({ id, title, icon, children }: { id: string; title: string; icon: string; children: React.ReactNode }) {
  return (
    <section id={id} className="glass rounded-2xl p-5 md:p-6 scroll-mt-6">
      <h2 className="flex items-center gap-2 text-sm font-bold tracking-tight text-white font-mono">
        <span className="text-base">{icon}</span> {title}
        <span className="ml-auto text-[10px] font-normal tracking-widest text-white/25 uppercase">{id}</span>
      </h2>
      <div className="mt-4 space-y-3 text-xs leading-5 text-white/70 font-mono">{children}</div>
    </section>
  )
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center glass-subtle rounded-full px-2 py-0.5 text-[11px] text-white/60 border border-white/10">{children}</span>
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="flex gap-3">
      <div className="shrink-0 w-7 h-7 rounded-xl bg-white text-slate-900 font-bold text-xs flex items-center justify-center shadow-lg">{n}</div>
      <div>
        <div className="text-xs font-semibold text-white">{title}</div>
        <div className="text-[11px] text-white/50 mt-0.5">{desc}</div>
      </div>
    </div>
  )
}

export default function GuidePage() {
  return (
    <div className="space-y-4 max-w-5xl">
      {/* Header */}
      <div className="glass-strong rounded-2xl px-5 py-5 md:px-6 md:py-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-sm md:text-base font-bold tracking-tight text-white font-mono">MANUAL_BOOK — Task Assignment System</h1>
            <p className="text-xs text-white/40 font-mono mt-1">Dark glass · Varian C · GitHub Pages + Supabase · 1 arah Web → Sheets (TEAM ARI) · Kolom No (A) sebagai acuan</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Pill>Live: faisalfakhri.github.io/task-assignment-system</Pill>
              <Pill>Sheet: 1lULEI... / TEAM ARI (No 1..)</Pill>
              <Pill>Supabase: ntbylafxutwemwmdputg</Pill>
            </div>
          </div>
          <button onClick={() => window.print()} className="shrink-0 rounded-full bg-white text-slate-900 text-xs font-mono font-semibold px-4 py-2 shadow-lg hover:bg-white/90">Print / Save PDF</button>
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="glass-subtle rounded-full px-3 py-1 text-[11px] font-mono text-white/60 hover:text-white hover:bg-white/10 border border-white/10">
              {s.icon} {s.title}
            </a>
          ))}
        </div>
      </div>

      <Anchor id="quick" title="Mulai Cepat" icon="⚡">
        <p>Web ini internal — nggak pakai login. Data utama di <b className="text-white">Supabase Postgres</b>, file lampiran di <b className="text-white">Supabase Storage</b>. Semua perubahan di web otomatis nge-mirror ke <b className="text-white">Google Sheet TEAM ARI</b> (kolom No sebagai patokan baris).</p>
        <div className="grid md:grid-cols-3 gap-2">
          <div className="glass-subtle rounded-xl p-3 border border-white/10">
            <div className="text-[11px] font-bold text-white/80">1. Buka</div>
            <div className="text-[11px] text-white/50">faisalfakhri.github.io/task-assignment-system → <b className="text-white/80">Tasks → New Task</b></div>
          </div>
          <div className="glass-subtle rounded-xl p-3 border border-white/10">
            <div className="text-[11px] font-bold text-white/80">2. Isi & Save</div>
            <div className="text-[11px] text-white/50">Consultant, Client, Request wajib. Target isi <code className="text-white/70">03/09/2026</code>. Save → langsung nongol di list.</div>
          </div>
          <div className="glass-subtle rounded-xl p-3 border border-white/10">
            <div className="text-[11px] font-bold text-white/80">3. Cek Sheet</div>
            <div className="text-[11px] text-white/50">TEAM ARI baris <b className="text-white/80">No = max(No)+1</b> (mis. 56→57) di <b className="text-white/80">row = last No +1</b> (63→64).</div>
          </div>
        </div>
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-[11px] text-amber-200/80">
          Hard refresh <code className="text-amber-100">Ctrl+Shift+R</code> kalau habis update — biar JS baru ke-load. Favicon 404 abaikan.
        </div>
      </Anchor>

      <Anchor id="tasks" title="Kelola Task" icon="📋">
        <div className="space-y-3">
          <Step n={1} title="Buat Task" desc="Tasks → New Task. Field: Consultant* (dropdown), Bugs/Improvements*, Client*, Screen/Report, Request* (deskripsi), Status (default Open), Assign Programmer, SQL Server, Database, Target (date picker), Keterangan/Notes. Save. Jika muncul 'violates check constraint tasks_status_check' → pakai Open/Assign/Done dulu atau jalankan SQL di Settings (sekali)." />
          <Step n={2} title="Edit & Archive" desc="Klik baris → View → Edit. Ubah apa saja → Save → history ke-track. Archive → task hilang dari All tapi ada di filter Archived. Attachments ikut task." />
          <Step n={3} title="Cari & Filter" desc="Search ketik Request/Screen/Client. Filter: Type (Bugs/Improvements), Status (8 opsi), Overdue. Kombinasi filter + search jalan barengan. Export Pilihan / Export Filter di header kanan." />
          <div className="glass-subtle rounded-xl p-3 border border-white/5 text-[11px] text-white/50">
            <b className="text-white/70">Auto-refresh:</b> setelah Create/Update/Archive list langsung refresh via TaskContext.refreshData() — nggak perlu F5. Master baru (client/consultant/programmer) juga langsung muncul di dropdown TaskForm (useMasterData → refreshData).
          </div>
        </div>
      </Anchor>

      <Anchor id="status" title="Status & Sidebar per Status" icon="🏷️">
        <p>Mirror <b className="text-white">TEAM ARI</b> punya 8 status — semua ada di sidebar <b className="text-white">Tasks</b> biar loncat cepat:</p>
        <div className="flex flex-wrap gap-1.5">
          {['QC', 'Open', 'Assign', 'In Progress', 'Hold', 'Reopen', 'Reject', 'Done'].map((s) => (
            <Pill key={s}>{s}</Pill>
          ))}
        </div>
        <p>Sidebar: <code className="text-white/80">All Tasks</code> → <code className="text-white/80">QC … Done</code> → <code className="text-white/80">Overdue</code> → <code className="text-white/80">History: Completed / Archived</code>. Klik mis. <code className="text-white/80">Tasks → QC</code> = <code className="text-white/80">/tasks?status=QC</code> → list kefilter, header jadi “QC Tasks”, dropdown Status ke-lock. Badge warna: <span className="text-violet-300">QC</span> <span className="text-sky-300">Open</span> <span className="text-amber-300">Assign</span> <span className="text-cyan-300">In Progress</span> <span className="text-slate-300">Hold</span> <span className="text-orange-300">Reopen</span> <span className="text-red-300">Reject</span> <span className="text-emerald-300">Done</span>.</p>
        <p className="text-[11px] text-white/45">Dropdown Status di TasksPage & TaskForm sudah 8 opsi — nggak perlu refresh.</p>
      </Anchor>

      <Anchor id="master" title="Master Data" icon="🗂️">
        <p>Sidebar <b className="text-white">Master Data → Clients / Consultants / Programmers</b>. Tabel generic <code className="text-white/70">MasterDataTable</code> + hook <code className="text-white/70">useMasterData</code>:</p>
        <ul className="list-disc list-inside space-y-1 text-[11px] text-white/60">
          <li><b className="text-white/80">Add / Edit / Toggle Active</b> — soft delete (active=false), nggak hard delete.</li>
          <li><b className="text-white/80">Search</b> di header tabel, modal <code className="text-white/60">glass-strong + backdrop black/60</code>.</li>
          <li>Setelah Add/Edit → <code className="text-white/60">TaskContext.refreshData()</code> dipanggil — dropdown di <b className="text-white/80">TaskForm</b> langsung ada opsi baru tanpa reload.</li>
        </ul>
        <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-[11px]">
          <div className="font-semibold text-white/70">Kontras (Varian C fix)</div>
          <div className="text-white/50">Select pakai <code className="text-white/60">bg-slate-800/90 + color-scheme: dark + option bg #0f172a</code> biar teks nggak nyaru. Tombol Save = <code className="text-white/60">bg-white text-slate-900 rounded-full shadow-lg</code>, Cancel = glass-subtle.</div>
        </div>
      </Anchor>

      <Anchor id="import-export" title="Import & Export — Mirror TEAM ARI 1:1" icon="📊">
        <div className="space-y-3">
          <div>
            <div className="text-xs font-semibold text-white">Export (plek template)</div>
            <p>Header <code className="text-white/80">A1:M1</code>: No | Consultant | Bugs / Improvements | Client | Nama Screen / report | Request | Status | Assign Programmer | Sql Server | Database | Target | Sisa Hari | Keterangan. Width plek, header <code className="text-white/60">Calibri 10 bold #334155 fill #F8FAFC border #F6F8F9 h 31.5</code>, freeze A2, autoFilter, tab violet. Kolom <code className="text-white/60">L Sisa Hari</code> formula <code className="text-white/60">=IF(K2="";"No Target";IF(G2="Done";"";(K2-TODAY())))</code> (pakai <code className="text-white/60">;</code> untuk locale id_ID) + conditional &lt;0 merah. Validasi: C=Bugs,Improvements; G=8 status; H=list programmer.</p>
            <ul className="list-disc list-inside text-[11px] text-white/60 mt-1">
              <li><b className="text-white/70">Tasks → Export Filter / Export Pilihan:</b> centang baris (☑︎ header = pilih semua hasil filter) → <code className="text-white/60">Export Pilihan (n)</code> export yang dicentang saja; <code className="text-white/60">Export Filter (n)</code> export hasil filter; tanpa filter = All. File: <code className="text-white/60">TEAM ARI - Export YYYY-MM-DD.xlsx</code> via exceljs + file-saver. Bar <code className="text-white/60">n terpilih | Clear</code> ada di header & bawah tabel.</li>
              <li><code className="text-white/60">downloadTemplate()</code> = export kosong.</li>
            </ul>
          </div>
          <div>
            <div className="text-xs font-semibold text-white">Import Migrasi (TEAM ARI 57 baris)</div>
            <p><code className="text-white/80">Data → Import (TEAM ARI)</code> → Choose .xlsx → auto deteksi sheet TEAM ARI (fallback: header B1 Consultant). Parse: formula.result, richText, Date/serial 25569. Target fleksibel: Date / serial / dd/mm/yyyy → YYYY-MM-DD. Validasi: Consultant* (B), Type* (C), Client* (D), Request* (F), Status (G 8 values). Warning kuning jika Screen kosong → “-”, Status kosong → Open. Preview tabel: R (Excel row) + badge valid/invalid + 300 pertama. Skip baris kosong (B+D+E+F kosong).</p>
            <p>Migrasi: auto-create Client/Consultant/Programmer belum ada (case-insensitive), sequential createTask + progress bar + daftar gagal, lalu refreshData() tanpa F5. Tips: N-AD diabaikan, No & Sisa Hari auto.</p>
          </div>
          <div className="glass-subtle rounded-xl p-3 border border-white/10 text-[11px] text-white/50">Lib: <code className="text-white/60">exceljs 4.4.0 + file-saver</code> (client), analisis template pakai <code className="text-white/60">openpyxl</code>. Build chunk ~1.49 MB (warning &gt;500 kB wajar).</div>
        </div>
      </Anchor>

      <Anchor id="attachments" title="Lampiran — Paste & Attach" icon="📎">
        <ul className="list-disc list-inside space-y-1">
          <li><b className="text-white">Paste screenshot:</b> screenshot (<code className="text-white/70">PrtSc / Win+Shift+S</code>) → di <b className="text-white/80">New Task form</b> atau <b className="text-white/80">Task Detail</b> tekan <code className="text-white/70">Ctrl+V</code> → langsung jadi attachment (nama auto <code className="text-white/60">Screenshot-...</code>). Di form create: masuk daftar pending (preview grid), Save → upload bareng. Di detail: langsung upload + toast “screenshot pasted & uploaded”. Bisa multi-paste.</li>
          <li><b className="text-white">Klik Attach:</b> <code className="text-white/70">Choose images... / + Add</code> tetap ada — bisa campur paste + pilih file.</li>
          <li>Aturan: <code className="text-white/60">PNG/JPEG/WebP max 5 MB</code> per file. Di Edit mode paste di-disable (pakai Detail untuk nambah).</li>
          <li>Storage: <code className="text-white/60">Supabase Storage bucket attachments (public)</code>. History & metadata di tabel attachments.</li>
        </ul>
      </Anchor>

      <Anchor id="deadline" title="Deadline & Sisa Hari" icon="⏰">
        <p><code className="text-white/70">src/lib/dateUtils</code> — <code className="text-white/60">MOCK_TODAY_STR = 2026-08-19</code> frozen hanya untuk <code className="text-white/60">VITE_DATA_SOURCE !== supabase/api</code>. Di produksi (<code className="text-white/60">supabase</code>) pakai <b className="text-white">tanggal device beneran</b> (USE_REAL_TODAY). Rumus: <code className="text-white/60">Math.ceil((target - today)/86400000)</code> dengan normalisasi midnight. Target <code className="text-white/60">2026-09-03</code> hari ini = <b className="text-white">Due Today / 0</b>, bukan 15 hari (bug lama karena mock 19 Aug). Di Sheet: kolom L formula live <code className="text-white/60">=IFERROR(IF(K2="";"No Target";IF(G2="Done";"";(K2-TODAY())));"")</code> (pakai <code className="text-white/60">;</code>) — merah kalau &lt;0.</p>
        <p className="text-[11px] text-white/45">Dashboard 6 stat cards + progress gradient + Recent Activity (glass) — deadline indicator pakai tint 15/20 + DeadlineIndicator component.</p>
      </Anchor>

      <Anchor id="sheets" title="Sinkron ke Sheets — 1 arah Web → Sheets (FULL API)" icon="🔗">
        <div className="space-y-2">
          <p><b className="text-white">Tanpa Apps Script.</b> Infra: <code className="text-white/70">Supabase Edge Function sync-to-sheets</code> (Deno) + <code className="text-white/70">Google Sheets API v4</code> via Service Account JWT. Supabase = source of truth, Sheets = mirror.</p>
          <div className="glass-subtle rounded-xl p-3 border border-white/5 text-[11px] leading-4">
            <div className="font-semibold text-white/70">Flow</div>
            <div className="text-white/50 font-mono text-[11px] mt-1">
              Web Save → taskService.createTask() → Supabase tasks (harus sukses)<br />
              &nbsp;&nbsp;→ notifySheets(create/update/archive) → Edge Function → Sheets API → TEAM ARI<br />
              &nbsp;&nbsp;└─ gagal? → queue di localStorage (sheets_sync_queue, max 50) → flushSheetsQueue() on app start → dedup via [TASK-xxx] di Keterangan (M)
            </div>
          </div>
          <ul className="list-disc list-inside text-[11px] text-white/60 space-y-1">
            <li><b className="text-white/80">Acuan kolom No (A)</b> — request lu: <code className="text-white/60">getNextDataRow()</code> cari <b className="text-white/60">last non-empty A</b> → <code className="text-white/60">nextRow = last+1</code> (setelah 55 di row 62 → 56 di row 63). <code className="text-white/60">getNextSeqNo() = max(A)+1</code>. Nggak ketipu formula L <code className="text-white/60">No Target</code> yang pre-filled sampai 998.</li>
            <li><b className="text-white/80">Create</b> → dedup: kalau <code className="text-white/60">[TASK-xxx]</code> sudah ada, jadi update di row itu (nggak dobel). Tulis <code className="text-white/60">A:M</code> via <code className="text-white/60">sheetsUpdate</code> (bukan append) di <code className="text-white/60">'TEAM ARI'!A63:M63</code>. Target format <code className="text-white/60">d/m/yyyy</code> (3/9/2026), No = seq, L = <code className="text-white/60">IFERROR(IF(K...;...);””)</code> pakai <code className="text-white/60">;</code>.</li>
            <li><b className="text-white/80">Update</b> → <code className="text-white/60">findRowByTaskId</code> cari <code className="text-white/60">[TASK-xxx]</code> di M (3 strategi: M contains, exact, bare) → update row itu, No tetap. Jika not found → fallback create di nextRow.</li>
            <li><b className="text-white/80">Archive</b> → <code className="text-white/60">M += [ARCHIVED]</code>.</li>
            <li><b className="text-white/80">CORS</b> — Edge allow-headers: <code className="text-white/60">authorization, apikey, x-client-info, x-supabase-api-version, x-sheets-sync-token</code> + <code className="text-white/60">Origin: *</code> (fix 03dbb38 — sebelumnya apikey ke-block).</li>
            <li><b className="text-white/80">Env:</b> <code className="text-white/60">SPREADSHEET_ID=1lULEI...</code>, <code className="text-white/60">SHEET_NAME=TEAM ARI</code>, <code className="text-white/60">GOOGLE_SERVICE_ACCOUNT_JSON</code> (isi JSON, bukan nama file — via --env-file), optional <code className="text-white/60">SHEETS_SYNC_TOKEN</code>. Frontend: <code className="text-white/60">VITE_SUPABASE_URL/ANON_KEY</code> + optional <code className="text-white/60">VITE_SHEETS_SYNC_URL/TOKEN</code> (default = &lt;SUPABASE_URL&gt;/functions/v1/sync-to-sheets).</li>
            <li><b className="text-white/80">Verifikasi:</b> <code className="text-white/60">POST .../sync-to-sheets {"{action:debug}"}</code> → nextRow/nextSeq/positions/slice. <code className="text-white/60">OPTIONS</code> dari github.io harus 204. Row baru cek <code className="text-white/60">TEAM ARI!A63:M63</code> — No 56, L = 0 bukan #ERROR!</li>
          </ul>
          <div className="rounded-xl bg-sky-500/10 border border-sky-500/20 p-3 text-[11px] text-sky-200/80">
            Service account <code className="text-sky-100">task-sheets-sync@task-assignment-sync.iam.gserviceaccount.com</code> harus di-Share sebagai <b className="text-sky-100">Editor</b> di Sheet. File <code className="text-sky-100">task-assignment-sync-b5a61dcdd016.json</code> di <code className="text-sky-100">E:/Project/Task-Assigment/</code> sudah di-<code className="text-sky-100">.gitignore</code> — jangan commit.
          </div>
        </div>
      </Anchor>

      <Anchor id="faq" title="FAQ & Troubleshooting" icon="❓">
        <div className="space-y-2 text-[11px] leading-4">
          <div><b className="text-white">Task baru nggak muncul di list?</b> — Sudah auto via <code className="text-white/60">refreshData()</code>. Kalau masih, hard refresh <code className="text-white/60">Ctrl+Shift+R</code> atau cek Supabase RLS (<code className="text-white/60">using (true)</code>).</div>
          <div><b className="text-white">Save error “violates check constraint tasks_status_check”?</b> — DB masih allow Open/Assign/Done saja. Jalankan sekali di Supabase SQL Editor:<br /><code className="text-white/60 bg-white/5 px-1.5 py-0.5 rounded">alter table public.tasks drop constraint if exists tasks_status_check; alter table ... check (status in ('Open','Assign','Done','QC','Reject','Reopen','Hold','In Progress'));</code></div>
          <div><b className="text-white">Task ke-Sheets nggak nambah / CORS apikey blocked?</b> — Edge sudah fix 03dbb38 (allow apikey). Hard refresh, cek Console: <code className="text-white/60">[sheetSync] failed, queued</code> → cek <code className="text-white/60">Application → Local Storage → sheets_sync_queue</code> — reload bakal flush. Cek <code className="text-white/60">Network → sync-to-sheets → 200</code> bukan ERR_FAILED. Backfill manual via <code className="text-white/60">{"{action:create,taskId,row}"}</code> kalau perlu.</div>
          <div><b className="text-white">Sisa Hari #ERROR!?</b> — Sudah fix 0f1d18f: formula pakai <code className="text-white/60">;</code> (locale id_ID) + IFERROR. Update task sekali untuk rewrite L.</div>
          <div><b className="text-white">Baris baru loncat ke 999?</b> — Sudah fix No-based: last non-empty A (commit 32e3b0f). Debug: <code className="text-white/60">{"{action:debug}"}</code> harus nextRow 66 setelah 3 backfill (63,64,65).</div>
          <div><b className="text-white">Dropdown teks nyaru / Save nyaru?</b> — Sudah fix: select <code className="text-white/60">bg-slate-800/90 + option #0f172a + Save bg-white</code> (commit 5b2db0e).</div>
          <div><b className="text-white">Build chunk &gt;500 kB warning?</b> — Wajar karena exceljs (1.49 MB). Bisa code-split dynamic import nanti, sekarang biar plek 1:1 dulu.</div>
          <div><b className="text-white">Deploy?</b> — Frontend: <code className="text-white/60">VITE_BASE_PATH=/task-assignment-system/ ./node_modules/.bin/vite build</code> → copy dist → push <code className="text-white/60">gh-pages</code>. Edge: <code className="text-white/60">npx supabase functions deploy sync-to-sheets --project-ref ntbylafxutwemwmdputg</code> + <code className="text-white/60">npx supabase secrets set --env-file C:/Temp/secrets2.env --project-ref ...</code></div>
        </div>
      </Anchor>

      <div className="glass rounded-2xl p-4 text-center">
        <div className="text-xs font-mono text-white/40">Butuh bantuan? Mention Sawi di chat — Sawi standby bantu backfill / debug Sheets.</div>
        <div className="text-[11px] font-mono text-white/25 mt-1">© 2026 Task Assignment System · Varian C dark glass · Supabase + Sheets FULL API</div>
      </div>
    </div>
  )
}
