-- ============================================================================
-- 20261018_019_audit_round2_safe.sql
--
-- Replaces 011 (20260506_011_audit_round2.sql), which was never applied to the
-- live project and must not be: as written it let the anon key delete another
-- user's unsigned pilot application, left two restore_loi overloads that make a
-- one-argument call ambiguous, and its admin_hard_delete_user dropped the
-- self-delete guard and could never succeed on live. Written against the live
-- CruzeMaps Web Admin schema on 2026-10-18, after 015, 010 and 018.
--
--   1. rollback_unsigned_pilot(p_id): Apply.tsx calls it when the LOI insert
--      fails. Refuses a null auth.uid(). The owner may delete their own pending
--      application while it has no LOI; an active admin may delete any
--      application that has no LOI (snapshotted to permanent_deletions).
--   2. restore_loi: one signature only, (p_loi_id, p_reason default null), the
--      shape ArchiveLibraryTab.tsx sends. The old restore_loi(uuid) is dropped,
--      so one- and two-argument calls both resolve. The reason is appended to
--      archive_reason instead of wiping it.
--   3. admin_hard_delete_user: keeps the live checks (admin only, no
--      self-delete, reason of 10+ characters, now also when the reason is
--      null) and the live cleanup of pilot applications and invitations. Adds
--      011's snapshots (LOIs with their amendments, pilot applications,
--      invitations, the profile with its role history). Fixes the reason it
--      always failed: profiles.id references auth.users with no ON DELETE
--      CASCADE, so the profile row is now deleted before the auth user. Rows
--      that only point at the user (reviewer, archiver, org creator, inviter)
--      are set to null. Refuses, without deleting anything, when the user is
--      the recorded actor on audit rows about other users (role_history.
--      changed_by, permanent_deletions.deleted_by, loi_amendments.amended_by
--      are NOT NULL), so the audit trail is never broken; archive instead.
--   4. set_loi_signature_metadata: anon and PUBLIC lose EXECUTE. Its "auth.uid()
--      is null" branch exists for the service role, but anon also has a null
--      uid. The only caller is the capture-loi-metadata edge function, which
--      forwards the signed-in signer's JWT (or uses the service role key), so
--      signing keeps working. authenticated and service_role keep EXECUTE.
--   5. Pins search_path on four SECURITY DEFINER functions that had none:
--      is_admin, change_user_role, touch_last_active, live_impact_stats. Their
--      bodies already use schema-qualified names, so behaviour is unchanged.
--      Grants on these four are left exactly as they are (anon needs is_admin
--      for RLS policies and live_impact_stats for the public stats strip).
--
-- Supabase's default privileges grant EXECUTE on every new function to anon,
-- so every function created or replaced here revokes PUBLIC and anon
-- explicitly. Idempotent: safe to run more than once. Paste it as one run.
-- Test: supabase/tests/019_audit_round2_safe.test.sql
-- ============================================================================

