-- ============================================================================
-- 20261022_023_restate_live_state.sql
--
-- Makes this repo the source of truth for the live database (CruzeMaps Web
-- Admin). On 2026-10-22 the live catalog was compared with a database built
-- from supabase-schema.sql and every migration up to 022: functions with their
-- owner, settings and grants; RLS flags and policies; table and column grants;
-- triggers; views; columns, defaults, constraints and indexes. Everything
-- below is on live but was not in the repo, because it was made or changed in
-- the dashboard. This file writes it down exactly as live has it, so applying
-- it to the live project changes nothing.
--
-- Restated:
--   * Company matching, made by hand (018 and 021 already refer to it):
--     pg_trgm in schema public, normalize_company_name(text), the view
--     company_signals (security_invoker, no anon or authenticated access),
--     admin_search_companies(text, real) and check_company_status(text).
--   * investor_leads as live has it: company, source (default
--     'investor_gate') and created_at NOT NULL. 013's view investor_journey
--     needs company and source, which is why 013 fails on a fresh database;
--     the view is restated here after the columns.
--   * profiles: role defaults to 'fleet_owner'; profiles_id_fkey has no
--     ON DELETE CASCADE (019's admin_hard_delete_user deletes the profile
--     before the auth user for this reason); profiles_role_check lists the
--     roles in live's order.
--   * Policies: "Users can insert own pilot application" is for
--     authenticated and only inserts pending applications; investor_leads
--     has "Service role read investor_leads" (USING false).
--   * Database webhooks: invite_email_on_insert (send-invitation),
--     notify_discord_on_pilot_application and notify_discord_on_loi_signed
--     (notify-discord).
--   * Realtime: pilot_applications, role_history and invitations in the
--     supabase_realtime publication (docs/SUPABASE_SETUP.md step 4).
--   * USAGE on schema public for supabase_auth_admin (the JWT claims hook).
--   * The live text of six functions whose repo version differs only in
--     layout (handle_new_user also words its log line differently):
--     admin_hard_delete_invitation, admin_hard_delete_loi,
--     admin_hard_delete_pilot_application, archive_loi,
--     custom_access_token_hook, handle_new_user.
--
-- Not restated, each for a separate decision (listed in the PR):
--   * pilot_email_on_insert and pilot_email_on_status_update, the two
--     send-pilot-email webhooks on pilot_applications: their definitions
--     carry a service-role key, which must not go into a public repo.
--   * The empty table "Website" and the unused anon-callable overload
--     capture_investor_lead(text, text, text, text).
--   * Repo objects that were never applied live, left as they are:
--     investor_leads columns firm, user_agent and referrer, its indexes
--     investor_leads_email_idx and investor_leads_created_at_idx, and the
--     policy "Admins read investor leads" (all from 006).
--
-- New views and functions get their base grants from Supabase's default
-- privileges in schema public, which are the same on live and on a fresh
-- project. The grants and revokes below are the ones live has on top.
--
-- Idempotent: safe to run more than once. The ALTER TABLE statements only run
-- when a table differs from live, so on live they take no lock.
-- Test: supabase/tests/023_restate_live_state.test.sql
-- ============================================================================

-- (1) pg_trgm provides similarity() for the company lookups below, whose
-- search_path is public. Live has it in public.
create extension if not exists pg_trgm with schema public;

-- (2) The JWT claims hook (003) runs as supabase_auth_admin.
grant usage on schema public to supabase_auth_admin;

