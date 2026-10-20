-- Server-side test for migration 020 (contact messages inbox).
--
-- Builds what 020 needs as it is live on 2026-10-18 (Supabase's default table
-- grants, profiles, is_admin, a stub of supabase_functions.http_request) and
-- applies 015 for the table itself. Shows the gap 020 closes, applies 020
-- twice and checks:
--   * anon can send a message (the four columns ContactForm.tsx sends), the
--     Discord trigger fires once, and anon and non-admins read 0 rows
--   * nobody but the default can set id, created_at, handled_at or handled_by
--     on insert
--   * anon cannot update or delete; a non-admin updates 0 rows
--   * an admin can set handled_at and handled_by but cannot change name,
--     email, organization or message, and cannot delete
--   * marking handled does not fire the trigger
--   * discord_notifications_sent is closed to anon and authenticated and
--     rejects a second row with the same key
--
-- Runs against a throwaway Postgres with a stub of the Supabase auth schema.
-- Never run it against a real project. From the repo root:
--
--   docker run -d --rm --name t20pg -e POSTGRES_PASSWORD=x postgres:15-alpine
--   docker cp supabase/migrations/20260617_015_contact_messages.sql t20pg:/tmp/015.sql
--   docker cp supabase/migrations/20261018_020_contact_messages_inbox.sql t20pg:/tmp/020.sql
--   docker cp supabase/tests/020_contact_messages_inbox.test.sql t20pg:/tmp/test.sql
--   docker exec t20pg psql -U postgres -v ON_ERROR_STOP=1 -v base=/tmp/015.sql -v mig=/tmp/020.sql -f /tmp/test.sql
--   docker rm -f t20pg
--
-- Prints "contact_messages_inbox: all checks passed" or stops at the first failure.
\set QUIET on
\o /dev/null

-- ---------------------------------------------------------------------------
-- Supabase stand-ins. Roles are cluster-wide and CI runs other tests first.
-- ---------------------------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin; end if;
end $$;
alter role service_role bypassrls;   -- as live
alter default privileges for role postgres in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges for role postgres in schema public grant all on functions to anon, authenticated, service_role;

create schema auth;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;

create table public.profiles (
  id uuid primary key references auth.users(id),
  role text not null default 'fleet_owner', status text default 'pending', email text);
create function public.is_admin() returns boolean language sql stable security definer
  set search_path = public, pg_temp as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and status = 'active');
$$;

-- Database webhooks: a stand-in for supabase_functions.http_request that
-- records each call instead of sending it. Security definer, as live.
create schema supabase_functions;
grant usage on schema supabase_functions to anon, authenticated, service_role;
create table supabase_functions.calls (
  id bigserial primary key, tbl text, op text, url text, method text, headers text, params text, timeout text);
create function supabase_functions.http_request() returns trigger language plpgsql security definer
  set search_path = supabase_functions as $$
begin
  insert into supabase_functions.calls (tbl, op, url, method, headers, params, timeout)
  values (tg_table_name, tg_op, tg_argv[0], tg_argv[1], tg_argv[2], tg_argv[3], tg_argv[4]);
  return new;
end $$;

insert into auth.users values
  ('00000000-0000-0000-0000-00000000000a'), ('00000000-0000-0000-0000-00000000000f');
insert into public.profiles values
  ('00000000-0000-0000-0000-00000000000a', 'admin', 'active', 'admin@example.com'),
  ('00000000-0000-0000-0000-00000000000f', 'fleet_owner', 'active', 'f@example.com');

-- The table as 015 made it.
\i :base

-- ---------------------------------------------------------------------------
-- Helpers. Run SQL as a role and a JWT subject, expecting success or an error.
-- ---------------------------------------------------------------------------
create function pg_temp.ok(p_cond boolean, p_what text) returns void language plpgsql as $$
begin
  if p_cond is not true then raise exception 'FAILED: %', p_what; end if;
end $$;

create function pg_temp.run_as(p_sql text, p_role text, p_sub text) returns text language plpgsql as $$
declare v text;
begin
  execute format('set local role %I', p_role);
  perform set_config('request.jwt.claim.sub', coalesce(p_sub, ''), true);
  execute p_sql into v;
  execute 'reset role';
  perform set_config('request.jwt.claim.sub', '', true);
  return v;
end $$;

