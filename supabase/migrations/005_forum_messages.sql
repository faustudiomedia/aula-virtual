-- MAVIC – Migration 005: Forum & Direct Messages
-- Run in: Supabase > SQL Editor

-- ── Forum threads ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS forum_threads (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id  uuid        NOT NULL REFERENCES courses(id)  ON DELETE CASCADE,
  author_id  uuid        NOT NULL REFERENCES profiles(id),
  title      text        NOT NULL,
  content    text        NOT NULL DEFAULT '',
  pinned     boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE forum_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Course members read threads"
  ON forum_threads FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM enrollments WHERE course_id = forum_threads.course_id AND student_id = auth.uid())
    OR EXISTS (SELECT 1 FROM courses   WHERE id       = forum_threads.course_id AND teacher_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles  WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  );

CREATE POLICY "Course members create threads"
  ON forum_threads FOR INSERT
  WITH CHECK (
    author_id = auth.uid() AND (
      EXISTS (SELECT 1 FROM enrollments WHERE course_id = forum_threads.course_id AND student_id = auth.uid())
      OR EXISTS (SELECT 1 FROM courses   WHERE id       = forum_threads.course_id AND teacher_id = auth.uid())
    )
  );

CREATE POLICY "Author or teacher modifies threads"
  ON forum_threads FOR UPDATE
  USING (
    author_id = auth.uid()
    OR EXISTS (SELECT 1 FROM courses WHERE id = forum_threads.course_id AND teacher_id = auth.uid())
  );

CREATE POLICY "Author or teacher deletes threads"
  ON forum_threads FOR DELETE
  USING (
    author_id = auth.uid()
    OR EXISTS (SELECT 1 FROM courses WHERE id = forum_threads.course_id AND teacher_id = auth.uid())
  );

-- ── Forum replies ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS forum_replies (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id  uuid        NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
  author_id  uuid        NOT NULL REFERENCES profiles(id),
  content    text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Course members read replies"
  ON forum_replies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM forum_threads t
      WHERE t.id = forum_replies.thread_id AND (
        EXISTS (SELECT 1 FROM enrollments WHERE course_id = t.course_id AND student_id = auth.uid())
        OR EXISTS (SELECT 1 FROM courses   WHERE id       = t.course_id AND teacher_id = auth.uid())
        OR EXISTS (SELECT 1 FROM profiles  WHERE id = auth.uid() AND role IN ('admin','super_admin'))
      )
    )
  );

CREATE POLICY "Course members post replies"
  ON forum_replies FOR INSERT
  WITH CHECK (
    author_id = auth.uid() AND EXISTS (
      SELECT 1 FROM forum_threads t
      WHERE t.id = forum_replies.thread_id AND (
        EXISTS (SELECT 1 FROM enrollments WHERE course_id = t.course_id AND student_id = auth.uid())
        OR EXISTS (SELECT 1 FROM courses   WHERE id       = t.course_id AND teacher_id = auth.uid())
      )
    )
  );

CREATE POLICY "Author deletes own replies"
  ON forum_replies FOR DELETE
  USING (author_id = auth.uid());

-- ── Direct messages ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS messages (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content      text        NOT NULL,
  read_at      timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants access messages"
  ON messages FOR ALL
  USING    (sender_id = auth.uid() OR recipient_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());
