import { useEffect, useState } from 'react'
import type { FormularioDia } from '../types'
import { getAllFormularios } from '../services/db'
import { Badge } from '../components/ui/Badge'

/** Historial completo desde IndexedDB (sincronizados y no). */
export function Historial() {
  const [rows, setRows] = useState<FormularioDia[]>([])

  useEffect(() => {
    void getAllFormularios().then(setRows)
  }, [])

  return (
    <div className="space-y-4 px-4 py-4">
      <h2 className="text-base font-semibold text-ink">Historial local</h2>
      <p className="text-sm text-gray-600">
        Datos en este dispositivo; ordenar o filtrar por fecha según necesidad.
      </p>
      <ul className="space-y-2">
        {rows.length === 0 ? (
          <li className="text-sm text-gray-500">Sin registros.</li>
        ) : (
          rows.map((f) => (
            <li
              key={f.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-100 bg-white px-3 py-2 text-sm"
            >
              <span>
                {f.fecha} — {f.supervisor} @ {f.sede}
              </span>
              {f.sincronizado ? (
                <Badge tone="success">Sincronizado</Badge>
              ) : f.errorSincronizacionPermanente ? (
                <Badge tone="danger">Falló</Badge>
              ) : (
                <Badge tone="warning">Pendiente</Badge>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
