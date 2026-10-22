-- Server-side test for migration 024 (pilot emails without the legacy key).
--
-- Builds the database from the repo the way the 023 test does: Supabase
-- stand-ins, then supabase-schema.sql and every migration from 001 to 023
-- (013 and 021 print their expected fresh-database errors). Then adds what
-- live has and the repo does not write down, each as the live catalog showed
-- it on 2026-10-22:
--   * the send-pilot-email webhooks pilot_email_on_insert and
--     pilot_email_on_status_update, with an Authorization header. The key in
--     it is a JWT-shaped stand-in made at run time, so no file holds one.
--   * the empty table "Website" and its identity sequence
--   * capture_investor_lead(text, text, text, text)
-- and two pilot applications. Then it checks:
--   * the JWT check finds the stand-in in both webhooks before 024
--   * with a row in "Website", 024 refuses and changes nothing
--   * 024 applies twice and the second apply changes nothing
--   * no function body, trigger definition, view definition, policy or column
--     default in any schema holds a JWT-shaped string
--   * both webhooks exist, call send-pilot-email with the same method, body
--     and timeout as before, carry no Authorization header, and fire on
--     insert and on update
--   * the four-argument capture_investor_lead is gone; the five-argument one
--     keeps its definition and grants and still takes the site's call
--   * "Website" and its sequence are gone
--   * the ledger is closed to anon and authenticated, open to the service
--     role, rejects a second row with the same key, and was seeded once with
--     each existing application's current status and "pending"
--
-- Runs against a throwaway Postgres. Never run it against a real project.
-- From the repo root (psql reads the migration a second time with `cat`, to
-- apply it inside one function call for the refusal check):
--
--   docker run -d --rm --name t24pg -e POSTGRES_PASSWORD=x -v "$PWD":/repo:ro postgres:17-alpine
--   until docker exec t24pg pg_isready -q; do sleep 1; done
--   docker exec -w /repo t24pg psql -U postgres -v ON_ERROR_STOP=1 \
--     -v mig=supabase/migrations/20261022_024_pilot_email_no_key.sql \
--     -f supabase/tests/024_pilot_email_no_key.test.sql
--   docker rm -f t24pg
--
-- Prints "pilot_email_no_key: all checks passed" or stops at the first failure.
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
\echo pilot_email_no_key: 013 fails on a fresh database (investor_journey needs columns only live had); expected:
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
\echo pilot_email_no_key: 021 fails on a fresh database (three functions only live had); expected:
\set ON_ERROR_STOP 0
\ir ../migrations/20261022_021_revoke_public_execute.sql
\set ON_ERROR_STOP 1
\ir ../migrations/20261022_022_invites_and_profiles.sql
\ir ../migrations/20261022_023_restate_live_state.sql
set client_min_messages = warning;

-- ---------------------------------------------------------------------------
-- What live has that the repo did not write down, as live has it.
-- ---------------------------------------------------------------------------
create table public."Website" (
  id bigint generated by default as identity primary key,
  created_at timestamp with time zone not null default now()
);
alter table public."Website" enable row level security;

