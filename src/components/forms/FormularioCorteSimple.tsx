import { useEffect } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { Input } from '../ui/Input'

interface FormularioCorteSimpleProps {
  indexAsset: string // e.g., "filas.0.corte"
  isEditMode: boolean
  faseReal?: boolean
}

function fmt2(n: number): string {
  return isNaN(n) || !isFinite(n) ? '0.00' : n.toFixed(2)
}

function timeToDecimal(timeStr: string): number {
  if (!timeStr) return 0
  const [h, m] = timeStr.split(':').map(Number)
  return (h || 0) + (m || 0) / 60
}

function decimalToTime(decimal: number): string {
  if (decimal <= 0 || !isFinite(decimal)) return ''
  const h = Math.floor(decimal)
  const m = Math.round((decimal - h) * 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function FormularioCorteSimple({
  indexAsset,
  isEditMode,
  faseReal = false,
}: FormularioCorteSimpleProps) {
  const { register, control, setValue, formState: { errors } } = useFormContext()

  // Watch all values for calculations
  const rendimientoEstimado = useWatch({ control, name: `${indexAsset}.rendimientoCorteEstimado` })
  const tallosEstimados = useWatch({ control, name: `${indexAsset}.tallosEstimados` })
  const horaInicio = useWatch({ control, name: `${indexAsset}.horaInicio` })
  const rendimientoReal = useWatch({ control, name: `${indexAsset}.rendimientoCorteReal` })
  const tallosReales = useWatch({ control, name: `${indexAsset}.tallosReales` })
  const horaFinReal = useWatch({ control, name: `${indexAsset}.horaFinCorteReal` })

  // Cálculos automáticos
  const horasEstimadas = 
    rendimientoEstimado && tallosEstimados
      ? (tallosEstimados / rendimientoEstimado)
      : 0

  const horasReales = 
    rendimientoReal && tallosReales
      ? (tallosReales / rendimientoReal)
      : 0

  const horaInicioDecimal = timeToDecimal(horaInicio)
  const horaFinEstimadoDecimal = horaInicioDecimal + (horasEstimadas || 0)
  const horaFinEstimado = decimalToTime(horaFinEstimadoDecimal)

  // Hora/Cama = (horasFin - horaInicio) * 24
  const horaFinRealDecimal = timeToDecimal(horaFinReal)
  const horaCama = 
    horaInicioDecimal > 0 && horaFinRealDecimal > horaInicioDecimal
      ? (horaFinRealDecimal - horaInicioDecimal) * 24
      : 0

  // Actualizar campos calculados
  useEffect(() => {
    if (horaFinEstimado) {
      setValue(`${indexAsset}.horaFinCorteEstimado`, horaFinEstimado, { shouldValidate: false })
    }
  }, [horaFinEstimado, setValue, indexAsset])

  useEffect(() => {
    setValue(`${indexAsset}.tiempoEstimadoHoras`, parseFloat(fmt2(horasEstimadas)), { shouldValidate: false })
  }, [horasEstimadas, setValue, indexAsset])

  useEffect(() => {
    setValue(`${indexAsset}.tiempoRealHoras`, parseFloat(fmt2(horasReales)), { shouldValidate: false })
  }, [horasReales, setValue, indexAsset])

  useEffect(() => {
    setValue(`${indexAsset}.horaCama`, parseFloat(fmt2(horaCama)), { shouldValidate: false })
  }, [horaCama, setValue, indexAsset])

  const errs = errors?.[indexAsset] as any

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Estimado */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Estimado</h3>

          <Input
            label="Rendimiento de corte"
            type="number"
            min={0}
            step="0.01"
            readOnly={faseReal}
            placeholder="e.g., 12.5"
            error={errs?.rendimientoCorteEstimado?.message}
            {...register(`${indexAsset}.rendimientoCorteEstimado`, { valueAsNumber: true })}
          />

          <Input
            label="Tallos"
            type="number"
            min={0}
            readOnly={faseReal}
            error={errs?.tallosEstimados?.message}
            {...register(`${indexAsset}.tallosEstimados`, { valueAsNumber: true })}
          />

          <Input
            label="Hora inicio"
            type="time"
            readOnly={faseReal}
            error={errs?.horaInicio?.message}
            {...register(`${indexAsset}.horaInicio`)}
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Horas calculadas</label>
            <div className="flex h-10 items-center rounded-lg border border-gray-300 bg-gray-50 px-3 text-sm text-gray-600">
              {fmt2(horasEstimadas)} h
            </div>
          </div>

          <Input
            label="Hora fin"
            type="time"
            readOnly
            value={horaFinEstimado}
            error={errs?.horaFinCorteEstimado?.message}
            {...register(`${indexAsset}.horaFinCorteEstimado`)}
          />
        </div>

        {/* Real */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Real</h3>

          <Input
            label="Rendimiento de corte"
            type="number"
            min={0}
            step="0.01"
            placeholder={!isEditMode && !faseReal ? 'Al cierre' : ''}
            error={errs?.rendimientoCorteReal?.message}
            {...register(`${indexAsset}.rendimientoCorteReal`, { valueAsNumber: true })}
          />

          <Input
            label="Tallos"
            type="number"
            min={0}
            placeholder={!isEditMode && !faseReal ? 'Al cierre' : ''}
            error={errs?.tallosReales?.message}
            {...register(`${indexAsset}.tallosReales`, { valueAsNumber: true })}
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Hora inicio</label>
            <div className="flex h-10 items-center rounded-lg border border-gray-300 bg-gray-50 px-3 text-sm text-gray-600">
              {horaInicio || '-'}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Horas calculadas</label>
            <div className="flex h-10 items-center rounded-lg border border-gray-300 bg-gray-50 px-3 text-sm text-gray-600">
              {fmt2(horasReales)} h
            </div>
          </div>

          <Input
            label="Hora fin real"
            type="time"
            placeholder={!isEditMode && !faseReal ? 'Al cierre' : ''}
            error={errs?.horaFinCorteReal?.message}
            {...register(`${indexAsset}.horaFinCorteReal`)}
          />
        </div>
      </div>

      {/* Hora/Cama */}
      <div className="flex flex-col gap-1 rounded-lg border border-gray-200 bg-blue-50 p-3">
        <label className="text-sm font-medium text-gray-700">Hora / Cama (Calculado)</label>
        <div className="text-lg font-semibold text-blue-700">{fmt2(horaCama)}</div>
      </div>
    </div>
  )
}
