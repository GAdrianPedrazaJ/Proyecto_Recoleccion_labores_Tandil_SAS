import { useEffect, useState } from 'react'
import type { RegistroColaborador } from '../../types'
import { getAllRegistros, getAllAreas } from '../../services/db'
import { syncPendientes } from '../../services/sync'
import type { Area } from '../../types'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { useAppStore } from '../../store/useAppStore'

export function PendientesPage() {
  const [rows, setRows] = useState<RegistroColaborador[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [busy, setBusy] = useState(false)
  const isOnline = useAppStore((s) => s.isOnline)

  const load = async () => {
    const [all, ar] = await Promise.all([getAllRegistros(), getAllAreas()])
    setAreas(ar)
    setRows(all.filter((r) => !r.sincronizado))
  }

  useEffect(() => {
    void load()
  }, [])

  const areaNombre = (id: string) =>
    areas.find((a) => a.id === id)?.nombre ?? '—'

  const runSync = async () => {
    setBusy(true)
    try {
      await syncPendientes()
    } finally {
      setBusy(false)
      void load()
      window.dispatchEvent(new CustomEvent('labores:sync'))
    }
  }

  return (
    <div className="space-y-4 px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-ink">Pendientes</h1>
        {isOnline ? (
          <Button type="button" disabled={busy} onClick={() => void runSync()}>
            Sincronizar todos
          </Button>
        ) : null}
      </div>
      <ul className="space-y-3">
        {rows.length === 0 ? (
          <li className="text-sm text-gray-500">No hay registros pendientes.</li>
        ) : (
          rows.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-ink">{r.colaborador}</p>
                  <p className="text-sm text-gray-600">
                    {r.fecha} · Área: {areaNombre(r.areaId)}
                  </p>
                  <p className="text-xs text-gray-500">{r.idRegistro}</p>
                </div>
                {r.errorSincronizacionPermanente ? (
                  <Badge tone="danger">Error</Badge>
                ) : (
                  <Badge tone="warning">Pendiente</Badge>
                )}
              </div>
              {isOnline ? (
                <Button
                  variant="secondary"
                  className="mt-3 !w-full sm:!w-auto"
                  type="button"
                  disabled={busy || r.errorSincronizacionPermanente}
                  onClick={() => void runSync()}
                >
                  Reintentar sincronización
                </Button>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
