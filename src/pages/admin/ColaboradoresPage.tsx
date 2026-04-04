import { useEffect, useMemo, useState } from 'react'
import type { Area, Colaborador } from '../../types'
import { createId } from '../../utils/helpers'
import {
  getAllAreas,
  getAllColaboradores,
  putColaborador,
} from '../../services/db'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'

export function ColaboradoresPage() {
  const [areas, setAreas] = useState<Area[]>([])
  const [rows, setRows] = useState<Colaborador[]>([])
  const [filtroArea, setFiltroArea] = useState<string>('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Colaborador | null>(null)
  const [nombre, setNombre] = useState('')
  const [areaId, setAreaId] = useState('')
  const [externo, setExterno] = useState(false)

  const load = async () => {
    const [a, c] = await Promise.all([getAllAreas(), getAllColaboradores()])
    setAreas(a.filter((x) => x.activo))
    setRows(c)
  }

  useEffect(() => {
    void load()
  }, [])

  const areaNombre = useMemo(() => {
    const map = new Map(areas.map((x) => [x.id, x.nombre]))
    return (id: string) => map.get(id) ?? id
  }, [areas])

  const filtrados = useMemo(() => {
    if (!filtroArea) return rows
    return rows.filter((r) => r.areaId === filtroArea)
  }, [rows, filtroArea])

  const openNew = () => {
    setEditing(null)
    setNombre('')
    setAreaId(areas[0]?.id ?? '')
    setExterno(false)
    setOpen(true)
  }

  const openEdit = (c: Colaborador) => {
    setEditing(c)
    setNombre(c.nombre)
    setAreaId(c.areaId)
    setExterno(c.externo)
    setOpen(true)
  }

  const save = async () => {
    const c: Colaborador = {
      id: editing?.id ?? createId('col'),
      nombre: nombre.trim(),
      areaId,
      externo,
      activo: editing?.activo ?? true,
    }
    await putColaborador(c)
    setOpen(false)
    void load()
  }

  const toggle = async (c: Colaborador) => {
    await putColaborador({ ...c, activo: !c.activo })
    void load()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-ink">Colaboradores</h1>
        <Button type="button" onClick={openNew}>
          Nuevo colaborador
        </Button>
      </div>
      <label className="block max-w-xs text-sm font-medium text-ink">
        Filtrar por área
        <select
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5"
          value={filtroArea}
          onChange={(e) => setFiltroArea(e.target.value)}
        >
          <option value="">Todas</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}
            </option>
          ))}
        </select>
      </label>
      <ul className="space-y-2">
        {filtrados.map((c) => (
          <li
            key={c.id}
            className="rounded-xl border border-gray-200 bg-white p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-ink">{c.nombre}</p>
                <p className="text-sm text-gray-600">
                  Área: {areaNombre(c.areaId)}
                </p>
                <p className="text-xs text-gray-500">
                  {c.externo ? 'Externo' : 'Interno'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {c.activo ? (
                  <Badge tone="success">Activo</Badge>
                ) : (
                  <Badge tone="danger">Inactivo</Badge>
                )}
                <Button
                  variant="secondary"
                  className="!min-h-9 !w-auto px-2 text-xs"
                  type="button"
                  onClick={() => void toggle(c)}
                >
                  {c.activo ? 'Desactivar' : 'Activar'}
                </Button>
                <Button
                  variant="ghost"
                  className="!min-h-9 !w-auto px-2 text-xs"
                  type="button"
                  onClick={() => openEdit(c)}
                >
                  Editar
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <Modal
        open={open}
        title={editing ? 'Editar colaborador' : 'Nuevo colaborador'}
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
          <Input label="Nombre completo" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <label className="block text-sm font-medium text-ink">
            Área
            <select
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5"
              value={areaId}
              onChange={(e) => setAreaId(e.target.value)}
            >
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={externo}
              onChange={(e) => setExterno(e.target.checked)}
            />
            ¿Es externo?
          </label>
        </div>
      </Modal>
    </div>
  )
}
