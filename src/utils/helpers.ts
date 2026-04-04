import type { FormularioDia, LaboresTuple, Labor } from '../types'

export function toLaboresTuple(labores: Labor[]): LaboresTuple {
  const t: LaboresTuple = [
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
  ]
  labores.slice(0, 5).forEach((l, i) => {
    t[i] = l
  })
  return t
}

export const LABOR_OPCIONES = [
  'Programacion',
  'Desbotone',
  'Pinche',
  'Amarre',
  'Desyeme',
  'Otro',
] as const

export function createId(prefix = 'id'): string {
  return `${prefix}-${crypto.randomUUID()}`
}

export function emptyLabores(): LaboresTuple {
  return [undefined, undefined, undefined, undefined, undefined]
}

export function getSyncIntervalMs(): number {
  const raw = import.meta.env.VITE_SYNC_INTERVAL_MS
  const n = Number.parseInt(String(raw ?? '30000'), 10)
  return Number.isFinite(n) && n > 0 ? n : 30_000
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Día laboral (Lunes–Sábado) a partir de fecha ISO. Domingo → Lunes. */
export function diaLaboralFromFecha(fechaIso: string): FormularioDia['dia'] {
  const d = new Date(fechaIso + 'T12:00:00')
  const g = d.getDay()
  const map: FormularioDia['dia'][] = [
    'Lunes',
    'Martes',
    'Miercoles',
    'Jueves',
    'Viernes',
    'Sabado',
  ]
  if (g === 0) return 'Lunes'
  return map[g - 1] ?? 'Lunes'
}

/** Número de semana ISO (1–53). */
export function getIsoWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

/** Formato "2026-W01" según especificación. */
export function semanaDesdeFecha(fechaIso: string): string {
  const d = new Date(fechaIso + 'T12:00:00')
  const y = d.getFullYear()
  const w = getIsoWeekNumber(d)
  return `${y}-W${String(w).padStart(2, '0')}`
}

export function buildIdRegistro(
  tipo: string,
  fecha: string,
  no: number,
): string {
  const t = tipo.length ? tipo[0].toUpperCase() : 'X'
  return `${t}-${fecha.replace(/-/g, '')}-${String(no).padStart(3, '0')}`
}

export function calcRendCorte(tallosReales: number, tiempoRealH: number): number {
  if (!tiempoRealH || tiempoRealH <= 0) return 0
  return tallosReales / tiempoRealH
}

export function calcTiempoEstimadoLabor(l: Labor): number {
  return (l.camasPlaneadas || 0) * (l.rendimientoEstimadoPorCama || 0)
}

export function calcTiempoRealLabor(l: Labor): number {
  return (l.camasEjecutadas || 0) * (l.rendimientoRealPorCama || 0)
}

export function calcCumplimientoPct(l: Labor): string {
  const p = l.camasPlaneadas
  if (!p || p <= 0) return '0%'
  const pct = ((l.camasEjecutadas || 0) / p) * 100
  return `${Math.round(pct)}%`
}

export function laborFromPartial(
  partial: Partial<Labor> & { nombre?: string },
): Labor {
  const base: Labor = {
    nombre: partial.nombre ?? '',
    camasPlaneadas: partial.camasPlaneadas ?? 0,
    rendimientoEstimadoPorCama: partial.rendimientoEstimadoPorCama ?? 0,
    tiempoEstimado: 0,
    camasEjecutadas: partial.camasEjecutadas ?? 0,
    rendimientoRealPorCama: partial.rendimientoRealPorCama ?? 0,
    tiempoReal: 0,
    cumplimiento: '0%',
  }
  base.tiempoEstimado = calcTiempoEstimadoLabor(base)
  base.tiempoReal = calcTiempoRealLabor(base)
  base.cumplimiento = calcCumplimientoPct(base)
  return base
}