-- (1) Owner-scoped rollback of an application whose LOI insert failed.
create or replace function public.rollback_unsigned_pilot(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_caller uuid := auth.uid();
  v_is_admin boolean;
  v_row public.pilot_applications%rowtype;
begin
  if v_caller is null then
    raise exception 'rollback_unsigned_pilot: sign in first' using errcode = '42501';
  end if;
  v_is_admin := public.is_admin();

  select * into v_row from public.pilot_applications where id = p_id for update;

  -- Same answer for "no such row" and "not yours", so the call cannot be used
  -- to test whether an application id exists.
  if not found
     or (not v_is_admin and (v_row.user_id is distinct from v_caller or v_row.status <> 'pending')) then
    raise exception 'rollback_unsigned_pilot: no pending application of yours with that id'
      using errcode = '42501';
  end if;

  if exists (select 1 from public.loi_signatures where pilot_application_id = p_id) then
    raise exception 'rollback_unsigned_pilot: an LOI is attached; rollback denied'
      using errcode = '42501';
  end if;

  if v_row.user_id is distinct from v_caller then
    insert into public.permanent_deletions (entity_type, entity_id, entity_snapshot, reason, deleted_by)
    values ('pilot_application', v_row.id, to_jsonb(v_row),
            'Unsigned application rolled back by admin', v_caller);
  end if;

  delete from public.pilot_applications where id = p_id;
  return true;
end;
$$;

revoke all on function public.rollback_unsigned_pilot(uuid) from public, anon;
grant execute on function public.rollback_unsigned_pilot(uuid) to authenticated, service_role;

-- (2) One restore_loi, taking an optional reason.
drop function if exists public.restore_loi(uuid);

create or replace function public.restore_loi(p_loi_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Only admins can restore LOIs' using errcode = '42501';
  end if;

  update public.loi_signatures
     set archive_reason =
           case
             when p_reason is null or length(trim(p_reason)) = 0 then
               coalesce(archive_reason, '') || ' [restored ' || now()::text || ']'
             else
               coalesce(archive_reason, '') || ' [RESTORED ' || now()::text || ': ' || trim(p_reason) || ']'
           end,
         archived_at = null,
         archived_by = null
   where id = p_loi_id
     and archived_at is not null;

  if not found then
    raise exception 'restore_loi: no archived LOI with that id' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.restore_loi(uuid, text) from public, anon;
grant execute on function public.restore_loi(uuid, text) to authenticated, service_role;

-- (3) Admin hard-delete of a user that works on the live schema.
create or replace function public.admin_hard_delete_user(p_user_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_admin uuid := auth.uid();
  v_profile jsonb;
  v_actor_rows bigint;
begin
  if v_admin is null or not public.is_admin() then
    raise exception 'Admin only' using errcode = '42501';
  end if;
  if p_user_id is null then
    raise exception 'admin_hard_delete_user: user id required';
  end if;
  if p_user_id = v_admin then
    raise exception 'You cannot delete your own account';
  end if;
  if p_reason is null or length(trim(p_reason)) < 10 then
    raise exception 'User hard-delete requires a reason of at least 10 chars';
  end if;

  select to_jsonb(p) into v_profile from public.profiles p where p.id = p_user_id for update;
  if v_profile is null and not exists (select 1 from auth.users u where u.id = p_user_id) then
    raise exception 'admin_hard_delete_user: user not found' using errcode = 'P0002';
  end if;

  -- Audit rows about other people that name this user as the actor. Their
  -- actor columns are NOT NULL, so deleting the user would either fail or
  -- erase someone else's history. Refuse before touching anything.
  select
      (select count(*) from public.role_history r
        where r.changed_by = p_user_id and r.user_id <> p_user_id)
    + (select count(*) from public.permanent_deletions d
        where d.deleted_by = p_user_id)
    + (select count(*) from public.loi_amendments a
        join public.loi_signatures l on l.id = a.loi_signature_id
        where a.amended_by = p_user_id and l.user_id <> p_user_id)
    into v_actor_rows;
  if v_actor_rows > 0 then
    raise exception 'This user is the recorded actor on % audit row(s) about other users, so a hard delete would break the audit trail. Archive the account instead.', v_actor_rows
      using errcode = '23503';
  end if;

  -- Snapshot everything that is about to disappear.
  insert into public.permanent_deletions (entity_type, entity_id, entity_snapshot, reason, deleted_by)
  select 'loi_signature', l.id,
         to_jsonb(l) || jsonb_build_object('amendments', coalesce(
           (select jsonb_agg(to_jsonb(a) order by a.amended_at)
              from public.loi_amendments a where a.loi_signature_id = l.id), '[]'::jsonb)),
         'CASCADED FROM USER DELETE: ' || p_reason, v_admin
    from public.loi_signatures l
   where l.user_id = p_user_id;

  insert into public.permanent_deletions (entity_type, entity_id, entity_snapshot, reason, deleted_by)
  select 'pilot_application', pa.id, to_jsonb(pa), 'CASCADED FROM USER DELETE: ' || p_reason, v_admin
    from public.pilot_applications pa
   where pa.user_id = p_user_id;

  insert into public.permanent_deletions (entity_type, entity_id, entity_snapshot, reason, deleted_by)
  select 'invitation', inv.id, to_jsonb(inv), 'CASCADED FROM USER DELETE: ' || p_reason, v_admin
    from public.invitations inv
   where inv.invited_by = p_user_id or inv.accepted_by = p_user_id;

  insert into public.permanent_deletions (entity_type, entity_id, entity_snapshot, reason, deleted_by)
  values ('user', p_user_id,
          coalesce(v_profile, '{}'::jsonb) || jsonb_build_object('role_history', coalesce(
            (select jsonb_agg(to_jsonb(r) order by r.changed_at)
               from public.role_history r where r.user_id = p_user_id), '[]'::jsonb)),
          p_reason, v_admin);

  -- The user's own rows (live cleanup, plus LOIs and role history explicitly).
  delete from public.loi_signatures where user_id = p_user_id;      -- amendments cascade
  delete from public.pilot_applications where user_id = p_user_id;
  delete from public.invitations where invited_by = p_user_id or accepted_by = p_user_id;
  delete from public.role_history where user_id = p_user_id;

  -- Rows that only point at the user keep existing without the pointer.
  update public.pilot_applications set reviewed_by = null where reviewed_by = p_user_id;
  update public.loi_signatures set archived_by = null where archived_by = p_user_id;
  update public.organizations set created_by = null where created_by = p_user_id;
  update public.profiles set invited_by = null where invited_by = p_user_id;

  -- profiles.id -> auth.users has no ON DELETE CASCADE, so the profile goes
  -- first (its draft row cascades), then the auth user.
  delete from public.profiles where id = p_user_id;
  delete from auth.users where id = p_user_id;
end;
$$;

revoke all on function public.admin_hard_delete_user(uuid, text) from public, anon;
grant execute on function public.admin_hard_delete_user(uuid, text) to authenticated, service_role;

-- (4) Metadata writes only for signed-in callers and the service role.
revoke execute on function public.set_loi_signature_metadata(uuid, text, text) from public, anon;
grant execute on function public.set_loi_signature_metadata(uuid, text, text) to authenticated, service_role;

-- (5) Pin search_path on the definer functions that had none. ALTER keeps the
-- body and the grants as they are.
do $$
declare
  f text;
begin
  foreach f in array array['public.is_admin()',
                           'public.change_user_role(uuid, text, text, text)',
                           'public.touch_last_active()',
                           'public.live_impact_stats()'] loop
    if to_regprocedure(f) is not null then
      execute format('alter function %s set search_path = public, pg_temp', f);
    end if;
  end loop;
end $$;

-- Make PostgREST pick up the new and dropped signatures straight away.
notify pgrst, 'reload schema';

-- ----------------------------------------------------------------------------
-- Verify after applying (SQL editor), all read-only:
--   select oid::regprocedure, proconfig, proacl from pg_proc
--    where pronamespace = 'public'::regnamespace
--      and proname in ('rollback_unsigned_pilot','restore_loi','admin_hard_delete_user',
--                      'set_loi_signature_metadata','is_admin','change_user_role',
--                      'touch_last_active','live_impact_stats');
--     -> exactly one restore_loi, (uuid, text)
--     -> no "=X/" and no "anon=X" on the first four
--     -> every row has search_path in proconfig
-- ----------------------------------------------------------------------------
