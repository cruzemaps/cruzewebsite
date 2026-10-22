-- ============================================================================
-- 20261022_025_staff_messages_invite_ledger.sql
--
-- Two findings from the 2026-10-22 pilot report, and the ledger the new
-- send-invitation needs.
--
--   1. pilot_applications: applicants insert only the columns the /apply
--      wizard sends (src/lib/pilotApplication.ts, pilotInsertFromWizard).
--      authenticated held table-wide INSERT, so an applicant could set
--      fleet_visible_message, which a later bulk status change emailed under
--      "Message from Cruze", and also reviewed_by, reviewed_at, notes and
--      organization_id. Column grants, as 016, 020 and 022 guard columns.
--      anon loses INSERT (it never had an insert policy). UPDATE is unchanged:
--      only admins can update (policy "Admins can update applications").
--   2. Clears fleet_visible_message on rows whose reviewed_by is not an admin.
--      The admin portal sets reviewed_by when a staff member saves the
--      message, so such text was typed by the applicant, not by Cruze.
--      send-pilot-email now also sends the message only when reviewed_by is
--      set (supabase/functions/send-pilot-email/handler.ts, staffMessage).
--   3. public.invitation_emails_sent: one row per invitation emailed, written
--      by send-invitation with the service role before it sends, so a
--      replayed or forged webhook payload never sends twice. Keys are
--      invitations:<id>. No access for anon or authenticated. Seeded with the
--      existing invitations, which the old function already emailed.
--   4. set_loi_signature_metadata keeps EXECUTE for authenticated and
--      service_role only. 019 already revoked PUBLIC and anon and 021 left it
--      alone; restated here so the null-uid (service role) branch stays out
--      of anon's reach whatever order the files are applied in.
--
-- Apply this file first, then deploy send-invitation (it needs the ledger,
-- and without it sends nothing), send-pilot-email and capture-loi-metadata.
-- The old functions keep working with this file applied.
--
-- Idempotent: safe to run more than once.
-- Test: supabase/tests/025_staff_messages_invite_ledger.test.sql
-- ============================================================================

-- (1) Applicants insert the wizard's columns only.
revoke insert on public.pilot_applications from anon, authenticated;
grant insert (
  user_id, company_name, truck_size, fleet_size, website, primary_lanes,
  fms_provider, fms_other, contact_name, contact_email, contact_phone,
  contact_title, application_notes, status
) on public.pilot_applications to authenticated;

-- (2) Messages no staff member saved. Runs as the migration's owner, so RLS
-- and the grants above do not apply.
do $$
declare
  v_rows bigint;
begin
  update public.pilot_applications p
     set fleet_visible_message = null
   where p.fleet_visible_message is not null
     and not exists (
       select 1 from public.profiles r where r.id = p.reviewed_by and r.role = 'admin'
     );
  get diagnostics v_rows = row_count;
  if v_rows > 0 then
    raise notice '025: cleared fleet_visible_message on % application(s) that no admin had saved', v_rows;
  end if;
end $$;

-- (3) Sent-email ledger for send-invitation, as pilot_email_notifications_sent
-- (024) is for send-pilot-email.
do $$
begin
  if to_regclass('public.invitation_emails_sent') is not null then
    return;
  end if;

  create table public.invitation_emails_sent (
    key text primary key check (char_length(key) <= 200),
    sent_at timestamptz not null default now()
  );

  insert into public.invitation_emails_sent (key)
  select 'invitations:' || i.id from public.invitations i
  on conflict (key) do nothing;
end $$;

alter table public.invitation_emails_sent enable row level security;
revoke all on public.invitation_emails_sent from anon, authenticated;
grant select, insert on public.invitation_emails_sent to service_role;

-- (4) LOI metadata writes: signed-in callers and the service role only.
revoke execute on function public.set_loi_signature_metadata(uuid, text, text) from public, anon;
grant execute on function public.set_loi_signature_metadata(uuid, text, text) to authenticated, service_role;

notify pgrst, 'reload schema';

-- ----------------------------------------------------------------------------
-- Verify on live after applying (SQL editor), read-only:
--   select
--     has_table_privilege('authenticated', 'public.pilot_applications', 'insert') as table_insert,
--     has_column_privilege('authenticated', 'public.pilot_applications', 'fleet_visible_message', 'insert') as message_insert,
--     has_column_privilege('authenticated', 'public.pilot_applications', 'reviewed_by', 'insert') as reviewed_by_insert,
--     has_column_privilege('authenticated', 'public.pilot_applications', 'company_name', 'insert') as company_insert,
--     has_table_privilege('anon', 'public.pilot_applications', 'insert') as anon_insert,
--     has_column_privilege('authenticated', 'public.pilot_applications', 'fleet_visible_message', 'update') as message_update,
--     (select count(*) from public.pilot_applications p where p.fleet_visible_message is not null
--        and not exists (select 1 from public.profiles r where r.id = p.reviewed_by and r.role = 'admin')) as unsaved_messages,
--     to_regclass('public.invitation_emails_sent') is not null as ledger_exists,
--     has_table_privilege('authenticated', 'public.invitation_emails_sent', 'select') as clients_read_ledger,
--     has_function_privilege('anon', 'public.set_loi_signature_metadata(uuid, text, text)', 'execute') as anon_loi_metadata;
--   -> false, false, false, true, false, true, 0, true, false, false
--
-- Rollback, by hand and in one transaction (not recommended: it reopens the
-- finding). The cleared messages are not restored; read them first with
--   select id, fleet_visible_message, reviewed_by from public.pilot_applications
--    where fleet_visible_message is not null;
-- if you may want them back.
--   grant insert on public.pilot_applications to authenticated;
--   drop table public.invitation_emails_sent;   -- only after redeploying the
--                                                 -- send-invitation from before 025
-- ============================================================================
