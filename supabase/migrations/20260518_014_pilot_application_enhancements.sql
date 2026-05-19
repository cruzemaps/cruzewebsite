-- ============================================================================
-- 20260518_014_pilot_application_enhancements.sql
-- Structured pilot application fields, fleet-visible admin messages,
-- one active application per user, wizard drafts, LOI contact email.
-- ============================================================================

-- Structured application fields (user-submitted via /apply)
alter table public.pilot_applications
  add column if not exists website text,
  add column if not exists primary_lanes text,
  add column if not exists fms_provider text,
  add column if not exists fms_other text,
  add column if not exists contact_name text,
  add column if not exists contact_email text,
  add column if not exists contact_phone text,
  add column if not exists contact_title text,
  add column if not exists application_notes text,
  add column if not exists fleet_visible_message text;

comment on column public.pilot_applications.notes is
  'Internal admin disposition notes (not shown to fleet owners).';
comment on column public.pilot_applications.application_notes is
  'Free-text notes from the applicant on /apply.';
comment on column public.pilot_applications.fleet_visible_message is
  'Message from ops shown on the fleet dashboard (e.g. next steps, kickoff).';

-- One non-terminal application per user (re-apply after denied/archived).
drop index if exists public.pilot_applications_one_active_per_user;
create unique index pilot_applications_one_active_per_user
  on public.pilot_applications (user_id)
  where status not in ('archived', 'denied');

-- Wizard drafts (authenticated users only)
create table if not exists public.pilot_application_drafts (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.pilot_application_drafts enable row level security;

drop policy if exists "Users manage own draft" on public.pilot_application_drafts;
create policy "Users manage own draft" on public.pilot_application_drafts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- LOI snapshot: contact email at signing time
alter table public.loi_signatures
  add column if not exists contact_email text;

-- ---------------------------------------------------------------------------
-- Draft helpers
-- ---------------------------------------------------------------------------
create or replace function public.upsert_pilot_draft(p_payload jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  insert into public.pilot_application_drafts (user_id, payload, updated_at)
  values (auth.uid(), coalesce(p_payload, '{}'::jsonb), now())
  on conflict (user_id) do update
    set payload = excluded.payload, updated_at = now();
end;
$$;

grant execute on function public.upsert_pilot_draft(jsonb) to authenticated;

create or replace function public.get_pilot_draft()
returns jsonb
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select payload from public.pilot_application_drafts where user_id = auth.uid()),
    '{}'::jsonb
  );
$$;

grant execute on function public.get_pilot_draft() to authenticated;

create or replace function public.delete_pilot_draft()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.pilot_application_drafts where user_id = auth.uid();
end;
$$;

grant execute on function public.delete_pilot_draft() to authenticated;

-- ---------------------------------------------------------------------------
-- LOI metadata (IP from Edge Function with service role)
-- ---------------------------------------------------------------------------
create or replace function public.set_loi_signature_metadata(
  p_loi_id uuid,
  p_ip_address text,
  p_user_agent text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
begin
  select user_id into v_owner from public.loi_signatures where id = p_loi_id;
  if v_owner is null then
    raise exception 'LOI not found';
  end if;
  -- Service role (Edge Function) may set metadata without a user JWT.
  if auth.uid() is null then
    update public.loi_signatures
    set
      ip_address = coalesce(nullif(trim(p_ip_address), ''), ip_address),
      user_agent = coalesce(nullif(trim(p_user_agent), ''), user_agent)
    where id = p_loi_id;
    return;
  end if;
  if auth.uid() <> v_owner and not public.is_admin() then
    raise exception 'Not authorized';
  end if;
  update public.loi_signatures
  set
    ip_address = coalesce(nullif(trim(p_ip_address), ''), ip_address),
    user_agent = coalesce(nullif(trim(p_user_agent), ''), user_agent)
  where id = p_loi_id;
end;
$$;

grant execute on function public.set_loi_signature_metadata(uuid, text, text) to authenticated;
grant execute on function public.set_loi_signature_metadata(uuid, text, text) to service_role;

-- Backfill structured columns from legacy notes blob (best-effort)
update public.pilot_applications pa
set
  website = coalesce(pa.website, (regexp_match(pa.notes, 'Website: (.+)', 'n'))[1]),
  primary_lanes = coalesce(pa.primary_lanes, (regexp_match(pa.notes, 'Primary lanes: (.+)', 'n'))[1]),
  contact_name = coalesce(pa.contact_name, (regexp_match(pa.notes, 'Contact: (.+)', 'n'))[1]),
  contact_title = coalesce(pa.contact_title, (regexp_match(pa.notes, 'Title: (.+)', 'n'))[1]),
  contact_phone = coalesce(pa.contact_phone, (regexp_match(pa.notes, 'Phone: (.+)', 'n'))[1])
where pa.notes is not null
  and pa.notes like '%Website:%'
  and pa.website is null;
