import { useEffect, useState } from 'react'
import type { FormularioDia } from '../types'
import { getPendientesSincronizacion, getAllFormularios } from '../services/db'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { syncPendientes } from '../services/sync'

/** Listado de formularios no sincronizados y botón de reintento manual. */
export function RegistrosPendientes() {
  const [syncable, setSyncable] = useState<FormularioDia[]>([])
  const [allUnsynced, setAllUnsynced] = useState<FormularioDia[]>([])
  const [busy, setBusy] = useState(false)

  const load = async () => {
    const pend = await getPendientesSincronizacion()
    const all = await getAllFormularios()
    setSyncable(pend)
    setAllUnsynced(all.filter((f) => !f.sincronizado))
  }

  useEffect(() => {
    void load()
  }, [])

  const onSync = async () => {
    setBusy(true)
    try {
      await syncPendientes()
      window.dispatchEvent(new CustomEvent('labores:sync'))
      await load()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4 px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-ink">Pendientes de subir</h2>
        <Button type="button" disabled={busy} onClick={() => void onSync()}>
          {busy ? 'Sincronizando…' : 'Sincronizar ahora'}
        </Button>
      </div>
      <p className="text-sm text-gray-600">
        Intentos automáticos hasta 5; después quedan marcados con error permanente (revisar en
        historial).
      </p>
      <ul className="space-y-3">
        {allUnsynced.length === 0 ? (
          <li className="text-sm text-gray-500">No hay registros pendientes.</li>
        ) : (
          allUnsynced.map((f) => (
            <li
              key={f.id}
              className="rounded-2xl border border-gray-200 bg-white p-4 text-sm shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-ink">
                  {f.fecha} · {f.tipo}
                </span>
                {f.errorSincronizacionPermanente ? (
                  <Badge tone="danger">Error permanente</Badge>
                ) : syncable.some((s) => s.id === f.id) ? (
                  <Badge tone="warning">En cola</Badge>
                ) : (
                  <Badge tone="danger">Bloqueado</Badge>
                )}
              </div>
              <p className="mt-1 text-gray-600">
                Intentos: {f.intentosSincronizacion} · {f.colaboradores.length} colaborador(es)
              </p>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
