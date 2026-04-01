-- ============================================================
-- MAVIC – Initial Schema
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ──────────────────────────────────────────────────────────────
-- institutes
-- ──────────────────────────────────────────────────────────────
create table institutes (
  id             uuid primary key default uuid_generate_v4(),
  name           text not null,
  slug           text not null unique,
  domain         text unique,
  primary_color  text not null default '#1A56DB',
  secondary_color text not null default '#38BDF8',
  logo_url       text,
  active         boolean not null default true,
  created_at     timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────────
-- profiles  (extends auth.users)
-- ──────────────────────────────────────────────────────────────
create type user_role as enum ('alumno', 'profesor', 'admin');

create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  full_name    text not null default '',
  role         user_role not null default 'alumno',
  institute_id uuid references institutes(id) on delete set null,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'alumno')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ──────────────────────────────────────────────────────────────
-- courses
-- ──────────────────────────────────────────────────────────────
create table courses (
  id           uuid primary key default uuid_generate_v4(),
  title        text not null,
  description  text,
  institute_id uuid not null references institutes(id) on delete cascade,
  teacher_id   uuid not null references profiles(id) on delete cascade,
  cover_url    text,
  published    boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────────
-- materials
-- ──────────────────────────────────────────────────────────────
create table materials (
  id          uuid primary key default uuid_generate_v4(),
  course_id   uuid not null references courses(id) on delete cascade,
  title       text not null,
  description text,
  file_url    text,
  file_type   text,        -- 'pdf', 'video', 'link', etc.
  order_index int not null default 0,
  created_at  timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────────
-- enrollments
-- ──────────────────────────────────────────────────────────────
create table enrollments (
  id          uuid primary key default uuid_generate_v4(),
  student_id  uuid not null references profiles(id) on delete cascade,
  course_id   uuid not null references courses(id) on delete cascade,
  progress    int not null default 0 check (progress between 0 and 100),
  completed   boolean not null default false,
  enrolled_at timestamptz not null default now(),
  unique (student_id, course_id)
);

-- ──────────────────────────────────────────────────────────────
-- Row Level Security
-- ──────────────────────────────────────────────────────────────
alter table institutes   enable row level security;
alter table profiles     enable row level security;
alter table courses      enable row level security;
alter table materials    enable row level security;
alter table enrollments  enable row level security;

-- Helper: get current user role
create or replace function auth_role() returns user_role language sql security definer as $$
  select role from profiles where id = auth.uid()
$$;

-- Helper: get current user institute
create or replace function auth_institute() returns uuid language sql security definer as $$
  select institute_id from profiles where id = auth.uid()
$$;

-- ── institutes ───────────────────────────────────────────────
-- Everyone authenticated can read their own institute
create policy "read own institute"
  on institutes for select
  using (id = auth_institute());

-- Admins can read all institutes
create policy "admin read all institutes"
  on institutes for select
  using (auth_role() = 'admin');

-- Admins can insert/update/delete institutes
create policy "admin manage institutes"
  on institutes for all
  using (auth_role() = 'admin');

-- ── profiles ────────────────────────────────────────────────
create policy "read own profile"
  on profiles for select
  using (id = auth.uid());

create policy "update own profile"
  on profiles for update
  using (id = auth.uid());

-- Professors can read their students' profiles (same institute)
create policy "professor reads students"
  on profiles for select
  using (
    auth_role() = 'profesor'
    and institute_id = auth_institute()
  );

-- Admins can read all profiles
create policy "admin reads all profiles"
  on profiles for select
  using (auth_role() = 'admin');

-- Admins can manage profiles
create policy "admin manages profiles"
  on profiles for all
  using (auth_role() = 'admin');

-- ── courses ─────────────────────────────────────────────────
-- Students: see published courses of their institute
create policy "student reads published courses"
  on courses for select
  using (
    published = true
    and institute_id = auth_institute()
  );

-- Teachers: manage their own courses
create policy "teacher manages own courses"
  on courses for all
  using (teacher_id = auth.uid());

-- Admins: manage all courses
create policy "admin manages all courses"
  on courses for all
  using (auth_role() = 'admin');

-- ── materials ───────────────────────────────────────────────
create policy "read materials of enrolled course"
  on materials for select
  using (
    exists (
      select 1 from enrollments e
      where e.course_id = materials.course_id
        and e.student_id = auth.uid()
    )
  );

create policy "teacher manages own materials"
  on materials for all
  using (
    exists (
      select 1 from courses c
      where c.id = materials.course_id
        and c.teacher_id = auth.uid()
    )
  );

create policy "admin manages all materials"
  on materials for all
  using (auth_role() = 'admin');

-- ── enrollments ─────────────────────────────────────────────
create policy "student reads own enrollments"
  on enrollments for select
  using (student_id = auth.uid());

create policy "teacher reads enrollments in own courses"
  on enrollments for select
  using (
    exists (
      select 1 from courses c
      where c.id = enrollments.course_id
        and c.teacher_id = auth.uid()
    )
  );

create policy "admin reads all enrollments"
  on enrollments for select
  using (auth_role() = 'admin');

-- ──────────────────────────────────────────────────────────────
-- Seed: default MAVIC institute
-- ──────────────────────────────────────────────────────────────
insert into institutes (name, slug, primary_color, secondary_color)
values ('MAVIC', 'mavic', '#1A56DB', '#38BDF8');
