-- ── notifications table ─────────────────────────────────────────
create table if not exists notifications (
  id          uuid        default gen_random_uuid() primary key,
  user_id     uuid        not null references profiles(id) on delete cascade,
  type        text        not null default 'general',
  title       text        not null,
  message     text,
  link_url    text,
  is_read     boolean     not null default false,
  created_at  timestamptz default now()
);

create index if not exists notifications_user_id_idx on notifications(user_id);
create index if not exists notifications_is_read_idx  on notifications(user_id, is_read);

alter table notifications enable row level security;

create policy "users read own notifications"
  on notifications for select
  using (user_id = auth.uid());

create policy "users update own notifications"
  on notifications for update
  using (user_id = auth.uid());

-- system triggers insert notifications (security definer bypasses RLS)
create policy "service insert notifications"
  on notifications for insert
  with check (true);

-- ── trigger: new message → notify recipient ─────────────────────
create or replace function notify_new_message()
returns trigger language plpgsql security definer as $$
begin
  insert into notifications (user_id, type, title, message, link_url)
  select
    NEW.recipient_id,
    'message',
    'Nuevo mensaje de ' || coalesce(p.full_name, 'alguien'),
    left(NEW.content, 120),
    '/dashboard/messages/' || NEW.sender_id::text
  from profiles p
  where p.id = NEW.sender_id;
  return NEW;
end;
$$;

drop trigger if exists on_new_message on messages;
create trigger on_new_message
  after insert on messages
  for each row execute function notify_new_message();

-- ── trigger: certificate request → notify teacher ────────────────
create or replace function notify_certificate_request()
returns trigger language plpgsql security definer as $$
declare
  v_teacher_id   uuid;
  v_student_name text;
  v_course_title text;
begin
  select c.teacher_id, p.full_name, c.title
    into v_teacher_id, v_student_name, v_course_title
    from courses c
    join profiles p on p.id = NEW.student_id
   where c.id = NEW.course_id;

  if v_teacher_id is not null then
    insert into notifications (user_id, type, title, message, link_url)
    values (
      v_teacher_id,
      'certificate_request',
      'Nueva solicitud de certificado',
      coalesce(v_student_name, 'Un alumno') || ' solicitó un certificado para "' || coalesce(v_course_title, 'un curso') || '"',
      '/dashboard/teacher/certificates'
    );
  end if;
  return NEW;
end;
$$;

drop trigger if exists on_certificate_request on certificate_requests;
create trigger on_certificate_request
  after insert on certificate_requests
  for each row execute function notify_certificate_request();

-- ── trigger: certificate approved / rejected → notify student ────
create or replace function notify_certificate_status()
returns trigger language plpgsql security definer as $$
begin
  if NEW.status = 'approved' and OLD.status <> 'approved' then
    insert into notifications (user_id, type, title, message, link_url)
    values (
      NEW.student_id,
      'certificate_approved',
      '¡Certificado aprobado!',
      'Tu certificado fue aprobado. Ya podés verlo y compartirlo.',
      '/certificates/' || NEW.certificate_code
    );
  elsif NEW.status = 'rejected' and OLD.status <> 'rejected' then
    insert into notifications (user_id, type, title, message, link_url)
    values (
      NEW.student_id,
      'certificate_rejected',
      'Certificado rechazado',
      'Tu solicitud de certificado fue rechazada. Contactá a tu profesor.',
      '/dashboard/student/courses'
    );
  end if;
  return NEW;
end;
$$;

drop trigger if exists on_certificate_status_change on certificate_requests;
create trigger on_certificate_status_change
  after update on certificate_requests
  for each row execute function notify_certificate_status();

-- Enable realtime for notifications
alter publication supabase_realtime add table notifications;
