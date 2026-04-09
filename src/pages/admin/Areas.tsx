import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { getAllAreas, putArea, deleteArea } from '../../services/db'
import { patchAssignArea } from '../../services/api'
import type { Area } from '../../types'
import { Header } from '../../components/layout/Header'
import { BottomNav } from '../../components/layout/BottomNav'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Spinner } from '../../components/ui/Spinner'

const areaSchema = z.object({
  nombre: z.string().min(1, 'Requerido'),
  sedeId: z.string(),
  supervisorId: z.string(),
  activo: z.boolean(),
})
type AreaForm = z.infer<typeof areaSchema>

type Mode = 'list' | 'add' | 'edit'

export default function AdminAreas() {
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<Mode>('list')
  const [editing, setEditing] = useState<Area | null>(null)
  const [assigning, setAssigning] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AreaForm>({
    resolver: zodResolver(areaSchema),
    defaultValues: { nombre: '', sedeId: '', supervisorId: '', activo: true },
  })

  const load = async () => {
    setLoading(true)
    setAreas(await getAllAreas())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openAdd = () => {
    setEditing(null)
    reset({ nombre: '', sedeId: '', supervisorId: '', activo: true })
    setMode('add')
  }

  const openEdit = (area: Area) => {
    setEditing(area)
    reset({ nombre: area.nombre, sedeId: area.sedeId, supervisorId: area.supervisorId, activo: area.activo })
    setMode('edit')
  }

  const onSubmit = async (data: AreaForm) => {
    const area: Area = editing
      ? { ...editing, ...data }
      : { id: crypto.randomUUID(), ...data }
    await putArea(area)

    // Si es edición y cambió supervisorId, sincronizar con backend
    if (editing && data.supervisorId !== editing.supervisorId) {
      setAssigning(true)
      try {
        await patchAssignArea(area.id, data.supervisorId)
      } catch {
        // Si falla, queda actualizado localmente
      }
      setAssigning(false)
    }

    await load()
    setMode('list')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta área del dispositivo?')) return
    await deleteArea(id)
    setAreas((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header title="Áreas" showBack />

      <main className="flex-1 px-4 py-6 pb-24 space-y-4">
        {mode === 'list' && (
          <>
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-gray-900">Áreas</h1>
              <Button size="sm" onClick={openAdd}>+ Nueva</Button>
            </div>

            {loading && <div className="flex justify-center py-8"><Spinner /></div>}

            <div className="space-y-2">
              {areas.map((area) => (
                <Card key={area.id}>
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">{area.nombre}</p>
                      <p className="text-xs text-gray-500">
                        {area.sedeId && `Sede: ${area.sedeId}`}
                        {area.supervisorId && ` · Supervisor: ${area.supervisorId}`}
                      </p>
                    </div>
                    <Badge variant={area.activo ? 'green' : 'gray'}>
                      {area.activo ? 'Activa' : 'Inactiva'}
                    </Badge>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(area)}
                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        aria-label="Editar"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(area.id)}
                        className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                        aria-label="Eliminar"
                      >
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
                {mode === 'add' ? 'Nueva área' : 'Editar área'}
              </h1>
              <Button type="button" variant="ghost" size="sm" onClick={() => setMode('list')}>
                Cancelar
              </Button>
            </div>

            <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100 space-y-4">
              <Input label="Nombre" error={errors.nombre?.message} {...register('nombre')} />
              <Input label="Sede" {...register('sedeId')} />
              <Input
                label="ID Supervisor"
                placeholder="ID del supervisor asignado"
                {...register('supervisorId')}
              />
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-green-600" {...register('activo')} />
                Área activa
              </label>
            </div>

            <Button type="submit" className="w-full" loading={assigning}>
              {mode === 'add' ? 'Crear área' : 'Guardar cambios'}
            </Button>
          </form>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
