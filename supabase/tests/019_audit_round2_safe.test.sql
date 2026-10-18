-- Server-side test for migration 019 (audit round 2, safe version of 011).
--
-- Rebuilds the parts of the live CruzeMaps Web Admin schema that 019 touches,
-- as they are on 2026-10-18 after 015, 010 and 018: the same columns, NOT NULL
-- and CHECK constraints, foreign keys (profiles.id -> auth.users with no
-- cascade), Supabase's default privileges (anon gets EXECUTE on every new
-- function) and the live bodies and grants of the functions 019 replaces or
-- alters. Then it shows the live bugs, applies 019 twice and checks:
--   * anon cannot call rollback_unsigned_pilot, restore_loi,
--     admin_hard_delete_user or set_loi_signature_metadata
--   * the owner can roll back their own pending application without an LOI,
--     and nobody else's; a null uid is refused; an admin can, with a snapshot
--   * an admin can hard-delete a user (everything snapshotted first); self
--     delete, non-admins, bad reasons and users who are actors on other
--     people's audit rows are refused with nothing deleted
--   * restore_loi has one signature and resolves with one or two arguments,
--     positional or named (PostgREST sends named arguments)
--   * set_loi_signature_metadata still works for the LOI owner and for the
--     service role (the capture-loi-metadata edge function)
--   * is_admin, change_user_role, touch_last_active and live_impact_stats have
--     a pinned search_path, the same grants and the same results
--   * every function the site calls still matches the argument names the site
--     sends (file references next to each check)
--
-- Runs against a throwaway Postgres with a stub of the Supabase auth schema.
-- Never run it against a real project. From the repo root:
--
--   docker run -d --rm --name t19pg -e POSTGRES_PASSWORD=x postgres:15-alpine
--   docker cp supabase/migrations/20261018_019_audit_round2_safe.sql t19pg:/tmp/019.sql
--   docker cp supabase/tests/019_audit_round2_safe.test.sql t19pg:/tmp/test.sql
--   docker exec t19pg psql -U postgres -v ON_ERROR_STOP=1 -v mig=/tmp/019.sql -f /tmp/test.sql
--   docker rm -f t19pg
--
-- Prints "audit_round2_safe: all checks passed" or stops at the first failure.
\set QUIET on
-- Query results are not needed; failures raise and print to stderr.
\o /dev/null

-- ---------------------------------------------------------------------------
-- Supabase stand-ins. Roles are cluster-wide and CI runs other tests first.
-- ---------------------------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then create role supabase_auth_admin nologin; end if;
end $$;
-- Live pg_default_acl for objects postgres creates in public.
alter default privileges for role postgres in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges for role postgres in schema public grant all on functions to anon, authenticated, service_role;

create schema auth;
create table auth.users (id uuid primary key, email text);
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Live tables (columns, NOT NULL, CHECK and FKs as on 2026-10-18).
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id),            -- no cascade, as live
  role text not null default 'fleet_owner' check (role in ('fleet_owner','city_operator','admin')),
  created_at timestamptz not null default timezone('utc', now()),
  requested_role text check (requested_role in ('admin','fleet_owner','city_operator')),
  organization_id uuid,
  status text default 'pending' check (status in ('pending','active','suspended','archived')),
  invited_by uuid references public.profiles(id),
  last_active_at timestamptz,
  email text, first_name text, last_name text);
create table public.organizations (
  id uuid primary key default gen_random_uuid(), name text not null, org_type text not null,
  status text default 'prospect', website text, created_at timestamptz default now(),
  created_by uuid references public.profiles(id));
create table public.pilot_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  company_name text, truck_size text, fleet_size text,
  status text not null default 'pending'
    check (status in ('pending','in_review','approved','onboarding','active','denied','archived')),
  created_at timestamptz not null default timezone('utc', now()), notes text,
  reviewed_by uuid references public.profiles(id), reviewed_at timestamptz, organization_id uuid,
  website text, primary_lanes text, fms_provider text, fms_other text, contact_name text,
  contact_email text, contact_phone text, contact_title text, application_notes text,
  fleet_visible_message text);
create unique index pilot_applications_one_active_per_user on public.pilot_applications (user_id)
  where status <> all (array['archived','denied']);
