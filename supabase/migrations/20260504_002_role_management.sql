-- ============================================================================
-- 20260504_002_role_management.sql
-- Full role-management infrastructure: organizations, role audit log,
-- invitations, profile status, and helper functions.
-- ============================================================================

-- 1. Organizations
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  org_type text check (org_type in ('fleet','city','partner','internal')) not null,
  status text check (status in ('prospect','active','suspended','archived')) default 'prospect',
  website text,
  created_at timestamptz default now(),
  created_by uuid references public.profiles(id)
);

alter table public.organizations enable row level security;

-- 2. Extend profiles
alter table public.profiles
  add column if not exists organization_id uuid references public.organizations(id),
  add column if not exists status text
    check (status in ('pending','active','suspended','archived')) default 'pending',
  add column if not exists invited_by uuid references public.profiles(id),
  add column if not exists last_active_at timestamptz,
  add column if not exists email text;

-- Backfill last_active_at for existing rows
update public.profiles set last_active_at = created_at where last_active_at is null;
update public.profiles set status = 'active' where status is null;

-- 3. Role history audit log
create table if not exists public.role_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  old_role text,
  new_role text not null,
  old_status text,
  new_status text,
  changed_by uuid references public.profiles(id) not null,
  reason text not null,
  changed_at timestamptz default now()
);

alter table public.role_history enable row level security;

-- 4. Invitations
create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role text check (role in ('admin','fleet_owner','city_operator')) not null,
  organization_id uuid references public.organizations(id),
  token text unique not null default encode(gen_random_bytes(24), 'hex'),
  invited_by uuid references public.profiles(id) not null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  accepted_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

create index if not exists invitations_token_idx on public.invitations(token);
create index if not exists invitations_email_idx on public.invitations(email);

alter table public.invitations enable row level security;

-- 5. Helper: is_admin(). SECURITY DEFINER so it bypasses RLS recursion.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'active'
  );
$$;

-- 6. Helper: change_user_role. Single transaction: validate -> update profile
-- -> write audit row. Only admins can call this.
create or replace function public.change_user_role(
  target_user_id uuid,
  new_role text,
  new_status text default null,
  reason text default null
)
returns void
language plpgsql
security definer
as $$
declare
  v_old_role text;
  v_old_status text;
  v_caller uuid := auth.uid();
begin
  if not public.is_admin() then
    raise exception 'Only admins can change roles';
  end if;

  if new_role not in ('admin','fleet_owner','city_operator') then
    raise exception 'Invalid role: %', new_role;
  end if;

  if reason is null or length(trim(reason)) < 3 then
    raise exception 'A reason of at least 3 characters is required';
  end if;

  select role, status into v_old_role, v_old_status
  from public.profiles where id = target_user_id;

  if v_old_role is null then
    raise exception 'User not found: %', target_user_id;
  end if;

  update public.profiles
  set role = new_role,
      status = coalesce(new_status, status)
  where id = target_user_id;

  insert into public.role_history (
    user_id, old_role, new_role, old_status, new_status, changed_by, reason
  )
  values (
    target_user_id, v_old_role, new_role, v_old_status,
    coalesce(new_status, v_old_status), v_caller, reason
  );
end;
$$;

-- 7. Helper: accept_invitation. Called from /invite/[token] flow.
create or replace function public.accept_invitation(invite_token text)
returns text
language plpgsql
security definer
as $$
declare
  v_invite public.invitations%rowtype;
  v_caller uuid := auth.uid();
begin
  if v_caller is null then
    raise exception 'Must be authenticated to accept an invitation';
  end if;

  select * into v_invite from public.invitations where token = invite_token;

  if v_invite.id is null then raise exception 'Invitation not found'; end if;
  if v_invite.accepted_at is not null then raise exception 'Already accepted'; end if;
  if v_invite.expires_at < now() then raise exception 'Invitation expired'; end if;

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
    user_id, old_role, new_role, new_status, changed_by, reason
  )
  values (
    v_caller, 'fleet_owner', v_invite.role, 'active', v_invite.invited_by,
    'Accepted invitation ' || v_invite.id::text
  );

  return v_invite.role;
end;
$$;

-- 8. Pilot applications: expand status lifecycle and add audit fields
alter table public.pilot_applications
  add column if not exists notes text,
  add column if not exists reviewed_by uuid references public.profiles(id),
  add column if not exists reviewed_at timestamptz,
  add column if not exists organization_id uuid references public.organizations(id);

-- Allow new lifecycle states
alter table public.pilot_applications drop constraint if exists pilot_applications_status_check;
alter table public.pilot_applications
  add constraint pilot_applications_status_check
  check (status in ('pending','in_review','approved','onboarding','active','denied','archived'));

-- 9. RLS policies (DRY using is_admin())
-- profiles
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Admins can update all profiles" on public.profiles;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id or public.is_admin());
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);
create policy "Admins can update all profiles" on public.profiles
  for update using (public.is_admin());

-- organizations
drop policy if exists "Members can view their org" on public.organizations;
drop policy if exists "Admins manage organizations" on public.organizations;

create policy "Members can view their org" on public.organizations
  for select using (
    public.is_admin()
    or exists (select 1 from public.profiles where id = auth.uid() and organization_id = organizations.id)
  );
create policy "Admins manage organizations" on public.organizations
  for all using (public.is_admin()) with check (public.is_admin());

-- role_history
drop policy if exists "Users see own history" on public.role_history;
drop policy if exists "Admins see all history" on public.role_history;

create policy "Users see own history" on public.role_history
  for select using (auth.uid() = user_id or public.is_admin());
-- inserts only happen via change_user_role / accept_invitation (security definer)

-- invitations
drop policy if exists "Admins manage invitations" on public.invitations;
drop policy if exists "Anyone can read invitation by token" on public.invitations;

create policy "Admins manage invitations" on public.invitations
  for all using (public.is_admin()) with check (public.is_admin());
-- Token lookup happens via accept_invitation (security definer); no public read.

-- pilot_applications: tighten existing policies to use is_admin()
drop policy if exists "Admins can update applications" on public.pilot_applications;
create policy "Admins can update applications" on public.pilot_applications
  for update using (public.is_admin());
create policy "Admins can delete applications" on public.pilot_applications
  for delete using (public.is_admin());

-- 10. last_active_at touch helper (call from app on each protected nav)
create or replace function public.touch_last_active()
returns void
language sql
security definer
as $$
  update public.profiles set last_active_at = now() where id = auth.uid();
$$;

-- 11. Live impact stats RPC for /stats page (anonymized aggregates only)
create or replace function public.live_impact_stats()
returns table (
  active_pilots bigint,
  total_fleets bigint,
  total_cities bigint
)
language sql
security definer
stable
as $$
  select
    (select count(*) from public.pilot_applications where status in ('approved','onboarding','active')),
    (select count(*) from public.profiles where role = 'fleet_owner' and status = 'active'),
    (select count(*) from public.organizations where org_type = 'city' and status = 'active');
$$;

grant execute on function public.live_impact_stats() to anon, authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.change_user_role(uuid, text, text, text) to authenticated;
grant execute on function public.accept_invitation(text) to authenticated;
grant execute on function public.touch_last_active() to authenticated;
