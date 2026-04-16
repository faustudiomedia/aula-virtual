-- ============================================================
-- Migration 003: Schema fixes + Storage bucket
-- ============================================================

-- Add super_admin to the user_role enum (safe idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'super_admin'
      AND enumtypid = 'user_role'::regtype
  ) THEN
    ALTER TYPE user_role ADD VALUE 'super_admin';
  END IF;
END $$;

-- Fix handle_new_user trigger to also persist institute_id from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, institute_id)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'alumno'),
    NULLIF(new.raw_user_meta_data->>'institute_id', '')::uuid
  );
  RETURN new;
END;
$$;

-- ── Supabase Storage: materials bucket ─────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('materials', 'materials', true, 52428800)  -- 50 MB
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Autenticados pueden subir materiales"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'materials');

CREATE POLICY "Acceso público a materiales"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'materials');

CREATE POLICY "Autenticados pueden eliminar materiales"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'materials');
