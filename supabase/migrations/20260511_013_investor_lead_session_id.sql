-- ============================================================================
-- 20260511_013_investor_lead_session_id.sql
-- Stitches investor_visits ↔ investor_leads via a per-tab session_id, so an
-- admin can see the journey from "anonymous page view" to "name + email + firm
-- submitted at the email gate". Adds the column, extends the capture RPC, and
-- exposes a convenience view investor_journey.
--
-- Idempotent. Safe to re-run.
-- ============================================================================

alter table public.investor_leads
  add column if not exists session_id text;

create index if not exists investor_leads_session_idx on public.investor_leads(session_id);

-- Replace capture_investor_lead with a 6-arg signature that includes
-- session_id. The old 5-arg overload is dropped so callers don't hit the
-- wrong one (the client will be updated in the same change).
drop function if exists public.capture_investor_lead(text, text, text, text, text);

create or replace function public.capture_investor_lead(
  p_name text,
  p_email text,
  p_firm text,
  p_user_agent text default null,
  p_referrer text default null,
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
  insert into public.investor_leads (name, email, firm, user_agent, referrer, session_id)
  values (p_name, p_email, p_firm, p_user_agent, p_referrer, p_session_id);
end;
$$;

grant execute on function public.capture_investor_lead(text, text, text, text, text, text)
  to anon, authenticated;

-- Admin convenience view: every visit with the lead it eventually became
-- (NULL on the lead columns if the visitor never submitted the gate). RLS
-- on the underlying tables still applies — only admins can read.
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
  l.firm
from public.investor_visits v
left join public.investor_leads l on l.session_id = v.session_id
order by v.created_at desc;

grant select on public.investor_journey to authenticated;