create table public.loi_signatures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  pilot_application_id uuid references public.pilot_applications(id) on delete set null,
  participant_name text not null, participant_company text not null, participant_title text,
  fleet_size text not null, agreed boolean not null default false constraint loi_must_be_agreed check (agreed = true),
  initials text not null check (length(initials) between 1 and 8),
  signed_at timestamptz not null default now(), ip_address text, user_agent text,
  loi_version text not null default '1.0', loi_full_text text not null,
  performance_fee_min_pct int not null default 15, performance_fee_max_pct int not null default 45,
  created_at timestamptz not null default now(), archived_at timestamptz,
  archived_by uuid references public.profiles(id) on delete set null,   -- 010
  archive_reason text, contact_email text);
create table public.loi_amendments (
  id uuid primary key default gen_random_uuid(),
  loi_signature_id uuid not null references public.loi_signatures(id) on delete cascade,
  field text not null check (length(field) between 1 and 60), previous_value text,
  new_value text not null, reason text not null check (length(trim(reason)) >= 5),
  amended_by uuid not null references public.profiles(id),
  amended_at timestamptz not null default now(), created_at timestamptz not null default now());
create table public.permanent_deletions (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('user','pilot_application','invitation','loi_signature')),
  entity_id uuid not null, entity_snapshot jsonb,
  reason text not null check (length(trim(reason)) >= 5),
  deleted_by uuid not null references public.profiles(id) on delete set null,   -- 010
  deleted_at timestamptz not null default now());
create table public.role_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  old_role text, new_role text not null, old_status text, new_status text,
  changed_by uuid not null references public.profiles(id) on delete set null,   -- 010
  reason text not null, changed_at timestamptz default now());
create table public.invitations (
  id uuid primary key default gen_random_uuid(), email text not null,
  role text not null check (role in ('admin','fleet_owner','city_operator')), organization_id uuid,
  token text not null unique default md5(random()::text),   -- live uses pgcrypto
  invited_by uuid not null references public.profiles(id),
  expires_at timestamptz not null default now() + interval '7 days', accepted_at timestamptz,
  accepted_by uuid references public.profiles(id), created_at timestamptz default now());
create table public.pilot_application_drafts (
  user_id uuid not null references public.profiles(id) on delete cascade,
  payload jsonb not null default '{}', updated_at timestamptz not null default now());

-- ---------------------------------------------------------------------------
-- Live functions, bodies and grants as on 2026-10-18 (default privileges give
-- PUBLIC, anon, authenticated and service_role EXECUTE, as live shows).
-- ---------------------------------------------------------------------------
create function public.is_admin() returns boolean language sql stable security definer as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and status = 'active');
$$;

create function public.change_user_role(target_user_id uuid, new_role text, new_status text default null, reason text default null)
returns void language plpgsql security definer as $$
declare
  v_old_role text; v_old_status text; v_caller uuid := auth.uid();
begin
  if not public.is_admin() then raise exception 'Only admins can change roles'; end if;
  if new_role not in ('admin','fleet_owner','city_operator') then raise exception 'Invalid role: %', new_role; end if;
  if reason is null or length(trim(reason)) < 3 then raise exception 'A reason of at least 3 characters is required'; end if;
  select role, status into v_old_role, v_old_status from public.profiles where id = target_user_id;
  if v_old_role is null then raise exception 'User not found: %', target_user_id; end if;
  update public.profiles set role = new_role, status = coalesce(new_status, status) where id = target_user_id;
  insert into public.role_history (user_id, old_role, new_role, old_status, new_status, changed_by, reason)
  values (target_user_id, v_old_role, new_role, v_old_status, coalesce(new_status, v_old_status), v_caller, reason);
end;
$$;

create function public.touch_last_active() returns void language sql security definer as $$
  update public.profiles set last_active_at = now() where id = auth.uid();
$$;

create function public.live_impact_stats()
returns table(active_pilots bigint, total_fleets bigint, total_cities bigint)
language sql stable security definer as $$
  select
    (select count(*) from public.pilot_applications where status in ('approved','onboarding','active')),
    (select count(*) from public.profiles where role = 'fleet_owner' and status = 'active'),
    (select count(*) from public.organizations where org_type = 'city' and status = 'active');
$$;

create function public.restore_loi(p_loi_id uuid) returns void language plpgsql security definer
set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Only admins can restore LOIs'; end if;
  update public.loi_signatures set archived_at = null, archived_by = null, archive_reason = null where id = p_loi_id;
end;
$$;

