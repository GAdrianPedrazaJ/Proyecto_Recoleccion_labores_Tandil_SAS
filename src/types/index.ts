export interface Sede {
  id: string
  nombre: string
}

export interface Area {
  id: string
  nombre: string
  sedeId: string
  supervisorId: string
  activo: boolean
}

export interface Supervisor {
  id: string
  nombre: string
  areaId: string
  sedeId: string
  activo: boolean
}

export interface Bloque {
  id: string
  nombre: string
  areaId: string
}

export interface Colaborador {
  id: string
  nombre: string
  areaId: string
  supervisorId: string
  externo: boolean
  asignado: boolean
  activo: boolean
}

export interface Variedad {
  id: string
  nombre: string
}

export interface VariedadBloque {
  id: string       // `${variedadId}_${bloqueId}`
  variedadId: string
  bloqueId: string
}

export interface LaborCatalog {
  id: string
  nombre: string
}

export interface Labor {
  laborId: string
  laborNombre: string
  camasEstimadas: number
  tiempoCamaEstimado: number      // min/cama
  rendimientoHorasEstimado: number // auto: (camasEstimadas * tiempoCamaEstimado) / 60
  camasReales: number
  tiempoCamaReal: number
  rendimientoHorasReal: number    // auto
  rendimientoPorcentaje: number   // auto: (camasReales / camasEstimadas) * 100
}

export interface FilaColaborador {
  colaboradorId: string
  nombre: string
  externo: boolean
  variedadId: string
  bloqueId: string
  // Corte
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
  labores: Labor[]
  // Cierre
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
  estado: 'borrador' | 'completo'
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

// Navigation state when moving from AreaDetalle → NuevoRegistro
export interface SeleccionColaborador {
  colaboradorId: string
  nombre: string
  externo: boolean
  bloqueId: string
  variedadId: string
}

// Form value types for NuevoRegistro (shared with form sub-components)
export interface LaborFV {
  laborId: string
  laborNombre: string
  camasEstimadas: number
  tiempoCamaEstimado: number
  rendimientoHorasEstimado: number
  camasReales: number
  tiempoCamaReal: number
  rendimientoHorasReal: number
  rendimientoPorcentaje: number
}

export interface FilaFV {
  _active: boolean
  colaboradorId: string
  nombre: string
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
