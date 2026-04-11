/**
 * Funciones para obtener datos específicos del dashboard
 * Utiliza las tablas separadas: formulario_rows_corte, formulario_rows_labores, formulario_rows_aseguramiento
 */

import { supabase } from './supabase'

// ============= TIPOS PARA EL DASHBOARD =============

export interface DashDataCorte {
  fecha: string
  area: string
  supervisor: string
  colaborador: string
  bloque: string
  variedad: string
  tiempoEstimado: number
  tiempoReal: number
  tallosEstimados: number
  tallosReales: number
  rendimiento: number
}

export interface DashDataLabores {
  fecha: string
  area: string
  colaborador: string
  numeroLabor: number
  nombreLabor: string
  camasEstimadas: number
  camasReales: number
  rendimiento: number
}

export interface DashDataAseguramiento {
  fecha: string
  area: string
  colaborador: string
  cumplimiento: number
  calidad: number
}

export interface StatsPorArea {
  area: string
  totalFormularios: number
  promRendimiento: number
  totalHoras: number
}

export interface StatsPorColaborador {
  colaborador: string
  totalRegistros: number
  promRendimiento: number
  promCumplimiento: number
}

// ============= QUERIES PARA EL DASHBOARD =============

/**
 * Obtiene datos de Corte para hacer gráfics de rendimiento por fecha
 */
export async function getCorteData(desde: string, hasta: string): Promise<DashDataCorte[]> {
  const { data, error } = await supabase
    .from('formulario_rows_corte')
    .select(`
      id,
      fecha_creacion,
      id_area,
      id_supervisor,
      id_colaborador,
      nombre_colaborador,
      id_bloque,
      id_variedad,
      tiempo_estimado_horas,
      tiempo_real_horas,
      total_tallos_corte_estimado,
      total_tallos_corte_real,
      rendimiento_corte_real,
      areas!formulario_rows_corte_id_area_fkey(nom_area),
      supervisors!formulario_rows_corte_id_supervisor_fkey(nom_supervisor),
      bloques!formulario_rows_corte_id_bloque_fkey(nom_bloque),
      variedades!formulario_rows_corte_id_variedad_fkey(nom_variedad)
    `)
    .gte('fecha_creacion', desde)
    .lte('fecha_creacion', hasta)
    .order('fecha_creacion', { ascending: true })

  if (error) throw new Error(error.message)

  return ((data ?? []) as any[]).map((row: any) => ({
    fecha: row.fecha_creacion?.split('T')[0] || '',
    area: row.areas?.nom_area || '—',
    supervisor: row.supervisors?.nom_supervisor || '—',
    colaborador: row.nombre_colaborador || '—',
    bloque: row.bloques?.nom_bloque || '—',
    variedad: row.variedades?.nom_variedad || '—',
    tiempoEstimado: row.tiempo_estimado_horas || 0,
    tiempoReal: row.tiempo_real_horas || 0,
    tallosEstimados: row.total_tallos_corte_estimado || 0,
    tallosReales: row.total_tallos_corte_real || 0,
    rendimiento: row.rendimiento_corte_real || 0,
  }))
}

/**
 * Obtiene datos de Labores con detalles para gráficas de rendimiento
 */
export async function getLaboresData(desde: string, hasta: string): Promise<DashDataLabores[]> {
  const { data, error } = await supabase
    .from('labores_detalle')
    .select(`
      id,
      fila_labores_id,
      numero_labor,
      nom_labor,
      camas_estimado,
      camas_real,
      rendimiento_pct,
      formulario_rows_labores!fila_labores_id_fkey(
        fecha_creacion,
        id_area,
        nombre_colaborador,
        areas!formulario_rows_labores_id_area_fkey(nom_area)
      )
    `)
    .gte('formulario_rows_labores.fecha_creacion', desde)
    .lte('formulario_rows_labores.fecha_creacion', hasta)
    .order('formulario_rows_labores(fecha_creacion)', { ascending: true })

  if (error) throw new Error(error.message)

  return ((data ?? []) as any[]).map((row: any) => ({
    fecha: row.formulario_rows_labores?.fecha_creacion?.split('T')[0] || '',
    area: row.formulario_rows_labores?.areas?.nom_area || '—',
    colaborador: row.formulario_rows_labores?.nombre_colaborador || '—',
    numeroLabor: row.numero_labor || 0,
    nombreLabor: row.nom_labor || '—',
    camasEstimadas: row.camas_estimado || 0,
    camasReales: row.camas_real || 0,
    rendimiento: row.rendimiento_pct || 0,
  }))
}

/**
 * Obtiene datos de Aseguramiento para gráficas de cumplimiento
 */
export async function getAseguramientoData(desde: string, hasta: string): Promise<DashDataAseguramiento[]> {
  const { data, error } = await supabase
    .from('formulario_rows_aseguramiento')
    .select(`
      id,
      fecha_creacion,
      id_area,
      nombre_colaborador,
      pct_cumplimiento,
      pct_prom_rendimiento,
      areas!formulario_rows_aseguramiento_id_area_fkey(nom_area)
    `)
    .gte('fecha_creacion', desde)
    .lte('fecha_creacion', hasta)
    .order('fecha_creacion', { ascending: true })

  if (error) throw new Error(error.message)

  return ((data ?? []) as any[]).map((row: any) => ({
    fecha: row.fecha_creacion?.split('T')[0] || '',
    area: row.areas?.nom_area || '—',
    colaborador: row.nombre_colaborador || '—',
    cumplimiento: row.pct_cumplimiento || 0,
    calidad: row.pct_prom_rendimiento || 0,
  }))
}

