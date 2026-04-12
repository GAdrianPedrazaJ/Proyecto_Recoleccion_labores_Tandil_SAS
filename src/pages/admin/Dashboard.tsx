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
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import {
  getCorteData, getLaboresData, getAseguramientoData,
  getStatsPorArea, getStatsPorColaborador, getKPIData,
  getLaborData, getCorteDetalleData, getAseguramientoDetalleData,
  type DashDataCorte, type DashDataLabores, type DashDataAseguramiento,
  type StatsPorArea, type StatsPorColaborador,
  type LaborDetalleData, type CorteDetalleData, type AseguramientoDetalleData
} from '../../services/dashboard'

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

const CHART_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6']

type DashSection = 'general' | 'corte' | 'labores' | 'aseguramiento' | 'colaboradores' | 'labores-detalle' | 'gestion'

interface AreaStats { areaId: string; nombre: string; total: number; completos: number; borradores: number; porcentaje: number }
interface WeekStats { label: string; total: number; completos: number }

const SECTIONS: { key: DashSection; label: string; icon: string }[] = [
  { key: 'general',        label: 'General',        icon: '📊' },
  { key: 'corte',          label: 'Corte',          icon: '✂️' },
  { key: 'labores',        label: 'Labores',        icon: '🌿' },
  { key: 'aseguramiento',  label: 'Aseguramiento',  icon: '✅' },
  { key: 'colaboradores',  label: 'Colaboradores',  icon: '👥' },
  { key: 'labores-detalle',label: 'Por Labor',      icon: '📈' },
  { key: 'gestion',        label: 'Gestión',        icon: '📋' },
]

// ─── Componente principal ─────────────────────────────────────────────────────

