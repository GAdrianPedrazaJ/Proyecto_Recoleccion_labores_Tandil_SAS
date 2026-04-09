import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import { getAllFormularios, countNoSincronizados } from '../../services/db'
import { syncPendientes } from '../../services/sync'
import type { Formulario } from '../../types'
import { Header } from '../../components/layout/Header'
import { BottomNav } from '../../components/layout/BottomNav'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'

export default function AdminDashboard() {
  const logout = useAuthStore((s) => s.logout)
  const username = useAuthStore((s) => s.username)
  const [formularios, setFormularios] = useState<Formulario[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  const load = async () => {
    setLoading(true)
    const [all, count] = await Promise.all([getAllFormularios(), countNoSincronizados()])
    setFormularios(all.slice(0, 10)) // mostrar sólo los 10 más recientes
    setPendingCount(count)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const handleSync = async () => {
    setSyncing(true)
    await syncPendientes()
    await load()
    setSyncing(false)
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header title="Admin" showSync />

      <main className="flex-1 px-4 py-6 pb-24 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Panel Admin</h1>
            <p className="text-sm text-gray-500">Bienvenido, {username}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>
            Salir
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <p className="text-2xl font-bold text-gray-900">{formularios.length}</p>
            <p className="text-sm text-gray-500">Registros (recientes)</p>
          </Card>
          <Card>
            <p className={`text-2xl font-bold ${pendingCount > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
              {pendingCount}
            </p>
            <p className="text-sm text-gray-500">Pendientes sync</p>
          </Card>
        </div>

        {/* Acciones */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/admin/areas"
            className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm hover:shadow-md transition-shadow"
          >
            <span className="text-2xl">🗺️</span>
            <span className="text-sm font-medium text-gray-700">Áreas</span>
          </Link>
          <Link
            to="/admin/colaboradores"
            className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm hover:shadow-md transition-shadow"
          >
            <span className="text-2xl">👥</span>
            <span className="text-sm font-medium text-gray-700">Colaboradores</span>
          </Link>
        </div>

        {pendingCount > 0 && (
          <Button className="w-full" variant="secondary" loading={syncing} onClick={handleSync}>
            Sincronizar pendientes ({pendingCount})
          </Button>
        )}

        {/* Registros recientes */}
        <h2 className="font-semibold text-gray-700">Registros recientes</h2>

        {loading && (
          <div className="flex justify-center py-4">
            <Spinner />
          </div>
        )}

        <div className="space-y-2">
          {formularios.map((f) => (
            <Card key={f.id}>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{f.areaNombre}</p>
                  <p className="text-xs text-gray-500">{f.fecha} · {f.tipo} · {f.filas.length} filas</p>
                </div>
                {f.sincronizado ? (
                  <Badge variant="green">Sync</Badge>
                ) : f.errorPermanente ? (
                  <Badge variant="red">Error</Badge>
                ) : (
                  <Badge variant="yellow">Pendiente</Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
