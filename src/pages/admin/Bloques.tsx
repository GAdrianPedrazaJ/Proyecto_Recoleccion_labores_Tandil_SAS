import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { getAllBloques, getAllAreas, putBloque, deleteBloque } from '../../services/db'
import { upsertBloque, deleteBloqueSupa } from '../../services/api'
import type { Bloque, Area } from '../../types'
import { Header } from '../../components/layout/Header'
import { BottomNav } from '../../components/layout/BottomNav'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Spinner } from '../../components/ui/Spinner'

const schema = z.object({
  nombre: z.string().min(1, 'Requerido'),
  areaId: z.string().min(1, 'Requerido'),
})
type FormData = z.infer<typeof schema>
type Mode = 'list' | 'add' | 'edit'

export default function AdminBloques() {
  const [items, setItems] = useState<Bloque[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mode, setMode] = useState<Mode>('list')
  const [editing, setEditing] = useState<Bloque | null>(null)
  const [search, setSearch] = useState('')
  const [filterArea, setFilterArea] = useState('')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', areaId: '' },
  })

  const load = async () => {
    setLoading(true)
    const [b, a] = await Promise.all([getAllBloques(), getAllAreas()])
    setItems(b)
    setAreas(a)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openAdd = () => {
    setEditing(null)
    reset({ nombre: '', areaId: areas[0]?.id ?? '' })
    setMode('add')
  }

  const openEdit = (item: Bloque) => {
    setEditing(item)
    reset({ nombre: item.nombre, areaId: item.areaId })
    setMode('edit')
  }

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    const bloque: Bloque = editing
      ? { ...editing, ...data }
      : { id: `b${Date.now()}`, ...data }
    try {
      await Promise.all([putBloque(bloque), upsertBloque(bloque)])
    } catch {
      await putBloque(bloque)
    }
    await load()
    setMode('list')
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este bloque?')) return
    try {
      await Promise.all([deleteBloque(id), deleteBloqueSupa(id)])
    } catch {
      await deleteBloque(id)
    }
    setItems((prev) => prev.filter((b) => b.id !== id))
  }

  const areaOptions = areas.map((a) => ({ value: a.id, label: a.nombre }))
  const getAreaNombre = (id: string) => areas.find((a) => a.id === id)?.nombre ?? id

  const filtered = items.filter((b) => {
    const matchSearch = !search || b.nombre.toLowerCase().includes(search.toLowerCase())
    const matchArea = !filterArea || b.areaId === filterArea
    return matchSearch && matchArea
  })

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header title="Bloques" showBack />
      <main className="flex-1 px-4 py-6 pb-24 space-y-4">
        {mode === 'list' ? (
          <>
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-gray-900">Bloques</h1>
              <Button size="sm" onClick={openAdd}>+ Nuevo</Button>
            </div>

            <div className="space-y-2">
              <input
                type="search"
                placeholder="Buscar bloque..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
              <select
                value={filterArea}
                onChange={(e) => setFilterArea(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="">Todas las áreas</option>
                {areas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
              </select>
            </div>

            {loading && <div className="flex justify-center py-8"><Spinner /></div>}
            <p className="text-xs text-gray-500">{filtered.length} bloque{filtered.length !== 1 ? 's' : ''}</p>

            <div className="space-y-2">
              {filtered.map((b) => (
                <Card key={b.id}>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{b.nombre}</p>
                      <p className="text-xs text-gray-500 truncate">{getAreaNombre(b.areaId)}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(b)}>Editar</Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(b.id)}>
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
            <h2 className="text-lg font-bold text-gray-900">{editing ? 'Editar bloque' : 'Nuevo bloque'}</h2>
            <Input label="Nombre" error={errors.nombre?.message} {...register('nombre')} />
            <Select
              label="Área"
              options={areaOptions}
              error={errors.areaId?.message}
              {...register('areaId')}
            />
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
