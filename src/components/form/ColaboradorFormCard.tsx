import { useMemo } from 'react'
import type { Labor } from '../../types'
import { LABOR_OPCIONES, calcRendCorte, laborFromPartial } from '../../utils/helpers'
import type { ColaboradorDraft } from './colaboradorDraft'
import { Input } from '../ui/Input'

/** Card expandible por colaborador en el asistente de nuevo registro. */
export function ColaboradorFormCard({
  nombre,
  expanded,
  onToggle,
  draft,
  onChange,
}: {
  nombre: string
  expanded: boolean
  onToggle: () => void
  draft: ColaboradorDraft
  onChange: (next: ColaboradorDraft) => void
}) {
  const rendCorte = useMemo(
    () => calcRendCorte(draft.tallosReales, draft.tiempoRealH),
    [draft.tallosReales, draft.tiempoRealH],
  )

  const updateLabor = (i: number, patch: Partial<Labor>) => {
    const labores = draft.labores.map((l, j) => {
      if (j !== i) return l
      return laborFromPartial({ ...l, ...patch })
    })
    onChange({ ...draft, labores })
  }

  const addLabor = () => {
    if (draft.labores.length >= 5) return
    onChange({
      ...draft,
      labores: [...draft.labores, laborFromPartial({ nombre: 'Programacion' })],
    })
  }

  const removeLabor = (i: number) => {
    if (draft.labores.length <= 1) return
    onChange({
      ...draft,
      labores: draft.labores.filter((_, j) => j !== i),
    })
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <span className="font-semibold text-ink">{nombre}</span>
        <span className="text-xs text-gray-500">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded ? (
        <div className="space-y-4 border-t border-gray-100 px-4 pb-4 pt-2">
          <section>
            <h3 className="mb-2 text-sm font-semibold text-primary">Tallos</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Tallos estimados"
                type="number"
                min={0}
                value={draft.tallosEstimados}
                onChange={(e) =>
                  onChange({
                    ...draft,
                    tallosEstimados: Number(e.target.value) || 0,
                  })
                }
              />
              <Input
                label="Tallos reales"
                type="number"
                min={0}
                value={draft.tallosReales}
                onChange={(e) =>
                  onChange({
                    ...draft,
                    tallosReales: Number(e.target.value) || 0,
                  })
                }
              />
              <Input
                label="Hora inicio"
                type="time"
                value={draft.horaInicio}
                onChange={(e) => onChange({ ...draft, horaInicio: e.target.value })}
              />
              <Input
                label="Tiempo estimado (h)"
                type="number"
                step="0.01"
                value={draft.tiempoEstH}
                onChange={(e) =>
                  onChange({
                    ...draft,
                    tiempoEstH: Number(e.target.value) || 0,
                  })
                }
              />
              <Input
                label="Tiempo real (h)"
                type="number"
                step="0.01"
                value={draft.tiempoRealH}
                onChange={(e) =>
                  onChange({
                    ...draft,
                    tiempoRealH: Number(e.target.value) || 0,
                  })
                }
              />
              <div className="flex flex-col justify-end">
                <span className="text-xs font-medium text-gray-600">
                  Rend. corte (tallos/h)
                </span>
                <span className="text-lg font-semibold text-ink">
                  {rendCorte.toFixed(1)}
                </span>
              </div>
            </div>
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-primary">Labores</h3>
              <button
                type="button"
                className="text-sm font-medium text-primary"
                onClick={addLabor}
                disabled={draft.labores.length >= 5}
              >
                + Agregar labor
              </button>
            </div>
            <div className="space-y-4">
              {draft.labores.map((lab, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-dashed border-gray-200 p-3"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-gray-600">
                      Labor {i + 1}
                    </span>
                    {draft.labores.length > 1 ? (
                      <button
                        type="button"
                        className="text-xs text-red-600"
                        onClick={() => removeLabor(i)}
                      >
                        Eliminar
                      </button>
                    ) : null}
                  </div>
                  <label className="mb-2 block text-sm font-medium text-ink">
                    Nombre
                    <select
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5"
                      value={lab.nombre}
                      onChange={(e) =>
                        updateLabor(i, {
                          nombre: e.target.value,
                        })
                      }
                    >
                      {LABOR_OPCIONES.map((op) => (
                        <option key={op} value={op}>
                          {op}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="Camas planeadas"
                      type="number"
                      min={0}
                      value={lab.camasPlaneadas}
                      onChange={(e) =>
                        updateLabor(i, {
                          camasPlaneadas: Number(e.target.value) || 0,
                        })
                      }
                    />
                    <Input
                      label="Rend. est. (min/cama)"
                      type="number"
                      step="0.1"
                      min={0}
                      value={lab.rendimientoEstimadoPorCama}
                      onChange={(e) =>
                        updateLabor(i, {
                          rendimientoEstimadoPorCama: Number(e.target.value) || 0,
                        })
                      }
                    />
                    <Input
                      label="Camas ejecutadas"
                      type="number"
                      min={0}
                      value={lab.camasEjecutadas}
                      onChange={(e) =>
                        updateLabor(i, {
                          camasEjecutadas: Number(e.target.value) || 0,
                        })
                      }
                    />
                    <Input
                      label="Rend. real (min/cama)"
                      type="number"
                      step="0.1"
                      min={0}
                      value={lab.rendimientoRealPorCama}
                      onChange={(e) =>
                        updateLabor(i, {
                          rendimientoRealPorCama: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <dl className="mt-2 grid grid-cols-2 gap-1 text-xs text-gray-600">
                    <dt>Tiempo est. (min)</dt>
                    <dd className="text-right font-medium text-ink">
                      {lab.tiempoEstimado.toFixed(1)}
                    </dd>
                    <dt>Tiempo real (min)</dt>
                    <dd className="text-right font-medium text-ink">
                      {lab.tiempoReal.toFixed(1)}
                    </dd>
                    <dt>% Cumplimiento</dt>
                    <dd className="text-right font-medium text-primary">
                      {lab.cumplimiento}
                    </dd>
                  </dl>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-primary">Cumplimiento</h3>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.proceso}
                  onChange={(e) =>
                    onChange({ ...draft, proceso: e.target.checked })
                  }
                />
                Proceso
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.seguridad}
                  onChange={(e) =>
                    onChange({ ...draft, seguridad: e.target.checked })
                  }
                />
                Seguridad
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.calidad}
                  onChange={(e) =>
                    onChange({ ...draft, calidad: e.target.checked })
                  }
                />
                Calidad
              </label>
            </div>
            <label className="mt-3 block text-sm font-medium text-ink">
              Observaciones
              <textarea
                className="mt-1 min-h-[88px] w-full rounded-xl border border-gray-200 px-3 py-2.5 text-ink"
                value={draft.observaciones}
                onChange={(e) =>
                  onChange({ ...draft, observaciones: e.target.value })
                }
              />
            </label>
          </section>
        </div>
      ) : null}
    </div>
  )
}

export { ColaboradorFormCard as ColaboradorCard }
