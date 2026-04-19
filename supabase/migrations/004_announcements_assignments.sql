-- MAVIC – Migration 004: Announcements, Assignments & Submissions
-- Run in: Supabase > SQL Editor

-- ── Announcements ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS announcements (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id  uuid        NOT NULL REFERENCES courses(id)  ON DELETE CASCADE,
  author_id  uuid        NOT NULL REFERENCES profiles(id),
  title      text        NOT NULL,
  content    text        NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Course members read announcements"
  ON announcements FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM enrollments WHERE course_id = announcements.course_id AND student_id = auth.uid())
    OR EXISTS (SELECT 1 FROM courses   WHERE id       = announcements.course_id AND teacher_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles  WHERE id       = auth.uid() AND role IN ('admin','super_admin'))
  );

CREATE POLICY "Author manages own announcements"
  ON announcements FOR ALL
  USING  (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- ── Assignments ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS assignments (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   uuid        NOT NULL REFERENCES courses(id)  ON DELETE CASCADE,
  title       text        NOT NULL,
  description text        NOT NULL DEFAULT '',
  due_date    timestamptz,
  max_score   integer     NOT NULL DEFAULT 100 CHECK (max_score > 0),
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Course members read assignments"
  ON assignments FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM enrollments WHERE course_id = assignments.course_id AND student_id = auth.uid())
    OR EXISTS (SELECT 1 FROM courses   WHERE id       = assignments.course_id AND teacher_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles  WHERE id       = auth.uid() AND role IN ('admin','super_admin'))
  );

CREATE POLICY "Course teacher manages assignments"
  ON assignments FOR ALL
  USING  (EXISTS (SELECT 1 FROM courses WHERE id = assignments.course_id AND teacher_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM courses WHERE id = assignments.course_id AND teacher_id = auth.uid()));

-- ── Submissions ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS submissions (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid        NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id    uuid        NOT NULL REFERENCES profiles(id)    ON DELETE CASCADE,
  content       text        NOT NULL DEFAULT '',
  file_url      text,
  score         integer     CHECK (score >= 0),
  feedback      text,
  submitted_at  timestamptz NOT NULL DEFAULT now(),
  graded_at     timestamptz,
  UNIQUE (assignment_id, student_id)
);

ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students manage own submissions"
  ON submissions FOR ALL
  USING  (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teachers read course submissions"
  ON submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM assignments a
      JOIN   courses c ON c.id = a.course_id
      WHERE  a.id = submissions.assignment_id AND c.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers grade submissions"
  ON submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM assignments a
      JOIN   courses c ON c.id = a.course_id
      WHERE  a.id = submissions.assignment_id AND c.teacher_id = auth.uid()
    )
  );
