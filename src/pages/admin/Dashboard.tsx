import { useEffect, useState, useMemo } from 'react'
import { useAuthStore } from '../../store/useAuthStore'
import { fetchDashboardFormularios, fetchSedes } from '../../services/api'
import { syncPendientes } from '../../services/sync'
import { countNoSincronizados, getAllAreas } from '../../services/db'
import { useSyncProgress } from '../../hooks/useSyncProgress'
import type { Area, Sede, Rol } from '../../types'
import type { DashboardFormulario } from '../../services/api'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import { Card } from '../../components/ui/Card'
import {
  LayoutDashboard,
  Scissors,
  Sprout,
  CheckCircle,
  Users,
  TrendingUp,
  ClipboardList,
  RefreshCcw,
  Calendar,
  Layers,
  BarChart3,
  Filter,
  Trophy
} from 'lucide-react'
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

interface AreaStats { areaId: string; nombre: string; sedeId: string; total: number; completos: number; borradores: number; porcentaje: number }
interface SedeStats { sedeId: string; nombre: string; total: number; completos: number; porcentaje: number }
interface WeekStats { label: string; total: number; completos: number }

const SECTIONS: { key: DashSection; label: string; icon: any; roles?: Rol[] }[] = [
  { key: 'general',        label: 'General',        icon: LayoutDashboard },
  { key: 'corte',          label: 'Corte',          icon: Scissors },
  { key: 'labores',        label: 'Labores',        icon: Sprout },
  { key: 'aseguramiento',  label: 'Calidad',        icon: CheckCircle },
  { key: 'colaboradores',  label: 'Personal',       icon: Users },
  { key: 'labores-detalle',label: 'Analítica',      icon: TrendingUp },
  { key: 'gestion',        label: 'Gestión',        icon: ClipboardList, roles: ['superadministrador'] },
]

// ─── Componente principal ─────────────────────────────────────────────────────

