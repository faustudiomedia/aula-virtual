create table if not exists calendar_events (
  id           uuid        default gen_random_uuid() primary key,
  institute_id uuid        references institutes(id) on delete cascade,
  created_by   uuid        references profiles(id) on delete set null,
  title        text        not null,
  description  text,
  event_date   date        not null,
  event_time   time,
  color        text        not null default '#1A56DB',
  created_at   timestamptz default now()
);

create index if not exists calendar_events_institute_idx on calendar_events(institute_id);
create index if not exists calendar_events_date_idx      on calendar_events(event_date);

alter table calendar_events enable row level security;

-- All members of the institute can read events
create policy "institute members read events"
  on calendar_events for select
  using (
    institute_id in (
      select institute_id from profiles where id = auth.uid()
    )
  );

-- Professors and admins can create events
create policy "staff create events"
  on calendar_events for insert
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from profiles
      where id = auth.uid()
        and role in ('profesor', 'admin', 'super_admin')
    )
  );

-- Only creator or admin can delete
create policy "staff delete own events"
  on calendar_events for delete
  using (
    created_by = auth.uid()
    or exists (
      select 1 from profiles
      where id = auth.uid()
        and role in ('admin', 'super_admin')
    )
  );
