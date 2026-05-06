-- ============================================================================
-- 20260506_010_security_fixes.sql
-- Roll-up fix for issues surfaced in the audit:
--   #5  views without security_invoker bypass RLS
--   #6  permanent_deletions.deleted_by + loi_signatures.archived_by lacked
--       ON DELETE SET NULL → user hard-delete cascade fails
--   #7  migration 003's "auth admin can read profiles for JWT" policy was
--       not idempotent; re-running 003 errored with "policy already exists"
--   #36 user_latest_loi view didn't exclude archived LOIs
--
-- Idempotent. Safe to re-run.
-- ============================================================================

-- (#5) Recreate views with security_invoker so RLS on underlying tables applies
-- to the caller, not the view owner.
drop view if exists public.user_latest_loi;
create view public.user_latest_loi
  with (security_invoker = true)
  as
  select distinct on (user_id)
    id, user_id, pilot_application_id, participant_name, participant_company,
    fleet_size, signed_at, loi_version
  from public.loi_signatures
  -- (#36) hide archived LOIs from "latest" computations.
  where archived_at is null
  order by user_id, signed_at desc;

grant select on public.user_latest_loi to authenticated;

drop view if exists public.loi_amendment_counts;
create view public.loi_amendment_counts
  with (security_invoker = true)
  as
  select loi_signature_id, count(*)::int as amendment_count, max(amended_at) as last_amended_at
  from public.loi_amendments
  group by loi_signature_id;

grant select on public.loi_amendment_counts to authenticated;

drop view if exists public.archived_counts;
create view public.archived_counts
  with (security_invoker = true)
  as
  select 'users' as entity, count(*)::int as count from public.profiles where status = 'archived'
  union all
  select 'pilots', count(*)::int from public.pilot_applications where status = 'archived'
  union all
  select 'lois', count(*)::int from public.loi_signatures where archived_at is not null
  union all
  select 'permanent_deletions', count(*)::int from public.permanent_deletions;

grant select on public.archived_counts to authenticated;

-- (#6) Allow admin hard-delete to succeed even when the deleter has already
-- archived/deleted other rows. ALTER does not support a clean
-- "alter constraint" syntax for FKs, so drop + recreate.
alter table public.loi_signatures
  drop constraint if exists loi_signatures_archived_by_fkey;
alter table public.loi_signatures
  add constraint loi_signatures_archived_by_fkey
  foreign key (archived_by) references public.profiles(id) on delete set null;

alter table public.permanent_deletions
  drop constraint if exists permanent_deletions_deleted_by_fkey;
alter table public.permanent_deletions
  add constraint permanent_deletions_deleted_by_fkey
  foreign key (deleted_by) references public.profiles(id) on delete set null;

-- For completeness: make role_history.changed_by also SET NULL on actor
-- deletion so the audit trail survives even if the admin who made the
-- change is later hard-deleted.
alter table public.role_history
  drop constraint if exists role_history_changed_by_fkey;
alter table public.role_history
  add constraint role_history_changed_by_fkey
  foreign key (changed_by) references public.profiles(id) on delete set null;

-- (#7) Make migration 003's policy idempotent retroactively. The policy
-- already exists, so this is a no-op for current installs but ensures
-- future re-applies of 003 don't error.
drop policy if exists "auth admin can read profiles for JWT" on public.profiles;
create policy "auth admin can read profiles for JWT" on public.profiles
  as permissive for select to supabase_auth_admin using (true);
