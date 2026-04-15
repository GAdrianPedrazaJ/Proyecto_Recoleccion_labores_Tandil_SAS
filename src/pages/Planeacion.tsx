import { useEffect, useState } from 'react'
import { useNavigationStore } from '../store/useNavigationStore'
import { useNavigation } from '../hooks/useNavigation'
import { FormProvider, useFieldArray, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  getAllLabores,
  getAllVariedades,
  getAreaById,
  getBloquesByArea,
  getAllVariedadesBloques,
  getFormularioById,
  putFormulario,
} from '../services/db'
import { savePlaneacion } from '../services/api'
import type {
  Area,
  Bloque,
  LaborCatalog,
  SeleccionColaborador,
  Variedad,
  VariedadBloque,
  FilaColaborador,
} from '../types'
import { Header } from '../components/layout/Header'
import { BottomNav } from '../components/layout/BottomNav'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Select'
import { Spinner } from '../components/ui/Spinner'
import { Badge } from '../components/ui/Badge'
import { FormularioCorteSimple } from '../components/forms/FormularioCorteSimple'
import { FormularioLaboresSimple } from '../components/forms/FormularioLaboresSimple'

// Zod schema para una fila de planeación (Corte + Labores)
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

const filaPlaneacionSchema = z.object({
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
  labores: z.array(laborSchema).min(0),
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

const planeacionRegistroSchema = z.object({
  fecha: z.string().min(1, 'La fecha es requerida'),
  tipo: z.literal('Planeacion'),
  filas: z.array(filaPlaneacionSchema),
})

function fmt2(n: number): string {
  return Number.isFinite(n) ? n.toFixed(2) : '0.00'
}

function nowDate() {
  return new Date().toISOString().slice(0, 10)
}

function nowTime() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())}`
}

type FilaPlaneacion = FilaColaborador & { _active: boolean }

function defaultFila(
  colaborador: SeleccionColaborador,
  bloqueId: string,
  variedadId: string
): FilaPlaneacion {
  return {
    _active: true,
    colaboradorId: colaborador.colaboradorId,
    nombre: colaborador.nombre,
    externo: colaborador.externo,
    variedadId,
    bloqueId,
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

interface SeleccionBV {
  bloqueId: string
  variedadId: string
  bloqueNombre: string
  variedadNombre: string
}

export default function Planeacion() {
  const { params } = useNavigationStore()
  const areaId = params.areaId ? String(params.areaId) : undefined
  const formularioId = params.formularioId ? String(params.formularioId) : undefined
  const sedeId = String(params.sedeId ?? '')
  const navigate = useNavigation()

  const [area, setArea] = useState<Area | null>(null)
  const [bloques, setBloques] = useState<Bloque[]>([])
  const [variedades, setVariedades] = useState<Variedad[]>([])
  const [colaboradores, setColaboradores] = useState<SeleccionColaborador[]>([])
  const [variedadesBloques, setVariedadesBloques] = useState<VariedadBloque[]>([])
  const [laborCatalog, setLaborCatalog] = useState<LaborCatalog[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)

  // Selección de bloque/variedad
  const [bloqueSeleccioando, setBloqueSeleccionando] = useState('')
  const [variedadSeleccionando, setVariedadSeleccionando] = useState('')
  const [seleccionesBV, setSeleccionesBV] = useState<SeleccionBV[]>([])

  const form = useForm({
    resolver: zodResolver(planeacionRegistroSchema),
    defaultValues: {
      fecha: nowDate(),
      tipo: 'Planeacion',
      filas: [],
    },
  })

  const { fields: filaFields, append: appendFila } = useFieldArray({
    control: form.control,
    name: 'filas',
  })

  const filasValues = useWatch({
    control: form.control,
    name: 'filas',
  })

  const totalRendimientoLabores = filasValues?.reduce((acc, fila) => {
    const totalEstimadas = fila.labores?.reduce((sum: number, lab: any) => sum + (lab.camasEstimadas || 0), 0) ?? 0
    const totalReales = fila.labores?.reduce((sum: number, lab: any) => sum + (lab.camasReales || 0), 0) ?? 0
    return {
      camasEstimadas: acc.camasEstimadas + totalEstimadas,
      camasReales: acc.camasReales + totalReales,
    }
  }, { camasEstimadas: 0, camasReales: 0 })

  const rendimientoTotalPorcentaje = totalRendimientoLabores?.camasEstimadas > 0
    ? (totalRendimientoLabores.camasReales / totalRendimientoLabores.camasEstimadas) * 100
    : 0

  const isCompletionMode = Boolean(isEditMode && formularioId)
  const buttonLabel = isCompletionMode ? 'Guardar cierre (reales)' : 'Guardar estimados'
  const formularioFase = isCompletionMode ? 'real' : 'estimado'
  const formularioEstado = isCompletionMode ? 'completo' : 'borrador'

  const load = async () => {
    const decodedAreaId = areaId ? decodeURIComponent(areaId) : undefined
    const id = decodedAreaId ?? (formularioId ? (await getFormularioById(formularioId))?.areaId : undefined)
    if (!id) return

    // Cargar selecciones de colaboradores del sessionStorage
    const seleccionesJson = sessionStorage.getItem('labores-selecciones')
    const selecs: SeleccionColaborador[] = seleccionesJson ? JSON.parse(seleccionesJson) : []

    // Cargar datos necesarios
    const [areaData, bloquesData, varsData, vbData, laboresData] = await Promise.all([
      getAreaById(id),
      getBloquesByArea(id),
      getAllVariedades(),
      getAllVariedadesBloques(),
      getAllLabores(),
    ])

    setArea(areaData ?? null)
    setBloques(bloquesData)
    setVariedades(varsData)
    setVariedadesBloques(vbData)
    setLaborCatalog(laboresData)
    setColaboradores(selecs)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [areaId, formularioId])

  useEffect(() => {
    if (!formularioId) return

    const loadExistingForm = async () => {
      const existingForm = await getFormularioById(formularioId)
      if (!existingForm) return

      setIsEditMode(true)
      setArea({
        id: existingForm.areaId,
        nombre: existingForm.areaNombre,
        sedeId: '',
        supervisorId: existingForm.supervisorId,
        activo: true,
      })

      const filasConActivo = existingForm.filas.map((fila) => ({ _active: true, ...fila }))

      form.reset({
        fecha: existingForm.fecha,
        tipo: 'Planeacion',
        filas: filasConActivo,
      })

      const selecciones = existingForm.filas.reduce<SeleccionBV[]>((acc, fila) => {
        const exists = acc.some(
          (item) => item.bloqueId === fila.bloqueId && item.variedadId === fila.variedadId,
        )
        if (exists) return acc

        const bloqueNombre = bloques.find((b) => b.id === fila.bloqueId)?.nombre ?? ''
        const variedadNombre = variedades.find((v) => v.id === fila.variedadId)?.nombre ?? ''

        return [...acc, {
          bloqueId: fila.bloqueId,
          variedadId: fila.variedadId,
          bloqueNombre,
          variedadNombre,
        }]
      }, [])

      setSeleccionesBV(selecciones)
      setColaboradores(existingForm.filas.map((fila) => ({
        colaboradorId: fila.colaboradorId,
        nombre: fila.nombre,
        externo: fila.externo,
      })))
    }

    loadExistingForm()
  }, [formularioId, bloques, variedades])

  const bloquesOpts = bloques.map((b) => ({ value: b.id, label: b.nombre }))

  const getVarsOpts = (bloqueId: string) => {
    const allVars = variedades.map((v) => ({ value: v.id, label: v.nombre }))
    if (!bloqueId) return allVars
    const idsEnBloque = new Set(
      variedadesBloques.filter((vb) => vb.bloqueId === bloqueId).map((vb) => vb.variedadId)
    )
    if (idsEnBloque.size === 0) return allVars
    return variedades
      .filter((v) => idsEnBloque.has(v.id))
      .map((v) => ({ value: v.id, label: v.nombre }))
  }

  const handleAgregarBV = () => {
    if (!bloqueSeleccioando || !variedadSeleccionando) return

    const bloqueNom = bloques.find((b) => b.id === bloqueSeleccioando)?.nombre ?? ''
    const variedadNom = variedades.find((v) => v.id === variedadSeleccionando)?.nombre ?? ''

    // Avoid duplicates
    const existe = seleccionesBV.some(
      (s) => s.bloqueId === bloqueSeleccioando && s.variedadId === variedadSeleccionando
    )
    if (existe) return

    const nuevoSeleccion: SeleccionBV = {
      bloqueId: bloqueSeleccioando,
      variedadId: variedadSeleccionando,
      bloqueNombre: bloqueNom,
      variedadNombre: variedadNom,
    }

    setSeleccionesBV((prev) => [...prev, nuevoSeleccion])

    // Agregar una fila para cada colaborador con este bloque/variedad
    colaboradores.forEach((colab) => {
      appendFila(defaultFila(colab, bloqueSeleccioando, variedadSeleccionando))
    })

    setBloqueSeleccionando('')
    setVariedadSeleccionando('')
  }

  const handleRemoveBV = (idx: number) => {
    const bv = seleccionesBV[idx]
    if (!bv) return

    // Remover todas las filas que correspondan a este bloque/variedad
    form.setValue(
      'filas',
      filaFields.filter(
        (f) => !(f.bloqueId === bv.bloqueId && f.variedadId === bv.variedadId)
      )
    )

    setSeleccionesBV((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleGuardar = async (data: any) => {
    const filasActivas = data.filas.map((fila: any) => {
      const { _active, ...rest } = fila
      return rest
    })

    const formularioIdToUse = isEditMode && formularioId ? formularioId : crypto.randomUUID()
    const formularioData = {
      id: formularioIdToUse,
      fecha: data.fecha,
      areaId: areaId || area?.id || '',
      areaNombre: area?.nombre || '',
      supervisorId: area?.supervisorId || '',
      filas: filasActivas,
    }

    let remoteError: unknown = null
    try {
      await savePlaneacion(formularioData)
    } catch (error) {
      console.warn('No se pudo guardar la planeación en remoto, se mantendrá localmente:', error)
      remoteError = error
    }

    try {
      await putFormulario({
        id: formularioData.id,
        fecha: formularioData.fecha,
        areaId: formularioData.areaId,
        areaNombre: formularioData.areaNombre,
        supervisorId: formularioData.supervisorId,
        tipo: 'Planeacion',
        estado: formularioEstado,
        fase: formularioFase,
        filas: formularioData.filas,
        sincronizado: remoteError === null,
        intentosSincronizacion: remoteError === null ? 0 : 1,
        errorPermanente: false,
        fechaCreacion: new Date().toISOString(),
      })

      // Limpiar sessionStorage
      sessionStorage.removeItem('labores-selecciones')

      // Navegar a registros o mostrar confirmación
      navigate('historial', { areaId, sedeId })

      if (remoteError) {
        alert('Guardado localmente. Cuando tengas internet, se sincronizará.')
      }
    } catch (error) {
      console.error('Error guardando planeación localmente:', error)
      alert('Error al guardar la planeación. Intenta nuevamente.')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Header title="Planeación" showBack />
        <main className="flex-1 flex items-center justify-center">
          <Spinner />
        </main>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header title="Planeación" showBack />

      <main className="flex-1 px-4 py-6 pb-32 space-y-4">
        {area && (
          <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-4">
            <h1 className="text-lg font-bold text-gray-900">{area.nombre}</h1>
            <p className="text-sm text-gray-600 mt-1">
              {colaboradores.length} colaborador{colaboradores.length !== 1 ? 'es' : ''} seleccionado
              {colaboradores.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        <div className={`rounded-xl p-4 text-sm ${isCompletionMode ? 'bg-blue-50 border border-blue-200 text-blue-800' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'}`}>
          <p className="font-semibold">
            {isCompletionMode ? 'Completa los reales y guarda el cierre de la planeación.' : 'Estas cargando los estimados de la mañana. Guarda localmente si no tienes internet.'}
          </p>
          <p className="mt-1 opacity-80">
            {isCompletionMode
              ? 'Revisa los datos reales de corte y labores antes de guardar.'
              : 'Más tarde podrás regresar y completar los reales en el mismo registro.'}
          </p>
        </div>

        {/* Selector de Bloque/Variedad */}
        <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-4 space-y-3">
          <h2 className="font-semibold text-gray-700">Agregar Bloque y Variedad</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Select
              label="Bloque"
              options={bloquesOpts}
              placeholder="Seleccionar..."
              value={bloqueSeleccioando}
              onChange={(e) => {
                setBloqueSeleccionando(e.target.value)
                setVariedadSeleccionando('')
              }}
            />
            <Select
              label="Variedad"
              options={getVarsOpts(bloqueSeleccioando)}
              placeholder="Seleccionar..."
              value={variedadSeleccionando}
              onChange={(e) => setVariedadSeleccionando(e.target.value)}
              disabled={!bloqueSeleccioando}
            />
          </div>
          <Button
            variant="secondary"
            className="w-full"
            onClick={handleAgregarBV}
            disabled={!bloqueSeleccioando || !variedadSeleccionando}
          >
            Agregar Bloque/Variedad
          </Button>
        </div>

        {/* Bloques/Variedades Seleccionados */}
        {seleccionesBV.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-gray-700">Bloques y Variedades</h2>
            {seleccionesBV.map((bv, idx) => (
              <div key={idx} className="rounded-xl bg-white border border-gray-100 shadow-sm p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex gap-2">
                    <Badge variant="green">{bv.bloqueNombre}</Badge>
                    <Badge variant="blue">{bv.variedadNombre}</Badge>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveBV(idx)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Remover
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  {colaboradores.length} colaborador{colaboradores.length !== 1 ? 'es' : ''}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Formulario de Filas */}
        {Array.isArray(filasValues) && filasValues.length > 0 && (
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(handleGuardar)} className="space-y-4">
              {/* Por cada Bloque/Variedad */}
              {seleccionesBV.map((bv) => {
                const filasPorBV = filaFields.filter(
                  (f) => f.bloqueId === bv.bloqueId && f.variedadId === bv.variedadId
                )
                const startIdx = filaFields.findIndex(
                  (f) => f.bloqueId === bv.bloqueId && f.variedadId === bv.variedadId
                )

                return (
                  <div key={`${bv.bloqueId}-${bv.variedadId}`} className="space-y-3">
                    {/* Cabecera BloqueVariedad */}
                    <div className="rounded-xl bg-gradient-to-r from-green-500 to-green-600 shadow-md p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-white">
                          <h2 className="font-bold text-lg">{bv.bloqueNombre}</h2>
                          <p className="text-sm text-green-100">{bv.variedadNombre}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-green-100">
                            {filasPorBV.length} colaborador{filasPorBV.length !== 1 ? 'es' : ''}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Por cada Colaborador */}
                    {filasPorBV.map((fila, relIdx) => {
                      const actualIdx = startIdx + relIdx
                      const filaBasePath = `filas.${actualIdx}`

                      return (
                        <div
                          key={`${bv.bloqueId}-${bv.variedadId}-${fila.colaboradorId}`}
                          className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden"
                        >
                          {/* Colaborador header */}
                          <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                            <h3 className="font-semibold text-gray-900">{fila.nombre}</h3>
                            {fila.externo && <Badge variant="blue">Externo</Badge>}
                          </div>

                          <div className="p-4 space-y-6">
                            {/* CORTE */}
                            <div>
                              <h4 className="text-sm font-bold uppercase text-green-700 mb-3 pb-2 border-b border-green-200">
                                Corte
                              </h4>
                              <FormularioCorteSimple
                                indexAsset={filaBasePath}
                                isEditMode={isEditMode}
                                faseReal={false}
                              />
                            </div>

                            {/* LABORES */}
                            <div>
                              <h4 className="text-sm font-bold uppercase text-blue-700 mb-3 pb-2 border-b border-blue-200">
                                Labores
                              </h4>
                              <FormularioLaboresSimple
                                indexAsset={`${filaBasePath}.labores`}
                                catalogoLabores={laborCatalog}
                                isEditMode={isEditMode}
                                faseReal={false}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}

              {filasValues && filasValues.length > 0 && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 mb-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-blue-700">Rendimiento total de labores</p>
                      <p className="text-xs text-blue-600">
                        {totalRendimientoLabores.camasReales} camas reales / {totalRendimientoLabores.camasEstimadas} camas estimadas
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-semibold text-blue-900">{fmt2(rendimientoTotalPorcentaje)}%</p>
                      <p className="text-xs text-blue-600">Sobre el total de camas</p>
                    </div>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" size="lg">
                {buttonLabel}
              </Button>
            </form>
          </FormProvider>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
