import { useEffect, useState } from 'react'
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

const schema = z.object({
  nombre: z.string().min(1, 'Requerido'),
  areaId: z.string().min(1, 'Requerido'),
  supervisorId: z.string(),
  externo: z.boolean(),
  asignado: z.boolean(),
  activo: z.boolean(),
})
type FormData = z.infer<typeof schema>

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
      setError(e instanceof Error ? e.message : 'Error al cargar')
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const openAdd = () => { setEditing(null); reset({ nombre: '', areaId: areas[0]?.id ?? '', supervisorId: '', externo: false, asignado: false, activo: true }); setModalOpen(true) }
  const openEdit = (c: Colaborador) => { setEditing(c); reset({ nombre: c.nombre, areaId: c.areaId, supervisorId: c.supervisorId, externo: c.externo, asignado: c.asignado, activo: c.activo }); setModalOpen(true) }

  const onSubmit = async (data: FormData) => {
    setSaving(true); setError(null)
    try {
      const colab: Colaborador = editing ? { ...editing, ...data } : { id: crypto.randomUUID(), ...data }
      await upsertColaborador(colab)
      await putColaborador(colab)
      await load(); setModalOpen(false)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este colaborador?')) return
    setError(null)
    try {
      await deleteColaboradorSupa(id)
      await deleteColaborador(id)
      setColaboradores((prev) => prev.filter((c) => c.id !== id))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al eliminar')
    }
  }

  const getAreaNombre = (id: string) => areas.find((a) => a.id === id)?.nombre ?? id
  const areaOptions = areas.map((a) => ({ value: a.id, label: a.nombre }))
  const filtered = search ? colaboradores.filter((c) => c.nombre.toLowerCase().includes(search.toLowerCase())) : colaboradores

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
          <h1 className="text-2xl font-bold text-gray-900">Colaboradores</h1>
          <p className="text-sm text-gray-500 mt-0.5">{colaboradores.length} colaborador{colaboradores.length !== 1 ? 'es' : ''}</p>
        </div>
        <Button onClick={openAdd}>+ Nuevo colaborador</Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
          <input type="search" placeholder="Buscar por nombre..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-72 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-green-500 focus:outline-none"
          />
          <span className="text-xs text-gray-400">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Nombre</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Área</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Externo</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Asignado</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Estado</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-gray-400">Sin resultados</td></tr>}
                {filtered.map((c, i) => (
                  <tr key={c.id} className={`border-b border-gray-100 hover:bg-blue-50/30 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">{c.nombre.charAt(0)}</div>
                        <span className="font-medium text-gray-900">{c.nombre}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{getAreaNombre(c.areaId)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${c.externo ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>{c.externo ? 'Sí' : 'No'}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${c.asignado ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>{c.asignado ? 'Sí' : 'No'}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${c.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{c.activo ? 'Activo' : 'Inactivo'}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openEdit(c)} className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50" title="Editar">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a4 4 0 01-2.828 1.172H7v-2a4 4 0 011.172-2.828z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50" title="Eliminar">
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5">{editing ? 'Editar colaborador' : 'Nuevo colaborador'}</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input label="Nombre" {...register('nombre')} error={errors.nombre?.message} />
              <Select label="Área" options={areaOptions} {...register('areaId')} error={errors.areaId?.message} />
              <Input label="Supervisor ID (opcional)" {...register('supervisorId')} />
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" {...register('externo')} className="rounded" /> Externo</label>
                <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" {...register('asignado')} className="rounded" /> Asignado</label>
                <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" {...register('activo')} className="rounded" /> Activo</label>
              </div>
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