export default function AdminDashboard() {
  const usuario = useAuthStore((s) => s.usuario)
  const isSuperAdmin = usuario?.rol === 'superadministrador'
  const { syncWithProgress } = useSyncProgress()
  const [section, setSection] = useState<DashSection>('general')

  // Datos generales (IndexedDB)
  const [areas, setAreas] = useState<Area[]>([])
  const [sedes, setSedes] = useState<Sede[]>([])
  const [formularios, setFormularios] = useState<DashboardFormulario[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loadingGeneral, setLoadingGeneral] = useState(true)
  const [tabGeneral, setTabGeneral] = useState<'areas' | 'semanas' | 'sedes'>('areas')

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
    const [forms, areasData, sedesData, pending] = await Promise.all([
      fetchDashboardFormularios(desde).catch(() => [] as DashboardFormulario[]),
      getAllAreas(),
      fetchSedes().catch(() => [] as Sede[]),
      countNoSincronizados(),
    ])
    setFormularios(forms)
    setAreas(areasData)
    setSedes(sedesData)
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

  // ── Cálculos adicionales para Rankings y Columnas Agrupadas ──
  const topVariedades = useMemo(() => {
    const map = new Map<string, number>()
    corteData.forEach(d => {
      const name = d.variedad || 'Sin Variedad'
      map.set(name, (map.get(name) || 0) + d.tallosReales)
    })
    return Array.from(map.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
  }, [corteData])

  const cortePorAreaGrouped = useMemo(() => {
    const map = new Map<string, { area: string, estimados: number, reales: number }>()
    corteData.forEach(d => {
      const current = map.get(d.area) || { area: d.area, estimados: 0, reales: 0 }
      current.estimados += d.tallosEstimados
      current.reales += d.tallosReales
      map.set(d.area, current)
    })
    return Array.from(map.values()).sort((a, b) => b.reales - a.reales).slice(0, 8)
  }, [corteData])

  const laboresPorAreaGrouped = useMemo(() => {
    const map = new Map<string, { area: string, estimados: number, reales: number }>()
    laboresData.forEach(d => {
      const current = map.get(d.area) || { area: d.area, estimados: 0, reales: 0 }
      current.estimados += d.camasEstimadas
      current.reales += d.camasReales
      map.set(d.area, current)
    })
    return Array.from(map.values()).sort((a, b) => b.reales - a.reales).slice(0, 8)
  }, [laboresData])

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
        areaId: a.id, nombre: a.nombre, sedeId: a.sedeId, total, completos,
        borradores: aForms.filter((f) => f.estado === 'borrador').length,
        porcentaje: total > 0 ? Math.round((completos / total) * 100) : 0,
      }
    })
    .sort((a, b) => b.completos - a.completos || b.total - a.total)

  // Calcular estadísticas por Sede (para SuperAdmins)
  const sedeStats: SedeStats[] = sedes.map(s => {
    const sAreas = areaStats.filter(a => a.sedeId === s.id)
    const total = sAreas.reduce((acc, a) => acc + a.total, 0)
    const completos = sAreas.reduce((acc, a) => acc + a.completos, 0)
    return {
      sedeId: s.id,
      nombre: s.nombre,
      total,
      completos,
      porcentaje: total > 0 ? Math.round((completos / total) * 100) : 0
    }
  }).sort((a, b) => b.completos - a.completos)

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

  // Filtrar secciones por rol
  const visibleSections = SECTIONS.filter(s => !s.roles || (usuario && s.roles.includes(usuario.rol)))

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Dashboard Administrativo</h1>
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {pendingCount > 0 && (
              <Button variant="secondary" onClick={handleSync} className="bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200">
                <RefreshCcw className="w-4 h-4 mr-2" />
                Sincronizar {pendingCount} pendientes
              </Button>
            )}
          </div>
        </div>

        {/* Navegación por Pestañas */}
        <nav className="flex items-center p-1 bg-gray-100 rounded-2xl overflow-x-auto no-scrollbar">
          {visibleSections.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSection(key)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                section === key
                  ? 'bg-white text-green-700 shadow-sm ring-1 ring-black/5'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${section === key ? 'text-green-600' : 'text-gray-400'}`} />
              {label}
            </button>
          ))}
        </nav>

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
            sedeStats={sedeStats}
            weekStats={weekStats}
            tab={tabGeneral}
            setTab={setTabGeneral}
            isSuperAdmin={isSuperAdmin}
          />
        )}

        {/* ── SECCIONES ANALÍTICAS ── */}
        {section !== 'general' && section !== 'labores-detalle' && section !== 'gestion' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
               <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-semibold text-gray-700">Período:</span>
                <div className="flex gap-1">
                  {[7, 14, 28, 60].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDias(d)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        dias === d
                          ? 'bg-green-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {d}D
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={loadAnalitico}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
              >
                <RefreshCcw className="w-3 h-3" />
                Actualizar Datos
              </button>
            </div>

            {/* KPIs analíticos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard label="Total Registros" value={kpis.totalRegistros} icon={Layers} color="blue" />
              <KPICard label="Rendimiento Prom." value={`${kpis.promRendimiento}%`} icon={TrendingUp} color="green" />
              <KPICard label="Cumplimiento Prom." value={`${kpis.promCumplimiento}%`} icon={CheckCircle} color="yellow" />
              <KPICard label="Total Horas" value={kpis.totalHoras} icon={Calendar} color="purple" />
            </div>

            {errorAnalitico && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
                {errorAnalitico}
              </div>
            )}

            {loadingAnalitico ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Spinner size="lg" />
                <p className="text-gray-400 text-sm animate-pulse">Cargando métricas de Supabase...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {section === 'corte'         && <SectionCorte   corteData={corteData} topVariedades={topVariedades} cortePorAreaGrouped={cortePorAreaGrouped} />}
                {section === 'labores'       && <SectionLabores laboresData={laboresData} laboresPorAreaGrouped={laboresPorAreaGrouped} />}
                {section === 'aseguramiento' && <SectionAseguramiento asegData={asegData} statsPorArea={statsPorArea} />}
                {section === 'colaboradores' && <SectionColaboradores statsPorColab={statsPorColab} />}
              </div>
            )}
          </div>
        )}

        {/* Secciones con filtros complejos (Analítica Detalle y Gestión) */}
        {(section === 'labores-detalle' || section === 'gestion') && (
          <div className="space-y-6">
             <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-green-600" />
                    <h3 className="font-bold text-gray-800">Filtros Avanzados</h3>
                  </div>
                  <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                    {[7, 14, 28, 60].map((d) => (
                      <button
                        key={d}
                        onClick={() => setDias(d)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          dias === d ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {d} Días
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FilterGroup label="Área de Trabajo" value={selectedArea} onChange={setSelectedArea} options={areas} />
                  <FilterGroup label="Bloque" value={selectedBloque} onChange={setSelectedBloque} options={[]} placeholder="Todos los bloques" />
                  <FilterGroup label="Variedad" value={selectedVariedad} onChange={setSelectedVariedad} options={[]} placeholder="Todas las variedades" />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div className="flex p-1 bg-gray-50 rounded-xl">
                    <button
                      onClick={() => setChartType('line')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${chartType === 'line' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
                    >
                      <TrendingUp className="w-3.5 h-3.5" /> Líneas
                    </button>
                    <button
                      onClick={() => setChartType('bar')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${chartType === 'bar' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
                    >
                      <BarChart3 className="w-3.5 h-3.5" /> Barras
                    </button>
                  </div>
                  <Button onClick={loadDetalle} className="rounded-xl px-6">
                    Aplicar Filtros
                  </Button>
                </div>
             </div>

             {loadingDetalle ? (
                <div className="flex justify-center py-20"><Spinner size="lg" /></div>
             ) : section === 'labores-detalle' ? (
                <SectionLaborDetalle corteData={corteDetalleData} chartType={chartType} />
             ) : (
                <SectionGestion laborData={laborDetalleData} corteData={corteDetalleData} asegData={asegDetalleData} chartType={chartType} />
             )}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

// ─── Componentes de UI Propios ───────────────────────────────────────────────

function KPICard({ label, value, icon: Icon, color }: { label: string, value: string | number, icon: any, color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
  }

  return (
    <Card className={`relative overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300 ${colors[color]}`}>
      <div className="relative z-10 flex flex-col justify-between h-full">
        <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-2">{label}</p>
        <p className="text-3xl font-black">{value}</p>
      </div>
      <Icon className="absolute -right-2 -bottom-2 w-20 h-20 opacity-10 rotate-12" />
    </Card>
  )
}

function FilterGroup({ label, value, onChange, options, placeholder = "Seleccionar..." }: any) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-gray-500 uppercase tracking-tight ml-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-green-500 transition-all cursor-pointer"
      >
        <option value="">{placeholder}</option>
        {options.map((opt: any) => (
          <option key={opt.id} value={opt.id}>{opt.nombre}</option>
        ))}
      </select>
    </div>
  )
}

// ─── SECCIÓN: General ────────────────────────────────────────────────────────
function SectionGeneral({
  loading, thisWeek, thisWeekCompletos, pendingCount,
  areaMasAdelantada, areasConLaboresBajos, areaStats, sedeStats, weekStats, tab, setTab, isSuperAdmin
}: {
  loading: boolean
  thisWeek: DashboardFormulario[]
  thisWeekCompletos: number
  pendingCount: number
  areaMasAdelantada: AreaStats | undefined
  areasConLaboresBajos: AreaStats[]
  areaStats: AreaStats[]
  sedeStats: SedeStats[]
  weekStats: WeekStats[]
  tab: 'areas' | 'semanas' | 'sedes'
  setTab: (t: 'areas' | 'semanas' | 'sedes') => void
  isSuperAdmin: boolean
}) {
  return (
    <div className="space-y-6">
      {/* KPIs Rápidos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Esta Semana" value={thisWeek.length} icon={Layers} color="blue" />
        <KPICard label="Completos" value={thisWeekCompletos} icon={CheckCircle} color="green" />
        <KPICard label="Borradores" value={thisWeek.length - thisWeekCompletos} icon={Sprout} color="yellow" />
        <KPICard
          label="Pendientes Sync"
          value={pendingCount}
          icon={RefreshCcw}
          color={pendingCount > 0 ? "orange" : "blue"}
        />
      </div>

      {/* Alertas y Logros */}
      {!loading && (areaMasAdelantada || areasConLaboresBajos.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {areaMasAdelantada && (
            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-xs font-bold uppercase tracking-widest text-green-100/80">Área Líder de la Semana</p>
                <p className="text-2xl font-black mt-1">{areaMasAdelantada.nombre}</p>
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex-1 bg-white/20 h-2 rounded-full">
                    <div className="bg-white h-2 rounded-full" style={{ width: `${areaMasAdelantada.porcentaje}%` }} />
                  </div>
                  <span className="font-black text-sm">{areaMasAdelantada.porcentaje}%</span>
                </div>
                <p className="text-xs text-green-50 mt-2">{areaMasAdelantada.completos} formularios finalizados</p>
              </div>
              <TrendingUp className="absolute -right-4 -bottom-4 w-32 h-32 text-white opacity-10 -rotate-12" />
            </div>
          )}
          {areasConLaboresBajos.length > 0 && (
            <div className="bg-white rounded-2xl border-l-4 border-orange-500 p-6 shadow-md">
              <div className="flex items-center gap-2 mb-3">
                <Sprout className="w-5 h-5 text-orange-500" />
                <h4 className="font-bold text-gray-800 text-sm uppercase">Atención: Sin registros</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {areasConLaboresBajos.map((a) => (
                  <span key={a.areaId} className="px-3 py-1 bg-orange-50 text-orange-700 rounded-lg text-xs font-bold border border-orange-100">
                    {a.nombre}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabla de Avance Detallada */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gray-50/50 p-2 flex gap-1 border-b border-gray-100">
          {isSuperAdmin && (
            <TabButton active={tab === 'sedes'} onClick={() => setTab('sedes')} label="Por Sede" icon={Layers} />
          )}
          <TabButton active={tab === 'areas'} onClick={() => setTab('areas')} label="Por Área" icon={Sprout} />
          <TabButton active={tab === 'semanas'} onClick={() => setTab('semanas')} label="Histórico" icon={Calendar} />
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : (
            <div className="space-y-4">
              {tab === 'sedes' && sedeStats.map(s => <ProgressBar key={s.sedeId} label={s.nombre} current={s.completos} total={s.total} percentage={s.porcentaje} color="blue" />)}
              {tab === 'areas' && areaStats.filter(a => a.total > 0).map(a => <ProgressBar key={a.areaId} label={a.nombre} current={a.completos} total={a.total} percentage={a.porcentaje} color="green" />)}
              {tab === 'semanas' && weekStats.map(w => {
                 const pct = w.total > 0 ? Math.round((w.completos / w.total) * 100) : 0
                 return <ProgressBar key={w.label} label={w.label} current={w.completos} total={w.total} percentage={pct} color="indigo" />
              })}
              {(tab === 'areas' && areaStats.filter(a => a.total > 0).length === 0) && <p className="text-center text-gray-400 py-10 font-medium">No hay registros activos esta semana.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TabButton({ active, onClick, label, icon: Icon }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
        active ? 'bg-white text-green-700 shadow-sm ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  )
}

function ProgressBar({ label, current, total, percentage, color }: any) {
  const colorMap: any = {
    blue: 'bg-blue-600',
    green: percentage >= 80 ? 'bg-green-600' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500',
    indigo: 'bg-indigo-600'
  }

  return (
    <div className="flex items-center gap-4 group">
      <div className="w-40 flex-shrink-0">
        <p className="text-sm font-bold text-gray-700 group-hover:text-gray-900 transition-colors truncate">{label}</p>
      </div>
      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${colorMap[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="w-24 flex-shrink-0 text-right">
        <span className="text-sm font-black text-gray-800">{percentage}%</span>
        <span className="text-[10px] font-bold text-gray-400 ml-1.5">{current}/{total}</span>
      </div>
    </div>
  )
}

// ─── SECCIÓN: Corte ───────────────────────────────────────────────────────────
function SectionCorte({ corteData, topVariedades, cortePorAreaGrouped }: { corteData: DashDataCorte[]; topVariedades: any[]; cortePorAreaGrouped: any[] }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Top 5 Variedades (Producción Tallos)" icon={Trophy}>
          {topVariedades.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topVariedades} layout="vertical" margin={{ left: 20, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="total" name="Tallos Reales" fill="#10b981" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 10, fill: '#10b981', fontWeight: 'bold' }} />
              </BarChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </ChartCard>

        <ChartCard title="Tallos: Estimados vs Reales por Área" icon={BarChart3}>
          {cortePorAreaGrouped.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cortePorAreaGrouped}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="area" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" />
                <Bar dataKey="estimados" name="Estimados" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                <Bar dataKey="reales"    name="Reales"    fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </ChartCard>
      </div>

      <ChartCard title="Evolución de Rendimiento de Corte" icon={TrendingUp} full>
        {corteData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={corteData.slice(-20)}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
              <Legend iconType="circle" />
              <Line type="monotone" dataKey="rendimiento" name="Rendimiento %" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : <NoData />}
      </ChartCard>
    </div>
  )
}

// ─── SECCIÓN: Labores ─────────────────────────────────────────────────────────
function SectionLabores({ laboresData, laboresPorAreaGrouped }: { laboresData: DashDataLabores[]; laboresPorAreaGrouped: any[] }) {
  const distribucion = [1, 2, 3, 4, 5].map((n) => ({
    name: `Labor ${n}`,
    value: laboresData.filter((l) => l.numeroLabor === n).length,
  })).filter((d) => d.value > 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Camas: Estimadas vs Reales por Área" icon={Sprout}>
          {laboresPorAreaGrouped.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={laboresPorAreaGrouped}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="area" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <Legend iconType="circle" />
                <Bar dataKey="estimados" name="Estimadas" fill="#86efac" radius={[4, 4, 0, 0]} />
                <Bar dataKey="reales"    name="Reales"    fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </ChartCard>

        <ChartCard title="Distribución de Actividades" icon={BarChart3}>
          {distribucion.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={distribucion} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5}
                  dataKey="value" label={({ name }) => name}>
                  {distribucion.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="none" />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </ChartCard>
      </div>
    </div>
  )
}

// ─── SECCIÓN: Aseguramiento ───────────────────────────────────────────────────
function SectionAseguramiento({ asegData, statsPorArea }: { asegData: DashDataAseguramiento[]; statsPorArea: StatsPorArea[] }) {
  return (
    <div className="space-y-6">
      <ChartCard title="Tendencia de Calidad y Cumplimiento" icon={CheckCircle} full>
          {asegData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={asegData.slice(-20)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                <Legend verticalAlign="top" height={36}/>
                <Line type="monotone" dataKey="cumplimiento" name="% Cumplimiento" stroke="#10b981" strokeWidth={4} dot={{ r: 5 }} />
                <Line type="monotone" dataKey="calidad"      name="% Calidad"      stroke="#f59e0b" strokeWidth={4} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <NoData />}
      </ChartCard>
    </div>
  )
}

// ─── SECCIÓN: Personal ────────────────────────────────────────────────────────
function SectionColaboradores({ statsPorColab }: { statsPorColab: StatsPorColaborador[] }) {
  return (
    <div className="space-y-6">
      <ChartCard title="Top 10 Colaboradores por Rendimiento" icon={Users} full>
        {statsPorColab.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={statsPorColab.slice(0, 10)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis type="category" dataKey="colaborador" width={140} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
              <Tooltip cursor={{ fill: '#f8fafc' }} />
              <Legend />
              <Bar dataKey="promRendimiento"  name="Rendimiento %"  fill="#3b82f6" radius={[0, 4, 4, 0]} />
              <Bar dataKey="promCumplimiento" name="Cumplimiento %" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <NoData />}
      </ChartCard>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-green-600" />
            Tabla Detallada de Desempeño
          </h3>
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Top 20 Colaboradores</span>
        </div>
        {statsPorColab.length === 0 ? (
          <div className="py-20 text-center text-gray-400">Sin datos disponibles</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-500 text-xs font-black uppercase tracking-tighter">
                <tr>
                  <th className="px-6 py-4 text-left">Rango</th>
                  <th className="px-6 py-4 text-left">Nombre del Colaborador</th>
                  <th className="px-6 py-4 text-right">Registros</th>
                  <th className="px-6 py-4 text-right">Rendimiento</th>
                  <th className="px-6 py-4 text-right">Cumplimiento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {statsPorColab.slice(0, 20).map((c, idx) => (
                  <tr key={idx} className="hover:bg-green-50/30 transition-colors">
                    <td className="px-6 py-4 font-black text-gray-300">#{idx + 1}</td>
                    <td className="px-6 py-4 font-bold text-gray-900">{c.colaborador}</td>
                    <td className="px-6 py-4 text-right font-medium text-gray-500">{c.totalRegistros}</td>
                    <td className="px-6 py-4 text-right">
                      <BadgePerformance value={c.promRendimiento} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <BadgePerformance value={c.promCumplimiento} />
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

function BadgePerformance({ value }: { value: number }) {
  const color = value >= 85 ? 'bg-green-100 text-green-700' : value >= 65 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-black ${color}`}>
      {value}%
    </span>
  )
}

