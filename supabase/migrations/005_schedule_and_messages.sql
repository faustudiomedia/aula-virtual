-- ============================================================
-- 005 – Schedule field + Messages system
-- ============================================================

-- ── Agregar campo de horario a cursos ───────────────────────
alter table courses add column if not exists schedule text;

-- ── Sistema de mensajería ───────────────────────────────────
create table if not exists messages (
  id           uuid primary key default uuid_generate_v4(),
  sender_id    uuid not null references profiles(id) on delete cascade,
  recipient_id uuid not null references profiles(id) on delete cascade,
  subject      text not null default '',
  body         text not null,
  is_read      boolean not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists idx_messages_recipient on messages(recipient_id, is_read, created_at desc);
create index if not exists idx_messages_sender on messages(sender_id, created_at desc);

-- ── RLS para mensajes ───────────────────────────────────────
alter table messages enable row level security;

-- Cada usuario puede leer sus mensajes (enviados o recibidos)
create policy "read own messages"
  on messages for select
  using (sender_id = auth.uid() or recipient_id = auth.uid());

-- Cualquier usuario autenticado puede enviar mensajes
create policy "send messages"
  on messages for insert
  with check (sender_id = auth.uid());

-- Solo el destinatario puede marcar como leído
create policy "update own received messages"
  on messages for update
  using (recipient_id = auth.uid());

-- Solo el remitente puede borrar sus mensajes enviados
create policy "delete own sent messages"
  on messages for delete
  using (sender_id = auth.uid());
