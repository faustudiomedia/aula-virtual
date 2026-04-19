-- ─────────────────────────────────────────────
-- Academic Periods
-- ─────────────────────────────────────────────
CREATE TABLE academic_periods (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  institute_id uuid NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
  name         text NOT NULL,
  start_date   date NOT NULL,
  end_date     date NOT NULL,
  is_active    boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE courses ADD COLUMN IF NOT EXISTS period_id uuid REFERENCES academic_periods(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────────
-- Legajo (student ID number per institute)
-- ─────────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS legajo text;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_legajo_institute_idx
  ON profiles(institute_id, legajo)
  WHERE legajo IS NOT NULL;

-- ─────────────────────────────────────────────
-- Attendance
-- ─────────────────────────────────────────────
CREATE TABLE attendance_sessions (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id    uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  session_date date NOT NULL,
  topic        text,
  created_by   uuid NOT NULL REFERENCES profiles(id),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE attendance_records (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id uuid NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status     text NOT NULL CHECK (status IN ('present','absent','late','justified')),
  notes      text,
  UNIQUE(session_id, student_id)
);

-- ─────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────
ALTER TABLE academic_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_academic_periods" ON academic_periods FOR SELECT
  USING (
    institute_id IN (SELECT institute_id FROM profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "manage_academic_periods" ON academic_periods FOR ALL
  USING (
    institute_id IN (SELECT institute_id FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  );

ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teacher_manage_attendance_sessions" ON attendance_sessions FOR ALL
  USING (
    course_id IN (SELECT id FROM courses WHERE teacher_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  );

CREATE POLICY "student_view_attendance_sessions" ON attendance_sessions FOR SELECT
  USING (
    course_id IN (SELECT course_id FROM enrollments WHERE student_id = auth.uid())
  );

ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teacher_manage_attendance_records" ON attendance_records FOR ALL
  USING (
    session_id IN (
      SELECT s.id FROM attendance_sessions s
      JOIN courses c ON c.id = s.course_id
      WHERE c.teacher_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  );

CREATE POLICY "student_view_own_attendance" ON attendance_records FOR SELECT
  USING (student_id = auth.uid());
