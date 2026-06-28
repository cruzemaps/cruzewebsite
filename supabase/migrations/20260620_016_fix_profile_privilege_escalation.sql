-- ============================================================================
-- 20260620_016_fix_profile_privilege_escalation.sql
--
-- SECURITY FIX — privilege escalation via self-UPDATE of public.profiles.
--
-- 002_role_management.sql:197 created:
--     create policy "Users can update own profile" on public.profiles
--       for update using (auth.uid() = id);
-- with NO `with check`. In Postgres RLS, when an UPDATE policy omits
-- `with check`, the `using` expression is reused as the row-check for the NEW
-- row. `auth.uid() = id` only pins the row's id — it constrains nothing about
-- `role` / `status` / `organization_id`. So any authenticated user could run:
--     update public.profiles set role = 'admin' where id = auth.uid();
-- and self-promote. The JWT custom-claims hook (003) then reads profiles.role
-- straight into `app_role`, minting a real admin token on the next refresh.
-- (OWASP A01:2021 Broken Access Control / CWE-269 Improper Privilege
-- Management. Migration 001 only fixed the *signup* trigger, not this path.)
--
-- FIX STRATEGY — column privileges, not a trigger.
-- Every legitimate mutation of public.profiles goes through a SECURITY DEFINER
-- function (change_user_role / accept_invitation / touch_last_active /
-- handle_new_user). Those run as the table owner and are unaffected by grants
-- to the PostgREST roles. A repo grep confirms NO client code path does a
-- direct `.from('profiles').update(...)`. So we drop the broad UPDATE grant
-- from anon/authenticated and re-grant UPDATE on ONLY the benign name columns.
-- After this, `role`/`status`/`organization_id` are physically unwritable
-- except through the audited SECURITY DEFINER RPCs.
--
-- NOTE: accept_invitation() legitimately elevates the *caller's own* role
-- (member -> fleet_owner) and keeps working precisely because it is
-- SECURITY DEFINER (owner-run) and bypasses these column grants. This is why a
-- column-grant fix is correct here and a "block self role-change" trigger
-- would be wrong (it would break invitation acceptance).
--
-- Idempotent.
-- ============================================================================

-- 1. Remove the table-wide UPDATE privilege from the PostgREST API roles.
revoke update on public.profiles from authenticated;
revoke update on public.profiles from anon;

-- 2. Re-grant UPDATE on ONLY the columns a user may change about themselves.
--    role / status / organization_id / requested_role / last_active_at are
--    deliberately excluded; they move only through the SECURITY DEFINER RPCs.
grant update (first_name, last_name) on public.profiles to authenticated;

-- 3. Make the self-update policy's intent explicit. The column grants above are
--    the actual enforcement; this WITH CHECK pins the row to the caller so the
--    policy can never be (re)used to touch another user's row.
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 4. The admin UPDATE policy (002:199) also lacked a WITH CHECK. Admins change
--    roles through change_user_role() (SECURITY DEFINER), not direct writes, so
--    they too are column-limited on any direct UPDATE — pin the row-check for
--    correctness/defense-in-depth.
drop policy if exists "Admins can update all profiles" on public.profiles;
create policy "Admins can update all profiles" on public.profiles
  for update
  using (public.is_admin())
  with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- Verify (run manually in the SQL editor as a non-admin user; should ERROR
-- with "permission denied for column role"):
--     update public.profiles set role = 'admin' where id = auth.uid();
-- A name change by the same user should still succeed:
--     update public.profiles set first_name = 'OK' where id = auth.uid();
-- ----------------------------------------------------------------------------