-- Rows affected by an INSERT, UPDATE or DELETE run as the given role.
create function pg_temp.exec_as(p_sql text, p_role text, p_sub text) returns bigint language plpgsql as $$
declare n bigint;
begin
  execute format('set local role %I', p_role);
  perform set_config('request.jwt.claim.sub', coalesce(p_sub, ''), true);
  execute p_sql;
  get diagnostics n = row_count;
  execute 'reset role';
  perform set_config('request.jwt.claim.sub', '', true);
  return n;
end $$;

create function pg_temp.fails_as(p_sql text, p_role text, p_sub text, p_state text, p_msg text) returns void language plpgsql as $$
declare v_state text; v_msg text;
begin
  execute format('set local role %I', p_role);
  perform set_config('request.jwt.claim.sub', coalesce(p_sub, ''), true);
  begin
    execute p_sql;
  exception when others then
    get stacked diagnostics v_state = returned_sqlstate, v_msg = message_text;
    execute 'reset role';
    perform set_config('request.jwt.claim.sub', '', true);
    if v_state <> p_state or v_msg not like p_msg then
      raise exception 'FAILED: % as % (%) gave % "%", expected % "%"', p_sql, p_role, p_sub, v_state, v_msg, p_state, p_msg;
    end if;
    return;
  end;
  execute 'reset role';
  raise exception 'FAILED: expected an error from % as % (%)', p_sql, p_role, p_sub;
end $$;

\set admin '''00000000-0000-0000-0000-00000000000a'''
\set fleet '''00000000-0000-0000-0000-00000000000f'''

-- ---------------------------------------------------------------------------
-- Before 020: anon can pick the id and created_at of a message.
-- ---------------------------------------------------------------------------
begin;
select pg_temp.ok(pg_temp.exec_as($q$insert into public.contact_messages (id, name, email, message, created_at)
  values ('40000000-0000-0000-0000-000000000001', 'x', 'x@x', 'x', '2100-01-01')$q$, 'anon', null) = 1,
  'before 020: anon could set id and created_at');
rollback;

-- ---------------------------------------------------------------------------
-- Apply 020 twice to prove it is idempotent.
-- ---------------------------------------------------------------------------
\i :mig
\i :mig

-- ---------------------------------------------------------------------------
-- Structure.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  perform pg_temp.ok((select count(*) from pg_trigger where tgrelid = 'public.contact_messages'::regclass and not tgisinternal) = 1,
    'exactly one trigger on contact_messages');
  select pg_get_triggerdef(oid) into t from pg_trigger where tgname = 'notify_discord_on_contact_message';
  perform pg_temp.ok(t like 'CREATE TRIGGER notify_discord_on_contact_message AFTER INSERT ON public.contact_messages FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request(%', 'trigger shape: ' || coalesce(t, 'missing'));
  perform pg_temp.ok(t like $t$%('https://zodrljxcwqkjiipobrhs.supabase.co/functions/v1/notify-discord', 'POST', '{"Content-type":"application/json"}', '{}', '1000')$t$,
    'trigger arguments match the other two webhooks: ' || t);

  perform pg_temp.ok((select count(*) from pg_policy where polrelid = 'public.contact_messages'::regclass and polcmd = 'w') = 1,
    'one update policy');
  perform pg_temp.ok(not exists (select 1 from pg_policy where polrelid = 'public.contact_messages'::regclass and polcmd = 'd'),
    'no delete policy');

  foreach t in array array['name', 'email', 'organization', 'message'] loop
    perform pg_temp.ok(has_column_privilege('anon', 'public.contact_messages', t, 'INSERT'), 'anon inserts ' || t);
    perform pg_temp.ok(has_column_privilege('authenticated', 'public.contact_messages', t, 'INSERT'), 'authenticated inserts ' || t);
    perform pg_temp.ok(not has_column_privilege('authenticated', 'public.contact_messages', t, 'UPDATE'), 'nobody updates ' || t);
  end loop;
  foreach t in array array['id', 'created_at', 'handled_at', 'handled_by'] loop
    perform pg_temp.ok(not has_column_privilege('anon', 'public.contact_messages', t, 'INSERT'), 'anon must not insert ' || t);
    perform pg_temp.ok(not has_column_privilege('authenticated', 'public.contact_messages', t, 'INSERT'), 'authenticated must not insert ' || t);
  end loop;
  perform pg_temp.ok(has_column_privilege('authenticated', 'public.contact_messages', 'handled_at', 'UPDATE'), 'authenticated updates handled_at');
  perform pg_temp.ok(has_column_privilege('authenticated', 'public.contact_messages', 'handled_by', 'UPDATE'), 'authenticated updates handled_by');
  perform pg_temp.ok(not has_column_privilege('anon', 'public.contact_messages', 'handled_at', 'UPDATE'), 'anon must not update');
  perform pg_temp.ok(not has_table_privilege('anon', 'public.contact_messages', 'DELETE'), 'anon must not delete');
  perform pg_temp.ok(not has_table_privilege('authenticated', 'public.contact_messages', 'DELETE'), 'authenticated must not delete');
  perform pg_temp.ok(not has_table_privilege('anon', 'public.contact_messages', 'TRUNCATE'), 'anon must not truncate');
