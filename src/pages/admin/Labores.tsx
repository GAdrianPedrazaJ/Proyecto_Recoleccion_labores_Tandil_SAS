import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { getAllLabores, putLabor, deleteLabor } from '../../services/db'
import { upsertLabor, deleteLaborSupa } from '../../services/api'
import type { LaborCatalog } from '../../types'
import { Header } from '../../components/layout/Header'
import { BottomNav } from '../../components/layout/BottomNav'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Spinner } from '../../components/ui/Spinner'

const schema = z.object({
  nombre: z.string().min(1, 'Requerido'),
})
type FormData = z.infer<typeof schema>
type Mode = 'list' | 'add' | 'edit'

export default function AdminLabores() {
  const [items, setItems] = useState<LaborCatalog[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mode, setMode] = useState<Mode>('list')
  const [editing, setEditing] = useState<LaborCatalog | null>(null)
  const [search, setSearch] = useState('')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '' },
  })

  const load = async () => {
    setLoading(true)
    setItems(await getAllLabores())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openAdd = () => {
    setEditing(null)
    reset({ nombre: '' })
    setMode('add')
  }

  const openEdit = (item: LaborCatalog) => {
    setEditing(item)
    reset({ nombre: item.nombre })
    setMode('edit')
  }

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    const labor: LaborCatalog = editing
      ? { ...editing, ...data }
      : { id: `lab${Date.now()}`, ...data }
    try {
      await Promise.all([putLabor(labor), upsertLabor(labor)])
    } catch {
      await putLabor(labor)
    }
    await load()
    setMode('list')
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta labor?')) return
    try {
      await Promise.all([deleteLabor(id), deleteLaborSupa(id)])
    } catch {
      await deleteLabor(id)
    }
    setItems((prev) => prev.filter((l) => l.id !== id))
  }

  const filtered = search
    ? items.filter((l) => l.nombre.toLowerCase().includes(search.toLowerCase()))
    : items

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header title="Labores" showBack />
      <main className="flex-1 px-4 py-6 pb-24 space-y-4">
        {mode === 'list' ? (
          <>
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-gray-900">Catálogo de labores</h1>
              <Button size="sm" onClick={openAdd}>+ Nuevo</Button>
            </div>

            <input
              type="search"
              placeholder="Buscar labor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />

            {loading && <div className="flex justify-center py-8"><Spinner /></div>}
            <p className="text-xs text-gray-500">{filtered.length} labor{filtered.length !== 1 ? 'es' : ''}</p>

            <div className="space-y-2">
              {filtered.map((l) => (
                <Card key={l.id}>
                  <div className="flex items-center gap-3">
                    <p className="flex-1 font-medium text-gray-900 truncate">{l.nombre}</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(l)}>Editar</Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(l.id)}>
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
            <h2 className="text-lg font-bold text-gray-900">{editing ? 'Editar labor' : 'Nueva labor'}</h2>
            <Input label="Nombre de la labor" error={errors.nombre?.message} {...register('nombre')} />
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
