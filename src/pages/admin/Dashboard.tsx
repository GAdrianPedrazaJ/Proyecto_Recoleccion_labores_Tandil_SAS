import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/useAuthStore'
import { fetchDashboardFormularios } from '../../services/api'
import { syncPendientes } from '../../services/sync'
import { countNoSincronizados, getAllAreas } from '../../services/db'
import { useSyncProgress } from '../../hooks/useSyncProgress'
import type { Area } from '../../types'
import type { DashboardFormulario } from '../../services/api'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import DashboardWithRecharts from './DashboardRecharts'

function getISOWeek(dateStr: string): number {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const jan4 = new Date(d.getFullYear(), 0, 4)
  return 1 + Math.round(((d.getTime() - jan4.getTime()) / 86400000 - 3 + ((jan4.getDay() + 6) % 7)) / 7)
}

function getWeekLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return `Sem ${getISOWeek(dateStr)} (${d.getFullYear()})`
}

function daysAgoIso(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}

interface AreaStats { areaId: string; nombre: string; total: number; completos: number; borradores: number; porcentaje: number }
interface WeekStats { label: string; total: number; completos: number }

export default function AdminDashboard() {
  const usuario = useAuthStore((s) => s.usuario)
  const { syncWithProgress } = useSyncProgress()
  const [areas, setAreas] = useState<Area[]>([])
  const [formularios, setFormularios] = useState<DashboardFormulario[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'areas' | 'semanas'>('areas')
  const [useRecharts, setUseRecharts] = useState(false)

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
    await syncWithProgress(async () => {
      await syncPendientes()
      await load()
    })
  }

  // Si hay muchos datos, mostrar dashboard nuevo con Recharts
  const hasEnoughData = formularios.length > 5
  if (hasEnoughData && useRecharts) {
    return <DashboardWithRecharts />
  }

  const todayStr = new Date().toISOString().split('T')[0]
  const currentWeek = getISOWeek(todayStr)
  const thisWeek = formularios.filter((f) => getISOWeek(f.fecha) === currentWeek)
  const thisWeekCompletos = thisWeek.filter((f) => f.estado === 'completo').length

  const areaStats: AreaStats[] = areas
    .map((a) => {
      const aForms = thisWeek.filter((f) => f.areaId === a.id)
      const completos = aForms.filter((f) => f.estado === 'completo').length
      const borradores = aForms.filter((f) => f.estado === 'borrador').length
      const total = aForms.length
      return { areaId: a.id, nombre: a.nombre, total, completos, borradores, porcentaje: total > 0 ? Math.round((completos / total) * 100) : 0 }
    })
    .sort((a, b) => b.completos - a.completos || b.total - a.total)

  const weekMap = new Map<string, WeekStats>()
  formularios.forEach((f) => {
    const label = getWeekLabel(f.fecha)
    if (!weekMap.has(label)) weekMap.set(label, { label, total: 0, completos: 0 })
    const w = weekMap.get(label)!
    w.total++
    if (f.estado === 'completo') w.completos++
  })
  const weekStats = Array.from(weekMap.values()).slice(0, 6)
  const areaMasAdelantada = areaStats.find((a) => a.completos > 0)
  const areasConLaboresBajos = areaStats.filter((a) => a.total === 0).slice(0, 8)

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Bienvenido/a, {usuario?.nombre} · {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {hasEnoughData && (
            <Button variant={useRecharts ? 'primary' : 'secondary'} onClick={() => setUseRecharts(!useRecharts)}>
              {useRecharts ? 'Ver Dashboard Simple' : 'Ver Dashboard Analítico'}
            </Button>
          )}
          {pendingCount > 0 && (
            <Button variant="secondary" loading={false} onClick={handleSync}>
              Sincronizar {pendingCount}
            </Button>
          )}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Esta semana</p>
          <p className="text-4xl font-bold text-gray-900 mt-2">{thisWeek.length}</p>
          <p className="text-xs text-gray-500 mt-1">registros totales</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-xs font-semibold text-green-500 uppercase tracking-wide">Completos</p>
          <p className="text-4xl font-bold text-green-600 mt-2">{thisWeekCompletos}</p>
          <p className="text-xs text-gray-500 mt-1">esta semana</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-xs font-semibold text-yellow-500 uppercase tracking-wide">Borradores</p>
          <p className="text-4xl font-bold text-yellow-600 mt-2">{thisWeek.length - thisWeekCompletos}</p>
          <p className="text-xs text-gray-500 mt-1">en progreso</p>
        </div>
        <div className={`rounded-xl border shadow-sm p-5 ${pendingCount > 0 ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200'}`}>
          <p className={`text-xs font-semibold uppercase tracking-wide ${pendingCount > 0 ? 'text-orange-500' : 'text-gray-400'}`}>Sin sync</p>
          <p className={`text-4xl font-bold mt-2 ${pendingCount > 0 ? 'text-orange-600' : 'text-gray-400'}`}>{pendingCount}</p>
          <p className="text-xs text-gray-500 mt-1">pendientes</p>
        </div>
      </div>

      {/* Destacados */}
      {!loading && (areaMasAdelantada || areasConLaboresBajos.length > 0) && (
        <div className="grid grid-cols-2 gap-4 mb-8">
          {areaMasAdelantada && (
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-green-100">Mayor avance esta semana</p>
              <p className="text-xl font-bold mt-2">{areaMasAdelantada.nombre}</p>
              <p className="text-sm text-green-100 mt-1">{areaMasAdelantada.completos} completo{areaMasAdelantada.completos !== 1 ? 's' : ''} · {areaMasAdelantada.porcentaje}%</p>
              <div className="mt-3 h-1.5 bg-green-400/40 rounded-full">
                <div className="h-1.5 bg-white rounded-full" style={{ width: `${areaMasAdelantada.porcentaje}%` }} />
              </div>
            </div>
          )}
          {areasConLaboresBajos.length > 0 && (
            <div className="bg-white rounded-xl border border-orange-200 p-5 shadow-sm">
              <p className="text-xs font-semibold text-orange-500 uppercase tracking-wide">Áreas sin registros esta semana</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {areasConLaboresBajos.map((a) => (
                  <span key={a.areaId} className="inline-block rounded-full bg-orange-50 px-2.5 py-0.5 text-xs text-orange-700 border border-orange-200">{a.nombre}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabla de avance */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="border-b border-gray-100 px-5 flex gap-1 pt-2">
          {(['areas', 'semanas'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {t === 'areas' ? 'Por área (esta semana)' : 'Por semana (últimas 6)'}
            </button>
          ))}
        </div>
        <div className="p-5">
          {loading && <div className="flex justify-center py-10"><Spinner /></div>}
          {!loading && tab === 'areas' && (
            <div className="space-y-3">
              {areaStats.filter((a) => a.total > 0).length === 0 && (
                <p className="text-center text-sm text-gray-400 py-10">Sin registros esta semana</p>
              )}
              {areaStats.filter((a) => a.total > 0).map((a) => (
                <div key={a.areaId} className="flex items-center gap-4">
                  <div className="w-40 flex-shrink-0"><p className="text-sm font-medium text-gray-900 truncate">{a.nombre}</p></div>
                  <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-5 rounded-full transition-all ${a.porcentaje >= 80 ? 'bg-green-500' : a.porcentaje >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`} style={{ width: `${a.porcentaje}%` }} />
                  </div>
                  <div className="w-32 flex-shrink-0 text-right">
                    <span className={`text-sm font-bold ${a.porcentaje >= 80 ? 'text-green-600' : a.porcentaje >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>{a.porcentaje}%</span>
                    <span className="text-xs text-gray-400 ml-2">{a.completos}/{a.total}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loading && tab === 'semanas' && (
            <div className="space-y-3">
              {weekStats.length === 0 && <p className="text-center text-sm text-gray-400 py-10">Sin datos</p>}
              {weekStats.map((w) => {
                const pct = w.total > 0 ? Math.round((w.completos / w.total) * 100) : 0
                return (
                  <div key={w.label} className="flex items-center gap-4">
                    <div className="w-40 flex-shrink-0"><p className="text-sm font-medium text-gray-900">{w.label}</p></div>
                    <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-5 rounded-full ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="w-32 flex-shrink-0 text-right">
                      <span className="text-sm font-bold text-gray-700">{pct}%</span>
                      <span className="text-xs text-gray-400 ml-2">{w.total} reg.</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}