-- Server-side test for migration 025 (staff-only fleet messages, the
-- invitation email ledger, LOI metadata grants).
--
-- Builds the database from the repo the way the 024 test does: Supabase
-- stand-ins, then supabase-schema.sql and every migration from 001 to 024
-- (013 and 021 print their expected fresh-database errors). Then it adds
-- users, an admin, applications and an invitation from before 025, and
-- checks:
--   * before 025 an applicant could insert fleet_visible_message and
--     reviewed_by; after it the wizard's insert still works and either of
--     those columns is refused (42501); anon cannot insert at all
--   * an admin still updates the message, status and review columns
--   * 025 cleared the messages whose reviewed_by is not an admin (the
--     applicant's own id included) and kept the one an admin saved
--   * the invitation ledger is closed to anon and authenticated, open to the
--     service role, rejects a duplicate key, and was seeded once with the
--     existing invitation
--   * anon and PUBLIC have no EXECUTE on set_loi_signature_metadata;
--     authenticated and service_role keep it
--   * 025 applies twice and the second apply changes nothing
--
-- Runs against a throwaway Postgres. Never run it against a real project.
-- From the repo root:
--
--   docker run -d --rm --name t25pg -e POSTGRES_PASSWORD=x -v "$PWD":/repo:ro postgres:17-alpine
--   until docker exec t25pg pg_isready -q; do sleep 1; done
--   docker exec -w /repo t25pg psql -U postgres -v ON_ERROR_STOP=1 \
--     -v mig=supabase/migrations/20261022_025_staff_messages_invite_ledger.sql \
--     -f supabase/tests/025_staff_messages_invite_ledger.test.sql
--   docker rm -f t25pg
--
-- Prints "staff_messages_invite_ledger: all checks passed" or stops at the
-- first failure.
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
  if not exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then create role supabase_auth_admin nologin; end if;
end $$;
alter role service_role bypassrls;   -- as live

create schema extensions;
create extension pgcrypto with schema extensions;
set search_path = "$user", public, extensions;

create schema auth;
create table auth.users (
  id uuid primary key,
  email text,
  email_confirmed_at timestamptz,
  raw_user_meta_data jsonb
);
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;

-- Database Webhooks: a stand-in for supabase_functions.http_request that
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

set client_min_messages = error;
create publication supabase_realtime;
set client_min_messages = warning;

-- Supabase's default privileges in schema public, the same on live.
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- The repo, in order, up to 023.
-- ---------------------------------------------------------------------------
\ir ../../supabase-schema.sql
\ir ../migrations/20260504_001_security_fix.sql
\ir ../migrations/20260504_002_role_management.sql
\ir ../migrations/20260504_003_jwt_claims.sql
\ir ../migrations/20260505_004_signup_trigger_fix.sql
\ir ../migrations/20260505_005_restore_name_columns.sql
\ir ../migrations/20260505_006_investor_leads.sql
\ir ../migrations/20260506_007_loi_signatures.sql
\ir ../migrations/20260506_008_loi_amendments.sql
\ir ../migrations/20260506_009_archive_library.sql
\ir ../migrations/20260506_010_security_fixes.sql
\ir ../migrations/20260506_011_audit_round2.sql
\ir ../migrations/20260511_012_investor_visits.sql
\echo staff_messages_invite_ledger: 013 fails on a fresh database (investor_journey needs columns only live had); expected:
\set ON_ERROR_STOP 0
\ir ../migrations/20260511_013_investor_lead_session_id.sql
\set ON_ERROR_STOP 1
\ir ../migrations/20260518_014_pilot_application_enhancements.sql
\ir ../migrations/20260617_015_contact_messages.sql
\ir ../migrations/20260620_016_fix_profile_privilege_escalation.sql
\ir ../migrations/20261017_017_start_impersonation.sql
\ir ../migrations/20261017_018_close_anon_reads.sql
\ir ../migrations/20261018_019_audit_round2_safe.sql
\ir ../migrations/20261018_020_contact_messages_inbox.sql
\echo staff_messages_invite_ledger: 021 fails on a fresh database (three functions only live had); expected:
\set ON_ERROR_STOP 0
\ir ../migrations/20261022_021_revoke_public_execute.sql
\set ON_ERROR_STOP 1
\ir ../migrations/20261022_022_invites_and_profiles.sql
\ir ../migrations/20261022_023_restate_live_state.sql
\ir ../migrations/20261022_024_pilot_email_no_key.sql
set client_min_messages = warning;

-- ---------------------------------------------------------------------------
-- Helpers (as in the 024 test).
-- ---------------------------------------------------------------------------
create function pg_temp.ok(p_cond boolean, p_what text) returns void language plpgsql as $$
begin
  if p_cond is not true then raise exception 'FAILED: %', p_what; end if;
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

create function pg_temp.fails_as(p_sql text, p_role text, p_sub text, p_state text) returns void language plpgsql as $$
declare v_state text;
begin
  execute format('set local role %I', p_role);
  perform set_config('request.jwt.claim.sub', coalesce(p_sub, ''), true);
  begin
    execute p_sql;
  exception when others then
    get stacked diagnostics v_state = returned_sqlstate;
    execute 'reset role';
    perform set_config('request.jwt.claim.sub', '', true);
    if v_state <> p_state then
      raise exception 'FAILED: % as % gave %, expected %', p_sql, p_role, v_state, p_state;
    end if;
    return;
  end;
  execute 'reset role';
  raise exception 'FAILED: expected an error from % as %', p_sql, p_role;
end $$;

-- ---------------------------------------------------------------------------
-- Data from before 025.
-- ---------------------------------------------------------------------------
\set adm '''00000000-0000-0000-0000-0000000000a1'''
\set u1 '''00000000-0000-0000-0000-0000000000c1'''
\set u2 '''00000000-0000-0000-0000-0000000000c2'''
\set u3 '''00000000-0000-0000-0000-0000000000c3'''
\set u4 '''00000000-0000-0000-0000-0000000000c4'''
\set app1 '''40000000-0000-0000-0000-000000000001'''
\set app2 '''40000000-0000-0000-0000-000000000002'''
\set app3 '''40000000-0000-0000-0000-000000000003'''
\set inv1 '''50000000-0000-0000-0000-000000000001'''
insert into auth.users (id, email) values
  (:adm, 'admin@example.com'), (:u1, 'one@example.com'), (:u2, 'two@example.com'),
  (:u3, 'three@example.com'), (:u4, 'four@example.com');
insert into public.profiles (id, role, status) values
  (:adm, 'admin', 'active'), (:u1, 'fleet_owner', 'active'), (:u2, 'fleet_owner', 'active'),
  (:u3, 'fleet_owner', 'active'), (:u4, 'fleet_owner', 'active')
on conflict (id) do update set role = excluded.role, status = excluded.status;

-- Before 025: an applicant sets the message and names themselves reviewer.
begin;
select pg_temp.ok(pg_temp.exec_as(format($q$insert into public.pilot_applications
  (id, user_id, company_name, contact_email, status, fleet_visible_message, reviewed_by)
  values (%L, %L, 'One Freight', 'victim@example.com', 'pending', 'Wire the deposit to evil.example', %L)$q$, :app1, :u1, :u1),
  'authenticated', :u1) = 1, 'before 025: an applicant could insert fleet_visible_message and reviewed_by');
commit;
-- An applicant's message with no reviewer, and one an admin saved.
insert into public.pilot_applications (id, user_id, company_name, contact_email, status, fleet_visible_message)
values (:app2, :u2, 'Two Freight', 'two@example.com', 'pending', 'Typed by the applicant');
insert into public.pilot_applications (id, user_id, company_name, contact_email, status, fleet_visible_message, reviewed_by, reviewed_at)
values (:app3, :u3, 'Three Freight', 'three@example.com', 'approved', 'Kickoff on Monday.', :adm, now());
insert into public.invitations (id, email, role, invited_by) values (:inv1, 'new@example.com', 'fleet_owner', :adm);

-- ---------------------------------------------------------------------------
-- Apply 025, twice.
-- ---------------------------------------------------------------------------
\i :mig
\i :mig

-- (2) Messages.
select pg_temp.ok((select fleet_visible_message from public.pilot_applications where id = :app1) is null,
  'the message from an applicant who named themselves reviewer was cleared');
select pg_temp.ok((select fleet_visible_message from public.pilot_applications where id = :app2) is null,
  'the message with no reviewer was cleared');
select pg_temp.ok((select fleet_visible_message from public.pilot_applications where id = :app3) = 'Kickoff on Monday.',
  'the message an admin saved is kept');

-- (1) Inserts.
select pg_temp.ok(not has_table_privilege('authenticated', 'public.pilot_applications', 'insert'),
  'authenticated has no table-wide insert');
select pg_temp.ok(not has_any_column_privilege('anon', 'public.pilot_applications', 'insert'), 'anon cannot insert');
select pg_temp.ok(bool_and(not has_column_privilege('authenticated', 'public.pilot_applications', c, 'insert')),
  'applicants cannot insert staff columns')
from unnest(array['fleet_visible_message', 'reviewed_by', 'reviewed_at', 'notes', 'organization_id', 'id', 'created_at']) c;

begin;
select pg_temp.ok(pg_temp.exec_as(format($q$insert into public.pilot_applications
  (user_id, company_name, truck_size, fleet_size, website, primary_lanes, fms_provider, fms_other,
   contact_name, contact_email, contact_phone, contact_title, application_notes, status)
  values (%L, 'Four Freight', 'Class 8', '11-50', null, 'I-35', 'Samsara', null,
   'Dana', 'dana@example.com', null, null, 'notes', 'pending')$q$, :u4), 'authenticated', :u4) = 1,
  'the wizard''s insert still works');
rollback;
begin;
select pg_temp.fails_as(format($q$insert into public.pilot_applications (user_id, company_name, status, fleet_visible_message)
  values (%L, 'Four Freight', 'pending', 'phish')$q$, :u4), 'authenticated', :u4, '42501');
rollback;
begin;
select pg_temp.fails_as(format($q$insert into public.pilot_applications (user_id, company_name, status, reviewed_by)
  values (%L, 'Four Freight', 'pending', %L)$q$, :u4, :u4), 'authenticated', :u4, '42501');
rollback;
begin;
select pg_temp.fails_as(format($q$insert into public.pilot_applications (user_id, company_name, status)
  values (%L, 'Four Freight', 'pending')$q$, :u4), 'anon', null, '42501');
rollback;

-- Admins still update; applicants still cannot.
begin;
select pg_temp.ok(pg_temp.exec_as(format($q$update public.pilot_applications
  set status = 'in_review', fleet_visible_message = 'Call Tuesday', reviewed_at = now(), reviewed_by = %L
  where id = %L$q$, :adm, :app2), 'authenticated', :adm) = 1, 'an admin saves a message and a status');
select pg_temp.ok(pg_temp.exec_as(format($q$update public.pilot_applications set fleet_visible_message = 'x' where id = %L$q$, :app3),
  'authenticated', :u3) = 0, 'an applicant updates nothing');
rollback;

-- (3) Invitation ledger.
select pg_temp.ok((select string_agg(key, ',') from public.invitation_emails_sent) = 'invitations:' || :inv1,
  'the ledger was seeded once with the existing invitation');
begin;
select pg_temp.fails_as($q$select count(*) from public.invitation_emails_sent$q$, 'anon', null, '42501');
select pg_temp.fails_as($q$insert into public.invitation_emails_sent (key) values ('invitations:x')$q$, 'anon', null, '42501');
select pg_temp.fails_as($q$select count(*) from public.invitation_emails_sent$q$, 'authenticated', :adm, '42501');
select pg_temp.fails_as($q$insert into public.invitation_emails_sent (key) values ('invitations:x')$q$, 'authenticated', :adm, '42501');
select pg_temp.ok(pg_temp.exec_as($q$insert into public.invitation_emails_sent (key) values ('invitations:new')$q$, 'service_role', null) = 1,
  'the service role records an email');
select pg_temp.fails_as($q$insert into public.invitation_emails_sent (key) values ('invitations:new')$q$, 'service_role', null, '23505');
select pg_temp.fails_as($q$insert into public.invitation_emails_sent (key) values (repeat('k', 201))$q$, 'service_role', null, '23514');
rollback;

-- (4) LOI metadata.
select pg_temp.ok(not has_function_privilege('anon', 'public.set_loi_signature_metadata(uuid, text, text)', 'execute'),
  'anon cannot execute set_loi_signature_metadata');
select pg_temp.ok(not exists (
    select 1 from pg_proc p, aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
    where p.oid = 'public.set_loi_signature_metadata(uuid, text, text)'::regprocedure
      and a.grantee = 0 and a.privilege_type = 'EXECUTE'),
  'PUBLIC has no execute on set_loi_signature_metadata');
select pg_temp.ok(has_function_privilege('authenticated', 'public.set_loi_signature_metadata(uuid, text, text)', 'execute')
  and has_function_privilege('service_role', 'public.set_loi_signature_metadata(uuid, text, text)', 'execute'),
  'authenticated and service_role keep execute');

\o
\echo staff_messages_invite_ledger: all checks passed
