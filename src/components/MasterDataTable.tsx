import { useState } from 'react'
import { useMasterData, type MasterEntityType } from '../hooks/useMasterData'

interface Props {
  entity: MasterEntityType
  title: string
  entityLabel: string
}

export default function MasterDataTable({ entity, title, entityLabel }: Props) {
  const { data, loading, error, create, update, remove } = useMasterData(entity)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null)
  const [formName, setFormName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = data.filter(
    (r) =>
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.name.toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => {
    setEditing(null)
    setFormName('')
    setModalOpen(true)
  }
  const openEdit = (item: { id: string; name: string }) => {
    setEditing(item)
    setFormName(item.name)
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!formName.trim()) {
      alert('Nama tidak boleh kosong')
      return
    }
    setSubmitting(true)
    try {
      if (editing) await update(editing.id, formName.trim())
      else await create(formName.trim())
      setModalOpen(false)
      setFormName('')
      setEditing(null)
    } catch (e: any) {
      alert(e?.message || 'Gagal menyimpan')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggle = async (item: { id: string; name: string; active: boolean }) => {
    if (!confirm(`${item.active ? 'Nonaktifkan' : 'Aktifkan'} ${entityLabel} "${item.name}"?`)) return
    try {
      await update(item.id, item.name, !item.active)
    } catch (e: any) {
      alert(e?.message || 'Gagal mengubah status')
    }
  }

  const handleDelete = async (item: { id: string; name: string }) => {
    if (!confirm(`Nonaktifkan ${entityLabel} "${item.name}"? (soft delete)`)) return
    try {
      await remove(item.id)
    } catch (e: any) {
      alert(e?.message || 'Gagal menghapus')
    }
  }

  if (loading) return <div className="p-6 text-sm font-mono text-white/50">Loading {title}...</div>
  if (error) return <div className="p-6 text-sm font-mono text-red-300">Error: {error}</div>

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="glass-strong rounded-2xl px-4 py-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-white font-mono">{title}</h2>
          <p className="text-xs text-white/40 font-mono mt-0.5">
            {filtered.length} / {data.length} {entityLabel.toLowerCase()}s · termasuk non-aktif
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center rounded-full bg-white px-4 py-1.5 text-xs font-medium text-slate-900 hover:bg-white/90 font-mono shrink-0"
        >
          + Tambah {entityLabel}
        </button>
      </div>

      <div className="glass rounded-2xl p-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Cari ID / nama ${entityLabel.toLowerCase()}...`}
          className="w-full max-w-sm rounded-xl glass-subtle px-3 py-2 text-xs font-mono placeholder:text-white/25 text-white border border-white/5 focus:outline-none focus:border-white/15"
        />
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <table className="min-w-full divide-y divide-white/5 text-left text-xs font-mono">
          <thead className="bg-white/[0.03] backdrop-blur">
            <tr className="text-white/40">
              <th className="px-4 py-2.5 font-medium">ID</th>
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-white/30">
                  Tidak ada data{search ? ` untuk "${search}"` : ''}.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id} className={`hover:bg-white/[0.04] ${!row.active ? 'opacity-55' : ''}`}>
                  <td className="whitespace-nowrap px-4 py-2.5 text-white font-semibold">{row.id}</td>
                  <td className="px-4 py-2.5 text-white/70">{row.name}</td>
                  <td className="whitespace-nowrap px-4 py-2.5">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                        row.active
                          ? 'bg-emerald-400/15 text-emerald-300 border-emerald-400/20'
                          : 'bg-white/5 text-white/40 border-white/10'
                      }`}
                    >
                      {row.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right space-x-1">
                    <button
                      onClick={() => handleToggle(row)}
                      title={row.active ? 'Nonaktifkan' : 'Aktifkan'}
                      className="rounded-full glass-subtle px-2.5 py-1 text-[11px] text-white/70 hover:text-white border border-white/10"
                    >
                      {row.active ? '⏸ Off' : '▶ On'}
                    </button>
                    <button
                      onClick={() => openEdit(row)}
                      title="Edit"
                      className="rounded-full glass-subtle px-2.5 py-1 text-[11px] text-white/70 hover:text-white border border-white/10"
                    >
                      ✎ Edit
                    </button>
                    {row.active && (
                      <button
                        onClick={() => handleDelete(row)}
                        title="Nonaktifkan (soft delete)"
                        className="rounded-full bg-red-500/15 border border-red-400/20 px-2.5 py-1 text-[11px] text-red-300 hover:bg-red-500/20"
                      >
                        ✕ Hapus
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl glass-strong p-5 shadow-2xl">
            <h3 className="text-sm font-semibold font-mono text-white">
              {editing ? `Edit ${entityLabel}` : `Tambah ${entityLabel} Baru`}
            </h3>
            <p className="mt-1 text-xs font-mono text-white/40">
              {editing ? `ID: ${editing.id}` : 'ID akan digenerate otomatis (CLI-/CON-/PROG- prefix).'}
            </p>
            <label className="mt-4 block">
              <span className="text-xs font-mono text-white/60">Nama *</span>
              <input
                autoFocus
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder={`Nama ${entityLabel.toLowerCase()}`}
                className="mt-1 w-full rounded-xl glass-subtle px-3 py-2.5 text-sm font-mono text-white placeholder:text-white/25 focus:outline-none focus:border-white/15 border border-white/10"
              />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-full glass-subtle px-4 py-1.5 text-xs font-mono text-white/70 hover:text-white border border-white/10"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !formName.trim()}
                className="rounded-full bg-white px-4 py-1.5 text-xs font-mono font-semibold text-slate-900 hover:bg-white/90 disabled:opacity-50"
              >
                {submitting ? 'Menyimpan...' : editing ? 'Simpan' : 'Tambah'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
