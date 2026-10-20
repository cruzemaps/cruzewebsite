-- Server-side test for migration 017 (start_impersonation).
-- A non-admin cannot impersonate, and every impersonation writes one audit row.
--
-- Runs against a throwaway Postgres with a stub of the Supabase auth schema.
-- Never run it against a real project. From the repo root:
--
--   docker run -d --rm --name t16pg -e POSTGRES_PASSWORD=x postgres:15-alpine
--   docker cp supabase/migrations/20261017_017_start_impersonation.sql t16pg:/tmp/017.sql
--   docker cp supabase/tests/017_start_impersonation.test.sql t16pg:/tmp/test.sql
--   docker exec t16pg psql -U postgres -v ON_ERROR_STOP=1 -v mig=/tmp/017.sql -f /tmp/test.sql
--   docker rm -f t16pg
--
-- Prints "start_impersonation: all checks passed" or stops at the first failure.
\set QUIET on

-- Minimal stand-ins for what Supabase and migration 002 provide.
create role anon nologin;
create role authenticated nologin;
create schema auth;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to anon, authenticated;
grant usage on schema public to anon, authenticated;
create table public.profiles (id uuid primary key references auth.users(id), role text, status text);
create table public.role_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  old_role text, new_role text not null, old_status text, new_status text,
  changed_by uuid references public.profiles(id), reason text not null,
  changed_at timestamptz default now());
create function public.is_admin() returns boolean language sql security definer stable as
  $$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and status = 'active') $$;

insert into auth.users values
  ('00000000-0000-0000-0000-00000000000a'), ('00000000-0000-0000-0000-00000000000f'),
  ('00000000-0000-0000-0000-0000000000aa'), ('00000000-0000-0000-0000-0000000000dd');
insert into public.profiles values
  ('00000000-0000-0000-0000-00000000000a', 'admin', 'active'),
  ('00000000-0000-0000-0000-00000000000f', 'fleet_owner', 'active'),
  ('00000000-0000-0000-0000-0000000000aa', 'admin', 'suspended'),
  ('00000000-0000-0000-0000-0000000000dd', 'fleet_owner', 'archived');

-- Apply the migration twice to prove it is idempotent.
\i :mig
\i :mig

create function pg_temp.expect_denied(caller text, target uuid, as_role text) returns void language plpgsql as $$
begin
  execute format('set local role %I', as_role);
  perform set_config('request.jwt.claim.sub', caller, true);
  begin
    perform * from public.start_impersonation(target);
  exception when others then
    reset role;
    return;
  end;
  reset role;
  raise exception 'expected start_impersonation to be denied for caller % as %', caller, as_role;
end $$;

begin;
select pg_temp.expect_denied('', '00000000-0000-0000-0000-00000000000f', 'anon');
select pg_temp.expect_denied('00000000-0000-0000-0000-00000000000f', '00000000-0000-0000-0000-00000000000a', 'authenticated');
select pg_temp.expect_denied('00000000-0000-0000-0000-0000000000aa', '00000000-0000-0000-0000-00000000000f', 'authenticated');
select pg_temp.expect_denied('', '00000000-0000-0000-0000-00000000000f', 'authenticated');
select pg_temp.expect_denied('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000dd', 'authenticated');
commit;

do $$ begin
  if (select count(*) from public.role_history) <> 0 then
    raise exception 'denied calls must not write audit rows';
  end if;
end $$;

-- Active admin: allowed, returns the target's current role and status.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', true) \gset ignored_
select role as got_role, status as got_status from public.start_impersonation('00000000-0000-0000-0000-00000000000f') \gset
commit;

do $$ begin
  if (select count(*) from public.role_history
      where user_id = '00000000-0000-0000-0000-00000000000f'
        and changed_by = '00000000-0000-0000-0000-00000000000a'
        and old_role = new_role and old_status = new_status
        and reason = 'Impersonation session opened by admin') <> 1 then
    raise exception 'admin impersonation must write exactly one unchanged-role audit row';
  end if;
  if (select role || '/' || status from public.profiles where id = '00000000-0000-0000-0000-00000000000f') <> 'fleet_owner/active' then
    raise exception 'start_impersonation must not modify profiles';
  end if;
end $$;

\if :{?got_role}
\else
  \echo 'admin call returned no row'
  \quit
\endif
\echo start_impersonation: all checks passed (admin preview returned :got_role / :got_status)
