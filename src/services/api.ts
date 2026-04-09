import axios from 'axios'
import type { Area, Colaborador, Variedad, Formulario } from '../types'

const BASE_URL =
  (import.meta.env.VITE_AZURE_FUNCTION_URL as string) ||
  'https://func-labores-tandil-gzepegarh7b4h6ax.eastus2-01.azurewebsites.net/api'

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 120_000, // Azure cold start puede tardar ~60-90s
})

export async function fetchAreas(): Promise<Area[]> {
  const { data } = await client.get<Record<string, unknown>[]>('/areas')
  return data.map((a) => ({
    id: String(a.id ?? ''),
    nombre: String(a.nombre ?? ''),
    sede: String(a.sede ?? ''),
    supervisorId: String(a.supervisorId ?? ''),
    activo: a.activo !== false,
  }))
}

export async function fetchColaboradores(): Promise<Colaborador[]> {
  const { data } = await client.get<Record<string, unknown>[]>('/colaboradores')
  return data.map((c) => ({
    id: String(c.id ?? ''),
    nombre: String(c.nombre ?? ''),
    externo: c.externo === true,
    areaId: String(c.areaId ?? ''),
    activo: c.activo !== false,
  }))
}

export async function fetchVariedades(): Promise<Variedad[]> {
  const { data } = await client.get<Record<string, unknown>[]>('/variedades')
  return data.map((v) => ({
    id: String(v.id ?? ''),
    nombre: String(v.nombre ?? ''),
  }))
}

interface RegistroPayload {
  id: string
  formularioId: string
  fecha: string
  areaId: string
  supervisor: string
  tipo: string
  fechaCreacion: string
  sincronizado: boolean
  intentosSincronizacion: number
  errorSincronizacionPermanente: boolean
  ultimoError: string
  no: number
  colaborador: string
  externo: boolean
  variedad: string
  tallosEstimados: number
  tallosReales: number
  horaInicio: string
  labores: Formulario['filas'][number]['labores']
  proceso: boolean
  seguridad: boolean
  calidad: boolean
  cumplimiento: boolean
  compromiso: boolean
  observaciones: string
}

/**
 * Envía el formulario al backend: una llamada por cada FilaColaborador.
 * El backend guarda el encabezado del formulario sólo la primera vez (check por formularioId).
 */
export async function postRegistro(formulario: Formulario): Promise<void> {
  const payloads: RegistroPayload[] = formulario.filas.map((fila, i) => ({
    id: `${formulario.id}-${fila.colaboradorId}`,
    formularioId: formulario.id,
    fecha: formulario.fecha,
    areaId: formulario.areaId,
    supervisor: formulario.supervisorId,
    tipo: formulario.tipo,
    fechaCreacion: formulario.fechaCreacion,
    sincronizado: formulario.sincronizado,
    intentosSincronizacion: formulario.intentosSincronizacion,
    errorSincronizacionPermanente: formulario.errorPermanente,
    ultimoError: formulario.ultimoError ?? '',
    no: i + 1,
    colaborador: fila.nombre,
    externo: fila.externo,
    variedad: fila.variedad,
    tallosEstimados: fila.tallosEstimados,
    tallosReales: fila.tallosReales,
    horaInicio: fila.horaInicio,
    labores: fila.labores,
    proceso: fila.proceso,
    seguridad: fila.seguridad,
    calidad: fila.calidad,
    cumplimiento: fila.cumplimiento,
    compromiso: fila.compromiso,
    observaciones: fila.observaciones,
  }))

  // Envío secuencial para no saturar el cold-start de Azure Functions
  for (const payload of payloads) {
    await client.post('/registro', payload)
  }
}

export async function patchAssignArea(areaId: string, supervisorId: string): Promise<void> {
  await client.patch(`/areas/${encodeURIComponent(areaId)}/assign`, { supervisorId })
}
