/**
 * Dashboard Statistics Service
 * Obtiene estadísticas globales, por área, por supervisor, y por colaborador
 * Actualizado para usar el schema v2 con tablas Supabase
 */

import { supabase } from './supabase'

// ============= TIPOS PARA EL DASHBOARD =============

export interface GlobalStats {
  totalRegistros: number
  sincronizados: number
  pendientes: number
  pctSincronizacion: number
  totalAreas: number
  totalSupervisores: number
  totalColaboradores: number
}

export interface AreaStats {
  areaId: string
  areaNombre: string
  sede: string
  supervisor: string
  colaboradoresActivos: number
  registrosTotales: number
  registrosSincronizados: number
  registrosPendientes: number
  pctSincronizacion: number
  registrosCorte: number
  registrosLabores: number
  registrosAseguramiento: number
  ultimaActividad: string | null
}

export interface SupervisorStats {
  supervisorId: string
  supervisorNombre: string
  sede: string
  areasAcargo: number
  colaboradoresAsignados: number
  registrosTotales: number
  registrosSincronizados: number
  registrosPendientes: number
  pctSincronizacion: number
  ultimaActividad: string | null
}

export interface ColaboradorStats {
  colaboradorId: string
  colaboradorNombre: string
  area: string
  supervisor: string
  registrosTotales: number
  registrosSincronizados: number
  registrosPendientes: number
  pctSincronizacion: number
  registrosCorte: number
  registrosLabores: number
  registrosAseguramiento: number
  ultimoRegistro: string | null
  estadoActividad: 'Sin registros' | 'Hoy' | 'Últimos 7 días' | 'Inactivo'
}

// ============= ESTADÍSTICAS GLOBALES =============

/**
 * Obtiene estadísticas globales (admin/superadmin overview)
 */
export async function getGlobalStats(): Promise<GlobalStats> {
  try {
    const { data, error, count } = await supabase
      .from('formularios')
      .select('id, sincronizado', { count: 'exact' })

    if (error) throw error

    const totalRegistros = count ?? 0
    const sincronizados = data?.filter((f) => f.sincronizado).length ?? 0

    // Obtener conteos de entidades
    const [areasRes, supervisoresRes, colaboradoresRes] = await Promise.all([
      supabase.from('areas').select('*', { count: 'exact' }),
      supabase.from('supervisors').select('*', { count: 'exact' }).eq('activo', true),
      supabase.from('colaboradores').select('*', { count: 'exact' }).eq('activo', true),
    ])

    return {
      totalRegistros,
      sincronizados,
      pendientes: totalRegistros - sincronizados,
      pctSincronizacion: totalRegistros > 0 ? Math.round((sincronizados / totalRegistros) * 100) : 0,
      totalAreas: areasRes.count ?? 0,
      totalSupervisores: supervisoresRes.count ?? 0,
      totalColaboradores: colaboradoresRes.count ?? 0,
    }
  } catch (error) {
    console.error('Error loading global stats:', error)
    throw error
  }
}

// ============= ESTADÍSTICAS POR ÁREA =============

/**
 * Obtiene estadísticas detalladas por área
 */
export async function getAreaStats(): Promise<AreaStats[]> {
  try {
    const { data: areas, error: areasError } = await supabase.from('areas').select(
      `
      id_area,
      nom_area,
      sede
    `,
    )

    if (areasError) throw areasError

    const stats = await Promise.all(
      (areas || []).map(async (area) => {
        // Get supervisor name separately
        const { data: supervisorData } = await supabase
          .from('supervisors')
          .select('nom_supervisor')
          .eq('id_area', area.id_area)
          .single()

        const { count: colaboradores } = await supabase
          .from('colaboradores')
          .select('*', { count: 'exact' })
          .eq('area', area.id_area)
          .eq('activo', true)

        const { data: formularios } = await supabase
          .from('formularios')
          .select('id, sincronizado, tipo, fecha')
          .eq('area_id', area.id_area)
          .order('fecha', { ascending: false })

        const registrosTotales = formularios?.length ?? 0
        const sincronizados = formularios?.filter((f) => f.sincronizado).length ?? 0

        return {
          areaId: area.id_area,
          areaNombre: area.nom_area,
          sede: area.sede || 'N/A',
          supervisor: supervisorData?.nom_supervisor || 'Sin asignar',
          colaboradoresActivos: colaboradores ?? 0,
          registrosTotales,
          registrosSincronizados: sincronizados,
          registrosPendientes: registrosTotales - sincronizados,
          pctSincronizacion: registrosTotales > 0 ? Math.round((sincronizados / registrosTotales) * 100) : 0,
          registrosCorte: formularios?.filter((f) => f.tipo === 'Corte').length ?? 0,
          registrosLabores: formularios?.filter((f) => f.tipo === 'Labores').length ?? 0,
          registrosAseguramiento: formularios?.filter((f) => f.tipo === 'Aseguramiento').length ?? 0,
          ultimaActividad: formularios?.[0]?.fecha ?? null,
        }
      }),
    )

    return stats.sort((a, b) => b.registrosTotales - a.registrosTotales)
  } catch (error) {
    console.error('Error loading area stats:', error)
    throw error
  }
}

