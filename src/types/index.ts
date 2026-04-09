export interface Area {
  id: string
  nombre: string
  sede: string
  supervisorId: string
  activo: boolean
}

export interface Colaborador {
  id: string
  nombre: string
  areaId: string
  externo: boolean
  activo: boolean
}

export interface Variedad {
  id: string
  nombre: string
}

export interface Labor {
  nombre: string
  camasPlaneadas: number
  rendimientoEstimadoPorCama: number
  camasEjecutadas: number
  rendimientoRealPorCama: number
  tiempoEjecucion: number
}

export interface FilaColaborador {
  colaboradorId: string
  nombre: string
  externo: boolean
  variedad: string
  horaInicio: string
  tallosEstimados: number
  tallosReales: number
  labores: Labor[]
  proceso: boolean
  seguridad: boolean
  calidad: boolean
  cumplimiento: boolean
  compromiso: boolean
  observaciones: string
}

export interface Formulario {
  id: string
  fecha: string
  areaId: string
  areaNombre: string
  supervisorId: string
  tipo: string
  filas: FilaColaborador[]
  sincronizado: boolean
  intentosSincronizacion: number
  errorPermanente: boolean
  ultimoError?: string
  fechaCreacion: string
}

export interface Usuario {
  id: string
  username: string
  passwordHash: string
  rol: 'admin'
  nombre: string
  activo: boolean
}

// Form value types for NuevoRegistro (shared with form sub-components)
export interface LaborFV {
  nombre: string
  camasPlaneadas: number
  rendimientoEstimadoPorCama: number
  camasEjecutadas: number
  rendimientoRealPorCama: number
  tiempoEjecucion: number
}

export interface FilaFV {
  _active: boolean
  colaboradorId: string
  nombre: string
  externo: boolean
  variedad: string
  horaInicio: string
  tallosEstimados: number
  tallosReales: number
  labores: LaborFV[]
  proceso: boolean
  seguridad: boolean
  calidad: boolean
  cumplimiento: boolean
  compromiso: boolean
  observaciones: string
}

export interface RegistroFV {
  fecha: string
  tipo: string
  filas: FilaFV[]
}