end $$;

-- ---------------------------------------------------------------------------
-- The public form.
-- ---------------------------------------------------------------------------
begin;
-- Exactly what ContactForm.tsx sends.
select pg_temp.ok(pg_temp.exec_as($q$insert into public.contact_messages (name, email, organization, message)
  values ('Dana Lee', 'dana@example.com', 'Acme Freight', 'Hello' || chr(10) || 'We run 40 trucks.')$q$, 'anon', null) = 1,
  'anon sends a message');
select pg_temp.ok(pg_temp.exec_as($q$insert into public.contact_messages (name, email, organization, message)
  values ('Sam', 'sam@example.com', null, 'Signed-in visitors can write too')$q$, 'authenticated', :fleet) = 1,
  'a signed-in visitor sends a message');
select pg_temp.ok((select count(*) from supabase_functions.calls) = 2, 'trigger fired once per message');
select pg_temp.ok((select bool_and(tbl = 'contact_messages' and op = 'INSERT' and method = 'POST'
                     and url = 'https://zodrljxcwqkjiipobrhs.supabase.co/functions/v1/notify-discord')
                   from supabase_functions.calls), 'trigger posts the insert to notify-discord');
select pg_temp.ok((select bool_and(created_at > now() - interval '1 minute' and handled_at is null and handled_by is null)
                   from public.contact_messages), 'new messages are open and dated by the server');

-- Write-only for the public.
select pg_temp.ok(pg_temp.run_as('select count(*)::text from public.contact_messages', 'anon', null) = '0', 'anon reads 0 rows');
select pg_temp.ok(pg_temp.run_as('select count(*)::text from public.contact_messages', 'authenticated', :fleet) = '0', 'non-admin reads 0 rows');
select pg_temp.ok(pg_temp.run_as('select count(*)::text from public.contact_messages', 'authenticated', :admin) = '2', 'admin reads every row');

-- Nobody picks id, created_at or the handled columns on insert.
select pg_temp.fails_as($q$insert into public.contact_messages (name, email, message, handled_at) values ('x', 'x@x', 'x', now())$q$,
  'anon', null, '42501', 'permission denied%');
select pg_temp.fails_as($q$insert into public.contact_messages (name, email, message, handled_by) values ('x', 'x@x', 'x', '00000000-0000-0000-0000-00000000000a')$q$,
  'anon', null, '42501', 'permission denied%');
select pg_temp.fails_as($q$insert into public.contact_messages (id, name, email, message) values ('40000000-0000-0000-0000-000000000002', 'x', 'x@x', 'x')$q$,
  'anon', null, '42501', 'permission denied%');
select pg_temp.fails_as($q$insert into public.contact_messages (name, email, message, created_at) values ('x', 'x@x', 'x', '2100-01-01')$q$,
  'anon', null, '42501', 'permission denied%');
select pg_temp.fails_as($q$insert into public.contact_messages (name, email, message, handled_at) values ('x', 'x@x', 'x', now())$q$,
  'authenticated', :admin, '42501', 'permission denied%');
commit;

-- ---------------------------------------------------------------------------
-- Updates and deletes.
-- ---------------------------------------------------------------------------
begin;
select pg_temp.fails_as($q$update public.contact_messages set handled_at = now()$q$, 'anon', null, '42501', 'permission denied%');
select pg_temp.fails_as($q$update public.contact_messages set message = 'changed'$q$, 'anon', null, '42501', 'permission denied%');
select pg_temp.fails_as($q$delete from public.contact_messages$q$, 'anon', null, '42501', 'permission denied%');

-- A signed-in non-admin has the column grant but RLS matches no rows.
select pg_temp.ok(pg_temp.exec_as($q$update public.contact_messages set handled_at = now(), handled_by = auth.uid()$q$,
  'authenticated', :fleet) = 0, 'non-admin marks nothing handled');