// ============= ESTADÍSTICAS POR SUPERVISOR =============

/**
 * Obtiene estadísticas detalladas por supervisor
 */
export async function getSupervisorStats(): Promise<SupervisorStats[]> {
  try {
    const { data: supervisores, error } = await supabase
      .from('supervisors')
      .select('id_supervisor, nom_supervisor, sede, activo')
      .eq('activo', true)

    if (error) throw error

    const stats = await Promise.all(
      (supervisores || []).map(async (sup) => {
        // Obtener áreas a cargo
        const { count: areas } = await supabase
          .from('areas')
          .select('*', { count: 'exact' })
          .eq('id_supervisor', sup.id_supervisor)

        // Obtener colaboradores asignados
        const { count: colaboradores } = await supabase
          .from('colaboradores')
          .select('*', { count: 'exact' })
          .eq('supervisor', sup.id_supervisor)
          .eq('activo', true)

        // Obtener formularios
        const { data: formularios } = await supabase
          .from('formularios')
          .select('id, sincronizado, fecha')
          .eq('supervisor_id', sup.id_supervisor)
          .order('fecha', { ascending: false })

        const registrosTotales = formularios?.length ?? 0
        const sincronizados = formularios?.filter((f) => f.sincronizado).length ?? 0

        // Get sede info
        const { data: sedeData } = await supabase
          .from('sedes')
          .select('nom_sede')
          .eq('id_sede', sup.sede)
          .single()

        return {
          supervisorId: sup.id_supervisor,
          supervisorNombre: sup.nom_supervisor,
          sede: sedeData?.nom_sede || 'N/A',
          areasAcargo: areas ?? 0,
          colaboradoresAsignados: colaboradores ?? 0,
          registrosTotales,
          registrosSincronizados: sincronizados,
          registrosPendientes: registrosTotales - sincronizados,
          pctSincronizacion: registrosTotales > 0 ? Math.round((sincronizados / registrosTotales) * 100) : 0,
          ultimaActividad: formularios?.[0]?.fecha ?? null,
        }
      }),
    )

    return stats.sort((a, b) => b.registrosTotales - a.registrosTotales)
  } catch (error) {
    console.error('Error loading supervisor stats:', error)
    throw error
  }
}

// ============= ESTADÍSTICAS POR COLABORADOR (PARA UN SUPERVISOR) =============

/**
 * Obtiene estadísticas por colaborador asignado a un supervisor específico
 */
