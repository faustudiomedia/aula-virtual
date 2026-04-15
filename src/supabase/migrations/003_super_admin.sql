-- ============================================================
-- MAVIC – Migration 003: Super Admin role support
-- ============================================================
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Agregar 'super_admin' al enum de roles
-- (si el enum ya existe con los valores anteriores, usamos ALTER TYPE)
DO $$
BEGIN
  -- Verificar si el tipo user_role ya tiene super_admin
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'super_admin'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    ALTER TYPE user_role ADD VALUE 'super_admin';
  END IF;
END$$;

-- 2. Política RLS: super_admin puede leer TODOS los perfiles
CREATE POLICY "super_admin can read all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'super_admin'
    )
  );

-- 3. Política RLS: super_admin puede actualizar cualquier perfil
CREATE POLICY "super_admin can update all profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'super_admin'
    )
  );

-- 4. Política RLS: super_admin puede gestionar todos los institutos
CREATE POLICY "super_admin manages all institutes"
  ON institutes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'super_admin'
    )
  );

-- 5. Política RLS: super_admin puede leer todos los cursos
CREATE POLICY "super_admin can read all courses"
  ON courses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'super_admin'
    )
  );

-- 6. Política RLS: super_admin puede leer todas las inscripciones
CREATE POLICY "super_admin can read all enrollments"
  ON enrollments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'super_admin'
    )
  );

-- ============================================================
-- NOTA: Para crear un usuario super_admin manualmente:
--
-- 1. Crear el usuario en Supabase Auth (Dashboard → Auth → Users)
-- 2. Luego ejecutar:
--
--    UPDATE profiles
--    SET role = 'super_admin', institute_id = NULL
--    WHERE email = 'tu-email@ejemplo.com';
--
-- El super_admin NO pertenece a ningún instituto (institute_id = NULL).
-- ============================================================
