import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { getAllSupervisores, getAllAreas, putSupervisor, deleteSupervisor } from '../../services/db'
import { upsertSupervisor, deleteSupervisorSupa } from '../../services/api'
import type { Supervisor, Area } from '../../types'
import { Header } from '../../components/layout/Header'
import { BottomNav } from '../../components/layout/BottomNav'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Badge } from '../../components/ui/Badge'
import { Spinner } from '../../components/ui/Spinner'

const schema = z.object({
  nombre: z.string().min(1, 'Requerido'),
  areaId: z.string().min(1, 'Requerido'),
  sedeId: z.string(),
  activo: z.boolean(),
})
type FormData = z.infer<typeof schema>
type Mode = 'list' | 'add' | 'edit'

export default function AdminSupervisores() {
  const [items, setItems] = useState<Supervisor[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mode, setMode] = useState<Mode>('list')
  const [editing, setEditing] = useState<Supervisor | null>(null)
  const [search, setSearch] = useState('')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', areaId: '', sedeId: '', activo: true },
  })

  const load = async () => {
    setLoading(true)
    const [s, a] = await Promise.all([getAllSupervisores(), getAllAreas()])
    setItems(s)
    setAreas(a)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openAdd = () => {
    setEditing(null)
    reset({ nombre: '', areaId: areas[0]?.id ?? '', sedeId: areas[0]?.sedeId ?? '', activo: true })
    setMode('add')
  }

  const openEdit = (item: Supervisor) => {
    setEditing(item)
    reset({ nombre: item.nombre, areaId: item.areaId, sedeId: item.sedeId, activo: item.activo })
    setMode('edit')
  }

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    const sup: Supervisor = editing
      ? { ...editing, ...data }
      : { id: `sup${Date.now()}`, ...data }
    try {
      await Promise.all([putSupervisor(sup), upsertSupervisor(sup)])
    } catch {
      await putSupervisor(sup)
    }
    await load()
    setMode('list')
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este supervisor?')) return
    try {
      await Promise.all([deleteSupervisor(id), deleteSupervisorSupa(id)])
    } catch {
      await deleteSupervisor(id)
    }
    setItems((prev) => prev.filter((s) => s.id !== id))
  }

  const areaOptions = areas.map((a) => ({ value: a.id, label: a.nombre }))
  const getAreaNombre = (id: string) => areas.find((a) => a.id === id)?.nombre ?? id

  const filtered = search
    ? items.filter((s) => s.nombre.toLowerCase().includes(search.toLowerCase()))
    : items

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header title="Supervisores" showBack />
      <main className="flex-1 px-4 py-6 pb-24 space-y-4">
        {mode === 'list' ? (
          <>
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-gray-900">Supervisores</h1>
              <Button size="sm" onClick={openAdd}>+ Nuevo</Button>
            </div>

            <input
              type="search"
              placeholder="Buscar supervisor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />

            {loading && <div className="flex justify-center py-8"><Spinner /></div>}
            <p className="text-xs text-gray-500">{filtered.length} supervisor{filtered.length !== 1 ? 'es' : ''}</p>

            <div className="space-y-2">
              {filtered.map((s) => (
                <Card key={s.id}>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{s.nombre}</p>
                      <p className="text-xs text-gray-500 truncate">{getAreaNombre(s.areaId)}</p>
                    </div>
                    <Badge variant={s.activo ? 'green' : 'red'}>{s.activo ? 'Activo' : 'Inactivo'}</Badge>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(s)}>Editar</Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(s.id)}>
                        <span className="text-red-500">Borrar</span>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">{editing ? 'Editar supervisor' : 'Nuevo supervisor'}</h2>
            <Input label="Nombre" error={errors.nombre?.message} {...register('nombre')} />
            <Select label="Área" options={areaOptions} error={errors.areaId?.message} {...register('areaId')} />
            <Input label="Sede" placeholder="(opcional)" {...register('sedeId')} />
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input type="checkbox" {...register('activo')} className="rounded" />
              Activo
            </label>
            <div className="flex gap-3">
              <Button type="submit" className="flex-1" loading={saving}>Guardar</Button>
              <Button type="button" variant="ghost" className="flex-1" onClick={() => setMode('list')}>Cancelar</Button>
            </div>
          </form>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