export async function getSupervisorColaboradorStats(supervisorId: string): Promise<ColaboradorStats[]> {
  try {
    const { data: colaboradores, error } = await supabase
      .from('colaboradores')
      .select(
        `
        id_colaborador,
        nom_colaborador,
        area
      `,
      )
      .eq('supervisor', supervisorId)
      .eq('activo', true)

    if (error) throw error

    // Get area and supervisor names separately
    const stats = await Promise.all(
      (colaboradores || []).map(async (colab) => {
        // Get area name
        const { data: areaData } = await supabase
          .from('areas')
          .select('nom_area')
          .eq('id_area', colab.area)
          .single()

        // Get supervisor name
        const { data: supervisorData } = await supabase
          .from('supervisors')
          .select('nom_supervisor')
          .eq('id_supervisor', supervisorId)
          .single()

        // Get all formularios for this supervisor
        const { data: formularios } = await supabase
          .from('formularios')
          .select('id, sincronizado, tipo, fecha, supervisor_id')
          .eq('supervisor_id', supervisorId)
          .order('fecha', { ascending: false })

        const registrosTotales = formularios?.length ?? 0
        const sincronizados = formularios?.filter((f) => f.sincronizado).length ?? 0

        let estadoActividad: 'Sin registros' | 'Hoy' | 'Últimos 7 días' | 'Inactivo' = 'Sin registros'
        if (formularios && formularios.length > 0) {
          const ultimaFecha = new Date(formularios[0].fecha)
          const hoy = new Date()
          const diasDiferencia = Math.floor((hoy.getTime() - ultimaFecha.getTime()) / (1000 * 60 * 60 * 24))

          if (diasDiferencia === 0) estadoActividad = 'Hoy'
          else if (diasDiferencia <= 7) estadoActividad = 'Últimos 7 días'
          else estadoActividad = 'Inactivo'
        }

        return {
          colaboradorId: colab.id_colaborador,
          colaboradorNombre: colab.nom_colaborador,
          area: areaData?.nom_area || 'N/A',
          supervisor: supervisorData?.nom_supervisor || 'N/A',
          registrosTotales,
          registrosSincronizados: sincronizados,
          registrosPendientes: registrosTotales - sincronizados,
          pctSincronizacion: registrosTotales > 0 ? Math.round((sincronizados / registrosTotales) * 100) : 0,
          registrosCorte: formularios?.filter((f) => f.tipo === 'Corte').length ?? 0,
          registrosLabores: formularios?.filter((f) => f.tipo === 'Labores').length ?? 0,
          registrosAseguramiento: formularios?.filter((f) => f.tipo === 'Aseguramiento').length ?? 0,
          ultimoRegistro: formularios?.[0]?.fecha ?? null,
          estadoActividad,
        }
      }),
    )

    return stats.sort((a, b) => b.registrosPendientes - a.registrosPendientes)
  } catch (error) {
    console.error('Error loading supervisor colaborador stats:', error)
    throw error
  }
}

// ============= ANÁLISIS DETALLADO POR LABOR/CORTE/ASEGURAMIENTO =============

export interface LaborDetalleData {
  fecha: string
  numeroLabor: number
  nombreLabor: string
  colaborador: string
  area: string
  bloque: string
  variedad: string
  camasEstimadas: number
  camasReales: number
  rendimientoLabor: number
}

export interface CorteDetalleData {
  fecha: string
  numeroLabor: number
  nombreLabor: string
  colaborador: string
  area: string
  bloque: string
  variedad: string
  tiempoEstimado: number
  tiempoReal: number
  tallosEstimados: number
  tallosReales: number
  rendimiento: number
}

export interface AseguramientoDetalleData {
  fecha: string
  tipoLabor: string
  colaborador: string
  area: string
  bloque: string
  variedad: string
  cumplimiento: number
  calidad: number
}

/**
 * Obtiene datos detallados de labores por labor individual
 * Con filtros opcionales: área, bloque, variedad
 */