create function public.admin_hard_delete_user(p_user_id uuid, p_reason text) returns void language plpgsql
security definer set search_path = public, auth as $$
declare v_row jsonb;
begin
  if not public.is_admin() then raise exception 'Admin only'; end if;
  if p_user_id = auth.uid() then raise exception 'You cannot delete your own account'; end if;
  if length(trim(p_reason)) < 10 then raise exception 'User hard-delete requires a reason of at least 10 chars'; end if;
  select to_jsonb(p) into v_row from public.profiles p where p.id = p_user_id;
  insert into public.permanent_deletions (entity_type, entity_id, entity_snapshot, reason, deleted_by)
  values ('user', p_user_id, v_row, p_reason, auth.uid());
  delete from public.pilot_applications where user_id = p_user_id;
  delete from public.invitations where invited_by = p_user_id or accepted_by = p_user_id;
  delete from auth.users where id = p_user_id;
end;
$$;

create function public.set_loi_signature_metadata(p_loi_id uuid, p_ip_address text, p_user_agent text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_owner uuid;
begin
  select user_id into v_owner from public.loi_signatures where id = p_loi_id;
  if v_owner is null then raise exception 'LOI not found'; end if;
  if auth.uid() is null then
    update public.loi_signatures
       set ip_address = coalesce(nullif(trim(p_ip_address), ''), ip_address),
           user_agent = coalesce(nullif(trim(p_user_agent), ''), user_agent)
     where id = p_loi_id;
    return;
  end if;
  if auth.uid() <> v_owner and not public.is_admin() then raise exception 'Not authorized'; end if;
  update public.loi_signatures
     set ip_address = coalesce(nullif(trim(p_ip_address), ''), ip_address),
         user_agent = coalesce(nullif(trim(p_user_agent), ''), user_agent)
   where id = p_loi_id;
end;
$$;

-- RLS as live on the tables the site writes directly (functions run as owner).
alter table public.profiles enable row level security;
alter table public.pilot_applications enable row level security;
alter table public.loi_signatures enable row level security;
alter table public.loi_amendments enable row level security;
alter table public.permanent_deletions enable row level security;
alter table public.role_history enable row level security;
alter table public.invitations enable row level security;
alter table public.organizations enable row level security;
alter table public.pilot_application_drafts enable row level security;
create policy "Users can view own profile" on public.profiles for select using ((auth.uid() = id) or public.is_admin());
create policy "Users can view own pilot application" on public.pilot_applications for select
  using ((auth.uid() = user_id) or exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));
create policy "Users see own LOI" on public.loi_signatures for select using ((auth.uid() = user_id) or public.is_admin());

-- ---------------------------------------------------------------------------
-- Data.
--   A admin, A2 admin who changed G's role, F/G/H fleet owners, T the user an
--   admin will hard-delete, U a user T invited.
-- ---------------------------------------------------------------------------
insert into auth.users values
  ('00000000-0000-0000-0000-00000000000a', 'a@x'), ('00000000-0000-0000-0000-00000000000b', 'a2@x'),
  ('00000000-0000-0000-0000-00000000000f', 'f@x'), ('00000000-0000-0000-0000-00000000000e', 'g@x'),
  ('00000000-0000-0000-0000-00000000000c', 'h@x'), ('00000000-0000-0000-0000-00000000000d', 't@x'),
  ('00000000-0000-0000-0000-000000000010', 'u@x');
insert into public.profiles (id, role, status, email) values
  ('00000000-0000-0000-0000-00000000000a', 'admin', 'active', 'a@x'),
  ('00000000-0000-0000-0000-00000000000b', 'admin', 'active', 'a2@x'),
  ('00000000-0000-0000-0000-00000000000f', 'fleet_owner', 'active', 'f@x'),
  ('00000000-0000-0000-0000-00000000000e', 'fleet_owner', 'active', 'g@x'),
  ('00000000-0000-0000-0000-00000000000c', 'fleet_owner', 'active', 'h@x');
insert into public.profiles (id, role, status, email, invited_by) values
  ('00000000-0000-0000-0000-00000000000d', 'fleet_owner', 'active', 't@x', '00000000-0000-0000-0000-00000000000a'),
  ('00000000-0000-0000-0000-000000000010', 'fleet_owner', 'pending', 'u@x', '00000000-0000-0000-0000-00000000000d');
insert into public.organizations (id, name, org_type, status, created_by) values
  ('30000000-0000-0000-0000-000000000001', 'Test City', 'city', 'active', '00000000-0000-0000-0000-00000000000d');
