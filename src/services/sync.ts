import type { FormularioDia } from '../types'
import { getPendientesSincronizacion, putFormulario } from './db'
import { postRegistroLabores } from './api'

const MAX_INTENTOS = 5

/**
 * Sincroniza todos los formularios con sincronizado: false.
 * - 200 → marca sincronizado: true y resetea intentos.
 * - Fallo → incrementa intentosSincronizacion; a 5 intentos marca error permanente.
 */
export async function syncPendientes(): Promise<{
  ok: number
  failed: number
}> {
  const pendientes: FormularioDia[] = await getPendientesSincronizacion()
  let ok = 0
  let failed = 0

  for (const registro of pendientes) {
    try {
      const { status } = await postRegistroLabores(registro)
      if (status === 200) {
        await putFormulario({
          ...registro,
          sincronizado: true,
          intentosSincronizacion: 0,
          errorSincronizacionPermanente: false,
        })
        ok += 1
      } else {
        await registrarFallo(registro)
        failed += 1
      }
    } catch {
      await registrarFallo(registro)
      failed += 1
    }
  }

  return { ok, failed }
}

async function registrarFallo(registro: FormularioDia): Promise<void> {
  const intentos = registro.intentosSincronizacion + 1
  const errorSincronizacionPermanente = intentos >= MAX_INTENTOS
  await putFormulario({
    ...registro,
    intentosSincronizacion: intentos,
    errorSincronizacionPermanente,
  })
}
