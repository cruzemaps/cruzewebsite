-- Server-side test for migration 018 (close anon reads).
-- Rebuilds the live project's leaky state as found on 2026-10-17 (a public
-- profiles policy and owner-run views readable by anon), applies 018 twice,
-- and checks that anon reads nothing, a fleet user reads only their own
-- rows, and an admin still reads everything.
--
-- Runs against a throwaway Postgres with a stub of the Supabase auth schema.
-- Never run it against a real project. From the repo root:
--
--   docker run -d --rm --name t17pg -e POSTGRES_PASSWORD=x postgres:15-alpine
--   docker cp supabase/migrations/20261017_018_close_anon_reads.sql t17pg:/tmp/018.sql
--   docker cp supabase/tests/018_close_anon_reads.test.sql t17pg:/tmp/test.sql
--   docker exec t17pg psql -U postgres -v ON_ERROR_STOP=1 -v mig=/tmp/018.sql -f /tmp/test.sql
--   docker rm -f t17pg
--
-- Prints "close_anon_reads: all checks passed" or stops at the first failure.
\set QUIET on

-- Minimal stand-ins for what Supabase and migrations 002 to 009 provide.
-- Roles are cluster-wide and CI runs the 017 test first on the same server.
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
end $$;
create schema auth;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to anon, authenticated;
grant usage on schema public to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;

create table public.organizations (id uuid primary key, name text, status text);
create table public.profiles (id uuid primary key references auth.users(id), role text, status text,
                              email text, organization_id uuid references public.organizations(id));
create function public.is_admin() returns boolean language sql security definer stable as
  $$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and status = 'active') $$;
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can view own profile" on public.profiles for select
  using ((auth.uid() = id) or public.is_admin());

create table public.pilot_applications (id uuid primary key, user_id uuid, company_name text, status text);
alter table public.pilot_applications enable row level security;
create policy "Users can view own pilot application" on public.pilot_applications for select
  using (auth.uid() = user_id or public.is_admin());

create table public.loi_signatures (id uuid primary key, user_id uuid, participant_name text,
                                    participant_company text, fleet_size int, signed_at timestamptz,
                                    loi_version text, pilot_application_id uuid, archived_at timestamptz);
alter table public.loi_signatures enable row level security;
create policy "Users see own LOI" on public.loi_signatures for select
  using ((auth.uid() = user_id) or public.is_admin());

create table public.loi_amendments (id uuid primary key, loi_signature_id uuid, amended_at timestamptz);
alter table public.loi_amendments enable row level security;
create policy "Admins read amendments" on public.loi_amendments for select using (public.is_admin());

create table public.permanent_deletions (id uuid primary key);
alter table public.permanent_deletions enable row level security;
create policy "Admins read deletions" on public.permanent_deletions for select using (public.is_admin());

-- The views exactly as they run live: owner-run, readable by anon.
create view public.user_latest_loi as
  select distinct on (user_id) id, user_id, pilot_application_id, participant_name, participant_company,
         fleet_size, signed_at, loi_version
  from public.loi_signatures order by user_id, signed_at desc;
create view public.loi_amendment_counts as
  select loi_signature_id, count(*)::int as amendment_count, max(amended_at) as last_amended_at
  from public.loi_amendments group by loi_signature_id;
create view public.archived_counts as
  select 'users'::text as entity, count(*)::int as count from public.profiles where status = 'archived'
  union all select 'lois', count(*)::int from public.loi_signatures where archived_at is not null
  union all select 'permanent_deletions', count(*)::int from public.permanent_deletions;
create view public.company_signals as
  select lower(company_name) as norm, company_name as raw_name, 'pilot_application'::text as source,
         id as record_id, status from public.pilot_applications
  union all select lower(participant_company), participant_company, 'loi_signature', id, 'signed'
  from public.loi_signatures
  union all select lower(name), name, 'organization', id, status from public.organizations;
create function public.check_company_status(q text) returns text language sql security definer stable as
  $$ select case when exists (select 1 from public.company_signals where norm = lower(q))
                 then 'known' else 'no_relationship' end $$;

insert into auth.users values
  ('00000000-0000-0000-0000-00000000000a'), ('00000000-0000-0000-0000-00000000000f'),
  ('00000000-0000-0000-0000-00000000000b');
