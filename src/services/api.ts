import axios from 'axios'
import type { Area, Bloque, Colaborador, LaborCatalog, Sede, Supervisor, Variedad, VariedadBloque, Formulario } from '../types'

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
    sedeId: String(a.sedeId ?? a.sede ?? ''),
    supervisorId: String(a.supervisorId ?? ''),
    activo: a.activo !== false,
  }))
}

export async function fetchSupervisores(): Promise<Supervisor[]> {
  const { data } = await client.get<Record<string, unknown>[]>('/supervisores')
  return data.map((s) => ({
    id: String(s.id ?? ''),
    nombre: String(s.nombre ?? ''),
    areaId: String(s.areaId ?? ''),
    sedeId: String(s.sedeId ?? ''),
    activo: s.activo !== false,
  }))
}

export async function fetchBloques(): Promise<Bloque[]> {
  const { data } = await client.get<Record<string, unknown>[]>('/bloques')
  return data.map((b) => ({
    id: String(b.id ?? ''),
    nombre: String(b.nombre ?? ''),
    areaId: String(b.areaId ?? ''),
  }))
}

export async function fetchSedes(): Promise<Sede[]> {
  const { data } = await client.get<Record<string, unknown>[]>('/sedes')
  return data.map((s) => ({
    id: String(s.id ?? ''),
    nombre: String(s.nombre ?? ''),
  }))
}

export async function fetchColaboradores(): Promise<Colaborador[]> {
  const { data } = await client.get<Record<string, unknown>[]>('/colaboradores')
  return data.map((c) => ({
    id: String(c.id ?? ''),
    nombre: String(c.nombre ?? ''),
    externo: c.externo === true,
    areaId: String(c.areaId ?? ''),
    supervisorId: String(c.supervisorId ?? ''),
    asignado: c.asignado === true,
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

export async function fetchVariedadesBloques(): Promise<VariedadBloque[]> {
  const { data } = await client.get<Record<string, unknown>[]>('/variedadesBloques')
  return data.map((vb) => {
    const variedadId = String(vb.variedadId ?? '')
    const bloqueId = String(vb.bloqueId ?? '')
    return { id: `${variedadId}_${bloqueId}`, variedadId, bloqueId }
  })
}

export async function fetchLabores(): Promise<LaborCatalog[]> {
  const { data } = await client.get<Record<string, unknown>[]>('/labores')
  return data.map((l) => ({
    id: String(l.id ?? ''),
    nombre: String(l.nombre ?? ''),
  }))
}

interface RegistroPayload {
  id: string
  formularioId: string
  fecha: string
  areaId: string
  supervisorId: string
  tipo: string
  fechaCreacion: string
  sincronizado: boolean
  intentosSincronizacion: number
  errorSincronizacionPermanente: boolean
  ultimoError: string
  colaboradorId: string
  colaborador: string
  externo: boolean
  variedadId: string
  bloqueId: string
  tiempoEstimadoMinutos: number
  tiempoEstimadoHoras: number
  tiempoRealMinutos: number
  tiempoRealHoras: number
  tallosEstimados: number
  tallosReales: number
  horaInicio: string
  horaFinCorteEstimado: string
  horaFinCorteReal: string
  horaCama: number
  rendimientoCorteEstimado: number
  rendimientoCorteReal: number
  labores: Formulario['filas'][number]['labores']
}

/**
 * Envía el formulario al backend: una llamada por cada FilaColaborador.
 * El backend guarda el encabezado del formulario sólo la primera vez (check por formularioId).
 */
export async function postRegistro(formulario: Formulario): Promise<void> {
  const payloads: RegistroPayload[] = formulario.filas.map((fila) => ({
    id: `${formulario.id}-${fila.colaboradorId}`,
    formularioId: formulario.id,
    fecha: formulario.fecha,
    areaId: formulario.areaId,
    supervisorId: formulario.supervisorId,
    tipo: formulario.tipo,
    fechaCreacion: formulario.fechaCreacion,
    sincronizado: formulario.sincronizado,
    intentosSincronizacion: formulario.intentosSincronizacion,
    errorSincronizacionPermanente: formulario.errorPermanente,
    ultimoError: formulario.ultimoError ?? '',
    colaboradorId: fila.colaboradorId,
    colaborador: fila.nombre,
    externo: fila.externo,
    variedadId: fila.variedadId,
    bloqueId: fila.bloqueId,
    tiempoEstimadoMinutos: fila.tiempoEstimadoMinutos,
    tiempoEstimadoHoras: fila.tiempoEstimadoHoras,
    tiempoRealMinutos: fila.tiempoRealMinutos,
    tiempoRealHoras: fila.tiempoRealHoras,
    tallosEstimados: fila.tallosEstimados,
    tallosReales: fila.tallosReales,
    horaInicio: fila.horaInicio,
    horaFinCorteEstimado: fila.horaFinCorteEstimado,
    horaFinCorteReal: fila.horaFinCorteReal,
    horaCama: fila.horaCama,
    rendimientoCorteEstimado: fila.rendimientoCorteEstimado,
    rendimientoCorteReal: fila.rendimientoCorteReal,
    labores: fila.labores,
  }))

  // Envío secuencial para no saturar el cold-start de Azure Functions
  for (const payload of payloads) {
    await client.post('/registro', payload)
  }
}

export async function patchAssignArea(areaId: string, supervisorId: string): Promise<void> {
  await client.patch(`/areas/${encodeURIComponent(areaId)}/assign`, { supervisorId })
}
