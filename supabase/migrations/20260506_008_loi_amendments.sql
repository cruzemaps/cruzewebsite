-- ============================================================================
-- 20260506_008_loi_amendments.sql
-- LOI amendments — append-only record of corrections/clarifications applied
-- to a signed LOI WITHOUT mutating the original signature row.
--
-- Why this design:
--   - The signed LOI is immutable (loi_signatures has no UPDATE/DELETE policy
--     and the loi_full_text snapshot preserves the originally agreed text).
--   - But sometimes you need to record a typo fix, an updated fleet count,
--     or a clarification AFTER signing.
--   - An "amendment" is a NEW row referencing the original LOI. The view
--     surfaces both. Nothing in the original is altered. Audit trail
--     remains crystal-clear: original was X, on date Y admin Z updated
--     field A from B to C with reason D.
--
-- RLS:
--   - Admins can insert + select all amendments
--   - Users can select amendments on their own LOIs
--   - Nobody can update or delete (true append-only)
-- ============================================================================

create table if not exists public.loi_amendments (
  id uuid primary key default gen_random_uuid(),
  loi_signature_id uuid references public.loi_signatures(id) on delete cascade not null,

  -- What was changed
  field text not null check (length(field) between 1 and 60),
  previous_value text,
  new_value text not null,
  reason text not null check (length(trim(reason)) >= 5),

  -- Who and when
  amended_by uuid references public.profiles(id) not null,
  amended_at timestamptz default now() not null,

  created_at timestamptz default now() not null
);

create index if not exists loi_amendments_loi_idx on public.loi_amendments(loi_signature_id, amended_at desc);

alter table public.loi_amendments enable row level security;

drop policy if exists "Admins write amendments" on public.loi_amendments;
drop policy if exists "Users read own amendments" on public.loi_amendments;
drop policy if exists "Admins read amendments" on public.loi_amendments;

-- Only admins insert. The check ensures the amender is themselves an admin
-- AND is recording themselves as the amended_by (no spoofing).
create policy "Admins write amendments" on public.loi_amendments
  for insert with check (
    public.is_admin() and amended_by = auth.uid()
  );

-- Admins read all amendments. Users read amendments on LOIs they signed.
create policy "Admins read amendments" on public.loi_amendments
  for select using (public.is_admin());

create policy "Users read own amendments" on public.loi_amendments
  for select using (
    exists (
      select 1 from public.loi_signatures
      where loi_signatures.id = loi_amendments.loi_signature_id
        and loi_signatures.user_id = auth.uid()
    )
  );

-- Deliberately no update/delete policy. Amendments are append-only.

-- Helpful view: per-LOI amendment count for the admin tab.
create or replace view public.loi_amendment_counts as
  select loi_signature_id, count(*)::int as amendment_count, max(amended_at) as last_amended_at
  from public.loi_amendments
  group by loi_signature_id;

grant select on public.loi_amendment_counts to authenticated;
