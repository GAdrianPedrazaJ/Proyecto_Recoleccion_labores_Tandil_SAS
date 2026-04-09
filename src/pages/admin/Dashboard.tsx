import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import { fetchDashboardFormularios } from '../../services/api'
import { syncPendientes } from '../../services/sync'
import { countNoSincronizados, getAllAreas } from '../../services/db'
import type { Area } from '../../types'
import type { DashboardFormulario } from '../../services/api'
import { Header } from '../../components/layout/Header'
import { BottomNav } from '../../components/layout/BottomNav'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'

// ─── helpers ─────────────────────────────────────────────────────────────────

function getISOWeek(dateStr: string): number {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const jan4 = new Date(d.getFullYear(), 0, 4)
  return 1 + Math.round(((d.getTime() - jan4.getTime()) / 86400000 - 3 + ((jan4.getDay() + 6) % 7)) / 7)
}

function getWeekLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const week = getISOWeek(dateStr)
  return `Sem ${week} (${d.getFullYear()})`
}

function daysAgoIso(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}

// ─── types ────────────────────────────────────────────────────────────────────

interface AreaStats {
  areaId: string
  nombre: string
  total: number
  completos: number
  borradores: number
  porcentaje: number
}

interface WeekStats {
  label: string
  total: number
  completos: number
}

// ─── links admin ──────────────────────────────────────────────────────────────

const LINKS = [
  { to: '/admin/areas',         icon: '🗺️',  label: 'Áreas' },
  { to: '/admin/colaboradores', icon: '👥',  label: 'Colaboradores' },
  { to: '/admin/supervisores',  icon: '🧑‍💼', label: 'Supervisores' },
  { to: '/admin/bloques',       icon: '🟩',  label: 'Bloques' },
  { to: '/admin/variedades',    icon: '🌸',  label: 'Variedades' },
  { to: '/admin/labores',       icon: '🌿',  label: 'Labores' },
]

