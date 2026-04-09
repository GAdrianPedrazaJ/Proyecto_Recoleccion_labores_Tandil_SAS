import { useEffect } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import type { LaborCatalog, RegistroFV } from '../../types'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'

interface LaborRowProps {
  filaIndex: number
  laborIndex: number
  laborCatalog: LaborCatalog[]
  isEditMode: boolean
  onRemove: () => void
}

function fmt2(n: number): string {
  return isNaN(n) || !isFinite(n) ? '0.00' : n.toFixed(2)
}

export function LaborRow({ filaIndex, laborIndex, laborCatalog, isEditMode, onRemove }: LaborRowProps) {
  const { register, control, setValue, formState: { errors } } = useFormContext<RegistroFV>()
  const laborErrs = errors.filas?.[filaIndex]?.labores?.[laborIndex]

  const laborId = useWatch({ control, name: `filas.${filaIndex}.labores.${laborIndex}.laborId` })
  const camasEstimadas = useWatch({ control, name: `filas.${filaIndex}.labores.${laborIndex}.camasEstimadas` })
  const tiempoCamaEstimado = useWatch({ control, name: `filas.${filaIndex}.labores.${laborIndex}.tiempoCamaEstimado` })
  const camasReales = useWatch({ control, name: `filas.${filaIndex}.labores.${laborIndex}.camasReales` })
  const tiempoCamaReal = useWatch({ control, name: `filas.${filaIndex}.labores.${laborIndex}.tiempoCamaReal` })

  // Auto-fill laborNombre when laborId changes
  useEffect(() => {
    const cat = laborCatalog.find((l) => l.id === laborId)
    if (cat) {
      setValue(`filas.${filaIndex}.labores.${laborIndex}.laborNombre`, cat.nombre, { shouldValidate: false })
    }
  }, [laborId, laborCatalog, filaIndex, laborIndex, setValue])

  // Calculate rendimientoHorasEstimado = (camasEstimadas * tiempoCamaEstimado) / 60
  useEffect(() => {
    const v = ((camasEstimadas ?? 0) * (tiempoCamaEstimado ?? 0)) / 60
    setValue(`filas.${filaIndex}.labores.${laborIndex}.rendimientoHorasEstimado`, parseFloat(fmt2(v)), { shouldValidate: false })
  }, [camasEstimadas, tiempoCamaEstimado, filaIndex, laborIndex, setValue])

  // Calculate rendimientoHorasReal = (camasReales * tiempoCamaReal) / 60
  useEffect(() => {
    const v = ((camasReales ?? 0) * (tiempoCamaReal ?? 0)) / 60
    setValue(`filas.${filaIndex}.labores.${laborIndex}.rendimientoHorasReal`, parseFloat(fmt2(v)), { shouldValidate: false })
  }, [camasReales, tiempoCamaReal, filaIndex, laborIndex, setValue])

  // Calculate rendimientoPorcentaje = (camasReales / camasEstimadas) * 100
  useEffect(() => {
    const est = camasEstimadas ?? 0
    const real = camasReales ?? 0
    const pct = est > 0 ? parseFloat(fmt2((real / est) * 100)) : 0
    setValue(`filas.${filaIndex}.labores.${laborIndex}.rendimientoPorcentaje`, pct, { shouldValidate: false })
  }, [camasEstimadas, camasReales, filaIndex, laborIndex, setValue])

  // Derived display values (no re-render cost beyond what watch already does)
  const rendEst = ((camasEstimadas ?? 0) * (tiempoCamaEstimado ?? 0)) / 60
  const rendReal = ((camasReales ?? 0) * (tiempoCamaReal ?? 0)) / 60
  const est = camasEstimadas ?? 0
  const real = camasReales ?? 0
  const pct = est > 0 ? (real / est) * 100 : 0

  const laborOptions = laborCatalog.map((l) => ({ value: l.id, label: l.nombre }))

  return (
    <div className="px-4 py-3 space-y-3 bg-white">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase text-green-700">
          Labor {laborIndex + 1}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600"
          aria-label="Eliminar labor"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Labor selector */}
      <Select
        label="Labor"
        options={laborOptions}
        placeholder="Seleccionar labor..."
        error={laborErrs?.laborId?.message}
        {...register(`filas.${filaIndex}.labores.${laborIndex}.laborId`)}
      />

      {/* Camas */}
      <div className="grid grid-cols-2 gap-2">
        <Input
          label="Camas estimadas"
          type="number"
          min={0}
          error={laborErrs?.camasEstimadas?.message}
          {...register(`filas.${filaIndex}.labores.${laborIndex}.camasEstimadas`, { valueAsNumber: true })}
        />
        <Input
          label="Camas reales"
          type="number"
          min={0}
          placeholder={isEditMode ? '' : 'Al cierre'}
          error={laborErrs?.camasReales?.message}
          {...register(`filas.${filaIndex}.labores.${laborIndex}.camasReales`, { valueAsNumber: true })}
        />
      </div>

      {/* Tiempo por cama */}
      <div className="grid grid-cols-2 gap-2">
        <Input
          label="Min / cama estimado"
          type="number"
          min={0}
          step="0.1"
          error={laborErrs?.tiempoCamaEstimado?.message}
          {...register(`filas.${filaIndex}.labores.${laborIndex}.tiempoCamaEstimado`, { valueAsNumber: true })}
        />
        <Input
          label="Min / cama real"
          type="number"
          min={0}
          step="0.1"
          placeholder={isEditMode ? '' : 'Al cierre'}
          error={laborErrs?.tiempoCamaReal?.message}
          {...register(`filas.${filaIndex}.labores.${laborIndex}.tiempoCamaReal`, { valueAsNumber: true })}
        />
      </div>

      {/* Calculados */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-gray-600">Rend. h. est.</p>
          <div className="flex h-8 items-center rounded-lg border border-gray-200 bg-gray-50 px-2 text-xs text-gray-700">
            {fmt2(rendEst)} h
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-gray-600">Rend. h. real</p>
          <div className="flex h-8 items-center rounded-lg border border-gray-200 bg-gray-50 px-2 text-xs text-gray-700">
            {fmt2(rendReal)} h
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-gray-600">Rend. %</p>
          <div className="flex h-8 items-center rounded-lg border border-gray-200 bg-gray-50 px-2 text-xs text-gray-700">
            {fmt2(pct)} %
          </div>
        </div>
      </div>
    </div>
  )
}
