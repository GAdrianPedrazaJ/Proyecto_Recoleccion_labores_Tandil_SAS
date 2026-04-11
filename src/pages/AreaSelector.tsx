import { useNavigation } from '../hooks/useNavigation'
import { useNavigationStore } from '../store/useNavigationStore'
import { useAreas } from '../hooks/useAreas'
import { useSedes } from '../hooks/useSedes'
import { Header } from '../components/layout/Header'
import { BottomNav } from '../components/layout/BottomNav'
import { Card } from '../components/ui/Card'
import { Spinner } from '../components/ui/Spinner'

export default function AreaSelector() {
  const { areas, loading: areasLoading, error: areasError } = useAreas()
  const { sedes, loading: sedesLoading, error: sedesError } = useSedes()
  const navigate = useNavigation()
  const { params, back } = useNavigationStore()

  // Determinar si estamos en modo sedes o áreas
  const sedeId = params.sedeId as string | undefined
  const showSedes = !sedeId

  // Filtrar sedes activas
  const activeSedes = sedes

  // Filtrar áreas activas y por sede
  const activeAreas = areas.filter((a) => {
    if (a.activo === false) return false
    if (sedeId && a.sedeId !== sedeId) return false
    return true
  })

  // Encontrar el nombre de la sede actual
  const currentSede = sedeId ? sedes.find((s) => s.id === sedeId) : null

  if (showSedes) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Header title="Labores Tandil" />

        <main className="flex-1 px-4 py-6 pb-24">
          <h1 className="mb-1 text-xl font-bold text-gray-900">Seleccionar Sede</h1>
          <p className="mb-6 text-sm text-gray-500">Elige la sede para registrar labores</p>

          {sedesLoading && (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          )}

          {!sedesLoading && sedesError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {sedesError}
            </div>
          )}

          {!sedesLoading && !sedesError && activeSedes.length === 0 && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
              No hay sedes disponibles. Verifica tu conexión a internet para sincronizar.
            </div>
          )}

          <div className="grid gap-3">
            {activeSedes.map((sede) => (
              <Card key={sede.id} onClick={() => navigate('areas', { sedeId: sede.id })}>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xl">
                    🏢
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{sede.nombre}</p>
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

  // Modo Áreas (cuando ya hay sedeId seleccionada)
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header title="Labores Tandil" />

      <main className="flex-1 px-4 py-6 pb-24">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="mb-1 text-xl font-bold text-gray-900">Seleccionar Área</h1>
            {currentSede && (
              <p className="text-sm text-gray-500">Sede: {currentSede.nombre}</p>
            )}
          </div>
          <button
            onClick={back}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Cambiar sede
          </button>
        </div>

        {areasLoading && (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {!areasLoading && areasError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {areasError}
          </div>
        )}

        {!areasLoading && !areasError && activeAreas.length === 0 && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
            No hay áreas disponibles en esta sede. Verifica tu conexión a internet para sincronizar.
          </div>
        )}

        <div className="grid gap-3">
          {activeAreas.map((area) => (
            <Card
              key={area.id}
              onClick={() => navigate('area-detail', { areaId: area.id, sedeId })}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-xl">
                  🌱
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{area.nombre}</p>
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
