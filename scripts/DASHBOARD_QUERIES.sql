-- ============================================================================
-- DASHBOARD QUERIES - ADMIN & SUPERADMIN STATISTICS
-- ============================================================================
-- Use these queries to build dashboards for administrators and superadministrators
-- All queries return JSON-friendly data for easy integration with React/TypeScript

-- ============================================================================
-- 1. GLOBAL STATISTICS (Admin/Superadmin Overview)
-- ============================================================================

-- Total registros por tipo y estado
SELECT 
  tipo,
  estado,
  COUNT(*) as cantidad,
  COUNT(DISTINCT supervisor_id) as supervisores,
  COUNT(DISTINCT area_id) as areas,
  SUM(CASE WHEN sincronizado THEN 1 ELSE 0 END) as sincronizados,
  MAX(fecha) as ultima_fecha
FROM public.formularios
GROUP BY tipo, estado
ORDER BY tipo, estado;

-- Progreso general de sincronización
SELECT 
  COUNT(*) as total_registros,
  SUM(CASE WHEN sincronizado THEN 1 ELSE 0 END) as sincronizados,
  SUM(CASE WHEN NOT sincronizado THEN 1 ELSE 0 END) as pendientes,
  ROUND(100.0 * SUM(CASE WHEN sincronizado THEN 1 ELSE 0 END) / 
    NULLIF(COUNT(*), 0), 2) as pct_sincronizacion,
  COUNT(DISTINCT DATE(fecha)) as dias_con_registros,
  MAX(DATE(fecha)) as ultima_fecha
FROM public.formularios;

-- Errores de sincronización (formularios con problemas)
SELECT 
  id,
  fecha,
  area_id,
  supervisor_id,
  tipo,
  estado,
  last_error,
  intentos_sincronizacion,
  COUNT(*) OVER (PARTITION BY area_id) as errores_en_area
FROM public.formularios
WHERE error_sincronizacion_permanente = true
  OR intentos_sincronizacion > 3
ORDER BY fecha DESC;

-- ============================================================================
-- 2. ESTADÍSTICAS POR ÁREA
-- ============================================================================

-- Detalle completo por área
SELECT 
  a.id_area,
  a.nom_area,
  s.nom_sede,
  su.nom_supervisor as supervisor_actual,
  COUNT(DISTINCT c.id_colaborador) as colaboradores_activos,
  COUNT(DISTINCT f.id) as total_registros,
  SUM(CASE WHEN f.sincronizado THEN 1 ELSE 0 END) as registros_sincronizados,
  SUM(CASE WHEN NOT f.sincronizado THEN 1 ELSE 0 END) as registros_pendientes,
  ROUND(100.0 * SUM(CASE WHEN f.sincronizado THEN 1 ELSE 0 END) / 
    NULLIF(COUNT(f.id), 0), 2) as pct_sincronizacion,
  COUNT(DISTINCT CASE WHEN f.tipo = 'Corte' THEN f.id END) as registros_corte,
  COUNT(DISTINCT CASE WHEN f.tipo = 'Labores' THEN f.id END) as registros_labores,
  COUNT(DISTINCT CASE WHEN f.tipo = 'Aseguramiento' THEN f.id END) as registros_aseguramiento,
  MAX(f.fecha) as ultima_actividad
FROM public.areas a
LEFT JOIN public.sedes s ON a.sede = s.id_sede
LEFT JOIN public.supervisors su ON a.id_supervisor = su.id_supervisor
LEFT JOIN public.colaboradores c ON a.id_area = c.area AND c.activo = true
LEFT JOIN public.formularios f ON a.id_area = f.area_id
GROUP BY a.id_area, a.nom_area, s.nom_sede, su.nom_supervisor
ORDER BY a.nom_area;

-- Top áreas por actividad (últimos 7 días)
SELECT 
  a.id_area,
  a.nom_area,
  COUNT(*) as registros_ultimos_7_dias,
  COUNT(DISTINCT f.fecha) as dias_con_actividad,
  ROUND(100.0 * SUM(CASE WHEN f.sincronizado THEN 1 ELSE 0 END) / 
    NULLIF(COUNT(*), 0), 2) as pct_sincronizacion_reciente
