-- Server-side test for migration 022 (accept_invitation hardening and no
-- direct profile writes for the API roles).
--
-- Rebuilds the parts of the live CruzeMaps Web Admin schema that 022 touches,
-- as they are on 2026-10-22 after 021: profiles, invitations, role_history and
-- organizations with their live columns, constraints, policies and grants,
-- and the live body of accept_invitation. Then it shows the live hole, applies
-- 022 twice and checks:
--   * anon and authenticated can no longer insert, delete or truncate
--     profiles, the self-insert policy is gone, and a user can still update
--     their own first and last name
--   * accept_invitation refuses anon, a caller with no user, an unknown token,
--     an expired invitation, a used invitation and a different email, each
--     with its own message
--   * the invited person (email in a different case) succeeds: role,
--     organization and status set, the invitation marked used by them, and a
--     role_history row with their real previous role and status
--   * a second accept is refused; the invitation row is locked (FOR UPDATE)
--   * the confirmed-email switch is off by default (an unconfirmed address
--     can accept) and, when flipped on, refuses that caller
--   * grants and search_path of the two functions
--
-- Runs against a throwaway Postgres. Never run it against a real project.
-- From the repo root:
--
--   docker run -d --rm --name t22pg -e POSTGRES_PASSWORD=x postgres:17
--   docker cp supabase/migrations/20261022_022_invites_and_profiles.sql t22pg:/tmp/022.sql
--   docker cp supabase/tests/022_invites_and_profiles.test.sql t22pg:/tmp/test.sql
--   docker exec t22pg psql -U postgres -v ON_ERROR_STOP=1 -v mig=/tmp/022.sql -f /tmp/test.sql
--   docker rm -f t22pg
--
-- Prints "invites_and_profiles: all checks passed" or stops at the first failure.
\set QUIET on
\o /dev/null
set client_min_messages = warning;

-- ---------------------------------------------------------------------------
-- Supabase stand-ins. Roles are cluster-wide and CI runs other tests first.
-- ---------------------------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin; end if;
end $$;

create extension if not exists pgcrypto;

create schema auth;
create table auth.users (id uuid primary key, email text, email_confirmed_at timestamptz);
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Live tables (columns and constraints as on 2026-10-22).
-- ---------------------------------------------------------------------------
create table public.organizations (id uuid primary key default gen_random_uuid(), name text);

create table public.profiles (
  id uuid not null primary key references auth.users(id),
  role text not null default 'fleet_owner' check (role = any (array['fleet_owner', 'city_operator', 'admin'])),
  created_at timestamptz not null default timezone('utc', now()),
  requested_role text check (requested_role = any (array['admin', 'fleet_owner', 'city_operator'])),
  organization_id uuid references public.organizations(id),
  status text default 'pending' check (status = any (array['pending', 'active', 'suspended', 'archived'])),
  invited_by uuid references public.profiles(id),
  last_active_at timestamptz,
  email text,
  first_name text,
  last_name text
);

create table public.invitations (
  id uuid not null primary key default gen_random_uuid(),
  email text not null,
  role text not null check (role = any (array['admin', 'fleet_owner', 'city_operator'])),
  organization_id uuid references public.organizations(id),
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  invited_by uuid not null references public.profiles(id),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  accepted_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

create table public.role_history (
  id uuid not null primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  old_role text,
  new_role text not null,
  old_status text,
  new_status text,
  changed_by uuid not null references public.profiles(id) on delete set null,
  reason text not null,
  changed_at timestamptz default now()
);

create function public.is_admin() returns boolean
  language sql stable security definer set search_path = public, pg_temp as
  $$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and status = 'active') $$;
revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- profiles: live RLS, policies and grants.
alter table public.profiles enable row level security;
create policy "Admins can update all profiles" on public.profiles for update to public
  using (public.is_admin()) with check (public.is_admin());
create policy "Users can insert their own profile." on public.profiles for insert to public
  with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update to public
  using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users can view own profile" on public.profiles for select to public
  using ((auth.uid() = id) or public.is_admin());
grant select, insert, delete, truncate, references, trigger on public.profiles to anon, authenticated;
grant update (first_name, last_name) on public.profiles to authenticated;
grant all on public.profiles to service_role;

