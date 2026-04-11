-- ============================================================
-- MIGRACIÓN: Rol superadministrador
-- Ejecutar en Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Si la columna 'rol' es tipo TEXT, solo agregar la política.
--    Si es un ENUM, ejecutar primero el bloque de ALTER TYPE.

-- ── Opción A: rol es TEXT / VARCHAR (más probable) ──────────
-- No requiere cambio de schema. El valor 'superadministrador'
-- ya funciona directamente. Solo actualizar políticas RLS.

-- ── Opción B: rol es ENUM ──────────────────────────────────
-- Descomentar si el tipo de la columna es un enum personalizado:
-- ALTER TYPE rol_enum ADD VALUE IF NOT EXISTS 'superadministrador';

-- ------------------------------------------------------------
-- 2. Políticas RLS para gestión de usuarios (INSERT / UPDATE)
--    Necesario para que superadmin pueda crear/editar usuarios
-- ------------------------------------------------------------

-- Eliminar políticas anteriores si existen
DROP POLICY IF EXISTS "Allow insert usuarios" ON usuarios;
DROP POLICY IF EXISTS "Allow update usuarios" ON usuarios;
DROP POLICY IF EXISTS "Allow delete usuarios" ON usuarios;

-- Permitir INSERT (crear nuevos usuarios via app)
CREATE POLICY "Allow insert usuarios"
  ON usuarios FOR INSERT
  TO anon
  WITH CHECK (true);

-- Permitir UPDATE (cambiar rol, activo, nombre)
CREATE POLICY "Allow update usuarios"
  ON usuarios FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- NO permitir DELETE (seguridad: desactivar en vez de eliminar)

-- ------------------------------------------------------------
-- 3. Crear el primer superadministrador
--    Reemplazá los valores con los datos reales.
--    Para generar el hash: node scripts/generate-bcrypt-hashes.js TuContraseña
-- ------------------------------------------------------------

-- Ejemplo (reemplazar hash con uno real generado con bcrypt):
-- INSERT INTO usuarios (email, nombre, contraseña_hash, rol, activo)
-- VALUES (
--   'superadmin@tandil.com',
--   'Super Administrador',
--   '$2a$10$HASH_GENERADO_CON_BCRYPT',
--   'superadministrador',
--   true
-- )
-- ON CONFLICT (email) DO UPDATE SET rol = 'superadministrador', activo = true;

-- ------------------------------------------------------------
-- 4. Verificar
-- ------------------------------------------------------------
SELECT id, email, nombre, rol, activo FROM usuarios ORDER BY rol, nombre;
