import { useEffect, useState } from 'react'
import type { Area } from '../../types'
import { createId } from '../../utils/helpers'
import { getAllAreas, putArea } from '../../services/db'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'

export function AreasPage() {
  const [rows, setRows] = useState<Area[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Area | null>(null)
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState<Area['tipo']>('Labores')
  const [sede, setSede] = useState('TN')

  const load = async () => setRows(await getAllAreas())

  useEffect(() => {
    void load()
  }, [])

  const openNew = () => {
    setEditing(null)
    setNombre('')
    setTipo('Labores')
    setSede('TN')
    setOpen(true)
  }

  const openEdit = (a: Area) => {
    setEditing(a)
    setNombre(a.nombre)
    setTipo(a.tipo)
    setSede(a.sede)
    setOpen(true)
  }

  const save = async () => {
    const a: Area = {
      id: editing?.id ?? createId('area'),
      nombre: nombre.trim(),
      tipo,
      sede: sede.trim(),
      activo: editing?.activo ?? true,
    }
    await putArea(a)
    setOpen(false)
    void load()
  }

  const toggle = async (a: Area) => {
    await putArea({ ...a, activo: !a.activo })
    void load()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-ink">Áreas</h1>
        <Button type="button" onClick={openNew}>
          Nueva área
        </Button>
      </div>
      <ul className="space-y-2">
        {rows.map((a) => (
          <li
            key={a.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white p-4"
          >
            <div>
              <p className="font-semibold text-ink">{a.nombre}</p>
              <p className="text-sm text-gray-600">
                {a.tipo} · Sede {a.sede}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {a.activo ? (
                <Badge tone="success">Activa</Badge>
              ) : (
                <Badge tone="danger">Inactiva</Badge>
              )}
              <Button
                variant="secondary"
                className="!min-h-9 !w-auto px-3 text-xs"
                type="button"
                onClick={() => void toggle(a)}
              >
                {a.activo ? 'Desactivar' : 'Activar'}
              </Button>
              <Button
                variant="ghost"
                className="!min-h-9 !w-auto px-2 text-xs"
                type="button"
                onClick={() => openEdit(a)}
              >
                Editar
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <Modal
        open={open}
        title={editing ? 'Editar área' : 'Nueva área'}
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void save()}>
              Guardar
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <label className="block text-sm font-medium text-ink">
            Tipo
            <select
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as Area['tipo'])}
            >
              <option value="Labores">Labores</option>
              <option value="Corte">Corte</option>
              <option value="Vegetativa">Vegetativa</option>
            </select>
          </label>
          <Input label="Sede" value={sede} onChange={(e) => setSede(e.target.value)} />
        </div>
      </Modal>
    </div>
  )
}
