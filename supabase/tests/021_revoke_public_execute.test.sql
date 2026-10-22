-- Server-side test for migration 021 (no PUBLIC EXECUTE on SECURITY DEFINER
-- functions).
--
-- Builds stand-ins for the 18 functions 021 touches, with their live
-- signatures and their live grants on 2026-10-22 (EXECUTE for PUBLIC, anon,
-- authenticated and service_role, as Postgres and Supabase's default
-- privileges give every new function; admin_search_companies had no PUBLIC
-- grant). Then it applies 021 twice and checks:
--   * no SECURITY DEFINER function in public is executable by PUBLIC
--   * a login role that is not an API role (a stand-in for a service's own
--     role, like the client portal's) can execute none of them, and calling
--     change_user_role fails with insufficient_privilege
--   * anon, authenticated and service_role can execute exactly what the site
--     needs (the table in the migration header)
--   * the signup trigger still fires for a role that cannot execute
--     handle_new_user
--   * anon still reads through an RLS policy that calls is_admin()
--
-- Runs against a throwaway Postgres. Never run it against a real project.
-- From the repo root:
--
--   docker run -d --rm --name t21pg -e POSTGRES_PASSWORD=x postgres:15-alpine
--   docker cp supabase/migrations/20261022_021_revoke_public_execute.sql t21pg:/tmp/021.sql
--   docker cp supabase/tests/021_revoke_public_execute.test.sql t21pg:/tmp/test.sql
--   docker exec t21pg psql -U postgres -v ON_ERROR_STOP=1 -v mig=/tmp/021.sql -f /tmp/test.sql
--   docker rm -f t21pg
--
-- Prints "revoke_public_execute: all checks passed" or stops at the first failure.
\set QUIET on
\o /dev/null

-- ---------------------------------------------------------------------------
-- Stand-in roles. Roles are cluster-wide and CI runs other tests first.
-- ---------------------------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin; end if;
  -- A service's own database login, like the client portal's.
  if not exists (select 1 from pg_roles where rolname = 't021_service_login') then create role t021_service_login login; end if;
  -- Stands in for supabase_auth_admin, which inserts into auth.users.
  if not exists (select 1 from pg_roles where rolname = 't021_auth_admin') then create role t021_auth_admin nologin; end if;
end $$;
grant usage on schema public to anon, authenticated, service_role, t021_service_login, t021_auth_admin;

create function pg_temp.ok(cond boolean, what text) returns void language plpgsql as $$
begin
  if cond is not true then raise exception 'FAILED: %', what; end if;
end $$;

-- ---------------------------------------------------------------------------
-- Live signatures, minimal bodies.
-- ---------------------------------------------------------------------------
create table public.t021_users (id uuid primary key);
create table public.t021_profiles (id uuid primary key);
create table public.t021_admin_only (id int);

create function public.is_admin() returns boolean
  language sql security definer set search_path = public, pg_temp as $$ select false $$;
create function public.live_impact_stats() returns table (trucks int)
  language sql security definer set search_path = public, pg_temp as $$ select 0 $$;
create function public.capture_investor_lead(text, text, text, text, text) returns void
  language plpgsql security definer set search_path = public as $$ begin return; end $$;
create function public.capture_investor_lead(text, text, text, text) returns void
  language plpgsql security definer set search_path = public as $$ begin return; end $$;
create function public.log_investor_visit(text, text, text, text, text, text, text) returns void
  language plpgsql security definer set search_path = public as $$ begin return; end $$;
create function public.accept_invitation(text) returns text
  language plpgsql security definer set search_path = public as $$ begin return 'ok'; end $$;
create function public.archive_loi(uuid, text) returns void
  language plpgsql security definer set search_path = public as $$ begin return; end $$;
create function public.change_user_role(uuid, text, text, text) returns void
  language plpgsql security definer set search_path = public, pg_temp as $$ begin return; end $$;
create function public.admin_hard_delete_invitation(uuid, text) returns void
  language plpgsql security definer set search_path = public as $$ begin return; end $$;
create function public.admin_hard_delete_loi(uuid, text) returns void
  language plpgsql security definer set search_path = public as $$ begin return; end $$;
create function public.admin_hard_delete_pilot_application(uuid, text) returns void
  language plpgsql security definer set search_path = public as $$ begin return; end $$;
create function public.get_pilot_draft() returns jsonb
  language sql security definer set search_path = public as $$ select '{}'::jsonb $$;
create function public.upsert_pilot_draft(jsonb) returns void
  language plpgsql security definer set search_path = public as $$ begin return; end $$;
create function public.delete_pilot_draft() returns void
  language plpgsql security definer set search_path = public as $$ begin return; end $$;
create function public.touch_last_active() returns void
  language plpgsql security definer set search_path = public, pg_temp as $$ begin return; end $$;
create function public.admin_search_companies(text, real) returns setof text
  language plpgsql security definer set search_path = public as $$ begin return; end $$;
create function public.check_company_status(text) returns text
  language plpgsql security definer set search_path = public as $$ begin return 'no_relationship'; end $$;
create function public.handle_new_user() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  insert into public.t021_profiles (id) values (new.id);
  return new;
end $$;
create trigger on_auth_user_created after insert on public.t021_users
  for each row execute function public.handle_new_user();

-- Live grants on 2026-10-22: PUBLIC by default, plus the API roles.
grant execute on all functions in schema public to anon, authenticated, service_role;
revoke execute on function public.admin_search_companies(text, real) from public;

-- An RLS policy "to public" that calls is_admin(), as on the live tables.
alter table public.t021_admin_only enable row level security;
create policy "Admins read" on public.t021_admin_only for select to public using (public.is_admin());
grant select on public.t021_admin_only to anon, authenticated;
insert into public.t021_admin_only values (1);

-- The live hole: a service login inherits EXECUTE through PUBLIC.
select pg_temp.ok(has_function_privilege('t021_service_login', 'public.change_user_role(uuid,text,text,text)', 'execute'),
  'before 021 a non-API login can execute change_user_role');

-- ---------------------------------------------------------------------------
-- Apply 021 twice (it must be idempotent).
-- ---------------------------------------------------------------------------
\i :mig
\i :mig

-- ---------------------------------------------------------------------------
-- Checks.
-- ---------------------------------------------------------------------------
select pg_temp.ok(not exists (
    select 1
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef
      and (p.proacl is null
           or exists (select 1 from aclexplode(p.proacl) a where a.grantee = 0 and a.privilege_type = 'EXECUTE'))),
  'no SECURITY DEFINER function in public is executable by PUBLIC');

with expected (fn, anon_ok, authenticated_ok, service_ok) as (values
  ('public.is_admin()', true, true, true),
  ('public.live_impact_stats()', true, true, true),
  ('public.capture_investor_lead(text,text,text,text,text)', true, true, true),
  ('public.capture_investor_lead(text,text,text,text)', true, true, true),
  ('public.log_investor_visit(text,text,text,text,text,text,text)', true, true, true),
  ('public.accept_invitation(text)', false, true, true),
  ('public.archive_loi(uuid,text)', false, true, true),
  ('public.change_user_role(uuid,text,text,text)', false, true, true),
  ('public.admin_hard_delete_invitation(uuid,text)', false, true, true),
  ('public.admin_hard_delete_loi(uuid,text)', false, true, true),
  ('public.admin_hard_delete_pilot_application(uuid,text)', false, true, true),
  ('public.get_pilot_draft()', false, true, true),
  ('public.upsert_pilot_draft(jsonb)', false, true, true),
  ('public.delete_pilot_draft()', false, true, true),
  ('public.touch_last_active()', false, true, true),
  ('public.admin_search_companies(text,real)', false, true, true),
  ('public.check_company_status(text)', false, false, true),
  ('public.handle_new_user()', false, false, true)
)
select pg_temp.ok(
    has_function_privilege('anon', fn, 'execute') = anon_ok
    and has_function_privilege('authenticated', fn, 'execute') = authenticated_ok
    and has_function_privilege('service_role', fn, 'execute') = service_ok
    and not has_function_privilege('t021_service_login', fn, 'execute'),
    fn || ' has exactly the expected grants')
from expected;

-- A non-API login can no longer call change_user_role.
set role t021_service_login;
do $$ begin
  perform public.change_user_role(null, null, null, null);
  raise exception 'FAILED: a non-API login executed change_user_role';
exception when insufficient_privilege then
  null;
end $$;
reset role;

-- The signup trigger still fires for a role without EXECUTE on handle_new_user.
grant insert on public.t021_users to t021_auth_admin;
select pg_temp.ok(not has_function_privilege('t021_auth_admin', 'public.handle_new_user()', 'execute'),
  'the stand-in auth role cannot execute handle_new_user');
set role t021_auth_admin;
insert into public.t021_users values ('00000000-0000-0000-0000-000000000001');
reset role;
select pg_temp.ok((select count(*) from public.t021_profiles) = 1,
  'the signup trigger fires for a role that cannot execute handle_new_user');

-- anon reads through a policy that calls is_admin(): no rows, no error.
set role anon;
select pg_temp.ok((select count(*) from public.t021_admin_only) = 0,
  'anon reads through an is_admin() policy without a permission error');
reset role;

\o
\echo revoke_public_execute: all checks passed
