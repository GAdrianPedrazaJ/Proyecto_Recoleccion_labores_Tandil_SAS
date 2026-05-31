import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { putVariedad, deleteVariedad } from '../../services/db'
import { fetchVariedades, upsertVariedad, deleteVariedadSupa } from '../../services/api'
import type { Variedad } from '../../types'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Spinner } from '../../components/ui/Spinner'
import {
  Flower2,
  Plus,
  Search,
  Edit2,
  Trash2,
  XCircle,
  AlertCircle,
  Hash,
  Tag
} from 'lucide-react'

const schema = z.object({ nombre: z.string().min(1, 'El nombre es requerido') })
type FormData = z.infer<typeof schema>

export default function AdminVariedades() {
  const [items, setItems] = useState<Variedad[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Variedad | null>(null)
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
      const data = await fetchVariedades()
      setItems(data)
      await Promise.all(data.map(putVariedad))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar el catálogo de variedades')
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const openAdd = () => { setEditing(null); reset({ nombre: '' }); setModalOpen(true) }
  const openEdit = (item: Variedad) => { setEditing(item); reset({ nombre: item.nombre }); setModalOpen(true) }

  const onSubmit = async (data: FormData) => {
    setSaving(true); setError(null)
    try {
      const v: Variedad = editing ? { ...editing, ...data } : { id: `v${Date.now()}`, ...data }
      await upsertVariedad(v)
      await putVariedad(v)
      await load(); setModalOpen(false)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar los cambios')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar la variedad "${nombre}"?`)) return
    setError(null)
    try {
      await deleteVariedadSupa(id)
      await deleteVariedad(id)
      setItems((prev) => prev.filter((v) => v.id !== id))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al intentar eliminar el registro')
    }
  }

  const filtered = search ? items.filter((v) => v.nombre.toLowerCase().includes(search.toLowerCase())) : items

  return (
    <AdminLayout>
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Catálogo de Variedades</h1>
            <p className="text-sm font-medium text-gray-500 mt-1 flex items-center gap-2">
              <Flower2 className="w-4 h-4 text-pink-500" />
              {items.length} variedades registradas en el sistema
            </p>
          </div>
          <Button onClick={openAdd} className="w-full sm:w-auto px-6 py-6 rounded-2xl shadow-lg shadow-pink-100 flex items-center gap-2 bg-pink-600 hover:bg-pink-700">
            <Plus className="w-5 h-5" />
            Nueva Variedad
          </Button>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-3 animate-in shake duration-300">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="font-semibold">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-red-100 rounded-lg transition-colors">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Data Container */}
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 sm:p-6 bg-gray-50/30 border-b border-gray-50">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="search"
                placeholder="Buscar variedad..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-pink-500 text-sm font-medium transition-all outline-none"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Spinner size="lg" />
              <p className="text-gray-400 text-sm font-medium animate-pulse">Cargando catálogo...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-50/50">
                    <th className="px-8 py-4 w-20"><Hash className="w-3 h-3" /></th>
                    <th className="px-8 py-4">Nombre de la Variedad</th>
                    <th className="px-8 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-20">
                        <div className="flex flex-col items-center gap-2 opacity-30">
                          <Flower2 className="w-12 h-12" />
                          <p className="font-bold">No hay variedades disponibles</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((v, i) => (
                      <tr key={v.id} className="group hover:bg-pink-50/30 transition-colors">
                        <td className="px-8 py-5 text-xs font-black text-gray-300">
                          {String(i + 1).padStart(2, '0')}
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-pink-50 rounded-xl text-pink-600 group-hover:bg-pink-100 transition-colors">
                              <Tag className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-gray-900 group-hover:text-pink-700 transition-colors">{v.nombre}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEdit(v)}
                              className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                              title="Editar variedad"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(v.id, v.nombre)}
                              className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                              title="Eliminar registro"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modern Modal Form */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 pt-8 pb-4">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">{editing ? 'Editar Variedad' : 'Nueva Variedad'}</h2>
                  <p className="text-sm text-gray-500 font-medium">Actualiza el catálogo de productos</p>
                </div>
                <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-2xl transition-colors">
                  <XCircle className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                  <Input
                    label="Nombre descriptivo"
                    placeholder="Ej: Rosa Freedom"
                    {...register('nombre')}
                    error={errors.nombre?.message}
                    className="bg-white border-none ring-1 ring-gray-200 focus:ring-pink-500"
                  />
                </div>

                <div className="flex gap-4 pt-2">
                  <Button type="submit" loading={saving} className="flex-1 py-4 rounded-2xl shadow-lg shadow-pink-100 font-bold bg-pink-600 hover:bg-pink-700">
                    {editing ? 'Guardar Cambios' : 'Crear Registro'}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setModalOpen(false)} className="flex-1 py-4 rounded-2xl font-bold text-gray-500">
                    Cancelar
                  </Button>
                </div>
              </form>
            </div>
            <div className="bg-gray-50 p-4 text-center mt-4">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest flex items-center justify-center gap-2">
                <AlertCircle className="w-3 h-3" />
                Cambios permanentes en la base de datos
              </p>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
