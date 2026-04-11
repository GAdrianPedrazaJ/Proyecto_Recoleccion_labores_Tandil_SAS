import { useEffect, useState } from 'react'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { getAllSedes, getAllAreas, getAllBloques, getAllColaboradores, getAllVariedades, getAllVariedadesBloques, getAllSupervisores } from '../../services/db'
import type { Sede, Area, Bloque, Colaborador, Variedad, VariedadBloque, Supervisor } from '../../types'
import { Spinner } from '../../components/ui/Spinner'

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

  const TABS: { key: TabKey; label: string; icon: string }[] = [
    { key: 'estructura',    label: 'Sedes → Áreas → Bloques', icon: '🏢' },
    { key: 'colaboradores', label: 'Colaboradores por Área',   icon: '👥' },
    { key: 'variedades',    label: 'Variedades por Bloque',    icon: '🌸' },
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Asignaciones</h1>
          <p className="text-sm text-gray-500 mt-1">Estructura jerárquica y asignaciones del sistema</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 overflow-x-auto pb-px">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-green-600 text-green-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            {tab === 'estructura' && (
              <EstructuraView sedes={sedes} areas={areas} bloques={bloques} supervisores={supervisores} />
            )}
            {tab === 'colaboradores' && (
              <ColaboradoresView sedes={sedes} areas={areas} colaboradores={colaboradores} supervisores={supervisores} />
            )}
            {tab === 'variedades' && (
              <VariedadesView areas={areas} bloques={bloques} variedades={variedades} variedadesBloques={variedadesBloques} />
            )}
          </>
        )}
      </div>
    </AdminLayout>
  )
}

