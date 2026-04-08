export interface Usuario {
  id: string
  username: string
  passwordHash: string
  rol: 'admin' | 'supervisor'
  nombre: string
  areas: string[]
  activo: boolean
}

export interface Area {
  id: string
  nombre: string
  tipo: 'Corte' | 'Labores' | 'Vegetativa'
  sede: string
  activo: boolean
}

export interface Colaborador {
  id: string
  nombre: string
  areaId: string
  externo: boolean
  activo: boolean
}

export interface Labor {
  nombre: string
  camasPlaneadas: number
  rendimientoEstimadoPorCama: number
  tiempoEstimado: number
  camasEjecutadas: number
  rendimientoRealPorCama: number
  tiempoReal: number
  cumplimiento: string
}

export type LaboresTuple = [
  Labor | undefined,
  Labor | undefined,
  Labor | undefined,
  Labor | undefined,
  Labor | undefined,
]

export interface RegistroColaborador {
  id: string
  formularioId: string
  /** Referencia local para listados (área del formulario). */
  areaId: string
  fecha: string
  dia: string
  tipo: string
  supervisor: string
  sede: string
  semana: string
  idRegistro: string
  no: number
  colaborador: string
  externo: string
  variedad: string
  horaInicio: string
  tallosEstimados: number
  tallosReales: number
  tiempoEstH: number
  tiempoRealH: number
  rendCorte: number
  labores: LaboresTuple
  proceso: boolean
  seguridad: boolean
  calidad: boolean
  observaciones: string
  sincronizado: boolean
  intentosSincronizacion: number
  fechaCreacion: string
  errorSincronizacionPermanente?: boolean
  /**
   * Mensaje del último error ocurrido al intentar sincronizar.
   * Usado para diagnóstico y mostrar en UI si es necesario.
   */
  ultimoError?: string
}

export interface FormularioDia {
  id: string
  fecha: string
  dia: 'Lunes' | 'Martes' | 'Miercoles' | 'Jueves' | 'Viernes' | 'Sabado'
  tipo: 'Labores' | 'Corte' | 'Vegetativa'
  areaId: string
  supervisorId: string
  colaboradores: RegistroColaborador[]
  sincronizado: boolean
  fechaCreacion: string
}

/** Config genérica en IndexedDB (keyPath `key`). */
export interface ConfigEntry {
  key: string
  value: string
}

export interface Supervisor {
  id: string
  nombre: string
  email?: string
  telefono?: string
}

export interface AssignmentAudit {
  id: string
  areaId: string
  oldSupervisorId?: string
  newSupervisorId?: string
  changedAt: string
  changedBy?: string
}
