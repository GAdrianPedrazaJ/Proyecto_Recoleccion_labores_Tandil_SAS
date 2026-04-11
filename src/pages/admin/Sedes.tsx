import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { putSede } from '../../services/db'
import { fetchSedes, upsertSede, deleteSedeSupabase } from '../../services/api'
import type { Sede } from '../../types'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Spinner } from '../../components/ui/Spinner'

const schema = z.object({
  nombre: z.string().min(1, 'Requerido'),
})
type FormData = z.infer<typeof schema>

export default function AdminSedes() {
  const [sedes, setSedes] = useState<Sede[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Sede | null>(null)
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
      const data = await fetchSedes()
      setSedes(data)
      await Promise.all(data.map(putSede))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar sedes')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openAdd = () => {
    setEditing(null)
    reset({ nombre: '' })
    setModalOpen(true)
  }

  const openEdit = (s: Sede) => {
    setEditing(s)
    reset({ nombre: s.nombre })
    setModalOpen(true)
  }

  const onSubmit = async (data: FormData) => {
    setSaving(true); setError(null)
    try {
      const sede: Sede = editing
        ? { ...editing, nombre: data.nombre }
        : { id: crypto.randomUUID(), nombre: data.nombre }
      await upsertSede(sede)
      await putSede(sede)
      await load()
      setModalOpen(false)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta sede? Asegurate de que no tenga áreas asignadas.')) return
    setError(null)
    try {
      await deleteSedeSupabase(id)
      setSedes((prev) => prev.filter((s) => s.id !== id))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al eliminar')
    }
  }

  const filtered = search
    ? sedes.filter((s) => s.nombre.toLowerCase().includes(search.toLowerCase()))
    : sedes

  return (
    <AdminLayout>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
          <span className="font-semibold">Error:</span> {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sedes</h1>
          <p className="text-sm text-gray-500 mt-0.5">{sedes.length} sede{sedes.length !== 1 ? 's' : ''} en total</p>
        </div>
        <Button onClick={openAdd} size="lg" className="w-full sm:w-auto">+ Nueva sede</Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="px-3 sm:px-4 py-3 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
          <input
            type="search"
            placeholder="Buscar sede..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-72 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
          <span className="text-xs text-gray-400">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Tabla */}
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Nombre</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={2} className="text-center py-12 text-gray-400">
                      {search ? 'Sin resultados' : 'No hay sedes. Creá la primera.'}
                    </td>
                  </tr>
                )}
                {filtered.map((s, i) => (
                  <tr
                    key={s.id}
                    className={`border-b border-gray-100 hover:bg-green-50/40 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}`}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{s.nombre}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEdit(s)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                          title="Editar"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a4 4 0 01-2.828 1.172H7v-2a4 4 0 011.172-2.828z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Eliminar"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4h6v3M4 7h16" />
                          </svg>
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

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5">
              {editing ? 'Editar sede' : 'Nueva sede'}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input label="Nombre" {...register('nombre')} error={errors.nombre?.message} autoFocus />
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