insert into public.pilot_applications (id, user_id, status, company_name, reviewed_by) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000f', 'pending', 'F Co', null),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000000e', 'pending', 'G Co', null),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-00000000000c', 'approved', 'H Co', '00000000-0000-0000-0000-00000000000a'),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-00000000000d', 'approved', 'T Co', '00000000-0000-0000-0000-00000000000a');
insert into public.loi_signatures (id, user_id, pilot_application_id, participant_name, participant_company, fleet_size, agreed, initials, loi_full_text) values
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000c', '10000000-0000-0000-0000-000000000003', 'H', 'H Co', '50', true, 'HH', 'text'),
  ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-00000000000d', '10000000-0000-0000-0000-000000000004', 'T', 'T Co', '80', true, 'TT', 'text');
insert into public.loi_amendments (loi_signature_id, field, new_value, reason, amended_by) values
  ('20000000-0000-0000-0000-000000000004', 'fleet_size', '90', 'Customer correction', '00000000-0000-0000-0000-00000000000a');
insert into public.invitations (email, role, invited_by, accepted_by, accepted_at) values
  ('t@x', 'fleet_owner', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000d', now());
insert into public.role_history (user_id, old_role, new_role, changed_by, reason) values
  ('00000000-0000-0000-0000-00000000000d', null, 'fleet_owner', '00000000-0000-0000-0000-00000000000d', 'Accepted invitation'),
  ('00000000-0000-0000-0000-00000000000d', 'fleet_owner', 'fleet_owner', '00000000-0000-0000-0000-00000000000a', 'Activated'),
  ('00000000-0000-0000-0000-00000000000e', 'fleet_owner', 'fleet_owner', '00000000-0000-0000-0000-00000000000b', 'Activated');
insert into public.pilot_application_drafts (user_id) values ('00000000-0000-0000-0000-00000000000d');

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
-- Before 019: the live bugs this migration fixes.
-- ---------------------------------------------------------------------------
begin;
-- Hard delete always fails on profiles_id_fkey (no cascade to profiles).
select pg_temp.fails_as($q$select public.admin_hard_delete_user('00000000-0000-0000-0000-00000000000d', 'Testing the live bug here')$q$,
  'authenticated', '00000000-0000-0000-0000-00000000000a', '23503', '%profiles_id_fkey%');
-- The site's restore call (p_loi_id + p_reason) has no matching function.
select pg_temp.fails_as($q$select public.restore_loi(p_loi_id := '20000000-0000-0000-0000-000000000001', p_reason := 'x')$q$,
  'authenticated', '00000000-0000-0000-0000-00000000000a', '42883', '%');
-- anon can rewrite any LOI's IP address.
select pg_temp.run_as($q$select public.set_loi_signature_metadata('20000000-0000-0000-0000-000000000001', '203.0.113.9', 'x')::text$q$, 'anon', null);
select pg_temp.ok((select ip_address from public.loi_signatures where id = '20000000-0000-0000-0000-000000000001') = '203.0.113.9',
  'live: anon could set LOI metadata');
rollback;

select active_pilots as before_pilots, total_fleets as before_fleets, total_cities as before_cities
  from public.live_impact_stats() \gset

-- ---------------------------------------------------------------------------
-- Apply 019 twice to prove it is idempotent.
-- ---------------------------------------------------------------------------
\i :mig
\i :mig

-- ---------------------------------------------------------------------------
-- Grants and signatures.
-- ---------------------------------------------------------------------------
do $$
declare
  f regprocedure;
begin
  perform pg_temp.ok((select count(*) from pg_proc where proname = 'restore_loi' and pronamespace = 'public'::regnamespace) = 1,
    'exactly one restore_loi');
  foreach f in array array['public.rollback_unsigned_pilot(uuid)', 'public.restore_loi(uuid, text)',
                           'public.admin_hard_delete_user(uuid, text)',
                           'public.set_loi_signature_metadata(uuid, text, text)']::regprocedure[] loop
    perform pg_temp.ok(not has_function_privilege('anon', f, 'execute'), f || ': anon must not execute');
    perform pg_temp.ok(not exists (select 1 from pg_proc p, aclexplode(p.proacl) a where p.oid = f and a.grantee = 0),
      f || ': PUBLIC must not execute');
    perform pg_temp.ok(has_function_privilege('authenticated', f, 'execute'), f || ': authenticated must execute');
    perform pg_temp.ok(has_function_privilege('service_role', f, 'execute'), f || ': service_role must execute');
    perform pg_temp.ok((select prosecdef from pg_proc where oid = f), f || ': security definer');
    perform pg_temp.ok((select proconfig from pg_proc where oid = f)::text like '%search_path=%', f || ': search_path pinned');
  end loop;
  -- The four pinned functions keep their grants, anon included.
  foreach f in array array['public.is_admin()', 'public.change_user_role(uuid, text, text, text)',
                           'public.touch_last_active()', 'public.live_impact_stats()']::regprocedure[] loop
    perform pg_temp.ok((select proconfig from pg_proc where oid = f) = array['search_path=public, pg_temp'], f || ': search_path pinned');
    perform pg_temp.ok(has_function_privilege('anon', f, 'execute'), f || ': anon grant unchanged');
    perform pg_temp.ok(exists (select 1 from pg_proc p, aclexplode(p.proacl) a where p.oid = f and a.grantee = 0),
      f || ': PUBLIC grant unchanged');
  end loop;
  -- Argument names the site sends (PostgREST matches functions by them).
  perform pg_temp.ok((select proargnames from pg_proc where oid = 'public.rollback_unsigned_pilot(uuid)'::regprocedure) = '{p_id}',
    'Apply.tsx sends { p_id }');
  perform pg_temp.ok((select proargnames from pg_proc where oid = 'public.restore_loi(uuid, text)'::regprocedure) = '{p_loi_id,p_reason}',
    'ArchiveLibraryTab.tsx sends { p_loi_id, p_reason }');
  perform pg_temp.ok((select proargnames from pg_proc where oid = 'public.admin_hard_delete_user(uuid, text)'::regprocedure) = '{p_user_id,p_reason}',
    'ArchiveLibraryTab.tsx sends { p_user_id, p_reason }');
  perform pg_temp.ok((select proargnames from pg_proc where oid = 'public.set_loi_signature_metadata(uuid, text, text)'::regprocedure) = '{p_loi_id,p_ip_address,p_user_agent}',
    'capture-loi-metadata sends { p_loi_id, p_ip_address, p_user_agent }');
  perform pg_temp.ok((select proargnames from pg_proc where oid = 'public.change_user_role(uuid, text, text, text)'::regprocedure) = '{target_user_id,new_role,new_status,reason}',
    'UsersTab.tsx / ArchiveLibraryTab.tsx send { target_user_id, new_role, new_status, reason }');
end $$;

-- live_impact_stats returns what it did before (anon, as the public site calls it).
begin;
select pg_temp.ok(pg_temp.run_as('select (active_pilots, total_fleets, total_cities)::text from public.live_impact_stats()', 'anon', null)
  = format('(%s,%s,%s)', :before_pilots, :before_fleets, :before_cities), 'live_impact_stats unchanged');
commit;

-- is_admin: same answers. touch_last_active and change_user_role still work.
begin;
select pg_temp.ok(pg_temp.run_as('select public.is_admin()::text', 'authenticated', '00000000-0000-0000-0000-00000000000a') = 'true', 'is_admin admin');
select pg_temp.ok(pg_temp.run_as('select public.is_admin()::text', 'authenticated', '00000000-0000-0000-0000-00000000000f') = 'false', 'is_admin fleet');
select pg_temp.ok(pg_temp.run_as('select public.is_admin()::text', 'anon', null) = 'false', 'is_admin anon');
select pg_temp.run_as('select public.touch_last_active()::text', 'authenticated', '00000000-0000-0000-0000-00000000000f');
select pg_temp.ok((select last_active_at is not null from public.profiles where id = '00000000-0000-0000-0000-00000000000f'), 'touch_last_active');
select pg_temp.run_as($q$select public.change_user_role(target_user_id := '00000000-0000-0000-0000-000000000010', new_role := 'fleet_owner', new_status := 'active', reason := 'Approved')::text$q$,
  'authenticated', '00000000-0000-0000-0000-00000000000a');
select pg_temp.ok((select status from public.profiles where id = '00000000-0000-0000-0000-000000000010') = 'active', 'change_user_role as admin');
select pg_temp.fails_as($q$select public.change_user_role(target_user_id := '00000000-0000-0000-0000-000000000010', new_role := 'admin', reason := 'Promote me')$q$,
  'authenticated', '00000000-0000-0000-0000-00000000000f', 'P0001', 'Only admins can change roles');
rollback;

-- ---------------------------------------------------------------------------
-- rollback_unsigned_pilot
-- ---------------------------------------------------------------------------
begin;
select pg_temp.fails_as($q$select public.rollback_unsigned_pilot(p_id := '10000000-0000-0000-0000-000000000001')$q$,
  'anon', null, '42501', 'permission denied%');
select pg_temp.fails_as($q$select public.rollback_unsigned_pilot(p_id := '10000000-0000-0000-0000-000000000001')$q$,
  'authenticated', null, '42501', '%sign in first%');
-- G cannot roll back F's application, and gets the same answer as for an unknown id.
select pg_temp.fails_as($q$select public.rollback_unsigned_pilot(p_id := '10000000-0000-0000-0000-000000000001')$q$,
  'authenticated', '00000000-0000-0000-0000-00000000000e', '42501', '%no pending application of yours%');
select pg_temp.fails_as($q$select public.rollback_unsigned_pilot(p_id := '10000000-0000-0000-0000-0000000000ff')$q$,
  'authenticated', '00000000-0000-0000-0000-00000000000f', '42501', '%no pending application of yours%');
-- H's application has a signed LOI.
select pg_temp.fails_as($q$select public.rollback_unsigned_pilot(p_id := '10000000-0000-0000-0000-000000000003')$q$,
  'authenticated', '00000000-0000-0000-0000-00000000000c', '42501', '%no pending application of yours%');
select pg_temp.fails_as($q$select public.rollback_unsigned_pilot(p_id := '10000000-0000-0000-0000-000000000003')$q$,
  'authenticated', '00000000-0000-0000-0000-00000000000a', '42501', '%LOI is attached%');
select pg_temp.ok((select count(*) from public.pilot_applications) = 4, 'refused rollbacks deleted nothing');
-- The owner rolls back their own pending, unsigned application.
select pg_temp.ok(pg_temp.run_as($q$select public.rollback_unsigned_pilot(p_id := '10000000-0000-0000-0000-000000000001')::text$q$,
  'authenticated', '00000000-0000-0000-0000-00000000000f') = 'true', 'owner rollback returns true');
select pg_temp.ok(not exists (select 1 from public.pilot_applications where id = '10000000-0000-0000-0000-000000000001'), 'owner rollback deleted the row');
select pg_temp.ok((select count(*) from public.permanent_deletions) = 0, 'owner rollback writes no snapshot');
-- An owner cannot roll back an application an admin has already moved on.
insert into public.pilot_applications (id, user_id, status) values
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-00000000000f', 'in_review');
select pg_temp.fails_as($q$select public.rollback_unsigned_pilot(p_id := '10000000-0000-0000-0000-000000000005')$q$,
  'authenticated', '00000000-0000-0000-0000-00000000000f', '42501', '%no pending application of yours%');
-- An admin can roll back someone else's unsigned application, with a snapshot.
select pg_temp.ok(pg_temp.run_as($q$select public.rollback_unsigned_pilot(p_id := '10000000-0000-0000-0000-000000000002')::text$q$,
  'authenticated', '00000000-0000-0000-0000-00000000000a') = 'true', 'admin rollback returns true');
select pg_temp.ok((select count(*) from public.permanent_deletions where entity_id = '10000000-0000-0000-0000-000000000002'
  and entity_type = 'pilot_application' and deleted_by = '00000000-0000-0000-0000-00000000000a') = 1, 'admin rollback snapshotted');
rollback;

-- ---------------------------------------------------------------------------
-- restore_loi
-- ---------------------------------------------------------------------------
begin;
update public.loi_signatures set archived_at = now(), archived_by = '00000000-0000-0000-0000-00000000000a',
  archive_reason = 'Customer withdrew' where id = '20000000-0000-0000-0000-000000000001';
select pg_temp.fails_as($q$select public.restore_loi('20000000-0000-0000-0000-000000000001')$q$, 'anon', null, '42501', 'permission denied%');
select pg_temp.fails_as($q$select public.restore_loi('20000000-0000-0000-0000-000000000001')$q$,
  'authenticated', '00000000-0000-0000-0000-00000000000c', '42501', 'Only admins can restore LOIs');
-- One positional argument.
select pg_temp.run_as($q$select public.restore_loi('20000000-0000-0000-0000-000000000001')::text$q$, 'authenticated', '00000000-0000-0000-0000-00000000000a');
select pg_temp.ok((select archived_at is null and archived_by is null and archive_reason like 'Customer withdrew [restored %]'
  from public.loi_signatures where id = '20000000-0000-0000-0000-000000000001'), 'restore with one argument');
-- Named, exactly as ArchiveLibraryTab.tsx sends it (reason given).
update public.loi_signatures set archived_at = now() where id = '20000000-0000-0000-0000-000000000001';
select pg_temp.run_as($q$select public.restore_loi(p_loi_id := '20000000-0000-0000-0000-000000000001', p_reason := 'Signed again by phone')::text$q$,
  'authenticated', '00000000-0000-0000-0000-00000000000a');
select pg_temp.ok((select archived_at is null and archive_reason like '%[RESTORED %: Signed again by phone]'
  from public.loi_signatures where id = '20000000-0000-0000-0000-000000000001'), 'restore with named reason');
-- Named with p_reason null (the site sends reason || null) and named without p_reason.
update public.loi_signatures set archived_at = now() where id = '20000000-0000-0000-0000-000000000001';
select pg_temp.run_as($q$select public.restore_loi(p_loi_id := '20000000-0000-0000-0000-000000000001', p_reason := null)::text$q$,
  'authenticated', '00000000-0000-0000-0000-00000000000a');
update public.loi_signatures set archived_at = now() where id = '20000000-0000-0000-0000-000000000001';
select pg_temp.run_as($q$select public.restore_loi(p_loi_id := '20000000-0000-0000-0000-000000000001')::text$q$,
  'authenticated', '00000000-0000-0000-0000-00000000000a');
select pg_temp.ok((select archived_at is null from public.loi_signatures where id = '20000000-0000-0000-0000-000000000001'), 'restore named, no reason');
-- Restoring an LOI that is not archived is an error, not a silent no-op.
select pg_temp.fails_as($q$select public.restore_loi('20000000-0000-0000-0000-000000000001', 'again')$q$,
  'authenticated', '00000000-0000-0000-0000-00000000000a', 'P0002', '%no archived LOI%');
rollback;

-- ---------------------------------------------------------------------------
-- set_loi_signature_metadata
-- ---------------------------------------------------------------------------
begin;
select pg_temp.fails_as($q$select public.set_loi_signature_metadata(p_loi_id := '20000000-0000-0000-0000-000000000001', p_ip_address := '203.0.113.9', p_user_agent := 'x')$q$,
  'anon', null, '42501', 'permission denied%');
select pg_temp.fails_as($q$select public.set_loi_signature_metadata(p_loi_id := '20000000-0000-0000-0000-000000000001', p_ip_address := '203.0.113.9', p_user_agent := 'x')$q$,
  'authenticated', '00000000-0000-0000-0000-00000000000f', 'P0001', 'Not authorized');
-- The signer (the edge function forwards their JWT).
select pg_temp.run_as($q$select public.set_loi_signature_metadata(p_loi_id := '20000000-0000-0000-0000-000000000001', p_ip_address := '198.51.100.7', p_user_agent := 'Signer UA')::text$q$,
  'authenticated', '00000000-0000-0000-0000-00000000000c');
select pg_temp.ok((select ip_address = '198.51.100.7' and user_agent = 'Signer UA' from public.loi_signatures
  where id = '20000000-0000-0000-0000-000000000001'), 'owner sets LOI metadata');
-- The service role with no user JWT (edge function server-side path).
select pg_temp.run_as($q$select public.set_loi_signature_metadata(p_loi_id := '20000000-0000-0000-0000-000000000001', p_ip_address := '198.51.100.8', p_user_agent := null)::text$q$,
  'service_role', null);
select pg_temp.ok((select ip_address = '198.51.100.8' from public.loi_signatures where id = '20000000-0000-0000-0000-000000000001'),
  'service role sets LOI metadata');
rollback;

-- ---------------------------------------------------------------------------
-- admin_hard_delete_user
-- ---------------------------------------------------------------------------
begin;
select pg_temp.fails_as($q$select public.admin_hard_delete_user(p_user_id := '00000000-0000-0000-0000-00000000000d', p_reason := 'Requested by the customer')$q$,
  'anon', null, '42501', 'permission denied%');
select pg_temp.fails_as($q$select public.admin_hard_delete_user(p_user_id := '00000000-0000-0000-0000-00000000000d', p_reason := 'Requested by the customer')$q$,
  'authenticated', '00000000-0000-0000-0000-00000000000f', '42501', 'Admin only');
select pg_temp.fails_as($q$select public.admin_hard_delete_user(p_user_id := '00000000-0000-0000-0000-00000000000a', p_reason := 'Requested by the customer')$q$,
  'authenticated', '00000000-0000-0000-0000-00000000000a', 'P0001', 'You cannot delete your own account');
select pg_temp.fails_as($q$select public.admin_hard_delete_user(p_user_id := '00000000-0000-0000-0000-00000000000d', p_reason := null)$q$,
  'authenticated', '00000000-0000-0000-0000-00000000000a', 'P0001', '%at least 10 chars%');
select pg_temp.fails_as($q$select public.admin_hard_delete_user(p_user_id := '00000000-0000-0000-0000-00000000000d', p_reason := 'too short')$q$,
  'authenticated', '00000000-0000-0000-0000-00000000000a', 'P0001', '%at least 10 chars%');
select pg_temp.fails_as($q$select public.admin_hard_delete_user(p_user_id := '00000000-0000-0000-0000-0000000000ff', p_reason := 'Requested by the customer')$q$,
  'authenticated', '00000000-0000-0000-0000-00000000000a', 'P0002', '%user not found%');
-- A2 changed G's role, so deleting A2 would break G's audit trail.
select pg_temp.fails_as($q$select public.admin_hard_delete_user(p_user_id := '00000000-0000-0000-0000-00000000000b', p_reason := 'Requested by the customer')$q$,
  'authenticated', '00000000-0000-0000-0000-00000000000a', '23503', '%recorded actor on 1 audit row%');
select pg_temp.ok((select count(*) from auth.users) = 7 and (select count(*) from public.permanent_deletions) = 0,
  'refused deletes changed nothing');

-- The real delete of T: profile, LOI with an amendment, approved application,
-- accepted invitation, own and admin-made role history, a draft, an org T
-- created and a user T invited.
select pg_temp.run_as($q$select public.admin_hard_delete_user(p_user_id := '00000000-0000-0000-0000-00000000000d', p_reason := 'Requested by the customer')::text$q$,
  'authenticated', '00000000-0000-0000-0000-00000000000a');
select pg_temp.ok(not exists (select 1 from auth.users where id = '00000000-0000-0000-0000-00000000000d'), 'auth user gone');
select pg_temp.ok(not exists (select 1 from public.profiles where id = '00000000-0000-0000-0000-00000000000d'), 'profile gone');
select pg_temp.ok(not exists (select 1 from public.pilot_applications where user_id = '00000000-0000-0000-0000-00000000000d'), 'applications gone');
select pg_temp.ok(not exists (select 1 from public.loi_signatures where user_id = '00000000-0000-0000-0000-00000000000d'), 'LOIs gone');
select pg_temp.ok((select count(*) from public.loi_amendments) = 0, 'amendments gone');
select pg_temp.ok((select count(*) from public.invitations) = 0, 'invitations gone');
select pg_temp.ok(not exists (select 1 from public.role_history where user_id = '00000000-0000-0000-0000-00000000000d'), 'role history gone');
select pg_temp.ok((select count(*) from public.pilot_application_drafts) = 0, 'draft gone');
select pg_temp.ok((select created_by is null from public.organizations where id = '30000000-0000-0000-0000-000000000001'), 'org kept, creator cleared');
select pg_temp.ok((select invited_by is null from public.profiles where id = '00000000-0000-0000-0000-000000000010'), 'invited user kept, inviter cleared');
select pg_temp.ok((select count(*) from public.role_history where user_id = '00000000-0000-0000-0000-00000000000e') = 1, 'other users history kept');
select pg_temp.ok((select count(*) from public.loi_signatures) = 1 and (select count(*) from public.pilot_applications) = 3, 'other users rows kept');
select pg_temp.ok((select count(*) filter (where entity_type = 'user') = 1
                      and count(*) filter (where entity_type = 'loi_signature') = 1
                      and count(*) filter (where entity_type = 'pilot_application') = 1
                      and count(*) filter (where entity_type = 'invitation') = 1
                      and bool_and(deleted_by = '00000000-0000-0000-0000-00000000000a')
                   from public.permanent_deletions), 'one snapshot per deleted row, by the acting admin');
select pg_temp.ok((select jsonb_array_length(entity_snapshot -> 'amendments') = 1 from public.permanent_deletions where entity_type = 'loi_signature'),
  'LOI snapshot keeps its amendment');
select pg_temp.ok((select jsonb_array_length(entity_snapshot -> 'role_history') = 2 and entity_snapshot ->> 'email' = 't@x'
  from public.permanent_deletions where entity_type = 'user'), 'user snapshot keeps profile and role history');
commit;

\echo audit_round2_safe: all checks passed
