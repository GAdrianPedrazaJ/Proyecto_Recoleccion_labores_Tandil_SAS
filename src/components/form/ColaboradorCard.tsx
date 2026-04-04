import type { RegistroColaborador } from '../../types'
import { Badge } from '../ui/Badge'

/**
 * Tarjeta resumida de un colaborador en el listado o en el formulario del día.
 * Aquí: nombre, número, flags de cumplimiento y enlace a detalle/edición.
 */
export function ColaboradorCard({ row }: { row: RegistroColaborador }) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold text-ink">{row.nombreColaborador}</p>
          <p className="text-xs text-gray-500">#{row.numeroColaborador}</p>
        </div>
        {row.externo ? <Badge tone="warning">Externo</Badge> : <Badge>Interno</Badge>}
      </div>
      <p className="mt-2 text-sm text-gray-600">
        Variedad: {row.variedad || '—'} · Tallos est. / real: {row.tallosEstimados} /{' '}
        {row.tallosReales}
      </p>
      {/* Sección futura: checklist proceso, seguridad, calidad… */}
    </article>
  )
}
