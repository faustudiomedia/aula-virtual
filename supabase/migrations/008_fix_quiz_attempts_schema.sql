-- ============================================================
-- MAVIC – Fix quiz_attempts schema
-- ============================================================
-- La tabla quiz_attempts existía con un esquema diferente al
-- esperado por src/app/actions/quizzes.ts. Esta migración
-- alinea la DB con el código.
-- ============================================================

-- 1. Cambiar answers de jsonb a integer[]
ALTER TABLE quiz_attempts
  ALTER COLUMN answers TYPE integer[] USING '{}';

-- 2. Renombrar attempted_at → completed_at
ALTER TABLE quiz_attempts
  RENAME COLUMN attempted_at TO completed_at;

-- 3. Hacer score y completed_at NOT NULL con defaults
ALTER TABLE quiz_attempts
  ALTER COLUMN score SET NOT NULL,
  ALTER COLUMN score SET DEFAULT 0,
  ALTER COLUMN answers SET NOT NULL,
  ALTER COLUMN answers SET DEFAULT '{}',
  ALTER COLUMN completed_at SET NOT NULL,
  ALTER COLUMN completed_at SET DEFAULT now();

-- 4. Agregar constraint unique si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'quiz_attempts_unique'
  ) THEN
    ALTER TABLE quiz_attempts
      ADD CONSTRAINT quiz_attempts_unique UNIQUE (quiz_id, student_id);
  END IF;
END $$;

-- 5. Índices si no existen
CREATE INDEX IF NOT EXISTS quiz_attempts_quiz_id_idx    ON quiz_attempts (quiz_id);
CREATE INDEX IF NOT EXISTS quiz_attempts_student_id_idx ON quiz_attempts (student_id);
