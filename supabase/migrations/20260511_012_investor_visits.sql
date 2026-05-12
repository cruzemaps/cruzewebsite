-- ============================================================================
-- 20260511_012_investor_visits.sql
-- Page-level visit log for /investors. Complements investor_leads (which only
-- captures the small fraction of visitors who clear the email gate). Anonymous
-- writes go through a SECURITY DEFINER RPC; only admins can read.
--
-- The client passes a per-tab session_id so we can stitch a later
-- investor_leads submission back to the originating visit, and we never
-- collect PII at this stage — just UA, referrer, path, UTM tags.
--
-- Idempotent. Safe to re-run.
-- ============================================================================

create table if not exists public.investor_visits (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  path text not null,
  referrer text,
  user_agent text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  created_at timestamptz default now()
);

create index if not exists investor_visits_session_idx on public.investor_visits(session_id);
create index if not exists investor_visits_created_at_idx on public.investor_visits(created_at desc);

alter table public.investor_visits enable row level security;

drop policy if exists "Admins read investor visits" on public.investor_visits;
create policy "Admins read investor visits" on public.investor_visits
  for select using (public.is_admin());

-- No insert policy: writes only go through log_investor_visit() RPC.

create or replace function public.log_investor_visit(
  p_session_id text,
  p_path text,
  p_referrer text default null,
  p_user_agent text default null,
  p_utm_source text default null,
  p_utm_medium text default null,
  p_utm_campaign text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_session_id is null or length(p_session_id) = 0 then
    raise exception 'session_id required';
  end if;
  insert into public.investor_visits (
    session_id, path, referrer, user_agent, utm_source, utm_medium, utm_campaign
  ) values (
    p_session_id, p_path, p_referrer, p_user_agent, p_utm_source, p_utm_medium, p_utm_campaign
  );
end;
$$;

grant execute on function public.log_investor_visit(text, text, text, text, text, text, text)
  to anon, authenticated;