export async function getLaborData(
  desde: string,
  hasta: string,
  areaId?: string,
  bloqueId?: string,
  variedadId?: string,
): Promise<LaborDetalleData[]> {
  try {
    const { data: labores } = await supabase
      .from('labores_detalle')
      .select(
        `
        id,
        fila_labores_id,
        numero_labor,
        nom_labor,
        camas_estimado,
        camas_real,
        rendimiento_pct,
        fecha_creacion
      `,
      )
      .gte('fecha_creacion', desde)
      .lte('fecha_creacion', hasta)

    const filaIds = Array.from(
      new Set((labores || []).map((item: any) => String(item.fila_labores_id)).filter(Boolean)),
    )

    const { data: filas } = filaIds.length > 0
      ? await supabase
          .from('formulario_rows_labores')
          .select('id, formulario_id, id_area, id_bloque, id_variedad, nombre_colaborador')
          .in('id', filaIds)
      : { data: [] }

    const filaMap = new Map((filas || []).map((fila: any) => [String(fila.id), fila]))

    const areaIds = Array.from(new Set((filas || []).map((fila: any) => String(fila.id_area)).filter(Boolean)))
    const bloqueIds = Array.from(new Set((filas || []).map((fila: any) => String(fila.id_bloque)).filter(Boolean)))
    const variedadIds = Array.from(new Set((filas || []).map((fila: any) => String(fila.id_variedad)).filter(Boolean)))

    const [areasRes, bloquesRes, variedadesRes] = await Promise.all([
      areaIds.length > 0
        ? supabase.from('areas').select('id_area, nom_area').in('id_area', areaIds)
        : Promise.resolve({ data: [] as any[] }),
      bloqueIds.length > 0
        ? supabase.from('bloques').select('id_bloque, nom_bloque').in('id_bloque', bloqueIds)
        : Promise.resolve({ data: [] as any[] }),
      variedadIds.length > 0
        ? supabase.from('variedades').select('id_variedad, nom_variedad').in('id_variedad', variedadIds)
        : Promise.resolve({ data: [] as any[] }),
    ])

    const areaMap = new Map((areasRes.data || []).map((a: any) => [String(a.id_area), a.nom_area]))
    const bloqueMap = new Map((bloquesRes.data || []).map((b: any) => [String(b.id_bloque), b.nom_bloque]))
    const variedadMap = new Map((variedadesRes.data || []).map((v: any) => [String(v.id_variedad), v.nom_variedad]))

    const enrichedData = (labores || [])
      .map((labor: any) => {
        const fila = filaMap.get(String(labor.fila_labores_id))
        if (!fila) return null
        if (areaId && fila.id_area !== areaId) return null
        if (bloqueId && fila.id_bloque !== bloqueId) return null
        if (variedadId && fila.id_variedad !== variedadId) return null

        return {
          fecha: labor.fecha_creacion?.split('T')[0] || '',
          numeroLabor: labor.numero_labor || 0,
          nombreLabor: labor.nom_labor || '—',
          colaborador: fila.nombre_colaborador || '—',
          area: areaMap.get(String(fila.id_area)) || '—',
          bloque: bloqueMap.get(String(fila.id_bloque)) || '—',
          variedad: variedadMap.get(String(fila.id_variedad)) || '—',
          camasEstimadas: labor.camas_estimado || 0,
          camasReales: labor.camas_real || 0,
          rendimientoLabor: labor.rendimiento_pct || 0,
        }
      })
      .filter(Boolean) as LaborDetalleData[]

    return enrichedData.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
  } catch (error) {
    console.error('Error loading labor data:', error)
    return []
  }
}

/**
 * Obtiene datos detallados de cortes por labor
 * Con filtros opcionales: área, bloque, variedad
 */
export async function getCorteDetalleData(
  desde: string,
  hasta: string,
  areaId?: string,
  bloqueId?: string,
  variedadId?: string,
): Promise<CorteDetalleData[]> {
  try {
    let query = supabase
      .from('formulario_rows_corte')
      .select(
        `
        id,
        numero_labor,
        nom_labor,
        nombre_colaborador,
        tiempo_estimado_horas,
        tiempo_real_horas,
        total_tallos_corte_estimado,
        total_tallos_corte_real,
        rendimiento_corte_real,
        fecha_creacion,
        formulario_id,
        id_area,
        id_bloque,
        id_variedad
      `,
      )
      .gte('fecha_creacion', desde)
      .lte('fecha_creacion', hasta)

    // Aplicar filtros si existen
    if (areaId) query = query.eq('id_area', areaId)
    if (bloqueId) query = query.eq('id_bloque', bloqueId)
    if (variedadId) query = query.eq('id_variedad', variedadId)

    const { data: cortes } = await query

    const areaIds = Array.from(new Set((cortes || []).map((corte: any) => String(corte.id_area)).filter(Boolean)))
    const bloqueIds = Array.from(new Set((cortes || []).map((corte: any) => String(corte.id_bloque)).filter(Boolean)))
    const variedadIds = Array.from(new Set((cortes || []).map((corte: any) => String(corte.id_variedad)).filter(Boolean)))

    const [areasRes, bloquesRes, variedadesRes] = await Promise.all([
      areaIds.length > 0
        ? supabase.from('areas').select('id_area, nom_area').in('id_area', areaIds)
        : Promise.resolve({ data: [] as any[] }),
      bloqueIds.length > 0
        ? supabase.from('bloques').select('id_bloque, nom_bloque').in('id_bloque', bloqueIds)
        : Promise.resolve({ data: [] as any[] }),
      variedadIds.length > 0
        ? supabase.from('variedades').select('id_variedad, nom_variedad').in('id_variedad', variedadIds)
        : Promise.resolve({ data: [] as any[] }),
    ])

    const areaMap = new Map((areasRes.data || []).map((a: any) => [String(a.id_area), a.nom_area]))
    const bloqueMap = new Map((bloquesRes.data || []).map((b: any) => [String(b.id_bloque), b.nom_bloque]))
    const variedadMap = new Map((variedadesRes.data || []).map((v: any) => [String(v.id_variedad), v.nom_variedad]))

    const enrichedData = (cortes || []).map((corte: any) => {
      return {
        fecha: corte.fecha_creacion?.split('T')[0] || '',
        numeroLabor: corte.numero_labor || 0,
        nombreLabor: corte.nom_labor || '—',
        colaborador: corte.nombre_colaborador || '—',
        area: areaMap.get(String(corte.id_area)) || '—',
        bloque: bloqueMap.get(String(corte.id_bloque)) || '—',
        variedad: variedadMap.get(String(corte.id_variedad)) || '—',
        tiempoEstimado: corte.tiempo_estimado_horas || 0,
        tiempoReal: corte.tiempo_real_horas || 0,
        tallosEstimados: corte.total_tallos_corte_estimado || 0,
        tallosReales: corte.total_tallos_corte_real || 0,
        rendimiento: corte.rendimiento_corte_real || 0,
      }
    })

    return enrichedData.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
  } catch (error) {
    console.error('Error loading corte detalle data:', error)
    return []
  }
}