export default function AdminDashboard() {
  const logout = useAuthStore((s) => s.logout)
  const username = useAuthStore((s) => s.username)

  const [areas, setAreas] = useState<Area[]>([])
  const [formularios, setFormularios] = useState<DashboardFormulario[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [tab, setTab] = useState<'areas' | 'semanas'>('areas')

  const load = async () => {
    setLoading(true)
    const desde = daysAgoIso(28)
    const [forms, areasData, pending] = await Promise.all([
      fetchDashboardFormularios(desde).catch(() => [] as DashboardFormulario[]),
      getAllAreas(),
      countNoSincronizados(),
    ])
    setFormularios(forms)
    setAreas(areasData)
    setPendingCount(pending)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleSync = async () => {
    setSyncing(true)
    await syncPendientes()
    await load()
    setSyncing(false)
  }

  // ── Esta semana ─────────────────────────────────────────────────────────────
  const todayStr = new Date().toISOString().split('T')[0]
  const currentWeek = getISOWeek(todayStr)
  const thisWeek = formularios.filter((f) => getISOWeek(f.fecha) === currentWeek)
  const thisWeekCompletos = thisWeek.filter((f) => f.estado === 'completo').length

  // ── Por área ────────────────────────────────────────────────────────────────
  const areaStats: AreaStats[] = areas
    .map((a) => {
      const aForms = thisWeek.filter((f) => f.areaId === a.id)
      const completos = aForms.filter((f) => f.estado === 'completo').length
      const borradores = aForms.filter((f) => f.estado === 'borrador').length
      const total = aForms.length
      return { areaId: a.id, nombre: a.nombre, total, completos, borradores, porcentaje: total > 0 ? Math.round((completos / total) * 100) : 0 }
    })
    .sort((a, b) => b.completos - a.completos || b.total - a.total)

  // ── Por semana ──────────────────────────────────────────────────────────────
  const weekMap = new Map<string, WeekStats>()
  formularios.forEach((f) => {
    const label = getWeekLabel(f.fecha)
    if (!weekMap.has(label)) weekMap.set(label, { label, total: 0, completos: 0 })
    const w = weekMap.get(label)!
    w.total++
    if (f.estado === 'completo') w.completos++
  })
  const weekStats: WeekStats[] = Array.from(weekMap.values()).slice(0, 4)

  const areaMasAdelantada = areaStats.find((a) => a.completos > 0)
  const areasConLaboresBajos = areaStats.filter((a) => a.total === 0).slice(0, 5)

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header title="Admin" showSync />

      <main className="flex-1 px-4 py-6 pb-24 space-y-5">
        {/* Encabezado */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Panel Admin</h1>
            <p className="text-sm text-gray-500">Bienvenido/a, {username}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>Salir</Button>
        </div>

        {/* Stats esta semana */}
        <div className="grid grid-cols-3 gap-2">
          <Card>
            <p className="text-2xl font-bold text-gray-900">{thisWeek.length}</p>
            <p className="text-xs text-gray-500">Esta semana</p>
          </Card>
          <Card>
            <p className="text-2xl font-bold text-green-600">{thisWeekCompletos}</p>
            <p className="text-xs text-gray-500">Completos</p>
          </Card>
          <Card>
            <p className={`text-2xl font-bold ${pendingCount > 0 ? 'text-yellow-600' : 'text-gray-400'}`}>{pendingCount}</p>
            <p className="text-xs text-gray-500">Sin sync</p>
          </Card>
        </div>

        {pendingCount > 0 && (
          <Button className="w-full" variant="secondary" loading={syncing} onClick={handleSync}>
            Sincronizar pendientes ({pendingCount})
          </Button>
        )}

        {/* Destacados */}
        {!loading && (areaMasAdelantada || areasConLaboresBajos.length > 0) && (
          <div className="grid grid-cols-2 gap-2">
            {areaMasAdelantada && (
              <Card>
                <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Mayor avance</p>
                <p className="mt-1 text-sm font-bold text-gray-900 truncate">{areaMasAdelantada.nombre}</p>
                <p className="text-xs text-gray-500">{areaMasAdelantada.completos} completo{areaMasAdelantada.completos !== 1 ? 's' : ''} esta semana</p>
              </Card>
            )}
            {areasConLaboresBajos.length > 0 && (
              <Card>
                <p className="text-xs font-semibold text-orange-500 uppercase tracking-wide">Sin registros</p>
                <div className="mt-1 space-y-0.5">
                  {areasConLaboresBajos.map((a) => (
                    <p key={a.areaId} className="text-xs text-gray-700 truncate">{a.nombre}</p>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 rounded-lg bg-gray-200 p-1">
          {(['areas', 'semanas'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              {t === 'areas' ? 'Por área' : 'Por semana'}
            </button>
          ))}
        </div>

        {loading && <div className="flex justify-center py-6"><Spinner /></div>}

        {/* Vista: por área */}
        {!loading && tab === 'areas' && (
          <div className="space-y-2">
            {areaStats.every((a) => a.total === 0) && (
              <p className="text-center text-sm text-gray-400 py-6">Sin registros esta semana</p>
            )}
            {areaStats.filter((a) => a.total > 0).map((a) => (
              <Card key={a.areaId}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{a.nombre}</p>
                  <Badge variant={a.completos > 0 ? 'green' : 'yellow'}>
                    {a.completos}/{a.total}
                  </Badge>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100">
                  <div className="h-2 rounded-full bg-green-500 transition-all" style={{ width: `${a.porcentaje}%` }} />
                </div>
                <div className="mt-1 flex justify-between text-xs text-gray-400">
                  <span>{a.borradores} borrador{a.borradores !== 1 ? 'es' : ''}</span>
                  <span>{a.porcentaje}% completo</span>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Vista: por semana */}
        {!loading && tab === 'semanas' && (
          <div className="space-y-2">
            {weekStats.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-6">Sin datos en las últimas 4 semanas</p>
            )}
            {weekStats.map((w) => (
              <Card key={w.label}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-sm font-medium text-gray-900">{w.label}</p>
                  <span className="text-xs text-gray-500">{w.total} registro{w.total !== 1 ? 's' : ''}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full bg-green-500"
                    style={{ width: w.total > 0 ? `${Math.round((w.completos / w.total) * 100)}%` : '0%' }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-xs text-gray-400">
                  <span>{w.completos} completo{w.completos !== 1 ? 's' : ''}</span>
                  <span>{w.total > 0 ? Math.round((w.completos / w.total) * 100) : 0}%</span>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Accesos rápidos */}
        <div>
          <h2 className="mb-2 text-sm font-semibold text-gray-500 uppercase tracking-wide">Administrar</h2>
          <div className="grid grid-cols-3 gap-2">
            {LINKS.map(({ to, icon, label }) => (
              <Link
                key={to}
                to={to}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-200 bg-white py-4 text-center shadow-sm hover:shadow-md transition-shadow"
              >
                <span className="text-2xl">{icon}</span>
                <span className="text-xs font-medium text-gray-700">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
