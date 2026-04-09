import {
  fetchAreas,
  fetchBloques,
  fetchColaboradores,
  fetchLabores,
  fetchSedes,
  fetchSupervisores,
  fetchVariedades,
  postRegistro,
} from './api'
import {
  getPendientesSincronizacion,
  putArea,
  putBloque,
  putColaborador,
  putFormulario,
  putLabor,
  putSede,
  putSupervisor,
  putVariedad,
} from './db'
import type { Formulario } from '../types'

const MAX_SYNC_ATTEMPTS = 5

/**
 * Descarga áreas, colaboradores y variedades desde el backend y los guarda en IDB.
 * Si no hay conexión, usa el caché local sin errores.
 */
export async function syncFromRemote(): Promise<void> {
  try {
    const [sedes, areas, supervisores, bloques, colaboradores, variedades, labores] =
      await Promise.all([
        fetchSedes(),
        fetchAreas(),
        fetchSupervisores(),
        fetchBloques(),
        fetchColaboradores(),
        fetchVariedades(),
        fetchLabores(),
      ])
    await Promise.all([
      ...sedes.map(putSede),
      ...areas.map(putArea),
      ...supervisores.map(putSupervisor),
      ...bloques.map(putBloque),
      ...colaboradores.map(putColaborador),
      ...variedades.map(putVariedad),
      ...labores.map(putLabor),
    ])
  } catch {
    // Sin conexión — usar caché IDB existente
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