-- (3) Table shapes. Each change runs only where the table differs from live.
do $$
begin
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'investor_leads'
                   and column_name = 'company') then
    alter table public.investor_leads add column company text;
  end if;

  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'investor_leads'
                   and column_name = 'source') then
    alter table public.investor_leads add column source text default 'investor_gate';
  end if;

  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'investor_leads'
               and column_name = 'created_at' and is_nullable = 'YES') then
    alter table public.investor_leads alter column created_at set not null;
  end if;

  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'profiles'
                   and column_name = 'role' and column_default = '''fleet_owner''::text') then
    alter table public.profiles alter column role set default 'fleet_owner';
  end if;

  if exists (select 1 from pg_constraint
             where conrelid = 'public.profiles'::regclass and conname = 'profiles_id_fkey'
               and pg_get_constraintdef(oid) <> 'FOREIGN KEY (id) REFERENCES auth.users(id)') then
    alter table public.profiles drop constraint profiles_id_fkey;
  end if;
  if not exists (select 1 from pg_constraint
                 where conrelid = 'public.profiles'::regclass and conname = 'profiles_id_fkey') then
    alter table public.profiles add constraint profiles_id_fkey
      foreign key (id) references auth.users (id);
  end if;

  if exists (select 1 from pg_constraint
             where conrelid = 'public.profiles'::regclass and conname = 'profiles_role_check'
               and pg_get_constraintdef(oid) <>
                   'CHECK ((role = ANY (ARRAY[''fleet_owner''::text, ''city_operator''::text, ''admin''::text])))') then
    alter table public.profiles drop constraint profiles_role_check;
  end if;
  if not exists (select 1 from pg_constraint
                 where conrelid = 'public.profiles'::regclass and conname = 'profiles_role_check') then
    alter table public.profiles add constraint profiles_role_check
      check (role = any (array['fleet_owner', 'city_operator', 'admin']));
  end if;
end $$;

-- (4) Company matching. normalize_company_name is plain SQL with the default
-- grants. company_signals applies the caller's RLS and only service_role may
-- read it (018). admin_search_companies (admins, checked inside) and
-- check_company_status (service_role only) read it as their owner (021).
CREATE OR REPLACE FUNCTION public.normalize_company_name(raw text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
AS $function$
  select trim(regexp_replace(regexp_replace(regexp_replace(
    lower(coalesce(raw,'')),
    '\y(inc|incorporated|llc|ltd|limited|corp|corporation|co|company|gmbh|plc)\y','','g'),
    '[^a-z0-9 ]','','g'),
    '\s+',' ','g'));
$function$;

create or replace view public.company_signals
  with (security_invoker = true)
as
 SELECT public.normalize_company_name(pilot_applications.company_name) AS norm,
    pilot_applications.company_name AS raw_name,
    'pilot_application'::text AS source,
    pilot_applications.id AS record_id,
    pilot_applications.status
   FROM public.pilot_applications
  WHERE (COALESCE(TRIM(BOTH FROM pilot_applications.company_name), ''::text) <> ''::text)
UNION ALL
 SELECT public.normalize_company_name(loi_signatures.participant_company) AS norm,
    loi_signatures.participant_company AS raw_name,
    'loi_signature'::text AS source,
    loi_signatures.id AS record_id,
        CASE
            WHEN (loi_signatures.archived_at IS NULL) THEN 'signed'::text
            ELSE 'archived'::text
        END AS status
   FROM public.loi_signatures
UNION ALL
 SELECT public.normalize_company_name(organizations.name) AS norm,
    organizations.name AS raw_name,
    'organization'::text AS source,
    organizations.id AS record_id,
    organizations.status
   FROM public.organizations
  WHERE (organizations.name IS NOT NULL);

revoke all on public.company_signals from anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_search_companies(q text, min_sim real DEFAULT 0.3)
 RETURNS TABLE(normalized_key text, match_score real, variants text[], records jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  return query
    select norm, max(similarity(norm, normalize_company_name(q)))::real,
           array_agg(distinct raw_name),
           jsonb_agg(distinct jsonb_build_object('source',source,'status',status,'id',record_id))
    from public.company_signals
    where similarity(norm, normalize_company_name(q)) >= min_sim
       or norm ilike '%'||normalize_company_name(q)||'%'
    group by norm order by 2 desc;
end $function$;

revoke execute on function public.admin_search_companies(text, real) from public, anon;
grant execute on function public.admin_search_companies(text, real) to authenticated, service_role;

CREATE OR REPLACE FUNCTION public.check_company_status(q text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare nq text := normalize_company_name(q); verdict text;
begin
  if length(nq) < 2 then return 'no_relationship'; end if;
  select case
    when bool_or(source='organization'     and status='active')                     then 'existing_client'
    when bool_or(source='pilot_application' and status='active')                     then 'pilot_in_progress'
    when bool_or(source='pilot_application' and status in ('approved','onboarding')) then 'pilot_scheduled'
    when bool_or(source='loi_signature'     and status='signed')                     then 'existing_client'
    when bool_or(source='pilot_application' and status in ('pending','in_review'))   then 'pilot_applied'
    else 'no_relationship'
  end into verdict
  from public.company_signals
  where norm = nq or similarity(norm, nq) >= 0.6;
  return coalesce(verdict, 'no_relationship');
end $function$;

revoke execute on function public.check_company_status(text) from public, anon, authenticated;
grant execute on function public.check_company_status(text) to service_role;

-- (5) investor_journey from 013, as live has it after 018.
create or replace view public.investor_journey
  with (security_invoker = true)
as
select
  v.id              as visit_id,
  v.created_at      as visited_at,
  v.session_id,
  v.path,
  v.referrer,
  v.user_agent,
  v.utm_source,
  v.utm_medium,
  v.utm_campaign,
  l.id              as lead_id,
  l.created_at      as submitted_at,
  l.name,
  l.email,
  l.company,
  l.source
from public.investor_visits v
left join public.investor_leads l on l.session_id = v.session_id
order by v.created_at desc;

revoke all on public.investor_journey from anon;
grant select on public.investor_journey to authenticated;

-- (6) Live text of six functions. Same behaviour as the repo's versions;
-- create or replace keeps their owner and grants.
CREATE OR REPLACE FUNCTION public.admin_hard_delete_invitation(p_id uuid, p_reason text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_row jsonb;
begin
  if not public.is_admin() then raise exception 'Admin only'; end if;
  if length(trim(p_reason)) < 5 then raise exception 'Reason must be at least 5 chars'; end if;

  select to_jsonb(i) into v_row from public.invitations i where i.id = p_id;
  if v_row is null then raise exception 'Invitation not found'; end if;

  insert into public.permanent_deletions (entity_type, entity_id, entity_snapshot, reason, deleted_by)
  values ('invitation', p_id, v_row, p_reason, auth.uid());

  delete from public.invitations where id = p_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.admin_hard_delete_loi(p_id uuid, p_reason text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_row jsonb;
begin
  if not public.is_admin() then raise exception 'Admin only'; end if;
  if length(trim(p_reason)) < 10 then raise exception 'LOI hard-delete requires a reason of at least 10 chars'; end if;

  select to_jsonb(l) into v_row from public.loi_signatures l where l.id = p_id;
  if v_row is null then raise exception 'LOI not found'; end if;

  insert into public.permanent_deletions (entity_type, entity_id, entity_snapshot, reason, deleted_by)
  values ('loi_signature', p_id, v_row, p_reason, auth.uid());

  delete from public.loi_signatures where id = p_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.admin_hard_delete_pilot_application(p_id uuid, p_reason text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_row jsonb;
begin
  if not public.is_admin() then raise exception 'Admin only'; end if;
  if length(trim(p_reason)) < 5 then raise exception 'Reason must be at least 5 chars'; end if;

  select to_jsonb(p) into v_row from public.pilot_applications p where p.id = p_id;
  if v_row is null then raise exception 'Pilot application not found'; end if;

  insert into public.permanent_deletions (entity_type, entity_id, entity_snapshot, reason, deleted_by)
  values ('pilot_application', p_id, v_row, p_reason, auth.uid());

  delete from public.pilot_applications where id = p_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.archive_loi(p_loi_id uuid, p_reason text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.is_admin() then
    raise exception 'Only admins can archive LOIs';
  end if;
  if p_reason is null or length(trim(p_reason)) < 3 then
    raise exception 'Reason must be at least 3 characters';
  end if;
  update public.loi_signatures
  set archived_at     = now(),
      archived_by     = auth.uid(),
      archive_reason  = p_reason
  where id = p_loi_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
AS $function$
declare
  claims jsonb;
  v_role text;
  v_status text;
  v_org uuid;
begin
  select role, status, organization_id
  into v_role, v_status, v_org
  from public.profiles
  where id = (event->>'user_id')::uuid;

  claims := event->'claims';

  if v_role is not null then
    claims := jsonb_set(claims, '{app_role}', to_jsonb(v_role));
    claims := jsonb_set(claims, '{app_status}', to_jsonb(coalesce(v_status, 'pending')));
    if v_org is not null then
      claims := jsonb_set(claims, '{app_organization_id}', to_jsonb(v_org::text));
    end if;
  end if;

  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (
    id, role, requested_role,
    first_name, last_name, email,
    status, last_active_at
  )
  values (
    new.id,
    'fleet_owner',
    coalesce(new.raw_user_meta_data->>'role', 'fleet_owner'),
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.email,
    'active',
    now()
  );
  return new;
exception
  when others then
    raise log 'handle_new_user failed for user_id=% email=% with error: % %',
      new.id, new.email, SQLSTATE, SQLERRM;
    raise;
end;
$function$;

-- (7) Policies that differ from the repo.
drop policy if exists "Users can insert own pilot application" on public.pilot_applications;
create policy "Users can insert own pilot application" on public.pilot_applications
  for insert
  to authenticated
  with check ((auth.uid() = user_id) and (status = 'pending'::text));

drop policy if exists "Service role read investor_leads" on public.investor_leads;
create policy "Service role read investor_leads" on public.investor_leads
  for select
  using (false);

-- (8) Database webhooks made in the dashboard. Like 020 they need Database
-- Webhooks (supabase_functions.http_request); without it they are skipped with
-- a warning. None of them sends a key: send-invitation and notify-discord run
-- with verify_jwt off.
do $$
begin
  if to_regprocedure('supabase_functions.http_request()') is null then
    raise warning '023: Database Webhooks are not enabled, so invite_email_on_insert, notify_discord_on_pilot_application and notify_discord_on_loi_signed were not created';
    return;
  end if;

  create or replace trigger invite_email_on_insert
    after insert on public.invitations
    for each row execute function supabase_functions.http_request(
      'https://zodrljxcwqkjiipobrhs.supabase.co/functions/v1/send-invitation',
      'POST',
      '{"Content-type":"application/json"}',
      '{}',
      '5000'
    );

  create or replace trigger notify_discord_on_pilot_application
    after insert on public.pilot_applications
    for each row execute function supabase_functions.http_request(
      'https://zodrljxcwqkjiipobrhs.supabase.co/functions/v1/notify-discord',
      'POST',
      '{"Content-type":"application/json"}',
      '{}',
      '1000'
    );

  create or replace trigger notify_discord_on_loi_signed
    after insert on public.loi_signatures
    for each row execute function supabase_functions.http_request(
      'https://zodrljxcwqkjiipobrhs.supabase.co/functions/v1/notify-discord',
      'POST',
      '{"Content-type":"application/json"}',
      '{}',
      '1000'
    );
end $$;

-- (9) Realtime for the admin portal (docs/SUPABASE_SETUP.md step 4).
do $$
declare
  t text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    return;
  end if;
  foreach t in array array['pilot_applications', 'role_history', 'invitations'] loop
    if not exists (select 1 from pg_publication_tables
                   where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- Make PostgREST pick up the new functions and columns straight away.
notify pgrst, 'reload schema';

-- ----------------------------------------------------------------------------
-- Rollback: none. On live this file changes nothing, and on a database built
-- from the repo it only adds what live already has.
--
-- Verify on live after applying (SQL editor), read-only. md5 of each restated
-- function, which must equal the value in the PR and in the test:
--   select p.oid::regprocedure, md5(pg_get_functiondef(p.oid))
--   from pg_proc p
--   where p.pronamespace = 'public'::regnamespace
--     and p.proname in ('normalize_company_name', 'admin_search_companies',
--                       'check_company_status', 'admin_hard_delete_invitation',
--                       'admin_hard_delete_loi', 'admin_hard_delete_pilot_application',
--                       'archive_loi', 'custom_access_token_hook', 'handle_new_user')
--   order by 1;
-- ----------------------------------------------------------------------------
