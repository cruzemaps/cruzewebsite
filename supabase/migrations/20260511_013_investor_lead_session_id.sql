-- ============================================================================
-- 20260511_013_investor_lead_session_id.sql
-- Stitches investor_visits ↔ investor_leads via a per-tab session_id, so an
-- admin can trace anonymous visit → identified submission.
--
-- Real prod schema for investor_leads (does NOT match migration 006's
-- declared schema — that migration appears to have been superseded by hand):
--   id, email, name, company, source, created_at
--
-- This migration:
--   1. Adds session_id to investor_leads.
--   2. Rewrites capture_investor_lead with the smaller, matching arg list
--      (name, email, company, source, session_id). Drops the old signatures
--      so a stale overload can't resolve.
--   3. Exposes investor_journey view (visits LEFT JOIN leads on session_id).
--
-- UA + referrer live on the visits table only — duplicating them on leads
-- adds nothing once the join exists.
--
-- Idempotent. Safe to re-run.
-- ============================================================================

alter table public.investor_leads
  add column if not exists session_id text;

create index if not exists investor_leads_session_idx on public.investor_leads(session_id);

-- Drop any prior signature so the new one is unambiguous.
drop function if exists public.capture_investor_lead(text, text, text, text, text);
drop function if exists public.capture_investor_lead(text, text, text, text, text, text);

create or replace function public.capture_investor_lead(
  p_name text,
  p_email text,
  p_company text,
  p_source text default null,
  p_session_id text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_email is null or p_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid email';
  end if;
  insert into public.investor_leads (name, email, company, source, session_id)
  values (p_name, p_email, p_company, p_source, p_session_id);
end;
$$;

grant execute on function public.capture_investor_lead(text, text, text, text, text)
  to anon, authenticated;

create or replace view public.investor_journey as
select
  v.id              as visit_id,
  v.created_at      as visited_at,
  v.session_id,
  v.path,
  v.referrer,
  v.user_agent,
  v.utm_source,
  v.utm_medium,
  v.utm_campaign,
  l.id              as lead_id,
  l.created_at      as submitted_at,
  l.name,
  l.email,
  l.company,
  l.source
from public.investor_visits v
left join public.investor_leads l on l.session_id = v.session_id
order by v.created_at desc;

grant select on public.investor_journey to authenticated;
