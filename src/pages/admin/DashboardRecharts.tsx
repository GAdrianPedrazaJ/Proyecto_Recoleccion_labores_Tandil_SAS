import { useEffect, useState } from 'react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getCorteData, getLaboresData, getAseguramientoData, getStatsPorArea, getStatsPorColaborador, getKPIData, type DashDataCorte, type DashDataLabores, type DashDataAseguramiento, type StatsPorArea, type StatsPorColaborador } from '../../services/dashboard'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import { Card } from '../../components/ui/Card'

function daysAgoIso(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}

function todayIso(): string {
  return new Date().toISOString().split('T')[0]
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6']

export default function DashboardWithRecharts() {
  const [corteData, setCorteData] = useState<DashDataCorte[]>([])
  const [laboresData, setLaboresData] = useState<DashDataLabores[]>([])
  const [asegData, setAsegData] = useState<DashDataAseguramiento[]>([])
  const [statsPorArea, setStatsPorArea] = useState<StatsPorArea[]>([])
  const [stasPorColab, setStatsPorColab] = useState<StatsPorColaborador[]>([])
  const [kpis, setKpis] = useState({ totalRegistros: 0, promRendimiento: 0, promCumplimiento: 0, totalHoras: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dias, setDias] = useState(28)

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      const desde = daysAgoIso(dias)
      const hasta = todayIso()

      const [corte, labores, aseg, areas, colab, kpiData] = await Promise.all([
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
      setStatsPorArea(areas)
      setStatsPorColab(colab)
      setKpis(kpiData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [dias])

  if (loading) return <AdminLayout><div className="flex justify-center items-center h-screen"><Spinner /></div></AdminLayout>

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header & Controls */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Analítico</h1>
            <p className="text-sm text-gray-500 mt-1">Métricas de Corte, Labores y Aseguramiento</p>
          </div>
          <div className="flex gap-2">
            {[7, 14, 28, 60].map(d => (
              <Button key={d} onClick={() => setDias(d)} variant={dias === d ? 'primary' : 'secondary'}>
                {d}d
              </Button>
            ))}
            <Button onClick={loadData} variant="primary">↻ Actualizar</Button>
          </div>
        </div>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="text-sm text-gray-500 font-semibold">Total Registros</div>
            <div className="text-3xl font-bold text-blue-600 mt-2">{kpis.totalRegistros}</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-gray-500 font-semibold">Prom Rendimiento</div>
            <div className="text-3xl font-bold text-green-600 mt-2">{kpis.promRendimiento}%</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-gray-500 font-semibold">Prom Cumplimiento</div>
            <div className="text-3xl font-bold text-yellow-600 mt-2">{kpis.promCumplimiento}%</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-gray-500 font-semibold">Total Horas</div>
            <div className="text-3xl font-bold text-purple-600 mt-2">{kpis.totalHoras}</div>
          </Card>
        </div>

        {/* Gráficas Principales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Gráfica Rendimiento Corte */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Rendimiento Corte por Fecha</h3>
            {corteData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={corteData.slice(-15)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="rendimiento" stroke="#3b82f6" dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <p className="text-gray-400 text-center py-8">No hay datos</p>}
          </Card>

          {/* Gráfica Cumplimiento Aseguramiento */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">% Cumplimiento Aseguramiento</h3>
            {asegData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={asegData.slice(-15)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="cumplimiento" stroke="#10b981" dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <p className="text-gray-400 text-center py-8">No hay datos</p>}
          </Card>
        </div>

        {/* Estadísticas por Área */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Registros por Área</h3>
            {statsPorArea.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statsPorArea}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="area" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalFormularios" fill="#3b82f6" />
                  <Bar dataKey="promRendimiento" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-gray-400 text-center py-8">No hay datos</p>}
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Rendimiento Labores por Tipo</h3>
            {laboresData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Labor 1', value: laboresData.filter(l => l.numeroLabor === 1).length },
                      { name: 'Labor 2', value: laboresData.filter(l => l.numeroLabor === 2).length },
                      { name: 'Labor 3', value: laboresData.filter(l => l.numeroLabor === 3).length },
                      { name: 'Labor 4', value: laboresData.filter(l => l.numeroLabor === 4).length },
                      { name: 'Labor 5', value: laboresData.filter(l => l.numeroLabor === 5).length },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#3b82f6"
                    dataKey="value"
                  >
                    {COLORS.map((color, idx) => (
                      <Cell key={`cell-${idx}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-gray-400 text-center py-8">No hay datos</p>}
          </Card>
        </div>

        {/* Tabla: Top Colaboradores */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Top 10 Colaboradores</h3>
          {stasPorColab.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b-2 border-gray-200">
                  <tr>
                    <th className="text-left py-2">Colaborador</th>
                    <th className="text-right py-2">Registros</th>
                    <th className="text-right py-2">Prom Rendimiento</th>
                    <th className="text-right py-2">Prom Cumplimiento</th>
                  </tr>
                </thead>
                <tbody>
                  {stasPorColab.slice(0, 10).map((c, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 font-medium">{c.colaborador}</td>
                      <td className="text-right py-3">{c.totalRegistros}</td>
                      <td className="text-right py-3 text-blue-600">{c.promRendimiento}%</td>
                      <td className="text-right py-3 text-green-600">{c.promCumplimiento}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-gray-400 text-center py-8">No hay datos</p>}
        </Card>
      </div>
    </AdminLayout>
  )
}
