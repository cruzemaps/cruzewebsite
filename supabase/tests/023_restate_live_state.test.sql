-- Server-side test for migration 023 (restate the live database state).
--
-- Builds a database from the repo: Supabase stand-ins, then
-- supabase-schema.sql and every migration from 001 to 022 in filename order.
-- Two of them fail on a fresh database and are run with ON_ERROR_STOP off,
-- statement by statement, so the rest of each file still applies:
--   013  its view investor_journey reads investor_leads.company and .source,
--        columns only live had (023 adds them and restates the view)
--   021  revokes on three functions only live had: admin_search_companies,
--        check_company_status and capture_investor_lead(text, text, text, text)
-- Then it shows the drift, applies 023 twice and checks:
--   * the second apply changes nothing
--   * every function, view, policy and trigger in public, and the signup
--     trigger on auth.users, matches live: md5 of pg_get_functiondef,
--     pg_get_viewdef, pg_get_triggerdef and of each policy's qual and
--     with_check, captured from the live project on 2026-10-22, plus grants,
--     SECURITY DEFINER, search_path and view options. Not only the objects 023
--     restates: the whole rebuilt database is held to live.
--   * every table's RLS flags, table grants and column grants match live
--   * the restated columns, defaults, constraints, schema grant, pg_trgm and
--     realtime publication match live
--   * the company lookups work on the rebuilt database, and the restated
--     pilot insert policy refuses a non-pending application
--   * what 023 must not touch: the repo-only objects from 006 are still there,
--     and the items left for a separate decision (the two send-pilot-email
--     webhooks, the table "Website", the four-argument capture_investor_lead)
--     were not added
--
-- Runs against a throwaway Postgres. Never run it against a real project.
-- From the repo root:
--
--   docker run -d --rm --name t23pg -e POSTGRES_PASSWORD=x -v "$PWD":/repo:ro postgres:17-alpine
--   until docker exec t23pg pg_isready -q; do sleep 1; done
--   docker exec -w /repo t23pg psql -U postgres -v ON_ERROR_STOP=1 \
--     -v mig=supabase/migrations/20261022_023_restate_live_state.sql \
--     -f supabase/tests/023_restate_live_state.test.sql
--   docker rm -f t23pg
--
-- Needs Postgres 17, the version live runs: the md5 values are of definitions
-- as Postgres 17 prints them, and Postgres 15 prints single-table views
-- differently. The expected errors from 013 and 021 are printed; the test
-- prints "restate_live_state: all checks passed" or stops at the first failure.
\set QUIET on
\o /dev/null
set client_min_messages = warning;

do $$ begin
  if current_setting('server_version_num')::int < 170000 then
    raise exception 'FAILED: run this test on Postgres 17 (found %), the version live runs',
      current_setting('server_version');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Supabase stand-ins. Roles are cluster-wide and CI runs other tests first.
-- ---------------------------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then create role supabase_auth_admin nologin; end if;
end $$;

-- Supabase keeps extensions in their own schema, on the search_path.
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

-- Database Webhooks.
create schema supabase_functions;
create function supabase_functions.http_request() returns trigger language plpgsql as
  $$ begin return new; end $$;
grant usage on schema supabase_functions to anon, authenticated, service_role;

-- Realtime's publication, empty on a new project.
set client_min_messages = error;
create publication supabase_realtime;
set client_min_messages = warning;

-- Supabase's default privileges in schema public, the same on live.
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- The repo, in order.
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
\echo restate_live_state: 013 fails on a fresh database (investor_journey needs columns only live had); expected:
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
\echo restate_live_state: 021 fails on a fresh database (three functions only live had); expected:
\set ON_ERROR_STOP 0
\ir ../migrations/20261022_021_revoke_public_execute.sql
\set ON_ERROR_STOP 1
\ir ../migrations/20261022_022_invites_and_profiles.sql
set client_min_messages = warning;

-- ---------------------------------------------------------------------------
-- Helpers.
-- ---------------------------------------------------------------------------
create function pg_temp.ok(p_cond boolean, p_what text) returns void language plpgsql as $$
begin
  if p_cond is not true then raise exception 'FAILED: %', p_what; end if;
end $$;

