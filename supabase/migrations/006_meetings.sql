-- MAVIC – Migration 006: Meetings
-- Run in: Supabase > SQL Editor

CREATE TABLE IF NOT EXISTS meetings (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text        NOT NULL,
  room_slug    text        NOT NULL UNIQUE,
  host_id      uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  institute_id uuid        REFERENCES institutes(id) ON DELETE CASCADE,
  active       boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Institute members read meetings"
  ON meetings FOR SELECT
  USING (
    institute_id IN (SELECT institute_id FROM profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "Teachers create meetings"
  ON meetings FOR INSERT
  WITH CHECK (
    host_id = auth.uid()
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('profesor','admin','super_admin'))
  );

CREATE POLICY "Host or admin updates meeting"
  ON meetings FOR UPDATE
  USING (
    host_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  );

CREATE POLICY "Host or admin deletes meeting"
  ON meetings FOR DELETE
  USING (
    host_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  );
