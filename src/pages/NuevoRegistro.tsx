import { useEffect, useState } from 'react'
import { useNavigationStore } from '../store/useNavigationStore'
import { useNavigation } from '../hooks/useNavigation'
import { FormProvider, useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useFormulario } from '../hooks/useFormulario'
import { getAllLabores, getAllVariedades, getAreaById, getBloquesByArea, getFormularioById, getFormularioBorradorDelDia, obtenerLosTres } from '../services/db'
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

const registroSchema = z.object({
  fecha: z.string().min(1, 'La fecha es requerida'),
  tipo: z.string().min(1),
  filas: z.array(filaSchema),
})

// â”€â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const TIPOS_REGISTRO = [
  { value: 'Corte', label: 'Corte' },
  { value: 'Labores', label: 'Labores' },
  { value: 'Aseguramiento', label: 'Aseguramiento' },
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

// â”€â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function NuevoRegistro() {
  const { params } = useNavigationStore()
  const areaId = params.areaId ? String(params.areaId) : undefined
  const formularioId = params.formularioId ? String(params.formularioId) : undefined
  const tipoParam = params.tipo ? String(params.tipo) : 'Labores'
  console.log('🚀 NuevoRegistro mount - params:', { areaId, formularioId, tipoParam, rawParams: params })
  const navigate = useNavigation()
  const { save, update, saving } = useFormulario()
  const isEditMode = !!formularioId

  const [area, setArea] = useState<Area | null>(null)
  const [laborCatalog, setLaborCatalog] = useState<LaborCatalog[]>([])
  const [bloques, setBloques] = useState<Bloque[]>([])
  const [variedades, setVariedades] = useState<Variedad[]>([])
  const [formularioOriginal, setFormularioOriginal] = useState<Formulario | null>(null)
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  // fase: 'estimado' = primera carga del día (solo estimados), 'real' = completar reales
  const [fase, setFase] = useState<'estimado' | 'real'>('estimado')

  const methods = useForm<RegistroFV>({
    resolver: zodResolver(registroSchema),
    defaultValues: { fecha: nowDate(), tipo: tipoParam, filas: [] },
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

  // NEW mode: load area + init filas from sessionStorage
  useEffect(() => {
    if (isEditMode || !areaId) return
    // Obtener selecciones del sessionStorage (pasadas desde AreaDetalle)
    const seleccionesJson = sessionStorage.getItem('labores-selecciones')
    const selecciones = seleccionesJson ? JSON.parse(seleccionesJson) : []
    // Limpiar después de usar
    sessionStorage.removeItem('labores-selecciones')
    const today = nowDate()
    console.log('🔍 Buscando borrador con tipoParam:', tipoParam)
    Promise.all([getAreaById(areaId), getBloquesByArea(areaId), getFormularioBorradorDelDia(areaId, today, tipoParam)]).then(([areaData, bloquesData, borradorExistente]) => {
      setArea(areaData ?? null)
      setBloques(bloquesData)
      if (borradorExistente) {
        // Ya existe un borrador del día → abrir en fase REAL (completar reales)
        setFase('real')
        setFormularioOriginal(borradorExistente)
        methods.reset({
          fecha: borradorExistente.fecha,
          tipo: borradorExistente.tipo,
          filas: borradorExistente.filas.map((fila) => ({ _active: true, ...fila })),
        })
      } else {
        // Primera vez del día → fase ESTIMADO
        setFase('estimado')
        methods.reset({
          fecha: today,
          tipo: tipoParam,
          filas: selecciones.length > 0 ? selecciones.map(defaultFila) : [],
        })
      }
      setLoading(false)
    })
  }, [areaId, isEditMode]) // eslint-disable-line react-hooks/exhaustive-deps

  // EDIT mode: load existing formulario
  useEffect(() => {
    if (!isEditMode || !formularioId) return
    getFormularioById(formularioId).then(async (f) => {
      if (!f) { navigate('historial'); return }
      setFormularioOriginal(f)
      setFase(f.fase ?? 'real')
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

  const [validationErrors, setValidationErrors] = useState(0)

  const validateFila = (
    fila: RegistroFV['filas'][number],
    estado: 'borrador' | 'completo',
    index: number,
    tipo: string,
  ): Array<{ field: string; message: string }> => {
    const errs: Array<{ field: string; message: string }> = []
    const req = (ok: boolean, field: string, msg = 'Campo requerido') => {
      if (!ok) errs.push({ field: `filas.${index}.${field}`, message: msg })
    }

    if (tipo === 'Corte') {
      // Estimados requeridos en borrador y completo
      req(fila.tiempoEstimadoMinutos > 0, 'tiempoEstimadoMinutos')
      req(fila.tallosEstimados > 0, 'tallosEstimados')
      req(!!fila.horaInicio, 'horaInicio')
      req(!!fila.horaFinCorteEstimado, 'horaFinCorteEstimado')
      req(fila.rendimientoCorteEstimado > 0, 'rendimientoCorteEstimado')
      // Reales solo al completar
      if (estado === 'completo') {
        req(fila.tiempoRealMinutos > 0, 'tiempoRealMinutos')
        req(fila.tallosReales > 0, 'tallosReales')
        req(!!fila.horaFinCorteReal, 'horaFinCorteReal')
        req(fila.rendimientoCorteReal > 0, 'rendimientoCorteReal')
      }
    } else if (tipo === 'Labores') {
      // Al menos una labor con datos estimados
      fila.labores.forEach((labor, j) => {
        req(!!labor.laborId, `labores.${j}.laborId`, 'Selecciona una labor')
        req(labor.camasEstimadas > 0, `labores.${j}.camasEstimadas`)
        req(labor.tiempoCamaEstimado > 0, `labores.${j}.tiempoCamaEstimado`)
        if (estado === 'completo') {
          req(labor.camasReales > 0, `labores.${j}.camasReales`)
          req(labor.tiempoCamaReal > 0, `labores.${j}.tiempoCamaReal`)
        }
      })
    } else if (tipo === 'Aseguramiento') {
      // Proceso y seguridad requerido siempre
      req(!!fila.procesoSeguridad, 'procesoSeguridad')
    }

    return errs
  }

  const handleSave = async (estadoForzado?: 'borrador' | 'completo') => {
    methods.clearErrors()
    setValidationErrors(0)
    const data = methods.getValues()
    const filasActivas = data.filas
      .filter((f) => f._active)
      .map(({ _active: _, ...rest }) => rest)

    if (filasActivas.length === 0) return

    console.log('📋 Guardando formulario:', { tipo: data.tipo, tipoParam, fase, filasActivas: filasActivas.length })

    // En fase 'estimado' siempre se guarda borrador; en fase 'real' siempre completo
    const estado: 'borrador' | 'completo' = estadoForzado ?? (fase === 'estimado' ? 'borrador' : 'completo')

    // Validar todos los campos requeridos según el estado y tipo
    let allErrs: Array<{ field: string; message: string }> = []
    data.filas.forEach((fila, i) => {
      if (!fila._active) return
      allErrs = [...allErrs, ...validateFila(fila, estado, i, data.tipo)]
    })

    if (allErrs.length > 0) {
      allErrs.forEach(({ field, message }) =>
        methods.setError(field as Parameters<typeof methods.setError>[0], { type: 'manual', message }),
      )
      setValidationErrors(allErrs.length)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    if (formularioOriginal) {
      // Actualizar borrador existente (fase real o edición normal)
      const formularioActualizado = {
        ...formularioOriginal,
        fecha: data.fecha,
        tipo: data.tipo,
        estado,
        fase: estado === 'completo' ? 'real' : formularioOriginal.fase,
        filas: filasActivas,
        sincronizado: false,
      }

      // Si se completa, informar sobre block-sync pero permitir guardado
      if (estado === 'completo') {
        const { corte, labores, aseguramiento } = await obtenerLosTres(
          decodeURIComponent(areaId ?? ''),
          data.fecha,
        )

        const faltanTipos: string[] = []
        if (!corte && data.tipo !== 'Corte') faltanTipos.push('Corte')
        if (!labores && data.tipo !== 'Labores') faltanTipos.push('Labores')
        if (!aseguramiento && data.tipo !== 'Aseguramiento') faltanTipos.push('Aseguramiento')

        // Informar al usuario sobre el estado (pero no bloquear)
        if (faltanTipos.length > 0) {
          const msg = `ℹ️ Guardando ${data.tipo}...\n\nFaltan: ${faltanTipos.join(', ')}\n\nCompleta los 3 tipos para que se sincronicen juntos a Supabase.`
          console.info(msg)
        }
      }

      await update(formularioActualizado)
    } else {
      const formularioNuevo = {
        fecha: data.fecha,
        areaId: decodeURIComponent(areaId ?? ''),
        areaNombre: area?.nombre ?? '',
        supervisorId: area?.supervisorId ?? '',
        tipo: data.tipo,
        estado,
        fase,
        filas: filasActivas,
      }

      // Si se completa directamente, permitir pero informar
      if (estado === 'completo') {
        const { corte, labores, aseguramiento } = await obtenerLosTres(
          decodeURIComponent(areaId ?? ''),
          data.fecha,
        )

        const faltanTipos: string[] = []
        if (!corte && data.tipo !== 'Corte') faltanTipos.push('Corte')
        if (!labores && data.tipo !== 'Labores') faltanTipos.push('Labores')
        if (!aseguramiento && data.tipo !== 'Aseguramiento') faltanTipos.push('Aseguramiento')

        // Informar pero permitir guardado
        if (faltanTipos.length > 0) {
          const msg = `ℹ️ Guardando ${data.tipo}...\n\nFaltan: ${faltanTipos.join(', ')}\n\nCompleta los 3 tipos para que se sincronicen juntos a Supabase.`
          console.info(msg)
        }
      }

      await save(formularioNuevo)
    }
    setSuccess(true)
    setTimeout(() => navigate('historial'), 1200)
  }

  // â”€â”€â”€ Success screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">✅</div>
        <h2 className="text-xl font-bold text-green-700">
          {isEditMode ? 'Registro actualizado' : 'Registro guardado'}
        </h2>
        <p className="text-sm text-gray-500">Redirigiendo al historial...</p>
      </div>
    )
  }

  const pageTitle = isEditMode
    ? `Completar · ${area?.nombre ?? '...'}`
    : fase === 'real'
      ? `Cierre · ${area?.nombre ?? '...'}`
      : `Registro · ${area?.nombre ?? '...'}`

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
              {/* Meta */}
              <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-4 space-y-3">
                {/* Banner de fase */}
                {fase === 'estimado' ? (
                  <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-sm text-blue-700 font-medium">
                    📋 Ingreso de <strong>estimados</strong> — los datos reales se completan más tarde
                  </div>
                ) : (
                  <div className="rounded-lg bg-orange-50 border border-orange-200 px-3 py-2 text-sm text-orange-700 font-medium">
                    ✅ Ingreso de <strong>reales</strong> — los estimados no se pueden editar
                  </div>
                )}
                <Input
                  label="Fecha"
                  type="date"
                  readOnly={fase === 'real'}
                  error={methods.formState.errors.fecha?.message}
                  {...methods.register('fecha')}
                />
                <Select
                  label="Tipo de registro"
                  options={TIPOS_REGISTRO}
                  disabled={fase === 'real'}
                  {...methods.register('tipo')}
                />
              </div>

              {/* Colaboradores */}
              {fields.length === 0 && (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                  No hay colaboradores. Vuelve atrás para seleccionarlos.
                </div>
              )}

              {fields.map((_field, index) => {
                const tipoRegistro = methods.watch('tipo')
                return (
                  <FilaColaboradorForm
                    key={_field.id}
                    index={index}
                    bloques={bloques}
                    variedades={variedades}
                    laborCatalog={laborCatalog}
                    isEditMode={isEditMode}
                    tipoRegistro={tipoRegistro}
                    faseReal={fase === 'real'}
                  />
                )
              })}
            </form>
          </FormProvider>
        )}
      </main>

      {/* Bottom action bar */}
      {!loading && (
        <div className="fixed bottom-16 inset-x-0 px-4 py-3 bg-white border-t border-gray-200 shadow-lg space-y-2">
          {validationErrors > 0 && (
            <p className="text-center text-xs font-medium text-red-600 bg-red-50 rounded-lg py-2">
              Hay {validationErrors} campo{validationErrors !== 1 ? 's' : ''} requerido{validationErrors !== 1 ? 's' : ''} sin completar
            </p>
          )}
          {isEditMode || fase === 'real' ? (
            <Button
              type="button"
              className="w-full"
              size="lg"
              loading={saving}
              onClick={() => handleSave('completo')}
            >
              Guardar Cierre (Reales)
            </Button>
          ) : (
            <Button
              type="button"
              className="w-full"
              size="lg"
              loading={saving}
              onClick={() => handleSave('borrador')}
            >
              Guardar Estimados
            </Button>
          )}
        </div>
      )}

      <BottomNav />
    </div>
  )
}
