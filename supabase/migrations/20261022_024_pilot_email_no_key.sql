-- ============================================================================
-- 20261022_024_pilot_email_no_key.sql
--
-- Takes the legacy service_role key out of the database. The two
-- send-pilot-email webhooks on pilot_applications sent it in their
-- Authorization header, because the function relied on the gateway's JWT
-- check. They were the only definitions in the database with a key in them
-- (023 left them out of the repo for that reason). send-pilot-email now
-- works like notify-discord: deployed with verify_jwt off, it trusts only
-- type, table and record.id, reads the row back with the service role, and
-- sends each application at most one email per status
-- (supabase/functions/send-pilot-email/handler.ts).
--
--   1. public."Website": refuses to go on if the table has any row; otherwise
--      drops it and its identity sequence "Website_id_seq". Nothing uses it:
--      every "Website" in src/ and supabase/functions/ is a form label for
--      pilot_applications.website.
--   2. public.pilot_email_notifications_sent: one row per email sent, written
--      by send-pilot-email with the service role before it sends, so a
--      replayed or forged webhook payload never sends twice. No access for
--      anon or authenticated. When the table is created it is seeded with
--      each existing application's current status and "pending" (the
--      confirmation), which the old function already emailed, so editing an
--      existing application does not email its applicant again.
--   3. pilot_email_on_insert and pilot_email_on_status_update, recreated with
--      the same URL, method, body and timeout as live, and the headers
--      '{"Content-type":"application/json"}' only.
--   4. Drops capture_investor_lead(text, text, text, text). It is SECURITY
--      DEFINER, anon can call it, it skips the email check, and nothing calls
--      it: the site calls the five-argument overload (src/pages/Investors.tsx),
--      which this file does not touch.
--
-- Deploy the new send-pilot-email first (it accepts the old and the new
-- webhook calls), then apply this file in one transaction. Until this file is
-- applied the new function sends nothing, because it cannot record an email.
--
-- Idempotent: safe to run more than once.
-- Test: supabase/tests/024_pilot_email_no_key.test.sql
-- ============================================================================

-- (1) "Website": stop the whole migration if it has a row. The lock keeps a
-- row from arriving between the count and the drop.
do $$
declare
  v_rows bigint;
begin
  if to_regclass('public."Website"') is null then
    return;
  end if;
  lock table public."Website" in access exclusive mode;
  select count(*) into v_rows from public."Website";
  if v_rows > 0 then
    raise exception '024: public."Website" has % row(s), so it was not dropped and nothing else was applied. Move or delete the rows, then apply 024 again.', v_rows;
  end if;
  drop table public."Website";
end $$;

-- An identity sequence goes with its table; this only catches a leftover.
drop sequence if exists public."Website_id_seq";

-- (2) Sent-email ledger for send-pilot-email, as discord_notifications_sent
-- (020) is for notify-discord. Keys are pilot_applications:<id>:<status>.
do $$
begin
  if to_regclass('public.pilot_email_notifications_sent') is not null then
    return;
  end if;

  create table public.pilot_email_notifications_sent (
    key text primary key check (char_length(key) <= 200),
    sent_at timestamptz not null default now()
  );

  insert into public.pilot_email_notifications_sent (key)
  select 'pilot_applications:' || p.id || ':' || s.status
  from public.pilot_applications p
  cross join lateral (values ('pending'), (p.status)) as s (status)
  on conflict (key) do nothing;
end $$;

alter table public.pilot_email_notifications_sent enable row level security;
revoke all on public.pilot_email_notifications_sent from anon, authenticated;
grant select, insert on public.pilot_email_notifications_sent to service_role;

-- (3) The webhooks, without the key. Like 020 and 023 they need Database
-- Webhooks (supabase_functions.http_request); without it there is nothing to
-- replace, because the old triggers cannot exist either.
do $$
begin
  if to_regprocedure('supabase_functions.http_request()') is null then
    raise warning '024: Database Webhooks are not enabled, so pilot_email_on_insert and pilot_email_on_status_update were not created';
    return;
  end if;

  drop trigger if exists pilot_email_on_insert on public.pilot_applications;
  create trigger pilot_email_on_insert
    after insert on public.pilot_applications
    for each row execute function supabase_functions.http_request(
      'https://zodrljxcwqkjiipobrhs.supabase.co/functions/v1/send-pilot-email',
      'POST',
      '{"Content-type":"application/json"}',
      '{}',
      '5000'
    );

  drop trigger if exists pilot_email_on_status_update on public.pilot_applications;
  create trigger pilot_email_on_status_update
    after update on public.pilot_applications
    for each row execute function supabase_functions.http_request(
      'https://zodrljxcwqkjiipobrhs.supabase.co/functions/v1/send-pilot-email',
      'POST',
      '{"Content-type":"application/json"}',
      '{}',
      '5000'
    );
