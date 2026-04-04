import axios from 'axios'
import type { RegistroColaborador } from '../types'

function getFunctionUrl(): string {
  const url = import.meta.env.VITE_AZURE_FUNCTION_URL
  if (!url || url.includes('TU-FUNCTION')) {
    console.warn(
      '[api] Configura VITE_AZURE_FUNCTION_URL en .env.local con tu endpoint real.',
    )
  }
  return url ?? ''
}

export const apiClient = axios.create({
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
})

export async function postRegistroLabores(
  payload: RegistroColaborador,
): Promise<{ status: number }> {
  const base = getFunctionUrl()
  const res = await apiClient.post<unknown>(base, payload)
  return { status: res.status }
}
