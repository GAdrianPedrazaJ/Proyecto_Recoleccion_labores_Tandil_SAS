import type { RegistroColaborador } from '../types'
import { getPendientesSincronizacion, putRegistro } from './db'
import { postRegistroLabores } from './api'

const MAX_INTENTOS = 5

export async function syncPendientes(): Promise<{
  ok: number
  failed: number
}> {
  const pendientes: RegistroColaborador[] = await getPendientesSincronizacion()
  let ok = 0
  let failed = 0

  for (const registro of pendientes) {
    try {
      const { status } = await postRegistroLabores(registro)
      if (status === 200) {
        await putRegistro({
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

async function registrarFallo(registro: RegistroColaborador): Promise<void> {
  const intentos = registro.intentosSincronizacion + 1
  const errorSincronizacionPermanente = intentos >= MAX_INTENTOS
  await putRegistro({
    ...registro,
    intentosSincronizacion: intentos,
    errorSincronizacionPermanente,
  })
}
