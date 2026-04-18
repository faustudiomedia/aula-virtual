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
