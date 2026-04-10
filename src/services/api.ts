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
  if (error) throw new Error(error.message)
  return (data ?? []).map((s) => ({
    id: String(s.id_sede ?? ''),
    nombre: String(s.nom_sede ?? ''),
  }))
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

export async function patchAssignArea(areaId: string, supervisorId: string): Promise<void> {
  const { error } = await supabase
    .from('areas')
    .update({ id_supervisor: supervisorId })
    .eq('id_area', areaId)
  if (error) throw new Error(error.message)
}


