import { useEffect, useMemo, useState } from 'react'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell,
} from 'recharts'
import { fetchDashboardFormularios, fetchLaborStats } from '../../services/api'
import type { DashboardFormulario, LaborStatRow } from '../../services/api'
import { getAllAreas, getAllLabores } from '../../services/db'
import type { Area, LaborCatalog } from '../../types'
import { Header } from '../../components/layout/Header'
import { BottomNav } from '../../components/layout/BottomNav'
import { Card } from '../../components/ui/Card'
import { Spinner } from '../../components/ui/Spinner'

// ─── helpers ──────────────────────────────────────────────────────────────────

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899']

function daysAgoIso(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}

function getISOWeek(dateStr: string): number {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const jan4 = new Date(d.getFullYear(), 0, 4)
  return 1 + Math.round(((d.getTime() - jan4.getTime()) / 86400000 - 3 + ((jan4.getDay() + 6) % 7)) / 7)
}

function weekKey(dateStr: string): string {
  return `S${getISOWeek(dateStr)}`
}

// ─── tipos locales ────────────────────────────────────────────────────────────

type Rango = '7d' | '14d' | '28d'

// ─── componente ───────────────────────────────────────────────────────────────

export default function AdminEstadisticas() {
  const [formularios, setFormularios] = useState<DashboardFormulario[]>([])
  const [laborStats, setLaborStats] = useState<LaborStatRow[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [labores, setLabores] = useState<LaborCatalog[]>([])
  const [loading, setLoading] = useState(true)
  const [rango, setRango] = useState<Rango>('28d')
  const [areaFiltro, setAreaFiltro] = useState<string>('')
  const [tab, setTab] = useState<'registros' | 'labores' | 'areas'>('registros')

  const dias = rango === '7d' ? 7 : rango === '14d' ? 14 : 28
  const desde = useMemo(() => daysAgoIso(dias), [dias])

  const load = async () => {
    setLoading(true)
    const [forms, stats, areasData, laboresData] = await Promise.all([
      fetchDashboardFormularios(desde).catch(() => [] as DashboardFormulario[]),
      fetchLaborStats(desde).catch(() => [] as LaborStatRow[]),
      getAllAreas(),
      getAllLabores(),
    ])
    setFormularios(forms)
    setLaborStats(stats)
    setAreas(areasData)
    setLabores(laboresData)
    setLoading(false)
  }

  useEffect(() => { load() }, [desde])

  const getAreaNombre = (id: string) => areas.find((a) => a.id === id)?.nombre ?? id
  const getLaborNombre = (id: string) => labores.find((l) => l.id === id)?.nombre ?? id

  // ── Filtrar por área ─────────────────────────────────────────────────────────
  const formsFiltrados = areaFiltro ? formularios.filter((f) => f.areaId === areaFiltro) : formularios
  const statsFiltradas = areaFiltro ? laborStats.filter((s) => s.areaId === areaFiltro) : laborStats

  // ═══════════════════════════════════════════════════════════════════════
  // TAB 1: Registros por semana — línea (completos vs borradores)
  // ═══════════════════════════════════════════════════════════════════════
  const registrosPorSemana = useMemo(() => {
    const map = new Map<string, { semana: string; completos: number; borradores: number }>()
    formsFiltrados.forEach((f) => {
      const key = weekKey(f.fecha)
      if (!map.has(key)) map.set(key, { semana: key, completos: 0, borradores: 0 })
      const e = map.get(key)!
      if (f.estado === 'completo') e.completos++
      else e.borradores++
    })
    return Array.from(map.values()).reverse()
  }, [formsFiltrados])

  // Registros por área — barra comparativa
  const registrosPorArea = useMemo(() => {
    const map = new Map<string, { area: string; completos: number; borradores: number }>()
    formsFiltrados.forEach((f) => {
      const key = f.areaId
      if (!map.has(key)) map.set(key, { area: getAreaNombre(f.areaId), completos: 0, borradores: 0 })
      const e = map.get(key)!
      if (f.estado === 'completo') e.completos++
      else e.borradores++
    })
    return Array.from(map.values()).sort((a, b) => b.completos - a.completos)
  }, [formsFiltrados, areas])

  // ═══════════════════════════════════════════════════════════════════════
  // TAB 2: Labores — camas estimadas vs reales por labor (barra)
  //         Rendimiento % por labor (barra única)
  //         Ranking: más adelantada / más atrasada
  // ═══════════════════════════════════════════════════════════════════════
  const laborResumen = useMemo(() => {
    const map = new Map<string, { laborId: string; nombre: string; camasEst: number; camasReal: number; pctSum: number; count: number }>()
    statsFiltradas.forEach((s) => {
      if (!map.has(s.laborId)) map.set(s.laborId, { laborId: s.laborId, nombre: getLaborNombre(s.laborId), camasEst: 0, camasReal: 0, pctSum: 0, count: 0 })
      const e = map.get(s.laborId)!
      e.camasEst += s.camasEstimadas
      e.camasReal += s.camasReales
      e.pctSum += s.rendimientoPct
      e.count++
    })
    return Array.from(map.values()).map((e) => ({
      ...e,
      pctPromedio: e.count > 0 ? Math.round(e.pctSum / e.count) : 0,
    })).sort((a, b) => b.camasEst - a.camasEst)
  }, [statsFiltradas, labores])

  const laborMasAdelantada = [...laborResumen].sort((a, b) => b.pctPromedio - a.pctPromedio)[0]
  const laborMasAtrasada = [...laborResumen].sort((a, b) => a.pctPromedio - b.pctPromedio)[0]
  const laborMenosHecha = [...laborResumen].sort((a, b) => a.camasReal - b.camasReal)[0]

  // Rendimiento por semana para la labor seleccionada (línea)
  const [laborLinea, setLaborLinea] = useState<string>('')
  const rendimientoSemanal = useMemo(() => {
    const filteredId = laborLinea || laborResumen[0]?.laborId
    if (!filteredId) return []
    const map = new Map<string, { semana: string; pct: number; count: number }>()
    statsFiltradas.filter((s) => s.laborId === filteredId).forEach((s) => {
      const key = weekKey(s.fecha)
      if (!map.has(key)) map.set(key, { semana: key, pct: 0, count: 0 })
      const e = map.get(key)!
      e.pct += s.rendimientoPct
      e.count++
    })
    return Array.from(map.values()).map((e) => ({ semana: e.semana, rendimiento: e.count > 0 ? Math.round(e.pct / e.count) : 0 })).reverse()
  }, [statsFiltradas, laborLinea, laborResumen])

  // ═══════════════════════════════════════════════════════════════════════
  // TAB 3: Por área — rendimiento promedio de labores (barra comparativa por área)
  // ═══════════════════════════════════════════════════════════════════════
  const areaPorRendimiento = useMemo(() => {
    const map = new Map<string, { area: string; pctSum: number; count: number; camasEst: number; camasReal: number }>()
    laborStats.forEach((s) => {
      const key = s.areaId
      if (!map.has(key)) map.set(key, { area: getAreaNombre(s.areaId), pctSum: 0, count: 0, camasEst: 0, camasReal: 0 })
      const e = map.get(key)!
      e.pctSum += s.rendimientoPct
      e.count++
      e.camasEst += s.camasEstimadas
      e.camasReal += s.camasReales
    })
    return Array.from(map.values()).map((e) => ({
      area: e.area,
      rendimiento: e.count > 0 ? Math.round(e.pctSum / e.count) : 0,
      camasEstimadas: e.camasEst,
      camasReales: e.camasReal,
    })).sort((a, b) => b.rendimiento - a.rendimiento)
  }, [laborStats, areas])

  // ─── render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header title="Estadísticas" showBack />

      <main className="flex-1 px-4 py-6 pb-24 space-y-4">
        <h1 className="text-xl font-bold text-gray-900">Estadísticas</h1>

        {/* Controles */}
        <div className="flex flex-wrap gap-2">
          {/* Rango */}
          <div className="flex gap-1 rounded-lg bg-gray-200 p-1 text-xs">
            {(['7d', '14d', '28d'] as Rango[]).map((r) => (
              <button
                key={r}
                onClick={() => setRango(r)}
                className={`rounded-md px-3 py-1.5 font-medium transition-colors ${rango === r ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                {r === '7d' ? '7 días' : r === '14d' ? '14 días' : '28 días'}
              </button>
            ))}
          </div>

          {/* Filtro área */}
          <select
            value={areaFiltro}
            onChange={(e) => setAreaFiltro(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="">Todas las áreas</option>
            {areas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-lg bg-gray-200 p-1">
          {([['registros', 'Registros'], ['labores', 'Labores'], ['areas', 'Por área']] as [typeof tab, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading && <div className="flex justify-center py-10"><Spinner /></div>}

        {/* ── TAB: Registros ── */}
        {!loading && tab === 'registros' && (
          <div className="space-y-5">
            {/* Línea: completos vs borradores por semana */}
            <Card>
              <p className="mb-3 text-sm font-semibold text-gray-700">Registros por semana</p>
              {registrosPorSemana.length === 0 ? (
                <p className="text-center text-xs text-gray-400 py-4">Sin datos</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={registrosPorSemana} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="semana" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="completos" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} name="Completos" />
                    <Line type="monotone" dataKey="borradores" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} name="Borradores" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* Barra: completos vs borradores por área */}
            <Card>
              <p className="mb-3 text-sm font-semibold text-gray-700">Registros por área (comparativa)</p>
              {registrosPorArea.length === 0 ? (
                <p className="text-center text-xs text-gray-400 py-4">Sin datos</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={registrosPorArea} margin={{ top: 5, right: 5, left: -20, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="area" tick={{ fontSize: 9 }} angle={-35} textAnchor="end" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="completos" fill="#22c55e" name="Completos" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="borradores" fill="#f59e0b" name="Borradores" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>
        )}

        {/* ── TAB: Labores ── */}
        {!loading && tab === 'labores' && (
          <div className="space-y-5">
            {/* Tarjetas ranking */}
            <div className="grid grid-cols-3 gap-2">
              <Card>
                <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Mas adelante</p>
                <p className="mt-1 text-sm font-bold text-gray-900 truncate">{laborMasAdelantada?.nombre ?? '—'}</p>
                <p className="text-xs text-gray-500">{laborMasAdelantada?.pctPromedio ?? 0}% rendimiento</p>
              </Card>
              <Card>
                <p className="text-xs font-semibold text-red-500 uppercase tracking-wide">Mas atrasada</p>
                <p className="mt-1 text-sm font-bold text-gray-900 truncate">{laborMasAtrasada?.nombre ?? '—'}</p>
                <p className="text-xs text-gray-500">{laborMasAtrasada?.pctPromedio ?? 0}% rendimiento</p>
              </Card>
              <Card>
                <p className="text-xs font-semibold text-orange-500 uppercase tracking-wide">Menos hecha</p>
                <p className="mt-1 text-sm font-bold text-gray-900 truncate">{laborMenosHecha?.nombre ?? '—'}</p>
                <p className="text-xs text-gray-500">{laborMenosHecha?.camasReal ?? 0} camas reales</p>
              </Card>
            </div>

            {/* Barra: camas estimadas vs reales por labor */}
            <Card>
              <p className="mb-3 text-sm font-semibold text-gray-700">Camas estimadas vs reales por labor</p>
              {laborResumen.length === 0 ? (
                <p className="text-center text-xs text-gray-400 py-4">Sin datos de labores</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={laborResumen} margin={{ top: 5, right: 5, left: -20, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="nombre" tick={{ fontSize: 9 }} angle={-40} textAnchor="end" />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="camasEst" fill="#3b82f6" name="Estimadas" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="camasReal" fill="#22c55e" name="Reales" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* Barra: rendimiento % por labor */}
            <Card>
              <p className="mb-3 text-sm font-semibold text-gray-700">Rendimiento promedio por labor (%)</p>
              {laborResumen.length === 0 ? (
                <p className="text-center text-xs text-gray-400 py-4">Sin datos de labores</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={laborResumen} margin={{ top: 5, right: 5, left: -20, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="nombre" tick={{ fontSize: 9 }} angle={-40} textAnchor="end" />
                    <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                    <Tooltip formatter={(v) => `${v}%`} />
                    <Bar dataKey="pctPromedio" name="Rendimiento" radius={[4, 4, 0, 0]}>
                      {laborResumen.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* Línea: rendimiento por semana de una labor */}
            <Card>
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-gray-700">Tendencia semanal de labor</p>
                <select
                  value={laborLinea || laborResumen[0]?.laborId || ''}
                  onChange={(e) => setLaborLinea(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs focus:border-green-500 focus:outline-none"
                >
                  {laborResumen.map((l) => (
                    <option key={l.laborId} value={l.laborId}>{l.nombre}</option>
                  ))}
                </select>
              </div>
              {rendimientoSemanal.length === 0 ? (
                <p className="text-center text-xs text-gray-400 py-4">Sin datos para esta labor</p>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={rendimientoSemanal} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="semana" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                    <Tooltip formatter={(v) => `${v}%`} />
                    <Line type="monotone" dataKey="rendimiento" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} name="Rendimiento %" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>
        )}

        {/* ── TAB: Por área ── */}
        {!loading && tab === 'areas' && (
          <div className="space-y-5">
            {/* Barra: rendimiento promedio por área */}
            <Card>
              <p className="mb-3 text-sm font-semibold text-gray-700">Rendimiento promedio por área (%)</p>
              {areaPorRendimiento.length === 0 ? (
                <p className="text-center text-xs text-gray-400 py-4">Sin datos</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={areaPorRendimiento} margin={{ top: 5, right: 5, left: -20, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="area" tick={{ fontSize: 9 }} angle={-40} textAnchor="end" />
                    <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                    <Tooltip formatter={(v) => `${v}%`} />
                    <Bar dataKey="rendimiento" name="Rendimiento %" radius={[4, 4, 0, 0]}>
                      {areaPorRendimiento.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* Barra comparativa: camas estimadas vs reales por área */}
            <Card>
              <p className="mb-3 text-sm font-semibold text-gray-700">Camas estimadas vs reales por área</p>
              {areaPorRendimiento.length === 0 ? (
                <p className="text-center text-xs text-gray-400 py-4">Sin datos</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={areaPorRendimiento} margin={{ top: 5, right: 5, left: -20, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="area" tick={{ fontSize: 9 }} angle={-40} textAnchor="end" />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="camasEstimadas" fill="#3b82f6" name="Estimadas" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="camasReales" fill="#22c55e" name="Reales" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* Lista ranking por rendimiento */}
            <Card>
              <p className="mb-3 text-sm font-semibold text-gray-700">Ranking áreas por rendimiento</p>
              <div className="space-y-2">
                {areaPorRendimiento.map((a, i) => (
                  <div key={a.area} className="flex items-center gap-3">
                    <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? 'bg-green-100 text-green-700' : i === areaPorRendimiento.length - 1 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{a.area}</p>
                      <div className="h-1.5 w-full rounded-full bg-gray-100 mt-1">
                        <div className="h-1.5 rounded-full bg-green-500" style={{ width: `${a.rendimiento}%` }} />
                      </div>
                    </div>
                    <span className="text-sm font-bold text-gray-700 w-12 text-right">{a.rendimiento}%</span>
                  </div>
                ))}
                {areaPorRendimiento.length === 0 && (
                  <p className="text-center text-xs text-gray-400 py-4">Sin datos</p>
                )}
              </div>
            </Card>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