/**
 * Obtiene datos detallados de aseguramiento
 * Con filtros opcionales: área, bloque, variedad
 * NOTA: NO muestra rendimiento% (ya está en labores)
 */
export async function getAseguramientoDetalleData(
  desde: string,
  hasta: string,
  areaId?: string,
  bloqueId?: string,
  variedadId?: string,
): Promise<AseguramientoDetalleData[]> {
  try {
    let query = supabase
      .from('formulario_rows_aseguramiento')
      .select(
        `
        id,
        nom_labor,
        nombre_colaborador,
        pct_cumplimiento,
        pct_prom_rendimiento,
        fecha_creacion,
        formulario_id,
        id_area,
        id_bloque,
        id_variedad
      `,
      )
      .gte('fecha_creacion', desde)
      .lte('fecha_creacion', hasta)

    // Aplicar filtros si existen
    if (areaId) query = query.eq('id_area', areaId)
    if (bloqueId) query = query.eq('id_bloque', bloqueId)
    if (variedadId) query = query.eq('id_variedad', variedadId)

    const { data: aseguramiento } = await query

    const areaIds = Array.from(new Set((aseguramiento || []).map((row: any) => String(row.id_area)).filter(Boolean)))
    const bloqueIds = Array.from(new Set((aseguramiento || []).map((row: any) => String(row.id_bloque)).filter(Boolean)))
    const variedadIds = Array.from(new Set((aseguramiento || []).map((row: any) => String(row.id_variedad)).filter(Boolean)))

    const [areasRes, bloquesRes, variedadesRes] = await Promise.all([
      areaIds.length > 0
        ? supabase.from('areas').select('id_area, nom_area').in('id_area', areaIds)
        : Promise.resolve({ data: [] as any[] }),
      bloqueIds.length > 0
        ? supabase.from('bloques').select('id_bloque, nom_bloque').in('id_bloque', bloqueIds)
        : Promise.resolve({ data: [] as any[] }),
      variedadIds.length > 0
        ? supabase.from('variedades').select('id_variedad, nom_variedad').in('id_variedad', variedadIds)
        : Promise.resolve({ data: [] as any[] }),
    ])

    const areaMap = new Map((areasRes.data || []).map((a: any) => [String(a.id_area), a.nom_area]))
    const bloqueMap = new Map((bloquesRes.data || []).map((b: any) => [String(b.id_bloque), b.nom_bloque]))
    const variedadMap = new Map((variedadesRes.data || []).map((v: any) => [String(v.id_variedad), v.nom_variedad]))

    const enrichedData = (aseguramiento || []).map((aseg: any) => ({
      fecha: aseg.fecha_creacion?.split('T')[0] || '',
      tipoLabor: aseg.nom_labor || '—',
      colaborador: aseg.nombre_colaborador || '—',
      area: areaMap.get(String(aseg.id_area)) || '—',
      bloque: bloqueMap.get(String(aseg.id_bloque)) || '—',
      variedad: variedadMap.get(String(aseg.id_variedad)) || '—',
      cumplimiento: aseg.pct_cumplimiento || 0,
      calidad: aseg.pct_prom_rendimiento || 0,
    }))

    return enrichedData.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
  } catch (error) {
    console.error('Error loading aseguramiento detalle data:', error)
    return []
  }
}

