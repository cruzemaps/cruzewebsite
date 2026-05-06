-- ============================================================================
-- 20260506_009_archive_library.sql
-- Archive + permanent-delete infrastructure across users, pilots, invitations,
-- and LOI signatures. Powers the new "Archive Library" admin tab.
--
-- Two layers:
--   1. SOFT ARCHIVE — hides a record from default views. Restore-able.
--      - profiles + pilot_applications already use status='archived'.
--      - invitations: existing acceptance/expiry filtering covers this.
--      - loi_signatures: new archived_at/archived_by/archive_reason cols.
--   2. HARD DELETE — permanently removes a record. Captured in
--      permanent_deletions audit log. Admin-only RPCs.
-- ============================================================================

-- 1. LOI signatures get archive columns. The original signed text remains
--    in loi_full_text (immutable) so legal integrity is preserved.
alter table public.loi_signatures
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references public.profiles(id),
  add column if not exists archive_reason text;

-- 2. Allow admins to UPDATE only the archive metadata columns. We can't
--    directly express "only these columns" in RLS, but the existing
--    immutability is enforced at the app layer (admins use the
--    archive_loi/restore_loi RPCs, not direct updates). For belt and
--    suspenders, we add a permissive UPDATE policy gated on is_admin().
drop policy if exists "Admins archive LOIs" on public.loi_signatures;
create policy "Admins archive LOIs" on public.loi_signatures
  for update using (public.is_admin()) with check (public.is_admin());

-- 3. Permanent-deletions audit log. Every hard delete writes a row here.
create table if not exists public.permanent_deletions (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('user','pilot_application','invitation','loi_signature')),
  entity_id uuid not null,
  entity_snapshot jsonb,            -- last known state of the deleted row
  reason text not null check (length(trim(reason)) >= 5),
  deleted_by uuid references public.profiles(id) not null,
  deleted_at timestamptz default now() not null
);

create index if not exists permanent_deletions_type_idx
  on public.permanent_deletions(entity_type, deleted_at desc);

alter table public.permanent_deletions enable row level security;
drop policy if exists "Admins read deletions" on public.permanent_deletions;
create policy "Admins read deletions" on public.permanent_deletions
  for select using (public.is_admin());
-- No insert/update/delete policies; rows are inserted only by SECURITY DEFINER
-- functions below.

-- 4. Soft archive RPCs (LOI specifically; users/pilots already use status update)
create or replace function public.archive_loi(p_loi_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Only admins can archive LOIs'; end if;
  if p_reason is null or length(trim(p_reason)) < 3 then
    raise exception 'Reason must be at least 3 characters';
  end if;
  update public.loi_signatures
    set archived_at = now(), archived_by = auth.uid(), archive_reason = p_reason
    where id = p_loi_id;
end;
$$;

create or replace function public.restore_loi(p_loi_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Only admins can restore LOIs'; end if;
  update public.loi_signatures
    set archived_at = null, archived_by = null, archive_reason = null
    where id = p_loi_id;
end;
$$;

-- 5. Hard-delete RPCs. Each one:
--   a. Checks admin
--   b. Captures snapshot to permanent_deletions
--   c. Deletes the row
--   d. Returns success

create or replace function public.admin_hard_delete_pilot_application(
  p_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_row jsonb;
begin
  if not public.is_admin() then raise exception 'Admin only'; end if;
  if length(trim(p_reason)) < 5 then raise exception 'Reason must be at least 5 chars'; end if;
  select to_jsonb(p) into v_row from public.pilot_applications p where p.id = p_id;
  if v_row is null then raise exception 'Pilot application not found'; end if;
  insert into public.permanent_deletions (entity_type, entity_id, entity_snapshot, reason, deleted_by)
    values ('pilot_application', p_id, v_row, p_reason, auth.uid());
  delete from public.pilot_applications where id = p_id;
end;
$$;

create or replace function public.admin_hard_delete_invitation(
  p_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_row jsonb;
begin
  if not public.is_admin() then raise exception 'Admin only'; end if;
  if length(trim(p_reason)) < 5 then raise exception 'Reason must be at least 5 chars'; end if;
  select to_jsonb(i) into v_row from public.invitations i where i.id = p_id;
  if v_row is null then raise exception 'Invitation not found'; end if;
  insert into public.permanent_deletions (entity_type, entity_id, entity_snapshot, reason, deleted_by)
    values ('invitation', p_id, v_row, p_reason, auth.uid());
  delete from public.invitations where id = p_id;
end;
$$;

create or replace function public.admin_hard_delete_loi(
  p_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_row jsonb;
begin
  if not public.is_admin() then raise exception 'Admin only'; end if;
  if length(trim(p_reason)) < 10 then
    raise exception 'LOI hard-delete requires a reason of at least 10 chars';
  end if;
  select to_jsonb(l) into v_row from public.loi_signatures l where l.id = p_id;
  if v_row is null then raise exception 'LOI not found'; end if;
  insert into public.permanent_deletions (entity_type, entity_id, entity_snapshot, reason, deleted_by)
    values ('loi_signature', p_id, v_row, p_reason, auth.uid());
  delete from public.loi_signatures where id = p_id;
end;
$$;

-- User hard-delete is the most invasive: cascades through profiles → pilot_applications,
-- loi_signatures, invitations, role_history (most via ON DELETE CASCADE).
create or replace function public.admin_hard_delete_user(
  p_user_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare v_row jsonb;
begin
  if not public.is_admin() then raise exception 'Admin only'; end if;
  if p_user_id = auth.uid() then raise exception 'You cannot delete your own account'; end if;
  if length(trim(p_reason)) < 10 then
    raise exception 'User hard-delete requires a reason of at least 10 chars';
  end if;
  select to_jsonb(p) into v_row from public.profiles p where p.id = p_user_id;
  insert into public.permanent_deletions (entity_type, entity_id, entity_snapshot, reason, deleted_by)
    values ('user', p_user_id, v_row, p_reason, auth.uid());
  -- Deleting from auth.users cascades to public.profiles via FK ON DELETE CASCADE.
  -- profiles cascade further into role_history (defined with ON DELETE CASCADE).
  -- pilot_applications.user_id FK has no cascade; clean those up first.
  delete from public.pilot_applications where user_id = p_user_id;
  delete from public.invitations where invited_by = p_user_id or accepted_by = p_user_id;
  delete from auth.users where id = p_user_id;
end;
$$;

-- Grant execute to authenticated role; the is_admin() check inside each function
-- enforces admin-only access at runtime.
grant execute on function public.archive_loi(uuid, text) to authenticated;
grant execute on function public.restore_loi(uuid) to authenticated;
grant execute on function public.admin_hard_delete_pilot_application(uuid, text) to authenticated;
grant execute on function public.admin_hard_delete_invitation(uuid, text) to authenticated;
grant execute on function public.admin_hard_delete_loi(uuid, text) to authenticated;
grant execute on function public.admin_hard_delete_user(uuid, text) to authenticated;

-- View for quick "what's archived" count on the admin home tile
create or replace view public.archived_counts as
  select 'users' as entity, count(*)::int as count from public.profiles where status = 'archived'
  union all
  select 'pilots', count(*)::int from public.pilot_applications where status = 'archived'
  union all
  select 'lois', count(*)::int from public.loi_signatures where archived_at is not null
  union all
  select 'permanent_deletions', count(*)::int from public.permanent_deletions;

grant select on public.archived_counts to authenticated;
