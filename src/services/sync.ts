import {
  fetchAreas,
  fetchBloques,
  fetchColaboradores,
  fetchLabores,
  fetchSedes,
  fetchSupervisores,
  fetchVariedades,
  fetchVariedadesBloques,
  saveFormularioCompleto,
} from './api'
import {
  clearAreas,
  clearBloques,
  clearColaboradores,
  clearLabores,
  clearSedes,
  clearSupervisores,
  clearVariedades,
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
    // Para cada store de datos maestros: limpiar y repoblar SOLO si el backend
    // devolvio datos (evita borrar cache cuando no hay conexion)
    if (sedes.length > 0) { await clearSedes(); await Promise.all(sedes.map(putSede)) }
    if (areas.length > 0) { await clearAreas(); await Promise.all(areas.map(putArea)) }
    if (supervisores.length > 0) { await clearSupervisores(); await Promise.all(supervisores.map(putSupervisor)) }
    if (bloques.length > 0) { await clearBloques(); await Promise.all(bloques.map(putBloque)) }
    if (colaboradores.length > 0) { await clearColaboradores(); await Promise.all(colaboradores.map(putColaborador)) }
    if (variedades.length > 0) { await clearVariedades(); await Promise.all(variedades.map(putVariedad)) }
    await Promise.all(variedadesBloques.map(putVariedadBloque))
    if (labores.length > 0) { await clearLabores(); await Promise.all(labores.map(putLabor)) }
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
      await saveFormularioCompleto({
        id: formulario.id,
        fecha: formulario.fecha,
        areaId: formulario.areaId,
        supervisorId: formulario.supervisorId,
        tipo: formulario.tipo as 'Corte' | 'Labores' | 'Aseguramiento',
        estado: formulario.estado,
        filas: formulario.filas.map(f => ({
          colaboradorId: f.colaboradorId,
          nombre: f.nombre,
          externo: f.externo,
          bloqueId: f.bloqueId,
          variedadId: f.variedadId,
          tiempoEstimadoMinutos: f.tiempoEstimadoMinutos,
          tiempoRealMinutos: f.tiempoRealMinutos,
          tallosEstimados: f.tallosEstimados,
          tallosReales: f.tallosReales,
          horaInicio: f.horaInicio,
          horaFinEstimado: f.horaFinCorteEstimado,
          horaFinReal: f.horaFinCorteReal,
          horaCama: f.horaCama,
          rendimientoCorteEstimado: f.rendimientoCorteEstimado,
          rendimientoCorteReal: f.rendimientoCorteReal,
          labores: f.labores.map((l, idx) => ({
            id: `${formulario.id}-${f.colaboradorId}-labor-${idx}`,
            numero: idx + 1,
            laborId: l.laborId,
            laborNombre: l.laborNombre,
            camasEstimadas: l.camasEstimadas,
            tiempoCamaEstimado: l.tiempoCamaEstimado,
            camasReales: l.camasReales,
            tiempoCamaReal: l.tiempoCamaReal,
          })),
          desglose: f.desglossePiPc,
          procesoSeguridad: f.procesoSeguridad,
          calidad: [f.calidad1, f.calidad2, f.calidad3, f.calidad4, f.calidad5],
          rendimientoPromedio: f.rendimientoPromedio,
          observaciones: f.observaciones,
        })),
      })
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
