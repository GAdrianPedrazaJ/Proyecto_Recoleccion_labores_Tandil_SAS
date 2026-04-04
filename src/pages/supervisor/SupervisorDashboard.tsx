import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'
import { countRegistrosHoy } from '../../services/db'
import { todayIsoDate } from '../../utils/helpers'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { useOffline } from '../../hooks/useOffline'

export function SupervisorDashboard() {
  const usuario = useAppStore((s) => s.usuarioActual)
  const { pendingCount } = useOffline()
  const [hoy, setHoy] = useState(0)

  useEffect(() => {
    void countRegistrosHoy(todayIsoDate()).then(setHoy)
  }, [])

  return (
    <div className="space-y-6 px-4 py-4">
      <div>
        <p className="text-sm text-gray-600">Fecha de hoy</p>
        <p className="text-lg font-semibold text-ink">{todayIsoDate()}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-600">Registros hoy</p>
          <p className="text-2xl font-bold text-primary">{hoy}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-600">Pendientes sync</p>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
            {pendingCount > 0 ? (
              <Badge tone="warning">Pendiente</Badge>
            ) : null}
          </div>
        </div>
      </div>
      <Link to="/supervisor/nuevo" className="block">
        <Button type="button" className="!min-h-14 w-full text-base">
          ➕ Nuevo registro
        </Button>
      </Link>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          to="/supervisor/pendientes"
          className="rounded-2xl border border-gray-200 bg-white p-4 text-center font-medium text-primary shadow-sm"
        >
          Pendientes de sincronizar
        </Link>
        <Link
          to="/supervisor/historial"
          className="rounded-2xl border border-gray-200 bg-white p-4 text-center font-medium text-primary shadow-sm"
        >
          Historial
        </Link>
      </div>
      <p className="text-center text-xs text-gray-500">
        Conectado como {usuario?.nombre ?? '—'}
      </p>
    </div>
  )
}
