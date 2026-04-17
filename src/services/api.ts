import { supabase } from './supabase'
import type { Area, Bloque, Colaborador, LaborCatalog, Sede, Supervisor, Variedad, VariedadBloque, Formulario } from '../types'

// ─── Supabase CRUD helpers ────────────────────────────────────────────────────

export async function upsertArea(a: Area): Promise<void> {
  const { error } = await supabase.from('areas').upsert(
    { id_area: a.id, nom_area: a.nombre, sede: a.sedeId, id_supervisor: a.supervisorId || null, activo: a.activo },
    { onConflict: 'id_area' }
  )
  if (error) throw new Error(error.message)
}
export async function deleteAreaSupa(id: string): Promise<void> {
  const { error } = await supabase.from('areas').delete().eq('id_area', id)
  if (error) throw new Error(error.message)
}

export async function upsertColaborador(c: Colaborador): Promise<void> {
  const { error } = await supabase.from('colaboradores').upsert(
    {
      id_colaborador: c.id,
      nom_colaborador: c.nombre,
      es_externo: c.externo,
      area: c.areaId || null,
      supervisor: c.supervisorId || null,
      asignado: c.asignado,
      activo: c.activo,
    },
    { onConflict: 'id_colaborador' }
  )
  if (error) throw new Error(error.message)
}
export async function deleteColaboradorSupa(id: string): Promise<void> {
  const { error } = await supabase.from('colaboradores').delete().eq('id_colaborador', id)
  if (error) throw new Error(error.message)
}

export async function upsertBloque(b: Bloque): Promise<void> {
  const { error } = await supabase.from('bloques').upsert(
    { id_bloque: b.id, nom_bloque: b.nombre, area: b.areaId },
    { onConflict: 'id_bloque' }
  )
  if (error) throw new Error(error.message)
}
export async function deleteBloqueSupa(id: string): Promise<void> {
  const { error } = await supabase.from('bloques').delete().eq('id_bloque', id)
  if (error) throw new Error(error.message)
}

export async function upsertVariedad(v: Variedad): Promise<void> {
  const { error } = await supabase.from('variedades').upsert(
    { id_variedad: v.id, nom_variedad: v.nombre },
    { onConflict: 'id_variedad' }
  )
  if (error) throw new Error(error.message)
}
export async function deleteVariedadSupa(id: string): Promise<void> {
  const { error } = await supabase.from('variedades').delete().eq('id_variedad', id)
  if (error) throw new Error(error.message)
}

export async function upsertSupervisor(s: Supervisor): Promise<void> {
  const { error } = await supabase.from('supervisors').upsert(
    { id_supervisor: s.id, nom_supervisor: s.nombre, id_area: s.areaId, sede: s.sedeId, activo: s.activo },
    { onConflict: 'id_supervisor' }
  )
  if (error) throw new Error(error.message)
}
export async function deleteSupervisorSupa(id: string): Promise<void> {
  const { error } = await supabase.from('supervisors').delete().eq('id_supervisor', id)
  if (error) throw new Error(error.message)
}

export async function upsertLabor(l: LaborCatalog): Promise<void> {
  const { error } = await supabase.from('labores').upsert(
    { id_labor: l.id, nom_labor: l.nombre },
    { onConflict: 'id_labor' }
  )
  if (error) throw new Error(error.message)
}
export async function deleteLaborSupa(id: string): Promise<void> {
  const { error } = await supabase.from('labores').delete().eq('id_labor', id)
  if (error) throw new Error(error.message)
}

// ─── Dashboard metrics ────────────────────────────────────────────────────────

export interface DashboardFormulario {
  id: string
  fecha: string
  areaId: string
  estado: string
}

