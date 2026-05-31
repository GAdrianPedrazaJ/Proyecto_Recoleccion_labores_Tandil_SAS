import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { putArea, deleteArea } from '../../services/db'
import { fetchAreas, fetchSedes, fetchSupervisores, upsertArea, deleteAreaSupa } from '../../services/api'
import type { Area, Sede, Supervisor } from '../../types'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Spinner } from '../../components/ui/Spinner'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  MapPin,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight
} from 'lucide-react'

const schema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  sedeId: z.string().min(1, 'Debe seleccionar una sede'),
  supervisorId: z.string(),
  activo: z.boolean(),
})
type FormData = z.infer<typeof schema>

export default function AdminAreas() {
  const [areas, setAreas] = useState<Area[]>([])
  const [sedes, setSedes] = useState<Sede[]>([])
  const [supervisores, setSupervisores] = useState<Supervisor[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Area | null>(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', sedeId: '', supervisorId: '', activo: true },
  })

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const [data, sedesData, supervisoresData] = await Promise.all([fetchAreas(), fetchSedes(), fetchSupervisores()])
      setAreas(data)
      setSedes(sedesData)
      setSupervisores(supervisoresData)
      await Promise.all(data.map(putArea))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar áreas')
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const getSedeNombre = (id: string) => sedes.find((s) => s.id === id)?.nombre ?? 'Sin Sede'
  const getSupervisorNombre = (id: string) => supervisores.find((s) => s.id === id)?.nombre ?? 'Sin asignar'
  const sedeOptions = sedes.map((s) => ({ value: s.id, label: s.nombre }))
  const supervisorOptions = [{ value: '', label: '— Sin supervisor —' }, ...supervisores.map((s) => ({ value: s.id, label: s.nombre }))]

  const openAdd = () => { setEditing(null); reset({ nombre: '', sedeId: '', supervisorId: '', activo: true }); setModalOpen(true) }
  const openEdit = (a: Area) => { setEditing(a); reset({ nombre: a.nombre, sedeId: a.sedeId, supervisorId: a.supervisorId, activo: a.activo }); setModalOpen(true) }

  const onSubmit = async (data: FormData) => {
    setSaving(true); setError(null)
    try {
      const area: Area = editing ? { ...editing, ...data } : { id: crypto.randomUUID(), ...data }
      await upsertArea(area)
      await putArea(area)
      await load()
      setModalOpen(false)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar los cambios')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta área? Esta acción no se puede deshacer.')) return
    setError(null)
    try {
      await deleteAreaSupa(id)
      await deleteArea(id)
      setAreas((prev) => prev.filter((a) => a.id !== id))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al intentar eliminar el registro')
    }
  }

  const filtered = search ? areas.filter((a) => a.nombre.toLowerCase().includes(search.toLowerCase())) : areas

  return (
    <AdminLayout>
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* Header de Sección */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Gestión de Áreas</h1>
            <div className="flex items-center gap-2 mt-1 text-gray-500">
              <span className="text-sm font-medium">{areas.length} áreas registradas</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
              <span className="text-sm font-medium text-green-600">{areas.filter(a => a.activo).length} activas</span>
            </div>
          </div>
          <Button onClick={openAdd} className="w-full sm:w-auto px-6 py-6 rounded-2xl shadow-lg shadow-green-100 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Nueva Área
          </Button>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-3 animate-in shake duration-300">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="font-medium">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-red-100 rounded-lg transition-colors">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Contenedor Principal */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Toolbar de búsqueda */}
          <div className="p-4 sm:p-6 border-b border-gray-50 flex flex-col sm:flex-row items-center gap-4 bg-gray-50/30">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="search"
                placeholder="Buscar por nombre de área..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-green-500 text-sm font-medium transition-all outline-none"
              />
            </div>
            {search && (
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                {filtered.length} resultados encontrados
              </span>
            )}
          </div>

          {/* Listado / Tabla */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Spinner size="lg" />
              <p className="text-gray-400 text-sm animate-pulse">Cargando catálogo de áreas...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-50/50">
                    <th className="px-6 py-4">Información de Área</th>
                    <th className="px-6 py-4">Ubicación (Sede)</th>
                    <th className="px-6 py-4">Responsable</th>
                    <th className="px-6 py-4 text-center">Estado</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-20">
                        <div className="flex flex-col items-center gap-2 opacity-30">
                          <MapPin className="w-12 h-12" />
                          <p className="font-bold">No se encontraron áreas</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((a) => (
                      <tr key={a.id} className="group hover:bg-green-50/30 transition-colors">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${a.activo ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                              <MapPin className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-gray-900 group-hover:text-green-700 transition-colors">{a.nombre}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-sm font-semibold text-gray-600 flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                            {getSedeNombre(a.sedeId)}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                            <User className="w-3.5 h-3.5" />
                            {getSupervisorNombre(a.supervisorId)}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ${
                            a.activo
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {a.activo ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {a.activo ? 'ACTIVA' : 'INACTIVA'}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEdit(a)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-xl transition-all"
                              title="Editar área"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(a.id)}
                              className="p-2 text-red-500 hover:bg-red-100 rounded-xl transition-all"
                              title="Eliminar área"
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

      {/* Modal de Formulario */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 pt-8 pb-4">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">{editing ? 'Editar Área' : 'Nueva Área'}</h2>
                  <p className="text-sm text-gray-500 font-medium">Completa la información del área de trabajo</p>
                </div>
                <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-2xl transition-colors">
                  <XCircle className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="bg-gray-50/50 p-6 rounded-3xl space-y-4 border border-gray-100">
                  <Input
                    label="Nombre de la Área"
                    placeholder="Ej: Invernadero A-12"
                    {...register('nombre')}
                    error={errors.nombre?.message}
                    className="bg-white border-none ring-1 ring-gray-200 focus:ring-green-500"
                  />

                  <div className="grid grid-cols-1 gap-4">
                    <Select
                      label="Sede / Ubicación"
                      options={sedeOptions}
                      {...register('sedeId')}
                      error={errors.sedeId?.message}
                      className="bg-white border-none ring-1 ring-gray-200"
                    />

                    <Select
                      label="Supervisor Responsable"
                      options={supervisorOptions}
                      {...register('supervisorId')}
                      className="bg-white border-none ring-1 ring-gray-200"
                    />
                  </div>

                  <div className="pt-2">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input type="checkbox" {...register('activo')} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </div>
                      <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900 transition-colors">Área activa para registros</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <Button type="submit" loading={saving} className="flex-1 py-4 rounded-2xl shadow-lg shadow-green-100 font-bold">
                    {editing ? 'Actualizar Área' : 'Crear Área'}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setModalOpen(false)} className="flex-1 py-4 rounded-2xl font-bold text-gray-500">
                    Cancelar
                  </Button>
                </div>
              </form>
            </div>
            <div className="bg-gray-50 p-4 text-center">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest flex items-center justify-center gap-2">
                <AlertCircle className="w-3 h-3" />
                Los cambios se sincronizarán automáticamente
              </p>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
