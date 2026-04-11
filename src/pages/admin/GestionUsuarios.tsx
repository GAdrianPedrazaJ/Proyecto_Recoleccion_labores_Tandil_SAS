import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Spinner } from '../../components/ui/Spinner'
import {
  getUsuarios,
  updateUsuarioAdmin,
  createUsuarioAdmin,
  type UsuarioListItem,
  type Rol,
} from '../../services/auth'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ROL_LABELS: Record<Rol, string> = {
  supervisor: 'Supervisor',
  administrador: 'Administrador',
  superadministrador: 'Superadmin',
}

const ROL_COLORS: Record<Rol, string> = {
  supervisor: 'bg-blue-100 text-blue-700 border-blue-200',
  administrador: 'bg-green-100 text-green-700 border-green-200',
  superadministrador: 'bg-purple-100 text-purple-700 border-purple-200',
}

// ─── Modal: Nuevo usuario ─────────────────────────────────────────────────────
interface NuevoUsuarioModalProps {
  onClose: () => void
  onCreated: () => void
}

function NuevoUsuarioModal({ onClose, onCreated }: NuevoUsuarioModalProps) {
  const [form, setForm] = useState({ email: '', nombre: '', contraseña: '', confirmar: '', rol: 'supervisor' as Rol })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.email.trim() || !form.nombre.trim() || !form.contraseña) {
      setError('Todos los campos son requeridos')
      return
    }
    if (form.contraseña !== form.confirmar) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (form.contraseña.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    setLoading(true)
    try {
      await createUsuarioAdmin({ email: form.email, nombre: form.nombre, contraseña: form.contraseña, rol: form.rol })
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear usuario')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Nuevo usuario</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre completo"
            value={form.nombre}
            onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
            placeholder="Ej: María García"
            required
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            placeholder="correo@ejemplo.com"
            required
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Rol</label>
            <select
              value={form.rol}
              onChange={(e) => setForm((p) => ({ ...p, rol: e.target.value as Rol }))}
              className="rounded-lg border border-gray-300 px-3 py-2.5 text-base text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="supervisor">Supervisor</option>
              <option value="administrador">Administrador</option>
              <option value="superadministrador">Superadministrador</option>
            </select>
          </div>
          <Input
            label="Contraseña"
            type="password"
            value={form.contraseña}
            onChange={(e) => setForm((p) => ({ ...p, contraseña: e.target.value }))}
            placeholder="Mínimo 6 caracteres"
            required
          />
          <Input
            label="Confirmar contraseña"
            type="password"
            value={form.confirmar}
            onChange={(e) => setForm((p) => ({ ...p, confirmar: e.target.value }))}
            placeholder="Repetir contraseña"
            required
          />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" variant="primary" loading={loading} className="flex-1">
              Crear usuario
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Modal: Editar usuario ────────────────────────────────────────────────────
interface EditModalProps {
  usuario: UsuarioListItem
  onClose: () => void
  onSaved: () => void
}

function EditModal({ usuario, onClose, onSaved }: EditModalProps) {
  const [nombre, setNombre] = useState(usuario.nombre)
  const [rol, setRol] = useState<Rol>(usuario.rol)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) { setError('El nombre es requerido'); return }
    setLoading(true)
    try {
      await updateUsuarioAdmin(usuario.id, { nombre: nombre.trim(), rol })
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Editar usuario</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-gray-500">{usuario.email}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Rol</label>
            <select
              value={rol}
              onChange={(e) => setRol(e.target.value as Rol)}
              className="rounded-lg border border-gray-300 px-3 py-2.5 text-base text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="supervisor">Supervisor</option>
              <option value="administrador">Administrador</option>
              <option value="superadministrador">Superadministrador</option>
            </select>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button type="submit" variant="primary" loading={loading} className="flex-1">Guardar</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function AdminGestionUsuarios() {
  const [usuarios, setUsuarios] = useState<UsuarioListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [filtroRol, setFiltroRol] = useState<'todos' | Rol>('todos')
  const [filtroActivo, setFiltroActivo] = useState<'todos' | 'activo' | 'inactivo'>('todos')
  const [showNuevo, setShowNuevo] = useState(false)
  const [editando, setEditando] = useState<UsuarioListItem | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getUsuarios()
      setUsuarios(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando usuarios')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const toggleActivo = async (u: UsuarioListItem) => {
    setTogglingId(u.id)
    try {
      await updateUsuarioAdmin(u.id, { activo: !u.activo })
      setUsuarios((prev) => prev.map((x) => x.id === u.id ? { ...x, activo: !x.activo } : x))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar')
    } finally {
      setTogglingId(null)
    }
  }

  // Filtros
  const filtrados = usuarios.filter((u) => {
    const q = busqueda.toLowerCase()
    const matchSearch = u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    const matchRol = filtroRol === 'todos' || u.rol === filtroRol
    const matchActivo =
      filtroActivo === 'todos' ||
      (filtroActivo === 'activo' && u.activo) ||
      (filtroActivo === 'inactivo' && !u.activo)
    return matchSearch && matchRol && matchActivo
  })

  // KPIs
  const total = usuarios.length
  const activos = usuarios.filter((u) => u.activo).length
  const inactivos = total - activos
  const porRol = (rol: Rol) => usuarios.filter((u) => u.rol === rol).length

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
            <p className="text-sm text-gray-500 mt-0.5">Administrá roles y accesos de los usuarios del sistema</p>
          </div>
          <Button variant="primary" onClick={() => setShowNuevo(true)}>
            + Nuevo usuario
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total',           val: total,                   color: 'text-gray-700',   bg: 'bg-gray-50',   border: 'border-gray-200' },
            { label: 'Activos',         val: activos,                  color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200' },
            { label: 'Inactivos',       val: inactivos,                color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200' },
            { label: 'Administradores', val: porRol('administrador') + porRol('superadministrador'), color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
          ].map(({ label, val, color, bg, border }) => (
            <div key={label} className={`rounded-xl border p-4 ${bg} ${border}`}>
              <p className="text-xs font-semibold text-gray-500 uppercase">{label}</p>
              <p className={`text-3xl font-bold mt-1 ${color}`}>{val}</p>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
            {error}
            <button onClick={() => setError('')} className="ml-4 text-red-500 hover:text-red-700">✕</button>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48">
            <Input
              placeholder="Buscar por nombre o email..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase">Rol</label>
            <select
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value as typeof filtroRol)}
              className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="todos">Todos los roles</option>
              <option value="supervisor">Supervisores</option>
              <option value="administrador">Administradores</option>
              <option value="superadministrador">Superadmins</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase">Estado</label>
            <select
              value={filtroActivo}
              onChange={(e) => setFiltroActivo(e.target.value as typeof filtroActivo)}
              className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="todos">Todos</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </select>
          </div>
          <Button variant="secondary" onClick={load}>↻ Actualizar</Button>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          ) : filtrados.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">
              {busqueda || filtroRol !== 'todos' || filtroActivo !== 'todos'
                ? 'No hay usuarios que coincidan con los filtros'
                : 'No hay usuarios registrados'}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Usuario</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Rol</th>
                      <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtrados.map((u) => (
                      <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${!u.activo ? 'opacity-60' : ''}`}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${ROL_COLORS[u.rol]}`}>
                              {u.nombre.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-900">{u.nombre}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-gray-600">{u.email}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${ROL_COLORS[u.rol]}`}>
                            {ROL_LABELS[u.rol]}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <ToggleActivo u={u} loading={togglingId === u.id} onToggle={toggleActivo} />
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => setEditando(u)}
                            className="text-xs font-medium text-green-700 hover:text-green-900 border border-green-300 hover:border-green-500 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-gray-100">
                {filtrados.map((u) => (
                  <div key={u.id} className={`p-4 space-y-3 ${!u.activo ? 'opacity-60' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${ROL_COLORS[u.rol]}`}>
                          {u.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{u.nombre}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                      <ToggleActivo u={u} loading={togglingId === u.id} onToggle={toggleActivo} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${ROL_COLORS[u.rol]}`}>
                        {ROL_LABELS[u.rol]}
                      </span>
                      <button
                        onClick={() => setEditando(u)}
                        className="text-xs font-medium text-green-700 border border-green-300 px-3 py-1.5 rounded-lg"
                      >
                        Editar
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
                Mostrando {filtrados.length} de {total} usuarios
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modales */}
      {showNuevo && (
        <NuevoUsuarioModal
          onClose={() => setShowNuevo(false)}
          onCreated={() => { setShowNuevo(false); load() }}
        />
      )}
      {editando && (
        <EditModal
          usuario={editando}
          onClose={() => setEditando(null)}
          onSaved={() => { setEditando(null); load() }}
        />
      )}
    </AdminLayout>
  )
}

// ─── Toggle de estado activo ──────────────────────────────────────────────────
function ToggleActivo({
  u,
  loading,
  onToggle,
}: {
  u: UsuarioListItem
  loading: boolean
  onToggle: (u: UsuarioListItem) => void
}) {
  return (
    <button
      onClick={() => onToggle(u)}
      disabled={loading}
      title={u.activo ? 'Click para desactivar' : 'Click para activar'}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
        u.activo ? 'bg-green-500' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          u.activo ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}
