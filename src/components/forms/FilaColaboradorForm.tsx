import { useFieldArray, useFormContext } from 'react-hook-form'
import type { Variedad, RegistroFV } from '../../types'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { LaborRow } from './LaborRow'

interface FilaColaboradorFormProps {
  index: number
  nombre: string
  variedades: Variedad[]
}

const CHECKBOXES = [
  { name: 'proceso', label: 'Proceso' },
  { name: 'seguridad', label: 'Seguridad' },
  { name: 'calidad', label: 'Calidad' },
  { name: 'cumplimiento', label: 'Cumplimiento' },
  { name: 'compromiso', label: 'Compromiso' },
] as const

export function FilaColaboradorForm({ index, nombre, variedades }: FilaColaboradorFormProps) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<RegistroFV>()

  const { fields: laborFields, append: appendLabor, remove: removeLabor } = useFieldArray({
    control,
    name: `filas.${index}.labores`,
  })

  const filaErrors = errors.filas?.[index]
  const variedadOptions = variedades.map((v) => ({ value: v.nombre, label: v.nombre }))

  const addLabor = () => {
    if (laborFields.length >= 5) return
    appendLabor({
      nombre: '',
      camasPlaneadas: 0,
      rendimientoEstimadoPorCama: 0,
      camasEjecutadas: 0,
      rendimientoRealPorCama: 0,
      tiempoEjecucion: 0,
    })
  }

  return (
    <div className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-4">
      <h3 className="font-semibold text-green-800 text-sm uppercase tracking-wide">{nombre}</h3>

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Variedad"
          options={variedadOptions}
          placeholder="Seleccionar..."
          error={filaErrors?.variedad?.message}
          {...register(`filas.${index}.variedad`)}
        />
        <Input
          label="Hora inicio"
          type="time"
          error={filaErrors?.horaInicio?.message}
          {...register(`filas.${index}.horaInicio`)}
        />
        <Input
          label="Tallos estimados"
          type="number"
          min={0}
          error={filaErrors?.tallosEstimados?.message}
          {...register(`filas.${index}.tallosEstimados`, { valueAsNumber: true })}
        />
        <Input
          label="Tallos reales"
          type="number"
          min={0}
          error={filaErrors?.tallosReales?.message}
          {...register(`filas.${index}.tallosReales`, { valueAsNumber: true })}
        />
      </div>

      {/* Labores */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Labores ({laborFields.length}/5)
          </span>
          {laborFields.length < 5 && (
            <Button type="button" variant="secondary" size="sm" onClick={addLabor}>
              + Labor
            </Button>
          )}
        </div>
        {laborFields.map((field, laborIdx) => (
          <LaborRow
            key={field.id}
            filaIndex={index}
            laborIndex={laborIdx}
            onRemove={() => removeLabor(laborIdx)}
          />
        ))}
      </div>

      {/* Checkboxes */}
      <div className="flex flex-wrap gap-4">
        {CHECKBOXES.map(({ name, label }) => (
          <label key={name} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              {...register(`filas.${index}.${name}`)}
            />
            {label}
          </label>
        ))}
      </div>

      {/* Observaciones */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Observaciones</label>
        <textarea
          rows={2}
          placeholder="Observaciones opcionales..."
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          {...register(`filas.${index}.observaciones`)}
        />
      </div>
    </div>
  )
}
