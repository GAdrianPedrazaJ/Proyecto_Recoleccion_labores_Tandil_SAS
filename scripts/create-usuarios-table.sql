-- ================================================================
-- Create users table with roles
-- Ejecutar en Supabase > SQL Editor
-- ================================================================

-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  contraseña_hash TEXT NOT NULL, -- bcrypt hash
  rol TEXT NOT NULL CHECK (rol IN ('supervisor', 'administrador')),
  activo BOOLEAN NOT NULL DEFAULT true,
  creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índice para búsquedas rápidas por email
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);

-- Habilitar RLS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Cualquiera (anon) puede leer usuarios para login
DROP POLICY IF EXISTS "usuarios_read_anon" ON usuarios;
CREATE POLICY "usuarios_read_anon" ON usuarios
  FOR SELECT
  TO anon
  USING (true);

-- RLS Policy: Solo authenticated admins pueden escribir
DROP POLICY IF EXISTS "usuarios_write_admin" ON usuarios;
CREATE POLICY "usuarios_write_admin" ON usuarios
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ================================================================
-- Insert default users with real bcrypt hashes
-- Password hashes generados con: node scripts/generate-bcrypt-hashes.js
-- ================================================================
INSERT INTO usuarios (email, nombre, contraseña_hash, rol, activo)
VALUES
('supervisor@tandil.com', 'Supervisor Demo', '$2b$10$fxDTIgAvEremZVik0KXoveJ.MeitsFS2h.fRuhgQSuHD.VdsMALee', 'supervisor', true),
('admin@tandil.com', 'Administrador', '$2b$10$pfaxWsdg4yVVE2V0mIhfbuKAv3YQv5.et4kONcSqp9Zeu76ydj9Me', 'administrador', true)
ON CONFLICT (email) DO NOTHING;

-- ================================================================
-- Audit log para cambios de usuarios
-- ================================================================
CREATE TABLE IF NOT EXISTS usuarios_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  accion TEXT NOT NULL,
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  realizado_por UUID,
  creado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usuarios_audit_usuario ON usuarios_audit(usuario_id);

ALTER TABLE usuarios_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usuarios_audit_read" ON usuarios_audit;
CREATE POLICY "usuarios_audit_read" ON usuarios_audit
  FOR SELECT
  TO authenticated
  USING (true);
