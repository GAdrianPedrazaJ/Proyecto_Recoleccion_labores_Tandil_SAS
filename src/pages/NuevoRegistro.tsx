import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FormProvider, useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useColaboradores } from '../hooks/useColaboradores'
import { useFormulario } from '../hooks/useFormulario'
import { getAllVariedades, getAreaById } from '../services/db'
import { syncFromRemote } from '../services/sync'
import type { Area, Variedad, RegistroFV } from '../types'
import { Header } from '../components/layout/Header'
import { BottomNav } from '../components/layout/BottomNav'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Spinner } from '../components/ui/Spinner'
import { FilaColaboradorForm } from '../components/forms/FilaColaboradorForm'

const laborSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  camasPlaneadas: z.number().min(0),
  rendimientoEstimadoPorCama: z.number().min(0),
  camasEjecutadas: z.number().min(0),
  rendimientoRealPorCama: z.number().min(0),
  tiempoEjecucion: z.number().min(0),
})

const filaSchema = z.object({
  _active: z.boolean(),
  colaboradorId: z.string(),
  nombre: z.string(),
  externo: z.boolean(),
  variedad: z.string(),
  horaInicio: z.string(),
  tallosEstimados: z.number().min(0),
  tallosReales: z.number().min(0),
  labores: z.array(laborSchema).max(5),
  proceso: z.boolean(),
  seguridad: z.boolean(),
  calidad: z.boolean(),
  cumplimiento: z.boolean(),
  compromiso: z.boolean(),
  observaciones: z.string(),
})

const registroSchema = z.object({
  fecha: z.string().min(1, 'La fecha es requerida'),
  tipo: z.string().min(1, 'El tipo es requerido'),
  filas: z.array(filaSchema),
})

const TIPOS_LABOR = [
  { value: 'Labores', label: 'Labores' },
  { value: 'Corte', label: 'Corte' },
  { value: 'Siembra', label: 'Siembra' },
  { value: 'Fumigación', label: 'Fumigación' },
  { value: 'Otro', label: 'Otro' },
]

function nowLocalDatetime() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function nowTime() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function NuevoRegistro() {
  const { areaId } = useParams<{ areaId: string }>()
  const navigate = useNavigate()
  const { colaboradores, loading: loadingColabs } = useColaboradores(areaId ?? '')
  const { save, saving } = useFormulario()
  const [area, setArea] = useState<Area | null>(null)
  const [variedades, setVariedades] = useState<Variedad[]>([])
  const [success, setSuccess] = useState(false)

  const methods = useForm<RegistroFV>({
    resolver: zodResolver(registroSchema),
    defaultValues: {
      fecha: nowLocalDatetime(),
      tipo: 'Labores',
      filas: [],
    },
  })

  const { fields } = useFieldArray({
    control: methods.control,
    name: 'filas',
  })
  const { reset } = methods

  // Cargar área y variedades
  useEffect(() => {
    if (!areaId) return
    getAreaById(decodeURIComponent(areaId)).then((a) => setArea(a ?? null))

    async function loadVariedades() {
      let vars = await getAllVariedades()
      if (vars.length === 0) {
        await syncFromRemote()
        vars = await getAllVariedades()
      }
      setVariedades(vars)
    }
    loadVariedades()
  }, [areaId])

  // Inicializar filas cuando cargan los colaboradores
  useEffect(() => {
    if (colaboradores.length === 0) return
    const hora = nowTime()
    reset({
      fecha: nowLocalDatetime(),
      tipo: 'Labores',
      filas: colaboradores.map((c) => ({
        _active: false,
        colaboradorId: c.id,
        nombre: c.nombre,
        externo: c.externo,
        variedad: '',
        horaInicio: hora,
        tallosEstimados: 0,
        tallosReales: 0,
        labores: [],
        proceso: false,
        seguridad: false,
        calidad: false,
        cumplimiento: false,
        compromiso: false,
        observaciones: '',
      })),
    })
  }, [colaboradores, reset])

  const onSubmit = async (data: RegistroFV) => {
    const filasActivas = data.filas
      .filter((f) => f._active)
      .map(({ _active: _a, ...rest }) => rest)

    if (filasActivas.length === 0) {
      methods.setError('filas', { message: 'Selecciona al menos un colaborador' })
      return
    }

    const fechaDate = new Date(data.fecha)

    await save({
      fecha: fechaDate.toISOString().slice(0, 10),
      areaId: decodeURIComponent(areaId ?? ''),
      areaNombre: area?.nombre ?? '',
      supervisorId: '',
      tipo: data.tipo,
      filas: filasActivas,
    })

    setSuccess(true)
    setTimeout(() => navigate('/historial'), 1500)
  }

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">✅</div>
        <h2 className="text-xl font-bold text-green-700">Registro guardado</h2>
        <p className="text-sm text-gray-500">Sincronizando en segundo plano...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header title={area?.nombre ?? 'Nuevo Registro'} showBack />

      <main className="flex-1 px-4 py-6 pb-32 space-y-5">
        <h1 className="text-xl font-bold text-gray-900">Nuevo Registro</h1>

        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} noValidate className="space-y-5">
            {/* Meta del formulario */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Fecha y hora"
                type="datetime-local"
                className="col-span-2"
                error={methods.formState.errors.fecha?.message}
                {...methods.register('fecha')}
              />
              <Select
                label="Tipo de labor"
                options={TIPOS_LABOR}
                className="col-span-2"
                error={methods.formState.errors.tipo?.message}
                {...methods.register('tipo')}
              />
            </div>

            {/* Selección de colaboradores */}
            <div>
              <h2 className="mb-3 font-semibold text-gray-700">
                Colaboradores que trabajan hoy
              </h2>

              {loadingColabs && (
                <div className="flex justify-center py-6">
                  <Spinner />
                </div>
              )}

              {methods.formState.errors.filas && typeof methods.formState.errors.filas.message === 'string' && (
                <p className="mb-3 text-sm text-red-600">{methods.formState.errors.filas.message}</p>
              )}

              <div className="space-y-2">
                {fields.map((field, index) => {
                  const isActive = methods.watch(`filas.${index}._active`)
                  return (
                    <div key={field.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                      {/* Toggle row */}
                      <label className="flex cursor-pointer items-center gap-3 p-3">
                        <input
                          type="checkbox"
                          className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                          {...methods.register(`filas.${index}._active`)}
                        />
                        <span className="flex-1 font-medium text-gray-800 text-sm">
                          {field.nombre}
                        </span>
                        {field.externo && (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                            Externo
                          </span>
                        )}
                      </label>

                      {/* Expanded form */}
                      {isActive && (
                        <div className="border-t border-gray-100 p-3">
                          <FilaColaboradorForm
                            index={index}
                            nombre={field.nombre}
                            variedades={variedades}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Submit */}
            <div className="fixed bottom-16 inset-x-0 px-4 py-3 bg-white border-t border-gray-200 shadow-lg">
              <Button type="submit" className="w-full" size="lg" loading={saving}>
                Guardar Registro
              </Button>
            </div>
          </form>
        </FormProvider>
      </main>

      <BottomNav />
    </div>
  )
}
