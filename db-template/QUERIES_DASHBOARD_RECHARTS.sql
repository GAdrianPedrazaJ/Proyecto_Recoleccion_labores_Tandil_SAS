-- ============================================================================
-- QUERIES OPTIMIZADAS PARA DASHBOARD CON RECHARTS
-- ============================================================================
-- Ejemplos de consultas para extraer datos listos para visualización
-- Estas queries están diseñadas para llenar gráficas en Recharts
--
-- Documentación: https://recharts.org/
-- ============================================================================

-- ============================================================================
-- 1. DASHBOARD: Resumen general de rendimiento por tipo de registro
-- ============================================================================
-- Útil para: Cards de KPI, gráficas de comparación

SELECT 
    'Corte' as tipoRegistro,
    COUNT(DISTINCT formularioId) as cantidadFormularios,
    COUNT(*) as cantidadColaboradores,
    ISNULL(AVG(rendimientoCorteReal), 0) as rendimientoPromedio,
    ISNULL(AVG(tiempoRealHoras), 0) as tiempoPromedioHoras,
    MAX(tallosReales) as tallosMaximo
FROM FormularioRowsCorte
WHERE fechaCreacion >= DATEADD(DAY, -30, GETDATE())

UNION ALL

SELECT 
    'Labores' as tipoRegistro,
    COUNT(DISTINCT formularioId),
    COUNT(*),
    ISNULL(AVG(rendimientoPromedio), 0),
    ISNULL(AVG(tiempoTotalLaboresReal) / 60.0, 0),  -- convertir minutos a horas
    0
FROM FormularioRowsLabores
WHERE fechaCreacion >= DATEADD(DAY, -30, GETDATE())

UNION ALL

SELECT 
    'Aseguramiento' as tipoRegistro,
    COUNT(DISTINCT formularioId),
    COUNT(*),
    ISNULL(AVG(cumplimientoCalidad), 0),
    0,
    0
FROM FormularioRowsAseguramiento
WHERE fechaCreacion >= DATEADD(DAY, -30, GETDATE());

-- ============================================================================
-- 2. GRÁFICA: Tendencia de rendimiento por semana (LineChart)
-- ============================================================================
-- Útil para: Visualizar evolución temporal con recharts.LineChart

SELECT 
    DATEPART(YEAR, c.fechaCreacion) as year,
    DATEPART(WEEK, c.fechaCreacion) as semana,
    DATEFROMPARTS(
        DATEPART(YEAR, c.fechaCreacion),
        DATEPART(MONTH, c.fechaCreacion),
        DATEPART(DAY, c.fechaCreacion) - DATEPART(WEEKDAY, c.fechaCreacion) + 1
    ) as fecha,
    AVG(c.rendimientoCorteReal) as rendimientoCorte,
    AVG(l.rendimientoPromedio) as rendimientoLabores,
    AVG(a.cumplimientoCalidad) as aseguramiento
FROM FormularioRowsCorte c
FULL OUTER JOIN FormularioRowsLabores l 
    ON c.formularioId = l.formularioId AND c.numeroColaborador = l.numeroColaborador
FULL OUTER JOIN FormularioRowsAseguramiento a 
    ON c.formularioId = a.formularioId AND c.numeroColaborador = a.numeroColaborador
WHERE c.fechaCreacion >= DATEADD(DAY, -90, GETDATE())
   OR l.fechaCreacion >= DATEADD(DAY, -90, GETDATE())
   OR a.fechaCreacion >= DATEADD(DAY, -90, GETDATE())
GROUP BY DATEPART(YEAR, c.fechaCreacion), DATEPART(WEEK, c.fechaCreacion),
         DATEFROMPARTS(
             DATEPART(YEAR, c.fechaCreacion),
             DATEPART(MONTH, c.fechaCreacion),
             DATEPART(DAY, c.fechaCreacion) - DATEPART(WEEKDAY, c.fechaCreacion) + 1
         )
ORDER BY year, semana;

-- ============================================================================
-- 3. GRÁFICA: Rendimiento por bloque (BarChart)
-- ============================================================================
-- Útil para: Comparar bloques con recharts.BarChart