// ─── Componentes Auxiliares para Gráficos ──────────────────────────────────────

function ChartCard({ title, icon: Icon, children, full }: { title: string, icon: any, children: React.ReactNode, full?: boolean }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col ${full ? 'col-span-full' : ''}`}>
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        <div className="p-2 bg-green-50 rounded-lg">
          <Icon className="w-4 h-4 text-green-600" />
        </div>
        <h3 className="font-bold text-gray-800 text-sm tracking-tight">{title}</h3>
      </div>
      <div className="p-6 flex-1">
        {children}
      </div>
    </div>
  )
}

function NoData() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-gray-400 space-y-2">
      <Layers className="w-8 h-8 opacity-20" />
      <p className="text-sm font-medium">No hay suficientes datos en este rango</p>
    </div>
  )
}

// ─── SECCIONES DE DETALLE (Analítica y Gestión) ─────────────────────────────

function SectionLaborDetalle({ corteData, chartType }: { corteData: CorteDetalleData[], chartType: 'line' | 'bar' }) {
  const dataByDate = corteData.reduce((acc, item) => {
    const existing = acc.find((d) => d.fecha === item.fecha)
    if (existing) {
      existing.rendimientoPromedio = (existing.rendimientoPromedio + item.rendimiento) / 2
      existing.tallosTotal = (existing.tallosTotal || 0) + item.tallosReales
    } else {
      acc.push({ fecha: item.fecha, rendimientoPromedio: item.rendimiento, tallosTotal: item.tallosReales })
    }
    return acc
  }, [] as any[])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Evolución de Rendimiento" icon={TrendingUp}>
          <ResponsiveContainer width="100%" height={300}>
            {chartType === 'line' ? (
              <LineChart data={dataByDate}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="fecha" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="rendimientoPromedio" name="Rend. Promedio %" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            ) : (
              <BarChart data={dataByDate}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="fecha" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="rendimientoPromedio" name="Rend. Promedio %" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Producción Total (Tallos)" icon={Layers}>
           <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dataByDate}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="fecha" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="tallosTotal" name="Tallos" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-gray-500" />
          <h4 className="font-bold text-gray-800 text-sm">Registros Detallados (Top 50)</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-gray-400 font-black uppercase tracking-tighter bg-gray-50/50">
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Labor</th>
                <th className="px-6 py-4">Colaborador</th>
                <th className="px-6 py-4 text-right">Rendimiento</th>
                <th className="px-6 py-4 text-right">Producción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {corteData.slice(0, 50).map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-500">{row.fecha}</td>
                  <td className="px-6 py-3 font-bold text-gray-700">{row.nombreLabor}</td>
                  <td className="px-6 py-3 text-gray-600">{row.colaborador}</td>
                  <td className="px-6 py-3 text-right">
                    <span className={`font-black ${row.rendimiento >= 80 ? 'text-green-600' : 'text-orange-600'}`}>{row.rendimiento}%</span>
                  </td>
                  <td className="px-6 py-3 text-right font-bold text-gray-800">{row.tallosReales} tallos</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function SectionGestion({ laborData, corteData, asegData, chartType }: { laborData: LaborDetalleData[], corteData: CorteDetalleData[], asegData: AseguramientoDetalleData[], chartType: 'line' | 'bar' }) {
  // Lógica simplificada de merge para el dashboard visual
  const allDates = Array.from(new Set([...laborData.map(d => d.fecha), ...corteData.map(d => d.fecha)]))
  const merged = allDates.map(f => ({
    fecha: f,
    labores: Math.round(laborData.filter(d => d.fecha === f).reduce((a, b) => a + b.rendimientoLabor, 0) / (laborData.filter(d => d.fecha === f).length || 1)),
    cortes: Math.round(corteData.filter(d => d.fecha === f).reduce((a, b) => a + b.rendimiento, 0) / (corteData.filter(d => d.fecha === f).length || 1)),
  })).sort((a, b) => a.fecha.localeCompare(b.fecha))

  return (
    <div className="space-y-6">
       <ChartCard title="Comparativa Global de Desempeño" icon={BarChart3} full>
          <ResponsiveContainer width="100%" height={350}>
            {chartType === 'line' ? (
              <LineChart data={merged}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="fecha" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="labores" name="Labores %" stroke="#3b82f6" strokeWidth={4} />
                <Line type="monotone" dataKey="cortes" name="Cortes %" stroke="#ef4444" strokeWidth={4} />
              </LineChart>
            ) : (
              <BarChart data={merged}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="fecha" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="labores" name="Labores %" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cortes" name="Cortes %" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
       </ChartCard>
    </div>
  )
}
