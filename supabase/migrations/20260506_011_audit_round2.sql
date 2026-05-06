-- ============================================================================
-- 20260506_011_audit_round2.sql
-- Follow-ups from the second-pass audit (after 010):
--   #3  Apply.tsx LOI-insert-failure rollback called .delete() as the
--       fleet_owner — RLS denies non-admin DELETE on pilot_applications,
--       so the orphan row + spurious Discord ping persisted. Provides a
--       SECURITY DEFINER RPC restricted to the row's owner that only
--       deletes when the row has no signed LOI yet.
--   #9  admin_hard_delete_user cascaded loi_signatures / pilot_applications /
--       invitations into oblivion without a permanent_deletions snapshot.
--       This update snapshots them BEFORE the cascade fires.
--   #10 restore_loi previously took no reason; updates the signature so
--       restorations write to the archive_reason field as
--       "RESTORED [<timestamp>]: <reason>" before clearing archived_at.
--
-- Idempotent. Safe to re-run.
-- ============================================================================

-- (#3) Owner-scoped pre-LOI rollback. Fleet users can call this only on
-- their own pilot_applications row, and only while the row has no LOI.
-- After an LOI is signed, the row is locked.
create or replace function public.rollback_unsigned_pilot(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  row_owner uuid;
  has_loi boolean;
begin
  select user_id into row_owner from public.pilot_applications where id = p_id;
  if row_owner is null then
    return false;
  end if;
  if row_owner <> auth.uid() then
    raise exception 'rollback_unsigned_pilot: caller does not own this row';
  end if;
  select exists (
    select 1 from public.loi_signatures where pilot_application_id = p_id
  ) into has_loi;
  if has_loi then
    raise exception 'rollback_unsigned_pilot: an LOI is already attached; rollback denied';
  end if;
  delete from public.pilot_applications where id = p_id;
  return true;
end;
$$;

revoke all on function public.rollback_unsigned_pilot(uuid) from public;
grant execute on function public.rollback_unsigned_pilot(uuid) to authenticated;

-- (#9) Snapshot LOIs / pilots / invitations into permanent_deletions BEFORE
-- the user row is deleted, so the cascade doesn't erase audit-significant
-- evidence without a trace. We rewrite admin_hard_delete_user end-to-end
-- to ensure ordering: snapshots fire inside the same transaction, then the
-- profiles row is deleted, then the auth.users row.
create or replace function public.admin_hard_delete_user(
  p_user_id uuid,
  p_reason text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  prof_row jsonb;
  acting_admin uuid := auth.uid();
begin
  if not public.is_admin() then
    raise exception 'admin_hard_delete_user: caller is not an admin';
  end if;
  if p_reason is null or length(trim(p_reason)) < 10 then
    raise exception 'admin_hard_delete_user: reason must be at least 10 characters';
  end if;

  -- Snapshot child rows first (they would otherwise vanish via ON DELETE
  -- CASCADE on the auth.users delete below).
  insert into public.permanent_deletions (entity_type, entity_id, snapshot, reason, deleted_by)
  select 'loi_signature', id, to_jsonb(l), 'CASCADED FROM USER DELETE: ' || p_reason, acting_admin
  from public.loi_signatures l where l.user_id = p_user_id;

  insert into public.permanent_deletions (entity_type, entity_id, snapshot, reason, deleted_by)
  select 'pilot_application', id, to_jsonb(pa), 'CASCADED FROM USER DELETE: ' || p_reason, acting_admin
  from public.pilot_applications pa where pa.user_id = p_user_id;

  insert into public.permanent_deletions (entity_type, entity_id, snapshot, reason, deleted_by)
  select 'invitation', id, to_jsonb(inv), 'CASCADED FROM USER DELETE: ' || p_reason, acting_admin
  from public.invitations inv where inv.invited_by = p_user_id or lower(inv.email) = (
    select lower(email) from auth.users where id = p_user_id
  );

  -- Snapshot the profile itself so the audit trail names the deleted user.
  select to_jsonb(p) into prof_row from public.profiles p where p.id = p_user_id;
  insert into public.permanent_deletions (entity_type, entity_id, snapshot, reason, deleted_by)
  values ('user', p_user_id, prof_row, p_reason, acting_admin);

  -- Now actually remove the user. The cascade clears the child rows we
  -- already snapshotted above.
  delete from auth.users where id = p_user_id;
end;
$$;

revoke all on function public.admin_hard_delete_user(uuid, text) from public;
grant execute on function public.admin_hard_delete_user(uuid, text) to authenticated;

-- (#10) restore_loi now takes a reason and records it on the row before
-- clearing the archive markers, so the audit trail keeps a record of WHY
-- a particular LOI came back. The old signature is preserved as a fallback
-- for callers that haven't been updated yet.
create or replace function public.restore_loi(p_loi_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'restore_loi: caller is not an admin';
  end if;
  update public.loi_signatures
    set archive_reason =
          case
            when p_reason is null or length(trim(p_reason)) = 0 then
              coalesce(archive_reason, '') || ' [restored ' || now()::text || ']'
            else
              coalesce(archive_reason, '') || ' [RESTORED ' || now()::text || ': ' || p_reason || ']'
          end,
        archived_at = null,
        archived_by = null
  where id = p_loi_id;
end;
$$;

revoke all on function public.restore_loi(uuid) from public;
revoke all on function public.restore_loi(uuid, text) from public;
grant execute on function public.restore_loi(uuid) to authenticated;
grant execute on function public.restore_loi(uuid, text) to authenticated;