-- Grants as text, one "grantee=privileges" per role. MAINTAIN only exists from
-- Postgres 17, so it is left out to compare with any version.
create function pg_temp.acl(p_acl aclitem[]) returns text language sql stable as $$
  select coalesce(string_agg(g, ' ' order by g collate "C"), '') from (
    select (case when a.grantee = 0 then 'PUBLIC' else pg_get_userbyid(a.grantee)::text end) || '=' ||
           string_agg(a.privilege_type, ',' order by a.privilege_type collate "C") as g
    from aclexplode(p_acl) a
    where a.privilege_type <> 'MAINTAIN'
    group by a.grantee) s
$$;

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
-- Live values, captured from CruzeMaps Web Admin on 2026-10-22 (Postgres 17.6)
-- with read-only catalog queries.
-- ---------------------------------------------------------------------------
create temp table live_functions (fn text, def_md5 text, acl text, secdef boolean, config text);
insert into live_functions values
  ('accept_invitation(text)', '231cb595edf3fdecdaffcba0082a0d81', 'authenticated=EXECUTE postgres=EXECUTE service_role=EXECUTE', true, 'search_path=public, pg_temp'),
  ('admin_hard_delete_invitation(uuid,text)', '7abb8f594299ccc82286d4b4d55ce83a', 'authenticated=EXECUTE postgres=EXECUTE service_role=EXECUTE', true, 'search_path=public'),
  ('admin_hard_delete_loi(uuid,text)', '75a4120fbefa8f0213faa1a4dd8e34b7', 'authenticated=EXECUTE postgres=EXECUTE service_role=EXECUTE', true, 'search_path=public'),
  ('admin_hard_delete_pilot_application(uuid,text)', 'c068b8ace3ca0e860c2625fbd7e5701b', 'authenticated=EXECUTE postgres=EXECUTE service_role=EXECUTE', true, 'search_path=public'),
  ('admin_hard_delete_user(uuid,text)', '7a8903b0273d7875528fe2a31264751e', 'authenticated=EXECUTE postgres=EXECUTE service_role=EXECUTE', true, 'search_path=public, pg_temp'),
  ('admin_search_companies(text,real)', '3cf6948e5055cfec898060fc328af666', 'authenticated=EXECUTE postgres=EXECUTE service_role=EXECUTE', true, 'search_path=public'),
  ('archive_loi(uuid,text)', '38c4037db747317d899b51cd9e2a3548', 'authenticated=EXECUTE postgres=EXECUTE service_role=EXECUTE', true, 'search_path=public'),
  ('capture_investor_lead(text,text,text,text,text)', '989e57138118053cf7ac6f8e81d7f2b0', 'anon=EXECUTE authenticated=EXECUTE postgres=EXECUTE service_role=EXECUTE', true, 'search_path=public'),
  ('change_user_role(uuid,text,text,text)', '58cc76842d6b69ca1d284dd77bac7a7a', 'authenticated=EXECUTE postgres=EXECUTE service_role=EXECUTE', true, 'search_path=public, pg_temp'),
  ('check_company_status(text)', '321493e56e62113621e088c1c35ddbe6', 'postgres=EXECUTE service_role=EXECUTE', true, 'search_path=public'),
  ('custom_access_token_hook(jsonb)', '87a30ab72a7d991d5f9b1ad0a4693383', 'postgres=EXECUTE service_role=EXECUTE supabase_auth_admin=EXECUTE', false, ''),
  ('delete_pilot_draft()', '4159d037dd6673a4f46fc3929e4e0891', 'authenticated=EXECUTE postgres=EXECUTE service_role=EXECUTE', true, 'search_path=public'),
  ('get_pilot_draft()', 'c3f748d7e308e98ec110d9d1da648e57', 'authenticated=EXECUTE postgres=EXECUTE service_role=EXECUTE', true, 'search_path=public'),
  ('handle_new_user()', 'dc841ddfcc6ae4f478169a9e26c67932', 'postgres=EXECUTE service_role=EXECUTE', true, 'search_path=public'),
  ('invite_requires_confirmed_email()', 'f245eb8180c57a3b93c201d6435f433f', 'postgres=EXECUTE service_role=EXECUTE', false, 'search_path=public'),
  ('is_admin()', 'aba3f3c75c8f7d1192268a9f4bce7f8e', 'anon=EXECUTE authenticated=EXECUTE postgres=EXECUTE service_role=EXECUTE', true, 'search_path=public, pg_temp'),
  ('live_impact_stats()', '7a289c891a86aac8c319e875256bec61', 'anon=EXECUTE authenticated=EXECUTE postgres=EXECUTE service_role=EXECUTE', true, 'search_path=public, pg_temp'),
  ('log_investor_visit(text,text,text,text,text,text,text)', '3809a503e6f287b44ee5e51c39bb3fe7', 'anon=EXECUTE authenticated=EXECUTE postgres=EXECUTE service_role=EXECUTE', true, 'search_path=public'),
  ('normalize_company_name(text)', 'dc7069df8daebe72cc7c9518227c1e49', 'PUBLIC=EXECUTE anon=EXECUTE authenticated=EXECUTE postgres=EXECUTE service_role=EXECUTE', false, ''),
  ('restore_loi(uuid,text)', '1c2bdde545c4d980857ba4126c9f8439', 'authenticated=EXECUTE postgres=EXECUTE service_role=EXECUTE', true, 'search_path=public, pg_temp'),
  ('rollback_unsigned_pilot(uuid)', 'f66fbb1bb63ad2cdff5346ec9de1c61f', 'authenticated=EXECUTE postgres=EXECUTE service_role=EXECUTE', true, 'search_path=public, pg_temp'),
  ('set_loi_signature_metadata(uuid,text,text)', '04b4ad813eb5e2302f7134232a83b8cd', 'authenticated=EXECUTE postgres=EXECUTE service_role=EXECUTE', true, 'search_path=public'),
  ('start_impersonation(uuid)', 'e06c470a6b03c5b459ad4c705bc01456', 'authenticated=EXECUTE postgres=EXECUTE service_role=EXECUTE', true, 'search_path=public'),
  ('touch_last_active()', '1890512b6e40c86c97bfcc79e1814d46', 'authenticated=EXECUTE postgres=EXECUTE service_role=EXECUTE', true, 'search_path=public, pg_temp'),
  ('upsert_pilot_draft(jsonb)', '2fb416601cad30760d85a0da7340d817', 'authenticated=EXECUTE postgres=EXECUTE service_role=EXECUTE', true, 'search_path=public');