SELECT 
    c.bloqueId,
    COUNT(DISTINCT c.formularioId) as formularios,
    COUNT(*) as registros,
    ISNULL(AVG(c.rendimientoCorteReal), 0) as rendimientoCorte,
    ISNULL(AVG(l.rendimientoPromedio), 0) as rendimientoLabores,
    ISNULL(AVG(c.tallosReales), 0) as tallosProm
FROM FormularioRowsCorte c
LEFT JOIN FormularioRowsLabores l 
    ON c.formularioId = l.formularioId AND c.numeroColaborador = l.numeroColaborador
WHERE c.fechaCreacion >= DATEADD(DAY, -30, GETDATE())
GROUP BY c.bloqueId
ORDER BY rendimientoCorte DESC;

-- ============================================================================
-- 4. GRÁFICA: Distribución de calidad (PieChart)
-- ============================================================================
-- Útil para: Recharts.PieChart - mostrar % de cumplimiento

SELECT 
    CASE 
        WHEN cumplimientoCalidad >= 80 THEN 'Excelente (80+%)'
        WHEN cumplimientoCalidad >= 60 THEN 'Bueno (60-79%)'
        WHEN cumplimientoCalidad >= 40 THEN 'Regular (40-59%)'
        ELSE 'Bajo (<40%)'
    END as nivelCalidad,
    COUNT(*) as cantidad,
    ISNULL(AVG(cumplimientoCalidad), 0) as promedio
FROM FormularioRowsAseguramiento
WHERE fechaCreacion >= DATEADD(DAY, -30, GETDATE())
GROUP BY 
    CASE 
        WHEN cumplimientoCalidad >= 80 THEN 'Excelente (80+%)'
        WHEN cumplimientoCalidad >= 60 THEN 'Bueno (60-79%)'
        WHEN cumplimientoCalidad >= 40 THEN 'Regular (40-59%)'
        ELSE 'Bajo (<40%)'
    END
ORDER BY promedio DESC;

-- ============================================================================
-- 5. GRÁFICA: Labores por colaborador (ScatterChart o BarChart)
-- ============================================================================
-- Útil para: Identificar colaboradores más activos

SELECT TOP 10
    nombreColaborador,
    SUM(cantidadLaboresRegistradas) as totalLabores,
    AVG(rendimientoPromedio) as rendimientoPromedio,
    COUNT(DISTINCT formularioId) as registros
FROM FormularioRowsLabores
WHERE fechaCreacion >= DATEADD(DAY, -30, GETDATE())
GROUP BY nombreColaborador
ORDER BY totalLabores DESC;

-- ============================================================================
-- 6. GRÁFICA: Cumplimiento de proceso y seguridad (Radar o PieChart)
-- ============================================================================
-- Útil para: Recharts.RadarChart - análisis de cumplimiento

SELECT 
    CASE 
        WHEN procesoSeguridad = 'A' THEN 'Uso de EPP´s'
        WHEN procesoSeguridad = 'B' THEN 'Herramientas'
        WHEN procesoSeguridad = 'C' THEN 'Etiquetas'
        WHEN procesoSeguridad = 'D' THEN 'Cama Redonda'
        WHEN procesoSeguridad = 'E' THEN 'Orden y Aseo'
        ELSE 'No Aplica'
    END as criterio,
    COUNT(*) as registros,
    CAST(COUNT(*) AS FLOAT) / (SELECT COUNT(*) FROM FormularioRowsAseguramiento 
                                WHERE fechaCreacion >= DATEADD(DAY, -30, GETDATE())) * 100 as porcentaje
FROM FormularioRowsAseguramiento
WHERE fechaCreacion >= DATEADD(DAY, -30, GETDATE())
GROUP BY procesoSeguridad;

-- ============================================================================
-- 7. ANÁLISIS: Correlación entre horas de corte y calidad
-- ============================================================================
-- Útil para: ScatterChart - ver si hay relación

SELECT 
    c.rendimientoCorteReal as x_RendimientoCorte,
    a.cumplimientoCalidad as y_Calidad,
    c.nombreColaborador,
    COUNT(*) as registros
FROM FormularioRowsCorte c
INNER JOIN FormularioRowsAseguramiento a 
    ON c.formularioId = a.formularioId AND c.numeroColaborador = a.numeroColaborador
