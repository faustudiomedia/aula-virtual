-- MAVIC – Migration 007: Meeting scheduling & chat
-- Run in: Supabase > SQL Editor

-- Add scheduled_at to meetings
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;

-- ── Meeting chat messages ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS meeting_messages (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid        NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  sender_id  uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content    text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE meeting_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Institute members read meeting messages"
  ON meeting_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meetings m
      JOIN profiles p ON p.id = auth.uid()
      WHERE m.id = meeting_messages.meeting_id
        AND (m.institute_id = p.institute_id OR p.role = 'super_admin')
    )
  );

CREATE POLICY "Institute members send meeting messages"
  ON meeting_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM meetings m
      JOIN profiles p ON p.id = auth.uid()
      WHERE m.id = meeting_messages.meeting_id
        AND (m.institute_id = p.institute_id OR p.role = 'super_admin')
    )
  );
