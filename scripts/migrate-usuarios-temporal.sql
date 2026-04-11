-- ================================================================
-- Migración: Agregar soporte para usuarios temporales
-- Ejecutar en Supabase > SQL Editor si ya existe table usuarios
-- ================================================================

-- Agregar campos para tracking de usuarios temporales
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS temporal_hasta TIMESTAMP WITH TIME ZONE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS creado_por_backdoor BOOLEAN DEFAULT false;

-- Crear índice para limpiar usuarios temporales expirados
CREATE INDEX IF NOT EXISTS idx_usuarios_temporal_hasta ON usuarios(temporal_hasta) 
WHERE temporal_hasta IS NOT NULL;

-- Crear función para limpiar usuarios temporales expirados (opcional - ejecutar manualmente)
-- Descomentar si quieres que se ejecute automáticamente
/*
CREATE OR REPLACE FUNCTION cleanup_expired_temporal_users()
RETURNS void AS $$
BEGIN
  DELETE FROM usuarios 
  WHERE temporal_hasta IS NOT NULL 
  AND temporal_hasta < NOW();
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para ejecutar cada hora (requiere pg_cron extension)
-- SELECT cron.schedule('cleanup-temporal-users', '0 * * * *', 'SELECT cleanup_expired_temporal_users()');
*/

-- ================================================================
-- Política RLS: Usuarios temporales se auto-eliminan después de expiración
-- Nota: Implementar esta lógica en la aplicación por simplicidat
-- ================================================================
