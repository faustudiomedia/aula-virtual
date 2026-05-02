-- Allow any authenticated user to read basic profile info of users
-- within the same institute (needed for messaging, course views, etc.)

create policy "users read same institute profiles"
  on profiles for select
  using (
    institute_id = auth_institute()
    and auth.uid() is not null
  );

-- Allow reading profiles of message participants
-- (covers cross-institute messaging if ever needed)
create policy "users read message participants"
  on profiles for select
  using (
    auth.uid() is not null
    and (
      id in (select recipient_id from messages where sender_id = auth.uid())
      or id in (select sender_id from messages where recipient_id = auth.uid())
    )
  );
