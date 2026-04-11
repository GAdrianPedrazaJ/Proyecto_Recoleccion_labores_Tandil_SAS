-- ================================================================
-- EJECUTAR EN: Supabase > SQL Editor
-- Fixes:
--   1. RLS policies para todas las tablas (permite INSERT/UPDATE/DELETE)
--   2. Elimina FK constraint problemática en formulario_rows_aseguramiento
--   3. Elimina sedes de prueba TN y PM
-- ================================================================

-- ── 1. SEDES ────────────────────────────────────────────────────────────────
ALTER TABLE sedes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_sedes" ON sedes;
CREATE POLICY "allow_all_sedes" ON sedes
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- Eliminar sedes de prueba que no deben aparecer (ajustar nombres si difieren)
DELETE FROM sedes WHERE nom_sede IN ('TN', 'PM');

-- ── 2. AREAS ────────────────────────────────────────────────────────────────
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_areas" ON areas;
CREATE POLICY "allow_all_areas" ON areas
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- ── 3. SUPERVISORS ──────────────────────────────────────────────────────────
ALTER TABLE supervisors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_supervisors" ON supervisors;
CREATE POLICY "allow_all_supervisors" ON supervisors
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- ── 4. BLOQUES ──────────────────────────────────────────────────────────────
ALTER TABLE bloques ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_bloques" ON bloques;
CREATE POLICY "allow_all_bloques" ON bloques
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- ── 5. COLABORADORES ────────────────────────────────────────────────────────
ALTER TABLE colaboradores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_colaboradores" ON colaboradores;
CREATE POLICY "allow_all_colaboradores" ON colaboradores
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- ── 6. VARIEDADES ───────────────────────────────────────────────────────────
ALTER TABLE variedades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_variedades" ON variedades;
CREATE POLICY "allow_all_variedades" ON variedades
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- ── 7. LABORES ──────────────────────────────────────────────────────────────
ALTER TABLE labores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_labores" ON labores;
CREATE POLICY "allow_all_labores" ON labores
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- ── 8. FORMULARIOS ──────────────────────────────────────────────────────────
ALTER TABLE formularios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_formularios" ON formularios;
CREATE POLICY "allow_all_formularios" ON formularios
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- ── 9. FORMULARIO_ROWS (es una VISTA — no soporta RLS) ─────────────────────
-- RLS no aplica a views. El acceso se controla desde la tabla base (formularios).
-- No se hace nada aquí.

-- ── 10. FORMULARIO_ROWS_CORTE ────────────────────────────────────────────────
ALTER TABLE formulario_rows_corte ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_rows_corte" ON formulario_rows_corte;
CREATE POLICY "allow_all_rows_corte" ON formulario_rows_corte
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- ── 10b. FORMULARIO_ROWS_LABORES ─────────────────────────────────────────────
ALTER TABLE formulario_rows_labores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_rows_labores" ON formulario_rows_labores;
CREATE POLICY "allow_all_rows_labores" ON formulario_rows_labores
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- ── 10c. FORMULARIO_ROWS_ASEGURAMIENTO ───────────────────────────────────────
ALTER TABLE formulario_rows_aseguramiento ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_aseguramiento" ON formulario_rows_aseguramiento;
CREATE POLICY "allow_all_aseguramiento" ON formulario_rows_aseguramiento
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- ── 10d. FORMULARIO_ROW_METADATA ─────────────────────────────────────────────
ALTER TABLE formulario_row_metadata ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_metadata" ON formulario_row_metadata;
CREATE POLICY "allow_all_metadata" ON formulario_row_metadata
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- ── 10e. LABORES_DETALLE ──────────────────────────────────────────────────────
ALTER TABLE labores_detalle ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_labores_detalle" ON labores_detalle;
CREATE POLICY "allow_all_labores_detalle" ON labores_detalle
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- ── 11. VARIEDADES_BLOQUES ──────────────────────────────────────────────────
ALTER TABLE variedades_bloques ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_variedades_bloques" ON variedades_bloques;
CREATE POLICY "allow_all_variedades_bloques" ON variedades_bloques
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- ── 12. TABLE_LOCKS (ya debería tener RLS, pero por si acaso) ───────────────
-- Nota: las columnas en PostgreSQL se almacenan en minúsculas sin comillas.
-- La tabla fue creada con tableName → almacenada como tablename, etc.
-- El código ya fue corregido para usar los nombres en minúsculas.

-- ── 13. ELIMINAR FK CONSTRAINTS PROBLEMÁTICAS (offline-first) ───────────────
-- Para una app offline-first, las claves foráneas entre formularios y tablas de
-- referencia (areas, bloques, variedades, supervisors) no se pueden garantizar
-- porque el dispositivo off-line puede tener IDs locales diferentes.
-- Se eliminan estas constraints de referencia conservando solo el vínculo
-- formulario_rows_* → formularios que sí podemos garantizar.

-- formularios
ALTER TABLE formularios DROP CONSTRAINT IF EXISTS formularios_area_id_fkey;
ALTER TABLE formularios DROP CONSTRAINT IF EXISTS formularios_supervisor_id_fkey;

-- formulario_rows_corte  
ALTER TABLE formulario_rows_corte DROP CONSTRAINT IF EXISTS formulario_rows_corte_id_colaborador_fkey;
ALTER TABLE formulario_rows_corte DROP CONSTRAINT IF EXISTS formulario_rows_corte_id_area_fkey;
ALTER TABLE formulario_rows_corte DROP CONSTRAINT IF EXISTS formulario_rows_corte_id_supervisor_fkey;
ALTER TABLE formulario_rows_corte DROP CONSTRAINT IF EXISTS formulario_rows_corte_id_bloque_fkey;
ALTER TABLE formulario_rows_corte DROP CONSTRAINT IF EXISTS formulario_rows_corte_id_variedad_fkey;

-- formulario_rows_labores
ALTER TABLE formulario_rows_labores DROP CONSTRAINT IF EXISTS formulario_rows_labores_id_colaborador_fkey;
ALTER TABLE formulario_rows_labores DROP CONSTRAINT IF EXISTS formulario_rows_labores_id_area_fkey;
ALTER TABLE formulario_rows_labores DROP CONSTRAINT IF EXISTS formulario_rows_labores_id_supervisor_fkey;
ALTER TABLE formulario_rows_labores DROP CONSTRAINT IF EXISTS formulario_rows_labores_id_bloque_fkey;
ALTER TABLE formulario_rows_labores DROP CONSTRAINT IF EXISTS formulario_rows_labores_id_variedad_fkey;

-- formulario_rows_aseguramiento
ALTER TABLE formulario_rows_aseguramiento DROP CONSTRAINT IF EXISTS formulario_rows_aseguramiento_id_colaborador_fkey;
ALTER TABLE formulario_rows_aseguramiento DROP CONSTRAINT IF EXISTS formulario_rows_aseguramiento_id_area_fkey;
ALTER TABLE formulario_rows_aseguramiento DROP CONSTRAINT IF EXISTS formulario_rows_aseguramiento_id_supervisor_fkey;
ALTER TABLE formulario_rows_aseguramiento DROP CONSTRAINT IF EXISTS formulario_rows_aseguramiento_id_bloque_fkey;
ALTER TABLE formulario_rows_aseguramiento DROP CONSTRAINT IF EXISTS formulario_rows_aseguramiento_id_variedad_fkey;

-- labores_detalle (id_labor puede no existir si viene de seed local)
ALTER TABLE labores_detalle DROP CONSTRAINT IF EXISTS labores_detalle_id_labor_fkey;
