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

  if (loading) return <div className="p-6 text-sm font-mono text-gray-500">Loading {title}...</div>
  if (error) return <div className="p-6 text-sm font-mono text-red-600">Error: {error}</div>

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-gray-900 font-mono">{title}</h2>
          <p className="text-xs text-gray-500 font-mono mt-0.5">
            {filtered.length} / {data.length} {entityLabel.toLowerCase()}s · termasuk non-aktif untuk manajemen
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center rounded bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-black font-mono"
        >
          + Tambah {entityLabel}
        </button>
      </div>

      <div className="flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Cari ID / nama ${entityLabel.toLowerCase()}...`}
          className="w-full max-w-sm rounded border border-gray-200 bg-white px-3 py-1.5 text-xs font-mono placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"
        />
      </div>

      <div className="border border-gray-200 rounded overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-left text-xs font-mono">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 font-medium text-gray-500">ID</th>
              <th className="px-4 py-2 font-medium text-gray-500">Name</th>
              <th className="px-4 py-2 font-medium text-gray-500">Status</th>
              <th className="px-4 py-2 font-medium text-gray-500 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                  Tidak ada data{search ? ` untuk "${search}"` : ''}.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id} className={`hover:bg-gray-50/50 ${!row.active ? 'opacity-60' : ''}`}>
                  <td className="whitespace-nowrap px-4 py-2 text-gray-900 font-semibold">{row.id}</td>
                  <td className="px-4 py-2 text-gray-600">{row.name}</td>
                  <td className="whitespace-nowrap px-4 py-2">
                    <span
                      className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium border ${
                        row.active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-gray-50 text-gray-500 border-gray-200'
                      }`}
                    >
                      {row.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-right space-x-1">
                    <button
                      onClick={() => handleToggle(row)}
                      title={row.active ? 'Nonaktifkan' : 'Aktifkan'}
                      className="rounded border border-gray-200 bg-white px-2 py-1 text-[11px] hover:bg-gray-50"
                    >
                      {row.active ? '⏸ Off' : '▶ On'}
                    </button>
                    <button
                      onClick={() => openEdit(row)}
                      title="Edit"
                      className="rounded border border-gray-200 bg-white px-2 py-1 text-[11px] hover:bg-gray-50"
                    >
                      ✎ Edit
                    </button>
                    {row.active && (
                      <button
                        onClick={() => handleDelete(row)}
                        title="Nonaktifkan (soft delete)"
                        className="rounded border border-red-200 bg-red-50 px-2 py-1 text-[11px] text-red-700 hover:bg-red-100"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-lg">
            <h3 className="text-sm font-semibold font-mono text-gray-900">
              {editing ? `Edit ${entityLabel}` : `Tambah ${entityLabel} Baru`}
            </h3>
            <p className="mt-1 text-xs font-mono text-gray-500">
              {editing ? `ID: ${editing.id}` : 'ID akan digenerate otomatis (CLI-/CON-/PROG- prefix).'}
            </p>
            <label className="mt-4 block">
              <span className="text-xs font-mono text-gray-600">Nama *</span>
              <input
                autoFocus
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder={`Nama ${entityLabel.toLowerCase()}`}
                className="mt-1 w-full rounded border border-gray-200 px-3 py-2 text-sm font-mono focus:border-gray-400 focus:outline-none"
              />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setModalOpen(false)}
                className="rounded border border-gray-200 bg-white px-3 py-1.5 text-xs font-mono hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !formName.trim()}
                className="rounded bg-gray-900 px-3 py-1.5 text-xs font-mono font-medium text-white hover:bg-black disabled:opacity-50"
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
