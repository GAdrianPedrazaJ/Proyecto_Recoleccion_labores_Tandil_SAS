-- ============================================================================
-- NORMALIZACIÓN COMPLETA: División de formulario_rows en tablas especializadas
-- Base de datos: PostgreSQL (Supabase)
-- Fecha: 2026-04-11
-- ============================================================================
-- Descripción: 
--   Separar formulario_rows en tablas especializadas por tipo de formulario
--   manteniendo relaciones entre ellas para análisis y estadísticas.
--
-- Tablas nuevas:
--   1. formulario_rows_corte       (datos de corte)
--   2. formulario_rows_labores     (datos de labores - tabla padre)
--   3. labores_detalle             (hijos de formulario_rows_labores)
--   4. formulario_rows_aseguramiento (datos de aseguramiento/cierre)
--   5. formulario_row_metadata     (rastreador de completitud)
--
-- Relación: Todas comparten formulario_id + id_colaborador como PK compuesta
-- ============================================================================

-- ============================================================================
-- PASO 0: Respaldar y eliminar tabla antigua
-- ============================================================================
-- Crear respaldo de datos originales
CREATE TABLE public.formulario_rows_backup AS 
SELECT * FROM public.formulario_rows;

-- Eliminar tabla antigua (CASCADE elimina constraints dependientes)
DROP TABLE IF EXISTS public.formulario_rows CASCADE;

-- ============================================================================
-- TABLA 1: formulario_rows_corte (datos de corte)
-- ============================================================================
CREATE TABLE public.formulario_rows_corte (
    id text PRIMARY KEY,
    formulario_id uuid NOT NULL REFERENCES public.formularios(id),
    id_colaborador text NOT NULL REFERENCES public.colaboradores(id_colaborador),
    nombre_colaborador text NOT NULL,
    externo boolean DEFAULT false,
    id_area text REFERENCES public.areas(id_area),
    id_supervisor text REFERENCES public.supervisors(id_supervisor),
    id_bloque text REFERENCES public.bloques(id_bloque),
    id_variedad text REFERENCES public.variedades(id_variedad),
    
    -- Campos de corte
    tiempo_estimado_minutos numeric,
    tiempo_estimado_horas numeric GENERATED ALWAYS AS (
        CASE WHEN tiempo_estimado_minutos IS NOT NULL 
        THEN ROUND(tiempo_estimado_minutos::numeric / 60, 2) 
        ELSE NULL END
    ) STORED,
    tiempo_real_minutos numeric,
    tiempo_real_horas numeric GENERATED ALWAYS AS (
        CASE WHEN tiempo_real_minutos IS NOT NULL 
        THEN ROUND(tiempo_real_minutos::numeric / 60, 2) 
        ELSE NULL END
    ) STORED,
    total_tallos_corte_estimado numeric,
    total_tallos_corte_real numeric,
    hora_inicio_corte time without time zone,
    hora_fin_corte_estimado time without time zone,
    hora_real_fin_corte time without time zone,
    hora_cama numeric,
    rendimiento_corte_estimado numeric,
    rendimiento_corte_real numeric,
    
    fecha_creacion timestamp with time zone DEFAULT now(),
    fecha_actualizacion timestamp with time zone,
    
    UNIQUE(formulario_id, id_colaborador)
);

CREATE INDEX idx_formulario_rows_corte_formulario_id 
    ON public.formulario_rows_corte(formulario_id);
CREATE INDEX idx_formulario_rows_corte_id_bloque 
    ON public.formulario_rows_corte(id_bloque);
CREATE INDEX idx_formulario_rows_corte_id_variedad 
    ON public.formulario_rows_corte(id_variedad);