WHERE c.fechaCreacion >= DATEADD(DAY, -30, GETDATE())
GROUP BY c.rendimientoCorteReal, a.cumplimientoCalidad, c.nombreColaborador
ORDER BY x_RendimientoCorte;

-- ============================================================================
-- 8. TABLA: Detalle de labores por fila (para admin)
-- ============================================================================

SELECT 
    l.id,
    l.filaLaboresId,
    l.laborId,
    l.laborNombre,
    l.camasEstimadas,
    l.camasReales,
    l.tiempoCamaEstimado,
    l.rendimientoPorcentaje,
    f.nombreColaborador,
    f.formularioId
FROM LaboresTotalPorFila l
INNER JOIN FormularioRowsLabores f ON l.filaLaboresId = f.id
WHERE f.fechaCreacion >= DATEADD(DAY, -30, GETDATE())
ORDER BY f.formularioId, f.numeroColaborador, l.laborId;

-- ============================================================================
-- 9. EXPORTACIÓN: Vista consolidada para reportes
-- ============================================================================
-- Combina datos de las 3 tablas para reportes PDF/Excel

SELECT 
    ISNULL(c.formularioId, ISNULL(l.formularioId, a.formularioId)) as formularioId,
    ISNULL(c.numeroColaborador, ISNULL(l.numeroColaborador, a.numeroColaborador)) as numeroColaborador,
    ISNULL(c.nombreColaborador, ISNULL(l.nombreColaborador, a.nombreColaborador)) as nombreColaborador,
    ISNULL(c.bloqueId, ISNULL(l.bloqueId, a.bloqueId)) as bloqueId,
    
    -- Datos de Corte
    c.tallosReales,
    c.rendimientoCorteReal,
    c.tiempoRealHoras,
    
    -- Datos de Labores
    l.cantidadLaboresRegistradas,
    l.rendimientoPromedio as rendimientoLaborPromedio,
    l.camasTotalReales,
    
    -- Datos de Aseguramiento
    a.cumplimientoCalidad,
    a.procesoSeguridad,
    a.desglossePiPc,
    a.observaciones,
    
    ISNULL(c.fechaCreacion, ISNULL(l.fechaCreacion, a.fechaCreacion)) as fecha
FROM FormularioRowsCorte c
FULL OUTER JOIN FormularioRowsLabores l 
    ON c.formularioId = l.formularioId AND c.numeroColaborador = l.numeroColaborador
FULL OUTER JOIN FormularioRowsAseguramiento a 
    ON c.formularioId = a.formularioId AND c.numeroColaborador = a.numeroColaborador
WHERE ISNULL(c.fechaCreacion, ISNULL(l.fechaCreacion, a.fechaCreacion)) >= DATEADD(DAY, -30, GETDATE())
ORDER BY formularioId, numeroColaborador;

-- ============================================================================
-- 10. MÉTRICA: KPI - Productividad general
-- ============================================================================

SELECT 
    COUNT(DISTINCT c.formularioId) as formularios_activos,
    COUNT(DISTINCT c.numeroColaborador) as colaboradores_unicos,
    AVG(c.rendimientoCorteReal) as rendimiento_corte_promedio,
    AVG(l.rendimientoPromedio) as rendimiento_labores_promedio,
    AVG(a.cumplimientoCalidad) as cumplimiento_calidad_promedio,
    SUM(c.tallosReales) as tallos_totales_cortados,
    AVG(c.tiempoEstimadoMinutos) as tiempo_estimado_promedio_min,
    AVG(c.tiempoRealMinutos) as tiempo_real_promedio_min
FROM FormularioRowsCorte c
FULL OUTER JOIN FormularioRowsLabores l 
    ON c.formularioId = l.formularioId
FULL OUTER JOIN FormularioRowsAseguramiento a 
    ON c.formularioId = a.formularioId
WHERE YEAR(ISNULL(c.fechaCreacion, ISNULL(l.fechaCreacion, a.fechaCreacion))) = YEAR(GETDATE())
  AND MONTH(ISNULL(c.fechaCreacion, ISNULL(l.fechaCreacion, a.fechaCreacion))) = MONTH(GETDATE());
