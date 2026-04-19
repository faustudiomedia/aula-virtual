-- ============================================================
-- MAVIC – Quiz Attempts
-- ============================================================
-- Registra los intentos de quizzes de los alumnos.
-- La tabla soporta un intento por alumno por quiz (upsert).
-- ============================================================

create table quiz_attempts (
  id           uuid        primary key default gen_random_uuid(),
  quiz_id      uuid        not null references quizzes(id) on delete cascade,
  student_id   uuid        not null references profiles(id) on delete cascade,
  answers      integer[]   not null,          -- índice de opción elegida por pregunta
  score        integer     not null check (score between 0 and 100),
  completed_at timestamptz not null default now(),
  constraint quiz_attempts_unique unique (quiz_id, student_id)
);

create index quiz_attempts_quiz_id_idx     on quiz_attempts (quiz_id);
create index quiz_attempts_student_id_idx  on quiz_attempts (student_id);

alter table quiz_attempts enable row level security;

-- Alumnos ven sus propios intentos
create policy "alumno lee sus intentos"
  on quiz_attempts for select
  using (student_id = auth.uid());

-- Alumnos insertan sus propios intentos
create policy "alumno inserta su intento"
  on quiz_attempts for insert
  with check (student_id = auth.uid());

-- Alumnos actualizan sus propios intentos
create policy "alumno actualiza su intento"
  on quiz_attempts for update
  using  (student_id = auth.uid())
  with check (student_id = auth.uid());

-- Profesores leen los intentos de alumnos en sus cursos
create policy "profesor lee intentos de su curso"
  on quiz_attempts for select
  using (
    exists (
      select 1
      from quizzes q
      join courses c on c.id = q.course_id
      where q.id = quiz_attempts.quiz_id
        and c.teacher_id = auth.uid()
    )
  );

-- Admins leen todos los intentos
create policy "admin lee todos los intentos"
  on quiz_attempts for select
  using (public.auth_role() = 'admin');
