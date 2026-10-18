-- ============================================================================
-- 20261017_017_start_impersonation.sql
--
-- Server-side gate and audit row for the admin "view as user" preview.
--
-- Before this migration the admin portal wrote its impersonation audit row by
-- calling change_user_role() with the role and status it had cached in the
-- browser. That had two problems:
--   1. change_user_role() rewrites profiles.role/status. If the cached values
--      were stale (another admin changed the user in between), opening a
--      preview silently reverted that change.
--   2. The /impersonate handoff decided who was an admin in the browser, from
--      JWT claims or user_metadata.role (user-controllable at signup), and took
--      the role to preview from the URL.
--
-- start_impersonation() replaces both. It checks public.is_admin() (active
-- admin row in profiles, server-side), refuses archived targets, writes one
-- role_history row with role and status unchanged, and returns the target's
-- current role and status for the preview. It never modifies profiles.
--
-- The SPA only offers impersonation in DEV builds (the preview renders mock
-- data). Production has no impersonation route. Developers' local builds can
-- still point at this database, which is why the gate lives here.
--
-- Idempotent. Apply after 016.
-- ============================================================================

create or replace function public.start_impersonation(target_user_id uuid)
returns table (role text, status text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_role text;
  v_status text;
begin
  if v_caller is null or not public.is_admin() then
    raise exception 'start_impersonation: caller is not an active admin'
      using errcode = '42501';
  end if;

  select p.role, p.status into v_role, v_status
  from public.profiles p
  where p.id = target_user_id;

  if v_role is null then
    raise exception 'start_impersonation: user not found';
  end if;

  if v_status = 'archived' then
    raise exception 'start_impersonation: user is archived';
  end if;

  insert into public.role_history (
    user_id, old_role, new_role, old_status, new_status, changed_by, reason
  ) values (
    target_user_id, v_role, v_role, v_status, v_status, v_caller,
    'Impersonation session opened by admin'
  );

  return query select v_role, v_status;
end;
$$;

-- Only signed-in users may call it; the is_admin() check inside does the rest.
revoke all on function public.start_impersonation(uuid) from public;
revoke all on function public.start_impersonation(uuid) from anon;
grant execute on function public.start_impersonation(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- Verify after applying (SQL editor):
--   select proname, prosecdef from pg_proc where proname = 'start_impersonation';
--     -> one row, prosecdef = true
--   As a non-admin user: select * from public.start_impersonation('<any uuid>');
--     -> ERROR 42501 caller is not an active admin, no role_history row
--   As an active admin: returns (role, status) and adds one role_history row
--   whose old_role = new_role and old_status = new_status.
-- ----------------------------------------------------------------------------
