import { useEffect, useState } from 'react'
import { AdminLayout } from '../../components/layout/AdminLayout'
import {
  getAllSedes,
  getAllAreas,
  getAllBloques,
  getAllColaboradores,
  getAllVariedades,
  getAllVariedadesBloques,
  getAllSupervisores
} from '../../services/db'
import type { Sede, Area, Bloque, Colaborador, Variedad, VariedadBloque, Supervisor } from '../../types'
import { Spinner } from '../../components/ui/Spinner'
import { Card } from '../../components/ui/Card'
import {
  Network,
  Users,
  Flower2,
  ChevronDown,
  ChevronRight,
  Building2,
  Sprout,
  Layers,
  User,
  Search,
  Filter,
  Inbox,
  AlertCircle,
  Briefcase,
  Globe,
  Tag
} from 'lucide-react'

type TabKey = 'estructura' | 'colaboradores' | 'variedades'

export default function AdminAsignaciones() {
  const [tab, setTab] = useState<TabKey>('estructura')
  const [loading, setLoading] = useState(true)

  const [sedes, setSedes] = useState<Sede[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [bloques, setBloques] = useState<Bloque[]>([])
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [variedades, setVariedades] = useState<Variedad[]>([])
  const [variedadesBloques, setVariedadesBloques] = useState<VariedadBloque[]>([])
  const [supervisores, setSupervisores] = useState<Supervisor[]>([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [s, a, b, c, v, vb, sv] = await Promise.all([
        getAllSedes(),
        getAllAreas(),
        getAllBloques(),
        getAllColaboradores(),
        getAllVariedades(),
        getAllVariedadesBloques(),
        getAllSupervisores(),
      ])
      setSedes(s)
      setAreas(a)
      setBloques(b)
      setColaboradores(c)
      setVariedades(v)
      setVariedadesBloques(vb)
      setSupervisores(sv)
      setLoading(false)
    }
    load()
  }, [])

  const TABS: { key: TabKey; label: string; icon: any }[] = [
    { key: 'estructura',    label: 'Infraestructura', icon: Network },
    { key: 'colaboradores', label: 'Personal por Área',   icon: Users },
    { key: 'variedades',    label: 'Variedades por Bloque',    icon: Flower2 },
  ]

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Mapa de Asignaciones</h1>
            <p className="text-gray-500 mt-1 flex items-center gap-2 font-medium">
              <Network className="w-4 h-4 text-blue-500" />
              Visualización jerárquica y relaciones del sistema
            </p>
          </div>
        </div>

        {/* Custom Tabs */}
        <nav className="flex items-center p-1 bg-gray-100 rounded-2xl overflow-x-auto no-scrollbar">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-200 whitespace-nowrap ${
                tab === key
                  ? 'bg-white text-green-700 shadow-sm ring-1 ring-black/5'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${tab === key ? 'text-green-600' : 'text-gray-400'}`} />
              {label}
            </button>
          ))}
        </nav>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Spinner size="lg" />
            <p className="text-gray-400 text-sm font-medium animate-pulse">Construyendo mapa de relaciones...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {tab === 'estructura' && (
              <EstructuraView sedes={sedes} areas={areas} bloques={bloques} supervisores={supervisores} />
            )}
            {tab === 'colaboradores' && (
              <ColaboradoresView sedes={sedes} areas={areas} colaboradores={colaboradores} supervisores={supervisores} />
            )}
            {tab === 'variedades' && (
              <VariedadesView areas={areas} bloques={bloques} variedades={variedades} variedadesBloques={variedadesBloques} />
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

/* ─────────────────────────────────────────────────────────────
   TAB 1: Infraestructura (Sedes → Áreas → Bloques)
───────────────────────────────────────────────────────────── */
function EstructuraView({ sedes, areas, bloques, supervisores }: {
  sedes: Sede[]
  areas: Area[]
  bloques: Bloque[]
  supervisores: Supervisor[]
}) {
  const [openSedes, setOpenSedes] = useState<Set<string>>(new Set(sedes.map((s) => s.id)))
  const [openAreas, setOpenAreas] = useState<Set<string>>(new Set(areas.map((a) => a.id)))

  const toggleSede = (id: string) =>
    setOpenSedes((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleArea = (id: string) =>
    setOpenAreas((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  if (sedes.length === 0) return <EmptyState msg="No hay sedes sincronizadas" />

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard icon={Building2} label="Sedes Activas" value={sedes.length} color="blue" />
        <KpiCard icon={Sprout} label="Áreas de Cultivo" value={areas.length} color="green" />
        <KpiCard icon={Layers} label="Bloques Totales" value={bloques.length} color="purple" />
      </div>

      {/* Árbol Jerárquico */}
      <div className="space-y-4">
        {sedes.map((sede) => {
          const sedeAreas = areas.filter((a) => a.sedeId === sede.id)
          const isSedeOpen = openSedes.has(sede.id)
          return (
            <div key={sede.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
              {/* Sede header */}
              <button
                onClick={() => toggleSede(sede.id)}
                className="w-full flex items-center gap-4 px-6 py-5 bg-gray-50/50 hover:bg-gray-100/50 transition-colors text-left group"
              >
                <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <span className="text-xl font-black text-gray-900">{sede.nombre}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">{sedeAreas.length} Áreas asignadas</span>
                  </div>
                </div>
                {isSedeOpen ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
              </button>

              {isSedeOpen && (
                <div className="p-4 space-y-3">
                  {sedeAreas.length === 0 && (
                    <div className="py-8 text-center text-gray-400 font-medium italic">Esta sede no tiene áreas configuradas aún.</div>
                  )}
                  {sedeAreas.map((area) => {
                    const areaBloques = bloques.filter((b) => b.areaId === area.id)
                    const supervisor = supervisores.find((s) => s.id === area.supervisorId)
                    const isAreaOpen = openAreas.has(area.id)
                    return (
                      <div key={area.id} className="border border-gray-50 rounded-3xl bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
                        {/* Área header */}
                        <button
                          onClick={() => toggleArea(area.id)}
                          className="w-full flex items-center gap-4 px-6 py-4 hover:bg-green-50/30 transition-colors text-left"
                        >
                          <div className={`p-2 rounded-xl ${area.activo ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                            <Sprout className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <span className="font-bold text-gray-800">{area.nombre}</span>
                            <div className="flex items-center gap-3 mt-1">
                              {supervisor && (
                                <span className="flex items-center gap-1 text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                                  <User className="w-3 h-3" /> Sup: {supervisor.nombre}
                                </span>
                              )}
                              <span className="text-[10px] font-black text-green-600 uppercase tracking-tighter">{areaBloques.length} Bloques</span>
                            </div>
                          </div>
                          {!area.activo && (
                            <span className="text-[10px] font-black bg-red-100 text-red-600 px-2 py-0.5 rounded-lg">INACTIVA</span>
                          )}
                          {isAreaOpen ? <ChevronDown className="w-4 h-4 text-gray-300" /> : <ChevronRight className="w-4 h-4 text-gray-300" />}
                        </button>

                        {isAreaOpen && (
                          <div className="px-14 pb-5">
                            {areaBloques.length > 0 ? (
                              <div className="flex flex-wrap gap-2 pt-2">
                                {areaBloques.map((b) => (
                                  <div
                                    key={b.id}
                                    className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-xl text-xs font-bold border border-purple-100 hover:bg-purple-100 transition-colors cursor-default"
                                  >
                                    <Layers className="w-3.5 h-3.5" />
                                    {b.nombre}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400 font-medium italic pt-2">No hay bloques definidos para esta área.</p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   TAB 2: Colaboradores por Área
───────────────────────────────────────────────────────────── */
function ColaboradoresView({ sedes, areas, colaboradores, supervisores }: {
  sedes: Sede[]
  areas: Area[]
  colaboradores: Colaborador[]
  supervisores: Supervisor[]
}) {
  const [search, setSearch] = useState('')
  const [filterSede, setFilterSede] = useState('')

  const activeAreas = areas.filter((a) => a.activo !== false)
  const filteredAreas = activeAreas.filter((a) => {
    if (filterSede && a.sedeId !== filterSede) return false
    return true
  })

  const totalAsignados = colaboradores.filter((c) => c.asignado && c.activo !== false).length
  const totalExternos = colaboradores.filter((c) => c.externo && c.activo !== false).length

  if (areas.length === 0) return <EmptyState msg="No hay áreas sincronizadas" />

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard icon={Users} label="Total Personal" value={colaboradores.filter((c) => c.activo !== false).length} color="green" />
        <KpiCard icon={User} label="Asignados" value={totalAsignados} color="blue" />
        <KpiCard icon={Globe} label="Personal Externo" value={totalExternos} color="orange" />
      </div>

      {/* Toolbar Filtros */}
      <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            placeholder="Buscar colaborador por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-gray-50/50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-green-500 text-sm font-medium transition-all"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filterSede}
            onChange={(e) => setFilterSede(e.target.value)}
            className="w-full md:w-60 bg-gray-50/50 border-none ring-1 ring-gray-100 rounded-2xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-green-500 transition-all cursor-pointer"
          >
            <option value="">Todas las sedes</option>
            {sedes.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </div>
      </div>

      {/* Grid de Áreas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredAreas.map((area) => {
          const supervisor = supervisores.find((s) => s.id === area.supervisorId)
          const sede = sedes.find((s) => s.id === area.sedeId)
          let areaColabs = colaboradores.filter((c) => c.areaId === area.id && c.activo !== false)
          if (search) {
            areaColabs = areaColabs.filter((c) => c.nombre.toLowerCase().includes(search.toLowerCase()))
          }

          if (search && areaColabs.length === 0) return null

          return (
            <div key={area.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              {/* Card Header */}
              <div className="p-5 bg-green-50/50 border-b border-green-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-xl text-green-600 shadow-sm">
                    <Sprout className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900 leading-tight">{area.nombre}</h4>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mt-0.5">
                      {sede?.nombre ?? 'Ubicación Desconocida'} {supervisor && `· Sup: ${supervisor.nombre}`}
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black">
                  {areaColabs.length} PERSONAL
                </span>
              </div>

              {/* Colaboradores List */}
              <div className="p-4 flex-1">
                {areaColabs.length === 0 ? (
                  <div className="py-10 text-center text-gray-400 text-sm font-medium italic">Sin personal asignado</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {areaColabs.map((c) => (
                      <div
                        key={c.id}
                        className={`group flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                          c.asignado
                            ? 'bg-blue-50/30 border-blue-100 text-blue-900'
                            : 'bg-gray-50/50 border-gray-100 text-gray-500'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg ${c.externo ? 'bg-purple-100 text-purple-600' : 'bg-white text-gray-400 shadow-xs'}`}>
                          {c.externo ? <Globe className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-xs truncate group-hover:text-green-700 transition-colors">{c.nombre}</p>
                          <div className="flex gap-1 mt-0.5">
                            {c.externo && <span className="text-[8px] font-black bg-purple-100 px-1 rounded">EXT</span>}
                            {!c.asignado && <span className="text-[8px] font-black bg-gray-200 px-1 rounded text-gray-500">LIBRE</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   TAB 3: Variedades por Bloque
───────────────────────────────────────────────────────────── */
function VariedadesView({ areas, bloques, variedades, variedadesBloques }: {
  areas: Area[]
  bloques: Bloque[]
  variedades: Variedad[]
  variedadesBloques: VariedadBloque[]
}) {
  const [search, setSearch] = useState('')
  const [filterArea, setFilterArea] = useState('')

  const filteredBloques = bloques.filter((b) => {
    const matchSearch = !search || b.nombre.toLowerCase().includes(search.toLowerCase())
    const matchArea = !filterArea || b.areaId === filterArea
    return matchSearch && matchArea
  })

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard icon={Flower2} label="Catálogo Variedades" value={variedades.length} color="pink" />
        <KpiCard icon={Layers} label="Bloques Activos" value={bloques.length} color="purple" />
        <KpiCard icon={Tag} label="Total Cultivos" value={variedadesBloques.length} color="green" />
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            placeholder="Filtrar por nombre de bloque..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-gray-50/50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-green-500 text-sm font-medium transition-all"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value)}
            className="w-full md:w-60 bg-gray-50/50 border-none ring-1 ring-gray-100 rounded-2xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-green-500 transition-all cursor-pointer"
          >
            <option value="">Todas las áreas</option>
            {areas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
        </div>
      </div>

      {/* Bloques Grid */}
      {filteredBloques.length === 0 ? (
        <EmptyState msg="No se encontraron bloques con los filtros aplicados" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredBloques.map((bloque) => {
            const area = areas.find((a) => a.id === bloque.areaId)
            const bloqueVarIds = variedadesBloques.filter((vb) => vb.bloqueId === bloque.id).map((vb) => vb.variedadId)
            const bloqueVars = variedades.filter((v) => bloqueVarIds.includes(v.id))

            return (
              <div key={bloque.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden">
                {/* Bloque Header */}
                <div className="p-5 bg-purple-50/50 border-b border-purple-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-white rounded-xl text-purple-600 shadow-sm">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-gray-900 truncate">{bloque.nombre}</h4>
                        <p className="text-[10px] font-black text-purple-400 uppercase tracking-tighter mt-0.5">{area?.nombre ?? 'Sin área'}</p>
                      </div>
                    </div>
                    <span className="shrink-0 w-7 h-7 bg-purple-600 text-white rounded-lg flex items-center justify-center text-xs font-black shadow-md shadow-purple-200">
                      {bloqueVars.length}
                    </span>
                  </div>
                </div>

                {/* Variedades Body */}
                <div className="p-5 flex-1">
                  {bloqueVars.length === 0 ? (
                    <div className="py-6 text-center text-gray-300 text-xs font-bold uppercase tracking-widest italic flex flex-col items-center gap-1">
                      <Flower2 className="w-5 h-5 opacity-20" />
                      Sin Cultivos
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {bloqueVars.map((v) => (
                        <div
                          key={v.id}
                          className="flex items-center gap-2 px-3 py-1.5 bg-pink-50 border border-pink-100 text-pink-700 rounded-xl text-xs font-black tracking-tight"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse"></div>
                          {v.nombre}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   Componentes Auxiliares con Diseño Moderno
───────────────────────────────────────────────────────────── */
function KpiCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue:   'bg-blue-50 text-blue-600 border-blue-100',
    green:  'bg-green-50 text-green-600 border-green-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    pink:   'bg-pink-50 text-pink-600 border-pink-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
  }

  return (
    <Card className={`relative overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300 p-5 ${colors[color]}`}>
      <div className="relative z-10">
        <p className="text-[10px] font-black uppercase tracking-wider opacity-70 mb-2">{label}</p>
        <p className="text-3xl font-black leading-none">{value}</p>
      </div>
      <Icon className="absolute -right-2 -bottom-2 w-16 h-16 opacity-10 rotate-12" />
    </Card>
  )
}

function EmptyState({ msg }: { msg: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white rounded-[2rem] border border-dashed border-gray-200">
      <div className="p-4 bg-gray-50 rounded-3xl mb-4">
        <Inbox className="w-12 h-12 opacity-20" />
      </div>
      <p className="text-sm font-bold text-gray-500">{msg}</p>
      <p className="text-xs text-gray-400 mt-1">Intenta ajustar los filtros o sincronizar los datos maestros.</p>
    </div>
  )
}