create temp table live_views (name text, def_md5 text, options text, acl text);
insert into live_views values
  ('archived_counts', '3f749be2cc0df8692666e863d6506fd8', 'security_invoker=true', 'authenticated=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE postgres=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE service_role=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE'),
  ('company_signals', '06907a068394c9ea8df439b1b0fdf426', 'security_invoker=true', 'postgres=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE service_role=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE'),
  ('investor_journey', 'dac1d8da2bdac7cad0b14177f8eb9987', 'security_invoker=true', 'authenticated=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE postgres=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE service_role=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE'),
  ('loi_amendment_counts', '87ca6813a697a170272d4fc7e20ed67c', 'security_invoker=true', 'authenticated=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE postgres=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE service_role=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE'),
  ('user_latest_loi', '4d81ad943b0bbfa1455662952e246391', 'security_invoker=true', 'authenticated=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE postgres=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE service_role=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE');

create temp table live_policies (tbl text, name text, permissive text, roles text, cmd text, qual_md5 text, check_md5 text);
insert into live_policies values
  ('contact_messages', 'Admins mark contact messages handled', 'PERMISSIVE', 'public', 'UPDATE', '5533b5b0c6cb6bc41c771c2f6a2c8f37', '5533b5b0c6cb6bc41c771c2f6a2c8f37'),
  ('contact_messages', 'Admins read contact messages', 'PERMISSIVE', 'public', 'SELECT', '5533b5b0c6cb6bc41c771c2f6a2c8f37', 'd41d8cd98f00b204e9800998ecf8427e'),
  ('contact_messages', 'Anyone can send a contact message', 'PERMISSIVE', 'anon,authenticated', 'INSERT', 'd41d8cd98f00b204e9800998ecf8427e', 'b326b5062b2f0e69046810717534cb09'),
  ('investor_leads', 'Service role read investor_leads', 'PERMISSIVE', 'public', 'SELECT', '68934a3e9455fa72420237eb05902327', 'd41d8cd98f00b204e9800998ecf8427e'),
  ('investor_visits', 'Admins read investor visits', 'PERMISSIVE', 'public', 'SELECT', '5533b5b0c6cb6bc41c771c2f6a2c8f37', 'd41d8cd98f00b204e9800998ecf8427e'),
  ('invitations', 'Admins manage invitations', 'PERMISSIVE', 'public', 'ALL', '5533b5b0c6cb6bc41c771c2f6a2c8f37', '5533b5b0c6cb6bc41c771c2f6a2c8f37'),
  ('loi_amendments', 'Admins read amendments', 'PERMISSIVE', 'public', 'SELECT', '5533b5b0c6cb6bc41c771c2f6a2c8f37', 'd41d8cd98f00b204e9800998ecf8427e'),
  ('loi_amendments', 'Admins write amendments', 'PERMISSIVE', 'public', 'INSERT', 'd41d8cd98f00b204e9800998ecf8427e', 'c77c80c1012d83a4f69fcef60f2e8d23'),
  ('loi_amendments', 'Users read own amendments', 'PERMISSIVE', 'public', 'SELECT', 'bc34985da44d28026180c9734ed66e28', 'd41d8cd98f00b204e9800998ecf8427e'),
  ('loi_signatures', 'Admins archive LOIs', 'PERMISSIVE', 'public', 'UPDATE', '5533b5b0c6cb6bc41c771c2f6a2c8f37', '5533b5b0c6cb6bc41c771c2f6a2c8f37'),
  ('loi_signatures', 'Users see own LOI', 'PERMISSIVE', 'public', 'SELECT', '6742181ab65a8d27c5ff8bcd47790404', 'd41d8cd98f00b204e9800998ecf8427e'),
  ('loi_signatures', 'Users sign own LOI', 'PERMISSIVE', 'public', 'INSERT', 'd41d8cd98f00b204e9800998ecf8427e', '19300d155780585259ede73ac370586c'),
  ('organizations', 'Admins manage organizations', 'PERMISSIVE', 'public', 'ALL', '5533b5b0c6cb6bc41c771c2f6a2c8f37', '5533b5b0c6cb6bc41c771c2f6a2c8f37'),
  ('organizations', 'Members can view their org', 'PERMISSIVE', 'public', 'SELECT', '544ac2e224aeeccf0bd94f42621e6403', 'd41d8cd98f00b204e9800998ecf8427e'),
  ('permanent_deletions', 'Admins read deletions', 'PERMISSIVE', 'public', 'SELECT', '5533b5b0c6cb6bc41c771c2f6a2c8f37', 'd41d8cd98f00b204e9800998ecf8427e'),
  ('pilot_application_drafts', 'Users manage own draft', 'PERMISSIVE', 'public', 'ALL', '19300d155780585259ede73ac370586c', '19300d155780585259ede73ac370586c'),
  ('pilot_applications', 'Admins can delete applications', 'PERMISSIVE', 'public', 'DELETE', '5533b5b0c6cb6bc41c771c2f6a2c8f37', 'd41d8cd98f00b204e9800998ecf8427e'),
  ('pilot_applications', 'Admins can update applications', 'PERMISSIVE', 'public', 'UPDATE', '5533b5b0c6cb6bc41c771c2f6a2c8f37', 'd41d8cd98f00b204e9800998ecf8427e'),
  ('pilot_applications', 'Users can insert own pilot application', 'PERMISSIVE', 'authenticated', 'INSERT', 'd41d8cd98f00b204e9800998ecf8427e', 'e3689c3048368b7c3923e0dcde24691e'),
  ('pilot_applications', 'Users can view own pilot application', 'PERMISSIVE', 'public', 'SELECT', 'eb77b2ac4ecac1d784543de5927f665c', 'd41d8cd98f00b204e9800998ecf8427e'),
  ('profiles', 'Admins can update all profiles', 'PERMISSIVE', 'public', 'UPDATE', '5533b5b0c6cb6bc41c771c2f6a2c8f37', '5533b5b0c6cb6bc41c771c2f6a2c8f37'),
  ('profiles', 'Users can update own profile', 'PERMISSIVE', 'public', 'UPDATE', 'bc9c729a84690340789a4e4f01175335', 'bc9c729a84690340789a4e4f01175335'),
  ('profiles', 'Users can view own profile', 'PERMISSIVE', 'public', 'SELECT', '822e421dda501eb75fa06e2612916f2b', 'd41d8cd98f00b204e9800998ecf8427e'),
  ('profiles', 'auth admin can read profiles for JWT', 'PERMISSIVE', 'supabase_auth_admin', 'SELECT', 'b326b5062b2f0e69046810717534cb09', 'd41d8cd98f00b204e9800998ecf8427e'),
  ('role_history', 'Users see own history', 'PERMISSIVE', 'public', 'SELECT', '6742181ab65a8d27c5ff8bcd47790404', 'd41d8cd98f00b204e9800998ecf8427e');

