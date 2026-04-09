import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { getAllAreas, getAllColaboradores, putColaborador, deleteColaborador } from '../../services/db'
import type { Area, Colaborador } from '../../types'
import { Header } from '../../components/layout/Header'
import { BottomNav } from '../../components/layout/BottomNav'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Badge } from '../../components/ui/Badge'
import { Spinner } from '../../components/ui/Spinner'

const colabSchema = z.object({
  nombre: z.string().min(1, 'Requerido'),
  areaId: z.string().min(1, 'Requerido'),
  supervisorId: z.string(),
  externo: z.boolean(),
  asignado: z.boolean(),
  activo: z.boolean(),
})
type ColabForm = z.infer<typeof colabSchema>

type Mode = 'list' | 'add' | 'edit'

export default function AdminColaboradores() {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<Mode>('list')
  const [editing, setEditing] = useState<Colaborador | null>(null)
  const [search, setSearch] = useState('')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ColabForm>({
    resolver: zodResolver(colabSchema),
    defaultValues: { nombre: '', areaId: '', supervisorId: '', externo: false, asignado: false, activo: true },
  })

  const load = async () => {
    setLoading(true)
    const [colabs, areasData] = await Promise.all([getAllColaboradores(), getAllAreas()])
    setColaboradores(colabs)
    setAreas(areasData)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openAdd = () => {
    setEditing(null)
    reset({ nombre: '', areaId: areas[0]?.id ?? '', supervisorId: '', externo: false, asignado: false, activo: true })
    setMode('add')
  }

  const openEdit = (c: Colaborador) => {
    setEditing(c)
    reset({ nombre: c.nombre, areaId: c.areaId, supervisorId: c.supervisorId, externo: c.externo, asignado: c.asignado, activo: c.activo })
    setMode('edit')
  }

  const onSubmit = async (data: ColabForm) => {
    const colab: Colaborador = editing
      ? { ...editing, ...data }
      : { id: crypto.randomUUID(), ...data }
    await putColaborador(colab)
    await load()
    setMode('list')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este colaborador del dispositivo?')) return
    await deleteColaborador(id)
    setColaboradores((prev) => prev.filter((c) => c.id !== id))
  }

  const areaOptions = areas.map((a) => ({ value: a.id, label: a.nombre }))
  const filtered = search
    ? colaboradores.filter((c) => c.nombre.toLowerCase().includes(search.toLowerCase()))
    : colaboradores

  const getAreaNombre = (id: string) => areas.find((a) => a.id === id)?.nombre ?? id

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header title="Colaboradores" showBack />

      <main className="flex-1 px-4 py-6 pb-24 space-y-4">
        {mode === 'list' && (
          <>
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-gray-900">Colaboradores</h1>
              <Button size="sm" onClick={openAdd}>+ Nuevo</Button>
            </div>

            <input
              type="search"
              placeholder="Buscar por nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />

            {loading && <div className="flex justify-center py-8"><Spinner /></div>}

            <p className="text-xs text-gray-500">{filtered.length} colaborador{filtered.length !== 1 ? 'es' : ''}</p>

            <div className="space-y-2">
              {filtered.map((c) => (
                <Card key={c.id}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">
                      {c.nombre.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{c.nombre}</p>
                      <p className="text-xs text-gray-500 truncate">{getAreaNombre(c.areaId)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {c.externo && <Badge variant="blue">Externo</Badge>}
                      <Badge variant={c.activo ? 'green' : 'gray'}>{c.activo ? 'Activo' : 'Inactivo'}</Badge>
                    </div>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => openEdit(c)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600" aria-label="Editar">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button type="button" onClick={() => handleDelete(c.id)} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500" aria-label="Eliminar">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {(mode === 'add' || mode === 'edit') && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-gray-900">
                {mode === 'add' ? 'Nuevo colaborador' : 'Editar colaborador'}
              </h1>
              <Button type="button" variant="ghost" size="sm" onClick={() => setMode('list')}>
                Cancelar
              </Button>
            </div>

            <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100 space-y-4">
              <Input label="Nombre completo" error={errors.nombre?.message} {...register('nombre')} />
              <Select
                label="Área"
                options={areaOptions}
                placeholder="Seleccionar área..."
                error={errors.areaId?.message}
                {...register('areaId')}
              />
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-green-600" {...register('externo')} />
                Colaborador externo
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-green-600" {...register('activo')} />
                Activo
              </label>
            </div>

            <Button type="submit" className="w-full">
              {mode === 'add' ? 'Crear colaborador' : 'Guardar cambios'}
            </Button>
          </form>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