/**
 * Estadísticas por Área
 */
export async function getStatsPorArea(desde: string): Promise<StatsPorArea[]> {
  const { data, error } = await supabase
    .from('formulario_rows_corte')
    .select(`
      id_area,
      tiempo_estimado_horas,
      rendimiento_corte_real,
      areas!formulario_rows_corte_id_area_fkey(nom_area)
    `)
    .gte('fecha_creacion', desde)

  if (error) throw new Error(error.message)

  // Agrupar por área
  const grouped: Record<string, any> = {}
  for (const row of (data ?? []) as any[]) {
    const areaId = row.id_area
    const areaNombre = (row.areas as any)?.nom_area || '—'
    if (!grouped[areaId]) {
      grouped[areaId] = {
        area: areaNombre,
        totalFormularios: 0,
        rendimientoTotal: 0,
        horasTotal: 0,
      }
    }
    grouped[areaId].totalFormularios++
    grouped[areaId].rendimientoTotal += row.rendimiento_corte_real || 0
    grouped[areaId].horasTotal += row.tiempo_estimado_horas || 0
  }

  return Object.values(grouped).map((g: any) => ({
    area: g.area,
    totalFormularios: g.totalFormularios,
    promRendimiento: Math.round((g.rendimientoTotal / g.totalFormularios) * 100) / 100,
    totalHoras: Math.round(g.horasTotal * 100) / 100,
  }))
}

/**
 * Estadísticas por Colaborador
 */
export async function getStatsPorColaborador(desde: string): Promise<StatsPorColaborador[]> {
  // Obtener datos de Corte
  const { data: corteData, error: errCorte } = await supabase
    .from('formulario_rows_corte')
    .select('id_colaborador, nombre_colaborador, rendimiento_corte_real')
    .gte('fecha_creacion', desde)

  if (errCorte) throw new Error(errCorte.message)

  // Obtener datos de Aseguramiento
  const { data: asegData, error: errAseg } = await supabase
    .from('formulario_rows_aseguramiento')
    .select('id_colaborador, nombre_colaborador, pct_cumplimiento')
    .gte('fecha_creacion', desde)

  if (errAseg) throw new Error(errAseg.message)

  // Combinar
  const grouped: Record<string, any> = {}
  
  for (const row of (corteData ?? []) as any[]) {
    const colabId = row.id_colaborador
    if (!grouped[colabId]) {
      grouped[colabId] = {
        colaborador: row.nombre_colaborador || '—',
        totalRegistros: 0,
        rendimientoTotal: 0,
        cumplimientoTotal: 0,
      }
    }
    grouped[colabId].totalRegistros++
    grouped[colabId].rendimientoTotal += row.rendimiento_corte_real || 0
  }

  for (const row of (asegData ?? []) as any[]) {
    const colabId = row.id_colaborador
    if (grouped[colabId]) {
      grouped[colabId].cumplimientoTotal += row.pct_cumplimiento || 0
    }
  }

  return Object.values(grouped).map((g: any) => ({
    colaborador: g.colaborador,
    totalRegistros: g.totalRegistros,
    promRendimiento: Math.round((g.rendimientoTotal / g.totalRegistros) * 100) / 100,
    promCumplimiento: Math.round((g.cumplimientoTotal / g.totalRegistros) * 100) / 100,
  }))
}

/**
 * Datos de resumen para KPIs
 */
export async function getKPIData(desde: string): Promise<{
  totalRegistros: number
  promRendimiento: number
  promCumplimiento: number
  totalHoras: number
}> {
  const { data: corte } = await supabase
    .from('formulario_rows_corte')
    .select('rendimiento_corte_real, tiempo_estimado_horas')
    .gte('fecha_creacion', desde)

  const { data: aseg } = await supabase
    .from('formulario_rows_aseguramiento')
    .select('pct_cumplimiento')
    .gte('fecha_creacion', desde)

  const totalReg = (corte?.length || 0) + (aseg?.length || 0)
  const promRend = totalReg > 0 
    ? (corte ?? []).reduce((acc, r) => acc + (r.rendimiento_corte_real || 0), 0) / (corte?.length || 1)
    : 0
  const promCum = (aseg ?? []).length > 0
    ? (aseg ?? []).reduce((acc, r) => acc + (r.pct_cumplimiento || 0), 0) / aseg!.length
    : 0
  const totalH = (corte ?? []).reduce((acc, r) => acc + (r.tiempo_estimado_horas || 0), 0)

  return {
    totalRegistros: totalReg,
    promRendimiento: Math.round(promRend * 100) / 100,
    promCumplimiento: Math.round(promCum * 100) / 100,
    totalHoras: Math.round(totalH * 100) / 100,
  }
}
