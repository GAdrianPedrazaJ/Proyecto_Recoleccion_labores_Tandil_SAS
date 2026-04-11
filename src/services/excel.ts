/**
 * Funciones para exportar datos a Excel
 * Utiliza SheetJS (xlsx) para crear archivos Excel
 */

// Instalar con: npm install xlsx
import { write, utils } from 'xlsx'

interface ReporteCorte {
  fecha: string
  areaNombre: string
  supervisorNombre: string
  colaboradorNombre: string
  bloqueNombre: string
  variedadNombre: string
  tiempoEstimadoHoras: number | null
  tiempoRealHoras: number | null
  tallosEstimados: number | null
  tallosReales: number | null
  horaInicio: string | null
  horaFin: string | null
  rendimientoCorteReal: number | null
}

interface ReporteLabores {
  fecha: string
  areaNombre: string
  supervisorNombre: string
  colaboradorNombre: string
  bloqueNombre: string
  variedadNombre: string
  numeroLabor: number
  laborNombre: string
  camasEstimadas: number | null
  camasReales: number | null
  tiempoCamaEstimado: number | null
  tiempoCamaReal: number | null
  rendimientoHoras: number | null
  rendimientoPct: number | null
}

interface ReporteAseguramiento {
  fecha: string
  areaNombre: string
  supervisorNombre: string
  colaboradorNombre: string
  bloqueNombre: string
  variedadNombre: string
  desglossePipe: boolean
  procesoSeguridad: string | null
  cumplimiento1: boolean
  cumplimiento2: boolean
  cumplimiento3: boolean
  cumplimiento4: boolean
  cumplimiento5: boolean
  pctCumplimiento: number | null
  pctPromRendimiento: number | null
  observaciones: string | null
}

/**
 * Crea y descarga un Excel con datos de Corte
 */
export function descargarReporteCorte(datos: ReporteCorte[], nombreArchivo = 'reporte_corte.xlsx'): void {
  const worksheet = utils.json_to_sheet(datos.map(d => ({
    Fecha: d.fecha,
    Área: d.areaNombre,
    Supervisor: d.supervisorNombre,
    Colaborador: d.colaboradorNombre,
    Bloque: d.bloqueNombre,
    Variedad: d.variedadNombre,
    'Tiempo Estimado (h)': d.tiempoEstimadoHoras,
    'Tiempo Real (h)': d.tiempoRealHoras,
    'Tallos Estimados': d.tallosEstimados,
    'Tallos Reales': d.tallosReales,
    'Hora Inicio': d.horaInicio,
    'Hora Fin': d.horaFin,
    'Rendimiento (%)': d.rendimientoCorteReal,
  })), { header: 1 })

  const workbook = utils.book_new()
  utils.book_append_sheet(workbook, worksheet, 'Corte')

  // Ajustar ancho de columnas
  const colWidths = [12, 15, 18, 20, 12, 15, 18, 18, 16, 16, 12, 12, 16]
  worksheet['!cols'] = colWidths.map(w => ({ wch: w }))

  write(workbook, { out: 'write', file: nombreArchivo })
}

/**
 * Crea y descarga un Excel con datos de Labores
 */
export function descargarReporteLabores(datos: ReporteLabores[], nombreArchivo = 'reporte_labores.xlsx'): void {
  const worksheet = utils.json_to_sheet(datos.map(d => ({
    Fecha: d.fecha,
    Área: d.areaNombre,
    Supervisor: d.supervisorNombre,
    Colaborador: d.colaboradorNombre,
    Bloque: d.bloqueNombre,
    Variedad: d.variedadNombre,
    Labor: d.numeroLabor,
    'Nombre Labor': d.laborNombre,
    'Camas Estimadas': d.camasEstimadas,
    'Camas Reales': d.camasReales,
    'Tiempo/Cama Estimado': d.tiempoCamaEstimado,
    'Tiempo/Cama Real': d.tiempoCamaReal,
    'Rendimiento (h)': d.rendimientoHoras,
    'Rendimiento (%)': d.rendimientoPct,
  })), { header: 1 })

  const workbook = utils.book_new()
  utils.book_append_sheet(workbook, worksheet, 'Labores')

  const colWidths = [12, 15, 18, 20, 12, 15, 8, 18, 16, 16, 18, 18, 16, 16]
  worksheet['!cols'] = colWidths.map(w => ({ wch: w }))

  write(workbook, { out: 'write', file: nombreArchivo })
}

/**
 * Crea y descarga un Excel con datos de Aseguramiento
 */
