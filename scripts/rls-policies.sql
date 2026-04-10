-- ================================================================
-- Políticas RLS para permitir escritura anónima en tablas admin
-- Ejecutar en Supabase > SQL Editor
-- ================================================================

-- ÁREAS
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_areas" ON areas;
DROP POLICY IF EXISTS "anon_insert_areas" ON areas;
DROP POLICY IF EXISTS "anon_update_areas" ON areas;
DROP POLICY IF EXISTS "anon_delete_areas" ON areas;

CREATE POLICY "anon_select_areas" ON areas FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_areas" ON areas FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_areas" ON areas FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_areas" ON areas FOR DELETE TO anon, authenticated USING (true);

-- COLABORADORES
ALTER TABLE colaboradores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_colaboradores" ON colaboradores;
DROP POLICY IF EXISTS "anon_insert_colaboradores" ON colaboradores;
DROP POLICY IF EXISTS "anon_update_colaboradores" ON colaboradores;
DROP POLICY IF EXISTS "anon_delete_colaboradores" ON colaboradores;

CREATE POLICY "anon_select_colaboradores" ON colaboradores FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_colaboradores" ON colaboradores FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_colaboradores" ON colaboradores FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_colaboradores" ON colaboradores FOR DELETE TO anon, authenticated USING (true);

-- BLOQUES
ALTER TABLE bloques ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_bloques" ON bloques;
DROP POLICY IF EXISTS "anon_insert_bloques" ON bloques;
DROP POLICY IF EXISTS "anon_update_bloques" ON bloques;
DROP POLICY IF EXISTS "anon_delete_bloques" ON bloques;

CREATE POLICY "anon_select_bloques" ON bloques FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_bloques" ON bloques FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_bloques" ON bloques FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_bloques" ON bloques FOR DELETE TO anon, authenticated USING (true);

-- VARIEDADES
ALTER TABLE variedades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_variedades" ON variedades;
DROP POLICY IF EXISTS "anon_insert_variedades" ON variedades;
DROP POLICY IF EXISTS "anon_update_variedades" ON variedades;
DROP POLICY IF EXISTS "anon_delete_variedades" ON variedades;

CREATE POLICY "anon_select_variedades" ON variedades FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_variedades" ON variedades FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_variedades" ON variedades FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_variedades" ON variedades FOR DELETE TO anon, authenticated USING (true);

-- SUPERVISORES
ALTER TABLE supervisors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_supervisors" ON supervisors;
DROP POLICY IF EXISTS "anon_insert_supervisors" ON supervisors;
DROP POLICY IF EXISTS "anon_update_supervisors" ON supervisors;
DROP POLICY IF EXISTS "anon_delete_supervisors" ON supervisors;

CREATE POLICY "anon_select_supervisors" ON supervisors FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_supervisors" ON supervisors FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_supervisors" ON supervisors FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_supervisors" ON supervisors FOR DELETE TO anon, authenticated USING (true);

-- LABORES
ALTER TABLE labores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_labores" ON labores;
DROP POLICY IF EXISTS "anon_insert_labores" ON labores;
DROP POLICY IF EXISTS "anon_update_labores" ON labores;
DROP POLICY IF EXISTS "anon_delete_labores" ON labores;

CREATE POLICY "anon_select_labores" ON labores FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_labores" ON labores FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_labores" ON labores FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_labores" ON labores FOR DELETE TO anon, authenticated USING (true);