-- ============================================================================
-- TABLA 2: formulario_rows_labores (datos de labores - tabla padre)
-- ============================================================================
CREATE TABLE public.formulario_rows_labores (
    id text PRIMARY KEY,
    formulario_id uuid NOT NULL REFERENCES public.formularios(id),
    id_colaborador text NOT NULL REFERENCES public.colaboradores(id_colaborador),
    nombre_colaborador text NOT NULL,
    externo boolean DEFAULT false,
    id_area text REFERENCES public.areas(id_area),
    id_supervisor text REFERENCES public.supervisors(id_supervisor),
    id_bloque text REFERENCES public.bloques(id_bloque),
    id_variedad text REFERENCES public.variedades(id_variedad),
    
    -- Agregaciones (se calculan desde labores_detalle)
    cantidad_labores_registradas integer DEFAULT 0,
    rendimiento_promedio numeric,
    tiempo_total_labores_estimado numeric,
    tiempo_total_labores_real numeric,
    camas_total_estimadas numeric,
    camas_total_reales numeric,
    
    fecha_creacion timestamp with time zone DEFAULT now(),
    fecha_actualizacion timestamp with time zone,
    
    UNIQUE(formulario_id, id_colaborador)
);

CREATE INDEX idx_formulario_rows_labores_formulario_id 
    ON public.formulario_rows_labores(formulario_id);

-- ============================================================================
-- TABLA 3: labores_detalle (hijos de formulario_rows_labores)
-- ============================================================================
CREATE TABLE public.labores_detalle (
    id text PRIMARY KEY,
    fila_labores_id text NOT NULL REFERENCES public.formulario_rows_labores(id) ON DELETE CASCADE,
    id_labor text REFERENCES public.labores(id_labor),
    nom_labor text,
    
    camas_estimado numeric,
    tiempo_cama_estimado numeric,
    rendimiento_horas_estimado numeric GENERATED ALWAYS AS (
        CASE WHEN camas_estimado IS NOT NULL AND tiempo_cama_estimado IS NOT NULL
        THEN ROUND((camas_estimado * tiempo_cama_estimado::numeric) / 60, 2)
        ELSE NULL END
    ) STORED,
    
    camas_real numeric,
    tiempo_cama_real numeric,
    rendimiento_horas_real numeric GENERATED ALWAYS AS (
        CASE WHEN camas_real IS NOT NULL AND tiempo_cama_real IS NOT NULL
        THEN ROUND((camas_real * tiempo_cama_real::numeric) / 60, 2)
        ELSE NULL END
    ) STORED,
    
    rendimiento_pct numeric GENERATED ALWAYS AS (
        CASE WHEN camas_estimado IS NOT NULL AND camas_estimado > 0
        THEN ROUND((camas_real / camas_estimado) * 100, 2)
        ELSE NULL END
    ) STORED,
    
    fecha_creacion timestamp with time zone DEFAULT now(),
    numero_labor integer NOT NULL
);

CREATE INDEX idx_labores_detalle_fila_labores_id 
    ON public.labores_detalle(fila_labores_id);

-- ============================================================================
-- TABLA 4: formulario_rows_aseguramiento (cierre/aseguramiento)
-- ============================================================================
CREATE TABLE public.formulario_rows_aseguramiento (
    id text PRIMARY KEY,
    formulario_id uuid NOT NULL REFERENCES public.formularios(id),
    id_colaborador text NOT NULL REFERENCES public.colaboradores(id_colaborador),
    nombre_colaborador text NOT NULL,
    externo boolean DEFAULT false,
    id_area text REFERENCES public.areas(id_area),
    id_supervisor text REFERENCES public.supervisors(id_supervisor),
    id_bloque text REFERENCES public.bloques(id_bloque),
    id_variedad text REFERENCES public.variedades(id_variedad),
    
    -- Aseguramiento
    desglose_pipe boolean DEFAULT false,
    proceso_seguridad text,
    calidad_cuadro_1 boolean DEFAULT false,
    calidad_cuadro_2 boolean DEFAULT false,
    calidad_cuadro_3 boolean DEFAULT false,
    calidad_cuadro_4 boolean DEFAULT false,
    calidad_cuadro_5 boolean DEFAULT false,
    
    pct_cumplimiento numeric GENERATED ALWAYS AS (
        ROUND(
            (
                (CASE WHEN calidad_cuadro_1 THEN 1 ELSE 0 END +
                 CASE WHEN calidad_cuadro_2 THEN 1 ELSE 0 END +
                 CASE WHEN calidad_cuadro_3 THEN 1 ELSE 0 END +
                 CASE WHEN calidad_cuadro_4 THEN 1 ELSE 0 END +
                 CASE WHEN calidad_cuadro_5 THEN 1 ELSE 0 END)::numeric / 5
            ) * 100, 2
        )
    ) STORED,
    
    pct_prom_rendimiento numeric,
    rendimiento_corte_real numeric,
    observaciones text,
    
    fecha_creacion timestamp with time zone DEFAULT now(),
    fecha_actualizacion timestamp with time zone,
    
    UNIQUE(formulario_id, id_colaborador)
);