select pg_temp.fails_as($q$update public.contact_messages set message = 'changed'$q$, 'authenticated', :fleet, '42501', 'permission denied%');
select pg_temp.fails_as($q$delete from public.contact_messages$q$, 'authenticated', :fleet, '42501', 'permission denied%');
select pg_temp.ok((select count(*) from public.contact_messages where handled_at is null) = 2, 'still open after non-admin attempts');

-- An admin marks one handled, the way MessagesTab.tsx does.
select pg_temp.ok(pg_temp.exec_as($q$update public.contact_messages set handled_at = now(), handled_by = auth.uid()
  where name = 'Dana Lee' and handled_at is null$q$, 'authenticated', :admin) = 1, 'admin marks a message handled');
select pg_temp.ok((select handled_by = '00000000-0000-0000-0000-00000000000a' and handled_at is not null
                   from public.contact_messages where name = 'Dana Lee'), 'handled_at and handled_by set');
select pg_temp.ok(pg_temp.run_as($q$select count(*)::text from public.contact_messages where handled_at is not null$q$,
  'authenticated', :admin) = '1', 'admin reads the handled state');
-- ...and can reopen it.
select pg_temp.ok(pg_temp.exec_as($q$update public.contact_messages set handled_at = null, handled_by = null where name = 'Dana Lee'$q$,
  'authenticated', :admin) = 1, 'admin can reopen a message');

-- But cannot change what was sent, or delete it.
select pg_temp.fails_as($q$update public.contact_messages set name = 'changed'$q$, 'authenticated', :admin, '42501', 'permission denied%');
select pg_temp.fails_as($q$update public.contact_messages set email = 'changed@x'$q$, 'authenticated', :admin, '42501', 'permission denied%');
select pg_temp.fails_as($q$update public.contact_messages set organization = 'changed'$q$, 'authenticated', :admin, '42501', 'permission denied%');
select pg_temp.fails_as($q$update public.contact_messages set message = 'changed'$q$, 'authenticated', :admin, '42501', 'permission denied%');
select pg_temp.fails_as($q$update public.contact_messages set created_at = now() - interval '1 day'$q$, 'authenticated', :admin, '42501', 'permission denied%');
select pg_temp.fails_as($q$delete from public.contact_messages$q$, 'authenticated', :admin, '42501', 'permission denied%');
select pg_temp.ok((select count(*) from public.contact_messages where message = 'changed' or name = 'changed') = 0, 'content unchanged');

-- Updates do not post to Discord.
select pg_temp.ok((select count(*) from supabase_functions.calls) = 2, 'updates did not fire the trigger');
commit;

-- handled_by follows the admin's profile: deleting it clears the pointer.
begin;
update public.contact_messages set handled_at = now(), handled_by = '00000000-0000-0000-0000-00000000000a';
delete from public.profiles where id = '00000000-0000-0000-0000-00000000000a';
select pg_temp.ok((select bool_and(handled_by is null and handled_at is not null) from public.contact_messages),
  'handled_by set to null when the profile is deleted');
rollback;

-- ---------------------------------------------------------------------------
-- discord_notifications_sent: service role only, one row per key.
-- ---------------------------------------------------------------------------
begin;
select pg_temp.fails_as($q$select count(*) from public.discord_notifications_sent$q$, 'anon', null, '42501', 'permission denied%');
select pg_temp.fails_as($q$insert into public.discord_notifications_sent (key) values ('contact_messages:x')$q$, 'anon', null, '42501', 'permission denied%');
select pg_temp.fails_as($q$select count(*) from public.discord_notifications_sent$q$, 'authenticated', :admin, '42501', 'permission denied%');
select pg_temp.fails_as($q$insert into public.discord_notifications_sent (key) values ('contact_messages:x')$q$, 'authenticated', :admin, '42501', 'permission denied%');
select pg_temp.ok(pg_temp.exec_as($q$insert into public.discord_notifications_sent (key) values ('contact_messages:x')$q$, 'service_role', null) = 1,
  'service role records a notification');
select pg_temp.fails_as($q$insert into public.discord_notifications_sent (key) values ('contact_messages:x')$q$, 'service_role', null, '23505', '%');
select pg_temp.ok(pg_temp.run_as($q$select count(*)::text from public.discord_notifications_sent$q$, 'service_role', null) = '1',
  'service role reads the ledger');
commit;

\o
\echo contact_messages_inbox: all checks passed
