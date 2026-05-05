-- ============================================================================
-- 20260504_001_security_fix.sql
-- CRITICAL: closes the privilege-escalation hole in the original schema where
-- raw_user_meta_data->>'role' was trusted from the public signup payload.
--
-- This file is SAFE TO RUN AS-IS. It only:
--   1. Adds a `requested_role` column to `profiles`.
--   2. Replaces the handle_new_user trigger function so future signups land
--      as 'fleet_owner' regardless of payload.
--
-- It does NOT touch existing rows. To audit and demote pre-existing
-- self-promoted accounts, see docs/SUPABASE_RUNBOOK.md step 4.
-- ============================================================================

alter table public.profiles
  add column if not exists requested_role text
    check (requested_role in ('admin','fleet_owner','city_operator'));

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role, requested_role, first_name, last_name)
  values (
    new.id,
    'fleet_owner',  -- ALWAYS the lowest role; admin promotes via admin portal
    coalesce(new.raw_user_meta_data->>'role', 'fleet_owner'),
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name'
  );
  return new;
end;
$$ language plpgsql security definer;
