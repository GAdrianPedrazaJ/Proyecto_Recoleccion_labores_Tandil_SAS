import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/useAuthStore'
import { getAllColaboradores, getAllFormularios } from '../../services/db'
import type { Colaborador } from '../../types'
import { Header } from '../../components/layout/Header'
import { BottomNav } from '../../components/layout/BottomNav'
import { Spinner } from '../../components/ui/Spinner'
import { Card } from '../../components/ui/Card'

interface ColaboradorStats {
  colaborador: Colaborador
  registrosTotal: number
  registrosPendientes: number
  registrosSincronizados: number
  ultimoRegistro?: Date
}

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
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Obtener colaboradores asignados a este supervisor
      const todosColaboradores = await getAllColaboradores()
      const colaboradores = todosColaboradores.filter((c) => c.supervisorId === usuario?.id)

      // Obtener todos los formularios para calcular estadísticas
      const formularios = await getAllFormularios()

      // Calcular estadísticas por colaborador
      const colaboradorStats: ColaboradorStats[] = colaboradores.map((colab: Colaborador) => {
        // Filtrar formularios de este colaborador
        const formulariosByColaborador = formularios.filter(
          (f: any) => f.supervisorId === usuario?.id && f.colaboradorId === colab.id,
        )

        const pendientes = formulariosByColaborador.filter((f: any) => !f.sincronizado).length
        const sincronizados = formulariosByColaborador.filter((f: any) => f.sincronizado).length

        const ultimoRegistro = formulariosByColaborador.length > 0
          ? new Date(
              Math.max(
                ...formulariosByColaborador
                  .map((f: any) => new Date(f.fecha || 0).getTime())
                  .filter((t: number) => t > 0),
              ),
            )
          : undefined

        return {
          colaborador: colab,
          registrosTotal: formulariosByColaborador.length,
          registrosPendientes: pendientes,
          registrosSincronizados: sincronizados,
          ultimoRegistro,
        }
      })

      setStats(colaboradorStats)

      // Calcular totales
      const totalRegistros = colaboradorStats.reduce((sum, s) => sum + s.registrosTotal, 0)
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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    )
  }

  const completionPercent =
    totalStats.registrosTotal > 0
      ? Math.round((totalStats.registrosSincronizados / totalStats.registrosTotal) * 100)
      : 0

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <Header title="Gestionar Colaboradores" />

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
            {stats
              .sort((a, b) => b.registrosPendientes - a.registrosPendientes)
              .map((stat) => {
                const percent =
                  stat.registrosTotal > 0
                    ? Math.round((stat.registrosSincronizados / stat.registrosTotal) * 100)
                    : 0

                return (
                  <Card
                    key={stat.colaborador.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <div className="space-y-3">
                      {/* Name and last update */}
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{stat.colaborador.nombre}</p>
                          {stat.ultimoRegistro && (
                            <p className="text-xs text-gray-500">
                              Último: {stat.ultimoRegistro.toLocaleDateString('es-AR')}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">{percent}%</p>
                          <p className="text-xs text-gray-500">
                            {stat.registrosSincronizados}/{stat.registrosTotal}
                          </p>
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

                      {/* Stats row */}
                      <div className="flex gap-2 text-xs">
                        {stat.registrosPendientes > 0 && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded">
                            ⏳ {stat.registrosPendientes} pendiente{stat.registrosPendientes !== 1 ? 's' : ''}
                          </span>
                        )}
                        {stat.registrosSincronizados > 0 && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                            ✓ {stat.registrosSincronizados} sync
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No tienes colaboradores asignados</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