/* ─────────────────────────────────────────────────────────────
   TAB 1: Sedes → Áreas → Bloques
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
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <KpiCard icon="🏢" label="Sedes"  value={sedes.length}  color="blue" />
        <KpiCard icon="🌱" label="Áreas"  value={areas.length}  color="green" />
        <KpiCard icon="🔲" label="Bloques" value={bloques.length} color="purple" />
      </div>

      {/* Árbol */}
      <div className="space-y-3">
        {sedes.map((sede) => {
          const sedeAreas = areas.filter((a) => a.sedeId === sede.id)
          const isSedeOpen = openSedes.has(sede.id)
          return (
            <div key={sede.id} className="border border-blue-200 rounded-xl overflow-hidden">
              {/* Sede header */}
              <button
                onClick={() => toggleSede(sede.id)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 hover:bg-blue-100 transition-colors text-left"
              >
                <span className="text-xl">🏢</span>
                <div className="flex-1">
                  <span className="font-semibold text-blue-900">{sede.nombre}</span>
                  <span className="ml-2 text-xs text-blue-500">{sedeAreas.length} áreas</span>
                </div>
                <ChevronIcon open={isSedeOpen} />
              </button>

              {isSedeOpen && (
                <div className="divide-y divide-gray-100">
                  {sedeAreas.length === 0 && (
                    <p className="px-8 py-3 text-sm text-gray-400 italic">Sin áreas asignadas</p>
                  )}
                  {sedeAreas.map((area) => {
                    const areaBloques = bloques.filter((b) => b.areaId === area.id)
                    const supervisor = supervisores.find((s) => s.id === area.supervisorId)
                    const isAreaOpen = openAreas.has(area.id)
                    return (
                      <div key={area.id} className="bg-white">
                        {/* Área header */}
                        <button
                          onClick={() => toggleArea(area.id)}
                          className="w-full flex items-center gap-3 px-6 py-2.5 hover:bg-gray-50 transition-colors text-left"
                        >
                          <span className="text-base">🌱</span>
                          <div className="flex-1">
                            <span className="font-medium text-gray-800">{area.nombre}</span>
                            {supervisor && (
                              <span className="ml-2 text-xs text-gray-400">· Sup: {supervisor.nombre}</span>
                            )}
                            <span className="ml-2 text-xs text-gray-400">{areaBloques.length} bloques</span>
                          </div>
                          {!area.activo && (
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Inactiva</span>
                          )}
                          <ChevronIcon open={isAreaOpen} size="sm" />
                        </button>

                        {isAreaOpen && areaBloques.length > 0 && (
                          <div className="px-10 pb-3 flex flex-wrap gap-2">
                            {areaBloques.map((b) => (
                              <span
                                key={b.id}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 border border-purple-200 text-purple-800 rounded-full text-xs font-medium"
                              >
                                🔲 {b.nombre}
                              </span>
                            ))}
                          </div>
                        )}
                        {isAreaOpen && areaBloques.length === 0 && (
                          <p className="px-10 pb-3 text-xs text-gray-400 italic">Sin bloques</p>
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
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <KpiCard icon="👥" label="Colaboradores" value={colaboradores.filter((c) => c.activo !== false).length} color="green" />
        <KpiCard icon="✅" label="Asignados"     value={totalAsignados}  color="blue" />
        <KpiCard icon="🔗" label="Externos"      value={totalExternos}   color="orange" />
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Buscar colaborador..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        />
        <select
          value={filterSede}
          onChange={(e) => setFilterSede(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        >
          <option value="">Todas las sedes</option>
          {sedes.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </select>
      </div>

      {/* Áreas con colaboradores */}
      <div className="space-y-3">
        {filteredAreas.map((area) => {
          const supervisor = supervisores.find((s) => s.id === area.supervisorId)
          const sede = sedes.find((s) => s.id === area.sedeId)
          let areaColabs = colaboradores.filter((c) => c.areaId === area.id && c.activo !== false)
          if (search) {
            areaColabs = areaColabs.filter((c) => c.nombre.toLowerCase().includes(search.toLowerCase()))
          }

          if (search && areaColabs.length === 0) return null

          return (
            <div key={area.id} className="border border-gray-200 rounded-xl overflow-hidden">
              {/* Header área */}
              <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border-b border-green-100">
                <span className="text-xl">🌱</span>
                <div className="flex-1">
                  <p className="font-semibold text-green-900">{area.nombre}</p>
                  <p className="text-xs text-green-600">
                    {sede?.nombre ?? '—'}
                    {supervisor && <> · Supervisor: {supervisor.nombre}</>}
                  </p>
                </div>
                <span className="text-xs font-medium bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
                  {areaColabs.length} colaboradores
                </span>
              </div>

              {/* Colaboradores */}
              {areaColabs.length === 0 ? (
                <p className="px-5 py-4 text-sm text-gray-400 italic">Sin colaboradores asignados</p>
              ) : (
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {areaColabs.map((c) => (
                    <div
                      key={c.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${
                        c.asignado
                          ? 'bg-blue-50 border-blue-200 text-blue-800'
                          : 'bg-gray-50 border-gray-200 text-gray-600'
                      }`}
                    >
                      <span>{c.externo ? '🔗' : '👤'}</span>
                      <span className="flex-1 truncate font-medium">{c.nombre}</span>
                      {c.externo && (
                        <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">Ext</span>
                      )}
                      {!c.asignado && (
                        <span className="text-xs bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">Libre</span>
                      )}
                    </div>
                  ))}
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
    if (filterArea && b.areaId !== filterArea) return false
    if (search && !b.nombre.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const totalAsignaciones = variedadesBloques.length

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <KpiCard icon="🌸" label="Variedades"    value={variedades.length}      color="pink" />
        <KpiCard icon="🔲" label="Bloques"        value={bloques.length}         color="purple" />
        <KpiCard icon="🔗" label="Asignaciones"  value={totalAsignaciones}       color="green" />
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Buscar bloque..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        />
        <select
          value={filterArea}
          onChange={(e) => setFilterArea(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        >
          <option value="">Todas las áreas</option>
          {areas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
        </select>
      </div>

      {/* Bloques con variedades */}
      {filteredBloques.length === 0 ? (
        <EmptyState msg="No hay bloques que coincidan" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredBloques.map((bloque) => {
            const area = areas.find((a) => a.id === bloque.areaId)
            const bloqueVarIds = variedadesBloques.filter((vb) => vb.bloqueId === bloque.id).map((vb) => vb.variedadId)
            const bloqueVars = variedades.filter((v) => bloqueVarIds.includes(v.id))

            return (
              <div key={bloque.id} className="border border-purple-200 rounded-xl overflow-hidden">
                {/* Bloque header */}
                <div className="flex items-center gap-2 px-4 py-2.5 bg-purple-50 border-b border-purple-100">
                  <span>🔲</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-purple-900 truncate">{bloque.nombre}</p>
                    {area && <p className="text-xs text-purple-500 truncate">{area.nombre}</p>}
                  </div>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full shrink-0">
                    {bloqueVars.length}
                  </span>
                </div>

                {/* Variedades */}
                <div className="p-3">
                  {bloqueVars.length === 0 ? (
                    <p className="text-xs text-gray-400 italic px-1">Sin variedades asignadas</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {bloqueVars.map((v) => (
                        <span
                          key={v.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-pink-50 border border-pink-200 text-pink-800 rounded-full text-xs font-medium"
                        >
                          🌸 {v.nombre}
                        </span>
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
   Componentes auxiliares
───────────────────────────────────────────────────────────── */
function KpiCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue:   'bg-blue-50 border-blue-200 text-blue-700',
    green:  'bg-green-50 border-green-200 text-green-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    pink:   'bg-pink-50 border-pink-200 text-pink-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
  }
  return (
    <div className={`border rounded-xl p-4 flex items-center gap-3 ${colors[color] ?? colors.blue}`}>
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="text-xs mt-0.5 opacity-75">{label}</p>
      </div>
    </div>
  )
}

function ChevronIcon({ open, size = 'md' }: { open: boolean; size?: 'sm' | 'md' }) {
  return (
    <svg
      className={`transition-transform ${open ? 'rotate-180' : ''} ${size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-gray-400 shrink-0`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function EmptyState({ msg }: { msg: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <span className="text-4xl mb-3">📭</span>
      <p className="text-sm">{msg}. Asegúrate de haber sincronizado los datos.</p>
    </div>
  )
}