CREATE OR REPLACE FUNCTION public.capture_investor_lead(p_email text, p_name text DEFAULT NULL::text, p_company text DEFAULT NULL::text, p_source text DEFAULT 'investor_gate'::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.investor_leads (email, name, company, source)
  values (p_email, p_name, p_company, p_source)
  on conflict do nothing;
end;
$function$;
revoke execute on function public.capture_investor_lead(text, text, text, text) from public;
grant execute on function public.capture_investor_lead(text, text, text, text) to anon, authenticated, service_role;

-- The webhooks with a key in their Authorization header. The stand-in is built
-- here from pieces, so it is JWT-shaped only inside the database.
do $$
declare
  v_key text := 'ey' || 'J' || repeat('a', 30) || '.' || 'ey' || 'J' || repeat('b', 60) || '.' || repeat('c', 43);
  v_url text := 'https://zodrljxcwqkjiipobrhs.supabase.co/functions/v1/send-pilot-email';
  v_headers text := '{"Content-type":"application/json","Authorization":"Bearer ' || v_key || '"}';
begin
  execute format('create trigger pilot_email_on_insert after insert on public.pilot_applications
    for each row execute function supabase_functions.http_request(%L, %L, %L, %L, %L)', v_url, 'POST', v_headers, '{}', '5000');
  execute format('create trigger pilot_email_on_status_update after update on public.pilot_applications
    for each row execute function supabase_functions.http_request(%L, %L, %L, %L, %L)', v_url, 'POST', v_headers, '{}', '5000');
end $$;

-- Two applications from before 024: one pending, one approved.
\set u1 '''00000000-0000-0000-0000-0000000000c1'''
\set u2 '''00000000-0000-0000-0000-0000000000c2'''
\set u3 '''00000000-0000-0000-0000-0000000000c3'''
\set app1 '''40000000-0000-0000-0000-000000000001'''
\set app2 '''40000000-0000-0000-0000-000000000002'''
\set app3 '''40000000-0000-0000-0000-000000000003'''
insert into auth.users (id, email) values (:u1, 'one@example.com'), (:u2, 'two@example.com'), (:u3, 'three@example.com');
insert into public.pilot_applications (id, user_id, company_name, contact_email, status)
values (:app1, :u1, 'One Freight', 'one@example.com', 'pending'),
       (:app2, :u2, 'Two Freight', 'two@example.com', 'approved');

-- ---------------------------------------------------------------------------
-- Helpers.
-- ---------------------------------------------------------------------------
create function pg_temp.ok(p_cond boolean, p_what text) returns void language plpgsql as $$
begin
  if p_cond is not true then raise exception 'FAILED: %', p_what; end if;
end $$;

-- Rows affected by a statement run as the given role and JWT subject.
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

-- Every definition that holds a JWT-shaped string, by name, in any schema.
create function pg_temp.jwt_holders() returns text language sql stable as $$
  select coalesce(string_agg(x, ', ' order by x), '') from (
    select 'function ' || p.oid::regprocedure::text as x
    from pg_proc p
    where p.prosrc ~ 'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+'
    union all
    select 'trigger ' || format('%I.%I', n.nspname, c.relname) || '.' || t.tgname
    from pg_trigger t join pg_class c on c.oid = t.tgrelid join pg_namespace n on n.oid = c.relnamespace
    where pg_get_triggerdef(t.oid) ~ 'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+'
    union all
    select 'view ' || format('%I.%I', n.nspname, c.relname)
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where c.relkind in ('v', 'm') and pg_get_viewdef(c.oid) ~ 'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+'
    union all
    select 'policy ' || pol.polname
    from pg_policy pol
    where coalesce(pg_get_expr(pol.polqual, pol.polrelid), '') || coalesce(pg_get_expr(pol.polwithcheck, pol.polrelid), '')
          ~ 'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+'
    union all
    select 'default ' || d.adrelid::regclass::text
    from pg_attrdef d
    where pg_get_expr(d.adbin, d.adrelid) ~ 'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+'
  ) s
$$;

-- What 024 changes in the catalog, as one text.
create function pg_temp.state() returns text language sql stable as $$
  select string_agg(x, E'\n' order by x) from (
    select 'trigger ' || t.tgname || ' ' || t.tgenabled::text || ' ' || md5(pg_get_triggerdef(t.oid)) as x
    from pg_trigger t
    where t.tgrelid = 'public.pilot_applications'::regclass and not t.tgisinternal
    union all
    select 'function ' || p.oid::regprocedure::text || ' ' || md5(pg_get_functiondef(p.oid)) || ' '
           || coalesce(p.proacl::text, '') || ' ' || p.prosecdef::text
    from pg_proc p
    where p.pronamespace = 'public'::regnamespace and p.proname = 'capture_investor_lead'
    union all
    select 'relation ' || c.relname || ' ' || c.relkind::text || ' ' || c.relrowsecurity::text || ' '
           || coalesce(c.relacl::text, '')
    from pg_class c
    where c.relnamespace = 'public'::regnamespace
      and c.relname in ('Website', 'Website_id_seq', 'pilot_email_notifications_sent')
  ) s
$$;

-- Applies the migration text inside one function call, so a failure rolls all
-- of it back, and returns the error instead of stopping psql.
create function pg_temp.apply_text(p_sql text) returns text language plpgsql as $$
begin
  execute p_sql;
  return 'applied';
exception when others then
  return sqlstate || ' ' || sqlerrm;
end $$;

-- ---------------------------------------------------------------------------
-- Before 024: the live shape, with the stand-in key in both webhooks.
-- ---------------------------------------------------------------------------
select pg_temp.ok(pg_temp.jwt_holders() =
  'trigger public.pilot_applications.pilot_email_on_insert, trigger public.pilot_applications.pilot_email_on_status_update',
  'before 024 the JWT check finds the stand-in key in both webhooks, and only there: ' || pg_temp.jwt_holders());
select pg_temp.ok((select pg_get_triggerdef(oid) like 'CREATE TRIGGER pilot_email_on_insert AFTER INSERT ON public.pilot_applications FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request(''https://zodrljxcwqkjiipobrhs.supabase.co/functions/v1/send-pilot-email'', ''POST'', ''{"Content-type":"application/json","Authorization":"Bearer %"}'', ''{}'', ''5000'')'
                   from pg_trigger where tgname = 'pilot_email_on_insert'),
  'before 024 pilot_email_on_insert has the live shape');
select pg_temp.ok((select pg_get_triggerdef(oid) like 'CREATE TRIGGER pilot_email_on_status_update AFTER UPDATE ON public.pilot_applications FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request(''https://zodrljxcwqkjiipobrhs.supabase.co/functions/v1/send-pilot-email'', ''POST'', ''{"Content-type":"application/json","Authorization":"Bearer %"}'', ''{}'', ''5000'')'
                   from pg_trigger where tgname = 'pilot_email_on_status_update'),
  'before 024 pilot_email_on_status_update has the live shape');
select pg_temp.ok(to_regprocedure('public.capture_investor_lead(text, text, text, text)') is not null
                  and to_regprocedure('public.capture_investor_lead(text, text, text, text, text)') is not null,
  'before 024 both capture_investor_lead overloads exist');
select pg_temp.ok(to_regclass('public."Website"') is not null and to_regclass('public."Website_id_seq"') is not null,
  'before 024 "Website" and its sequence exist');
select pg_temp.ok(to_regclass('public.pilot_email_notifications_sent') is null, 'before 024 there is no ledger');

create temp table five_arg_before as
select md5(pg_get_functiondef(p.oid)) as def_md5, p.proacl::text as acl, p.prosecdef, p.proconfig::text as config
from pg_proc p where p.oid = 'public.capture_investor_lead(text, text, text, text, text)'::regprocedure;
create temp table state_before as select pg_temp.state() as v;

-- ---------------------------------------------------------------------------
-- A row in "Website": 024 refuses, and nothing changes.
-- ---------------------------------------------------------------------------
\set mig_text `cat :'mig'`
begin;
insert into public."Website" default values;
select pg_temp.apply_text(:'mig_text') as refusal \gset
select pg_temp.ok(:'refusal' = 'P0001 024: public."Website" has 1 row(s), so it was not dropped and nothing else was applied. Move or delete the rows, then apply 024 again.',
  '024 refuses when "Website" has a row: ' || :'refusal');
select pg_temp.ok(pg_temp.state() = (select v from state_before), 'a refused 024 changes nothing');
select pg_temp.ok((select count(*) from public."Website") = 1, 'the row in "Website" is still there');
select pg_temp.ok(to_regclass('public.pilot_email_notifications_sent') is null, 'a refused 024 creates no ledger');
rollback;

-- ---------------------------------------------------------------------------
-- Apply 024 twice (it must be idempotent).
-- ---------------------------------------------------------------------------
\i :mig
create temp table after_first as
select pg_temp.state() as v,
       (select string_agg(key, ',' order by key) from public.pilot_email_notifications_sent) as ledger;
\i :mig
select pg_temp.ok((select v from after_first) = pg_temp.state(), 'a second apply of 024 changes nothing in the catalog');
select pg_temp.ok((select ledger from after_first) is not distinct from
                  (select string_agg(key, ',' order by key) from public.pilot_email_notifications_sent),
  'a second apply of 024 adds nothing to the ledger');

-- ---------------------------------------------------------------------------
-- No key anywhere.
-- ---------------------------------------------------------------------------
select pg_temp.ok(pg_temp.jwt_holders() = '',
  'after 024 no function, trigger, view, policy or default holds a JWT-shaped string: ' || pg_temp.jwt_holders());

-- ---------------------------------------------------------------------------
-- The webhooks: same call, no Authorization header.
-- ---------------------------------------------------------------------------
select pg_temp.ok((select pg_get_triggerdef(oid) from pg_trigger where tgname = 'pilot_email_on_insert' and tgenabled = 'O') =
  'CREATE TRIGGER pilot_email_on_insert AFTER INSERT ON public.pilot_applications FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request(''https://zodrljxcwqkjiipobrhs.supabase.co/functions/v1/send-pilot-email'', ''POST'', ''{"Content-type":"application/json"}'', ''{}'', ''5000'')',
  'pilot_email_on_insert calls send-pilot-email with no Authorization header');
select pg_temp.ok((select pg_get_triggerdef(oid) from pg_trigger where tgname = 'pilot_email_on_status_update' and tgenabled = 'O') =
  'CREATE TRIGGER pilot_email_on_status_update AFTER UPDATE ON public.pilot_applications FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request(''https://zodrljxcwqkjiipobrhs.supabase.co/functions/v1/send-pilot-email'', ''POST'', ''{"Content-type":"application/json"}'', ''{}'', ''5000'')',
  'pilot_email_on_status_update calls send-pilot-email with no Authorization header');
select pg_temp.ok(not exists (select 1 from pg_trigger
                              where tgname in ('pilot_email_on_insert', 'pilot_email_on_status_update')
                                and position('Authorization' in encode(tgargs, 'escape')) > 0),
  'no webhook argument mentions Authorization');
select pg_temp.ok((select count(*) from pg_trigger where tgrelid = 'public.pilot_applications'::regclass and not tgisinternal) = 3,
  'pilot_applications keeps exactly three webhooks (two emails, one Discord)');

-- They fire: an insert and a status change each call send-pilot-email once,
-- without a key.
delete from supabase_functions.calls;
insert into public.pilot_applications (id, user_id, company_name, contact_email, status)
values (:app3, :u3, 'Three Freight', 'three@example.com', 'pending');
update public.pilot_applications set status = 'in_review', reviewed_at = now() where id = :app3;
select pg_temp.ok((select string_agg(op || ' ' || method || ' ' || headers || ' ' || params || ' ' || timeout, ' | ' order by id)
                   from supabase_functions.calls where url like '%/functions/v1/send-pilot-email') =
  'INSERT POST {"Content-type":"application/json"} {} 5000 | UPDATE POST {"Content-type":"application/json"} {} 5000',
  'the webhooks fire once on insert and once on update, without a key');

-- ---------------------------------------------------------------------------
-- capture_investor_lead: the four-argument overload is gone, the site's
-- five-argument one is unchanged and still works for anon.
-- ---------------------------------------------------------------------------
select pg_temp.ok(to_regprocedure('public.capture_investor_lead(text, text, text, text)') is null,
  'the four-argument capture_investor_lead is gone');
select pg_temp.ok((select count(*) from pg_proc where pronamespace = 'public'::regnamespace and proname = 'capture_investor_lead') = 1,
  'one capture_investor_lead is left');
select pg_temp.ok((select md5(pg_get_functiondef(p.oid)) = b.def_md5 and p.proacl::text = b.acl
                          and p.prosecdef = b.prosecdef and p.proconfig::text is not distinct from b.config
                   from pg_proc p, five_arg_before b
                   where p.oid = 'public.capture_investor_lead(text, text, text, text, text)'::regprocedure),
  'the five-argument capture_investor_lead keeps its definition, grants and settings');
select pg_temp.ok(has_function_privilege('anon', 'public.capture_investor_lead(text, text, text, text, text)', 'execute'),
  'anon can still call the five-argument capture_investor_lead');
begin;
select pg_temp.exec_as($q$select public.capture_investor_lead(p_name => 'Ina Investor', p_email => 'ina@example.com',
  p_company => 'Fund', p_source => 'investor_email_gate', p_session_id => 's-1')$q$, 'anon', null);
select pg_temp.ok((select count(*) from public.investor_leads where email = 'ina@example.com' and session_id = 's-1') = 1,
  'the call src/pages/Investors.tsx makes still records the lead');
select pg_temp.fails_as($q$select public.capture_investor_lead(p_name => 'X', p_email => 'not-an-email', p_company => 'Y')$q$,
  'anon', null, 'P0001');
rollback;

-- ---------------------------------------------------------------------------
-- "Website" and its sequence are gone.
-- ---------------------------------------------------------------------------
select pg_temp.ok(to_regclass('public."Website"') is null, '"Website" is gone');
select pg_temp.ok(to_regclass('public."Website_id_seq"') is null, '"Website_id_seq" is gone');

-- ---------------------------------------------------------------------------
-- The ledger: service role only, one row per key, seeded once.
-- ---------------------------------------------------------------------------
select pg_temp.ok((select relrowsecurity from pg_class where oid = 'public.pilot_email_notifications_sent'::regclass),
  'the ledger has RLS on');
select pg_temp.ok(not has_table_privilege(r, 'public.pilot_email_notifications_sent', p)
                  and not has_any_column_privilege(r, 'public.pilot_email_notifications_sent', 'select, insert, update, references'),
  r || ' has no ' || p || ' on the ledger')
from unnest(array['anon', 'authenticated']) r,
     unnest(array['select', 'insert', 'update', 'delete', 'truncate', 'references', 'trigger']) p;
select pg_temp.ok(has_table_privilege('service_role', 'public.pilot_email_notifications_sent', 'select')
                  and has_table_privilege('service_role', 'public.pilot_email_notifications_sent', 'insert'),
  'service_role reads and writes the ledger');

select pg_temp.ok((select string_agg(key, ',' order by key) from public.pilot_email_notifications_sent) =
  'pilot_applications:40000000-0000-0000-0000-000000000001:pending,'
  || 'pilot_applications:40000000-0000-0000-0000-000000000002:approved,'
  || 'pilot_applications:40000000-0000-0000-0000-000000000002:pending',
  'the ledger was seeded with each existing application''s status and pending, and nothing for the one made after 024');
\i :mig
select pg_temp.ok(not exists (select 1 from public.pilot_email_notifications_sent where key like '%' || :app3 || '%'),
  'applying 024 again does not seed applications made since');

begin;
select pg_temp.fails_as($q$select count(*) from public.pilot_email_notifications_sent$q$, 'anon', null, '42501');
select pg_temp.fails_as($q$insert into public.pilot_email_notifications_sent (key) values ('pilot_applications:x:pending')$q$, 'anon', null, '42501');
select pg_temp.fails_as($q$select count(*) from public.pilot_email_notifications_sent$q$, 'authenticated', :u1, '42501');
select pg_temp.fails_as($q$insert into public.pilot_email_notifications_sent (key) values ('pilot_applications:x:pending')$q$, 'authenticated', :u1, '42501');
select pg_temp.fails_as($q$delete from public.pilot_email_notifications_sent$q$, 'authenticated', :u1, '42501');
select pg_temp.ok(pg_temp.exec_as($q$insert into public.pilot_email_notifications_sent (key)
  values ('pilot_applications:40000000-0000-0000-0000-000000000003:in_review')$q$, 'service_role', null) = 1,
  'the service role records an email');
select pg_temp.fails_as($q$insert into public.pilot_email_notifications_sent (key)
  values ('pilot_applications:40000000-0000-0000-0000-000000000003:in_review')$q$, 'service_role', null, '23505');
select pg_temp.fails_as($q$insert into public.pilot_email_notifications_sent (key) values (repeat('k', 201))$q$, 'service_role', null, '23514');
rollback;

\o
\echo pilot_email_no_key: all checks passed
