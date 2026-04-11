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
  desglossePiPc: boolean
  procesoSeguridad: string
  calidad1: boolean
  calidad2: boolean
  calidad3: boolean
  calidad4: boolean
  calidad5: boolean
  cumplimientoCalidad: number
  rendimientoPromedio: number
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
  desglossePiPc: boolean
  procesoSeguridad: string
  calidad1: boolean
  calidad2: boolean
  calidad3: boolean
  calidad4: boolean
  calidad5: boolean
  cumplimientoCalidad: number
  rendimientoPromedio: number
  observaciones: string
}

export interface RegistroFV {
  fecha: string
  tipo: string
  filas: FilaFV[]
}

// ============================================================================
// TIPOS PARA FORMULARIOS SEPARADOS (3 TABLAS NORMALIZADAS)
// ============================================================================

export interface FilaCorte {
  id: string
  formularioId: string
  idColaborador: string
  nombreColaborador: string
  externo: boolean
  idArea: string
  idSupervisor: string
  idBloque: string
  idVariedad: string
  
  tiempoEstimadoMinutos: number | null
  tiempoEstimadoHoras: number | null
  tiempoRealMinutos: number | null
  tiempoRealHoras: number | null
  totalTallosCorteEstimado: number | null
  totalTallosCorteReal: number | null
  horaIniciCorte: string | null
  horaFinCorteEstimado: string | null
  horaRealFinCorte: string | null
  horaCama: number | null
  rendimientoCorteEstimado: number | null
  rendimientoCorteReal: number | null
  fechaCreacion: string
  fechaActualizacion: string | null
}

export interface LaborDetalle {
  id: string
  filaLaboresId: string
  idLabor: string
  nomLabor: string
  camasEstimado: number | null
  tiempoCamaEstimado: number | null
  rendimientoHorasEstimado: number | null
  camasReal: number | null
  tiempoCamaReal: number | null
  rendimientoHorasReal: number | null
  rendimientoPct: number | null
  fechaCreacion: string
  numeroLabor: number
}

export interface FilaLabores {
  id: string
  formularioId: string
  idColaborador: string
  nombreColaborador: string
  externo: boolean
  idArea: string
  idSupervisor: string
  idBloque: string
  idVariedad: string
  
  cantidadLaboresRegistradas: number
  rendimientoPromedio: number | null
  tiempoTotalLaboresEstimado: number | null
  tiempoTotalLaboresReal: number | null
  camasTotalEstimadas: number | null
  camasTotalReales: number | null
  
  detalles: LaborDetalle[]
  fechaCreacion: string
  fechaActualizacion: string | null
}

export interface FilaAseguramiento {
  id: string
  formularioId: string
  idColaborador: string
  nombreColaborador: string
  externo: boolean
  idArea: string
  idSupervisor: string
  idBloque: string
  idVariedad: string
  
  desglosePipe: boolean
  procesoSeguridad: string | null
  calidadCuadro1: boolean
  calidadCuadro2: boolean
  calidadCuadro3: boolean
  calidadCuadro4: boolean
  calidadCuadro5: boolean
  pctCumplimiento: number | null
  pctPromRendimiento: number | null
  rendimientoCorteReal: number | null
  observaciones: string | null
  fechaCreacion: string
  fechaActualizacion: string | null
}

export interface FilaMetadata {
  id: string
  formularioId: string
  idColaborador: string
  seCompletoCorte: boolean
  seCompletoLabores: boolean
  seCompletoAseguramiento: boolean
  filaCorteId: string | null
  filaLaboresId: string | null
  filaAseguramientoId: string | null
  fechaCreacion: string
  fechaActualizacion: string | null
}