// ============= LEGACY FUNCTIONS (for admin Dashboard compatibility) =============

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

/**
 * Obtiene datos de Corte (legacy function for admin dashboard)
 */
export async function getCorteData(desde: string, hasta: string): Promise<DashDataCorte[]> {
  try {
    const { data } = await supabase
      .from('formulario_rows_corte')
      .select(
        `
        id,
        fecha_creacion,
        nombre_colaborador,
        tiempo_estimado_horas,
        tiempo_real_horas,
        total_tallos_corte_estimado,
        total_tallos_corte_real,
        rendimiento_corte_real,
        id_area,
        id_bloque,
        id_variedad,
        formulario_id
      `,
      )
      .gte('fecha_creacion', desde)
      .lte('fecha_creacion', hasta)
      .order('fecha_creacion', { ascending: true })

    const corteRows = (data ?? []) as any[]
    const areaIds = Array.from(new Set(corteRows.map((row) => String(row.id_area)).filter(Boolean)))
    const bloqueIds = Array.from(new Set(corteRows.map((row) => String(row.id_bloque)).filter(Boolean)))
    const variedadIds = Array.from(new Set(corteRows.map((row) => String(row.id_variedad)).filter(Boolean)))
    const formularioIds = Array.from(new Set(corteRows.map((row) => String(row.formulario_id)).filter(Boolean)))

    const [areasRes, bloquesRes, variedadesRes, formulariosRes] = await Promise.all([
      areaIds.length > 0
        ? supabase.from('areas').select('id_area, nom_area').in('id_area', areaIds)
        : Promise.resolve({ data: [] as any[] }),
      bloqueIds.length > 0
        ? supabase.from('bloques').select('id_bloque, nom_bloque').in('id_bloque', bloqueIds)
        : Promise.resolve({ data: [] as any[] }),
      variedadIds.length > 0
        ? supabase.from('variedades').select('id_variedad, nom_variedad').in('id_variedad', variedadIds)
        : Promise.resolve({ data: [] as any[] }),
      formularioIds.length > 0
        ? supabase.from('formularios').select('id, supervisor_id').in('id', formularioIds)
        : Promise.resolve({ data: [] as any[] }),
    ])

    const areaMap = new Map((areasRes.data || []).map((a: any) => [String(a.id_area), a.nom_area]))
    const bloqueMap = new Map((bloquesRes.data || []).map((b: any) => [String(b.id_bloque), b.nom_bloque]))
    const variedadMap = new Map((variedadesRes.data || []).map((v: any) => [String(v.id_variedad), v.nom_variedad]))
    const formularioMap = new Map((formulariosRes.data || []).map((f: any) => [String(f.id), f]))

    const supervisorIds = Array.from(new Set((formulariosRes.data || []).map((f: any) => String(f.supervisor_id)).filter(Boolean)))
    const supervisorsRes = supervisorIds.length > 0
      ? await supabase.from('supervisors').select('id_supervisor, nom_supervisor').in('id_supervisor', supervisorIds)
      : { data: [] as any[] }
    const supervisorMap = new Map((supervisorsRes.data || []).map((s: any) => [String(s.id_supervisor), s.nom_supervisor]))

    return corteRows.map((row) => ({
      fecha: row.fecha_creacion?.split('T')[0] || '',
      area: areaMap.get(String(row.id_area)) || '—',
      supervisor: supervisorMap.get(String(formularioMap.get(String(row.formulario_id))?.supervisor_id)) || '—',
      colaborador: row.nombre_colaborador || '—',
      bloque: bloqueMap.get(String(row.id_bloque)) || '—',
      variedad: variedadMap.get(String(row.id_variedad)) || '—',
      tiempoEstimado: row.tiempo_estimado_horas || 0,
      tiempoReal: row.tiempo_real_horas || 0,
      tallosEstimados: row.total_tallos_corte_estimado || 0,
      tallosReales: row.total_tallos_corte_real || 0,
      rendimiento: row.rendimiento_corte_real || 0,
    }))
  } catch (error) {
    console.error('Error loading corte data:', error)
    return []
  }
}

/**
 * Obtiene datos de Labores (legacy function for admin dashboard)
 */