create temp table live_triggers (rel text, name text, def_md5 text);
insert into live_triggers values
  ('invitations', 'invite_email_on_insert', 'ccc52bd34d486b6611f2810b724d281a'),
  ('contact_messages', 'notify_discord_on_contact_message', '892a95138ac0210d5f4ad1e718df6873'),  -- an md5, not a key: gitleaks:allow
  ('loi_signatures', 'notify_discord_on_loi_signed', '1bca47ea4eca03db047a4b536d23ea93'),  -- an md5, not a key: gitleaks:allow
  ('pilot_applications', 'notify_discord_on_pilot_application', '0bf980eb16d0b06a5371eb968b011833'),  -- an md5, not a key: gitleaks:allow
  ('auth.users', 'on_auth_user_created', '786e53a33077b3a68f1ec248e238d18a');

create temp table live_tables (name text, rls boolean, force_rls boolean, acl text);
insert into live_tables values
  ('contact_messages', true, false, 'anon=REFERENCES,SELECT,TRIGGER authenticated=REFERENCES,SELECT,TRIGGER postgres=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE service_role=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE'),
  ('discord_notifications_sent', true, false, 'postgres=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE service_role=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE'),
  ('investor_leads', true, false, 'anon=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE authenticated=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE postgres=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE service_role=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE'),
  ('investor_visits', true, false, 'anon=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE authenticated=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE postgres=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE service_role=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE'),
  ('invitations', true, false, 'anon=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE authenticated=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE postgres=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE service_role=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE'),
  ('loi_amendments', true, false, 'anon=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE authenticated=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE postgres=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE service_role=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE'),
  ('loi_signatures', true, false, 'anon=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE authenticated=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE postgres=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE service_role=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE'),
  ('organizations', true, false, 'anon=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE authenticated=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE postgres=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE service_role=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE'),
  ('permanent_deletions', true, false, 'anon=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE authenticated=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE postgres=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE service_role=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE'),
  ('pilot_application_drafts', true, false, 'anon=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE authenticated=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE postgres=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE service_role=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE'),
  ('pilot_applications', true, false, 'anon=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE authenticated=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE postgres=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE service_role=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE'),
  ('profiles', true, false, 'anon=SELECT authenticated=SELECT postgres=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE service_role=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE supabase_auth_admin=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE'),
  ('role_history', true, false, 'anon=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE authenticated=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE postgres=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE service_role=DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE');

