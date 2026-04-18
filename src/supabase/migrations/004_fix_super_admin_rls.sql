-- ============================================================
-- MAVIC – Migration 004: Fix recursive RLS for super_admin
-- ============================================================
-- Las políticas de la migración 003 causaban recursión infinita
-- porque hacían SELECT sobre profiles dentro de una política de profiles.
-- Este fix reemplaza esas políticas con una función SECURITY DEFINER
-- que evita la recursión al ejecutarse con permisos elevados y sin RLS.
-- ============================================================
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Función auxiliar: devuelve TRUE si el usuario actual es super_admin
--    SECURITY DEFINER = se ejecuta como el dueño de la función (bypassea RLS)
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id    = auth.uid()
      AND role  = 'super_admin'
  );
$$;

-- 2. Eliminar las políticas recursivas anteriores
DROP POLICY IF EXISTS "super_admin can read all profiles"    ON profiles;
DROP POLICY IF EXISTS "super_admin can update all profiles"  ON profiles;
DROP POLICY IF EXISTS "super_admin manages all institutes"   ON institutes;
DROP POLICY IF EXISTS "super_admin can read all courses"     ON courses;
DROP POLICY IF EXISTS "super_admin can read all enrollments" ON enrollments;

-- 3. Recrear políticas usando is_super_admin() (sin recursión)

-- Profiles: super_admin puede leer todos los perfiles
CREATE POLICY "super_admin can read all profiles"
  ON profiles FOR SELECT
  USING (is_super_admin());

-- Profiles: super_admin puede actualizar cualquier perfil
CREATE POLICY "super_admin can update all profiles"
  ON profiles FOR UPDATE
  USING (is_super_admin());

-- Institutes: super_admin puede gestionar todos los institutos
CREATE POLICY "super_admin manages all institutes"
  ON institutes FOR ALL
  USING (is_super_admin());

-- Courses: super_admin puede leer todos los cursos
CREATE POLICY "super_admin can read all courses"
  ON courses FOR SELECT
  USING (is_super_admin());

-- Enrollments: super_admin puede leer todas las inscripciones
CREATE POLICY "super_admin can read all enrollments"
  ON enrollments FOR SELECT
  USING (is_super_admin());
