import axios from 'axios'
import type { Area, Colaborador, RegistroColaborador } from '../types'

export interface RemoteColaborador extends Colaborador {
  supervisorId: string
}

export interface RemoteVariedad {
  id: string
  nombre: string
}

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

function baseUrl() {
  return getFunctionUrl().replace(/\/$/, '')
}

/** Cliente Axios reutilizable. */
export const apiClient = axios.create({
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
})

function handleAxiosError(err: unknown): never {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status
    const body = err.response?.data
    throw new Error(
      `API error ${status ?? 'network'}: ${body ? JSON.stringify(body) : err.message}`,
    )
  }
  throw err
}

/** Envía un RegistroColaborador a la Azure Function (POST /registro). */
export async function postRegistroLabores(
  payload: RegistroColaborador,
): Promise<{ status: number; data?: unknown }> {
  try {
    const res = await apiClient.post<unknown>(`${baseUrl()}/registro`, payload)
    return { status: res.status, data: res.data }
  } catch (err) {
    handleAxiosError(err)
  }
}

/** Asigna un supervisor a un área (PATCH /areas/{id}/assign). */
export async function assignArea(
  areaId: string,
  supervisorId: string,
  changedBy?: string,
): Promise<{ status: number; data?: unknown }> {
  try {
    const res = await apiClient.patch(
      `${baseUrl()}/areas/${encodeURIComponent(areaId)}/assign`,
      { supervisorId, changedBy },
    )
    return { status: res.status, data: res.data }
  } catch (err) {
    handleAxiosError(err)
  }
}

/** Descarga la lista de áreas desde Google Sheets (GET /areas). */
export async function fetchAreas(): Promise<Area[]> {
  const res = await apiClient.get<Area[]>(`${baseUrl()}/areas`)
  return res.data
}

/** Descarga la lista de colaboradores desde Google Sheets (GET /colaboradores). */
export async function fetchColaboradores(): Promise<RemoteColaborador[]> {
  const res = await apiClient.get<RemoteColaborador[]>(`${baseUrl()}/colaboradores`)
  return res.data
}

/** Descarga la lista de variedades desde Google Sheets (GET /variedades). */
export async function fetchVariedades(): Promise<RemoteVariedad[]> {
  const res = await apiClient.get<RemoteVariedad[]>(`${baseUrl()}/variedades`)
  return res.data
}