-- accept_invitation as live (after 021's grants).
create or replace function public.accept_invitation(invite_token text)
 returns text language plpgsql security definer set search_path to 'public'
as $function$
declare
  v_invite public.invitations%rowtype;
  v_caller uuid := auth.uid();
  v_caller_email text;
begin
  if v_caller is null then
    raise exception 'Must be authenticated to accept an invitation';
  end if;
  select email into v_caller_email from auth.users where id = v_caller;
  select * into v_invite from public.invitations where token = invite_token;
  if v_invite.id is null then raise exception 'Invitation not found'; end if;
  if v_invite.accepted_at is not null then raise exception 'Already accepted'; end if;
  if v_invite.expires_at < now() then raise exception 'Invitation expired'; end if;
  if v_caller_email is null or lower(v_invite.email) <> lower(v_caller_email) then
    raise exception 'This invitation was issued to a different email address';
  end if;
  update public.profiles
  set role = v_invite.role, organization_id = v_invite.organization_id,
      invited_by = v_invite.invited_by, status = 'active'
  where id = v_caller;
  update public.invitations set accepted_at = now(), accepted_by = v_caller
  where id = v_invite.id;
  insert into public.role_history (user_id, old_role, new_role, new_status, changed_by, reason)
  values (v_caller, 'fleet_owner', v_invite.role, 'active', v_invite.invited_by,
          'Accepted invitation ' || v_invite.id::text);
  return v_invite.role;
end;
$function$;
revoke execute on function public.accept_invitation(text) from public, anon;
grant execute on function public.accept_invitation(text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Helpers: run SQL as an API role with a given auth.uid().
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

-- ---------------------------------------------------------------------------
-- People and invitations.
-- ---------------------------------------------------------------------------
\set admin '''00000000-0000-0000-0000-00000000000a'''
\set invitee '''00000000-0000-0000-0000-0000000000a1'''
\set other '''00000000-0000-0000-0000-0000000000a2'''
\set unconfirmed '''00000000-0000-0000-0000-0000000000a3'''
\set ghost '''00000000-0000-0000-0000-0000000000a4'''

insert into auth.users (id, email, email_confirmed_at) values
  (:admin, 'admin@example.com', now()),
  (:invitee, 'Invitee@Example.com', now()),
  (:other, 'other@example.com', now()),
  (:unconfirmed, 'pending@example.com', null),
  (:ghost, 'ghost@example.com', now());

insert into public.profiles (id, role, status, email) values
  (:admin, 'admin', 'active', 'admin@example.com'),
  (:invitee, 'fleet_owner', 'active', 'Invitee@Example.com'),
  (:other, 'fleet_owner', 'active', 'other@example.com'),
  (:unconfirmed, 'fleet_owner', 'active', 'pending@example.com');
-- :ghost has an auth user and no profile row.

insert into public.organizations (id, name) values ('10000000-0000-0000-0000-000000000001', 'Acme Freight');

insert into public.invitations (email, role, organization_id, token, invited_by, expires_at, accepted_at, accepted_by) values
  ('invitee@example.com', 'city_operator', '10000000-0000-0000-0000-000000000001', 'tok-ok', :admin, now() + interval '7 days', null, null),
  ('invitee@example.com', 'city_operator', null, 'tok-expired', :admin, now() - interval '1 day', null, null),
  ('invitee@example.com', 'city_operator', null, 'tok-used', :admin, now() + interval '7 days', now(), :other),
  ('pending@example.com', 'fleet_owner', null, 'tok-unconfirmed', :admin, now() + interval '7 days', null, null);

-- ---------------------------------------------------------------------------
-- Before 022: a signed-in user without a profile row inserts one as an admin.
-- ---------------------------------------------------------------------------
begin;
select pg_temp.ok(pg_temp.exec_as(format($q$insert into public.profiles (id, role, status) values (%L, 'admin', 'active')$q$, :ghost),
  'authenticated', :ghost) = 1,
  'before 022: a user without a profile could insert one as an active admin');
rollback;

-- ---------------------------------------------------------------------------
-- Apply 022 twice (it must be idempotent).
-- ---------------------------------------------------------------------------
\i :mig
\i :mig

-- ---------------------------------------------------------------------------
-- profiles: no direct inserts, deletes or truncates by the API roles.
-- ---------------------------------------------------------------------------
begin;
select pg_temp.fails_as(format($q$insert into public.profiles (id, role, status) values (%L, 'admin', 'active')$q$, :ghost),
  'authenticated', :ghost, '42501', 'permission denied%');
select pg_temp.fails_as($q$insert into public.profiles (id) values ('00000000-0000-0000-0000-0000000000ff')$q$,
  'anon', null, '42501', 'permission denied%');
select pg_temp.fails_as($q$delete from public.profiles where id = auth.uid()$q$,
  'authenticated', :invitee, '42501', 'permission denied%');
select pg_temp.fails_as($q$truncate public.profiles cascade$q$,
  'authenticated', :invitee, '42501', 'permission denied%');
select pg_temp.ok(pg_temp.exec_as($q$update public.profiles set first_name = 'Ina' where id = auth.uid()$q$,
  'authenticated', :invitee) = 1, 'a user still updates their own first name');
select pg_temp.ok(pg_temp.run_as($q$select count(*)::text from public.profiles$q$, 'authenticated', :invitee) = '1',
  'a user still reads their own profile');
select pg_temp.ok(not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles'
  and policyname = 'Users can insert their own profile.'), 'the self-insert policy is gone');
rollback;

-- ---------------------------------------------------------------------------
-- accept_invitation: each refusal.
-- ---------------------------------------------------------------------------
begin;
select pg_temp.fails_as($q$select public.accept_invitation('tok-ok')$q$, 'anon', null, '42501', 'permission denied%');
select pg_temp.fails_as($q$select public.accept_invitation('tok-ok')$q$, 'authenticated', null, 'P0001',
  'Must be authenticated to accept an invitation');
select pg_temp.fails_as($q$select public.accept_invitation('no-such-token')$q$, 'authenticated', :invitee, 'P0001',
  'Invitation not found');
select pg_temp.fails_as($q$select public.accept_invitation('tok-expired')$q$, 'authenticated', :invitee, 'P0001',
  'Invitation expired');
select pg_temp.fails_as($q$select public.accept_invitation('tok-used')$q$, 'authenticated', :invitee, 'P0001',
  'Already accepted');
select pg_temp.fails_as($q$select public.accept_invitation('tok-ok')$q$, 'authenticated', :other, 'P0001',
  'This invitation was issued to a different email address');
select pg_temp.ok((select accepted_at is null from public.invitations where token = 'tok-ok'),
  'refusals leave the invitation unused');
commit;

-- ---------------------------------------------------------------------------
-- The confirmed-email switch: off by default, refusing when on.
-- ---------------------------------------------------------------------------
begin;
select pg_temp.ok(public.invite_requires_confirmed_email() is false, 'the switch is off by default');
select pg_temp.ok(pg_temp.run_as($q$select public.accept_invitation('tok-unconfirmed')$q$, 'authenticated', :unconfirmed) = 'fleet_owner',
  'with the switch off an unconfirmed address can accept (Confirm email is off on the project)');
rollback;

begin;
create or replace function public.invite_requires_confirmed_email()
  returns boolean language sql immutable set search_path = public as $$ select true $$;
select pg_temp.fails_as($q$select public.accept_invitation('tok-unconfirmed')$q$, 'authenticated', :unconfirmed, 'P0001',
  'Confirm your email address before accepting this invitation');
select pg_temp.ok((select accepted_at is null from public.invitations where token = 'tok-unconfirmed'),
  'with the switch on the invitation stays unused');
rollback;
select pg_temp.ok(public.invite_requires_confirmed_email() is false, 'the switch is off again after the rollback');

-- ---------------------------------------------------------------------------
-- The invited person succeeds once.
-- ---------------------------------------------------------------------------
begin;
select pg_temp.ok(pg_temp.run_as($q$select public.accept_invitation('tok-ok')$q$, 'authenticated', :invitee) = 'city_operator',
  'the invited person (email in a different case) accepts and gets the role');
select pg_temp.ok((select role = 'city_operator' and status = 'active'
                   and organization_id = '10000000-0000-0000-0000-000000000001'
                   and invited_by = :admin
                   from public.profiles where id = :invitee), 'role, status, organization and inviter set');
select pg_temp.ok((select accepted_at is not null and accepted_by = :invitee
                   from public.invitations where token = 'tok-ok'), 'invitation marked used by the invitee');
select pg_temp.ok((select count(*) = 1 from public.role_history
                   where user_id = :invitee and old_role = 'fleet_owner' and old_status = 'active'
                     and new_role = 'city_operator' and new_status = 'active' and changed_by = :admin),
  'role_history has the real previous role and status');
select pg_temp.fails_as($q$select public.accept_invitation('tok-ok')$q$, 'authenticated', :invitee, 'P0001',
  'Already accepted');
commit;

-- ---------------------------------------------------------------------------
-- Function properties.
-- ---------------------------------------------------------------------------
select pg_temp.ok((select prosrc ~* 'for update' from pg_proc where oid = 'public.accept_invitation(text)'::regprocedure),
  'accept_invitation locks the invitation row');
select pg_temp.ok((select prosecdef and 'search_path=public, pg_temp' = any (proconfig)
                   from pg_proc where oid = 'public.accept_invitation(text)'::regprocedure),
  'accept_invitation is SECURITY DEFINER with a pinned search_path');
select pg_temp.ok(not has_function_privilege('anon', 'public.accept_invitation(text)', 'execute')
                  and has_function_privilege('authenticated', 'public.accept_invitation(text)', 'execute')
                  and has_function_privilege('service_role', 'public.accept_invitation(text)', 'execute'),
  'accept_invitation grants unchanged from 021');
select pg_temp.ok(not has_function_privilege('anon', 'public.invite_requires_confirmed_email()', 'execute')
                  and not has_function_privilege('authenticated', 'public.invite_requires_confirmed_email()', 'execute'),
  'the switch is not callable by the API roles');
select pg_temp.ok(not exists (select 1 from information_schema.role_table_grants
                              where table_schema = 'public' and table_name = 'profiles'
                                and grantee in ('anon', 'authenticated')
                                and privilege_type in ('INSERT', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER')),
  'no INSERT, DELETE, TRUNCATE, REFERENCES or TRIGGER on profiles for anon or authenticated');

\o
\echo invites_and_profiles: all checks passed