FROM public.areas a
LEFT JOIN public.formularios f ON a.id_area = f.area_id 
  AND f.fecha >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY a.id_area, a.nom_area
ORDER BY registros_ultimos_7_dias DESC;

-- ============================================================================
-- 3. ESTADÍSTICAS POR SUPERVISOR
-- ============================================================================

-- Detalle por supervisor (todas las áreas + colaboradores asignados)
SELECT 
  su.id_supervisor,
  su.nom_supervisor,
  s.nom_sede,
  COUNT(DISTINCT a.id_area) as areas_a_cargo,
  COUNT(DISTINCT c.id_colaborador) as colaboradores_asignados,
  COUNT(DISTINCT f.id) as total_registros,
  SUM(CASE WHEN f.sincronizado THEN 1 ELSE 0 END) as registros_sincronizados,
  SUM(CASE WHEN NOT f.sincronizado THEN 1 ELSE 0 END) as registros_pendientes,
  ROUND(100.0 * SUM(CASE WHEN f.sincronizado THEN 1 ELSE 0 END) / 
    NULLIF(COUNT(f.id), 0), 2) as pct_sincronizacion,
  MAX(f.fecha) as ultima_actividad
FROM public.supervisors su
LEFT JOIN public.sedes s ON su.sede = s.id_sede
LEFT JOIN public.areas a ON su.id_supervisor = a.id_supervisor
LEFT JOIN public.colaboradores c ON su.id_supervisor = c.supervisor AND c.activo = true
LEFT JOIN public.formularios f ON su.id_supervisor = f.supervisor_id
WHERE su.activo = true
GROUP BY su.id_supervisor, su.nom_supervisor, s.nom_sede
ORDER BY total_registros DESC;

-- Supervisores con colaboradores sin registros (inactivos o no productivos)
SELECT 
  su.id_supervisor,
  su.nom_supervisor,
  c.id_colaborador,
  c.nom_colaborador,
  COALESCE(COUNT(f.id), 0) as registros_totales,
  MAX(f.fecha) as ultimo_registro,
  CURRENT_DATE - MAX(f.fecha) as dias_sin_actividad
FROM public.supervisors su
LEFT JOIN public.colaboradores c ON su.id_supervisor = c.supervisor 
  AND c.activo = true
LEFT JOIN public.formularios f ON c.id_colaborador = f.supervisor_id  -- Note: verify this relationship
WHERE su.activo = true
GROUP BY su.id_supervisor, su.nom_supervisor, c.id_colaborador, c.nom_colaborador
HAVING COALESCE(COUNT(f.id), 0) = 0 
  OR MAX(f.fecha) < CURRENT_DATE - INTERVAL '7 days'
ORDER BY su.nom_supervisor, c.nom_colaborador;

-- ============================================================================
-- 4. ESTADÍSTICAS POR COLABORADOR
-- ============================================================================

-- Detalle completo por colaborador con últimos registros
SELECT 
  c.id_colaborador,
  c.nom_colaborador,
  a.nom_area,
  su.nom_supervisor,
  COALESCE(COUNT(f.id), 0) as registros_totales,
  SUM(CASE WHEN f.sincronizado THEN 1 ELSE 0 END) as registros_sincronizados,
  SUM(CASE WHEN NOT f.sincronizado THEN 1 ELSE 0 END) as registros_pendientes,
  ROUND(100.0 * SUM(CASE WHEN f.sincronizado THEN 1 ELSE 0 END) / 
    NULLIF(COUNT(f.id), 0), 2) as pct_sincronizacion,
  COUNT(DISTINCT CASE WHEN f.tipo = 'Corte' THEN f.id END) as registros_corte,
  COUNT(DISTINCT CASE WHEN f.tipo = 'Labores' THEN f.id END) as registros_labores,
  COUNT(DISTINCT CASE WHEN f.tipo = 'Aseguramiento' THEN f.id END) as registros_aseguramiento,
  MAX(f.fecha) as ultimo_registro,
  CASE 
    WHEN MAX(f.fecha) IS NULL THEN 'Sin registros'
    WHEN MAX(f.fecha) = CURRENT_DATE THEN 'Hoy'
    WHEN MAX(f.fecha) >= CURRENT_DATE - INTERVAL '7 days' THEN 'Últimos 7 días'
    ELSE 'Inactivo'
  END as estado_actividad
