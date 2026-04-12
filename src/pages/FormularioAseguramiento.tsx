import { useEffect, useState } from 'react'
import { useNavigationStore } from '../store/useNavigationStore'
import { useNavigation } from '../hooks/useNavigation'
import { FormProvider, useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useFormulario } from '../hooks/useFormulario'
import { getAllVariedades, getAreaById, getBloquesByArea, getFormularioById, obtenerLosTres } from '../services/db'
import type { Area, Bloque, SeleccionColaborador, Variedad } from '../types'
import { Header } from '../components/layout/Header'
import { BottomNav } from '../components/layout/BottomNav'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Spinner } from '../components/ui/Spinner'
import { FilaColaboradorForm } from '../components/forms/FilaColaboradorForm'

// Zod schema - solo campos Aseguramiento
const filaAseguramientoSchema = z.object({
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
  // Aseguramiento-specific
  labores: z.array(z.any()).max(0),
  desglossePiPc: z.boolean(),
  procesoSeguridad: z.string().min(1, 'Proceso de seguridad requerido'),
  calidad1: z.boolean(),
  calidad2: z.boolean(),
  calidad3: z.boolean(),
  calidad4: z.boolean(),
  calidad5: z.boolean(),
  cumplimientoCalidad: z.number(),
  rendimientoPromedio: z.number(),
  observaciones: z.string(),
})

const aseguramientoRegistroSchema = z.object({
  fecha: z.string().min(1, 'La fecha es requerida'),
  tipo: z.literal('Aseguramiento'),
  filas: z.array(filaAseguramientoSchema),
})

// Helpers
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
    // Aseguramiento-specific
    labores: [],
    desglossePiPc: false,
    procesoSeguridad: '',
    calidad1: false,
    calidad2: false,
    calidad3: false,
    calidad4: false,
    calidad5: false,
    cumplimientoCalidad: 0,
    rendimientoPromedio: 0,
    observaciones: '',
  }
}