CREATE INDEX idx_formulario_rows_aseguramiento_formulario_id 
    ON public.formulario_rows_aseguramiento(formulario_id);

-- ============================================================================
-- TABLA 5: formulario_row_metadata (rastreador de completitud)
-- ============================================================================
CREATE TABLE public.formulario_row_metadata (
    id text PRIMARY KEY,
    formulario_id uuid NOT NULL REFERENCES public.formularios(id),
    id_colaborador text NOT NULL,
    
    se_completo_corte boolean DEFAULT false,
    se_completo_labores boolean DEFAULT false,
    se_completo_aseguramiento boolean DEFAULT false,
    
    fila_corte_id text REFERENCES public.formulario_rows_corte(id) ON DELETE SET NULL,
    fila_labores_id text REFERENCES public.formulario_rows_labores(id) ON DELETE SET NULL,
    fila_aseguramiento_id text REFERENCES public.formulario_rows_aseguramiento(id) ON DELETE SET NULL,
    
    fecha_creacion timestamp with time zone DEFAULT now(),
    fecha_actualizacion timestamp with time zone,
    
    UNIQUE(formulario_id, id_colaborador)
);

CREATE INDEX idx_formulario_row_metadata_formulario_id 
    ON public.formulario_row_metadata(formulario_id);

-- ============================================================================
-- VISTAS PARA COMPATIBILIDAD CON CÓDIGO HEREDADO
-- ============================================================================