FROM public.colaboradores c
LEFT JOIN public.areas a ON c.area = a.id_area
LEFT JOIN public.supervisors su ON c.supervisor = su.id_supervisor
LEFT JOIN public.formularios f ON c.id_colaborador = f.supervisor_id  -- Note: verify this
WHERE c.activo = true
GROUP BY c.id_colaborador, c.nom_colaborador, a.nom_area, su.nom_supervisor
ORDER BY registros_totales DESC;

-- Colaboradores con problemas (muchos pendientes o errores)
SELECT 
  c.id_colaborador,
  c.nom_colaborador,
  a.nom_area,
  su.nom_supervisor,
  SUM(CASE WHEN NOT f.sincronizado THEN 1 ELSE 0 END) as registros_pendientes,
  COUNT(DISTINCT DATE(f.fecha)) as dias_con_registros_pendientes,
  MAX(f.fecha) as fecha_registro_mas_antiguo,
  COUNT(DISTINCT CASE WHEN error_sincronizacion_permanente THEN f.id END) as registros_con_error
FROM public.colaboradores c
LEFT JOIN public.areas a ON c.area = a.id_area
LEFT JOIN public.supervisors su ON c.supervisor = su.id_supervisor
LEFT JOIN public.formularios f ON c.id_colaborador = f.supervisor_id  -- Note: verify
WHERE c.activo = true
  AND NOT f.sincronizado
GROUP BY c.id_colaborador, c.nom_colaborador, a.nom_area, su.nom_supervisor
HAVING SUM(CASE WHEN NOT f.sincronizado THEN 1 ELSE 0 END) > 0
ORDER BY registros_pendientes DESC;

-- ============================================================================
-- 5. ANÁLISIS DE TIPOS DE FORMULARIO
-- ============================================================================

-- Completitud de tipos por área (¿qué tipos no se llenan?)
SELECT 
  a.id_area,
  a.nom_area,
  'Corte' as tipo,
  COUNT(DISTINCT CASE WHEN f.tipo = 'Corte' THEN f.fecha END) as dias_completados,
  COUNT(DISTINCT CASE WHEN f.tipo = 'Corte' AND f.estado = 'completo' THEN f.id END) as completos,
  COUNT(DISTINCT CASE WHEN f.tipo = 'Corte' AND f.estado = 'borrador' THEN f.id END) as borradores
FROM public.areas a
LEFT JOIN public.formularios f ON a.id_area = f.area_id
GROUP BY a.id_area, a.nom_area, f.tipo
UNION ALL
SELECT 
  a.id_area,
  a.nom_area,
  'Labores' as tipo,
  COUNT(DISTINCT CASE WHEN f.tipo = 'Labores' THEN f.fecha END) as dias_completados,
  COUNT(DISTINCT CASE WHEN f.tipo = 'Labores' AND f.estado = 'completo' THEN f.id END) as completos,
  COUNT(DISTINCT CASE WHEN f.tipo = 'Labores' AND f.estado = 'borrador' THEN f.id END) as borradores
FROM public.areas a
LEFT JOIN public.formularios f ON a.id_area = f.area_id
GROUP BY a.id_area, a.nom_area, f.tipo
UNION ALL
SELECT 
  a.id_area,
  a.nom_area,
  'Aseguramiento' as tipo,
  COUNT(DISTINCT CASE WHEN f.tipo = 'Aseguramiento' THEN f.fecha END) as dias_completados,
  COUNT(DISTINCT CASE WHEN f.tipo = 'Aseguramiento' AND f.estado = 'completo' THEN f.id END) as completos,
  COUNT(DISTINCT CASE WHEN f.tipo = 'Aseguramiento' AND f.estado = 'borrador' THEN f.id END) as borradores
