import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Spinner } from '../../components/ui/Spinner'
import { Card } from '../../components/ui/Card'
import {
  getUsuarios,
  updateUsuarioAdmin,
  createUsuarioAdmin,
  updatePasswordAdmin,
  type UsuarioListItem,
  type Rol,
} from '../../services/auth'
import {
  Users,
  UserPlus,
  Shield,
  UserCheck,
  UserX,
  Search,
  Filter,
  RefreshCcw,
  Edit2,
  Key,
  XCircle,
  AlertCircle,
  MoreVertical,
  CheckCircle2,
  Lock
} from 'lucide-react'

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="px-8 pt-8 pb-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-gray-900">Nuevo Usuario</h2>
              <p className="text-sm text-gray-500 font-medium">Asigna roles y accesos al personal</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-2xl transition-colors">
              <XCircle className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-gray-50/50 p-6 rounded-3xl space-y-4 border border-gray-100">
              <Input
                label="Nombre completo"
                value={form.nombre}
                onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                placeholder="Ej: María García"
                className="bg-white border-none ring-1 ring-gray-200 focus:ring-green-500"
                required
              />
              <Input
                label="Email Institucional"
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="correo@ejemplo.com"
                className="bg-white border-none ring-1 ring-gray-200 focus:ring-green-500"
                required
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-gray-500 uppercase tracking-tight ml-1">Rol de Usuario</label>
                <select
                  value={form.rol}
                  onChange={(e) => setForm((p) => ({ ...p, rol: e.target.value as Rol }))}
                  className="w-full bg-white border-none ring-1 ring-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-green-500 transition-all cursor-pointer"
                >
                  <option value="supervisor">Supervisor</option>
                  <option value="administrador">Administrador</option>
                  <option value="superadministrador">Superadministrador</option>
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Contraseña"
                  type="password"
                  value={form.contraseña}
                  onChange={(e) => setForm((p) => ({ ...p, contraseña: e.target.value }))}
                  placeholder="Mín. 6 carac."
                  className="bg-white border-none ring-1 ring-gray-200 focus:ring-green-500"
                  required
                />
                <Input
                  label="Confirmar"
                  type="password"
                  value={form.confirmar}
                  onChange={(e) => setForm((p) => ({ ...p, confirmar: e.target.value }))}
                  placeholder="Repetir"
                  className="bg-white border-none ring-1 ring-gray-200 focus:ring-green-500"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="flex gap-4 pt-2">
              <Button type="submit" variant="primary" loading={loading} className="flex-1 py-4 rounded-2xl shadow-lg shadow-green-100 font-bold">
                Crear Usuario
              </Button>
              <Button type="button" variant="ghost" onClick={onClose} className="flex-1 py-4 rounded-2xl font-bold text-gray-500">
                Cancelar
              </Button>
            </div>
          </form>
        </div>
        <div className="bg-gray-50 p-4 text-center">
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest flex items-center justify-center gap-2">
            <Lock className="w-3 h-3" />
            Las credenciales son personales e intransferibles
          </p>
        </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="px-8 pt-8 pb-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-gray-900">Editar Perfil</h2>
              <p className="text-sm text-gray-500 font-medium">{usuario.email}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-2xl transition-colors">
              <XCircle className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="bg-gray-50/50 p-6 rounded-3xl space-y-4 border border-gray-100">
              <Input
                label="Nombre Completo"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="bg-white border-none ring-1 ring-gray-200 focus:ring-green-500"
                required
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-gray-500 uppercase tracking-tight ml-1">Rol Asignado</label>
                <select
                  value={rol}
                  onChange={(e) => setRol(e.target.value as Rol)}
                  className="w-full bg-white border-none ring-1 ring-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-green-500 transition-all cursor-pointer"
                >
                  <option value="supervisor">Supervisor</option>
                  <option value="administrador">Administrador</option>
                  <option value="superadministrador">Superadministrador</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-2xl text-sm font-bold">{error}</div>
            )}

            <div className="flex gap-4 pt-2">
              <Button type="submit" variant="primary" loading={loading} className="flex-1 py-4 rounded-2xl shadow-lg shadow-green-100 font-bold">
                Guardar Cambios
              </Button>
              <Button type="button" variant="ghost" onClick={onClose} className="flex-1 py-4 rounded-2xl font-bold text-gray-500">
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// ─── Modal: Cambiar contraseña ────────────────────────────────────────────────
interface PasswordModalProps {
  usuario: UsuarioListItem
  onClose: () => void
  onSuccess: () => void
}

