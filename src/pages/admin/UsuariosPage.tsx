import { useEffect, useState } from 'react'
import type { Usuario } from '../../types'
import { createId } from '../../utils/helpers'
import { getAllAreas, getAllUsuarios, putUsuario } from '../../services/db'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import type { Area } from '../../types'

export function UsuariosPage() {
  const [areas, setAreas] = useState<Area[]>([])
  const [rows, setRows] = useState<Usuario[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Usuario | null>(null)
  const [nombre, setNombre] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rol, setRol] = useState<'admin' | 'supervisor'>('supervisor')
  const [areasSel, setAreasSel] = useState<string[]>([])

  const load = async () => {
    const [a, u] = await Promise.all([getAllAreas(), getAllUsuarios()])
    setAreas(a)
    setRows(u)
  }

  useEffect(() => {
    void load()
  }, [])

  const areaNombre = (id: string) => areas.find((x) => x.id === id)?.nombre ?? id

  const openNew = () => {
    setEditing(null)
    setNombre('')
    setUsername('')
    setPassword('')
    setRol('supervisor')
    setAreasSel([])
    setOpen(true)
  }

  const openEdit = (u: Usuario) => {
    setEditing(u)
    setNombre(u.nombre)
    setUsername(u.username)
    setPassword(u.passwordHash)
    setRol(u.rol)
    setAreasSel([...u.areas])
    setOpen(true)
  }

  const toggleArea = (id: string) => {
    setAreasSel((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const save = async () => {
    const u: Usuario = {
      id: editing?.id ?? createId('usr'),
      username: username.trim(),
      passwordHash: password,
      rol,
      nombre: nombre.trim(),
      areas: rol === 'supervisor' ? areasSel : [],
      activo: editing?.activo ?? true,
    }
    await putUsuario(u)
    setOpen(false)
    void load()
  }

  const supervisores = rows.filter((u) => u.rol === 'supervisor')

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-ink">Usuarios</h1>
        <Button type="button" onClick={openNew}>
          Nuevo usuario
        </Button>
      </div>
      <p className="text-sm text-gray-600">
        Supervisores y sus áreas asignadas.
      </p>
      <ul className="space-y-2">
        {supervisores.map((u) => (
          <li
            key={u.id}
            className="rounded-xl border border-gray-200 bg-white p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-ink">{u.nombre}</p>
                <p className="text-sm text-gray-600">@{u.username}</p>
                <p className="mt-1 text-xs text-gray-500">
                  Áreas:{' '}
                  {u.areas.length
                    ? u.areas.map((id) => areaNombre(id)).join(', ')
                    : '—'}
                </p>
              </div>
              <Button
                variant="ghost"
                className="!min-h-9 !w-auto text-xs"
                type="button"
                onClick={() => openEdit(u)}
              >
                Editar
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-xs text-gray-500">
        Administradores: {rows.filter((x) => x.rol === 'admin').length}
      </p>

      <Modal
        open={open}
        title={editing ? 'Editar usuario' : 'Nuevo usuario'}
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
          <Input label="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <label className="block text-sm font-medium text-ink">
            Rol
            <select
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5"
              value={rol}
              onChange={(e) =>
                setRol(e.target.value as 'admin' | 'supervisor')
              }
            >
              <option value="supervisor">Supervisor</option>
              <option value="admin">Administrador</option>
            </select>
          </label>
          {rol === 'supervisor' ? (
            <fieldset>
              <legend className="text-sm font-medium text-ink">
                Áreas asignadas
              </legend>
              <div className="mt-2 space-y-2">
                {areas.filter((a) => a.activo).map((a) => (
                  <label key={a.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={areasSel.includes(a.id)}
                      onChange={() => toggleArea(a.id)}
                    />
                    {a.nombre}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}
        </div>
      </Modal>
    </div>
  )
}