FROM public.areas a
LEFT JOIN public.formularios f ON a.id_area = f.area_id
GROUP BY a.id_area, a.nom_area, f.tipo
ORDER BY nom_area, tipo;

-- ============================================================================
-- 6. TIME-SERIES DATA (Para gráficos)
-- ============================================================================

-- Registros por día (últimos 30 días)
SELECT 
  f.fecha,
  COUNT(*) as total_registros,
  COUNT(DISTINCT f.area_id) as areas_activas,
  COUNT(DISTINCT f.supervisor_id) as supervisores_activos,
  COUNT(DISTINCT CASE WHEN f.tipo = 'Corte' THEN f.id END) as tipo_corte,
  COUNT(DISTINCT CASE WHEN f.tipo = 'Labores' THEN f.id END) as tipo_labores,
  COUNT(DISTINCT CASE WHEN f.tipo = 'Aseguramiento' THEN f.id END) as tipo_aseguramiento,
  SUM(CASE WHEN f.sincronizado THEN 1 ELSE 0 END) as sincronizados_hoy
FROM public.formularios f
WHERE f.fecha >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY f.fecha
ORDER BY f.fecha DESC;

-- Tendencia de sincronización (últimos 7 días)
SELECT 
  f.fecha,
  COUNT(*) as registros_del_dia,
  ROUND(100.0 * SUM(CASE WHEN f.sincronizado THEN 1 ELSE 0 END) / 
    NULLIF(COUNT(*), 0), 2) as pct_sincronizado,
  SUM(CASE WHEN f.sincronizado THEN 1 ELSE 0 END) as sincronizados
FROM public.formularios f
WHERE f.fecha >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY f.fecha
ORDER BY f.fecha DESC;

-- ============================================================================
-- 7. ALERTAS Y ANOMALÍAS
-- ============================================================================

-- Áreas sin actividad en los últimos 3 días
SELECT 
  a.id_area,
  a.nom_area,
  su.nom_supervisor,
  MAX(f.fecha) as ultima_actividad,
  CURRENT_DATE - MAX(f.fecha) as dias_inactivo
FROM public.areas a
LEFT JOIN public.supervisors su ON a.id_supervisor = su.id_supervisor
LEFT JOIN public.formularios f ON a.id_area = f.area_id
WHERE a.activo = true
GROUP BY a.id_area, a.nom_area, su.nom_supervisor
HAVING MAX(f.fecha) < CURRENT_DATE - INTERVAL '3 days'
  OR MAX(f.fecha) IS NULL
ORDER BY ultima_actividad NULLS FIRST;

-- Supervisores con más de 5 registros pendientes
SELECT 
  su.id_supervisor,
  su.nom_supervisor,
  COUNT(DISTINCT f.id) as registros_pendientes,
  COUNT(DISTINCT f.area_id) as areas_afectadas,
  MIN(f.fecha) as registro_mas_antiguo,
  CURRENT_DATE - MIN(f.fecha) as dias_sin_sincronizar
FROM public.supervisors su
LEFT JOIN public.formularios f ON su.id_supervisor = f.supervisor_id 
  AND f.sincronizado = false
WHERE su.activo = true
GROUP BY su.id_supervisor, su.nom_supervisor
HAVING COUNT(DISTINCT f.id) > 5
ORDER BY registros_pendientes DESC;

-- Formularios con errores persistentes
SELECT 
  f.id,
  f.fecha,
  a.nom_area,
  su.nom_supervisor,
  f.tipo,
  f.intentos_sincronizacion,
  f.last_error,
  DATE_TRUNC('hour', f.fecha) as primer_intento
FROM public.formularios f
LEFT JOIN public.areas a ON f.area_id = a.id_area
LEFT JOIN public.supervisors su ON f.supervisor_id = su.id_supervisor
WHERE f.error_sincronizacion_permanente = true
  OR f.intentos_sincronizacion > 3
ORDER BY f.fecha DESC
LIMIT 50;
