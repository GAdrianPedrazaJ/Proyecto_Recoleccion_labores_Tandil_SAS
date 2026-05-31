import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { putSupervisor, deleteSupervisor, putArea, putSede } from '../../services/db'
import { fetchSupervisores, fetchAreas, fetchSedes, upsertSupervisor, deleteSupervisorSupa } from '../../services/api'
import type { Supervisor, Area, Sede } from '../../types'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Spinner } from '../../components/ui/Spinner'
import {
  ShieldCheck,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MapPin,
  Briefcase,
  UserCircle
} from 'lucide-react'

const schema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  areaId: z.string().min(1, 'Debe seleccionar un área'),
  sedeId: z.string(),
  activo: z.boolean(),
})
type FormData = z.infer<typeof schema>

export default function AdminSupervisores() {
  const [items, setItems] = useState<Supervisor[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [sedes, setSedes] = useState<Sede[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Supervisor | null>(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', areaId: '', sedeId: '', activo: true },
  })

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const [s, a, sd] = await Promise.all([fetchSupervisores(), fetchAreas(), fetchSedes()])
      setItems(s); setAreas(a); setSedes(sd)
      await Promise.all([...s.map(putSupervisor), ...a.map(putArea), ...sd.map(putSede)])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar los supervisores')
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const openAdd = () => { setEditing(null); reset({ nombre: '', areaId: areas[0]?.id ?? '', sedeId: '', activo: true }); setModalOpen(true) }
  const openEdit = (item: Supervisor) => { setEditing(item); reset({ nombre: item.nombre, areaId: item.areaId, sedeId: item.sedeId, activo: item.activo }); setModalOpen(true) }

  const onSubmit = async (data: FormData) => {
    setSaving(true); setError(null)
    try {
      const s: Supervisor = editing ? { ...editing, ...data } : { id: crypto.randomUUID(), ...data }
      await upsertSupervisor(s)
      await putSupervisor(s)
      await load(); setModalOpen(false)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar el supervisor')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar al supervisor "${nombre}"?`)) return
    setError(null)
    try {
      await deleteSupervisorSupa(id)
      await deleteSupervisor(id)
      setItems((prev) => prev.filter((s) => s.id !== id))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al eliminar el registro')
    }
  }

  const getAreaNombre = (id: string) => areas.find((a) => a.id === id)?.nombre ?? 'Área desconocida'
  const getSedeNombre = (id: string) => sedes.find((s) => s.id === id)?.nombre ?? 'Sede desconocida'
  const areaOptions = areas.map((a) => ({ value: a.id, label: a.nombre }))
  const sedeOptions = sedes.map((s) => ({ value: s.id, label: s.nombre }))
  const filtered = search ? items.filter((s) => s.nombre.toLowerCase().includes(search.toLowerCase())) : items

  return (
    <AdminLayout>
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Supervisores de Campo</h1>
            <p className="text-sm font-medium text-gray-500 mt-1 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              {items.length} responsables registrados
            </p>
          </div>
          <Button onClick={openAdd} className="w-full sm:w-auto px-6 py-6 rounded-2xl shadow-lg shadow-blue-100 flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
            <UserPlus className="w-5 h-5" />
            Nuevo Supervisor
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
                placeholder="Buscar supervisor por nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500 text-sm font-medium transition-all outline-none"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Spinner size="lg" />
              <p className="text-gray-400 text-sm font-medium animate-pulse">Cargando responsables...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-50/50">
                    <th className="px-8 py-4">Información del Supervisor</th>
                    <th className="px-8 py-4">Área a Cargo</th>
                    <th className="px-8 py-4">Sede Asignada</th>
                    <th className="px-8 py-4 text-center">Estado</th>
                    <th className="px-8 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-20">
                        <div className="flex flex-col items-center gap-2 opacity-30">
                          <UserCircle className="w-12 h-12" />
                          <p className="font-bold">No se encontraron supervisores</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((s) => (
                      <tr key={s.id} className="group hover:bg-blue-50/30 transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 font-black shadow-sm group-hover:scale-110 transition-transform">
                              {s.nombre.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{s.nombre}</span>
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Responsable de Campo</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-4 py-1.5 text-xs font-black text-blue-700 border border-blue-100">
                            <Briefcase className="w-3 h-3" />
                            {getAreaNombre(s.areaId)}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-sm font-semibold text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-red-400" />
                            {s.sedeId ? getSedeNombre(s.sedeId) : 'Sin sede'}
                          </div>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ${
                            s.activo
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-400'
                          }`}>
                            {s.activo ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {s.activo ? 'ACTIVO' : 'INACTIVO'}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEdit(s)}
                              className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-xl transition-all"
                              title="Editar supervisor"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(s.id, s.nombre)}
                              className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-100 rounded-xl transition-all"
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
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 pt-8 pb-4">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">{editing ? 'Editar Supervisor' : 'Nuevo Registro'}</h2>
                  <p className="text-sm text-gray-500 font-medium">Asigna un responsable a una zona de trabajo</p>
                </div>
                <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-2xl transition-colors">
                  <XCircle className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-5 bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                  <Input
                    label="Nombre Completo"
                    placeholder="Ej: Ing. Alberto Rodríguez"
                    {...register('nombre')}
                    error={errors.nombre?.message}
                    className="bg-white border-none ring-1 ring-gray-200 focus:ring-blue-500"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select
                      label="Área Designada"
                      options={areaOptions}
                      {...register('areaId')}
                      error={errors.areaId?.message}
                      className="bg-white border-none ring-1 ring-gray-200"
                    />

                    <Select
                      label="Sede Operativa"
                      options={sedeOptions}
                      {...register('sedeId')}
                      className="bg-white border-none ring-1 ring-gray-200"
                    />
                  </div>

                  <div className="pt-2">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input type="checkbox" {...register('activo')} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </div>
                      <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900 transition-colors">Estado activo (Permitir acceso al sistema)</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <Button type="submit" loading={saving} className="flex-1 py-4 rounded-2xl shadow-lg shadow-blue-100 font-bold bg-blue-600 hover:bg-blue-700">
                    {editing ? 'Actualizar Ficha' : 'Dar de Alta'}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setModalOpen(false)} className="flex-1 py-4 rounded-2xl font-bold text-gray-500">
                    Cancelar
                  </Button>
                </div>
              </form>
            </div>
            <div className="bg-gray-50 p-4 text-center mt-4">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest flex items-center justify-center gap-2">
                <ShieldCheck className="w-3 h-3" />
                Acceso restringido bajo políticas de privacidad
              </p>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
