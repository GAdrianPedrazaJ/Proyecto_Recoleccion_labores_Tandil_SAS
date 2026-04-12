import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/useAuthStore'
import { getSupervisorColaboradorStats } from '../../services/dashboard'
import type { ColaboradorStats } from '../../services/dashboard'
import { Header } from '../../components/layout/Header'
import { BottomNav } from '../../components/layout/BottomNav'
import { Spinner } from '../../components/ui/Spinner'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'

export default function SupervisorGestionar() {
  const usuario = useAuthStore((s) => s.usuario)
  const [stats, setStats] = useState<ColaboradorStats[]>([])
  const [loading, setLoading] = useState(true)
  const [totalStats, setTotalStats] = useState({
    colaboradores: 0,
    registrosTotal: 0,
    registrosPendientes: 0,
    registrosSincronizados: 0,
  })

  useEffect(() => {
    loadData()
  }, [usuario?.id])

  const loadData = async () => {
    try {
      setLoading(true)

      if (!usuario?.id) {
        setLoading(false)
        return
      }

      // Obtener estadísticas por colaborador para este supervisor
      const colaboradorStats = await getSupervisorColaboradorStats(usuario.id)
      setStats(colaboradorStats)

      // Calcular totales
      const totalRegistros = colaboradorStats.reduce((sum, s) => sum + s.registrosTotales, 0)
      const totalPendientes = colaboradorStats.reduce((sum, s) => sum + s.registrosPendientes, 0)
      const totalSincronizados = colaboradorStats.reduce((sum, s) => sum + s.registrosSincronizados, 0)

      setTotalStats({
        colaboradores: colaboradorStats.length,
        registrosTotal: totalRegistros,
        registrosPendientes: totalPendientes,
        registrosSincronizados: totalSincronizados,
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const completionPercent =
    totalStats.registrosTotal > 0
      ? Math.round((totalStats.registrosSincronizados / totalStats.registrosTotal) * 100)
      : 0

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <Header title="Gestionar Colaboradores" showBack />

      <div className="flex-1 px-4 py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="text-center space-y-2">
              <p className="text-xs text-blue-700 font-medium">Colaboradores</p>
              <p className="text-2xl font-bold text-blue-900">{totalStats.colaboradores}</p>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="text-center space-y-2">
              <p className="text-xs text-green-700 font-medium">Registros Totales</p>
              <p className="text-2xl font-bold text-green-900">{totalStats.registrosTotal}</p>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <div className="text-center space-y-2">
              <p className="text-xs text-orange-700 font-medium">Pendientes</p>
              <p className="text-2xl font-bold text-orange-900">{totalStats.registrosPendientes}</p>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="text-center space-y-2">
              <p className="text-xs text-purple-700 font-medium">Sincronizados</p>
              <p className="text-2xl font-bold text-purple-900">{totalStats.registrosSincronizados}</p>
            </div>
          </Card>
        </div>

        {/* Completion Progress */}
        <Card>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">Progreso General</p>
              <p className="text-sm font-bold text-green-600">{completionPercent}%</p>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-300"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Colaboradores List */}
        {stats.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Detalle por Colaborador</h3>
            {stats.map((stat) => {
              const percent =
                stat.registrosTotales > 0
                  ? Math.round((stat.registrosSincronizados / stat.registrosTotales) * 100)
                  : 0

              const estadoColor = {
                'Sin registros': 'bg-gray-100 text-gray-700',
                'Hoy': 'bg-green-100 text-green-700',
                'Últimos 7 días': 'bg-blue-100 text-blue-700',
                'Inactivo': 'bg-orange-100 text-orange-700',
              }[stat.estadoActividad]

              return (
                <Card key={stat.colaboradorId} className="hover:shadow-md transition-shadow">
                  <div className="space-y-3">
                    {/* Name and status */}
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{stat.colaboradorNombre}</p>
                        <p className="text-xs text-gray-500">{stat.area}</p>
                        {stat.ultimoRegistro && (
                          <p className="text-xs text-gray-500 mt-1">
                            Último: {new Date(stat.ultimoRegistro).toLocaleDateString('es-AR')}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">{percent}%</p>
                        <p className="text-xs text-gray-500">
                          {stat.registrosSincronizados}/{stat.registrosTotales}
                        </p>
                        <span className={`inline-block px-2 py-1 text-xs rounded mt-1 ${estadoColor}`}>
                          {stat.estadoActividad}
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          percent === 100
                            ? 'bg-green-500'
                            : percent >= 75
                              ? 'bg-blue-500'
                              : percent >= 50
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-orange-50 p-2 rounded text-center">
                        <p className="text-orange-700 font-medium">{stat.registrosPendientes}</p>
                        <p className="text-orange-600 text-xs">Pendientes</p>
                      </div>
                      <div className="bg-green-50 p-2 rounded text-center">
                        <p className="text-green-700 font-medium">{stat.registrosSincronizados}</p>
                        <p className="text-green-600 text-xs">Sync</p>
                      </div>
                      <div className="bg-blue-50 p-2 rounded text-center">
                        <p className="text-blue-700 font-medium">{stat.registrosTotales}</p>
                        <p className="text-blue-600 text-xs">Total</p>
                      </div>
                    </div>

                    {/* Type breakdown */}
                    {stat.registrosTotales > 0 && (
                      <div className="flex gap-1 text-xs">
                        {stat.registrosCorte > 0 && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                            🌾 {stat.registrosCorte}
                          </span>
                        )}
                        {stat.registrosLabores > 0 && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                            🌱 {stat.registrosLabores}
                          </span>
                        )}
                        {stat.registrosAseguramiento > 0 && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                            ✓ {stat.registrosAseguramiento}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No tienes colaboradores asignados</p>
            <Button className="mt-4" onClick={loadData}>
              Recargar
            </Button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
