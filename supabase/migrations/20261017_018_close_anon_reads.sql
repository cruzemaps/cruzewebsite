-- ============================================================================
-- 20261017_018_close_anon_reads.sql
--
-- Closes three ways the public (anon) key, which ships in the site's
-- JavaScript, can read customer data today. Found by the pilot readiness T17
-- audit of the live CruzeMaps Web Admin project on 2026-10-17:
--
--   1. profiles has a policy "Public profiles are viewable by everyone."
--      (USING true, for every role). It is not in this repo; it came from the
--      Supabase starter template. Anyone with the anon key could read every
--      profile, including email, name, role and organization, and any signed-in
--      fleet user could read every other fleet's users.
--   2. user_latest_loi, company_signals, loi_amendment_counts and
--      archived_counts run as their owner (no security_invoker), so they
--      skip RLS. anon can read LOI signer names, companies and fleet sizes,
--      and the company names of every pilot application. Migration 010 in
--      this repo fixes three of them but was never applied to the live
--      project; company_signals was created by hand and is in no migration.
--   3. anon holds SELECT on those views at all.
--
-- Nothing in the site reads another user's profile without being an admin,
-- and nothing reads these views as anon: the admin screens read profiles
-- through the is_admin() policies, and company_signals is read only inside
-- the SECURITY DEFINER functions admin_search_companies and
-- check_company_status, which run as the owner and keep working.
--
-- Idempotent. Safe to apply on its own, before or after 010.
-- ============================================================================

-- (1) No profile is public. Own row and admin access stay as they were.
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;

-- (2) Views apply the caller's RLS, not the owner's.
do $$
declare
  v text;
begin
  foreach v in array array['user_latest_loi', 'company_signals', 'loi_amendment_counts',
                           'archived_counts', 'investor_journey'] loop
    if to_regclass('public.' || v) is not null then
      execute format('alter view public.%I set (security_invoker = true)', v);
      -- (3) Never readable with the anon key.
      execute format('revoke all on public.%I from anon', v);
    end if;
  end loop;
  -- company_signals is an internal matching table for the two definer
  -- functions above, not something a signed-in user should query.
  if to_regclass('public.company_signals') is not null then
    execute 'revoke all on public.company_signals from authenticated';
  end if;
end $$;
