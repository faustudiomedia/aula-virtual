-- ============================================================
-- MAVIC – Patch: Prevent Privilege Escalation
-- ============================================================

-- Drop the overly permissive update policy
drop policy if exists "update own profile" on profiles;

-- Recreate policy ensuring users can only update their own profile
create policy "update own profile"
  on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Prevent users from elevating their role or changing their institute manually
create or replace function public.prevent_profile_escalation()
returns trigger language plpgsql security definer as $$
begin
  -- If the user performing the update is NOT an admin, block role and institute changes
  if (public.auth_role() != 'admin') then
    -- Revert role and institute_id to their original values
    new.role = old.role;
    new.institute_id = old.institute_id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_profile_update on profiles;
create trigger on_profile_update
  before update on profiles
  for each row execute procedure public.prevent_profile_escalation();