insert into public.organizations values
  ('10000000-0000-0000-0000-00000000000f', 'Fleet F', 'active'),
  ('10000000-0000-0000-0000-00000000000b', 'Fleet B', 'active');
insert into public.profiles values
  ('00000000-0000-0000-0000-00000000000a', 'admin', 'active', 'admin@example.com', null),
  ('00000000-0000-0000-0000-00000000000f', 'fleet_owner', 'active', 'f@example.com', '10000000-0000-0000-0000-00000000000f'),
  ('00000000-0000-0000-0000-00000000000b', 'fleet_owner', 'archived', 'b@example.com', '10000000-0000-0000-0000-00000000000b');
insert into public.pilot_applications values
  (gen_random_uuid(), '00000000-0000-0000-0000-00000000000f', 'Fleet F', 'approved'),
  (gen_random_uuid(), '00000000-0000-0000-0000-00000000000b', 'Fleet B', 'pending');
insert into public.loi_signatures values
  (gen_random_uuid(), '00000000-0000-0000-0000-00000000000f', 'F Signer', 'Fleet F', 150, now(), 'v1', null, null),
  (gen_random_uuid(), '00000000-0000-0000-0000-00000000000b', 'B Signer', 'Fleet B', 40, now(), 'v1', null, now());

-- Visible row counts for one caller, over every relation the migration touches.
create function pg_temp.visible(as_role text, sub text) returns jsonb language plpgsql as $$
declare
  r text;
  n bigint;
  result jsonb := '{}'::jsonb;
begin
  foreach r in array array['profiles', 'user_latest_loi', 'loi_amendment_counts', 'archived_counts',
                           'company_signals'] loop
    execute format('set local role %I', as_role);
    perform set_config('request.jwt.claim.sub', sub, true);
    begin
      execute format('select count(*) from public.%I', r) into n;
      if r = 'archived_counts' then
        execute 'select coalesce(sum(count), 0) from public.archived_counts' into n;
      end if;
    exception when insufficient_privilege then
      n := -1;  -- denied outright
    end;
    reset role;
    result := result || jsonb_build_object(r, n);
  end loop;
  return result;
end $$;

-- Before: the leak this migration exists for.
do $$
declare v jsonb := pg_temp.visible('anon', '');
begin
  if (v->>'profiles')::int <> 3 or (v->>'user_latest_loi')::int <> 2 or (v->>'company_signals')::int <> 6 then
    raise exception 'test setup does not reproduce the live leak: %', v;
  end if;
end $$;

\i :mig
\i :mig

do $$
declare
  anon jsonb := pg_temp.visible('anon', '');
  fleet jsonb := pg_temp.visible('authenticated', '00000000-0000-0000-0000-00000000000f');
  admin jsonb := pg_temp.visible('authenticated', '00000000-0000-0000-0000-00000000000a');
begin
  -- anon: nothing from any of them.
  if (anon->>'profiles')::int <> 0 then raise exception 'anon still reads profiles: %', anon; end if;
  if (anon->>'user_latest_loi')::int <> -1 or (anon->>'company_signals')::int <> -1
     or (anon->>'archived_counts')::int <> -1 or (anon->>'loi_amendment_counts')::int <> -1 then
    raise exception 'anon still reads a view: %', anon;
  end if;
  -- A fleet user: own profile and own LOI only; no archived totals; no company list.
  if (fleet->>'profiles')::int <> 1 then raise exception 'fleet user reads other profiles: %', fleet; end if;
  if (fleet->>'user_latest_loi')::int <> 1 then raise exception 'fleet user LOI view wrong: %', fleet; end if;
  if (fleet->>'archived_counts')::int <> 0 then raise exception 'fleet user reads archive totals: %', fleet; end if;
  if (fleet->>'company_signals')::int <> -1 then raise exception 'fleet user reads company_signals: %', fleet; end if;
  -- Admin: unchanged.
  if (admin->>'profiles')::int <> 3 or (admin->>'user_latest_loi')::int <> 2
     or (admin->>'archived_counts')::int <> 2 then
    raise exception 'admin lost access: %', admin;
  end if;
end $$;

-- The definer functions that read company_signals still work for anyone.
set role anon;
do $$ begin
  if public.check_company_status('fleet f') <> 'known' then
    raise exception 'check_company_status broke';
  end if;
end $$;
reset role;

\echo close_anon_reads: all checks passed
