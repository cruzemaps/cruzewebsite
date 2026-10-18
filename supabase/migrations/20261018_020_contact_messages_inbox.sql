-- ============================================================================
-- 20261018_020_contact_messages_inbox.sql
--
-- Turns contact_messages (015) into an inbox the admin portal can work through
-- (Messages tab, src/components/admin/MessagesTab.tsx) and posts each new
-- message to Discord through the notify-discord edge function.
--
--   1. Trigger notify_discord_on_contact_message: AFTER INSERT, same form as
--      notify_discord_on_pilot_application and notify_discord_on_loi_signed.
--   2. handled_at / handled_by columns.
--   3. Admins may mark a message handled and nothing else: an UPDATE policy
--      for admins, and UPDATE granted on handled_at and handled_by only.
--      There is still no DELETE policy.
--   4. The public form may insert name, email, organization and message only
--      (what ContactForm.tsx sends). Without this, anyone could insert a
--      message that already looks handled by an admin, or pick its id and
--      created_at.
--   5. public.discord_notifications_sent: one row per Discord post, written by
--      notify-discord with the service role, so a replayed webhook payload
--      never posts twice. No access for anon or authenticated.
--
-- Apply before deploying the new notify-discord (it fails closed without 5).
-- Idempotent.
-- ============================================================================

-- (2) Inbox columns.
alter table public.contact_messages add column if not exists handled_at timestamptz;
alter table public.contact_messages add column if not exists handled_by uuid
  references public.profiles(id) on delete set null;

create index if not exists contact_messages_open_idx on public.contact_messages(created_at desc)
  where handled_at is null;

-- (3) Admins mark messages handled.
drop policy if exists "Admins mark contact messages handled" on public.contact_messages;
create policy "Admins mark contact messages handled" on public.contact_messages
  for update
  using (public.is_admin())
  with check (public.is_admin());

-- (3) and (4) Column-level grants. RLS still decides which rows.
revoke insert, update, delete, truncate on public.contact_messages from anon, authenticated;
grant insert (name, email, organization, message) on public.contact_messages to anon, authenticated;
grant update (handled_at, handled_by) on public.contact_messages to authenticated;

-- (5) Sent-notification ledger for notify-discord.
create table if not exists public.discord_notifications_sent (
  key text primary key check (char_length(key) <= 200),
  sent_at timestamptz not null default now()
);
alter table public.discord_notifications_sent enable row level security;
revoke all on public.discord_notifications_sent from anon, authenticated;
grant select, insert on public.discord_notifications_sent to service_role;

-- (1) Discord alert per new message.
drop trigger if exists notify_discord_on_contact_message on public.contact_messages;
create trigger notify_discord_on_contact_message
  after insert on public.contact_messages
  for each row execute function supabase_functions.http_request(
    'https://zodrljxcwqkjiipobrhs.supabase.co/functions/v1/notify-discord',
    'POST',
    '{"Content-type":"application/json"}',
    '{}',
    '1000'
  );

-- Make PostgREST pick up the new columns straight away.
notify pgrst, 'reload schema';

-- ----------------------------------------------------------------------------
-- Verify after applying (SQL editor), all read-only:
--   select column_name, data_type from information_schema.columns
--    where table_schema = 'public' and table_name = 'contact_messages' order by ordinal_position;
--     -> handled_at timestamptz, handled_by uuid at the end
--   select grantee, privilege_type, column_name from information_schema.column_privileges
--    where table_schema = 'public' and table_name = 'contact_messages'
--      and grantee in ('anon', 'authenticated') and privilege_type in ('INSERT', 'UPDATE')
--    order by 1, 2, 3;
--     -> INSERT on name, email, organization, message for both roles
--     -> UPDATE on handled_at, handled_by for authenticated only
--   select polname, polcmd from pg_policy where polrelid = 'public.contact_messages'::regclass;
--     -> insert (anyone), select (admins), update (admins); no delete
--   select tgname, pg_get_triggerdef(oid) from pg_trigger
--    where tgname like 'notify_discord%' order by 1;
--     -> three triggers, all calling .../functions/v1/notify-discord
--   select relrowsecurity, relacl from pg_class where oid = 'public.discord_notifications_sent'::regclass;
--     -> true, no anon or authenticated entries
-- ----------------------------------------------------------------------------