create temp table live_column_grants (tbl text, col text, acl text);
insert into live_column_grants values
  ('contact_messages', 'name', 'anon=INSERT authenticated=INSERT'),
  ('contact_messages', 'email', 'anon=INSERT authenticated=INSERT'),
  ('contact_messages', 'organization', 'anon=INSERT authenticated=INSERT'),
  ('contact_messages', 'message', 'anon=INSERT authenticated=INSERT'),
  ('contact_messages', 'handled_at', 'authenticated=UPDATE'),
  ('contact_messages', 'handled_by', 'authenticated=UPDATE'),
  ('profiles', 'first_name', 'authenticated=UPDATE'),
  ('profiles', 'last_name', 'authenticated=UPDATE');

-- Everything 023 restates, as one text, to show a second apply changes nothing.
create function pg_temp.restated() returns text language sql stable as $$
  select string_agg(x, E'\n' order by x) from (
    select 'fn ' || p.oid::regprocedure || ' ' || md5(pg_get_functiondef(p.oid)) || ' '
           || pg_temp.acl(coalesce(p.proacl, acldefault('f', p.proowner))) || ' '
           || coalesce(array_to_string(p.proconfig, ','), '') as x
    from pg_proc p join live_functions l on l.fn = p.oid::regprocedure::text
    union all
    select 'view ' || c.relname || ' ' || md5(pg_get_viewdef(c.oid)) || ' '
           || coalesce(array_to_string(c.reloptions, ','), '') || ' '
           || pg_temp.acl(coalesce(c.relacl, acldefault('r', c.relowner)))
    from pg_class c join live_views l on l.name = c.relname
    where c.relnamespace = 'public'::regnamespace
    union all
    select 'policy ' || p.tablename || '.' || p.policyname || ' ' || array_to_string(p.roles, ',') || ' ' || p.cmd
           || ' ' || md5(coalesce(p.qual, '')) || ' ' || md5(coalesce(p.with_check, ''))
    from pg_policies p where p.schemaname = 'public'
    union all
    select 'trigger ' || t.tgname || ' ' || md5(pg_get_triggerdef(t.oid))
    from pg_trigger t where not t.tgisinternal
    union all
    select 'column ' || table_name || '.' || column_name || ' ' || data_type || ' ' || is_nullable || ' '
           || coalesce(column_default, '')
    from information_schema.columns
    where table_schema = 'public' and table_name in ('investor_leads', 'profiles')
    union all
    select 'constraint ' || conname || ' ' || pg_get_constraintdef(oid)
    from pg_constraint where conrelid = 'public.profiles'::regclass
    union all
    select 'publication ' || tablename from pg_publication_tables where pubname = 'supabase_realtime'
    union all
    select 'schema public usage for supabase_auth_admin '
           || has_schema_privilege('supabase_auth_admin', 'public', 'USAGE')::text
  ) s