export default function AdminDashboard() {
  const usuario = useAuthStore((s) => s.usuario)
  const { syncWithProgress } = useSyncProgress()
  const [section, setSection] = useState<DashSection>('general')

  // Datos generales (IndexedDB)
  const [areas, setAreas] = useState<Area[]>([])
  const [formularios, setFormularios] = useState<DashboardFormulario[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loadingGeneral, setLoadingGeneral] = useState(true)
  const [tabGeneral, setTabGeneral] = useState<'areas' | 'semanas'>('areas')

  // Datos analíticos (Supabase)
  const [dias, setDias] = useState(28)
  const [corteData, setCorteData] = useState<DashDataCorte[]>([])
  const [laboresData, setLaboresData] = useState<DashDataLabores[]>([])
  const [asegData, setAsegData] = useState<DashDataAseguramiento[]>([])
  const [statsPorArea, setStatsPorArea] = useState<StatsPorArea[]>([])
  const [statsPorColab, setStatsPorColab] = useState<StatsPorColaborador[]>([])
  const [kpis, setKpis] = useState({ totalRegistros: 0, promRendimiento: 0, promCumplimiento: 0, totalHoras: 0 })
  const [loadingAnalitico, setLoadingAnalitico] = useState(false)
  const [errorAnalitico, setErrorAnalitico] = useState('')

  // Datos para labores-detalle y gestión (con filtros)
  const [selectedArea, setSelectedArea] = useState<string>('')
  const [selectedBloque, setSelectedBloque] = useState<string>('')
  const [selectedVariedad, setSelectedVariedad] = useState<string>('')
  const [laborDetalleData, setLaborDetalleData] = useState<LaborDetalleData[]>([])
  const [corteDetalleData, setCorteDetalleData] = useState<CorteDetalleData[]>([])
  const [asegDetalleData, setAsegDetalleData] = useState<AseguramientoDetalleData[]>([])
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [chartType, setChartType] = useState<'line' | 'bar'>('line')

  // Cargar datos generales
  const loadGeneral = async () => {
    setLoadingGeneral(true)
    const desde = daysAgoIso(28)
    const [forms, areasData, pending] = await Promise.all([
      fetchDashboardFormularios(desde).catch(() => [] as DashboardFormulario[]),
      getAllAreas(),
      countNoSincronizados(),
    ])
    setFormularios(forms)
    setAreas(areasData)
    setPendingCount(pending)
    setLoadingGeneral(false)
  }

  // Cargar datos analíticos (Supabase)
  const loadAnalitico = async () => {
    setLoadingAnalitico(true)
    setErrorAnalitico('')
    try {
      const desde = daysAgoIso(dias)
      const hasta = new Date().toISOString().split('T')[0]
      const [corte, labores, aseg, areasSt, colabSt, kpiData] = await Promise.all([
        getCorteData(desde, hasta),
        getLaboresData(desde, hasta),
        getAseguramientoData(desde, hasta),
        getStatsPorArea(desde),
        getStatsPorColaborador(desde),
        getKPIData(desde),
      ])
      setCorteData(corte)
      setLaboresData(labores)
      setAsegData(aseg)
      setStatsPorArea(areasSt)
      setStatsPorColab(colabSt)
      setKpis(kpiData)
    } catch (e) {
      setErrorAnalitico(e instanceof Error ? e.message : 'Error cargando datos analíticos')
    } finally {
      setLoadingAnalitico(false)
    }
  }

  // Cargar datos detallados por labor/corte/aseguramiento (con filtros)
  const loadDetalle = async () => {
    setLoadingDetalle(true)
    try {
      const desde = daysAgoIso(dias)
      const hasta = new Date().toISOString().split('T')[0]
      const [labor, corteD, asegD] = await Promise.all([
        getLaborData(desde, hasta, selectedArea || undefined, selectedBloque || undefined, selectedVariedad || undefined),
        getCorteDetalleData(desde, hasta, selectedArea || undefined, selectedBloque || undefined, selectedVariedad || undefined),
        getAseguramientoDetalleData(desde, hasta, selectedArea || undefined, selectedBloque || undefined, selectedVariedad || undefined),
      ])
      setLaborDetalleData(labor)
      setCorteDetalleData(corteD)
      setAsegDetalleData(asegD)
    } catch (e) {
      console.error('Error loading detalle data:', e)
    } finally {
      setLoadingDetalle(false)
    }
  }

  useEffect(() => { loadGeneral() }, [])
  useEffect(() => {
    if (section !== 'general' && section !== 'labores-detalle' && section !== 'gestion') loadAnalitico()
  }, [section, dias])
  useEffect(() => {
    if (section === 'labores-detalle' || section === 'gestion') loadDetalle()
  }, [section, dias, selectedArea, selectedBloque, selectedVariedad])

  const handleSync = async () => {
    await syncWithProgress(async () => {
      await syncPendientes()
      await loadGeneral()
    })
  }

  // ── Cálculos generales ──
  const todayStr = new Date().toISOString().split('T')[0]
  const currentWeek = getISOWeek(todayStr)
  const thisWeek = formularios.filter((f) => getISOWeek(f.fecha) === currentWeek)
  const thisWeekCompletos = thisWeek.filter((f) => f.estado === 'completo').length
  const areaStats: AreaStats[] = areas
    .map((a) => {
      const aForms = thisWeek.filter((f) => f.areaId === a.id)
      const completos = aForms.filter((f) => f.estado === 'completo').length
      const total = aForms.length
      return {
        areaId: a.id, nombre: a.nombre, total, completos,
        borradores: aForms.filter((f) => f.estado === 'borrador').length,
        porcentaje: total > 0 ? Math.round((completos / total) * 100) : 0,
      }
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
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Bienvenido/a, {usuario?.nombre} · {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            {pendingCount > 0 && (
              <Button variant="secondary" loading={false} onClick={handleSync}>
                Sincronizar ({pendingCount})
              </Button>
            )}
          </div>
        </div>

        {/* Sub-navbar de secciones */}
        <div className="bg-green-800 rounded-xl overflow-hidden">
          <div className="flex overflow-x-auto">
            {SECTIONS.map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setSection(key)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  section === key
                    ? 'bg-white text-green-800'
                    : 'text-green-200 hover:bg-green-700 hover:text-white'
                }`}
              >
                <span>{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── SECCIÓN GENERAL ── */}
        {section === 'general' && (
          <SectionGeneral
            loading={loadingGeneral}
            thisWeek={thisWeek}
            thisWeekCompletos={thisWeekCompletos}
            pendingCount={pendingCount}
            areaMasAdelantada={areaMasAdelantada}
            areasConLaboresBajos={areasConLaboresBajos}
            areaStats={areaStats}
            weekStats={weekStats}
            tab={tabGeneral}
            setTab={setTabGeneral}
          />
        )}

        {/* ── SECCIONES ANALÍTICAS ── */}
        {section !== 'general' && (
          <>
            {/* Selector de período */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-500 font-medium">Período:</span>
              {[7, 14, 28, 60].map((d) => (
                <button
                  key={d}
                  onClick={() => setDias(d)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    dias === d
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {d} días
                </button>
              ))}
              <button
                onClick={loadAnalitico}
                className="px-4 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                ↻ Actualizar
              </button>
            </div>

            {/* KPIs analíticos */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Registros',    val: kpis.totalRegistros,   color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200' },
                { label: 'Prom. Rendimiento',  val: `${kpis.promRendimiento}%`, color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200' },
                { label: 'Prom. Cumplimiento', val: `${kpis.promCumplimiento}%`, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
                { label: 'Total Horas',        val: kpis.totalHoras,      color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
              ].map(({ label, val, color, bg, border }) => (
                <div key={label} className={`rounded-xl border p-5 ${bg} ${border}`}>
                  <p className="text-xs text-gray-500 font-semibold uppercase">{label}</p>
                  <p className={`text-3xl font-bold mt-2 ${color}`}>{val}</p>
                </div>
              ))}
            </div>

            {errorAnalitico && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {errorAnalitico}
              </div>
            )}

            {loadingAnalitico ? (
              <div className="flex justify-center py-20"><Spinner size="lg" /></div>
            ) : (
              <>
                {section === 'corte'         && <SectionCorte   corteData={corteData} statsPorArea={statsPorArea} />}
                {section === 'labores'       && <SectionLabores laboresData={laboresData} statsPorArea={statsPorArea} />}
                {section === 'aseguramiento' && <SectionAseguramiento asegData={asegData} statsPorArea={statsPorArea} />}
                {section === 'colaboradores' && <SectionColaboradores statsPorColab={statsPorColab} />}
              </>
            )}

            {/* Secciones con filtros (labores-detalle y gestión) */}
            {(section === 'labores-detalle' || section === 'gestion') && (
              <>
                {/* Filtros */}
                <div className="space-y-4 bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-gray-500 font-medium">Período:</span>
                    {[7, 14, 28, 60].map((d) => (
                      <button
                        key={d}
                        onClick={() => setDias(d)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          dias === d
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {d} días
                      </button>
                    ))}
                    <button
                      onClick={loadDetalle}
                      className="px-4 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                    >
                      ↻ Actualizar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">Área</label>
                      <select
                        value={selectedArea}
                        onChange={(e) => setSelectedArea(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      >
                        <option value="">Todas las áreas</option>
                        {areas.map((a) => (
                          <option key={a.id} value={a.id}>{a.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">Bloque</label>
                      <select
                        value={selectedBloque}
                        onChange={(e) => setSelectedBloque(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      >
                        <option value="">Todos los bloques</option>
                        {/* Aquí podrías agregar lógica para obtener bloques filtrados */}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">Variedad</label>
                      <select
                        value={selectedVariedad}
                        onChange={(e) => setSelectedVariedad(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      >
                        <option value="">Todas las variedades</option>
                        {/* Aquí podrías agregar lógica para obtener variedades filtradas */}
                      </select>
                    </div>
                  </div>

                  {/* Selector de tipo de gráfico */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 font-medium">Gráfico:</span>
                    <button
                      onClick={() => setChartType('line')}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        chartType === 'line'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      📈 Líneas
                    </button>
                    <button
                      onClick={() => setChartType('bar')}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        chartType === 'bar'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      📊 Barras
                    </button>
                  </div>
                </div>

                {/* Contenido */}
                {loadingDetalle ? (
                  <div className="flex justify-center py-20"><Spinner size="lg" /></div>
                ) : section === 'labores-detalle' ? (
                  <SectionLaborDetalle
                    corteData={corteDetalleData}
                    chartType={chartType}
                  />
                ) : (
                  <SectionGestion
                    laborData={laborDetalleData}
                    corteData={corteDetalleData}
                    asegData={asegDetalleData}
                    chartType={chartType}
                  />
                )}
              </>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  )
}

// ─── SECCIÓN: General ────────────────────────────────────────────────────────
function SectionGeneral({
  loading, thisWeek, thisWeekCompletos, pendingCount,
  areaMasAdelantada, areasConLaboresBajos, areaStats, weekStats, tab, setTab
}: {
  loading: boolean
  thisWeek: DashboardFormulario[]
  thisWeekCompletos: number
  pendingCount: number
  areaMasAdelantada: AreaStats | undefined
  areasConLaboresBajos: AreaStats[]
  areaStats: AreaStats[]
  weekStats: WeekStats[]
  tab: 'areas' | 'semanas'
  setTab: (t: 'areas' | 'semanas') => void
}) {
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {areaMasAdelantada && (
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-green-100">Mayor avance esta semana</p>
              <p className="text-xl font-bold mt-2">{areaMasAdelantada.nombre}</p>
              <p className="text-sm text-green-100 mt-1">
                {areaMasAdelantada.completos} completo{areaMasAdelantada.completos !== 1 ? 's' : ''} · {areaMasAdelantada.porcentaje}%
              </p>
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
                  <span key={a.areaId} className="rounded-full bg-orange-50 px-2.5 py-0.5 text-xs text-orange-700 border border-orange-200">{a.nombre}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabla avance */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="border-b border-gray-100 px-5 flex gap-1 pt-2">
          {(['areas', 'semanas'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
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
                  <div className="w-36 flex-shrink-0"><p className="text-sm font-medium text-gray-900 truncate">{a.nombre}</p></div>
                  <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-5 rounded-full transition-all ${a.porcentaje >= 80 ? 'bg-green-500' : a.porcentaje >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`} style={{ width: `${a.porcentaje}%` }} />
                  </div>
                  <div className="w-28 flex-shrink-0 text-right">
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
                    <div className="w-36 flex-shrink-0"><p className="text-sm font-medium text-gray-900">{w.label}</p></div>
                    <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-5 rounded-full ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="w-28 flex-shrink-0 text-right">
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
    </div>
  )
}

// ─── SECCIÓN: Corte ───────────────────────────────────────────────────────────
function SectionCorte({ corteData, statsPorArea }: { corteData: DashDataCorte[]; statsPorArea: StatsPorArea[] }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="✂️ Rendimiento Corte por Fecha">
          {corteData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={corteData.slice(-20)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="rendimiento" name="Rendimiento %" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </ChartCard>

        <ChartCard title="📊 Tallos Estimados vs Reales">
          {corteData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={corteData.slice(-15)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="tallosEstimados" name="Estimados" fill="#93c5fd" />
                <Bar dataKey="tallosReales"    name="Reales"    fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </ChartCard>
      </div>

      <ChartCard title="🌱 Rendimiento por Área" full>
        {statsPorArea.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={statsPorArea}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="area" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalFormularios" name="Formularios" fill="#3b82f6" />
              <Bar dataKey="promRendimiento"  name="Prom. Rend. %" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        ) : <NoData />}
      </ChartCard>
    </div>
  )
}

// ─── SECCIÓN: Labores ─────────────────────────────────────────────────────────
function SectionLabores({ laboresData, statsPorArea }: { laboresData: DashDataLabores[]; statsPorArea: StatsPorArea[] }) {
  const distribucion = [1, 2, 3, 4, 5].map((n) => ({
    name: `Labor ${n}`,
    value: laboresData.filter((l) => l.numeroLabor === n).length,
  })).filter((d) => d.value > 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="🌿 Camas Estimadas vs Reales por Fecha">
          {laboresData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={laboresData.slice(-20)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="camasEstimadas" name="Estimadas" fill="#86efac" />
                <Bar dataKey="camasReales"    name="Reales"    fill="#16a34a" />
              </BarChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </ChartCard>

        <ChartCard title="🥧 Distribución de Labores">
          {distribucion.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={distribucion} cx="50%" cy="50%" outerRadius={90}
                  dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {distribucion.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </ChartCard>
      </div>

      <ChartCard title="📊 Rendimiento Labores por Área" full>
        {statsPorArea.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={statsPorArea}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="area" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="promRendimiento" name="Prom. Rendimiento %" fill="#10b981" />
              <Bar dataKey="totalHoras"      name="Total Horas"         fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        ) : <NoData />}
      </ChartCard>
    </div>
  )
}

// ─── SECCIÓN: Aseguramiento ───────────────────────────────────────────────────
function SectionAseguramiento({ asegData, statsPorArea }: { asegData: DashDataAseguramiento[]; statsPorArea: StatsPorArea[] }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="✅ % Cumplimiento por Fecha">
          {asegData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={asegData.slice(-20)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="cumplimiento" name="Cumplimiento %" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="calidad"      name="Calidad %"      stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </ChartCard>

        <ChartCard title="📊 Cumplimiento por Área">
          {statsPorArea.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={statsPorArea} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="area" width={80} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="promRendimiento" name="% Rendimiento" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </ChartCard>
      </div>
    </div>
  )
}

// ─── SECCIÓN: Colaboradores ───────────────────────────────────────────────────
function SectionColaboradores({ statsPorColab }: { statsPorColab: StatsPorColaborador[] }) {
  return (
    <div className="space-y-6">
      <ChartCard title="🏆 Top Colaboradores por Rendimiento" full>
        {statsPorColab.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={statsPorColab.slice(0, 10)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="colaborador" width={120} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="promRendimiento"  name="Rendimiento %"  fill="#3b82f6" />
              <Bar dataKey="promCumplimiento" name="Cumplimiento %" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        ) : <NoData />}
      </ChartCard>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <h3 className="font-semibold text-gray-800">👥 Tabla Detallada — Top 20 Colaboradores</h3>
        </div>
        {statsPorColab.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">Sin datos para el período seleccionado</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">#</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Colaborador</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Registros</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Prom. Rendimiento</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Prom. Cumplimiento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {statsPorColab.slice(0, 20).map((c, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-gray-400 font-medium">{idx + 1}</td>
                    <td className="px-5 py-3 font-medium text-gray-900">{c.colaborador}</td>
                    <td className="px-5 py-3 text-right text-gray-600">{c.totalRegistros}</td>
                    <td className="px-5 py-3 text-right">
                      <span className={`font-semibold ${c.promRendimiento >= 80 ? 'text-green-600' : c.promRendimiento >= 60 ? 'text-yellow-600' : 'text-red-500'}`}>
                        {c.promRendimiento}%
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={`font-semibold ${c.promCumplimiento >= 80 ? 'text-green-600' : c.promCumplimiento >= 60 ? 'text-yellow-600' : 'text-red-500'}`}>
                        {c.promCumplimiento}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Componentes auxiliares ───────────────────────────────────────────────────
function ChartCard({ title, children, full }: { title: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${full ? 'col-span-full' : ''}`}>
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
        <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function NoData() {
  return <p className="text-center text-sm text-gray-400 py-10">Sin datos para el período seleccionado</p>
}

// ─── Componentes auxiliares para gráficos detallados ────────────────────────

// ─── SECCIÓN: Por Labor (Labores Detalle) ───────────────────────────────────
function SectionLaborDetalle({
  corteData,
  chartType,
}: {
  corteData: CorteDetalleData[]
  chartType: 'line' | 'bar'
}) {
  // Agrupar por fecha para gráficos
  const dataByDate = corteData.reduce(
    (acc, item) => {
      const existing = acc.find((d) => d.fecha === item.fecha)
      if (existing) {
        existing.rendimientoPromedio = (existing.rendimientoPromedio + item.rendimiento) / 2
        existing.tiempoTotal = (existing.tiempoTotal || 0) + item.tiempoReal
        existing.tallosTotal = (existing.tallosTotal || 0) + item.tallosReales
      } else {
        acc.push({
          fecha: item.fecha,
          rendimientoPromedio: item.rendimiento,
          tiempoTotal: item.tiempoReal,
          tallosTotal: item.tallosReales,
        })
      }
      return acc
    },
    [] as any[],
  )

  // Agrupar por labor
  const laborStats = corteData.reduce(
    (acc, item) => {
      const existing = acc.find((l) => l.numeroLabor === item.numeroLabor)
      if (existing) {
        existing.rendimientos.push(item.rendimiento)
        existing.count++
      } else {
        acc.push({
          nombreLabor: item.nombreLabor,
          numeroLabor: item.numeroLabor,
          rendimientos: [item.rendimiento],
          count: 1,
        })
      }
      return acc
    },
    [] as any[],
  )

  const laboresWithAvg = laborStats.map((l) => ({
    ...l,
    rendimientoPromedio: Math.round((l.rendimientos.reduce((a: number, b: number) => a + b, 0) / l.count) * 100) / 100,
  }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="📈 Rendimiento por Día">
          {dataByDate.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              {chartType === 'line' ? (
                <LineChart data={dataByDate}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="rendimientoPromedio"
                    name="Rend. Promedio %"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              ) : (
                <BarChart data={dataByDate}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="rendimientoPromedio" name="Rend. Promedio %" fill="#10b981" />
                </BarChart>
              )}
            </ResponsiveContainer>
          ) : (
            <NoData />
          )}
        </ChartCard>

        <ChartCard title="🌾 Tallos por Día">
          {dataByDate.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dataByDate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="tallosTotal" name="Tallos" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <NoData />
          )}
        </ChartCard>
      </div>

      <ChartCard title="💼 Rendimiento por Labor" full>
        {laboresWithAvg.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            {chartType === 'line' ? (
              <LineChart data={laboresWithAvg}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nombreLabor" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="rendimientoPromedio"
                  name="Rendimiento %"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            ) : (
              <BarChart data={laboresWithAvg}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nombreLabor" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="rendimientoPromedio" name="Rendimiento %" fill="#3b82f6" />
              </BarChart>
            )}
          </ResponsiveContainer>
        ) : (
          <NoData />
        )}
      </ChartCard>

      {/* Tabla detallada */}
      <ChartCard title="📋 Detalle por Labor" full>
        {corteData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 font-semibold text-gray-700">Fecha</th>
                  <th className="text-left py-2 px-2 font-semibold text-gray-700">Labor</th>
                  <th className="text-left py-2 px-2 font-semibold text-gray-700">Colaborador</th>
                  <th className="text-right py-2 px-2 font-semibold text-gray-700">Rendimiento %</th>
                  <th className="text-right py-2 px-2 font-semibold text-gray-700">Tallos</th>
                </tr>
              </thead>
              <tbody>
                {corteData.slice(0, 20).map((row, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-2">{row.fecha}</td>
                    <td className="py-2 px-2">{row.nombreLabor}</td>
                    <td className="py-2 px-2">{row.colaborador}</td>
                    <td className="text-right py-2 px-2">
                      <span
                        className={`${row.rendimiento >= 80 ? 'text-green-600' : row.rendimiento >= 50 ? 'text-yellow-600' : 'text-red-600'} font-semibold`}
                      >
                        {row.rendimiento}%
                      </span>
                    </td>
                    <td className="text-right py-2 px-2">{row.tallosReales}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <NoData />
        )}
      </ChartCard>
    </div>
  )
}

// ─── SECCIÓN: Gestión (Labor + Corte + Aseguramiento) ──────────────────────
function SectionGestion({
  laborData,
  corteData,
  asegData,
  chartType,
}: {
  laborData: LaborDetalleData[]
  corteData: CorteDetalleData[]
  asegData: AseguramientoDetalleData[]
  chartType: 'line' | 'bar'
}) {
  // Agrupar por fecha
  const laboresByDate = laborData.reduce(
    (acc, item) => {
      const existing = acc.find((d) => d.fecha === item.fecha)
      if (existing) {
        existing.labor = (existing.labor || 0) + item.rendimientoLabor
        existing.laborCount++
      } else {
        acc.push({
          fecha: item.fecha,
          labor: item.rendimientoLabor,
          laborCount: 1,
          corte: 0,
          corteCount: 0,
          aseg: 0,
          asegCount: 0,
        })
      }
      return acc
    },
    [] as any[],
  )

  const corteByDate = corteData.reduce(
    (acc, item) => {
      const existing = acc.find((d) => d.fecha === item.fecha)
      if (existing) {
        existing.corte = (existing.corte || 0) + item.rendimiento
        existing.corteCount++
      } else {
        acc.push({
          fecha: item.fecha,
          corte: item.rendimiento,
          corteCount: 1,
          labor: 0,
          laborCount: 0,
          aseg: 0,
          asegCount: 0,
        })
      }
      return acc
    },
    [] as any[],
  )

  const asegByDate = asegData.reduce(
    (acc, item) => {
      const existing = acc.find((d) => d.fecha === item.fecha)
      if (existing) {
        existing.aseg = (existing.aseg || 0) + item.cumplimiento
        existing.asegCount++
      } else {
        acc.push({
          fecha: item.fecha,
          aseg: item.cumplimiento,
          asegCount: 1,
          labor: 0,
          laborCount: 0,
          corte: 0,
          corteCount: 0,
        })
      }
      return acc
    },
    [] as any[],
  )

  // Merge all data by date
  const allDates = new Set([
    ...laboresByDate.map((d) => d.fecha),
    ...corteByDate.map((d) => d.fecha),
    ...asegByDate.map((d) => d.fecha),
  ])

  const mergedData = Array.from(allDates).map((fecha) => {
    const labor = laboresByDate.find((d) => d.fecha === fecha)
    const corte = corteByDate.find((d) => d.fecha === fecha)
    const aseg = asegByDate.find((d) => d.fecha === fecha)

    return {
      fecha,
      labores: labor?.laborCount ? Math.round((labor.labor / labor.laborCount) * 100) / 100 : 0,
      cortes: corte?.corteCount ? Math.round((corte.corte / corte.corteCount) * 100) / 100 : 0,
      aseguramiento: aseg?.asegCount ? Math.round((aseg.aseg / aseg.asegCount) * 100) / 100 : 0,
    }
  })

  return (
    <div className="space-y-6">
      <ChartCard title="📊 Líneas por Labor, Corte y Aseguramiento" full>
        {mergedData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            {chartType === 'line' ? (
              <LineChart data={mergedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="labores"
                  name="Labores %"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="cortes"
                  name="Cortes %"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="aseguramiento"
                  name="Aseguramiento %"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            ) : (
              <BarChart data={mergedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="labores" name="Labores %" fill="#3b82f6" />
                <Bar dataKey="cortes" name="Cortes %" fill="#ef4444" />
                <Bar dataKey="aseguramiento" name="Aseguramiento %" fill="#10b981" />
              </BarChart>
            )}
          </ResponsiveContainer>
        ) : (
          <NoData />
        )}
      </ChartCard>

      {/* Tabla de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ChartCard title="🌿 Total Labores">
          {laborData.length > 0 ? (
            <div className="space-y-2">
              <div className="text-3xl font-bold text-blue-600">{laborData.length}</div>
              <div className="text-sm text-gray-500">registros</div>
              <div className="text-lg font-semibold text-gray-700 mt-4">
                Promedio:{' '}
                <span className="text-green-600">
                  {laborData.length > 0
                    ? Math.round(
                        (laborData.reduce((sum, l) => sum + l.rendimientoLabor, 0) / laborData.length) * 100,
                      ) / 100
                    : 0}
                  %
                </span>
              </div>
            </div>
          ) : (
            <NoData />
          )}
        </ChartCard>

        <ChartCard title="✂️ Total Cortes">
          {corteData.length > 0 ? (
            <div className="space-y-2">
              <div className="text-3xl font-bold text-red-600">{corteData.length}</div>
              <div className="text-sm text-gray-500">registros</div>
              <div className="text-lg font-semibold text-gray-700 mt-4">
                Promedio:{' '}
                <span className="text-red-600">
                  {corteData.length > 0
                    ? Math.round(
                        (corteData.reduce((sum, c) => sum + c.rendimiento, 0) / corteData.length) * 100,
                      ) / 100
                    : 0}
                  %
                </span>
              </div>
            </div>
          ) : (
            <NoData />
          )}
        </ChartCard>

        <ChartCard title="✅ Total Aseguramiento">
          {asegData.length > 0 ? (
            <div className="space-y-2">
              <div className="text-3xl font-bold text-green-600">{asegData.length}</div>
              <div className="text-sm text-gray-500">registros</div>
              <div className="text-lg font-semibold text-gray-700 mt-4">
                Cumpl.:{' '}
                <span className="text-green-600">
                  {asegData.length > 0
                    ? Math.round(
                        (asegData.reduce((sum, a) => sum + a.cumplimiento, 0) / asegData.length) * 100,
                      ) / 100
                    : 0}
                  %
                </span>
              </div>
            </div>
          ) : (
            <NoData />
          )}
        </ChartCard>
      </div>
    </div>
  )
}
