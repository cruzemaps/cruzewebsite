-- ============================================================================
-- 20261022_022_invites_and_profiles.sql
--
-- Two hardening fixes, checked against the live project (CruzeMaps Web Admin)
-- on 2026-10-22.
--
-- 1. accept_invitation. The live function already requires a signed-in caller,
--    an invitation that exists, is not accepted and has not expired, and the
--    caller's auth email to match the invitation's email (case-insensitive).
--    It marks the invitation accepted in the same transaction. This version
--    keeps all of that, keeps the same signature and messages, and adds:
--      * a row lock on the invitation (SELECT ... FOR UPDATE), so two accepts
--        of the same token cannot both pass the checks;
--      * the caller's real previous role and status in role_history (the old
--        body always wrote 'fleet_owner' as the previous role);
--      * a named switch, public.invite_requires_confirmed_email(), off for now.
--        "Confirm email" is off on this project, so Supabase confirms every
--        address at sign-up and anyone can register an invited address before
--        the invitee does (all 11 accounts are auto-confirmed today). When
--        Anudeep turns "Confirm email" on, also flip the switch:
--          create or replace function public.invite_requires_confirmed_email()
--            returns boolean language sql immutable set search_path = public
--            as $$ select true $$;
--        Then a caller whose email_confirmed_at is null is refused. Accounts
--        auto-confirmed before that day still count as confirmed.
--
-- 2. profiles. anon and authenticated still had table INSERT (role and status
--    columns included), DELETE, TRUNCATE, REFERENCES and TRIGGER on
--    public.profiles, and the policy "Users can insert their own profile."
--    let a signed-in user without a profile row insert one as an active
--    admin. Every profile is created by the handle_new_user trigger (SECURITY
--    DEFINER), all 11 users have one, and the site never inserts, upserts or
--    deletes profiles directly (src/ and supabase/functions/ on main 7c7d92f),
--    so those privileges and the policy go. SELECT and the column UPDATE grant
--    on first_name and last_name stay.
--
-- Idempotent. Rollback statements, with the previous accept_invitation body,
-- are at the end of this file.
-- ============================================================================

-- (1) The switch. Plain SQL, not SECURITY DEFINER; only accept_invitation
-- (which runs as its owner) needs to call it.
create or replace function public.invite_requires_confirmed_email()
returns boolean
language sql
immutable
set search_path = public
as $$ select false $$;

revoke execute on function public.invite_requires_confirmed_email() from public, anon, authenticated;
grant execute on function public.invite_requires_confirmed_email() to service_role;

-- (1) accept_invitation, same signature and messages.
create or replace function public.accept_invitation(invite_token text)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_invite public.invitations%rowtype;
  v_caller uuid := auth.uid();
  v_caller_email text;
  v_caller_confirmed_at timestamptz;
  v_old_role text;
  v_old_status text;
begin
  if v_caller is null then
    raise exception 'Must be authenticated to accept an invitation';
  end if;

  select email, email_confirmed_at
    into v_caller_email, v_caller_confirmed_at
  from auth.users
  where id = v_caller;

  -- Lock the invitation so two accepts of the same token cannot both pass.
  select * into v_invite
  from public.invitations
  where token = invite_token
  for update;

  if v_invite.id is null then raise exception 'Invitation not found'; end if;
  if v_invite.accepted_at is not null then raise exception 'Already accepted'; end if;
  if v_invite.expires_at < now() then raise exception 'Invitation expired'; end if;
  if v_caller_email is null or lower(trim(v_invite.email)) <> lower(trim(v_caller_email)) then
    raise exception 'This invitation was issued to a different email address';
  end if;
  if public.invite_requires_confirmed_email() and v_caller_confirmed_at is null then
    raise exception 'Confirm your email address before accepting this invitation';
  end if;

  select role, status
    into v_old_role, v_old_status
  from public.profiles
  where id = v_caller
  for update;

  update public.profiles
  set role = v_invite.role,
      organization_id = v_invite.organization_id,
      invited_by = v_invite.invited_by,
      status = 'active'
  where id = v_caller;

  update public.invitations
  set accepted_at = now(),
      accepted_by = v_caller
  where id = v_invite.id;

  insert into public.role_history (
    user_id, old_role, new_role, old_status, new_status, changed_by, reason
  )
  values (
    v_caller, v_old_role, v_invite.role, v_old_status, 'active', v_invite.invited_by,
    'Accepted invitation ' || v_invite.id::text
  );

  return v_invite.role;
end;
$function$;

-- Same grants as after 021.
revoke execute on function public.accept_invitation(text) from public, anon;
grant execute on function public.accept_invitation(text) to authenticated, service_role;

-- (2) profiles: only the trigger creates profiles.
revoke insert, delete, truncate, references, trigger on public.profiles from anon, authenticated;
drop policy if exists "Users can insert their own profile." on public.profiles;

-- ----------------------------------------------------------------------------
-- Rollback:
--
-- grant insert, delete, truncate, references, trigger on public.profiles to anon, authenticated;
-- create policy "Users can insert their own profile." on public.profiles
--   for insert to public with check (auth.uid() = id);
-- drop function public.invite_requires_confirmed_email();  -- after restoring the body below
--
-- The previous accept_invitation (live until 022), restored with:
-- create or replace function public.accept_invitation(invite_token text)
--  returns text language plpgsql security definer set search_path to 'public'
-- as $function$
-- declare
--   v_invite public.invitations%rowtype;
--   v_caller uuid := auth.uid();
--   v_caller_email text;
-- begin
--   if v_caller is null then
--     raise exception 'Must be authenticated to accept an invitation';
--   end if;
--   select email into v_caller_email from auth.users where id = v_caller;
--   select * into v_invite from public.invitations where token = invite_token;
--   if v_invite.id is null then raise exception 'Invitation not found'; end if;
--   if v_invite.accepted_at is not null then raise exception 'Already accepted'; end if;
--   if v_invite.expires_at < now() then raise exception 'Invitation expired'; end if;
--   if v_caller_email is null or lower(v_invite.email) <> lower(v_caller_email) then
--     raise exception 'This invitation was issued to a different email address';
--   end if;
--   update public.profiles
--   set role = v_invite.role, organization_id = v_invite.organization_id,
--       invited_by = v_invite.invited_by, status = 'active'
--   where id = v_caller;
--   update public.invitations set accepted_at = now(), accepted_by = v_caller
--   where id = v_invite.id;
--   insert into public.role_history (user_id, old_role, new_role, new_status, changed_by, reason)
--   values (v_caller, 'fleet_owner', v_invite.role, 'active', v_invite.invited_by,
--           'Accepted invitation ' || v_invite.id::text);
--   return v_invite.role;
-- end;
-- $function$;
-- ----------------------------------------------------------------------------
