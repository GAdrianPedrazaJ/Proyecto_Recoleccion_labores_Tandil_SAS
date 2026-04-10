-- ================================================================
-- Tabla para gestionar locks distribuidos entre dispositivos
-- Ejecutar en Supabase > SQL Editor
-- ================================================================

CREATE TABLE IF NOT EXISTS table_locks (
  -- Composite primary key: (tableName, deviceId)
  tableName TEXT NOT NULL,
  deviceId TEXT NOT NULL,
  lockedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expiresAt TIMESTAMPTZ NOT NULL,
  
  PRIMARY KEY (tableName, deviceId)
);

-- Índice para queries por tableName
CREATE INDEX IF NOT EXISTS idx_table_locks_tableName ON table_locks(tableName);

-- Índice para limpiar locks expirados
CREATE INDEX IF NOT EXISTS idx_table_locks_expiresAt ON table_locks(expiresAt);

-- RLS: permitir lectura y escritura a todos (anon + authenticated)
ALTER TABLE table_locks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_locks" ON table_locks;
CREATE POLICY "anon_locks" ON table_locks 
  FOR ALL 
  TO anon, authenticated 
  USING (true) 
  WITH CHECK (true);
