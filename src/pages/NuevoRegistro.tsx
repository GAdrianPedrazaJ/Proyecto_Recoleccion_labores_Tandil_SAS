import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { FormProvider, useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useFormulario } from '../hooks/useFormulario'
import { getAllLabores, getAllVariedades, getAreaById, getBloquesByArea, getFormularioById } from '../services/db'
import { syncFromRemote } from '../services/sync'
import type { Area, Bloque, Formulario, LaborCatalog, RegistroFV, SeleccionColaborador, Variedad } from '../types'
import { Header } from '../components/layout/Header'
import { BottomNav } from '../components/layout/BottomNav'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Spinner } from '../components/ui/Spinner'
import { FilaColaboradorForm } from '../components/forms/FilaColaboradorForm'

// â”€â”€â”€ Zod Schemas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const laborSchema = z.object({
  laborId: z.string().min(1, 'Selecciona una labor'),
  laborNombre: z.string(),
  camasEstimadas: z.number().int().min(0),
  tiempoCamaEstimado: z.number().min(0),
  rendimientoHorasEstimado: z.number(),
  camasReales: z.number().int().min(0),
  tiempoCamaReal: z.number().min(0),
  rendimientoHorasReal: z.number(),
  rendimientoPorcentaje: z.number(),
})

const filaSchema = z.object({
  _active: z.boolean(),
  colaboradorId: z.string(),
  nombre: z.string(),
  externo: z.boolean(),
  variedadId: z.string(),
  bloqueId: z.string(),
  tiempoEstimadoMinutos: z.number().min(0),
  tiempoEstimadoHoras: z.number(),
  tiempoRealMinutos: z.number().min(0),
  tiempoRealHoras: z.number(),
  tallosEstimados: z.number().int().min(0),
  tallosReales: z.number().int().min(0),
  horaInicio: z.string(),
  horaFinCorteEstimado: z.string(),
  horaFinCorteReal: z.string(),
  horaCama: z.number(),
  rendimientoCorteEstimado: z.number().min(0),
  rendimientoCorteReal: z.number().min(0),
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
  tipo: z.string().min(1),
  filas: z.array(filaSchema),
})

// â”€â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const TIPOS_LABOR = [
  { value: 'Labores', label: 'Labores' },
  { value: 'Corte', label: 'Corte' },
  { value: 'Siembra', label: 'Siembra' },
  { value: 'FumigaciÃ³n', label: 'FumigaciÃ³n' },
  { value: 'Otro', label: 'Otro' },
]

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function nowDate() {
  return new Date().toISOString().slice(0, 10)
}

