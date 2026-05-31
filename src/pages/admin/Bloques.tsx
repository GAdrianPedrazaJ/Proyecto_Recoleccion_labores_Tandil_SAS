import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { putBloque, deleteBloque, putArea } from '../../services/db'
import { fetchBloques, fetchAreas, upsertBloque, deleteBloqueSupa } from '../../services/api'
import type { Bloque, Area } from '../../types'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Spinner } from '../../components/ui/Spinner'
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  Filter,
  XCircle,
  AlertCircle,
  MapPin,
  ChevronRight
} from 'lucide-react'

const schema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  areaId: z.string().min(1, 'Debe seleccionar un área'),
})
type FormData = z.infer<typeof schema>

export default function AdminBloques() {
  const [items, setItems] = useState<Bloque[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Bloque | null>(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filterArea, setFilterArea] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', areaId: '' },
  })

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const [b, a] = await Promise.all([fetchBloques(), fetchAreas()])
      setItems(b); setAreas(a)
      await Promise.all([...b.map(putBloque), ...a.map(putArea)])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar los datos')
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const openAdd = () => {
    setEditing(null);
    reset({ nombre: '', areaId: areas[0]?.id ?? '' });
    setModalOpen(true)
  }

  const openEdit = (item: Bloque) => {
    setEditing(item);
    reset({ nombre: item.nombre, areaId: item.areaId });
    setModalOpen(true)
  }

  const onSubmit = async (data: FormData) => {
    setSaving(true); setError(null)
    try {
      const bloque: Bloque = editing ? { ...editing, ...data } : { id: crypto.randomUUID(), ...data }
      await upsertBloque(bloque)
      await putBloque(bloque)
      await load();
      setModalOpen(false)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar el bloque')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el bloque "${nombre}"?`)) return
    setError(null)
    try {
      await deleteBloqueSupa(id)
      await deleteBloque(id)
      setItems((prev) => prev.filter((b) => b.id !== id))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al intentar eliminar el registro')
    }
  }

  const getAreaNombre = (id: string) => areas.find((a) => a.id === id)?.nombre ?? 'Área desconocida'
  const areaOptions = areas.map((a) => ({ value: a.id, label: a.nombre }))

  const filtered = items.filter((b) => {
    const matchSearch = !search || b.nombre.toLowerCase().includes(search.toLowerCase())
    const matchArea = !filterArea || b.areaId === filterArea
    return matchSearch && matchArea
  })

  return (
    <AdminLayout>
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Bloques de Cultivo</h1>
            <p className="text-sm font-medium text-gray-500 mt-1 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-500" />
              {items.length} bloques definidos en el sistema
            </p>
          </div>
          <Button onClick={openAdd} className="w-full sm:w-auto px-6 py-6 rounded-2xl shadow-lg shadow-green-100 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Nuevo Bloque
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

        {/* Data Table Container */}
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
          {/* Toolbar de búsqueda y filtros */}
          <div className="p-4 sm:p-6 bg-gray-50/30 border-b border-gray-50 flex flex-col md:flex-row items-center gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="search"
                placeholder="Buscar bloque..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-green-500 text-sm font-medium transition-all outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterArea}
                onChange={(e) => setFilterArea(e.target.value)}
                className="flex-1 md:w-60 bg-white border-none ring-1 ring-gray-200 rounded-2xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-green-500 transition-all"
              >
                <option value="">Todas las áreas</option>
                {areas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
              </select>
            </div>

            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-auto">
              {filtered.length} Coincidencias
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Spinner size="lg" />
              <p className="text-gray-400 text-sm font-medium animate-pulse">Sincronizando bloques...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-50/50">
                    <th className="px-8 py-4">Identificador de Bloque</th>
                    <th className="px-8 py-4">Área de Trabajo</th>
                    <th className="px-8 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-20">
                        <div className="flex flex-col items-center gap-2 opacity-30">
                          <Layers className="w-12 h-12" />
                          <p className="font-bold">No se encontraron bloques</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((b) => (
                      <tr key={b.id} className="group hover:bg-green-50/30 transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-100 transition-colors">
                              <Layers className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{b.nombre}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-4 py-1.5 text-xs font-black text-green-700 border border-green-100">
                            <MapPin className="w-3 h-3" />
                            {getAreaNombre(b.areaId)}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEdit(b)}
                              className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                              title="Editar bloque"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(b.id, b.nombre)}
                              className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                              title="Eliminar bloque"
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
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 pt-8 pb-4">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">{editing ? 'Editar Bloque' : 'Nuevo Bloque'}</h2>
                  <p className="text-sm text-gray-500 font-medium">Define los límites y ubicación del cultivo</p>
                </div>
                <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-2xl transition-colors">
                  <XCircle className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-5 bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                  <Input
                    label="Nombre o Código del Bloque"
                    placeholder="Ej: B-102"
                    {...register('nombre')}
                    error={errors.nombre?.message}
                    className="bg-white border-none ring-1 ring-gray-200 focus:ring-green-500"
                  />

                  <Select
                    label="Área de Pertenencia"
                    options={areaOptions}
                    {...register('areaId')}
                    error={errors.areaId?.message}
                    className="bg-white border-none ring-1 ring-gray-200"
                  />
                </div>

                <div className="flex gap-4 pt-2">
                  <Button type="submit" loading={saving} className="flex-1 py-4 rounded-2xl shadow-lg shadow-green-100 font-bold">
                    {editing ? 'Guardar Cambios' : 'Crear Bloque'}
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
                Los cambios afectan a todos los registros vinculados
              </p>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
