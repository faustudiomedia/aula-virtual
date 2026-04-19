-- ============================================================
-- MAVIC – Patch: Enrollments RLS & Storage Buckets
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. Enrollments RLS Fix (Insert & Update capabilities for Students)
-- ──────────────────────────────────────────────────────────────

-- Allow a student to enroll themselves into a course 
create policy "student inserts own enrollment"
  on enrollments for insert
  with check (student_id = auth.uid());

-- Allow a student to update their own progress (and only their own progress)
create policy "student updates own enrollment progress"
  on enrollments for update
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

-- ──────────────────────────────────────────────────────────────
-- 2. Storage Bucket Creation and RLS
-- ──────────────────────────────────────────────────────────────

-- Ensure the 'materials' bucket exists for public file servicing
insert into storage.buckets (id, name, public) 
values ('materials', 'materials', true)
on conflict (id) do update set public = true;

-- Enforce Security Policies on Storage Objects
-- Since this modifies the core 'storage.objects' table, we use the storage schema

-- Public access: anyone can download the materials
create policy "Public allowed to read materials"
  on storage.objects for select
  using (bucket_id = 'materials');

-- Teachers and Admin can Insert files to the "materials" bucket
create policy "Teachers and Admins can upload materials"
  on storage.objects for insert
  with check (
    bucket_id = 'materials'
    -- Ensure user is authenticated and part of the allowed roles
    and (public.auth_role() = 'admin' or public.auth_role() = 'profesor')
  );

-- Teachers and Admin can Update/Delete files
create policy "Teachers and Admins can manage materials"
  on storage.objects for update
  using (
    bucket_id = 'materials'
    and (public.auth_role() = 'admin' or public.auth_role() = 'profesor')
  );

create policy "Teachers and Admins can delete materials"
  on storage.objects for delete
  using (
    bucket_id = 'materials'
    and (public.auth_role() = 'admin' or public.auth_role() = 'profesor')
  );