export function descargarReporteAseguramiento(datos: ReporteAseguramiento[], nombreArchivo = 'reporte_aseguramiento.xlsx'): void {
  const worksheet = utils.json_to_sheet(datos.map(d => ({
    Fecha: d.fecha,
    Área: d.areaNombre,
    Supervisor: d.supervisorNombre,
    Colaborador: d.colaboradorNombre,
    Bloque: d.bloqueNombre,
    Variedad: d.variedadNombre,
    'Desglose PI.PC': d.desglossePipe ? 'Sí' : 'No',
    'Proceso Seguridad': d.procesoSeguridad,
    'Cumplimiento 1': d.cumplimiento1 ? 'Sí' : 'No',
    'Cumplimiento 2': d.cumplimiento2 ? 'Sí' : 'No',
    'Cumplimiento 3': d.cumplimiento3 ? 'Sí' : 'No',
    'Cumplimiento 4': d.cumplimiento4 ? 'Sí' : 'No',
    'Cumplimiento 5': d.cumplimiento5 ? 'Sí' : 'No',
    '% Cumplimiento': d.pctCumplimiento,
    '% Promedio Rendimiento': d.pctPromRendimiento,
    Observaciones: d.observaciones,
  })), { header: 1 })

  const workbook = utils.book_new()
  utils.book_append_sheet(workbook, worksheet, 'Aseguramiento')

  const colWidths = [12, 15, 18, 20, 12, 15, 15, 18, 14, 14, 14, 14, 14, 18, 22, 25]
  worksheet['!cols'] = colWidths.map(w => ({ wch: w }))

  write(workbook, { out: 'write', file: nombreArchivo })
}

/**
 * Crea un Excel multihoja con los tres reportes juntos
 */
export function descargarReporteCompleto(
  corte: ReporteCorte[],
  labores: ReporteLabores[],
  aseguramiento: ReporteAseguramiento[],
  nombreArchivo = 'reporte_completo.xlsx'
): void {
  const workbook = utils.book_new()

  // Hoja 1: Corte
  const wsCorte = utils.json_to_sheet(corte.map(d => ({
    Fecha: d.fecha,
    Área: d.areaNombre,
    Supervisor: d.supervisorNombre,
    Colaborador: d.colaboradorNombre,
    Bloque: d.bloqueNombre,
    Variedad: d.variedadNombre,
    'Tiempo Estimado (h)': d.tiempoEstimadoHoras,
    'Tiempo Real (h)': d.tiempoRealHoras,
    'Tallos Estimados': d.tallosEstimados,
    'Tallos Reales': d.tallosReales,
    'Hora Inicio': d.horaInicio,
    'Hora Fin': d.horaFin,
    'Rendimiento (%)': d.rendimientoCorteReal,
  })))
  wsCorte['!cols'] = [12, 15, 18, 20, 12, 15, 18, 18, 16, 16, 12, 12, 16].map(w => ({ wch: w }))
  utils.book_append_sheet(workbook, wsCorte, 'Corte')

  // Hoja 2: Labores
  const wsLabores = utils.json_to_sheet(labores.map(d => ({
    Fecha: d.fecha,
    Área: d.areaNombre,
    Supervisor: d.supervisorNombre,
    Colaborador: d.colaboradorNombre,
    Bloque: d.bloqueNombre,
    Variedad: d.variedadNombre,
    Labor: d.numeroLabor,
    'Nombre Labor': d.laborNombre,
    'Camas Estimadas': d.camasEstimadas,
    'Camas Reales': d.camasReales,
    'Tiempo/Cama Estimado': d.tiempoCamaEstimado,
    'Tiempo/Cama Real': d.tiempoCamaReal,
    'Rendimiento (h)': d.rendimientoHoras,
    'Rendimiento (%)': d.rendimientoPct,
  })))
  wsLabores['!cols'] = [12, 15, 18, 20, 12, 15, 8, 18, 16, 16, 18, 18, 16, 16].map(w => ({ wch: w }))
  utils.book_append_sheet(workbook, wsLabores, 'Labores')

  // Hoja 3: Aseguramiento
  const wsAseguramiento = utils.json_to_sheet(aseguramiento.map(d => ({
    Fecha: d.fecha,
    Área: d.areaNombre,
    Supervisor: d.supervisorNombre,
    Colaborador: d.colaboradorNombre,
    Bloque: d.bloqueNombre,
    Variedad: d.variedadNombre,
    'Desglose PI.PC': d.desglossePipe ? 'Sí' : 'No',
    'Proceso Seguridad': d.procesoSeguridad,
    'Cumplimiento 1': d.cumplimiento1 ? 'Sí' : 'No',
    'Cumplimiento 2': d.cumplimiento2 ? 'Sí' : 'No',
    'Cumplimiento 3': d.cumplimiento3 ? 'Sí' : 'No',
    'Cumplimiento 4': d.cumplimiento4 ? 'Sí' : 'No',
    'Cumplimiento 5': d.cumplimiento5 ? 'Sí' : 'No',
    '% Cumplimiento': d.pctCumplimiento,
    '% Promedio Rendimiento': d.pctPromRendimiento,
    Observaciones: d.observaciones,
  })))
  wsAseguramiento['!cols'] = [12, 15, 18, 20, 12, 15, 15, 18, 14, 14, 14, 14, 14, 18, 22, 25].map(w => ({ wch: w }))
  utils.book_append_sheet(workbook, wsAseguramiento, 'Aseguramiento')

  write(workbook, { out: 'write', file: nombreArchivo })
}

/**
 * Función auxiliar para exportar directamente a Excel desde objeto genérico
 */
export function crearExcelDesdeJSON(datos: Record<string, unknown>[], nombreHoja = 'Datos', nombreArchivo = 'export.xlsx'): void {
  const worksheet = utils.json_to_sheet(datos)
  const workbook = utils.book_new()
  utils.book_append_sheet(workbook, worksheet, nombreHoja)
  write(workbook, { out: 'write', file: nombreArchivo })
}