end $$;

-- (4) The unused four-argument overload.
drop function if exists public.capture_investor_lead(text, text, text, text);

-- Make PostgREST drop the removed function and table straight away.
notify pgrst, 'reload schema';

-- ----------------------------------------------------------------------------
-- Verify on live after applying (SQL editor), read-only. One row of counts
-- and flags; it never prints a definition.
--   select
--     (select count(*) from pg_proc
--       where prosrc ~ 'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+') as functions_with_jwt,
--     (select count(*) from pg_trigger
--       where pg_get_triggerdef(oid) ~ 'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+') as triggers_with_jwt,
--     (select count(*) from pg_class where relkind in ('v', 'm')
--        and pg_get_viewdef(oid) ~ 'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+') as views_with_jwt,
--     (select count(*) from pg_policy
--       where coalesce(pg_get_expr(polqual, polrelid), '') || coalesce(pg_get_expr(polwithcheck, polrelid), '')
--             ~ 'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+') as policies_with_jwt,
--     (select count(*) from pg_attrdef
--       where pg_get_expr(adbin, adrelid) ~ 'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+') as defaults_with_jwt,
--     (select count(*) from pg_trigger
--       where tgname in ('pilot_email_on_insert', 'pilot_email_on_status_update')
--         and tgrelid = 'public.pilot_applications'::regclass
--         and position('Authorization' in pg_get_triggerdef(oid)) = 0) as webhooks_without_auth_header,
--     to_regprocedure('public.capture_investor_lead(text, text, text, text)') is null as four_arg_gone,
--     to_regprocedure('public.capture_investor_lead(text, text, text, text, text)') is not null as five_arg_kept,
--     to_regclass('public."Website"') is null as website_gone,
--     to_regclass('public.pilot_email_notifications_sent') is not null as ledger_exists,
--     has_table_privilege('anon', 'public.pilot_email_notifications_sent', 'select')
--       or has_table_privilege('authenticated', 'public.pilot_email_notifications_sent', 'select') as clients_read_ledger;
--   -> 0, 0, 0, 0, 0, 2, true, true, true, true, false
--
-- Rollback, by hand and in one transaction. It is only needed together with
-- redeploying the send-pilot-email from before this change (main at aefb0ed,
-- deployed without --no-verify-jwt), whose gateway JWT check needs the key
-- back in the webhooks. The new function works with either set of webhooks.
--
--   1. The webhooks with an Authorization header. Paste the project's
--      service_role key by hand where shown; never write it into this repo.
--        drop trigger if exists pilot_email_on_insert on public.pilot_applications;
--        create trigger pilot_email_on_insert
--          after insert on public.pilot_applications
--          for each row execute function supabase_functions.http_request(
--            'https://zodrljxcwqkjiipobrhs.supabase.co/functions/v1/send-pilot-email',
--            'POST',
--            '{"Content-type":"application/json","Authorization":"Bearer <service_role key, pasted by hand>"}',
--            '{}',
--            '5000'
--          );
--        drop trigger if exists pilot_email_on_status_update on public.pilot_applications;
--        create trigger pilot_email_on_status_update
--          after update on public.pilot_applications
--          for each row execute function supabase_functions.http_request(
--            'https://zodrljxcwqkjiipobrhs.supabase.co/functions/v1/send-pilot-email',
--            'POST',
--            '{"Content-type":"application/json","Authorization":"Bearer <service_role key, pasted by hand>"}',
--            '{}',
--            '5000'
--          );
--
--   2. The ledger (the old function does not use it):
--        drop table if exists public.pilot_email_notifications_sent;
--
--   3. The four-argument capture_investor_lead, as live had it on 2026-10-22
--      (pg_get_functiondef), with its grants:
--        CREATE OR REPLACE FUNCTION public.capture_investor_lead(p_email text, p_name text DEFAULT NULL::text, p_company text DEFAULT NULL::text, p_source text DEFAULT 'investor_gate'::text)
--         RETURNS void
--         LANGUAGE plpgsql
--         SECURITY DEFINER
--         SET search_path TO 'public'
--        AS $function$
--        begin
--          insert into public.investor_leads (email, name, company, source)
--          values (p_email, p_name, p_company, p_source)
--          on conflict do nothing;
--        end;
--        $function$;
--        revoke execute on function public.capture_investor_lead(text, text, text, text) from public;
--        grant execute on function public.capture_investor_lead(text, text, text, text) to anon, authenticated, service_role;
--
--   4. "Website", empty, as live had it: an identity id and created_at, RLS on
--      with no policies, and Supabase's default grants (which a new table in
--      public gets on its own):
--        create table public."Website" (
--          id bigint generated by default as identity primary key,
--          created_at timestamp with time zone not null default now()
--        );
--        alter table public."Website" enable row level security;
-- ----------------------------------------------------------------------------