function nowTime() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())}`
}

function defaultFila(c: SeleccionColaborador) {
  return {
    _active: true,
    colaboradorId: c.colaboradorId,
    nombre: c.nombre,
    externo: c.externo,
    variedadId: c.variedadId,
    bloqueId: c.bloqueId,
    tiempoEstimadoMinutos: 0,
    tiempoEstimadoHoras: 0,
    tiempoRealMinutos: 0,
    tiempoRealHoras: 0,
    tallosEstimados: 0,
    tallosReales: 0,
    horaInicio: nowTime(),
    horaFinCorteEstimado: '',
    horaFinCorteReal: '',
    horaCama: 0,
    rendimientoCorteEstimado: 0,
    rendimientoCorteReal: 0,
    labores: [],
    proceso: false,
    seguridad: false,
    calidad: false,
    cumplimiento: false,
    compromiso: false,
    observaciones: '',
  }
}

// â”€â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function NuevoRegistro() {
  const { areaId, formularioId } = useParams<{ areaId?: string; formularioId?: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { save, update, saving } = useFormulario()
  const isEditMode = !!formularioId

  const [area, setArea] = useState<Area | null>(null)
  const [laborCatalog, setLaborCatalog] = useState<LaborCatalog[]>([])
  const [bloques, setBloques] = useState<Bloque[]>([])
  const [variedades, setVariedades] = useState<Variedad[]>([])
  const [formularioOriginal, setFormularioOriginal] = useState<Formulario | null>(null)
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)

  const methods = useForm<RegistroFV>({
    resolver: zodResolver(registroSchema),
    defaultValues: { fecha: nowDate(), tipo: 'Labores', filas: [] },
  })

  const { fields } = useFieldArray({ control: methods.control, name: 'filas' })

  // Load labor catalog and variedades (shared between modes)
  useEffect(() => {
    async function loadCatalog() {
      const [labs, vars] = await Promise.all([getAllLabores(), getAllVariedades()])
      if (labs.length === 0) {
        await syncFromRemote()
        const [labs2, vars2] = await Promise.all([getAllLabores(), getAllVariedades()])
        setLaborCatalog(labs2)
        setVariedades(vars2)
      } else {
        setLaborCatalog(labs)
        setVariedades(vars)
      }
    }
    loadCatalog()
  }, [])

  // NEW mode: load area + init filas from navigation state
  useEffect(() => {
    if (isEditMode || !areaId) return
    const id = decodeURIComponent(areaId)
    Promise.all([getAreaById(id), getBloquesByArea(id)]).then(([areaData, bloquesData]) => {
      setArea(areaData ?? null)
      setBloques(bloquesData)
      const navState = location.state as { selecciones?: SeleccionColaborador[] } | null
      const selecciones = navState?.selecciones ?? []
      methods.reset({
        fecha: nowDate(),
        tipo: 'Labores',
        filas: selecciones.map(defaultFila),
      })
      setLoading(false)
    })
  }, [areaId, isEditMode]) // eslint-disable-line react-hooks/exhaustive-deps

  // EDIT mode: load existing formulario
  useEffect(() => {
    if (!isEditMode || !formularioId) return
    getFormularioById(formularioId).then(async (f) => {
      if (!f) { navigate('/historial'); return }
      setFormularioOriginal(f)
      const bloquesData = await getBloquesByArea(f.areaId)
      setArea({ id: f.areaId, nombre: f.areaNombre, sedeId: '', supervisorId: f.supervisorId, activo: true })
      setBloques(bloquesData)
      methods.reset({
        fecha: f.fecha,
        tipo: f.tipo,
        filas: f.filas.map((fila) => ({ _active: true, ...fila })),
      })
      setLoading(false)
    })
  }, [formularioId, isEditMode]) // eslint-disable-line react-hooks/exhaustive-deps

  // â”€â”€â”€ Save handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleSave = async (data: RegistroFV, estado: 'borrador' | 'completo') => {
    const filasActivas = data.filas
      .filter((f) => f._active)
      .map(({ _active: _, ...rest }) => rest)

    if (filasActivas.length === 0) {
      alert('No hay colaboradores activos en el formulario.')
      return
    }

    if (isEditMode && formularioOriginal) {
      await update({
        ...formularioOriginal,
        fecha: data.fecha,
        tipo: data.tipo,
        estado,
        filas: filasActivas,
        sincronizado: false,
      })
    } else {
      await save({
        fecha: data.fecha,
        areaId: decodeURIComponent(areaId ?? ''),
        areaNombre: area?.nombre ?? '',
        supervisorId: area?.supervisorId ?? '',
        tipo: data.tipo,
        estado,
        filas: filasActivas,
      })
    }
    setSuccess(true)
    setTimeout(() => navigate('/historial'), 1200)
  }

  // â”€â”€â”€ Success screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">âœ…</div>
        <h2 className="text-xl font-bold text-green-700">
          {isEditMode ? 'Registro actualizado' : 'Registro guardado'}
        </h2>
        <p className="text-sm text-gray-500">Redirigiendo al historial...</p>
      </div>
    )
  }

  const pageTitle = isEditMode
    ? `Completar Â· ${area?.nombre ?? '...'}`
    : `Registro Â· ${area?.nombre ?? '...'}`

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header title={pageTitle} showBack showSync />

      <main className="flex-1 px-4 py-6 pb-40 space-y-4">
        {loading && (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        )}

        {!loading && (
          <FormProvider {...methods}>
            <form noValidate className="space-y-4">
              {/* Meta */}
              <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-4 space-y-3">
                <Input
                  label="Fecha"
                  type="date"
                  error={methods.formState.errors.fecha?.message}
                  {...methods.register('fecha')}
                />
                <Select
                  label="Tipo de registro"
                  options={TIPOS_LABOR}
                  {...methods.register('tipo')}
                />
              </div>

              {/* Colaboradores */}
              {fields.length === 0 && (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                  No hay colaboradores. Vuelve atrÃ¡s para seleccionarlos.
                </div>
              )}

              {fields.map((_field, index) => (
                <FilaColaboradorForm
                  key={_field.id}
                  index={index}
                  bloques={bloques}
                  variedades={variedades}
                  laborCatalog={laborCatalog}
                  isEditMode={isEditMode}
                />
              ))}
            </form>
          </FormProvider>
        )}
      </main>

      {/* Bottom action bar */}
      {!loading && (
        <div className="fixed bottom-16 inset-x-0 px-4 py-3 bg-white border-t border-gray-200 shadow-lg space-y-2">
          {isEditMode ? (
            <Button
              type="button"
              className="w-full"
              size="lg"
              loading={saving}
              onClick={() => methods.handleSubmit((d) => handleSave(d, 'completo'))()}
            >
              âœ… Guardar Registro Completo
            </Button>
          ) : (
            <>
              <Button
                type="button"
                className="w-full"
                size="lg"
                loading={saving}
                onClick={() => methods.handleSubmit((d) => handleSave(d, 'borrador'))()}
              >
                ðŸ’¾ Guardar Estimados (Borrador)
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                size="lg"
                loading={saving}
                onClick={() => methods.handleSubmit((d) => handleSave(d, 'completo'))()}
              >
                âœ… Registro Completo
              </Button>
            </>
          )}
        </div>
      )}

      <BottomNav />
    </div>
  )
}
