import { useEffect, useState } from 'react'
import { useNavigationStore } from '../store/useNavigationStore'
import { useNavigation } from '../hooks/useNavigation'
import { FormProvider, useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useFormulario } from '../hooks/useFormulario'
import { getAllLabores, getAllVariedades, getAreaById, getBloquesByArea, getFormularioBorradorDelDia, obtenerLosTres } from '../services/db'
import type { Area, Bloque, LaborCatalog, SeleccionColaborador, Variedad } from '../types'
import { Header } from '../components/layout/Header'
import { BottomNav } from '../components/layout/BottomNav'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Spinner } from '../components/ui/Spinner'
import { FilaColaboradorForm } from '../components/forms/FilaColaboradorForm'

// Zod schema - solo campos Labores
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

const filaLaboresSchema = z.object({
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
  // Labores-specific: array of labores
  labores: z.array(laborSchema).min(1, 'Al menos una labor requerida'),
  desglossePiPc: z.boolean(),
  procesoSeguridad: z.string(),
  calidad1: z.boolean(),
  calidad2: z.boolean(),
  calidad3: z.boolean(),
  calidad4: z.boolean(),
  calidad5: z.boolean(),
  cumplimientoCalidad: z.number(),
  rendimientoPromedio: z.number(),
  observaciones: z.string(),
})