CREATE VIEW public.formulario_rows AS
SELECT 
    COALESCE(c.id, l.id, a.id) as id,
    COALESCE(c.formulario_id, l.formulario_id, a.formulario_id) as formulario_id,
    COALESCE(c.id_colaborador, l.id_colaborador, a.id_colaborador) as id_colaborador,
    COALESCE(c.nombre_colaborador, l.nombre_colaborador, a.nombre_colaborador) as nombre_colaborador,
    COALESCE(c.externo, l.externo, a.externo) as externo,
    COALESCE(c.id_area, l.id_area, a.id_area) as id_area,
    COALESCE(c.id_supervisor, l.id_supervisor, a.id_supervisor) as id_supervisor,
    COALESCE(c.id_bloque, l.id_bloque, a.id_bloque) as id_bloque,
    COALESCE(c.id_variedad, l.id_variedad, a.id_variedad) as id_variedad,
    
    c.tiempo_estimado_horas,
    c.tiempo_estimado_minutos,
    c.tiempo_real_horas,
    c.tiempo_real_minutos,
    c.total_tallos_corte_estimado,
    c.total_tallos_corte_real,
    c.hora_inicio_corte,
    c.hora_fin_corte_estimado,
    c.hora_real_fin_corte,
    c.hora_cama,
    c.rendimiento_corte_estimado,
    c.rendimiento_corte_real,
    
    (SELECT id_labor FROM public.labores_detalle WHERE fila_labores_id = l.id AND numero_labor = 1 LIMIT 1) as labor_1,
    (SELECT camas_estimado FROM public.labores_detalle WHERE fila_labores_id = l.id AND numero_labor = 1 LIMIT 1) as labor_1_camas_estimado,
    (SELECT camas_real FROM public.labores_detalle WHERE fila_labores_id = l.id AND numero_labor = 1 LIMIT 1) as labor_1_camas_real,
    (SELECT tiempo_cama_estimado FROM public.labores_detalle WHERE fila_labores_id = l.id AND numero_labor = 1 LIMIT 1) as labor_1_tiempo_cama_estimado,
    (SELECT tiempo_cama_real FROM public.labores_detalle WHERE fila_labores_id = l.id AND numero_labor = 1 LIMIT 1) as labor_1_tiempo_cama_real,
    (SELECT rendimiento_horas_estimado FROM public.labores_detalle WHERE fila_labores_id = l.id AND numero_labor = 1 LIMIT 1) as labor_1_rendimiento_horas_estimado,
    (SELECT rendimiento_horas_real FROM public.labores_detalle WHERE fila_labores_id = l.id AND numero_labor = 1 LIMIT 1) as labor_1_rendimiento_horas_real,
    (SELECT rendimiento_pct FROM public.labores_detalle WHERE fila_labores_id = l.id AND numero_labor = 1 LIMIT 1) as labor_1_rendimiento_pct,
    
    (SELECT id_labor FROM public.labores_detalle WHERE fila_labores_id = l.id AND numero_labor = 2 LIMIT 1) as labor_2,
    (SELECT camas_estimado FROM public.labores_detalle WHERE fila_labores_id = l.id AND numero_labor = 2 LIMIT 1) as labor_2_camas_estimado,
    (SELECT camas_real FROM public.labores_detalle WHERE fila_labores_id = l.id AND numero_labor = 2 LIMIT 1) as labor_2_camas_real,
    (SELECT tiempo_cama_estimado FROM public.labores_detalle WHERE fila_labores_id = l.id AND numero_labor = 2 LIMIT 1) as labor_2_tiempo_cama_estimado,
    (SELECT tiempo_cama_real FROM public.labores_detalle WHERE fila_labores_id = l.id AND numero_labor = 2 LIMIT 1) as labor_2_tiempo_cama_real,
    (SELECT rendimiento_horas_estimado FROM public.labores_detalle WHERE fila_labores_id = l.id AND numero_labor = 2 LIMIT 1) as labor_2_rendimiento_horas_estimado,
    (SELECT rendimiento_horas_real FROM public.labores_detalle WHERE fila_labores_id = l.id AND numero_labor = 2 LIMIT 1) as labor_2_rendimiento_horas_real,
    (SELECT rendimiento_pct FROM public.labores_detalle WHERE fila_labores_id = l.id AND numero_labor = 2 LIMIT 1) as labor_2_rendimiento_pct,
    
    (SELECT id_labor FROM public.labores_detalle WHERE fila_labores_id = l.id AND numero_labor = 3 LIMIT 1) as labor_3,
    (SELECT camas_estimado FROM public.labores_detalle WHERE fila_labores_id = l.id AND numero_labor = 3 LIMIT 1) as labor_3_camas_estimado,
    (SELECT camas_real FROM public.labores_detalle WHERE fila_labores_id = l.id AND numero_labor = 3 LIMIT 1) as labor_3_camas_real,
    (SELECT tiempo_cama_estimado FROM public.labores_detalle WHERE fila_labores_id = l.id AND numero_labor = 3 LIMIT 1) as labor_3_tiempo_cama_estimado,
    (SELECT tiempo_cama_real FROM public.labores_detalle WHERE fila_labores_id = l.id AND numero_labor = 3 LIMIT 1) as labor_3_tiempo_cama_real,
    (SELECT rendimiento_horas_estimado FROM public.labores_detalle WHERE fila_labores_id = l.id AND numero_labor = 3 LIMIT 1) as labor_3_rendimiento_horas_estimado,
    (SELECT rendimiento_horas_real FROM public.labores_detalle WHERE fila_labores_id = l.id AND numero_labor = 3 LIMIT 1) as labor_3_rendimiento_horas_real,
    (SELECT rendimiento_pct FROM public.labores_detalle WHERE fila_labores_id = l.id AND numero_labor = 3 LIMIT 1) as labor_3_rendimiento_pct,
    
    (SELECT id_labor FROM public.labores_detalle WHERE fila_labores_id = l.id AND numero_labor = 4 LIMIT 1) as labor_4,
    (SELECT camas_estimado FROM public.labores_detalle WHERE fila_labores_id = l.id AND numero_labor = 4 LIMIT 1) as labor_4_camas_estimado,
    (SELECT camas_real FROM public.labores_detalle WHERE fila_labores_id = l.id AND numero_labor = 4 LIMIT 1) as labor_4_camas_real,
    (SELECT tiempo_cama_estimado FROM public.labores_detalle WHERE fila_labores_id = l.id AND numero_labor = 4 LIMIT 1) as labor_4_tiempo_cama_estimado,
    (SELECT tiempo_cama_real FROM public.labores_detalle WHERE fila_labores_id = l.id AND numero_labor = 4 LIMIT 1) as labor_4_tiempo_cama_real,
    (SELECT rendimiento_horas_estimado FROM public.labores_detalle WHERE fila_labores_id = l.id AND numero_labor = 4 LIMIT 1) as labor_4_rendimiento_horas_estimado,
    (SELECT rendimiento_horas_real FROM public.labores_detalle WHERE fila_labores_id = l.id AND numero_labor = 4 LIMIT 1) as labor_4_rendimiento_horas_real,
    (SELECT rendimiento_pct FROM public.labores_detalle WHERE fila_labores_id = l.id AND numero_labor = 4 LIMIT 1) as labor_4_rendimiento_pct,
    
    (SELECT id_labor FROM public.labores_detalle WHERE fila_labores_id = l.id AND numero_labor = 5 LIMIT 1) as labor_5,
    (SELECT camas_estimado FROM public.labores_detalle WHERE fila_labores_id = l.id AND numero_labor = 5 LIMIT 1) as labor_5_camas_estimado,
    (SELECT camas_real FROM public.labores_detalle WHERE fila_labores_id = l.id AND numero_labor = 5 LIMIT 1) as labor_5_camas_real,
    (SELECT tiempo_cama_estimado FROM public.labores_detalle WHERE fila_labores_id = l.id AND numero_labor = 5 LIMIT 1) as labor_5_tiempo_cama_estimado,
    (SELECT tiempo_cama_real FROM public.labores_detalle WHERE fila_labores_id = l.id AND numero_labor = 5 LIMIT 1) as labor_5_tiempo_cama_real,
    (SELECT rendimiento_horas_estimado FROM public.labores_detalle WHERE fila_labores_id = l.id AND numero_labor = 5 LIMIT 1) as labor_5_rendimiento_horas_estimado,
    (SELECT rendimiento_horas_real FROM public.labores_detalle WHERE fila_labores_id = l.id AND numero_labor = 5 LIMIT 1) as labor_5_rendimiento_horas_real,
    (SELECT rendimiento_pct FROM public.labores_detalle WHERE fila_labores_id = l.id AND numero_labor = 5 LIMIT 1) as labor_5_rendimiento_pct,
    
    a.desglose_pipe,
    a.proceso_seguridad,
    a.calidad_cuadro_1,
    a.calidad_cuadro_2,
    a.calidad_cuadro_3,
    a.calidad_cuadro_4,
    a.calidad_cuadro_5,
    a.pct_cumplimiento,
    a.pct_prom_rendimiento,
    a.observaciones
