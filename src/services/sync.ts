import {
  fetchAreas,
  fetchBloques,
  fetchColaboradores,
  fetchLabores,
  fetchSedes,
  fetchSupervisores,
  fetchVariedades,
  fetchVariedadesBloques,
  postRegistro,
} from './api'
import {
  clearVariedadesBloques,
  getPendientesSincronizacion,
  putArea,
  putBloque,
  putColaborador,
  putFormulario,
  putLabor,
  putSede,
  putSupervisor,
  putVariedad,
  putVariedadBloque,
} from './db'
import type { Formulario } from '../types'

const MAX_SYNC_ATTEMPTS = 5

// Mutex: evita ejecuciones paralelas de syncFromRemote
let syncInProgress = false

/**
 * Descarga datos maestros desde el backend y los guarda en IDB.
 * Cada endpoint falla de forma independiente — un tab faltante no cancela los demás.
 * Usa mutex para evitar llamadas concurrentes que disparen rate-limit en Sheets.
 */
export async function syncFromRemote(): Promise<void> {
  if (syncInProgress) return
  syncInProgress = true
  try {
    // Cada fetch es independiente: si un tab no existe en Sheets, los demás siguen
    const safe = <T>(p: Promise<T[]>): Promise<T[]> => p.catch(() => [])

    const [sedes, areas, supervisores, bloques, colaboradores, variedades, variedadesBloques, labores] =
      await Promise.all([
        safe(fetchSedes()),
        safe(fetchAreas()),
        safe(fetchSupervisores()),
        safe(fetchBloques()),
        safe(fetchColaboradores()),
        safe(fetchVariedades()),
        safe(fetchVariedadesBloques()),
        safe(fetchLabores()),
      ])

    await clearVariedadesBloques()
    await Promise.all([
      ...sedes.map(putSede),
      ...areas.map(putArea),
      ...supervisores.map(putSupervisor),
      ...bloques.map(putBloque),
      ...colaboradores.map(putColaborador),
      ...variedades.map(putVariedad),
      ...variedadesBloques.map(putVariedadBloque),
      ...labores.map(putLabor),
    ])
  } catch {
    // Sin conexión — usar caché IDB existente
  } finally {
    syncInProgress = false
  }
}

export interface SyncResult {
  synced: number
  errors: number
}

/**
 * Sincroniza formularios pendientes con el backend.
 * Actualiza el estado de cada formulario en IDB tras el intento.
 */
export async function syncPendientes(): Promise<SyncResult> {
  const pendientes = await getPendientesSincronizacion()
  let synced = 0
  let errors = 0

  for (const formulario of pendientes) {
    try {
      await postRegistro(formulario)
      const updated: Formulario = {
        ...formulario,
        sincronizado: true,
        intentosSincronizacion: formulario.intentosSincronizacion + 1,
        ultimoError: undefined,
      }
      await putFormulario(updated)
      synced++
    } catch (err: unknown) {
      const intentos = formulario.intentosSincronizacion + 1
      const errorMsg = err instanceof Error ? err.message : String(err)
      const updated: Formulario = {
        ...formulario,
        intentosSincronizacion: intentos,
        errorPermanente: intentos >= MAX_SYNC_ATTEMPTS,
        ultimoError: errorMsg,
      }
      await putFormulario(updated)
      errors++
    }
  }

  return { synced, errors }
}
