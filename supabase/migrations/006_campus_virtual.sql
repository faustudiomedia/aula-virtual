-- ============================================================
-- 006 – Campus Virtual: Announcements, Discussions, Events, Assignments
-- ============================================================

-- ── 1. ANUNCIOS DEL PROFESOR ────────────────────────────────
-- El profesor publica anuncios que ven todos los inscriptos
create table if not exists announcements (
  id           uuid primary key default uuid_generate_v4(),
  course_id    uuid not null references courses(id) on delete cascade,
  author_id    uuid not null references profiles(id) on delete cascade,
  title        text not null,
  body         text not null,
  pinned       boolean not null default false,
  created_at   timestamptz not null default now()
);

create index idx_announcements_course on announcements(course_id, created_at desc);

alter table announcements enable row level security;

create policy "teacher manages own announcements"
  on announcements for all
  using (author_id = auth.uid());

create policy "enrolled students read announcements"
  on announcements for select
  using (
    exists (
      select 1 from enrollments e
      where e.course_id = announcements.course_id
        and e.student_id = auth.uid()
    )
  );

create policy "admin reads all announcements"
  on announcements for select
  using ((select role from profiles where id = auth.uid()) = 'admin');

-- ── 2. FORO DE DISCUSIÓN ────────────────────────────────────
-- Threads y replies dentro de cada curso
create table if not exists discussion_threads (
  id           uuid primary key default uuid_generate_v4(),
  course_id    uuid not null references courses(id) on delete cascade,
  author_id    uuid not null references profiles(id) on delete cascade,
  title        text not null,
  body         text not null,
  is_pinned    boolean not null default false,
  created_at   timestamptz not null default now()
);

create index idx_threads_course on discussion_threads(course_id, created_at desc);

create table if not exists discussion_replies (
  id           uuid primary key default uuid_generate_v4(),
  thread_id    uuid not null references discussion_threads(id) on delete cascade,
  author_id    uuid not null references profiles(id) on delete cascade,
  body         text not null,
  created_at   timestamptz not null default now()
);

create index idx_replies_thread on discussion_replies(thread_id, created_at asc);

alter table discussion_threads enable row level security;
alter table discussion_replies enable row level security;

-- Threads: miembros del curso (profesor + inscriptos) pueden leer y crear
create policy "course members read threads"
  on discussion_threads for select
  using (
    author_id = auth.uid()
    or exists (select 1 from enrollments e where e.course_id = discussion_threads.course_id and e.student_id = auth.uid())
    or exists (select 1 from courses c where c.id = discussion_threads.course_id and c.teacher_id = auth.uid())
  );

create policy "course members create threads"
  on discussion_threads for insert
  with check (
    exists (select 1 from enrollments e where e.course_id = discussion_threads.course_id and e.student_id = auth.uid())
    or exists (select 1 from courses c where c.id = discussion_threads.course_id and c.teacher_id = auth.uid())
  );

create policy "author deletes own thread"
  on discussion_threads for delete
  using (author_id = auth.uid());

-- Replies: misma lógica
create policy "course members read replies"
  on discussion_replies for select
  using (
    author_id = auth.uid()
    or exists (
      select 1 from discussion_threads t
      join enrollments e on e.course_id = t.course_id
      where t.id = discussion_replies.thread_id and e.student_id = auth.uid()
    )
    or exists (
      select 1 from discussion_threads t
      join courses c on c.id = t.course_id
      where t.id = discussion_replies.thread_id and c.teacher_id = auth.uid()
    )
  );

create policy "course members create replies"
  on discussion_replies for insert
  with check (
    exists (
      select 1 from discussion_threads t
      where t.id = discussion_replies.thread_id
      and (
        exists (select 1 from enrollments e where e.course_id = t.course_id and e.student_id = auth.uid())
        or exists (select 1 from courses c where c.id = t.course_id and c.teacher_id = auth.uid())
      )
    )
  );

create policy "author deletes own reply"
  on discussion_replies for delete
  using (author_id = auth.uid());

-- ── 3. CALENDARIO DE EVENTOS ────────────────────────────────
create table if not exists events (
  id           uuid primary key default uuid_generate_v4(),
  course_id    uuid not null references courses(id) on delete cascade,
  author_id    uuid not null references profiles(id) on delete cascade,
  title        text not null,
  description  text,
  event_type   text not null default 'clase', -- 'clase', 'examen', 'entrega', 'otro'
  start_at     timestamptz not null,
  end_at       timestamptz,
  created_at   timestamptz not null default now()
);

create index idx_events_course on events(course_id, start_at);

alter table events enable row level security;

create policy "teacher manages own events"
  on events for all
  using (author_id = auth.uid());

create policy "enrolled students read events"
  on events for select
  using (
    exists (
      select 1 from enrollments e
      where e.course_id = events.course_id
        and e.student_id = auth.uid()
    )
  );

create policy "admin reads all events"
  on events for select
  using ((select role from profiles where id = auth.uid()) = 'admin');

-- ── 4. TRABAJOS PRÁCTICOS (Assignments) ─────────────────────
create table if not exists assignments (
  id           uuid primary key default uuid_generate_v4(),
  course_id    uuid not null references courses(id) on delete cascade,
  author_id    uuid not null references profiles(id) on delete cascade,
  title        text not null,
  description  text,
  due_date     timestamptz,
  max_score    int not null default 100,
  created_at   timestamptz not null default now()
);

create index idx_assignments_course on assignments(course_id, due_date);

create table if not exists submissions (
  id             uuid primary key default uuid_generate_v4(),
  assignment_id  uuid not null references assignments(id) on delete cascade,
  student_id     uuid not null references profiles(id) on delete cascade,
  file_url       text,
  comment        text,
  score          int,              -- null = no calificado
  feedback       text,             -- feedback del profesor
  submitted_at   timestamptz not null default now(),
  graded_at      timestamptz,
  unique (assignment_id, student_id)
);

alter table assignments enable row level security;
alter table submissions enable row level security;

create policy "teacher manages own assignments"
  on assignments for all
  using (author_id = auth.uid());

create policy "enrolled students read assignments"
  on assignments for select
  using (
    exists (
      select 1 from enrollments e
      where e.course_id = assignments.course_id
        and e.student_id = auth.uid()
    )
  );

create policy "students manage own submissions"
  on submissions for all
  using (student_id = auth.uid());

create policy "teacher reads submissions"
  on submissions for select
  using (
    exists (
      select 1 from assignments a
      join courses c on c.id = a.course_id
      where a.id = submissions.assignment_id
        and c.teacher_id = auth.uid()
    )
  );

create policy "teacher grades submissions"
  on submissions for update
  using (
    exists (
      select 1 from assignments a
      join courses c on c.id = a.course_id
      where a.id = submissions.assignment_id
        and c.teacher_id = auth.uid()
    )
  );
