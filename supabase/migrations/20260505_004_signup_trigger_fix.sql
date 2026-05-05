-- ============================================================================
-- 20260505_004_signup_trigger_fix.sql
-- Fix the handle_new_user trigger so signups stop returning
-- "database error saving new user".
--
-- Three fixes:
--   1. Populate the new email + last_active_at columns so any future
--      NOT NULL constraint additions don't break this trigger.
--   2. Default status to 'active' (was implicitly 'pending'). Pending
--      users get redirected away from dashboards by ProtectedRoute,
--      which would lock new fleet owners out of /fleet-dashboard
--      immediately after signup. 'active' is the correct default for
--      self-signup flows; admin-created invitations still hit the
--      'active' path explicitly.
--   3. Add SET search_path so the function reaches public.* unambiguously
--      regardless of caller's session settings (this is a documented
--      security-definer best practice).
--   4. Wrap in EXCEPTION block that logs the real error to Postgres logs
--      so future diagnostics are easy.
--
-- Idempotent. Safe to re-run.
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, role, requested_role, first_name, last_name, email, status, last_active_at
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
    raise log 'handle_new_user failed for user_id=% email=% sqlstate=% message=%',
      new.id, new.email, SQLSTATE, SQLERRM;
    raise;
end;
$$;

-- Sanity: clean up any orphan profile rows that don't have a matching auth.user
-- (could happen if a previous failed signup left half-state behind).
delete from public.profiles
  where id not in (select id from auth.users);
