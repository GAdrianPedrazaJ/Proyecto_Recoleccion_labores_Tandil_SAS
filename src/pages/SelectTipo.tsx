import { useEffect, useState } from 'react'
import { useNavigationStore } from '../store/useNavigationStore'
import { useNavigation } from '../hooks/useNavigation'
import { getAreaById } from '../services/db'
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

  useEffect(() => {
    async function load() {
      if (!areaId) return
      const areaData = await getAreaById(decodeURIComponent(areaId))
      setArea(areaData ?? null)
      setLoading(false)
    }
    load()
  }, [areaId])

  const handleSelectTipo = (tipo: 'Corte' | 'Labores' | 'Aseguramiento') => {
    // Guardar tipo en sessionStorage para que el formulario lo lea
    sessionStorage.setItem('labores-tipo-actual', tipo)
    
    // Determinar qué formulario abrir según el tipo
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

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header title={`Tipo de Registro · ${area.nombre}`} showBack />

      <main className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-2xl space-y-4 py-6">
          <div className="rounded-lg bg-white p-4 text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              ¿Qué tipo de formulario deseas completar?
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Selecciona uno. Puedes completar múltiples tipos en el mismo día.
            </p>
          </div>

          <div className="space-y-3">
            {/* Corte */}
            <button
              onClick={() => handleSelectTipo('Corte')}
              className="w-full rounded-lg border-2 border-orange-200 bg-orange-50 px-4 py-6 text-left transition-all hover:border-orange-400 hover:bg-orange-100"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-orange-900">🌾 Corte</h3>
                  <p className="mt-1 text-sm text-orange-700">
                    Tiempos, tallos estimados y reales, rendimiento
                  </p>
                </div>
                <span className="text-2xl">→</span>
              </div>
            </button>

            {/* Labores */}
            <button
              onClick={() => handleSelectTipo('Labores')}
              className="w-full rounded-lg border-2 border-blue-200 bg-blue-50 px-4 py-6 text-left transition-all hover:border-blue-400 hover:bg-blue-100"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-blue-900">🌱 Labores</h3>
                  <p className="mt-1 text-sm text-blue-700">
                    Labores por cama, camas y tiempos estimados/reales
                  </p>
                </div>
                <span className="text-2xl">→</span>
              </div>
            </button>

            {/* Aseguramiento */}
            <button
              onClick={() => handleSelectTipo('Aseguramiento')}
              className="w-full rounded-lg border-2 border-green-200 bg-green-50 px-4 py-6 text-left transition-all hover:border-green-400 hover:bg-green-100"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-green-900">✅ Aseguramiento</h3>
                  <p className="mt-1 text-sm text-green-700">
                    Proceso, seguridad, calidad y observaciones finales
                  </p>
                </div>
                <span className="text-2xl">→</span>
              </div>
            </button>
          </div>

          <div className="mt-8 rounded-lg bg-blue-50 border border-blue-200 p-4">
            <p className="text-sm text-blue-900">
              <strong>💡 Tip:</strong> Puedes completar múltiples tipos. Cuando hayas completado todos los necesarios hoy, se sincronizarán juntos a la base de datos.
            </p>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
