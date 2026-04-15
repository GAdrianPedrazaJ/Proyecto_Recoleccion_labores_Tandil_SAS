import { useEffect } from 'react'
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form'
import type { LaborCatalog } from '../../types'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'

interface FormularioLaboresSimpleProps {
  indexAsset: string // e.g., "filas.0.labores"
  catalogoLabores: LaborCatalog[]
  isEditMode: boolean
  faseReal?: boolean
}

function fmt2(n: number): string {
  return isNaN(n) || !isFinite(n) ? '0.00' : n.toFixed(2)
}

interface LaborItemProps {
  basePath: string
  laborIdx: number
  laborId: string
  catalogoLabores: LaborCatalog[]
  isEditMode: boolean
  faseReal: boolean
  errors: any
  control: any
  register: any
  setValue: any
  removeLabor: (index: number) => void
}

function LaborItem({
  basePath,
  laborIdx,
  catalogoLabores,
  isEditMode,
  faseReal,
  errors,
  control,
  register,
  setValue,
  removeLabor,
}: LaborItemProps) {
  const camasEstimadas = useWatch({ control, name: `${basePath}.camasEstimadas` })
  const tiempoCamaEstimado = useWatch({ control, name: `${basePath}.tiempoCamaEstimado` })
  const camasReales = useWatch({ control, name: `${basePath}.camasReales` })
  const tiempoCamaReal = useWatch({ control, name: `${basePath}.tiempoCamaReal` })

  const rendimientoHorasEstimado = (Number(camasEstimadas) * Number(tiempoCamaEstimado)) / 60
  const rendimientoHorasReal = (Number(camasReales) * Number(tiempoCamaReal)) / 60
  const rendimientoPorcentaje = camasEstimadas > 0 ? (Number(camasReales) / Number(camasEstimadas)) * 100 : 0

  useEffect(() => {
    setValue(`${basePath}.rendimientoHorasEstimado`, parseFloat(fmt2(rendimientoHorasEstimado)), {
      shouldValidate: false,
    })
  }, [rendimientoHorasEstimado, basePath, setValue])

  useEffect(() => {
    setValue(`${basePath}.rendimientoHorasReal`, parseFloat(fmt2(rendimientoHorasReal)), {
      shouldValidate: false,
    })
  }, [rendimientoHorasReal, basePath, setValue])

  useEffect(() => {
    setValue(`${basePath}.rendimientoPorcentaje`, parseFloat(fmt2(rendimientoPorcentaje)), {
      shouldValidate: false,
    })
  }, [rendimientoPorcentaje, basePath, setValue])

  const firma = basePath.split('.')
  const filaIndex = Number(firma[1])
  const laborErrs = ((errors as any).filas?.[filaIndex]?.labores?.[laborIdx]) ?? {}
  const laborId = useWatch({ control, name: `${basePath}.laborId` })

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between mb-3">
        <Select
          label="Labor"
          options={catalogoLabores.map((l) => ({ value: l.id, label: l.nombre }))}
          placeholder="Seleccionar..."
          value={laborId}
          onChange={(e) => {
            const laborSel = catalogoLabores.find((l) => l.id === e.target.value)
            setValue(`${basePath}.laborId`, e.target.value)
            setValue(`${basePath}.laborNombre`, laborSel?.nombre || '')
          }}
          error={laborErrs?.laborId?.message}
          className="flex-1"
        />
        <button
          type="button"
          onClick={() => removeLabor(laborIdx)}
          className="ml-2 text-red-600 hover:text-red-700 text-sm font-medium mt-7"
        >
          Remover
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-gray-600 uppercase">Estimado</h4>

          <Input
            label="Camas"
            type="number"
            min={0}
            readOnly={faseReal}
            error={laborErrs?.camasEstimadas?.message}
            {...register(`${basePath}.camasEstimadas`, { valueAsNumber: true })}
          />

          <Input
            label="Tiempo/Cama (min)"
            type="number"
            min={0}
            readOnly={faseReal}
            error={laborErrs?.tiempoCamaEstimado?.message}
            {...register(`${basePath}.tiempoCamaEstimado`, { valueAsNumber: true })}
          />

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-700">Rendimiento (horas)</label>
            <div className="flex h-10 items-center rounded-lg border border-gray-300 bg-gray-50 px-3 text-sm text-gray-600">
              {fmt2(rendimientoHorasEstimado)} h
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-gray-600 uppercase">Real</h4>

          <Input
            label="Camas"
            type="number"
            min={0}
            placeholder={!isEditMode && !faseReal ? 'Al cierre' : ''}
            error={laborErrs?.camasReales?.message}
            {...register(`${basePath}.camasReales`, { valueAsNumber: true })}
          />

          <Input
            label="Tiempo/Cama (min)"
            type="number"
            min={0}
            placeholder={!isEditMode && !faseReal ? 'Al cierre' : ''}
            error={laborErrs?.tiempoCamaReal?.message}
            {...register(`${basePath}.tiempoCamaReal`, { valueAsNumber: true })}
          />

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-700">Rendimiento (horas)</label>
            <div className="flex h-10 items-center rounded-lg border border-gray-300 bg-gray-50 px-3 text-sm text-gray-600">
              {fmt2(rendimientoHorasReal)} h
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-1 rounded-lg border border-blue-200 bg-blue-50 p-3">
        <label className="text-xs font-medium text-gray-700">Rendimiento (%)</label>
        <div className="text-lg font-semibold text-blue-700">{fmt2(rendimientoPorcentaje)} %</div>
      </div>
    </div>
  )
}

export function FormularioLaboresSimple({
  indexAsset,
  catalogoLabores,
  isEditMode,
  faseReal = false,
}: FormularioLaboresSimpleProps) {
  const { control, register, setValue, formState: { errors } } = useFormContext()

  const { fields: laborFields, append: appendLabor, remove: removeLabor } = useFieldArray({
    control,
    name: indexAsset,
  })

  const handleAddLabor = () => {
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Labores</h3>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleAddLabor}
          disabled={laborFields.length >= 5}
        >
          + Agregar Labor
        </Button>
      </div>

      {laborFields.length === 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
          Sin labores. Agrega una labor para continuar.
        </div>
      )}

      {laborFields.map((labor, laborIdx) => (
        <LaborItem
          key={labor.id}
          basePath={`${indexAsset}.${laborIdx}`}
          laborIdx={laborIdx}
          laborId={labor.id}
          catalogoLabores={catalogoLabores}
          isEditMode={isEditMode}
          faseReal={faseReal}
          errors={errors}
          control={control}
          register={register}
          setValue={setValue}
          removeLabor={removeLabor}
        />
      ))}
    </div>
  )
}
