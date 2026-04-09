import { useEffect } from 'react'
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form'
import type { Bloque, LaborCatalog, RegistroFV, Variedad } from '../../types'
import { Input } from '../ui/Input'
import { LaborRow } from './LaborRow'

interface FilaColaboradorFormProps {
  index: number
  bloques: Bloque[]
  variedades: Variedad[]
  laborCatalog: LaborCatalog[]
  isEditMode: boolean
}

function horaToDecimal(hora: string): number {
  if (!hora) return 0
  const [h, m] = hora.split(':').map(Number)
  return (h || 0) + (m || 0) / 60
}

function fmt2(n: number): string {
  return isNaN(n) || !isFinite(n) ? '0.00' : n.toFixed(2)
}

export function FilaColaboradorForm({ index, bloques, variedades, laborCatalog, isEditMode }: FilaColaboradorFormProps) {
  const { register, control, setValue, formState: { errors } } = useFormContext<RegistroFV>()
  const filaErrs = errors.filas?.[index]

  const { fields: laborFields, append: appendLabor, remove: removeLabor } = useFieldArray({
    control,
    name: `filas.${index}.labores`,
  })

  const nombre = useWatch({ control, name: `filas.${index}.nombre` })
  const bloqueId = useWatch({ control, name: `filas.${index}.bloqueId` })
  const variedadId = useWatch({ control, name: `filas.${index}.variedadId` })
  const externo = useWatch({ control, name: `filas.${index}.externo` })
  const tiempoEstimadoMinutos = useWatch({ control, name: `filas.${index}.tiempoEstimadoMinutos` })
  const tiempoRealMinutos = useWatch({ control, name: `filas.${index}.tiempoRealMinutos` })
  const horaInicio = useWatch({ control, name: `filas.${index}.horaInicio` })
  const calidad1 = useWatch({ control, name: `filas.${index}.calidad1` })
  const calidad2 = useWatch({ control, name: `filas.${index}.calidad2` })
  const calidad3 = useWatch({ control, name: `filas.${index}.calidad3` })
  const calidad4 = useWatch({ control, name: `filas.${index}.calidad4` })
  const calidad5 = useWatch({ control, name: `filas.${index}.calidad5` })
  const labores = useWatch({ control, name: `filas.${index}.labores` })

  // tiempoEstimadoHoras = tiempoEstimadoMinutos / 60
  useEffect(() => {
    const h = parseFloat(fmt2((tiempoEstimadoMinutos ?? 0) / 60))
    setValue(`filas.${index}.tiempoEstimadoHoras`, h, { shouldValidate: false })
  }, [tiempoEstimadoMinutos, index, setValue])

  // tiempoRealHoras = tiempoRealMinutos / 60
  useEffect(() => {
    const h = parseFloat(fmt2((tiempoRealMinutos ?? 0) / 60))
    setValue(`filas.${index}.tiempoRealHoras`, h, { shouldValidate: false })
  }, [tiempoRealMinutos, index, setValue])

  // horaCama = (tiempoRealH / horaInicioDecimal) * 24
  useEffect(() => {
    const decimal = horaToDecimal(horaInicio ?? '')
    const realH = (tiempoRealMinutos ?? 0) / 60
    const hc = decimal > 0 ? parseFloat(fmt2((realH / decimal) * 24)) : 0
    setValue(`filas.${index}.horaCama`, hc, { shouldValidate: false })
  }, [tiempoRealMinutos, horaInicio, index, setValue])

  const tiempoEstHoras = (tiempoEstimadoMinutos ?? 0) / 60
  const tiempoRealH = (tiempoRealMinutos ?? 0) / 60
  const horaCamaCalc = (() => {
    const d = horaToDecimal(horaInicio ?? '')
    return d > 0 ? (tiempoRealH / d) * 24 : 0
  })()

  // Computed cierre values
  const checkedCount = [calidad1, calidad2, calidad3, calidad4, calidad5].filter(Boolean).length
  const cumplimientoCalidadPct = (checkedCount / 5) * 100
  const activoLabores = (labores ?? []).filter((l) => l.laborId)
  const rendimientoPromedio =
    activoLabores.length > 0
      ? activoLabores.reduce((sum, l) => sum + (l.rendimientoPorcentaje ?? 0), 0) / activoLabores.length
      : 0

  useEffect(() => {
    setValue(`filas.${index}.cumplimientoCalidad`, parseFloat(fmt2(cumplimientoCalidadPct)), { shouldValidate: false })
  }, [cumplimientoCalidadPct, index, setValue])

  useEffect(() => {
    setValue(`filas.${index}.rendimientoPromedio`, parseFloat(fmt2(rendimientoPromedio)), { shouldValidate: false })
  }, [rendimientoPromedio, index, setValue])

  const bloqueName = bloques.find((b) => b.id === bloqueId)?.nombre ?? ''
  const variedadName = variedades.find((v) => v.id === variedadId)?.nombre ?? ''

  const addLabor = () => {
    if (laborFields.length >= 5) return
    appendLabor({
      laborId: '',
      laborNombre: '',
      camasEstimadas: 0,
      tiempoCamaEstimado: 0,
      rendimientoHorasEstimado: 0,
      camasReales: 0,
      tiempoCamaReal: 0,
      rendimientoHorasReal: 0,
      rendimientoPorcentaje: 0,
    })
  }

  return (
    <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
      {/* Cabecera del colaborador */}
      <div className="flex items-center justify-between px-4 py-3 bg-green-600">
        <div>
          <p className="font-bold text-white text-sm">{nombre || 'Colaborador'}</p>
          <p className="text-xs text-green-100">
            {bloqueName}
            {bloqueName && variedadName && ' · '}
            {variedadName}
            {externo && (
              <span className="ml-2 rounded bg-blue-500 px-1 text-white">Externo</span>
            )}
          </p>
        </div>
      </div>

      {/* CORTE */}
      <div className="border-b border-gray-100">
        <p className="bg-green-50 px-4 py-2 text-xs font-bold uppercase text-green-700">
          CORTE
        </p>
        <div className="px-4 pb-4 pt-2 space-y-3">
          {/* Tiempo estimado */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Tiempo estimado (min)"
              type="number"
              min={0}
              error={filaErrs?.tiempoEstimadoMinutos?.message}
              {...register(`filas.${index}.tiempoEstimadoMinutos`, { valueAsNumber: true })}
            />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-gray-700">En horas</p>
              <div className="flex h-9 items-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-600">
                {fmt2(tiempoEstHoras)} h
              </div>
            </div>
          </div>

          {/* Tiempo real */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Tiempo real (min)"
              type="number"
              min={0}
              placeholder={isEditMode ? '' : 'Al cierre'}
              error={filaErrs?.tiempoRealMinutos?.message}
              {...register(`filas.${index}.tiempoRealMinutos`, { valueAsNumber: true })}
            />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-gray-700">En horas</p>
              <div className="flex h-9 items-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-600">
                {fmt2(tiempoRealH)} h
              </div>
            </div>
          </div>

          {/* Tallos */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Tallos estimados"
              type="number"
              min={0}
              error={filaErrs?.tallosEstimados?.message}
              {...register(`filas.${index}.tallosEstimados`, { valueAsNumber: true })}
            />
            <Input
              label="Tallos reales"
              type="number"
              min={0}
              placeholder={isEditMode ? '' : 'Al cierre'}
              error={filaErrs?.tallosReales?.message}
              {...register(`filas.${index}.tallosReales`, { valueAsNumber: true })}
            />
          </div>

          {/* Horas corte */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Hora inicio corte"
              type="time"
              error={filaErrs?.horaInicio?.message}
              {...register(`filas.${index}.horaInicio`)}
            />
            <Input
              label="Hora fin estimado"
              type="time"
              error={filaErrs?.horaFinCorteEstimado?.message}
              {...register(`filas.${index}.horaFinCorteEstimado`)}
            />
          </div>
          <Input
            label="Hora fin real"
            type="time"
            placeholder={isEditMode ? '' : 'Al cierre'}
            error={filaErrs?.horaFinCorteReal?.message}
            {...register(`filas.${index}.horaFinCorteReal`)}
          />

          {/* Hora/Cama calculada */}
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-gray-700">Hora / Cama (calculado)</p>
            <div className="flex h-9 items-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-600">
              {fmt2(horaCamaCalc)}
            </div>
          </div>

          {/* Rendimiento corte */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Rend. corte estimado"
              type="number"
              min={0}
              step="0.01"
              error={filaErrs?.rendimientoCorteEstimado?.message}
              {...register(`filas.${index}.rendimientoCorteEstimado`, { valueAsNumber: true })}
            />
            <Input
              label="Rend. corte real"
              type="number"
              min={0}
              step="0.01"
              placeholder={isEditMode ? '' : 'Al cierre'}
              error={filaErrs?.rendimientoCorteReal?.message}
              {...register(`filas.${index}.rendimientoCorteReal`, { valueAsNumber: true })}
            />
          </div>
        </div>
      </div>

      {/* LABORES */}
      <div className="border-b border-gray-100">
        <div className="flex items-center justify-between bg-green-50 px-4 py-2">
          <p className="text-xs font-bold uppercase text-green-700">
            LABORES ({laborFields.length}/5)
          </p>
          {laborFields.length < 5 && (
            <button
              type="button"
              onClick={addLabor}
              className="flex items-center gap-1 text-xs font-bold text-green-700 hover:text-green-900"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              AÑADIR LABOR
            </button>
          )}
        </div>

        {laborFields.length === 0 && (
          <p className="px-4 py-4 text-center text-sm text-gray-400">
            Sin labores. Pulsa + AÑADIR LABOR para agregar.
          </p>
        )}

        <div className="divide-y divide-gray-100">
          {laborFields.map((field, laborIdx) => (
            <LaborRow
              key={field.id}
              filaIndex={index}
              laborIndex={laborIdx}
              laborCatalog={laborCatalog}
              isEditMode={isEditMode}
              onRemove={() => removeLabor(laborIdx)}
            />
          ))}
        </div>
      </div>

      {/* CIERRE */}
      <div className="px-4 py-4 space-y-4">
        <p className="text-xs font-bold uppercase text-gray-500">CIERRE</p>

        {/* Desglose PI.PC */}
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            {...register(`filas.${index}.desglossePiPc`)}
          />
          <span className="font-medium">Desglose PI.PC</span>
        </label>

        {/* Proceso y Seguridad */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Proceso y Seguridad</label>
          <select
            className={`rounded-lg border px-3 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 ${
              filaErrs?.procesoSeguridad ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
            }`}
            {...register(`filas.${index}.procesoSeguridad`)}
          >
            <option value="">— Seleccionar —</option>
            <option value="NO">NO</option>
            <option value="A">A. Uso de EPP&apos;s</option>
            <option value="B">B. Herramientas en buen estado</option>
            <option value="C">C. Etiquetas en buen estado</option>
            <option value="D">D. Recorrido en cama redonda</option>
            <option value="E">E. Orden y Aseo</option>
          </select>
          {filaErrs?.procesoSeguridad && (
            <p className="text-xs text-red-600">Campo requerido al completar</p>
          )}
        </div>

        {/* Calidad / Cuadro */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Calidad / Cuadro</p>
          <div className="flex items-end gap-5">
            {([1, 2, 3, 4, 5] as const).map((n) => (
              <label key={n} className="flex cursor-pointer flex-col items-center gap-1 text-sm text-gray-700">
                <span className="text-xs font-semibold text-gray-500">{n}</span>
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  {...register(`filas.${index}.calidad${n}` as `filas.${number}.calidad1`)}
                />
              </label>
            ))}
          </div>
        </div>

        {/* Porcentajes calculados */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium text-gray-600">% Cumplimiento</p>
            <div className="flex h-9 items-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-700">
              {fmt2(cumplimientoCalidadPct)} %
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium text-gray-600">% Prom. Rendimiento</p>
            <div className="flex h-9 items-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-700">
              {fmt2(rendimientoPromedio)} %
            </div>
          </div>
        </div>

        {/* Observaciones */}
        <textarea
          placeholder="Observaciones..."
          rows={2}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 resize-none"
          {...register(`filas.${index}.observaciones`)}
        />
      </div>
    </div>
  )
}
