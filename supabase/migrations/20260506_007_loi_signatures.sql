-- ============================================================================
-- 20260506_007_loi_signatures.sql
-- Letter of Intent signatures captured during the pilot application flow.
--
-- Design choices:
--   1. Snapshot fields (participant_name, participant_company, fleet_size,
--      loi_full_text) are recorded AT signing time so the row is a complete
--      legal record even if the user later updates their profile or the LOI
--      template changes. The row is immutable after creation.
--   2. No PDF stored in storage. Renders are deterministic from
--      (loi_full_text, signature data) so the user/admin can re-generate the
--      printable view at any time. Saves storage + simplifies retention.
--   3. RLS: users see/sign their own. Admins see all. No update or delete —
--      a signed LOI is a permanent record.
-- ============================================================================

create table if not exists public.loi_signatures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  pilot_application_id uuid references public.pilot_applications(id) on delete set null,

  -- Snapshot fields captured at signing time
  participant_name text not null,
  participant_company text not null,
  participant_title text,
  fleet_size text not null,

  -- Signature
  agreed boolean not null default false,
  initials text not null check (length(initials) between 1 and 8),
  signed_at timestamptz default now() not null,

  -- Audit
  ip_address text,
  user_agent text,

  -- Snapshot of what they agreed to
  loi_version text not null default '1.0',
  loi_full_text text not null,
  performance_fee_min_pct int not null default 15,
  performance_fee_max_pct int not null default 45,

  created_at timestamptz default now() not null,
  -- Hard immutability: refuse any updates by removing all update privilege below.
  constraint loi_must_be_agreed check (agreed = true)
);

create index if not exists loi_signatures_user_idx on public.loi_signatures(user_id);
create index if not exists loi_signatures_pilot_idx on public.loi_signatures(pilot_application_id);

alter table public.loi_signatures enable row level security;

drop policy if exists "Users see own LOI" on public.loi_signatures;
drop policy if exists "Users sign own LOI" on public.loi_signatures;
drop policy if exists "Admins see all LOIs" on public.loi_signatures;

create policy "Users see own LOI" on public.loi_signatures
  for select using (auth.uid() = user_id or public.is_admin());

create policy "Users sign own LOI" on public.loi_signatures
  for insert with check (auth.uid() = user_id);

-- Deliberately no update or delete policy. Once signed, the row is permanent.

-- Convenience: latest signed LOI per user (for the Fleet dashboard "your
-- signed LOI" card and admin pilot detail view).
create or replace view public.user_latest_loi as
  select distinct on (user_id)
    id, user_id, pilot_application_id, participant_name, participant_company,
    fleet_size, signed_at, loi_version
  from public.loi_signatures
  order by user_id, signed_at desc;

grant select on public.user_latest_loi to authenticated;
