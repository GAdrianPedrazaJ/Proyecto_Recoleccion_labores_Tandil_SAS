import type { RegistroColaborador } from '../types'
import {
  getPendientesSincronizacion,
  putRegistro,
  putArea,
  putColaborador,
  setAllVariedades,
} from './db'
import { postRegistroLabores, fetchAreas, fetchColaboradores, fetchVariedades } from './api'

const MAX_INTENTOS = 5

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** backoff exponencial, acotado */
function backoffDelay(attempts: number) {
  return Math.min(30_000, 1000 * 2 ** attempts)
}

/**
 * Sincroniza todos los formularios con sincronizado: false.
 * - 200 → marca sincronizado: true y resetea intentos.
 * - Fallo → incrementa intentosSincronizacion; a 5 intentos marca error permanente.
 * - Persiste `ultimoError` con mensaje detallado para diagnóstico.
 */
export async function syncPendientes(): Promise<{
  ok: number
  failed: number
}> {
  const pendientes: RegistroColaborador[] = await getPendientesSincronizacion()
  let ok = 0
  let failed = 0

  for (const registro of pendientes) {
    try {
      // Intento principal
      const { status } = await postRegistroLabores(registro)
      if (status === 200) {
        await putRegistro({
          ...registro,
          sincronizado: true,
          intentosSincronizacion: 0,
          errorSincronizacionPermanente: false,
          ultimoError: undefined,
        })
        ok += 1
        continue
      }

      // Respuestas no 200 se tratan como fallo
      await registrarFallo(registro, `HTTP ${status}`)
      failed += 1
    } catch (err: unknown) {
      // Si es error transitorio, intentar un reintento corto con backoff
      const msg = err instanceof Error ? err.message : String(err)
      const nextAttempt = registro.intentosSincronizacion + 1
      // Intentar reintento inmediato hasta 2 reintentos rápidos
      if (nextAttempt < 3) {
        const delay = backoffDelay(nextAttempt)
        await sleep(delay)
        try {
          const { status } = await postRegistroLabores(registro)
          if (status === 200) {
            await putRegistro({
              ...registro,
              sincronizado: true,
              intentosSincronizacion: 0,
              errorSincronizacionPermanente: false,
              ultimoError: undefined,
            })
            ok += 1
            continue
          }
          await registrarFallo(registro, `HTTP ${status}`)
          failed += 1
          continue
        } catch (err2: unknown) {
          const msg2 = err2 instanceof Error ? err2.message : String(err2)
          await registrarFallo(registro, `${msg} | retry: ${msg2}`)
          failed += 1
          continue
        }
      }

      // Si no reintentamos más, registrar fallo y avanzar
      await registrarFallo(registro, msg)
      failed += 1
    }
  }

  return { ok, failed }
}

async function registrarFallo(registro: RegistroColaborador, errorMsg: string): Promise<void> {
  const intentos = registro.intentosSincronizacion + 1
  const errorSincronizacionPermanente = intentos >= MAX_INTENTOS
  await putRegistro({
    ...registro,
    intentosSincronizacion: intentos,
    errorSincronizacionPermanente,
    ultimoError: errorMsg,
  })
}

/**
 * Descarga áreas, colaboradores y variedades desde Google Sheets
 * y los guarda en IndexedDB para uso offline.
 */
export async function syncFromRemote(): Promise<void> {
  try {
    const [areas, colaboradores, variedades] = await Promise.all([
      fetchAreas(),
      fetchColaboradores(),
      fetchVariedades(),
    ])

    for (const area of areas) {
      await putArea({
        id: area.id,
        nombre: area.nombre,
        tipo: (area as { tipo?: string }).tipo as 'Corte' | 'Labores' | 'Vegetativa' ?? 'Labores',
        sede: area.sede,
        activo: true,
      })
    }

    for (const col of colaboradores) {
      await putColaborador({
        id: col.id,
        nombre: col.nombre,
        areaId: col.areaId,
        externo: col.externo,
        activo: col.activo,
      })
    }

    await setAllVariedades(variedades)
  } catch (err) {
    // Fallo silencioso: la app funciona con los datos locales
    console.warn('[sync] syncFromRemote falló, usando datos locales:', err)
  }
}