export async function getLaboresData(desde: string, hasta: string): Promise<DashDataLabores[]> {
  try {
    const { data } = await supabase
      .from('labores_detalle')
      .select(
        `
        id,
        fila_labores_id,
        numero_labor,
        nom_labor,
        camas_estimado,
        camas_real,
        rendimiento_pct,
        fecha_creacion
      `,
      )
      .gte('fecha_creacion', desde)
      .lte('fecha_creacion', hasta)

    const laborRows = (data ?? []) as any[]
    const filaIds = Array.from(new Set(laborRows.map((row) => String(row.fila_labores_id)).filter(Boolean)))

    const { data: filas } = filaIds.length > 0
      ? await supabase
          .from('formulario_rows_labores')
          .select('id, id_area, id_bloque, id_variedad, nombre_colaborador')
          .in('id', filaIds)
      : { data: [] as any[] }

    const filaMap = new Map((filas || []).map((fila: any) => [String(fila.id), fila]))

    const areaIds = Array.from(new Set((filas || []).map((fila: any) => String(fila.id_area)).filter(Boolean)))

    const [areasRes] = await Promise.all([
      areaIds.length > 0
        ? supabase.from('areas').select('id_area, nom_area').in('id_area', areaIds)
        : Promise.resolve({ data: [] as any[] }),
    ])

    const areaMap = new Map((areasRes.data || []).map((a: any) => [String(a.id_area), a.nom_area]))

    return laborRows.map((row) => {
      const fila = filaMap.get(String(row.fila_labores_id))
      return {
        fecha: row.fecha_creacion?.split('T')[0] || '',
        area: fila ? areaMap.get(String(fila.id_area)) || '—' : '—',
        colaborador: fila?.nombre_colaborador || '—',
        numeroLabor: row.numero_labor || 0,
        nombreLabor: row.nom_labor || '—',
        camasEstimadas: row.camas_estimado || 0,
        camasReales: row.camas_real || 0,
        rendimiento: row.rendimiento_pct || 0,
      }
    })
  } catch (error) {
    console.error('Error loading labores data:', error)
    return []
  }
}

/**
 * Obtiene datos de Aseguramiento (legacy function for admin dashboard)
 */
export async function getAseguramientoData(desde: string, hasta: string): Promise<DashDataAseguramiento[]> {
  try {
    const { data } = await supabase
      .from('formulario_rows_aseguramiento')
      .select(
        `
        id,
        fecha_creacion,
        nombre_colaborador,
        pct_cumplimiento,
        pct_prom_rendimiento,
        id_area
      `,
      )
      .gte('fecha_creacion', desde)
      .lte('fecha_creacion', hasta)

    const rows = (data ?? []) as any[]
    const areaIds = Array.from(new Set(rows.map((row) => String(row.id_area)).filter(Boolean)))

    const areasRes = areaIds.length > 0
      ? await supabase.from('areas').select('id_area, nom_area').in('id_area', areaIds)
      : { data: [] as any[] }

    const areaMap = new Map((areasRes.data || []).map((a: any) => [String(a.id_area), a.nom_area]))

    return rows.map((row) => ({
      fecha: row.fecha_creacion?.split('T')[0] || '',
      area: areaMap.get(String(row.id_area)) || '—',
      colaborador: row.nombre_colaborador || '—',
      cumplimiento: row.pct_cumplimiento || 0,
      calidad: row.pct_prom_rendimiento || 0,
    }))
  } catch (error) {
    console.error('Error loading aseguramiento data:', error)
    return []
  }
}

/**
 * Estadísticas por Área (legacy)
 */
export async function getStatsPorArea(desde: string): Promise<StatsPorArea[]> {
  try {
    const { data } = await supabase
      .from('formulario_rows_corte')
      .select('id_area, rendimiento_corte_real, tiempo_estimado_horas')
      .gte('fecha_creacion', desde)

    const rows = (data ?? []) as any[]
    const areaIds = Array.from(new Set(rows.map((row) => String(row.id_area)).filter(Boolean)))

    const areasRes = areaIds.length > 0
      ? await supabase.from('areas').select('id_area, nom_area').in('id_area', areaIds)
      : { data: [] as any[] }

    const areaMap = new Map((areasRes.data || []).map((a: any) => [String(a.id_area), a.nom_area]))

    const grouped: Record<string, any> = {}
    for (const row of rows) {
      const areaKey = String(row.id_area || '—')
      if (!grouped[areaKey]) {
        grouped[areaKey] = {
          area: areaMap.get(areaKey) || '—',
          totalFormularios: 0,
          rendimientoTotal: 0,
          horasTotal: 0,
        }
      }
      grouped[areaKey].totalFormularios++
      grouped[areaKey].rendimientoTotal += row.rendimiento_corte_real || 0
      grouped[areaKey].horasTotal += row.tiempo_estimado_horas || 0
    }

    return Object.values(grouped).map((g: any) => ({
      area: g.area,
      totalFormularios: g.totalFormularios,
      promRendimiento: g.totalFormularios > 0 ? Math.round((g.rendimientoTotal / g.totalFormularios) * 100) / 100 : 0,
      totalHoras: Math.round(g.horasTotal * 100) / 100,
    }))
  } catch (error) {
    console.error('Error loading area stats:', error)
    return []
  }
}

