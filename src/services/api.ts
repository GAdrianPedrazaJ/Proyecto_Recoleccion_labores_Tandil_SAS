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
 * Lanza un `Error` con detalles cuando falla (network o 4xx/5xx).
 */
export async function postRegistroLabores(
  payload: FormularioDia,
): Promise<{ status: number; data?: unknown }> {
  const base = getFunctionUrl()
  try {
    const res = await apiClient.post<unknown>(base, payload)
    return { status: res.status, data: res.data }
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status
      const body = err.response?.data
      const msg = `API error ${status ?? 'network'}: ${
        body ? JSON.stringify(body) : err.message
      }`
      throw new Error(msg)
    }
    throw err
  }
}

/** Asigna un supervisor a un area via Azure Function PATCH endpoint. */
export async function assignArea(
  areaId: string,
  supervisorId: string,
  changedBy?: string,
): Promise<{ status: number; data?: unknown }> {
  const base = getFunctionUrl()
  const url = `${base.replace(/\/$/, '')}/areas/${encodeURIComponent(
    areaId,
  )}/assign`
  try {
    const res = await apiClient.patch(url, { supervisorId, changedBy })
    return { status: res.status, data: res.data }
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status
      const body = err.response?.data
      const msg = `API error ${status ?? 'network'}: ${
        body ? JSON.stringify(body) : err.message
      }`
      throw new Error(msg)
    }
    throw err
  }
}
