import { useEffect, useState, forwardRef, type InputHTMLAttributes } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { putColaborador, deleteColaborador, putArea } from '../../services/db'
import { fetchColaboradores, fetchAreas, upsertColaborador, deleteColaboradorSupa } from '../../services/api'
import type { Area, Colaborador } from '../../types'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Spinner } from '../../components/ui/Spinner'
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  UserCheck,
  Globe,
  Briefcase
} from 'lucide-react'

const schema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  areaId: z.string().min(1, 'Debe seleccionar un área'),
  supervisorId: z.string(),
  externo: z.boolean(),
  asignado: z.boolean(),
  activo: z.boolean(),
})
type FormData = z.infer<typeof schema>

// Subcomponente de Toggle con importación nombrada de forwardRef
const ToggleField = forwardRef<HTMLInputElement, { label: string } & InputHTMLAttributes<HTMLInputElement>>(
  ({ label, ...props }, ref) => (
    <label className="flex items-center gap-3 cursor-pointer group p-3 bg-white rounded-2xl border border-gray-100 hover:border-green-200 transition-all">
      <div className="relative">
        <input type="checkbox" ref={ref} {...props} className="sr-only peer" />
        <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-green-600"></div>
      </div>
      <span className="text-[11px] font-black text-gray-600 group-hover:text-gray-900 uppercase">{label}</span>
    </label>
  )
)
ToggleField.displayName = 'ToggleField'

export default function AdminColaboradores() {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Colaborador | null>(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', areaId: '', supervisorId: '', externo: false, asignado: false, activo: true },
  })

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const [c, a] = await Promise.all([fetchColaboradores(), fetchAreas()])
      setColaboradores(c); setAreas(a)
      await Promise.all([...c.map(putColaborador), ...a.map(putArea)])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar los datos')
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const openAdd = () => {
    setEditing(null)
    reset({
      nombre: '',
      areaId: areas[0]?.id ?? '',
      supervisorId: '',
      externo: false,
      asignado: false,
      activo: true
    })
    setModalOpen(true)
  }

  const openEdit = (c: Colaborador) => {
    setEditing(c)
    reset({
      nombre: c.nombre,
      areaId: c.areaId,
      supervisorId: c.supervisorId,
      externo: c.externo,
      asignado: c.asignado,
      activo: c.activo
    })
    setModalOpen(true)
  }

  const onSubmit = async (data: FormData) => {
    setSaving(true); setError(null)
    try {
      const colab: Colaborador = editing ? { ...editing, ...data } : { id: crypto.randomUUID(), ...data }
      await upsertColaborador(colab)
      await putColaborador(colab)
      await load()
      setModalOpen(false)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar los cambios')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar a este colaborador?')) return
    setError(null)
    try {
      await deleteColaboradorSupa(id)
      await deleteColaborador(id)
      setColaboradores((prev) => prev.filter((c) => c.id !== id))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al eliminar el registro')
    }
  }

  const getAreaNombre = (id: string) => areas.find((a) => a.id === id)?.nombre ?? 'Sin área'
  const areaOptions = areas.map((a) => ({ value: a.id, label: a.nombre }))
  const filtered = search
    ? colaboradores.filter((c) => c.nombre.toLowerCase().includes(search.toLowerCase()))
    : colaboradores

  return (
    <AdminLayout>
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Personal de Campo</h1>
            <div className="flex flex-wrap items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5 text-sm font-medium text-gray-500">
                <Users className="w-4 h-4 text-blue-500" />
                <span>{colaboradores.length} Colaboradores</span>
              </div>
              <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
              <div className="flex items-center gap-1.5 text-sm font-medium text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                <span>{colaboradores.filter(c => c.activo).length} Activos</span>
              </div>
            </div>
          </div>
          <Button onClick={openAdd} className="px-6 py-6 rounded-2xl shadow-lg shadow-green-100 flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Nuevo Colaborador
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

        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 bg-gray-50/30 border-b border-gray-50">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="search"
                placeholder="Buscar por nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-green-500 text-sm font-medium transition-all outline-none"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Spinner size="lg" />
              <p className="text-gray-400 text-sm font-medium animate-pulse">Cargando personal...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-50/50">
                    <th className="px-6 py-4">Colaborador</th>
                    <th className="px-6 py-4">Área Asignada</th>
                    <th className="px-6 py-4 text-center">Tipo</th>
                    <th className="px-6 py-4 text-center">Estado Laboral</th>
                    <th className="px-6 py-4 text-center">Vigencia</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-20">
                        <div className="flex flex-col items-center gap-2 opacity-30">
                          <Users className="w-12 h-12" />
                          <p className="font-bold">No se encontraron colaboradores</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((c) => (
                      <tr key={c.id} className="group hover:bg-green-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-green-600 font-black text-white shadow-sm">
                              {c.nombre.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-900 group-hover:text-green-700 transition-colors">{c.nombre}</span>
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">ID: {c.id.split('-')[0]}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-sm font-semibold text-gray-600">{getAreaNombre(c.areaId)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-black tracking-tight ${
                            c.externo ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {c.externo ? 'EXTERNO' : 'INTERNO'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black ${
                            c.asignado ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {c.asignado ? 'ASIGNADO' : 'DISPONIBLE'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black ${
                            c.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                          }`}>
                            {c.activo ? 'ACTIVO' : 'BAJA'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEdit(c)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(c.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
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

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 pt-8 pb-4">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">{editing ? 'Ficha de Colaborador' : 'Nuevo Ingreso'}</h2>
                  <p className="text-sm text-gray-500 font-medium">Gestiona los datos del personal operativo</p>
                </div>
                <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-2xl transition-colors">
                  <XCircle className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4 bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                  <Input label="Nombre Completo" placeholder="Ej: Juan Pérez" {...register('nombre')} error={errors.nombre?.message} />
                  <Select label="Área de Trabajo" options={areaOptions} {...register('areaId')} error={errors.areaId?.message} />
                  <Input label="ID de Supervisor" placeholder="Opcional" {...register('supervisorId')} />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <ToggleField label="Externo" {...register('externo')} />
                    <ToggleField label="Asignado" {...register('asignado')} />
                    <ToggleField label="Activo" {...register('activo')} />
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <Button type="submit" loading={saving} className="flex-1 py-4 rounded-2xl font-bold">
                    {editing ? 'Guardar Cambios' : 'Registrar'}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setModalOpen(false)} className="flex-1 py-4 rounded-2xl font-bold text-gray-500">
                    Cancelar
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
