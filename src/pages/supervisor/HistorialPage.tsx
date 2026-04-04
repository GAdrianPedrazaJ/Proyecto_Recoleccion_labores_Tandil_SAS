import { useEffect, useMemo, useState } from 'react'
import type { RegistroColaborador } from '../../types'
import { getRegistrosSincronizados } from '../../services/db'
import { LaborCard } from '../../components/form/LaborCard'
import { todayIsoDate } from '../../utils/helpers'

export function HistorialPage() {
  const [rows, setRows] = useState<RegistroColaborador[]>([])
  const [filtroFecha, setFiltroFecha] = useState(todayIsoDate())

  useEffect(() => {
    void getRegistrosSincronizados().then(setRows)
  }, [])

  const filtrados = useMemo(
    () => rows.filter((r) => !filtroFecha || r.fecha === filtroFecha),
    [rows, filtroFecha],
  )

  return (
    <div className="space-y-4 px-4 py-4">
      <h1 className="text-xl font-bold text-ink">Historial</h1>
      <label className="block max-w-xs text-sm font-medium text-ink">
        Filtrar por fecha
        <input
          type="date"
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5"
          value={filtroFecha}
          onChange={(e) => setFiltroFecha(e.target.value)}
        />
      </label>
      <ul className="space-y-4">
        {filtrados.length === 0 ? (
          <li className="text-sm text-gray-500">Sin registros sincronizados.</li>
        ) : (
          filtrados.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <p className="font-semibold text-ink">{r.colaborador}</p>
              <p className="text-sm text-gray-600">
                {r.fecha} · {r.idRegistro} · {r.tipo}
              </p>
              <p className="text-xs text-gray-500">
                Tallos est./real: {r.tallosEstimados} / {r.tallosReales}
              </p>
              <div className="mt-3 space-y-2">
                {r.labores.map((lab, i) =>
                  lab ? <LaborCard key={i} index={i} labor={lab} /> : null,
                )}
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
