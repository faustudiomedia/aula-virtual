-- Track which materials each student has completed
CREATE TABLE IF NOT EXISTS material_completions (
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, material_id)
);

ALTER TABLE material_completions ENABLE ROW LEVEL SECURITY;

-- Students can only manage their own completions
CREATE POLICY "Students manage own completions"
  ON material_completions
  FOR ALL
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- Teachers and admins can read completions for their courses
CREATE POLICY "Teachers read course completions"
  ON material_completions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM materials m
      JOIN courses c ON c.id = m.course_id
      WHERE m.id = material_completions.material_id
        AND (
          c.teacher_id = auth.uid()
          OR auth_role() IN ('admin', 'super_admin')
        )
    )
  );