export async function fetchDashboardFormularios(desde: string): Promise<DashboardFormulario[]> {
  const { data, error } = await supabase
    .from('formularios')
    .select('id, fecha, area_id, estado')
    .gte('fecha', desde)
    .order('fecha', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map((f) => ({
    id: String(f.id),
    fecha: String(f.fecha),
    areaId: String(f.area_id ?? ''),
    estado: String(f.estado ?? ''),
  }))
}

// ─── Estadísticas de labores ──────────────────────────────────────────────────

export interface LaborStatRow {
  laborId: string
  areaId: string
  fecha: string
  camasEstimadas: number
  camasReales: number
  rendimientoPct: number
}

export async function fetchLaborStats(desde: string): Promise<LaborStatRow[]> {
  const { data, error } = await supabase
    .from('formulario_rows')
    .select(`
      id_area,
      formularios!formulario_rows_formulario_id_fkey(fecha),
      labor_1, labor_1_camas_estimado, labor_1_camas_real, labor_1_rendimiento_pct,
      labor_2, labor_2_camas_estimado, labor_2_camas_real, labor_2_rendimiento_pct,
      labor_3, labor_3_camas_estimado, labor_3_camas_real, labor_3_rendimiento_pct,
      labor_4, labor_4_camas_estimado, labor_4_camas_real, labor_4_rendimiento_pct,
      labor_5, labor_5_camas_estimado, labor_5_camas_real, labor_5_rendimiento_pct
    `)
    .gte('formularios.fecha', desde)
  if (error) throw new Error(error.message)

  const rows: LaborStatRow[] = []
  for (const r of data ?? []) {
    const fecha = (r.formularios as { fecha?: string } | null)?.fecha ?? ''
    if (!fecha || fecha < desde) continue
    const areaId = String(r.id_area ?? '')
    for (let i = 1; i <= 5; i++) {
      const laborId = (r as Record<string, unknown>)[`labor_${i}`] as string | null
      if (!laborId) continue
      rows.push({
        laborId,
        areaId,
        fecha,
        camasEstimadas: Number((r as Record<string, unknown>)[`labor_${i}_camas_estimado`]) || 0,
        camasReales: Number((r as Record<string, unknown>)[`labor_${i}_camas_real`]) || 0,
        rendimientoPct: Number((r as Record<string, unknown>)[`labor_${i}_rendimiento_pct`]) || 0,
      })
    }
  }
  return rows
}

export async function fetchAreas(): Promise<Area[]> {
  const { data, error } = await supabase
    .from('areas')
    .select('id_area, nom_area, sede, id_supervisor, activo')
  if (error) throw new Error(error.message)
  return (data ?? []).map((a) => ({
    id: String(a.id_area ?? ''),
    nombre: String(a.nom_area ?? ''),
    sedeId: String(a.sede ?? ''),
    supervisorId: String(a.id_supervisor ?? ''),
    activo: a.activo !== false,
  }))
}

export async function fetchSupervisores(): Promise<Supervisor[]> {
  const { data, error } = await supabase
    .from('supervisors')
    .select('id_supervisor, nom_supervisor, id_area, sede, activo')
  if (error) throw new Error(error.message)
  return (data ?? []).map((s) => ({
    id: String(s.id_supervisor ?? ''),
    nombre: String(s.nom_supervisor ?? ''),
    areaId: String(s.id_area ?? ''),
    sedeId: String(s.sede ?? ''),
    activo: s.activo !== false,
  }))
}

export async function fetchBloques(): Promise<Bloque[]> {
  const { data, error } = await supabase
    .from('bloques')
    .select('id_bloque, nom_bloque, area')
  if (error) throw new Error(error.message)
  return (data ?? []).map((b) => ({
    id: String(b.id_bloque ?? ''),
    nombre: String(b.nom_bloque ?? ''),
    areaId: String(b.area ?? ''),
  }))
}

export async function fetchSedes(): Promise<Sede[]> {
  const { data, error } = await supabase
    .from('sedes')
    .select('id_sede, nom_sede')
    .order('nom_sede', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []).map((s) => ({
    id: String(s.id_sede ?? ''),
    nombre: String(s.nom_sede ?? ''),
  }))
}

export async function upsertSede(s: Sede): Promise<void> {
  const { error } = await supabase.from('sedes').upsert(
    { id_sede: s.id, nom_sede: s.nombre },
    { onConflict: 'id_sede' }
  )
  if (error) throw new Error(error.message)
}

export async function deleteSedeSupabase(id: string): Promise<void> {
  const { error } = await supabase.from('sedes').delete().eq('id_sede', id)
  if (error) throw new Error(error.message)
}

export async function patchColaboradorAsignacion(
  id: string,
  areaId: string,
  asignado: boolean
): Promise<void> {
  const { error } = await supabase
    .from('colaboradores')
    .update({ area: areaId || null, asignado })
    .eq('id_colaborador', id)
  if (error) throw new Error(error.message)
}

export async function fetchColaboradores(): Promise<Colaborador[]> {
  const { data, error } = await supabase
    .from('colaboradores')
    .select('id_colaborador, nom_colaborador, es_externo, area, supervisor, asignado, activo')
  if (error) throw new Error(error.message)
  return (data ?? []).map((c) => ({
    id: String(c.id_colaborador ?? ''),
    nombre: String(c.nom_colaborador ?? ''),
    externo: c.es_externo === true,
    areaId: String(c.area ?? ''),
    supervisorId: String(c.supervisor ?? ''),
    asignado: c.asignado !== false,
    activo: c.activo !== false,
  }))
}

export async function fetchVariedades(): Promise<Variedad[]> {
  const { data, error } = await supabase
    .from('variedades')
    .select('id_variedad, nom_variedad')
  if (error) throw new Error(error.message)
  return (data ?? []).map((v) => ({
    id: String(v.id_variedad ?? ''),
    nombre: String(v.nom_variedad ?? ''),
  }))
}

export async function fetchVariedadesBloques(): Promise<VariedadBloque[]> {
  const { data, error } = await supabase
    .from('variedades_bloques')
    .select('id_variedad, id_bloque')
  if (error) throw new Error(error.message)
  return (data ?? []).map((vb) => {
    const variedadId = String(vb.id_variedad ?? '')
    const bloqueId = String(vb.id_bloque ?? '')
    return { id: `${variedadId}_${bloqueId}`, variedadId, bloqueId }
  })
}

export async function fetchLabores(): Promise<LaborCatalog[]> {
  const { data, error } = await supabase
    .from('labores')
    .select('id_labor, nom_labor')
  if (error) throw new Error(error.message)
  return (data ?? []).map((l) => ({
    id: String(l.id_labor ?? ''),
    nombre: String(l.nom_labor ?? ''),
  }))
}

/**
 * Envía el formulario a Supabase: upsert del encabezado + upsert de cada fila por colaborador.
 */
export async function postRegistro(formulario: Formulario): Promise<void> {
  // 1. Upsert encabezado del formulario
  const { error: errForm } = await supabase
    .from('formularios')
    .upsert({
      id: formulario.id,
      fecha: formulario.fecha,
      area_id: formulario.areaId,
      supervisor_id: formulario.supervisorId,
      tipo: formulario.tipo,
      estado: formulario.estado,
      fecha_creacion: formulario.fechaCreacion,
      sincronizado: formulario.sincronizado,
      intentos_sincronizacion: formulario.intentosSincronizacion,
      error_sincronizacion_permanente: formulario.errorPermanente,
      ultimo_error: formulario.ultimoError ?? null,
    }, { onConflict: 'id' })

  if (errForm) throw new Error(errForm.message)

  // 2. Upsert de cada fila por colaborador
  const lab = (labores: Formulario['filas'][number]['labores'], i: number, field: string) =>
    labores[i] ? (labores[i] as unknown as Record<string, unknown>)[field] ?? null : null

  const rows = formulario.filas.map((fila) => ({
    id: `${formulario.id}-${fila.colaboradorId}`,
    formulario_id: formulario.id,
    id_colaborador: fila.colaboradorId,
    nombre_colaborador: fila.nombre,
    externo: fila.externo,
    id_area: formulario.areaId,
    id_supervisor: formulario.supervisorId,
    id_bloque: fila.bloqueId || null,
    id_variedad: fila.variedadId || null,
    // Corte
    tiempo_estimado_horas: fila.tiempoEstimadoHoras || null,
    tiempo_estimado_minutos: fila.tiempoEstimadoMinutos || null,
    tiempo_real_horas: fila.tiempoRealHoras || null,
    tiempo_real_minutos: fila.tiempoRealMinutos || null,
    total_tallos_corte_estimado: fila.tallosEstimados || null,
    total_tallos_corte_real: fila.tallosReales || null,
    hora_inicio_corte: fila.horaInicio || null,
    hora_fin_corte_estimado: fila.horaFinCorteEstimado || null,
    hora_real_fin_corte: fila.horaFinCorteReal || null,
    hora_cama: fila.horaCama || null,
    rendimiento_corte_estimado: fila.rendimientoCorteEstimado || null,
    rendimiento_corte_real: fila.rendimientoCorteReal || null,
    // Labores 1-5
    labor_1: lab(fila.labores, 0, 'laborId'),
    labor_1_camas_estimado: lab(fila.labores, 0, 'camasEstimadas'),
    labor_1_camas_real: lab(fila.labores, 0, 'camasReales'),
    labor_1_tiempo_cama_estimado: lab(fila.labores, 0, 'tiempoCamaEstimado'),
    labor_1_tiempo_cama_real: lab(fila.labores, 0, 'tiempoCamaReal'),
    labor_1_rendimiento_horas_estimado: lab(fila.labores, 0, 'rendimientoHorasEstimado'),
    labor_1_rendimiento_horas_real: lab(fila.labores, 0, 'rendimientoHorasReal'),
    labor_1_rendimiento_pct: lab(fila.labores, 0, 'rendimientoPorcentaje'),
    labor_2: lab(fila.labores, 1, 'laborId'),
    labor_2_camas_estimado: lab(fila.labores, 1, 'camasEstimadas'),
    labor_2_camas_real: lab(fila.labores, 1, 'camasReales'),
    labor_2_tiempo_cama_estimado: lab(fila.labores, 1, 'tiempoCamaEstimado'),
    labor_2_tiempo_cama_real: lab(fila.labores, 1, 'tiempoCamaReal'),
    labor_2_rendimiento_horas_estimado: lab(fila.labores, 1, 'rendimientoHorasEstimado'),
    labor_2_rendimiento_horas_real: lab(fila.labores, 1, 'rendimientoHorasReal'),
    labor_2_rendimiento_pct: lab(fila.labores, 1, 'rendimientoPorcentaje'),
    labor_3: lab(fila.labores, 2, 'laborId'),
    labor_3_camas_estimado: lab(fila.labores, 2, 'camasEstimadas'),
    labor_3_camas_real: lab(fila.labores, 2, 'camasReales'),
    labor_3_tiempo_cama_estimado: lab(fila.labores, 2, 'tiempoCamaEstimado'),
    labor_3_tiempo_cama_real: lab(fila.labores, 2, 'tiempoCamaReal'),
    labor_3_rendimiento_horas_estimado: lab(fila.labores, 2, 'rendimientoHorasEstimado'),
    labor_3_rendimiento_horas_real: lab(fila.labores, 2, 'rendimientoHorasReal'),
    labor_3_rendimiento_pct: lab(fila.labores, 2, 'rendimientoPorcentaje'),
    labor_4: lab(fila.labores, 3, 'laborId'),
    labor_4_camas_estimado: lab(fila.labores, 3, 'camasEstimadas'),
    labor_4_camas_real: lab(fila.labores, 3, 'camasReales'),
    labor_4_tiempo_cama_estimado: lab(fila.labores, 3, 'tiempoCamaEstimado'),
    labor_4_tiempo_cama_real: lab(fila.labores, 3, 'tiempoCamaReal'),
    labor_4_rendimiento_horas_estimado: lab(fila.labores, 3, 'rendimientoHorasEstimado'),
    labor_4_rendimiento_horas_real: lab(fila.labores, 3, 'rendimientoHorasReal'),
    labor_4_rendimiento_pct: lab(fila.labores, 3, 'rendimientoPorcentaje'),
    labor_5: lab(fila.labores, 4, 'laborId'),
    labor_5_camas_estimado: lab(fila.labores, 4, 'camasEstimadas'),
    labor_5_camas_real: lab(fila.labores, 4, 'camasReales'),
    labor_5_tiempo_cama_estimado: lab(fila.labores, 4, 'tiempoCamaEstimado'),
    labor_5_tiempo_cama_real: lab(fila.labores, 4, 'tiempoCamaReal'),
    labor_5_rendimiento_horas_estimado: lab(fila.labores, 4, 'rendimientoHorasEstimado'),
    labor_5_rendimiento_horas_real: lab(fila.labores, 4, 'rendimientoHorasReal'),
    labor_5_rendimiento_pct: lab(fila.labores, 4, 'rendimientoPorcentaje'),
    // Cierre
    desglose_pipe: fila.desglossePiPc,
    proceso_seguridad: fila.procesoSeguridad || null,
    calidad_cuadro_1: fila.calidad1,
    calidad_cuadro_2: fila.calidad2,
    calidad_cuadro_3: fila.calidad3,
    calidad_cuadro_4: fila.calidad4,
    calidad_cuadro_5: fila.calidad5,
    pct_cumplimiento: fila.cumplimientoCalidad || null,
    pct_prom_rendimiento: fila.rendimientoPromedio || null,
    observaciones: fila.observaciones || null,
  }))

  const { error: errRows } = await supabase
    .from('formulario_rows')
    .upsert(rows, { onConflict: 'id' })

  if (errRows) throw new Error(errRows.message)
}

// ─── NUEVAS FUNCIONES PARA FORMULARIOS SEPARADOS (3 TABLAS) ─────────────

/**
 * Guarda una fila de CORTE en formulario_rows_corte
 */
export async function saveFilaCorte(formularioId: string, filaId: string, data: {
  idColaborador: string
  nombreColaborador: string
  externo: boolean
  idArea: string
  idSupervisor: string
  idBloque: string
  idVariedad: string
  tiempoEstimadoMinutos?: number
  tiempoRealMinutos?: number
  totalTallosCorteEstimado?: number
  totalTallosCorteReal?: number
  horaInicioCorte?: string
  horaFinCorteEstimado?: string
  horaRealFinCorte?: string
  horaCama?: number
  rendimientoCorteEstimado?: number
  rendimientoCorteReal?: number
}): Promise<void> {
  const { error } = await supabase.from('formulario_rows_corte').upsert({
    id: filaId,
    formulario_id: formularioId,
    id_colaborador: data.idColaborador,
    nombre_colaborador: data.nombreColaborador,
    externo: data.externo,
    id_area: data.idArea || null,
    id_supervisor: data.idSupervisor || null,
    id_bloque: data.idBloque || null,
    id_variedad: data.idVariedad || null,
    tiempo_estimado_minutos: data.tiempoEstimadoMinutos || null,
    tiempo_real_minutos: data.tiempoRealMinutos || null,
    total_tallos_corte_estimado: data.totalTallosCorteEstimado || null,
    total_tallos_corte_real: data.totalTallosCorteReal || null,
    hora_inicio_corte: data.horaInicioCorte || null,
    hora_fin_corte_estimado: data.horaFinCorteEstimado || null,
    hora_real_fin_corte: data.horaRealFinCorte || null,
    hora_cama: data.horaCama || null,
    rendimiento_corte_estimado: data.rendimientoCorteEstimado || null,
    rendimiento_corte_real: data.rendimientoCorteReal || null,
  }, { onConflict: 'id' })
  if (error) throw new Error(error.message)
}

/**
 * Guarda una fila de LABORES (tabla padre) en formulario_rows_labores
 */
export async function saveFilaLabores(formularioId: string, filaId: string, data: {
  idColaborador: string
  nombreColaborador: string
  externo: boolean
  idArea: string
  idSupervisor: string
  idBloque: string
  idVariedad: string
  cantidadLaboresRegistradas?: number
  rendimientoPromedio?: number
  tiempoTotalLaboresEstimado?: number
  tiempoTotalLaboresReal?: number
  camasTotalEstimadas?: number
  camasTotalReales?: number
}): Promise<void> {
  const { error } = await supabase.from('formulario_rows_labores').upsert({
    id: filaId,
    formulario_id: formularioId,
    id_colaborador: data.idColaborador,
    nombre_colaborador: data.nombreColaborador,
    externo: data.externo,
    id_area: data.idArea || null,
    id_supervisor: data.idSupervisor || null,
    id_bloque: data.idBloque || null,
    id_variedad: data.idVariedad || null,
    cantidad_labores_registradas: data.cantidadLaboresRegistradas || 0,
    rendimiento_promedio: data.rendimientoPromedio || null,
    tiempo_total_labores_estimado: data.tiempoTotalLaboresEstimado || null,
    tiempo_total_labores_real: data.tiempoTotalLaboresReal || null,
    camas_total_estimadas: data.camasTotalEstimadas || null,
    camas_total_reales: data.camasTotalReales || null,
  }, { onConflict: 'id' })
  if (error) throw new Error(error.message)
}

/**
 * Guarda múltiples labores detalle bajo una fila de labores
 */
export async function saveLaboresDetalle(filaLaboresId: string, labores: Array<{
  id: string
  numeroLabor: number
  idLabor: string
  nomLabor: string
  camasEstimado?: number
  tiempoCamaEstimado?: number
  camasReal?: number
  tiempoCamaReal?: number
}>): Promise<void> {
  const rows = labores.map(l => ({
    id: l.id,
    fila_labores_id: filaLaboresId,
    id_labor: l.idLabor || null,
    nom_labor: l.nomLabor || null,
    camas_estimado: l.camasEstimado || null,
    tiempo_cama_estimado: l.tiempoCamaEstimado || null,
    camas_real: l.camasReal || null,
    tiempo_cama_real: l.tiempoCamaReal || null,
    numero_labor: l.numeroLabor,
  }))

  // Eliminar registros antiguos primero
  await supabase.from('labores_detalle').delete().eq('fila_labores_id', filaLaboresId)

  // Insertar nuevos
  const { error } = await supabase.from('labores_detalle').insert(rows)
  if (error) throw new Error(error.message)
}

/**
 * Guarda una fila de ASEGURAMIENTO en formulario_rows_aseguramiento
 */
export async function saveFilaAseguramiento(formularioId: string, filaId: string, data: {
  idColaborador: string
  nombreColaborador: string
  externo: boolean
  idArea: string
  idSupervisor: string
  idBloque: string
  idVariedad: string
  desglosePipe?: boolean
  procesoSeguridad?: string
  calidadCuadro1?: boolean
  calidadCuadro2?: boolean
  calidadCuadro3?: boolean
  calidadCuadro4?: boolean
  calidadCuadro5?: boolean
  pctPromRendimiento?: number
  rendimientoCorteReal?: number
  observaciones?: string
}): Promise<void> {
  const { error } = await supabase.from('formulario_rows_aseguramiento').upsert({
    id: filaId,
    formulario_id: formularioId,
    id_colaborador: data.idColaborador,
    nombre_colaborador: data.nombreColaborador,
    externo: data.externo,
    id_area: data.idArea || null,
    id_supervisor: data.idSupervisor || null,
    id_bloque: data.idBloque || null,
    id_variedad: data.idVariedad || null,
    desglose_pipe: data.desglosePipe || false,
    proceso_seguridad: data.procesoSeguridad || null,
    calidad_cuadro_1: data.calidadCuadro1 || false,
    calidad_cuadro_2: data.calidadCuadro2 || false,
    calidad_cuadro_3: data.calidadCuadro3 || false,
    calidad_cuadro_4: data.calidadCuadro4 || false,
    calidad_cuadro_5: data.calidadCuadro5 || false,
    pct_prom_rendimiento: data.pctPromRendimiento || null,
    rendimiento_corte_real: data.rendimientoCorteReal || null,
    observaciones: data.observaciones || null,
  }, { onConflict: 'id' })
  if (error) throw new Error(error.message)
}

/**
 * Actualiza el metadata de un formulario (rastreador de completitud)
 */
export async function updateFormularioMetadata(formularioId: string, idColaborador: string, updates: {
  seCompletoCorte?: boolean
  seCompletoLabores?: boolean
  seCompletoAseguramiento?: boolean
  filaCorteId?: string | null
  filaLaboresId?: string | null
  filaAseguramientoId?: string | null
}): Promise<void> {
  const metadataId = `${formularioId}-${idColaborador}`

  // Primero intenta actualizar
  const { data: existing } = await supabase
    .from('formulario_row_metadata')
    .select('id')
    .eq('id', metadataId)
    .maybeSingle()

  if (existing) {
    // Actualizar
    const { error } = await supabase
      .from('formulario_row_metadata')
      .update({
        se_completo_corte: updates.seCompletoCorte !== undefined ? updates.seCompletoCorte : undefined,
        se_completo_labores: updates.seCompletoLabores !== undefined ? updates.seCompletoLabores : undefined,
        se_completo_aseguramiento: updates.seCompletoAseguramiento !== undefined ? updates.seCompletoAseguramiento : undefined,
        fila_corte_id: updates.filaCorteId !== undefined ? updates.filaCorteId : undefined,
        fila_labores_id: updates.filaLaboresId !== undefined ? updates.filaLaboresId : undefined,
        fila_aseguramiento_id: updates.filaAseguramientoId !== undefined ? updates.filaAseguramientoId : undefined,
        fecha_actualizacion: new Date().toISOString(),
      })
      .eq('id', metadataId)
    if (error) throw new Error(error.message)
  } else {
    // Insertar
    const { error } = await supabase
      .from('formulario_row_metadata')
      .insert({
        id: metadataId,
        formulario_id: formularioId,
        id_colaborador: idColaborador,
        se_completo_corte: updates.seCompletoCorte || false,
        se_completo_labores: updates.seCompletoLabores || false,
        se_completo_aseguramiento: updates.seCompletoAseguramiento || false,
        fila_corte_id: updates.filaCorteId || null,
        fila_labores_id: updates.filaLaboresId || null,
        fila_aseguramiento_id: updates.filaAseguramientoId || null,
      })
    if (error) throw new Error(error.message)
  }
}

/**
 * Obtiene datos para el dashboard (queries optimizadas)
 */
export async function getDashboardDataCorte(desde: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('formulario_rows_corte')
    .select(`
      id,
      formulario_id,
      fecha_creacion,
      id_area,
      id_bloque,
      id_variedad,
      tiempo_estimado_horas,
      tiempo_real_horas,
      total_tallos_corte_estimado,
      total_tallos_corte_real,
      rendimiento_corte_estimado,
      rendimiento_corte_real
    `)
    .gte('fecha_creacion', desde)
    .order('fecha_creacion', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getDashboardDataLabores(desde: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('formulario_rows_labores')
    .select(`
      id,
      formulario_id,
      fecha_creacion,
      id_area,
      id_bloque,
      cantidad_labores_registradas,
      renderimiento_promedio,
      camas_total_estimadas,
      camas_total_reales
    `)
    .gte('fecha_creacion', desde)
    .order('fecha_creacion', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getDashboardDataAseguramiento(desde: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('formulario_rows_aseguramiento')
    .select(`
      id,
      formulario_id,
      fecha_creacion,
      id_area,
      pct_cumplimiento,
      pct_prom_rendimiento
    `)
    .gte('fecha_creacion', desde)
    .order('fecha_creacion', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

/**
 * FUNCIÓN PRINCIPAL: Guarda un formulario distribuido entre las 3 tablas según su tipo
 */
export async function saveFormularioCompleto(formulario: {
  id: string
  fecha: string
  areaId: string
  supervisorId: string
  tipo: 'Corte' | 'Labores' | 'Aseguramiento'
  estado?: string
  filas: Array<{
    colaboradorId: string
    nombre: string
    externo: boolean
    bloqueId: string
    variedadId: string
    // Corte fields
    tiempoEstimadoMinutos?: number
    tiempoRealMinutos?: number
    tallosEstimados?: number
    tallosReales?: number
    horaInicio?: string
    horaFinEstimado?: string
    horaFinReal?: string
    horaCama?: number
    rendimientoCorteEstimado?: number
    rendimientoCorteReal?: number
    // Labores fields
    labores?: Array<{
      id: string
      numero: number
      laborId: string
      laborNombre: string
      camasEstimadas?: number
      tiempoCamaEstimado?: number
      camasReales?: number
      tiempoCamaReal?: number
    }>
    // Aseguramiento fields
    desglose?: boolean
    procesoSeguridad?: string
    calidad?: [boolean, boolean, boolean, boolean, boolean]
    rendimientoPromedio?: number
    observaciones?: string
  }>
}): Promise<void> {
  // 1. Crear encabezado del formulario
  const { error: errForm } = await supabase.from('formularios').upsert({
    id: formulario.id,
    fecha: formulario.fecha,
    area_id: formulario.areaId,
    supervisor_id: formulario.supervisorId,
    tipo: formulario.tipo,
    estado: formulario.estado ?? 'borrador',
  }, { onConflict: 'id' })

  if (errForm) throw new Error(`Error guardando formulario: ${errForm.message}`)

  // 2. Guardar filas según el tipo
  for (const fila of formulario.filas) {
    const filaId = `${formulario.id}-${fila.colaboradorId}`

    if (formulario.tipo === 'Corte') {
      await saveFilaCorte(formulario.id, filaId, {
        idColaborador: fila.colaboradorId,
        nombreColaborador: fila.nombre,
        externo: fila.externo,
        idArea: formulario.areaId,
        idSupervisor: formulario.supervisorId,
        idBloque: fila.bloqueId,
        idVariedad: fila.variedadId,
        tiempoEstimadoMinutos: fila.tiempoEstimadoMinutos,
        tiempoRealMinutos: fila.tiempoRealMinutos,
        totalTallosCorteEstimado: fila.tallosEstimados,
        totalTallosCorteReal: fila.tallosReales,
        horaInicioCorte: fila.horaInicio,
        horaFinCorteEstimado: fila.horaFinEstimado,
        horaRealFinCorte: fila.horaFinReal,
        horaCama: fila.horaCama,
        rendimientoCorteEstimado: fila.rendimientoCorteEstimado,
        rendimientoCorteReal: fila.rendimientoCorteReal,
      })
      await updateFormularioMetadata(formulario.id, fila.colaboradorId, {
        seCompletoCorte: true,
        filaCorteId: filaId,
      })
    } else if (formulario.tipo === 'Labores') {
      await saveFilaLabores(formulario.id, filaId, {
        idColaborador: fila.colaboradorId,
        nombreColaborador: fila.nombre,
        externo: fila.externo,
        idArea: formulario.areaId,
        idSupervisor: formulario.supervisorId,
        idBloque: fila.bloqueId,
        idVariedad: fila.variedadId,
        cantidadLaboresRegistradas: (fila.labores ?? []).length,
        tiempoTotalLaboresEstimado: (fila.labores ?? []).reduce((sum, l) => sum + (l.tiempoCamaEstimado || 0), 0),
        tiempoTotalLaboresReal: (fila.labores ?? []).reduce((sum, l) => sum + (l.tiempoCamaReal || 0), 0),
        camasTotalEstimadas: (fila.labores ?? []).reduce((sum, l) => sum + (l.camasEstimadas || 0), 0),
        camasTotalReales: (fila.labores ?? []).reduce((sum, l) => sum + (l.camasReales || 0), 0),
        rendimientoPromedio: fila.rendimientoPromedio,
      })
      if (fila.labores && fila.labores.length > 0) {
        await saveLaboresDetalle(filaId, fila.labores.map(l => ({
          id: l.id,
          numeroLabor: l.numero,
          idLabor: l.laborId,
          nomLabor: l.laborNombre,
          camasEstimado: l.camasEstimadas,
          tiempoCamaEstimado: l.tiempoCamaEstimado,
          camasReal: l.camasReales,
          tiempoCamaReal: l.tiempoCamaReal,
        })))
      }
      await updateFormularioMetadata(formulario.id, fila.colaboradorId, {
        seCompletoLabores: true,
        filaLaboresId: filaId,
      })
    } else if (formulario.tipo === 'Aseguramiento') {
      await saveFilaAseguramiento(formulario.id, filaId, {
        idColaborador: fila.colaboradorId,
        nombreColaborador: fila.nombre,
        externo: fila.externo,
        idArea: formulario.areaId,
        idSupervisor: formulario.supervisorId,
        idBloque: fila.bloqueId,
        idVariedad: fila.variedadId,
        desglosePipe: fila.desglose,
        procesoSeguridad: fila.procesoSeguridad,
        calidadCuadro1: fila.calidad?.[0],
        calidadCuadro2: fila.calidad?.[1],
        calidadCuadro3: fila.calidad?.[2],
        calidadCuadro4: fila.calidad?.[3],
        calidadCuadro5: fila.calidad?.[4],
        pctPromRendimiento: fila.rendimientoPromedio,
        rendimientoCorteReal: fila.rendimientoCorteReal,
        observaciones: fila.observaciones,
      })
      await updateFormularioMetadata(formulario.id, fila.colaboradorId, {
        seCompletoAseguramiento: true,
        filaAseguramientoId: filaId,
      })
    }
  }
}

/**
 * Guarda 3 formularios completos (Corte, Labores, Aseguramiento) en bloque
 */
export async function saveFormulariosEnBloque(formularios: Formulario[]): Promise<void> {
  // Guardar los 3 formularios secuencialmente (uno a uno)
  for (const formulario of formularios) {
    await saveFormularioCompleto({
      id: formulario.id,
      fecha: formulario.fecha,
      areaId: formulario.areaId,
      supervisorId: formulario.supervisorId,
      tipo: formulario.tipo as 'Corte' | 'Labores' | 'Aseguramiento',
      estado: formulario.estado,
      filas: formulario.filas.map(f => ({
        colaboradorId: f.colaboradorId,
        nombre: f.nombre,
        externo: f.externo,
        bloqueId: f.bloqueId,
        variedadId: f.variedadId,
        tiempoEstimadoMinutos: f.tiempoEstimadoMinutos,
        tiempoRealMinutos: f.tiempoRealMinutos,
        tallosEstimados: f.tallosEstimados,
        tallosReales: f.tallosReales,
        horaInicio: f.horaInicio,
        horaFinEstimado: f.horaFinCorteEstimado,
        horaFinReal: f.horaFinCorteReal,
        horaCama: f.horaCama,
        rendimientoCorteEstimado: f.rendimientoCorteEstimado,
        rendimientoCorteReal: f.rendimientoCorteReal,
        labores: f.labores.map((l, idx) => ({
          id: `${formulario.id}-${f.colaboradorId}-labor-${idx}`,
          numero: idx + 1,
          laborId: l.laborId,
          laborNombre: l.laborNombre,
          camasEstimadas: l.camasEstimadas,
          tiempoCamaEstimado: l.tiempoCamaEstimado,
          camasReales: l.camasReales,
          tiempoCamaReal: l.tiempoCamaReal,
        })),
        desglose: f.desglossePiPc,
        procesoSeguridad: f.procesoSeguridad,
        calidad: [f.calidad1, f.calidad2, f.calidad3, f.calidad4, f.calidad5],
        rendimientoPromedio: f.rendimientoPromedio,
        observaciones: f.observaciones,
      })),
    })
  }
}

export async function patchAssignArea(areaId: string, supervisorId: string): Promise<void> {
  const { error } = await supabase
    .from('areas')
    .update({ id_supervisor: supervisorId })
    .eq('id_area', areaId)
  if (error) throw new Error(error.message)
}

/**
 * Guarda un formulario de tipo Planeacion que incluye Corte + Labores
 * Crea un único formulario que contiene ambos conjuntos de datos
 */
export async function savePlaneacion(planeacion: {
  id: string
  fecha: string
  areaId: string
  areaNombre: string
  supervisorId: string
  usuarioId?: string
  usuarioNombre?: string
  filas: Array<{
    colaboradorId: string
    nombre: string
    externo: boolean
    bloqueId: string
    variedadId: string
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
    // Labores
    labores: Array<{
      laborId: string
      laborNombre: string
      camasEstimadas: number
      tiempoCamaEstimado: number
      rendimientoHorasEstimado: number
      camasReales: number
      tiempoCamaReal: number
      rendimientoHorasReal: number
      rendimientoPorcentaje: number
    }>
    // Aseguramiento (opcional)
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
  }>
}): Promise<void> {
  // 1. Crear encabezado del formulario tipo Planeacion
  const { error: errForm } = await supabase.from('formularios').upsert({
    id: planeacion.id,
    fecha: planeacion.fecha,
    area_id: planeacion.areaId,
    supervisor_id: planeacion.supervisorId,
    tipo: 'Planeacion',
    estado: 'borrador',
    usuario_id: planeacion.usuarioId,
    usuario_nombre: planeacion.usuarioNombre,
  }, { onConflict: 'id' })

  if (errForm) throw new Error(`Error guardando planeacion: ${errForm.message}`)

  // 2. Guardar filas (que incluyen Corte + Labores)
  for (const fila of planeacion.filas) {
    const filaId = `${planeacion.id}-${fila.colaboradorId}`

    // Guardar datos de Corte
    await saveFilaCorte(planeacion.id, filaId, {
        idColaborador: fila.colaboradorId,
        nombreColaborador: fila.nombre,
        externo: fila.externo,
        idArea: planeacion.areaId,
        idSupervisor: planeacion.supervisorId,
        idBloque: fila.bloqueId,
        idVariedad: fila.variedadId,
        tiempoEstimadoMinutos: fila.tiempoEstimadoMinutos,
        tiempoRealMinutos: fila.tiempoRealMinutos,
        totalTallosCorteEstimado: fila.tallosEstimados,
        totalTallosCorteReal: fila.tallosReales,
        horaInicioCorte: fila.horaInicio,
        horaFinCorteEstimado: fila.horaFinCorteEstimado,
        horaRealFinCorte: fila.horaFinCorteReal,
        horaCama: fila.horaCama,
        rendimientoCorteEstimado: fila.rendimientoCorteEstimado,
        rendimientoCorteReal: fila.rendimientoCorteReal,
      })

      if (fila.labores && fila.labores.length > 0) {
        const totalCamasEst = fila.labores.reduce((acc, l) => acc + l.camasEstimadas, 0)
        const totalCamasReales = fila.labores.reduce((acc, l) => acc + l.camasReales, 0)

        await saveFilaLabores(planeacion.id, filaId, {
          idColaborador: fila.colaboradorId,
          nombreColaborador: fila.nombre,
          externo: fila.externo,
          idArea: planeacion.areaId,
          idSupervisor: planeacion.supervisorId,
          idBloque: fila.bloqueId,
          idVariedad: fila.variedadId,
          cantidadLaboresRegistradas: fila.labores.length,
          rendimientoPromedio: fila.rendimientoPromedio,
          tiempoTotalLaboresEstimado: fila.labores.reduce((sum, l) => sum + l.tiempoCamaEstimado, 0),
          tiempoTotalLaboresReal: fila.labores.reduce((sum, l) => sum + l.tiempoCamaReal, 0),
          camasTotalEstimadas: totalCamasEst,
          camasTotalReales: totalCamasReales,
        })

        await saveLaboresDetalle(filaId, fila.labores.map((l, idx) => ({
          id: `${filaId}-labor-${idx}`,
          numeroLabor: idx + 1,
          idLabor: l.laborId,
          nomLabor: l.laborNombre,
          camasEstimado: l.camasEstimadas,
          tiempoCamaEstimado: l.tiempoCamaEstimado,
          camasReal: l.camasReales,
          tiempoCamaReal: l.tiempoCamaReal,
        })))
      }
  }
}