FROM 
    public.formulario_rows_corte c
    FULL OUTER JOIN public.formulario_rows_labores l 
        ON c.formulario_id = l.formulario_id AND c.id_colaborador = l.id_colaborador
    FULL OUTER JOIN public.formulario_rows_aseguramiento a 
        ON c.formulario_id = a.formulario_id AND c.id_colaborador = a.id_colaborador;

-- ============================================================================
-- MIGRACIÓN DE DATOS (OPCIONAL - DESCOMENTAR SI TIENES DATOS EN BACKUP)
-- ============================================================================

/*
-- PASO 1: Migrar a formulario_rows_corte
INSERT INTO public.formulario_rows_corte (
    id, formulario_id, id_colaborador, nombre_colaborador, externo,
    id_area, id_supervisor, id_bloque, id_variedad,
    tiempo_estimado_minutos, tiempo_real_minutos,
    total_tallos_corte_estimado, total_tallos_corte_real,
    hora_inicio_corte, hora_fin_corte_estimado, hora_real_fin_corte,
    hora_cama, rendimiento_corte_estimado, rendimiento_corte_real
)
SELECT 
    gen_random_uuid()::text, formulario_id, id_colaborador, nombre_colaborador, externo,
    id_area, id_supervisor, id_bloque, id_variedad,
    tiempo_estimado_minutos, tiempo_real_minutos,
    total_tallos_corte_estimado, total_tallos_corte_real,
    hora_inicio_corte, hora_fin_corte_estimado, hora_real_fin_corte,
    hora_cama, rendimiento_corte_estimado, rendimiento_corte_real
FROM public.formulario_rows_backup
WHERE formulario_id IS NOT NULL;

-- PASO 2: Migrar a formulario_rows_labores
INSERT INTO public.formulario_rows_labores (
    id, formulario_id, id_colaborador, nombre_colaborador, externo,
    id_area, id_supervisor, id_bloque, id_variedad
)
SELECT DISTINCT
    gen_random_uuid()::text, formulario_id, id_colaborador, nombre_colaborador, externo,
    id_area, id_supervisor, id_bloque, id_variedad
FROM public.formulario_rows_backup
WHERE formulario_id IS NOT NULL;

-- PASO 3: Migrar labores detalle - labor_1
INSERT INTO public.labores_detalle (
    id, fila_labores_id, id_labor, nom_labor, camas_estimado, tiempo_cama_estimado,
    camas_real, tiempo_cama_real, numero_labor
)
SELECT 
    gen_random_uuid()::text,
    l.id,
    b.labor_1,
    (SELECT nom_labor FROM public.labores WHERE id_labor = b.labor_1),
    b.labor_1_camas_estimado,
    b.labor_1_tiempo_cama_estimado,
    b.labor_1_camas_real,
    b.labor_1_tiempo_cama_real,
    1
FROM public.formulario_rows_backup b
JOIN public.formulario_rows_labores l 
    ON b.formulario_id = l.formulario_id AND b.id_colaborador = l.id_colaborador
WHERE b.labor_1 IS NOT NULL;

-- PASO 4: Migrar labores detalle - labor_2
INSERT INTO public.labores_detalle (
    id, fila_labores_id, id_labor, nom_labor, camas_estimado, tiempo_cama_estimado,
    camas_real, tiempo_cama_real, numero_labor
)
SELECT 
    gen_random_uuid()::text,
    l.id,
    b.labor_2,
    (SELECT nom_labor FROM public.labores WHERE id_labor = b.labor_2),
    b.labor_2_camas_estimado,
    b.labor_2_tiempo_cama_estimado,
    b.labor_2_camas_real,
    b.labor_2_tiempo_cama_real,
    2
FROM public.formulario_rows_backup b
JOIN public.formulario_rows_labores l 
    ON b.formulario_id = l.formulario_id AND b.id_colaborador = l.id_colaborador
WHERE b.labor_2 IS NOT NULL;

-- PASO 5: Migrar labores detalle - labor_3
INSERT INTO public.labores_detalle (
    id, fila_labores_id, id_labor, nom_labor, camas_estimado, tiempo_cama_estimado,
    camas_real, tiempo_cama_real, numero_labor
)
SELECT 
    gen_random_uuid()::text,
    l.id,
    b.labor_3,
    (SELECT nom_labor FROM public.labores WHERE id_labor = b.labor_3),
    b.labor_3_camas_estimado,
    b.labor_3_tiempo_cama_estimado,
    b.labor_3_camas_real,
    b.labor_3_tiempo_cama_real,
    3
FROM public.formulario_rows_backup b
JOIN public.formulario_rows_labores l 
    ON b.formulario_id = l.formulario_id AND b.id_colaborador = l.id_colaborador
WHERE b.labor_3 IS NOT NULL;

-- PASO 6: Migrar labores detalle - labor_4
INSERT INTO public.labores_detalle (
    id, fila_labores_id, id_labor, nom_labor, camas_estimado, tiempo_cama_estimado,
    camas_real, tiempo_cama_real, numero_labor
)
SELECT 
    gen_random_uuid()::text,
    l.id,
    b.labor_4,
    (SELECT nom_labor FROM public.labores WHERE id_labor = b.labor_4),
    b.labor_4_camas_estimado,
    b.labor_4_tiempo_cama_estimado,
    b.labor_4_camas_real,
    b.labor_4_tiempo_cama_real,
    4
FROM public.formulario_rows_backup b
JOIN public.formulario_rows_labores l 
    ON b.formulario_id = l.formulario_id AND b.id_colaborador = l.id_colaborador
WHERE b.labor_4 IS NOT NULL;

-- PASO 7: Migrar labores detalle - labor_5
INSERT INTO public.labores_detalle (
    id, fila_labores_id, id_labor, nom_labor, camas_estimado, tiempo_cama_estimado,
    camas_real, tiempo_cama_real, numero_labor
)
SELECT 
    gen_random_uuid()::text,
    l.id,
    b.labor_5,
    (SELECT nom_labor FROM public.labores WHERE id_labor = b.labor_5),
    b.labor_5_camas_estimado,
    b.labor_5_tiempo_cama_estimado,
    b.labor_5_camas_real,
    b.labor_5_tiempo_cama_real,
    5
FROM public.formulario_rows_backup b
JOIN public.formulario_rows_labores l 
    ON b.formulario_id = l.formulario_id AND b.id_colaborador = l.id_colaborador
WHERE b.labor_5 IS NOT NULL;

-- PASO 8: Migrar a formulario_rows_aseguramiento
INSERT INTO public.formulario_rows_aseguramiento (
    id, formulario_id, id_colaborador, nombre_colaborador, externo,
    id_area, id_supervisor, id_bloque, id_variedad,
    desglose_pipe, proceso_seguridad, calidad_cuadro_1, calidad_cuadro_2,
    calidad_cuadro_3, calidad_cuadro_4, calidad_cuadro_5,
    pct_prom_rendimiento, rendimiento_corte_real, observaciones
)
SELECT 
    gen_random_uuid()::text, formulario_id, id_colaborador, nombre_colaborador, externo,
    id_area, id_supervisor, id_bloque, id_variedad,
    desglose_pipe, proceso_seguridad, calidad_cuadro_1, calidad_cuadro_2,
    calidad_cuadro_3, calidad_cuadro_4, calidad_cuadro_5,
    pct_prom_rendimiento, rendimiento_corte_real, observaciones
FROM public.formulario_rows_backup
WHERE formulario_id IS NOT NULL;

-- PASO 9: Actualizar agregaciones en formulario_rows_labores
UPDATE public.formulario_rows_labores l
SET 
    cantidad_labores_registradas = (
        SELECT COUNT(*) FROM public.labores_detalle 
        WHERE fila_labores_id = l.id
    ),
    rendimiento_promedio = (
        SELECT AVG(rendimiento_horas_estimado) FROM public.labores_detalle 
        WHERE fila_labores_id = l.id
    ),
    tiempo_total_labores_estimado = (
        SELECT SUM(tiempo_cama_estimado) FROM public.labores_detalle 
        WHERE fila_labores_id = l.id
    ),
    tiempo_total_labores_real = (
        SELECT SUM(tiempo_cama_real) FROM public.labores_detalle 
        WHERE fila_labores_id = l.id
    ),
    camas_total_estimadas = (
        SELECT SUM(camas_estimado) FROM public.labores_detalle 
        WHERE fila_labores_id = l.id
    ),
    camas_total_reales = (
        SELECT SUM(camas_real) FROM public.labores_detalle 
        WHERE fila_labores_id = l.id
    );

-- PASO 10: Actualizar metadata
INSERT INTO public.formulario_row_metadata (
    id, formulario_id, id_colaborador,
    se_completo_corte, se_completo_labores, se_completo_aseguramiento,
    fila_corte_id, fila_labores_id, fila_aseguramiento_id
)
SELECT 
    gen_random_uuid()::text,
    c.formulario_id,
    c.id_colaborador,
    CASE WHEN c.id IS NOT NULL THEN true ELSE false END,
    CASE WHEN l.id IS NOT NULL THEN true ELSE false END,
    CASE WHEN a.id IS NOT NULL THEN true ELSE false END,
    c.id,
    l.id,
    a.id
FROM public.formulario_rows_corte c
FULL OUTER JOIN public.formulario_rows_labores l 
    ON c.formulario_id = l.formulario_id AND c.id_colaborador = l.id_colaborador
FULL OUTER JOIN public.formulario_rows_aseguramiento a 
    ON c.formulario_id = a.formulario_id AND c.id_colaborador = a.id_colaborador;
*/

-- ============================================================================
-- FIN SCRIPT
-- ============================================================================
-- Tablas creadas:
--   ✓ formulario_rows_corte
--   ✓ formulario_rows_labores
--   ✓ labores_detalle
--   ✓ formulario_rows_aseguramiento
--   ✓ formulario_row_metadata
--   ✓ Vista: formulario_rows (compatibilidad)
--
-- Respaldo de datos originales:
--   ✓ formulario_rows_backup (puedes borrar después de validar)
--
-- Status: ✓ Listo para ejecutar en PostgreSQL/Supabase
-- ============================================================================