$$;

-- ---------------------------------------------------------------------------
-- Before 023: the repo did not have what live has.
-- ---------------------------------------------------------------------------
select pg_temp.ok(to_regclass('public.company_signals') is null, 'before 023 company_signals is missing');
select pg_temp.ok(to_regclass('public.investor_journey') is null, 'before 023 investor_journey is missing (013 failed)');
select pg_temp.ok(to_regprocedure('public.check_company_status(text)') is null, 'before 023 check_company_status is missing');
select pg_temp.ok((select pg_get_constraintdef(oid) like '%ON DELETE CASCADE'
                   from pg_constraint where conname = 'profiles_id_fkey'),
  'before 023 profiles_id_fkey cascades');
select pg_temp.ok((select md5(with_check) <> l.check_md5
                   from pg_policies p join live_policies l on l.tbl = p.tablename and l.name = p.policyname
                   where p.schemaname = 'public' and p.policyname = 'Users can insert own pilot application'),
  'before 023 the pilot insert policy differs from live');
select pg_temp.ok((select md5(pg_get_functiondef('public.handle_new_user()'::regprocedure)) <> def_md5
                   from live_functions where fn = 'handle_new_user()'),
  'before 023 handle_new_user differs from live');

-- ---------------------------------------------------------------------------
-- Apply 023 twice (it must be idempotent).
-- ---------------------------------------------------------------------------
\i :mig
create temp table after_first as select pg_temp.restated() as v;
\i :mig
select pg_temp.ok((select v from after_first) = pg_temp.restated(), 'a second apply of 023 changes nothing');

-- ---------------------------------------------------------------------------
-- Restated objects match live.
-- ---------------------------------------------------------------------------
select pg_temp.ok(to_regprocedure('public.' || l.fn) is not null, l.fn || ' exists')
from live_functions l;

select pg_temp.ok(md5(pg_get_functiondef(p.oid)) = l.def_md5, l.fn || ' has the live definition')
from live_functions l join pg_proc p on p.oid = to_regprocedure('public.' || l.fn);

select pg_temp.ok(pg_temp.acl(coalesce(p.proacl, acldefault('f', p.proowner))) = l.acl,
  l.fn || ' has the live grants: ' || pg_temp.acl(coalesce(p.proacl, acldefault('f', p.proowner))))
from live_functions l join pg_proc p on p.oid = to_regprocedure('public.' || l.fn);

select pg_temp.ok(p.prosecdef = l.secdef and coalesce(array_to_string(p.proconfig, ' | '), '') = l.config,
  l.fn || ' has the live SECURITY DEFINER and search_path')
