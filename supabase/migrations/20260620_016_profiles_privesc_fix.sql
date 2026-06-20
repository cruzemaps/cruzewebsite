-- ============================================================================
-- 20260620_016_profiles_privesc_fix.sql
-- CRITICAL: privilege escalation via self-service profile update.
--
-- The "Users can update own profile" policy (migration 002, line 197) has a
-- USING clause but NO WITH CHECK and no column restriction:
--
--     create policy "Users can update own profile" on public.profiles
--       for update using (auth.uid() = id);
--
-- Because permissive RLS policies are OR-combined, any authenticated user
-- (default role 'fleet_owner') could run, from the browser with the anon key:
--
--     supabase.from('profiles').update({ role: 'admin', status: 'active' })
--             .eq('id', myUserId)
--
-- The post-update row still satisfies `auth.uid() = id`, so the write
-- succeeds. The JWT hook (custom_access_token_hook, migration 003) then copies
-- profiles.role into the app_role claim and is_admin() (migration 002) reads
-- profiles.role directly — both return admin on next token refresh, handing
-- the attacker the full /admin portal (all LOIs, pilot apps, investor leads,
-- PII, and every admin RPC). This re-opens the exact hole migration 001/002
-- were written to close.
--
-- Fix: keep self-edits to non-privileged fields working (first_name,
-- last_name, email, last_active_at, ...) but pin the privileged columns
-- (role, status, organization_id) to their current values via WITH CHECK.
-- Privileged changes still flow through the admin policy ("Admins can update
-- all profiles", is_admin()) and the change_user_role() RPC, which are
-- unaffected (an admin's write passes the OR-combined admin policy WITH CHECK).
--
-- Idempotent. Safe to re-run.
-- ============================================================================

drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can update own profile" on public.profiles
  for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role   = (select p.role   from public.profiles p where p.id = auth.uid())
    and status = (select p.status from public.profiles p where p.id = auth.uid())
    and organization_id is not distinct from
        (select p.organization_id from public.profiles p where p.id = auth.uid())
  );
