/** Una labor individual dentro del registro de un colaborador (hasta 3 filas). */
export interface Labor {
  nombre: string
  camasPlaneadas: number
  rendimientoEstimadoPorCama: number
  camasEjecutadas: number
  rendimientoRealPorCama: number
}

/** Tupla de hasta 3 labores (cada posición puede estar vacía). */
export type LaboresTuple = [
  Labor | undefined,
  Labor | undefined,
  Labor | undefined,
]

/** Registro de un colaborador en el formulario del día. */
export interface RegistroColaborador {
  id: string
  numeroColaborador: number
  nombreColaborador: string
  externo: boolean
  variedad: string
  tallosEstimados: number
  tallosReales: number
  horaInicio: string
  labores: LaboresTuple
  proceso: boolean
  seguridad: boolean
  calidad: boolean
  cumplimiento: boolean
  compromiso: boolean
  observaciones: string
  tiempoEjecucion: number
}

/** Formulario diario guardado en IndexedDB y enviado a Azure. */
export interface FormularioDia {
  id: string
  fecha: string
  supervisor: string
  sede: string
  dia:
    | 'Lunes'
    | 'Martes'
    | 'Miercoles'
    | 'Jueves'
    | 'Viernes'
    | 'Sabado'
  tipo: 'Labores' | 'Corte' | 'Vegetativa'
  colaboradores: RegistroColaborador[]
  sincronizado: boolean
  fechaCreacion: string
  intentosSincronizacion: number
  /**
   * Se marca en true cuando se alcanzan 5 intentos fallidos;
   * syncPendientes() no volverá a enviar hasta intervención manual.
   */
  errorSincronizacionPermanente?: boolean
  /**
   * Mensaje del último error ocurrido al intentar sincronizar.
   * Usado para diagnóstico y mostrar en UI si es necesario.
   */
  ultimoError?: string
}

/** Fila de configuración persistida (supervisor / sede por defecto). */
export interface ConfigRow {
  id: string
  supervisor: string
  sede: string
}

/** Area de trabajo (p. ej. Rosas 10). */
export interface Area {
  id: string
  nombre: string
  sede?: string
  supervisorId?: string
  codigo?: string
  active?: boolean
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