from live_functions l join pg_proc p on p.oid = to_regprocedure('public.' || l.fn);

select pg_temp.ok(to_regclass('public.' || l.name) is not null, l.name || ' exists') from live_views l;

select pg_temp.ok(md5(pg_get_viewdef(c.oid)) = l.def_md5
                  and coalesce(array_to_string(c.reloptions, ','), '') = l.options,
  l.name || ' has the live definition and options')
from live_views l join pg_class c on c.oid = to_regclass('public.' || l.name);

select pg_temp.ok(pg_temp.acl(coalesce(c.relacl, acldefault('r', c.relowner))) = l.acl,
  l.name || ' has the live grants: ' || pg_temp.acl(coalesce(c.relacl, acldefault('r', c.relowner))))
from live_views l join pg_class c on c.oid = to_regclass('public.' || l.name);

select pg_temp.ok(exists (
    select 1 from pg_policies p
    where p.schemaname = 'public' and p.tablename = l.tbl and p.policyname = l.name
      and p.permissive = l.permissive and array_to_string(p.roles, ',') = l.roles and p.cmd = l.cmd
      and md5(coalesce(p.qual, '')) = l.qual_md5 and md5(coalesce(p.with_check, '')) = l.check_md5),
  l.tbl || ': policy "' || l.name || '" matches live')
from live_policies l;

select pg_temp.ok(exists (
    select 1 from pg_trigger t
    where t.tgrelid = l.rel::regclass and t.tgname = l.name and not t.tgisinternal
      and t.tgenabled = 'O' and md5(pg_get_triggerdef(t.oid)) = l.def_md5),
  l.rel || ': trigger ' || l.name || ' matches live')
from live_triggers l;

select pg_temp.ok(c.relrowsecurity = l.rls and c.relforcerowsecurity = l.force_rls,
  l.name || ' has the live RLS flags')
from live_tables l join pg_class c on c.oid = to_regclass('public.' || quote_ident(l.name));

select pg_temp.ok(pg_temp.acl(coalesce(c.relacl, acldefault('r', c.relowner))) = l.acl,
  l.name || ' has the live table grants: ' || pg_temp.acl(coalesce(c.relacl, acldefault('r', c.relowner))))
from live_tables l join pg_class c on c.oid = to_regclass('public.' || quote_ident(l.name));

select pg_temp.ok((select pg_temp.acl(a.attacl) from pg_attribute a
                   where a.attrelid = to_regclass('public.' || l.tbl) and a.attname = l.col) = l.acl,
  l.tbl || '.' || l.col || ' has the live column grants')
from live_column_grants l;

-- Nothing in the rebuilt database that live does not have, apart from the
-- repo-only objects from 006 checked at the end.
select pg_temp.ok(not exists (
    select 1 from pg_proc p
    where p.pronamespace = 'public'::regnamespace and p.prokind = 'f'
      and not exists (select 1 from pg_depend d where d.classid = 'pg_proc'::regclass
                        and d.objid = p.oid and d.deptype = 'e')
      and p.oid::regprocedure::text not in (select fn from live_functions)),
  'no function in public that live does not have');
select pg_temp.ok(not exists (
    select 1 from pg_class c
    where c.relnamespace = 'public'::regnamespace and c.relkind in ('r', 'v', 'm')
      and c.relname not in (select name from live_tables union all select name from live_views)),
  'no table or view in public that live does not have');
select pg_temp.ok(not exists (
    select 1 from pg_policies p
    where p.schemaname = 'public' and p.policyname <> 'Admins read investor leads'
      and (p.tablename::text, p.policyname::text) not in (select tbl, name from live_policies)),
  'no policy in public that live does not have');
select pg_temp.ok(not exists (
    select 1 from pg_trigger t
    where not t.tgisinternal and (t.tgrelid::regclass::text, t.tgname::text) not in (select rel, name from live_triggers)),
  'no trigger that live does not have');

