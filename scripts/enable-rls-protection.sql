-- ================================================================
-- Enable RLS protection on all data tables
-- Ejecutar en Supabase > SQL Editor
-- ================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE formulario_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE supervisores ENABLE ROW LEVEL SECURITY;
ALTER TABLE bloques ENABLE ROW LEVEL SECURITY;
ALTER TABLE variedades ENABLE ROW LEVEL SECURITY;
ALTER TABLE labores ENABLE ROW LEVEL SECURITY;
ALTER TABLE formularios ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- formulario_rows: Authenticated users can read/write all
-- ================================================================
DROP POLICY IF EXISTS "formulario_rows_auth" ON formulario_rows;
CREATE POLICY "formulario_rows_auth" ON formulario_rows
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ================================================================
-- areas: Authenticated users can read/write all
-- ================================================================
DROP POLICY IF EXISTS "areas_auth" ON areas;
CREATE POLICY "areas_auth" ON areas
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ================================================================
-- colaboradores: Authenticated users can read/write all
-- ================================================================
DROP POLICY IF EXISTS "colaboradores_auth" ON colaboradores;
CREATE POLICY "colaboradores_auth" ON colaboradores
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ================================================================
-- supervisores: Authenticated users can read/write all
-- ================================================================
DROP POLICY IF EXISTS "supervisores_auth" ON supervisores;
CREATE POLICY "supervisores_auth" ON supervisores
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ================================================================
-- bloques: Authenticated users can read/write all
-- ================================================================
DROP POLICY IF EXISTS "bloques_auth" ON bloques;
CREATE POLICY "bloques_auth" ON bloques
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ================================================================
-- variedades: Authenticated users can read/write all
-- ================================================================
DROP POLICY IF EXISTS "variedades_auth" ON variedades;
CREATE POLICY "variedades_auth" ON variedades
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ================================================================
-- labores: Authenticated users can read/write all
-- ================================================================
DROP POLICY IF EXISTS "labores_auth" ON labores;
CREATE POLICY "labores_auth" ON labores
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ================================================================
-- formularios: Authenticated users can read/write all
-- ================================================================
DROP POLICY IF EXISTS "formularios_auth" ON formularios;
CREATE POLICY "formularios_auth" ON formularios
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
