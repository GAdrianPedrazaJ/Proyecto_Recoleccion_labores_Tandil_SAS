import type { Labor } from '../../types'

/** Una fila de labor con totales estimado / real y cumplimiento. */
export function LaborCard({
  index,
  labor,
}: {
  index: number
  labor: Labor
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 text-sm">
      <p className="font-semibold text-ink">
        Labor {index + 1}: {labor.nombre || '—'}
      </p>
      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-700">
        <dt>Camas planeadas / ejecutadas</dt>
        <dd className="text-right font-medium text-ink">
          {labor.camasPlaneadas} / {labor.camasEjecutadas}
        </dd>
        <dt>Tiempo est. / real (min)</dt>
        <dd className="text-right font-medium text-ink">
          {labor.tiempoEstimado.toFixed(1)} / {labor.tiempoReal.toFixed(1)}
        </dd>
        <dt>Cumplimiento</dt>
        <dd className="text-right font-medium text-primary">{labor.cumplimiento}</dd>
      </dl>
    </div>
  )
}