with live_columns (tbl, col, type, nullable, dflt) as (values
  ('investor_leads', 'company', 'text', 'YES', null),
  ('investor_leads', 'source', 'text', 'YES', '''investor_gate''::text'),
  ('investor_leads', 'created_at', 'timestamp with time zone', 'NO', 'now()'),
  ('profiles', 'role', 'text', 'NO', '''fleet_owner''::text')
)
select pg_temp.ok(exists (
    select 1 from information_schema.columns c
    where c.table_schema = 'public' and c.table_name = l.tbl and c.column_name = l.col
      and c.data_type = l.type and c.is_nullable = l.nullable
      and c.column_default is not distinct from l.dflt),
  l.tbl || '.' || l.col || ' matches live')
from live_columns l;

with live_constraints (name, def) as (values
  ('profiles_id_fkey', 'FOREIGN KEY (id) REFERENCES auth.users(id)'),
  ('profiles_role_check', 'CHECK ((role = ANY (ARRAY[''fleet_owner''::text, ''city_operator''::text, ''admin''::text])))')
)
select pg_temp.ok((select pg_get_constraintdef(k.oid) from pg_constraint k
                   where k.conrelid = 'public.profiles'::regclass and k.conname = l.name) = l.def,
  'profiles: ' || l.name || ' matches live')
from live_constraints l;

select pg_temp.ok(has_schema_privilege('supabase_auth_admin', 'public', 'USAGE'),
  'supabase_auth_admin has USAGE on schema public');
select pg_temp.ok((select extnamespace = 'public'::regnamespace from pg_extension where extname = 'pg_trgm'),
  'pg_trgm is installed in public');
select pg_temp.ok((select string_agg(tablename, ',' order by tablename collate "C") from pg_publication_tables
                   where pubname = 'supabase_realtime') = 'invitations,pilot_applications,role_history',
  'supabase_realtime publishes invitations, pilot_applications and role_history');

-- ---------------------------------------------------------------------------
-- The restated objects work on the rebuilt database.
-- ---------------------------------------------------------------------------
\set applicant '''00000000-0000-0000-0000-0000000000b1'''
insert into auth.users (id, email, raw_user_meta_data)
values (:applicant, 'fleet@example.com', '{"first_name": "Fay"}');
select pg_temp.ok((select role = 'fleet_owner' and status = 'active' and first_name = 'Fay'
                   from public.profiles where id = :applicant),
  'the restated handle_new_user creates the profile on sign-up');
insert into public.pilot_applications (user_id, company_name, status)
values (:applicant, 'ACME Freight, Inc.', 'pending');
select pg_temp.ok(public.normalize_company_name('ACME Freight, Inc.') = 'acme freight',
  'normalize_company_name strips punctuation and the company suffix');
select pg_temp.ok(public.check_company_status('Acme Freight LLC') = 'pilot_applied',
  'check_company_status finds the pending application through company_signals and pg_trgm');
select pg_temp.ok(not has_function_privilege('authenticated', 'public.check_company_status(text)', 'execute')
                  and has_function_privilege('service_role', 'public.check_company_status(text)', 'execute'),
  'check_company_status is for service_role only');
begin;
select pg_temp.fails_as(format($q$insert into public.pilot_applications (user_id, company_name, status)
                                  values (%L, 'Other Co', 'approved')$q$, :applicant),
  'authenticated', :applicant, '42501');
rollback;

-- ---------------------------------------------------------------------------
-- What 023 leaves alone.
-- ---------------------------------------------------------------------------
select pg_temp.ok((select count(*) from information_schema.columns
                   where table_schema = 'public' and table_name = 'investor_leads'
                     and column_name in ('firm', 'user_agent', 'referrer')) = 3,
  'repo-only investor_leads columns from 006 are untouched');
select pg_temp.ok(to_regclass('public.investor_leads_email_idx') is not null
                  and to_regclass('public.investor_leads_created_at_idx') is not null,
  'repo-only investor_leads indexes from 006 are untouched');
select pg_temp.ok(exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'investor_leads'
                          and policyname = 'Admins read investor leads'),
  'repo-only policy "Admins read investor leads" is untouched');
select pg_temp.ok(not exists (select 1 from pg_trigger where tgname in ('pilot_email_on_insert', 'pilot_email_on_status_update')),
  'the send-pilot-email webhooks are not restated (their definitions carry a key)');
select pg_temp.ok(to_regclass('public."Website"') is null, 'the table "Website" is not restated');
select pg_temp.ok(to_regprocedure('public.capture_investor_lead(text, text, text, text)') is null,
  'the four-argument capture_investor_lead is not restated');

\o
\echo restate_live_state: all checks passed
