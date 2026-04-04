import axios from 'axios'
import type { FormularioDia } from '../types'

/** URL base de la Azure Function (variable de entorno Vite). */
function getFunctionUrl(): string {
  const url = import.meta.env.VITE_AZURE_FUNCTION_URL
  if (!url || url.includes('TU-FUNCTION')) {
    console.warn(
      '[api] Configura VITE_AZURE_FUNCTION_URL en .env.local con tu endpoint real.',
    )
  }
  return url ?? ''
}

/** Cliente Axios reutilizable para POST del registro completo. */
export const apiClient = axios.create({
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
})

/**
 * Envía un FormularioDia a la Azure Function.
 * Ajusta el body si tu API espera otro formato.
 */
export async function postRegistroLabores(
  payload: FormularioDia,
): Promise<{ status: number }> {
  const base = getFunctionUrl()
  const res = await apiClient.post<unknown>(base, payload)
  return { status: res.status }
}
