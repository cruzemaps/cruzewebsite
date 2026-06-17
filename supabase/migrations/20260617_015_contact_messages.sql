-- ============================================================================
-- 20260617_015_contact_messages.sql
-- "Talk to the team" contact form (src/components/v3/ContactForm.tsx).
-- Anonymous visitors submit name/email/organization/message straight from the
-- public site. Unlike investor_leads (which routes through a SECURITY DEFINER
-- RPC), this form does a direct client insert, so we grant a public INSERT
-- policy with no read-back. Admins can read the messages; nobody else can read,
-- update, or delete them.
-- ============================================================================

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  organization text,
  message text not null,
  created_at timestamptz default now()
);

create index if not exists contact_messages_created_at_idx on public.contact_messages(created_at desc);

alter table public.contact_messages enable row level security;

drop policy if exists "Anyone can send a contact message" on public.contact_messages;
drop policy if exists "Admins read contact messages" on public.contact_messages;

-- Public form: anonymous and authenticated visitors may INSERT, nothing else.
-- No SELECT is granted to the inserter, so the row is write-only for the public.
create policy "Anyone can send a contact message" on public.contact_messages
  for insert
  to anon, authenticated
  with check (true);

-- Admins read everything. Consistent with investor_leads / loi_signatures.
create policy "Admins read contact messages" on public.contact_messages
  for select using (public.is_admin());

-- Deliberately no update or delete policy: messages are an append-only inbox.
