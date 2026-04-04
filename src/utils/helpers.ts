import type { LaboresTuple } from '../types'

/** Genera un id único simple para registros locales (reemplazar por UUID si el backend lo exige). */
export function createId(prefix = 'id'): string {
  return `${prefix}-${crypto.randomUUID()}`
}

/** Labores vacías para nuevos colaboradores (3 slots). */
export function emptyLabores(): LaboresTuple {
  return [undefined, undefined, undefined]
}

/** Parsea VITE_SYNC_INTERVAL_MS con valor por defecto. */
export function getSyncIntervalMs(): number {
  const raw = import.meta.env.VITE_SYNC_INTERVAL_MS
  const n = Number.parseInt(String(raw ?? '30000'), 10)
  return Number.isFinite(n) && n > 0 ? n : 30_000
}

/** Fecha local YYYY-MM-DD para filtros “hoy”. */
export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}