function PasswordModal({ usuario, onClose, onSuccess }: PasswordModalProps) {
  const [pass, setPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (pass.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (pass !== confirm) {
      setError('Las contraseñas no coinciden')
      return
    }
    setLoading(true)
    try {
      await updatePasswordAdmin(usuario.id, pass)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="px-8 pt-8 pb-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-50 text-yellow-600 rounded-2xl">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 leading-tight">Nueva Clave</h2>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{usuario.nombre}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-2xl transition-colors">
              <XCircle className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4 bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
              <Input
                label="Nueva contraseña"
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="bg-white border-none ring-1 ring-gray-200 focus:ring-yellow-500"
                required
              />
              <Input
                label="Confirmar contraseña"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repetir contraseña"
                className="bg-white border-none ring-1 ring-gray-200 focus:ring-yellow-500"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="flex gap-4 pt-2">
              <Button type="submit" variant="primary" loading={loading} className="flex-1 py-4 rounded-2xl shadow-lg shadow-yellow-100 font-bold bg-yellow-600 hover:bg-yellow-700 border-none">
                Actualizar Clave
              </Button>
              <Button type="button" variant="ghost" onClick={onClose} className="flex-1 py-4 rounded-2xl font-bold text-gray-500">
                Cancelar
              </Button>
            </div>
          </form>
        </div>
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
  const [cambiandoPass, setCambiandoPass] = useState<UsuarioListItem | null>(null)
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
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Cuentas de Usuario</h1>
            <p className="text-gray-500 mt-1 font-medium flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-500" />
              Gestión centralizada de roles y credenciales de acceso
            </p>
          </div>
          <Button variant="primary" onClick={() => setShowNuevo(true)} className="px-6 py-6 rounded-2xl shadow-lg shadow-green-100 flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Nuevo Usuario
          </Button>
        </div>

        {/* KPIs Rápidos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard label="Total Cuentas" value={total} icon={Users} color="gray" />
          <KPICard label="Usuarios Activos" value={activos} icon={UserCheck} color="green" />
          <KPICard label="Cuentas de Baja" value={inactivos} icon={UserX} color="red" />
          <KPICard label="Administración" value={porRol('administrador') + porRol('superadministrador')} icon={Shield} color="purple" />
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-3 animate-in shake duration-300">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="font-bold flex-1">{error}</p>
            <button onClick={() => setError('')} className="p-1 hover:bg-red-100 rounded-lg transition-colors">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Toolbar Filtros */}
        <div className="bg-white rounded-[2rem] border border-gray-100 p-4 sm:p-6 shadow-sm flex flex-col lg:flex-row gap-4 items-end">
          <div className="flex-1 w-full relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              placeholder="Buscar por nombre o dirección de correo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-gray-50/50 border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-green-500 text-sm font-medium transition-all outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full lg:w-auto">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Filtrar por Rol</label>
              <select
                value={filtroRol}
                onChange={(e) => setFiltroRol(e.target.value as typeof filtroRol)}
                className="bg-gray-50/50 border-none ring-1 ring-gray-100 rounded-2xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-green-500 transition-all cursor-pointer min-w-[180px]"
              >
                <option value="todos">Todos los roles</option>
                <option value="supervisor">Supervisores</option>
                <option value="administrador">Administradores</option>
                <option value="superadministrador">Superadmins</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Estado de Cuenta</label>
              <select
                value={filtroActivo}
                onChange={(e) => setFiltroActivo(e.target.value as typeof filtroActivo)}
                className="bg-gray-50/50 border-none ring-1 ring-gray-100 rounded-2xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-green-500 transition-all cursor-pointer min-w-[180px]"
              >
                <option value="todos">Cualquier estado</option>
                <option value="activo">Solo Activos</option>
                <option value="inactivo">Solo Inactivos</option>
              </select>
            </div>
          </div>

          <button
            onClick={load}
            className="p-3 bg-green-50 text-green-700 rounded-2xl hover:bg-green-100 transition-colors shadow-sm"
            title="Actualizar lista"
          >
            <RefreshCcw className="w-5 h-5" />
          </button>
        </div>

        {/* Usuarios Data Container */}
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Spinner size="lg" />
              <p className="text-gray-400 text-sm font-medium animate-pulse">Sincronizando perfiles...</p>
            </div>
          ) : filtrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 opacity-30 gap-3">
              <Users className="w-16 h-16" />
              <p className="text-lg font-black uppercase tracking-widest">No hay coincidencias</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <tr>
                      <th className="px-8 py-4">Información Personal</th>
                      <th className="px-8 py-4">Correo Electrónico</th>
                      <th className="px-8 py-4">Privilegios</th>
                      <th className="px-8 py-4 text-center">Estado</th>
                      <th className="px-8 py-4 text-right">Acciones de Cuenta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtrados.map((u) => (
                      <tr key={u.id} className={`group hover:bg-green-50/30 transition-colors ${!u.activo ? 'bg-gray-50/30' : ''}`}>
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black shadow-sm group-hover:scale-110 transition-transform ${ROL_COLORS[u.rol]}`}>
                              {u.nombre.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-900 group-hover:text-green-700 transition-colors leading-tight">{u.nombre}</span>
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Miembro Tandil</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-4">
                          <span className="text-sm font-semibold text-gray-500">{u.email}</span>
                        </td>
                        <td className="px-8 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black border tracking-tight ${ROL_COLORS[u.rol]}`}>
                            {ROL_LABELS[u.rol].toUpperCase()}
                          </span>
                        </td>
                        <td className="px-8 py-4 text-center">
                          <ToggleActivo u={u} loading={togglingId === u.id} onToggle={toggleActivo} />
                        </td>
                        <td className="px-8 py-4 text-right">
                          <div className="flex justify-end items-center gap-2">
                            <button
                              onClick={() => setCambiandoPass(u)}
                              className="p-2.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-xl transition-all"
                              title="Reiniciar contraseña"
                            >
                              <Key className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditando(u)}
                              className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                              title="Editar permisos"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-gray-50">
                {filtrados.map((u) => (
                  <div key={u.id} className={`p-6 space-y-4 ${!u.activo ? 'bg-gray-50/50' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black flex-shrink-0 shadow-sm ${ROL_COLORS[u.rol]}`}>
                          {u.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-gray-900 truncate">{u.nombre}</p>
                          <p className="text-xs text-gray-400 font-medium truncate">{u.email}</p>
                        </div>
                      </div>
                      <ToggleActivo u={u} loading={togglingId === u.id} onToggle={toggleActivo} />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black border ${ROL_COLORS[u.rol]}`}>
                        {ROL_LABELS[u.rol].toUpperCase()}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCambiandoPass(u)}
                          className="flex items-center gap-2 px-3 py-2 bg-yellow-50 text-yellow-700 rounded-xl text-[10px] font-black uppercase"
                        >
                          <Key className="w-3.5 h-3.5" /> Clave
                        </button>
                        <button
                          onClick={() => setEditando(u)}
                          className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-xl text-[10px] font-black uppercase"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Editar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-8 py-4 bg-gray-50 border-t border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Visualizando {filtrados.length} de {total} cuentas registradas
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modales con nuevo diseño */}
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
      {cambiandoPass && (
        <PasswordModal
          usuario={cambiandoPass}
          onClose={() => setCambiandoPass(null)}
          onSuccess={() => { setCambiandoPass(null); }}
        />
      )}
    </AdminLayout>
  )
}

// ─── Componentes Auxiliares ──────────────────────────────────────────────────

function KPICard({ label, value, icon: Icon, color }: { label: string, value: number, icon: any, color: string }) {
  const colors: Record<string, string> = {
    gray: 'bg-white text-gray-900 border-gray-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  }

  return (
    <div className={`relative overflow-hidden rounded-[2rem] border p-6 shadow-sm transition-all hover:shadow-md ${colors[color]}`}>
      <div className="relative z-10">
        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">{label}</p>
        <p className="text-4xl font-black">{value}</p>
      </div>
      <Icon className="absolute -right-4 -bottom-4 w-24 h-24 opacity-10 rotate-12" />
    </div>
  )
}

function ToggleActivo({ u, loading, onToggle }: { u: UsuarioListItem, loading: boolean, onToggle: (u: UsuarioListItem) => void }) {
  return (
    <button
      onClick={() => onToggle(u)}
      disabled={loading}
      className={`group relative inline-flex h-7 w-12 items-center rounded-full transition-all focus:outline-none disabled:opacity-40 ${
        u.activo ? 'bg-green-500 shadow-inner' : 'bg-gray-200'
      }`}
    >
      <span className="sr-only">Cambiar estado</span>
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-all duration-300 ease-in-out ${
          u.activo ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner size="xs" />
        </span>
      )}
    </button>
  )
}
