import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import type { Colaborador as ColModel, Area } from '../../types'
import type { RegistroColaborador } from '../../types'
import { useAppStore } from '../../store/useAppStore'
import {
  getAllAreas,
  getAllColaboradores,
  putRegistro,
} from '../../services/db'
import { syncPendientes } from '../../services/sync'
import {
  buildIdRegistro,
  calcRendCorte,
  createId,
  diaLaboralFromFecha,
  semanaDesdeFecha,
  todayIsoDate,
  toLaboresTuple,
} from '../../utils/helpers'
import { useToast } from '../../hooks/useToast'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { ColaboradorFormCard } from '../../components/form/ColaboradorFormCard'
import {
  defaultColaboradorDraft,
  type ColaboradorDraft,
} from '../../components/form/colaboradorDraft'

const step1Schema = z.object({
  areaId: z.string().min(1, 'Selecciona un área'),
  fecha: z.string().min(1),
  variedad: z.string(),
  modo: z.enum(['todos', 'uno']),
})

type Step1Values = z.infer<typeof step1Schema>

export function NuevoRegistro() {
  const navigate = useNavigate()
  const usuario = useAppStore((s) => s.usuarioActual)
  const isOnline = useAppStore((s) => s.isOnline)
  const { showToast } = useToast()

  const [areas, setAreas] = useState<Area[]>([])
  const [cols, setCols] = useState<ColModel[]>([])
  const [step, setStep] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [drafts, setDrafts] = useState<Record<string, ColaboradorDraft>>({})
  const [expanded, setExpanded] = useState<string | null>(null)
  const [cabecera, setCabecera] = useState<Step1Values | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      fecha: todayIsoDate(),
      variedad: '',
      modo: 'todos',
      areaId: '',
    },
  })

  useEffect(() => {
    void (async () => {
      const [a, c] = await Promise.all([
        getAllAreas(),
        getAllColaboradores(),
      ])
      const allowed = usuario?.areas?.length
        ? a.filter((x) => usuario.areas.includes(x.id) && x.activo)
        : a.filter((x) => x.activo)
      setAreas(allowed)
      setCols(c.filter((x) => x.activo))
    })()
  }, [usuario?.areas])

  const colaboradoresArea = !cabecera?.areaId
    ? []
    : cols.filter((c) => c.areaId === cabecera.areaId)

  const onStep1 = (data: Step1Values) => {
    setCabecera(data)
    const areaCols = cols.filter(
      (c) => c.areaId === data.areaId && c.activo,
    )
    if (data.modo === 'todos') {
      setSelectedIds(areaCols.map((c) => c.id))
    } else {
      setSelectedIds([])
    }
    setStep(2)
  }

  useEffect(() => {
    if (step !== 3) return
    setDrafts((prev) => {
      const next = { ...prev }
      for (const id of selectedIds) {
        if (!next[id]) next[id] = defaultColaboradorDraft()
      }
      return next
    })
  }, [step, selectedIds])

  const toggleCol = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const goGuardar = async (variedad: string, fecha: string, area: Area) => {
    if (selectedIds.length === 0) {
      showToast('Selecciona al menos un colaborador', 'error')
      return
    }
    const formularioId = createId('form')
    const supNombre = usuario?.nombre ?? ''
    const semana = semanaDesdeFecha(fecha)
    const diaStr = diaLaboralFromFecha(fecha)

    let no = 1
    for (const cid of selectedIds) {
      const col = cols.find((c) => c.id === cid)
      const draft = drafts[cid] ?? defaultColaboradorDraft()
      if (!col) continue

      const rendCorte = calcRendCorte(draft.tallosReales, draft.tiempoRealH)
      const idRegistro = buildIdRegistro(area.tipo, fecha, no)

      const row: RegistroColaborador = {
        id: createId('reg'),
        formularioId,
        areaId: area.id,
        fecha,
        dia: diaStr,
        tipo: area.tipo,
        supervisor: supNombre,
        sede: area.sede,
        semana,
        idRegistro,
        no,
        colaborador: col.nombre,
        externo: col.externo ? 'Sí' : 'No',
        variedad,
        horaInicio: draft.horaInicio,
        tallosEstimados: draft.tallosEstimados,
        tallosReales: draft.tallosReales,
        tiempoEstH: draft.tiempoEstH,
        tiempoRealH: draft.tiempoRealH,
        rendCorte,
        labores: toLaboresTuple(draft.labores),
        proceso: draft.proceso,
        seguridad: draft.seguridad,
        calidad: draft.calidad,
        observaciones: draft.observaciones,
        sincronizado: false,
        intentosSincronizacion: 0,
        fechaCreacion: new Date().toISOString(),
      }
      await putRegistro(row)
      no += 1
    }

    if (isOnline) {
      await syncPendientes()
      showToast('Guardado y sincronización intentada', 'success')
    } else {
      showToast('Guardado sin conexión; pendiente de sync', 'info')
    }
    window.dispatchEvent(new CustomEvent('labores:sync'))
    navigate('/supervisor/pendientes')
  }

  const areaSeleccionada = cabecera
    ? areas.find((a) => a.id === cabecera.areaId)
    : undefined

  useEffect(() => {
    if (step === 1 && cabecera) reset(cabecera)
  }, [step, cabecera, reset])

  return (
    <div className="space-y-6 px-4 py-4 pb-28">
      <h1 className="text-xl font-bold text-ink">Nuevo registro</h1>
      <div className="flex gap-2 text-xs font-medium text-gray-500">
        <span className={step >= 1 ? 'text-primary' : ''}>1. Cabecera</span>
        <span>→</span>
        <span className={step >= 2 ? 'text-primary' : ''}>2. Colaboradores</span>
        <span>→</span>
        <span className={step >= 3 ? 'text-primary' : ''}>3. Detalle</span>
      </div>

      {step === 1 ? (
        <form
          className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4"
          onSubmit={handleSubmit(onStep1)}
        >
          <label className="block text-sm font-medium text-ink">
            Área
            <select
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-3"
              {...register('areaId')}
            >
              <option value="">Selecciona…</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre} ({a.tipo})
                </option>
              ))}
            </select>
            {errors.areaId ? (
              <span className="text-xs text-red-600">{errors.areaId.message}</span>
            ) : null}
          </label>
          <Input
            label="Fecha"
            type="date"
            {...register('fecha')}
            error={errors.fecha?.message}
          />
          <Input
            label="Variedad de rosa"
            {...register('variedad')}
            placeholder="Ej. Freedom"
          />
          <fieldset>
            <legend className="text-sm font-medium text-ink">Modo</legend>
            <label className="mt-2 flex items-center gap-2 text-sm">
              <input type="radio" value="todos" {...register('modo')} />
              Llenar por todos los colaboradores
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" value="uno" {...register('modo')} />
              Un colaborador específico
            </label>
          </fieldset>
          <Button type="submit">Siguiente</Button>
        </form>
      ) : null}

      {step === 2 && cabecera ? (
        <div className="space-y-4">
          <Button
            variant="secondary"
            type="button"
            onClick={() => setStep(1)}
          >
            ← Atrás
          </Button>
          {cabecera?.modo === 'todos' ? (
            <ul className="space-y-2">
              {colaboradoresArea.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(c.id)}
                    onChange={() => toggleCol(c.id)}
                  />
                  <span className="text-sm font-medium text-ink">{c.nombre}</span>
                </li>
              ))}
            </ul>
          ) : (
            <label className="block text-sm font-medium text-ink">
              Colaborador
              <select
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-3"
                value={selectedIds[0] ?? ''}
                onChange={(e) =>
                  setSelectedIds(e.target.value ? [e.target.value] : [])
                }
              >
                <option value="">Selecciona…</option>
                {colaboradoresArea.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </label>
          )}
          <Button
            type="button"
            onClick={() => {
              if (cabecera?.modo === 'uno' && selectedIds.length === 0) {
                showToast('Selecciona un colaborador', 'error')
                return
              }
              if (cabecera?.modo === 'todos' && selectedIds.length === 0) {
                showToast('Selecciona al menos uno', 'error')
                return
              }
              setStep(3)
            }}
          >
            Siguiente
          </Button>
        </div>
      ) : null}

      {step === 3 && cabecera && areaSeleccionada ? (
        <div className="space-y-4">
          <Button
            variant="secondary"
            type="button"
            onClick={() => setStep(2)}
          >
            ← Atrás
          </Button>
          {selectedIds.map((cid) => {
            const col = cols.find((c) => c.id === cid)
            if (!col) return null
            return (
              <ColaboradorFormCard
                key={cid}
                nombre={col.nombre}
                expanded={expanded === cid}
                onToggle={() =>
                  setExpanded((e) => (e === cid ? null : cid))
                }
                draft={drafts[cid] ?? defaultColaboradorDraft()}
                onChange={(d) =>
                  setDrafts((prev) => ({ ...prev, [cid]: d }))
                }
              />
            )
          })}
          <Button
            type="button"
            onClick={() => {
              void goGuardar(
                cabecera.variedad,
                cabecera.fecha,
                areaSeleccionada,
              )
            }}
          >
            Guardar y enviar
          </Button>
        </div>
      ) : null}
    </div>
  )
}
