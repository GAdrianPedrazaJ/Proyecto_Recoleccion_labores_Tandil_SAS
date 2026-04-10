import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { putLabor, deleteLabor } from '../../services/db'
import { fetchLabores, fetchLabores, upsertLabor, deleteLaborSupa } from '../../services/api'
import type { LaborCatalog } from '../../types'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Spinner } from '../../components/ui/Spinner'

const schema = z.object({ nombre: z.string().min(1, 'Requerido') })
type FormData = z.infer<typeof schema>

export default function AdminLabores() {
  const [items, setItems] = useState<LaborCatalog[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<LaborCatalog | null>(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '' },
  })

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const data = await fetchLabores()
      setItems(data)
      await Promise.all(data.map(putLabor))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar')
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const openAdd = () => { setEditing(null); reset({ nombre: '' }); setModalOpen(true) }
  const openEdit = (item: LaborCatalog) => { setEditing(item); reset({ nombre: item.nombre }); setModalOpen(true) }

  const onSubmit = async (data: FormData) => {
    setSaving(true); setError(null)
    try {
      const l: LaborCatalog = editing ? { ...editing, ...data } : { id: `lab${Date.now()}`, ...data }
      await upsertLabor(l)
      await putLabor(l)
      await load(); setModalOpen(false)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar labor "${nombre}"?`)) return
    setError(null)
    try {
      await deleteLaborSupa(id)
      await deleteLabor(id)
      setItems((prev) => prev.filter((l) => l.id !== id))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al eliminar')
    }
    setSaving(true); setError(null)
    try {
      const l: LaborCatalog = editing ? { ...editing, ...data } : { id: `lab${Date.now()}`, ...data }
      await upsertLabor(l)
      await putLabor(l)
      await load(); setModalOpen(false)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar labor "${nombre}"?`)) return
    setError(null)
    try {
      await deleteLaborSupa(id)
      await deleteLabor(id)
      setItems((prev) => prev.filter((l) => l.id !== id))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al eliminar')
    }
  }

  const filtered = search ? items.filter((l) => l.nombre.toLowerCase().includes(search.toLowerCase())) : items

  return (
    <AdminLayout>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
          <span className="font-semibold">Error:</span> {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">✕</button>
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Labores</h1>
          <p className="text-sm text-gray-500 mt-0.5">{items.length} labor{items.length !== 1 ? 'es' : ''} en el catálogo</p>
        </div>
        <Button onClick={openAdd}>+ Nueva labor</Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
          <input type="search" placeholder="Buscar labor..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-72 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-green-500 focus:outline-none"
          />
          <span className="text-xs text-gray-400">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        {loading ? <div className="flex justify-center py-16"><Spinner /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">#</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Nombre de la labor</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">ID interno</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && <tr><td colSpan={4} className="text-center py-12 text-gray-400">Sin resultados</td></tr>}
                {filtered.map((l, i) => (
                  <tr key={l.id} className={`border-b border-gray-100 hover:bg-green-50/40 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}`}>
                    <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-700">{l.nombre.charAt(0)}</div>
                        <span className="font-medium text-gray-900">{l.nombre}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{l.id}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openEdit(l)} className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a4 4 0 01-2.828 1.172H7v-2a4 4 0 011.172-2.828z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(l.id, l.nombre)} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4h6v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5">{editing ? 'Editar labor' : 'Nueva labor'}</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input label="Nombre de la labor" {...register('nombre')} error={errors.nombre?.message} />
              <div className="flex gap-3 pt-2">
                <Button type="submit" loading={saving} className="flex-1">Guardar</Button>
                <Button type="button" variant="ghost" onClick={() => setModalOpen(false)} className="flex-1">Cancelar</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

