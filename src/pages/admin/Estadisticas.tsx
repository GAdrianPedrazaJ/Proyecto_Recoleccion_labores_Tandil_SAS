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
import { AdminLayout } from '../../components/layout/AdminLayout'
import { Spinner } from '../../components/ui/Spinner'

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899']

function daysAgoIso(days: number): string {
  const d = new Date(); d.setDate(d.getDate() - days); return d.toISOString().split('T')[0]
}
function getISOWeek(dateStr: string): number {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const jan4 = new Date(d.getFullYear(), 0, 4)
  return 1 + Math.round(((d.getTime() - jan4.getTime()) / 86400000 - 3 + ((jan4.getDay() + 6) % 7)) / 7)
}
function weekKey(dateStr: string): string { return `S${getISOWeek(dateStr)}` }

type Rango = '7d' | '14d' | '28d'

export default function AdminEstadisticas() {
  const [formularios, setFormularios] = useState<DashboardFormulario[]>([])
  const [laborStats, setLaborStats] = useState<LaborStatRow[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [labores, setLabores] = useState<LaborCatalog[]>([])
  const [loading, setLoading] = useState(true)
  const [rango, setRango] = useState<Rango>('28d')
  const [areaFiltro, setAreaFiltro] = useState<string>('')
  const [tab, setTab] = useState<'registros' | 'labores' | 'areas'>('registros')
  const [laborLinea, setLaborLinea] = useState<string>('')

  const dias = rango === '7d' ? 7 : rango === '14d' ? 14 : 28
  const desde = useMemo(() => daysAgoIso(dias), [dias])

  const load = async () => {
    setLoading(true)
    const [forms, stats, areasData, laboresData] = await Promise.all([
      fetchDashboardFormularios(desde).catch(() => [] as DashboardFormulario[]),
      fetchLaborStats(desde).catch(() => [] as LaborStatRow[]),
      getAllAreas(), getAllLabores(),
    ])
    setFormularios(forms); setLaborStats(stats); setAreas(areasData); setLabores(laboresData)
    setLoading(false)
  }
  useEffect(() => { load() }, [desde])

  const getAreaNombre = (id: string) => areas.find((a) => a.id === id)?.nombre ?? id
  const getLaborNombre = (id: string) => labores.find((l) => l.id === id)?.nombre ?? id

  const formsFiltrados = areaFiltro ? formularios.filter((f) => f.areaId === areaFiltro) : formularios
  const statsFiltradas = areaFiltro ? laborStats.filter((s) => s.areaId === areaFiltro) : laborStats

  const registrosPorSemana = useMemo(() => {
    const map = new Map<string, { semana: string; completos: number; borradores: number }>()
    formsFiltrados.forEach((f) => {
      const key = weekKey(f.fecha)
      if (!map.has(key)) map.set(key, { semana: key, completos: 0, borradores: 0 })
      const e = map.get(key)!
      if (f.estado === 'completo') e.completos++; else e.borradores++
    })
    return Array.from(map.values()).reverse()
  }, [formsFiltrados])

  const registrosPorArea = useMemo(() => {
    const map = new Map<string, { area: string; completos: number; borradores: number }>()
    formsFiltrados.forEach((f) => {
      if (!map.has(f.areaId)) map.set(f.areaId, { area: getAreaNombre(f.areaId), completos: 0, borradores: 0 })
      const e = map.get(f.areaId)!
      if (f.estado === 'completo') e.completos++; else e.borradores++
    })
    return Array.from(map.values()).sort((a, b) => b.completos - a.completos)
  }, [formsFiltrados, areas])

  const laborResumen = useMemo(() => {
    const map = new Map<string, { laborId: string; nombre: string; camasEst: number; camasReal: number; pctSum: number; count: number }>()
    statsFiltradas.forEach((s) => {
      if (!map.has(s.laborId)) map.set(s.laborId, { laborId: s.laborId, nombre: getLaborNombre(s.laborId), camasEst: 0, camasReal: 0, pctSum: 0, count: 0 })
      const e = map.get(s.laborId)!
      e.camasEst += s.camasEstimadas; e.camasReal += s.camasReales; e.pctSum += s.rendimientoPct; e.count++
    })
    return Array.from(map.values()).map((e) => ({ ...e, pctPromedio: e.count > 0 ? Math.round(e.pctSum / e.count) : 0 })).sort((a, b) => b.camasEst - a.camasEst)
  }, [statsFiltradas, labores])

  const laborMasAdelantada = [...laborResumen].sort((a, b) => b.pctPromedio - a.pctPromedio)[0]
  const laborMasAtrasada = [...laborResumen].sort((a, b) => a.pctPromedio - b.pctPromedio)[0]
  const laborMenosHecha = [...laborResumen].sort((a, b) => a.camasReal - b.camasReal)[0]

  const rendimientoSemanal = useMemo(() => {
    const filteredId = laborLinea || laborResumen[0]?.laborId
    if (!filteredId) return []
    const map = new Map<string, { semana: string; pct: number; count: number }>()
    statsFiltradas.filter((s) => s.laborId === filteredId).forEach((s) => {
      const key = weekKey(s.fecha)
      if (!map.has(key)) map.set(key, { semana: key, pct: 0, count: 0 })
      const e = map.get(key)!; e.pct += s.rendimientoPct; e.count++
    })
    return Array.from(map.values()).map((e) => ({ semana: e.semana, rendimiento: e.count > 0 ? Math.round(e.pct / e.count) : 0 })).reverse()
  }, [statsFiltradas, laborLinea, laborResumen])

  const areaPorRendimiento = useMemo(() => {
    const map = new Map<string, { area: string; pctSum: number; count: number; camasEst: number; camasReal: number }>()
    laborStats.forEach((s) => {
      if (!map.has(s.areaId)) map.set(s.areaId, { area: getAreaNombre(s.areaId), pctSum: 0, count: 0, camasEst: 0, camasReal: 0 })
      const e = map.get(s.areaId)!
      e.pctSum += s.rendimientoPct; e.count++; e.camasEst += s.camasEstimadas; e.camasReal += s.camasReales
    })
    return Array.from(map.values()).map((e) => ({ area: e.area, rendimiento: e.count > 0 ? Math.round(e.pctSum / e.count) : 0, camasEstimadas: e.camasEst, camasReales: e.camasReal })).sort((a, b) => b.rendimiento - a.rendimiento)
  }, [laborStats, areas])

  const TAB_LABELS = [['registros', 'Registros'], ['labores', 'Labores'], ['areas', 'Por área']] as [typeof tab, string][]

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Estadísticas</h1>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 rounded-lg bg-gray-200 p-1 text-xs">
            {(['7d', '14d', '28d'] as Rango[]).map((r) => (
              <button key={r} onClick={() => setRango(r)} className={`rounded-md px-3 py-1.5 font-medium transition-colors ${rango === r ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
                {r === '7d' ? '7 días' : r === '14d' ? '14 días' : '28 días'}
              </button>
            ))}
          </div>
          <select value={areaFiltro} onChange={(e) => setAreaFiltro(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-green-500 focus:outline-none">
            <option value="">Todas las áreas</option>
            {areas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-gray-200 p-1 mb-6 w-fit">
        {TAB_LABELS.map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
            {label}
          </button>
        ))}
      </div>

      {loading && <div className="flex justify-center py-20"><Spinner /></div>}

      {/* ── Registros ── */}
      {!loading && tab === 'registros' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <p className="text-sm font-semibold text-gray-700 mb-4">Registros por semana</p>
            {registrosPorSemana.length === 0 ? <p className="text-center text-sm text-gray-400 py-8">Sin datos</p> : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={registrosPorSemana} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="semana" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="completos" stroke="#22c55e" strokeWidth={2} dot={{ r: 5 }} name="Completos" />
                  <Line type="monotone" dataKey="borradores" stroke="#f59e0b" strokeWidth={2} dot={{ r: 5 }} name="Borradores" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <p className="text-sm font-semibold text-gray-700 mb-4">Registros por área</p>
            {registrosPorArea.length === 0 ? <p className="text-center text-sm text-gray-400 py-8">Sin datos</p> : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={registrosPorArea} margin={{ top: 5, right: 10, left: -15, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="area" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip /><Legend />
                  <Bar dataKey="completos" fill="#22c55e" name="Completos" radius={[4,4,0,0]} />
                  <Bar dataKey="borradores" fill="#f59e0b" name="Borradores" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* ── Labores ── */}
      {!loading && tab === 'labores' && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Más adelantada', color: 'green', item: laborMasAdelantada, val: `${laborMasAdelantada?.pctPromedio ?? 0}%` },
              { label: 'Más atrasada', color: 'red', item: laborMasAtrasada, val: `${laborMasAtrasada?.pctPromedio ?? 0}%` },
              { label: 'Menos camas', color: 'orange', item: laborMenosHecha, val: `${laborMenosHecha?.camasReal ?? 0} camas` },
            ].map(({ label, color, item, val }) => (
              <div key={label} className={`bg-white rounded-xl border shadow-sm p-5 border-${color}-200`}>
                <p className={`text-xs font-semibold uppercase tracking-wide text-${color}-600`}>{label}</p>
                <p className="text-lg font-bold text-gray-900 mt-2 truncate">{item?.nombre ?? '—'}</p>
                <p className="text-sm text-gray-500 mt-0.5">{val}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <p className="text-sm font-semibold text-gray-700 mb-4">Camas estimadas vs reales</p>
              {laborResumen.length === 0 ? <p className="text-center text-sm text-gray-400 py-8">Sin datos</p> : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={laborResumen} margin={{ top: 5, right: 10, left: -15, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="nombre" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" />
                    <YAxis tick={{ fontSize: 12 }} /><Tooltip /><Legend />
                    <Bar dataKey="camasEst" fill="#3b82f6" name="Estimadas" radius={[4,4,0,0]} />
                    <Bar dataKey="camasReal" fill="#22c55e" name="Reales" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <p className="text-sm font-semibold text-gray-700 mb-4">Rendimiento % por labor</p>
              {laborResumen.length === 0 ? <p className="text-center text-sm text-gray-400 py-8">Sin datos</p> : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={laborResumen} margin={{ top: 5, right: 10, left: -15, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="nombre" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" />
                    <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} unit="%" />
                    <Tooltip formatter={(v) => `${v}%`} />
                    <Bar dataKey="pctPromedio" name="Rendimiento" radius={[4,4,0,0]}>
                      {laborResumen.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-700">Tendencia semanal de labor</p>
              <select value={laborLinea || laborResumen[0]?.laborId || ''} onChange={(e) => setLaborLinea(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-green-500 focus:outline-none">
                {laborResumen.map((l) => <option key={l.laborId} value={l.laborId}>{l.nombre}</option>)}
              </select>
            </div>
            {rendimientoSemanal.length === 0 ? <p className="text-center text-sm text-gray-400 py-8">Sin datos</p> : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={rendimientoSemanal} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="semana" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} unit="%" />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Line type="monotone" dataKey="rendimiento" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 5 }} name="Rendimiento %" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* ── Por área ── */}
      {!loading && tab === 'areas' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <p className="text-sm font-semibold text-gray-700 mb-4">Rendimiento promedio por área (%)</p>
              {areaPorRendimiento.length === 0 ? <p className="text-center text-sm text-gray-400 py-8">Sin datos</p> : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={areaPorRendimiento} margin={{ top: 5, right: 10, left: -15, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="area" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" />
                    <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} unit="%" />
                    <Tooltip formatter={(v) => `${v}%`} />
                    <Bar dataKey="rendimiento" name="Rendimiento %" radius={[4,4,0,0]}>
                      {areaPorRendimiento.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <p className="text-sm font-semibold text-gray-700 mb-4">Camas por área</p>
              {areaPorRendimiento.length === 0 ? <p className="text-center text-sm text-gray-400 py-8">Sin datos</p> : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={areaPorRendimiento} margin={{ top: 5, right: 10, left: -15, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="area" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" />
                    <YAxis tick={{ fontSize: 12 }} /><Tooltip /><Legend />
                    <Bar dataKey="camasEstimadas" fill="#3b82f6" name="Estimadas" radius={[4,4,0,0]} />
                    <Bar dataKey="camasReales" fill="#22c55e" name="Reales" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-700">Ranking de áreas por rendimiento</p>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 font-semibold text-gray-600">#</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Área</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Progreso</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">Rendimiento</th>
              </tr></thead>
              <tbody>
                {areaPorRendimiento.map((a, i) => (
                  <tr key={a.area} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}`}>
                    <td className="px-5 py-3"><span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? 'bg-green-100 text-green-700' : i === areaPorRendimiento.length - 1 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>{i + 1}</span></td>
                    <td className="px-5 py-3 font-medium text-gray-900">{a.area}</td>
                    <td className="px-5 py-3 w-64"><div className="h-2 w-full rounded-full bg-gray-100"><div className="h-2 rounded-full bg-green-500" style={{ width: `${a.rendimiento}%` }} /></div></td>
                    <td className="px-5 py-3 text-right font-bold text-gray-700">{a.rendimiento}%</td>
                  </tr>
                ))}
                {areaPorRendimiento.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-gray-400">Sin datos</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

