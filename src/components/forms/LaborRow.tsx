import { useFormContext } from 'react-hook-form'
import type { RegistroFV } from '../../types'
import { Input } from '../ui/Input'

interface LaborRowProps {
  filaIndex: number
  laborIndex: number
  onRemove: () => void
}

export function LaborRow({ filaIndex, laborIndex, onRemove }: LaborRowProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<RegistroFV>()

  const laborErrors = errors.filas?.[filaIndex]?.labores?.[laborIndex]

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500">Labor {laborIndex + 1}</span>
        <button
          type="button"
          onClick={onRemove}
          className="rounded p-0.5 text-red-400 hover:bg-red-50 hover:text-red-600"
          aria-label="Eliminar labor"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <Input
        label="Nombre de la labor"
        placeholder="Ej: Deshoje, Pinch, Tutoreo..."
        error={laborErrors?.nombre?.message}
        {...register(`filas.${filaIndex}.labores.${laborIndex}.nombre`)}
      />

      <div className="grid grid-cols-2 gap-2">
        <Input
          label="Camas planeadas"
          type="number"
          min={0}
          error={laborErrors?.camasPlaneadas?.message}
          {...register(`filas.${filaIndex}.labores.${laborIndex}.camasPlaneadas`, {
            valueAsNumber: true,
          })}
        />
        <Input
          label="Rend. estimado/cama"
          type="number"
          min={0}
          step="0.01"
          error={laborErrors?.rendimientoEstimadoPorCama?.message}
          {...register(
            `filas.${filaIndex}.labores.${laborIndex}.rendimientoEstimadoPorCama`,
            { valueAsNumber: true },
          )}
        />
        <Input
          label="Camas ejecutadas"
          type="number"
          min={0}
          error={laborErrors?.camasEjecutadas?.message}
          {...register(`filas.${filaIndex}.labores.${laborIndex}.camasEjecutadas`, {
            valueAsNumber: true,
          })}
        />
        <Input
          label="Rend. real/cama"
          type="number"
          min={0}
          step="0.01"
          error={laborErrors?.rendimientoRealPorCama?.message}
          {...register(`filas.${filaIndex}.labores.${laborIndex}.rendimientoRealPorCama`, {
            valueAsNumber: true,
          })}
        />
        <Input
          label="Tiempo (min)"
          type="number"
          min={0}
          error={laborErrors?.tiempoEjecucion?.message}
          className="col-span-2"
          {...register(`filas.${filaIndex}.labores.${laborIndex}.tiempoEjecucion`, {
            valueAsNumber: true,
          })}
        />
      </div>
    </div>
  )
}