// Component
export default function FormularioAseguramiento() {
  const { params } = useNavigationStore()
  const areaIdParam = params.areaId ? String(params.areaId) : undefined
  const formularioId = params.formularioId ? String(params.formularioId) : undefined
  const areaId = areaIdParam
  const navigate = useNavigation()
  const { save, saving } = useFormulario()
  const isEditMode = !!formularioId

  const [area, setArea] = useState<Area | null>(null)
  const [bloques, setBloques] = useState<Bloque[]>([])
  const [variedades, setVariedades] = useState<Variedad[]>([])
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)

  const methods = useForm<typeof aseguramientoRegistroSchema._type>({
    resolver: zodResolver(aseguramientoRegistroSchema),
    defaultValues: { fecha: nowDate(), tipo: 'Aseguramiento', filas: [] },
  })

  const { fields } = useFieldArray({ control: methods.control, name: 'filas' })

  // Load area + init filas
  useEffect(() => {
    if (isEditMode) {
      if (!formularioId) return
      getFormularioById(formularioId).then(async (f) => {
        if (!f) {
          navigate('historial')
          return
        }
        const bloquesData = await getBloquesByArea(f.areaId)
        const variedadesData = await getAllVariedades()
        setArea({ id: f.areaId, nombre: f.areaNombre, sedeId: '', supervisorId: f.supervisorId, activo: true })
        setBloques(bloquesData)
        setVariedades(variedadesData)
        methods.reset({
          fecha: f.fecha,
          tipo: 'Aseguramiento',
          filas: f.filas.map((fila) => ({ _active: true, ...fila })),
        })
        setLoading(false)
      })
      return
    }

    if (!areaId) return

    const today = nowDate()
    const seleccionesJson = sessionStorage.getItem('labores-selecciones')
    const selecciones: SeleccionColaborador[] = seleccionesJson ? JSON.parse(seleccionesJson) : []
    sessionStorage.removeItem('labores-selecciones')

    Promise.all([
      getAreaById(decodeURIComponent(areaId)),
      getBloquesByArea(decodeURIComponent(areaId)),
      getAllVariedades(),
    ]).then(([areaData, bloquesData, variedadesData]) => {
      setArea(areaData ?? null)
      setBloques(bloquesData)
      setVariedades(variedadesData)

      // Aseguramiento siempre se crea nuevo (no tiene fase estimado/real)
      methods.reset({
        fecha: today,
        tipo: 'Aseguramiento',
        filas: selecciones.length > 0 ? selecciones.map(defaultFila) : [],
      })
      setLoading(false)
    })
  }, [areaId, isEditMode])

  const handleSave = async () => {
    methods.clearErrors()
    const data = methods.getValues()
    const filasActivas = data.filas.filter((f) => f._active).map(({ _active: _, ...rest }) => rest)

    if (filasActivas.length === 0) return

    // Validación: procesoSeguridad requerido para cada fila activa
    let validationErrors = 0
    filasActivas.forEach((fila, i) => {
      if (!fila.procesoSeguridad || fila.procesoSeguridad.trim().length === 0) {
        methods.setError(`filas.${i}.procesoSeguridad` as any, { type: 'manual', message: 'Requerido' })
        validationErrors++
      }
    })

    if (validationErrors > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    // Save - Aseguramiento siempre se guarda como 'completo'
    const formularioNuevo = {
      fecha: data.fecha,
      areaId: decodeURIComponent(areaId ?? ''),
      areaNombre: area?.nombre ?? '',
      supervisorId: area?.supervisorId ?? '',
      tipo: 'Aseguramiento' as const,
      estado: 'completo' as const,
      fase: 'real' as const,
      filas: filasActivas,
    }

    // Notify about block-sync
    const { corte, labores } = await obtenerLosTres(
      decodeURIComponent(areaId ?? ''),
      data.fecha,
    )
    const faltanTipos: string[] = []
    if (!corte) faltanTipos.push('Corte')
    if (!labores) faltanTipos.push('Labores')
    if (faltanTipos.length > 0) {
      console.info(`ℹ️ Guardando Aseguramiento...\nFaltan: ${faltanTipos.join(', ')}\nCompleta los 3 tipos para sincronización en bloque.`)
    }

    await save(formularioNuevo)
    setSuccess(true)
    setTimeout(() => navigate('historial'), 1200)
  }

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">✅</div>
        <h2 className="text-xl font-bold text-green-700">Aseguramiento guardado</h2>
        <p className="text-sm text-gray-500">Redirigiendo...</p>
      </div>
    )
  }

  const pageTitle = `Aseguramiento · ${area?.nombre ?? '...'}`

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header title={pageTitle} showBack />

      <main className="flex-1 px-4 py-6 pb-40 space-y-4">
        {loading && (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        )}

        {!loading && (
          <FormProvider {...methods}>
            <form noValidate className="space-y-4">
              {/* Date input */}
              <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-4 space-y-3">
                <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700 font-medium">
                  ✅ Formulario de <strong>Aseguramiento</strong> — completa una sola vez
                </div>
                <Input
                  label="Fecha"
                  type="date"
                  readOnly
                  {...methods.register('fecha')}
                />
              </div>

              {/* Colaboradores */}
              {fields.length === 0 && (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                  No hay colaboradores. Vuelve atrás para seleccionarlos.
                </div>
              )}

              {fields.map((_field, index) => (
                <FilaColaboradorForm
                  key={_field.id}
                  index={index}
                  bloques={bloques}
                  variedades={variedades}
                  laborCatalog={[]}
                  isEditMode={isEditMode}
                  tipoRegistro="Aseguramiento"
                  faseReal={false}
                />
              ))}
            </form>
          </FormProvider>
        )}
      </main>

      {/* Bottom action bar */}
      {!loading && (
        <div className="fixed bottom-16 inset-x-0 px-4 py-3 bg-white border-t border-gray-200 shadow-lg">
          <Button
            type="button"
            className="w-full"
            size="lg"
            loading={saving}
            onClick={handleSave}
          >
            Guardar Aseguramiento
          </Button>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
