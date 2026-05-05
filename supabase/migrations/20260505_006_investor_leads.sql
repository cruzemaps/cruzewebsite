-- ============================================================================
-- 20260505_006_investor_leads.sql
-- Lead-capture table for the investor email gate. The previous flow tried to
-- write to public.invitations from the client, which the new RLS policies
-- rightly deny (only admins can insert invitations). Now anonymous visitors
-- submit name/email/firm via a SECURITY DEFINER RPC that lands the row in
-- a dedicated table. Admins can read it; nobody else can read or modify.
-- ============================================================================

create table if not exists public.investor_leads (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text not null,
  firm text,
  user_agent text,
  referrer text,
  created_at timestamptz default now()
);

create index if not exists investor_leads_email_idx on public.investor_leads(email);
create index if not exists investor_leads_created_at_idx on public.investor_leads(created_at desc);

alter table public.investor_leads enable row level security;

drop policy if exists "Admins read investor leads" on public.investor_leads;
create policy "Admins read investor leads" on public.investor_leads
  for select using (public.is_admin());

-- No insert policy: writes only go through capture_investor_lead() RPC.

create or replace function public.capture_investor_lead(
  p_name text,
  p_email text,
  p_firm text,
  p_user_agent text default null,
  p_referrer text default null
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
  insert into public.investor_leads (name, email, firm, user_agent, referrer)
  values (p_name, p_email, p_firm, p_user_agent, p_referrer);
end;
$$;

grant execute on function public.capture_investor_lead(text, text, text, text, text) to anon, authenticated;
