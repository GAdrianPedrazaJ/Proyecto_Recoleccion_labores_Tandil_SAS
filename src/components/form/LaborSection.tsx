import type { Labor } from '../../types'
import { Input } from '../ui/Input'

/**
 * Bloque repetible para una fila de labor (hasta 3 por colaborador).
 * Conectar cada campo con react-hook-form (setValue / Controller) según el formulario padre.
 */
export function LaborSection({
  index,
  value,
  prefix,
}: {
  index: number
  value?: Labor
  /** Prefijo de nombre para register(), ej. `labores.0.nombre` */
  prefix: string
}) {
  return (
    <fieldset className="space-y-3 rounded-xl border border-dashed border-gray-200 p-3">
      <legend className="text-sm font-medium text-ink">Labor {index + 1}</legend>
      <Input label="Nombre labor" name={`${prefix}.nombre`} defaultValue={value?.nombre} />
      <div className="grid grid-cols-2 gap-2">
        <Input
          label="Camas planeadas"
          name={`${prefix}.camasPlaneadas`}
          type="number"
          defaultValue={value?.camasPlaneadas}
        />
        <Input
          label="Camas ejecutadas"
          name={`${prefix}.camasEjecutadas`}
          type="number"
          defaultValue={value?.camasEjecutadas}
        />
        <Input
          label="Rend. est. / cama"
          name={`${prefix}.rendimientoEstimadoPorCama`}
          type="number"
          step="0.01"
          defaultValue={value?.rendimientoEstimadoPorCama}
        />
        <Input
          label="Rend. real / cama"
          name={`${prefix}.rendimientoRealPorCama`}
          type="number"
          step="0.01"
          defaultValue={value?.rendimientoRealPorCama}
        />
      </div>
    </fieldset>
  )
}