/**
 * Estadísticas por Colaborador (legacy)
 */
export async function getStatsPorColaborador(desde: string): Promise<StatsPorColaborador[]> {
  try {
    const [{ data: corte }, { data: aseg }] = await Promise.all([
      supabase
        .from('formulario_rows_corte')
        .select('nombre_colaborador, rendimiento_corte_real')
        .gte('fecha_creacion', desde),
      supabase
        .from('formulario_rows_aseguramiento')
        .select('nombre_colaborador, pct_cumplimiento')
        .gte('fecha_creacion', desde),
    ])

    const grouped: Record<string, any> = {}
    for (const row of (corte ?? []) as any[]) {
      const colabKey = row.nombre_colaborador || '—'
      if (!grouped[colabKey]) {
        grouped[colabKey] = {
          colaborador: colabKey,
          totalRegistros: 0,
          rendimientoTotal: 0,
          cumplimientoTotal: 0,
          cumplimientoCount: 0,
        }
      }
      grouped[colabKey].totalRegistros++
      grouped[colabKey].rendimientoTotal += row.rendimiento_corte_real || 0
    }

    for (const row of (aseg ?? []) as any[]) {
      const colabKey = row.nombre_colaborador || '—'
      if (!grouped[colabKey]) {
        grouped[colabKey] = {
          colaborador: colabKey,
          totalRegistros: 0,
          rendimientoTotal: 0,
          cumplimientoTotal: 0,
          cumplimientoCount: 0,
        }
      }
      grouped[colabKey].cumplimientoTotal += row.pct_cumplimiento || 0
      grouped[colabKey].cumplimientoCount++
    }

    return Object.values(grouped).map((g: any) => ({
      colaborador: g.colaborador,
      totalRegistros: g.totalRegistros,
      promRendimiento: g.totalRegistros > 0 ? Math.round((g.rendimientoTotal / g.totalRegistros) * 100) / 100 : 0,
      promCumplimiento: g.cumplimientoCount > 0 ? Math.round((g.cumplimientoTotal / g.cumplimientoCount) * 100) / 100 : 0,
    }))
  } catch (error) {
    console.error('Error loading colaborador stats:', error)
    return []
  }
}

/**
 * Datos de resumen para KPIs (legacy)
 */
export async function getKPIData(desde: string): Promise<{
  totalRegistros: number
  promRendimiento: number
  promCumplimiento: number
  totalHoras: number
}> {
  try {
    const { data: corte } = await supabase
      .from('formulario_rows_corte')
      .select('rendimiento_corte_real, tiempo_estimado_horas')
      .gte('fecha_creacion', desde)

    const { data: aseg } = await supabase
      .from('formulario_rows_aseguramiento')
      .select('pct_cumplimiento')
      .gte('fecha_creacion', desde)

    const totalReg = (corte?.length || 0) + (aseg?.length || 0)
    const promRend =
      totalReg > 0 ? (corte ?? []).reduce((acc, r) => acc + (r.rendimiento_corte_real || 0), 0) / (corte?.length || 1) : 0
    const promCum = (aseg ?? []).length > 0 ? (aseg ?? []).reduce((acc, r) => acc + (r.pct_cumplimiento || 0), 0) / aseg!.length : 0
    const totalH = (corte ?? []).reduce((acc, r) => acc + (r.tiempo_estimado_horas || 0), 0)

    return {
      totalRegistros: totalReg,
      promRendimiento: Math.round(promRend * 100) / 100,
      promCumplimiento: Math.round(promCum * 100) / 100,
      totalHoras: Math.round(totalH * 100) / 100,
    }
  } catch (error) {
    console.error('Error loading KPI data:', error)
    return {
      totalRegistros: 0,
      promRendimiento: 0,
      promCumplimiento: 0,
      totalHoras: 0,
    }
  }
}
