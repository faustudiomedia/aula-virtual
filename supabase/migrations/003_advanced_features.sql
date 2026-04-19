-- ============================================================
-- MAVIC – Advanced Entities (Quizzes, Notifications, Audit Log)
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- quizzes
-- ──────────────────────────────────────────────────────────────
create table quizzes (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid not null references courses(id) on delete cascade,
  title        text not null,
  content      jsonb not null default '[]'::jsonb, -- Array of questions
  is_published boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table quizzes enable row level security;

-- Students read their courses' published quizzes
create policy "student reads published course quizzes"
  on quizzes for select
  using (
    is_published = true 
    and exists (
      select 1 from enrollments e
      where e.course_id = quizzes.course_id
        and e.student_id = auth.uid()
    )
  );

-- Teachers manage their own courses' quizzes
create policy "teacher manages own quizzes"
  on quizzes for all
  using (
    exists (
      select 1 from courses c
      where c.id = quizzes.course_id
        and c.teacher_id = auth.uid()
    )
  );

-- Admins manage all quizzes
create policy "admin manages all quizzes"
  on quizzes for all
  using (public.auth_role() = 'admin');

-- ──────────────────────────────────────────────────────────────
-- notifications
-- ──────────────────────────────────────────────────────────────
create table notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  title      text not null,
  message    text not null,
  is_read    boolean not null default false,
  link_url   text,
  created_at timestamptz not null default now()
);

alter table notifications enable row level security;

-- User reads own notifications
create policy "user reads own notifications"
  on notifications for select
  using (user_id = auth.uid());

-- User updates own notifications (e.g. to mark as read)
create policy "user updates own notifications"
  on notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Admins can view/manage all notifications (For dashboard)
create policy "admin manages all notifications"
  on notifications for all
  using (public.auth_role() = 'admin');

-- ──────────────────────────────────────────────────────────────
-- audit_log
-- ──────────────────────────────────────────────────────────────
create table audit_log (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references profiles(id) on delete set null,
  entity_type      text not null, -- 'course', 'institute', 'user'
  entity_id        uuid,
  action           text not null, -- 'CREATE', 'UPDATE', 'DELETE'
  detailed_changes jsonb,
  created_at       timestamptz not null default now()
);

-- Immutable table approach
alter table audit_log enable row level security;

-- Admins can read the audit log
create policy "admin reads audit_log"
  on audit_log for select
  using (public.auth_role() = 'admin');

-- Strictly deny updates and deletes for everyone
-- INSERT operations would rely on backend API with service_role key or 
-- a specific postgres function running with SECURITY DEFINER