const laboresRegistroSchema = z.object({
  fecha: z.string().min(1, 'La fecha es requerida'),
  tipo: z.literal('Labores'),
  filas: z.array(filaLaboresSchema),
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
    // Labores-specific
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
export default function FormularioLabores() {
  const { params } = useNavigationStore()
  const areaIdParam = params.areaId ? String(params.areaId) : undefined
  const areaId = areaIdParam
  const navigate = useNavigation()
  const { save, saving } = useFormulario()

  const [area, setArea] = useState<Area | null>(null)
  const [bloques, setBloques] = useState<Bloque[]>([])
  const [variedades, setVariedades] = useState<Variedad[]>([])
  const [laborCatalog, setLaborCatalog] = useState<LaborCatalog[]>([])
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [fase, setFase] = useState<'estimado' | 'real'>('estimado')

  const methods = useForm<typeof laboresRegistroSchema._type>({
    resolver: zodResolver(laboresRegistroSchema),
    defaultValues: { fecha: nowDate(), tipo: 'Labores', filas: [] },
  })

  const { fields } = useFieldArray({ control: methods.control, name: 'filas' })

  // Load master data + area initialization
  useEffect(() => {
    async function loadCatalog() {
      const labs = await getAllLabores()
      setLaborCatalog(labs)
    }
    loadCatalog()
  }, [])

  // Load area + init filas
  useEffect(() => {
    if (!areaId) return

    const today = nowDate()
    const seleccionesJson = sessionStorage.getItem('labores-selecciones')
    const selecciones: SeleccionColaborador[] = seleccionesJson ? JSON.parse(seleccionesJson) : []
    // NO limpiar sessionStorage - mantenerlo para siguiente formulario

    Promise.all([
      getAreaById(decodeURIComponent(areaId)),
      getBloquesByArea(decodeURIComponent(areaId)),
      getAllVariedades(),
      getFormularioBorradorDelDia(decodeURIComponent(areaId), today, 'Labores'),
    ]).then(([areaData, bloquesData, variedadesData, borradorExistente]) => {
      setArea(areaData ?? null)
      setBloques(bloquesData)
      setVariedades(variedadesData)

      if (borradorExistente) {
        // Ya existe → abrir en fase REAL
        setFase('real')
        methods.reset({
          fecha: borradorExistente.fecha,
          tipo: 'Labores',
          filas: borradorExistente.filas.map((fila) => ({ _active: true, ...fila })),
        })
      } else {
        // Primera vez → fase ESTIMADO
        setFase('estimado')
        methods.reset({
          fecha: today,
          tipo: 'Labores',
          filas: selecciones.length > 0 ? selecciones.map(defaultFila) : [],
        })
      }
      setLoading(false)
    })
  }, [areaId])

  const handleSave = async () => {
    methods.clearErrors()
    const data = methods.getValues()
    const filasActivas = data.filas.filter((f) => f._active).map(({ _active: _, ...rest }) => rest)

    if (filasActivas.length === 0) return

    // Validación básica para Labores: al menos una labor con datos
    let validationErrors = 0
    filasActivas.forEach((fila, i) => {
      if (fila.labores.length === 0) {
        methods.setError(`filas.${i}.labores` as any, { type: 'manual', message: 'Al menos una labor requerida' })
        validationErrors++
        return
      }
      fila.labores.forEach((labor, j) => {
        if (!labor.laborId)
          methods.setError(`filas.${i}.labores.${j}.laborId` as any, { type: 'manual' })
        if (fase === 'estimado') {
          if (!labor.camasEstimadas || labor.camasEstimadas < 1)
            methods.setError(`filas.${i}.labores.${j}.camasEstimadas` as any, { type: 'manual' })
          if (!labor.tiempoCamaEstimado || labor.tiempoCamaEstimado < 1)
            methods.setError(`filas.${i}.labores.${j}.tiempoCamaEstimado` as any, { type: 'manual' })
        } else {
          if (!labor.camasReales || labor.camasReales < 1)
            methods.setError(`filas.${i}.labores.${j}.camasReales` as any, { type: 'manual' })
          if (!labor.tiempoCamaReal || labor.tiempoCamaReal < 1)
            methods.setError(`filas.${i}.labores.${j}.tiempoCamaReal` as any, { type: 'manual' })
        }
      })
    })

    if (validationErrors > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    // Save
    const estado: 'borrador' | 'completo' = fase === 'estimado' ? 'borrador' : 'completo'
    const formularioNuevo = {
      fecha: data.fecha,
      areaId: decodeURIComponent(areaId ?? ''),
      areaNombre: area?.nombre ?? '',
      supervisorId: area?.supervisorId ?? '',
      tipo: 'Labores' as const,
      estado,
      fase: (fase === 'estimado' ? 'estimado' : 'real') as 'estimado' | 'real',
      filas: filasActivas,
    }

    // Notify about block-sync
    if (estado === 'completo') {
      const { corte, aseguramiento } = await obtenerLosTres(
        decodeURIComponent(areaId ?? ''),
        data.fecha,
      )
      const faltanTipos: string[] = []
      if (!corte) faltanTipos.push('Corte')
      if (!aseguramiento) faltanTipos.push('Aseguramiento')
      if (faltanTipos.length > 0) {
        console.info(`ℹ️ Guardando Labores...\nFaltan: ${faltanTipos.join(', ')}\nCompleta los 3 tipos para sincronización en bloque.`)
      }
    }

    await save(formularioNuevo)
    setSuccess(true)
    setTimeout(() => navigate('select-tipo', { areaId: decodeURIComponent(areaId ?? ''), sedeId: '' }), 1200)
  }

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">✅</div>
        <h2 className="text-xl font-bold text-green-700">Labores guardadas</h2>
        <p className="text-sm text-gray-500">Redirigiendo...</p>
      </div>
    )
  }

  const pageTitle = fase === 'real' ? `Cierre (Labores) · ${area?.nombre ?? '...'}` : `Registro Labores · ${area?.nombre ?? '...'}`

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
                {fase === 'estimado' ? (
                  <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-sm text-blue-700 font-medium">
                    📋 Ingreso de <strong>labores estimadas</strong>
                  </div>
                ) : (
                  <div className="rounded-lg bg-orange-50 border border-orange-200 px-3 py-2 text-sm text-orange-700 font-medium">
                    ✅ Ingreso de <strong>labores reales</strong>
                  </div>
                )}
                <Input
                  label="Fecha"
                  type="date"
                  readOnly={fase === 'real'}
                  error={methods.formState.errors.fecha?.message}
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
                  laborCatalog={laborCatalog}
                  isEditMode={false}
                  tipoRegistro="Labores"
                  faseReal={fase === 'real'}
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
            {fase === 'estimado' ? 'Guardar Labores Estimadas' : 'Guardar Labores Reales (Cierre)'}
          </Button>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
