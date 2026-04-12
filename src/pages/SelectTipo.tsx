import { useEffect, useState } from 'react'
import { useNavigationStore } from '../store/useNavigationStore'
import { useNavigation } from '../hooks/useNavigation'
import { getAreaById, getAllFormularios } from '../services/db'
import type { Area } from '../types'
import { Header } from '../components/layout/Header'
import { BottomNav } from '../components/layout/BottomNav'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'

export default function SelectTipo() {
  const { params } = useNavigationStore()
  const navigate = useNavigation()
  const areaId = params.areaId ? String(params.areaId) : undefined
  const sedeId = params.sedeId ? String(params.sedeId) : undefined

  const [area, setArea] = useState<Area | null>(null)
  const [loading, setLoading] = useState(true)
  const [completados, setCompletados] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function load() {
      if (!areaId) return
      const [areaData, allForms] = await Promise.all([
        getAreaById(decodeURIComponent(areaId)),
        getAllFormularios(),
      ])
      
      setArea(areaData ?? null)
      
      // Encontrar qué tipos ya están completados hoy en esta área
      const today = new Date().toISOString().slice(0, 10)
      const completedTypes = new Set<string>()
      allForms.forEach((f) => {
        if (
          f.areaId === decodeURIComponent(areaId) &&
          f.fecha === today &&
          f.estado === 'completo'
        ) {
          completedTypes.add(f.tipo)
        }
      })
      
      setCompletados(completedTypes)
      setLoading(false)
    }
    load()
  }, [areaId])

  const handleSelectTipo = (tipo: 'Corte' | 'Labores' | 'Aseguramiento') => {
    // Guardar tipo en sessionStorage para que el formulario lo lea
    sessionStorage.setItem('labores-tipo-actual', tipo)
    
    const formularioMap: Record<string, string> = {
      Corte: 'formulario-corte',
      Labores: 'formulario-labores',
      Aseguramiento: 'formulario-aseguramiento',
    }

    navigate(formularioMap[tipo], {
      areaId: areaId || '',
      sedeId: sedeId || '',
      tipo,
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!area) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 p-8 text-center">
        <p className="text-red-600">Error: No se encontró el área</p>
        <Button onClick={() => navigate('areas')}>Volver a Áreas</Button>
      </div>
    )
  }

  const tipos = ['Corte', 'Labores', 'Aseguramiento'] as const
  const allCompleted = tipos.every((t) => completados.has(t))

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header title={`Tipo de Registro · ${area.nombre}`} showBack />

      <main className="flex-1 overflow-y-auto p-4 pb-32">
        <div className="mx-auto max-w-2xl space-y-4 py-6">
          <div className="rounded-lg bg-white p-4 text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              ¿Qué tipo de formulario deseas completar?
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Selecciona uno. Puedes completar múltiples tipos en el mismo día.
            </p>
            {completados.size > 0 && (
              <p className="mt-3 text-xs text-green-600 font-medium">
                ✅ {completados.size} de 3 completado{completados.size !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          <div className="space-y-3">
            {/* Corte */}
            <button
              onClick={() => handleSelectTipo('Corte')}
              disabled={completados.has('Corte')}
              className={`w-full rounded-lg border-2 px-4 py-6 text-left transition-all ${
                completados.has('Corte')
                  ? 'border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed'
                  : 'border-orange-200 bg-orange-50 hover:border-orange-400 hover:bg-orange-100'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className={`font-semibold ${completados.has('Corte') ? 'text-gray-600' : 'text-orange-900'}`}>
                    {completados.has('Corte') ? '✅ Corte' : '🌾 Corte'}
                  </h3>
                  <p
                    className={`mt-1 text-sm ${
                      completados.has('Corte') ? 'text-gray-500' : 'text-orange-700'
                    }`}
                  >
                    {completados.has('Corte')
                      ? 'Completado hoy'
                      : 'Tiempos, tallos estimados y reales, rendimiento'}
                  </p>
                </div>
                <span className="text-2xl">{completados.has('Corte') ? '✓' : '→'}</span>
              </div>
            </button>

            {/* Labores */}
            <button
              onClick={() => handleSelectTipo('Labores')}
              disabled={completados.has('Labores')}
              className={`w-full rounded-lg border-2 px-4 py-6 text-left transition-all ${
                completados.has('Labores')
                  ? 'border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed'
                  : 'border-blue-200 bg-blue-50 hover:border-blue-400 hover:bg-blue-100'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className={`font-semibold ${completados.has('Labores') ? 'text-gray-600' : 'text-blue-900'}`}>
                    {completados.has('Labores') ? '✅ Labores' : '🌱 Labores'}
                  </h3>
                  <p
                    className={`mt-1 text-sm ${
                      completados.has('Labores') ? 'text-gray-500' : 'text-blue-700'
                    }`}
                  >
                    {completados.has('Labores')
                      ? 'Completado hoy'
                      : 'Labores por cama, camas y tiempos estimados/reales'}
                  </p>
                </div>
                <span className="text-2xl">{completados.has('Labores') ? '✓' : '→'}</span>
              </div>
            </button>

            {/* Aseguramiento */}
            <button
              onClick={() => handleSelectTipo('Aseguramiento')}
              disabled={completados.has('Aseguramiento')}
              className={`w-full rounded-lg border-2 px-4 py-6 text-left transition-all ${
                completados.has('Aseguramiento')
                  ? 'border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed'
                  : 'border-green-200 bg-green-50 hover:border-green-400 hover:bg-green-100'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3
                    className={`font-semibold ${completados.has('Aseguramiento') ? 'text-gray-600' : 'text-green-900'}`}
                  >
                    {completados.has('Aseguramiento') ? '✅ Aseguramiento' : '✅ Aseguramiento'}
                  </h3>
                  <p
                    className={`mt-1 text-sm ${
                      completados.has('Aseguramiento') ? 'text-gray-500' : 'text-green-700'
                    }`}
                  >
                    {completados.has('Aseguramiento')
                      ? 'Completado hoy'
                      : 'Proceso, seguridad, calidad y observaciones finales'}
                  </p>
                </div>
                <span className="text-2xl">{completados.has('Aseguramiento') ? '✓' : '→'}</span>
              </div>
            </button>
          </div>

          <div className={`rounded-lg border p-4 ${
            allCompleted ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
          }`}>
            <p className={`text-sm ${allCompleted ? 'text-green-900' : 'text-blue-900'}`}>
              <strong>{allCompleted ? '🎉 ¡Excelente!' : '💡 Tip:'}</strong> {
                allCompleted
                  ? 'Has completado los 3 tipos. Puedes ver tus registros o continuar editando.'
                  : 'Puedes completar múltiples tipos. Cuando hayas completado todos los necesarios hoy, se sincronizarán juntos a la base de datos.'
              }
            </p>
          </div>
        </div>
      </main>

      {/* Bottom action bar */}
      {completados.size > 0 && (
        <div className="fixed bottom-16 inset-x-0 px-4 py-3 bg-white border-t border-gray-200 shadow-lg">
          <Button
            className="w-full"
            size="lg"
            onClick={() => {
              sessionStorage.removeItem('labores-selecciones')
              sessionStorage.removeItem('labores-tipo-actual')
              navigate('historial')
            }}
          >
            {allCompleted ? 'Ver todos mis registros' : `Ver registros (${completados.size} completado${completados.size !== 1 ? 's' : ''})`}
          </Button>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
