import { useNavigate } from 'react-router-dom'
import { useAreas } from '../hooks/useAreas'
import { Header } from '../components/layout/Header'
import { BottomNav } from '../components/layout/BottomNav'
import { Card } from '../components/ui/Card'
import { Spinner } from '../components/ui/Spinner'

export default function AreaSelector() {
  const { areas, loading, error } = useAreas()
  const navigate = useNavigate()

  const activeAreas = areas.filter((a) => a.activo !== false)

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header title="Labores Tandil" showSync />

      <main className="flex-1 px-4 py-6 pb-24">
        <h1 className="mb-1 text-xl font-bold text-gray-900">Seleccionar Área</h1>
        <p className="mb-6 text-sm text-gray-500">Elige el área de trabajo para registrar labores</p>

        {loading && (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && activeAreas.length === 0 && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
            No hay áreas disponibles. Verifica tu conexión a internet para sincronizar.
          </div>
        )}

        <div className="grid gap-3">
          {activeAreas.map((area) => (
            <Card
              key={area.id}
              onClick={() => navigate(`/area/${encodeURIComponent(area.id)}`)}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-xl">
                  🌱
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{area.nombre}</p>
                  {area.sedeId && (
                    <p className="text-xs text-gray-500">Sede: {area.sedeId}</p>
                  )}
                </div>
                <svg
                  className="ml-auto h-5 w-5 flex-shrink-0 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Card>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
