-- ============================================================================
-- 20261022_021_revoke_public_execute.sql
--
-- Seventeen SECURITY DEFINER functions in public still had EXECUTE for PUBLIC,
-- the Postgres default for a new function, so every database role inherited
-- them, not only the API roles. A login role made for another service could
-- set request.jwt.claims in its own session, make auth.uid() return any id it
-- chose, and call change_user_role as an admin. Found on 2026-10-22 while the
-- client portal's database role was being created.
--
-- This revokes EXECUTE from PUBLIC on all of them and leaves each one with only
-- the roles the website uses (call sites on main fce4b01):
--
--   anon and authenticated (public pages and RLS):
--     is_admin()                  RLS policies "to public" on contact_messages,
--                                 investor_visits, invitations, loi_amendments,
--                                 loi_signatures and others; src/lib/impersonation.ts,
--                                 src/pages/Diag.tsx
--     live_impact_stats()         src/components/v2/LiveImpactStrip.tsx,
--                                 src/lib/stats.ts, src/pages/Stats.tsx
--     capture_investor_lead (both overloads), log_investor_visit
--                                 src/pages/Investors.tsx (a public page)
--   authenticated only (signed-in pages; the admin functions also check is_admin()):
--     accept_invitation           src/pages/InviteAccept.tsx (raises without a user)
--     archive_loi                 src/pages/LOIView.tsx
--     change_user_role            src/components/admin/UsersTab.tsx, ArchiveLibraryTab.tsx
--     admin_hard_delete_invitation, admin_hard_delete_loi,
--     admin_hard_delete_pilot_application
--                                 src/components/admin/ArchiveLibraryTab.tsx
--     get_pilot_draft, upsert_pilot_draft, delete_pilot_draft
--                                 src/lib/applyDraft.ts (only with a signed-in user)
--     touch_last_active           no caller in the site; it only updates the
--                                 caller's own profile
--   service role only:
--     check_company_status        no caller in the site or the edge functions;
--                                 it tells whoever calls it whether a named
--                                 company is a client, in a pilot or has applied
--   no API role (trigger only):
--     handle_new_user             trigger on_auth_user_created on auth.users.
--                                 Postgres checks EXECUTE on a trigger function
--                                 when the trigger is created, not when it fires.
--
-- Also removes anon from admin_search_companies (no caller; admin only; it had
-- no PUBLIC grant). service_role keeps EXECUTE on every function here (the edge
-- functions run as it).
--
-- A role that is a member of anon or authenticated still gets their grants:
-- give each service its own role, never membership in the API roles.
--
-- Idempotent. Rollback statements are at the end of this file.
-- ============================================================================

-- Public pages and RLS: keep anon and authenticated.
revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

revoke execute on function public.live_impact_stats() from public;
grant execute on function public.live_impact_stats() to anon, authenticated, service_role;

revoke execute on function public.capture_investor_lead(text, text, text, text, text) from public;
grant execute on function public.capture_investor_lead(text, text, text, text, text) to anon, authenticated, service_role;

revoke execute on function public.capture_investor_lead(text, text, text, text) from public;
grant execute on function public.capture_investor_lead(text, text, text, text) to anon, authenticated, service_role;

revoke execute on function public.log_investor_visit(text, text, text, text, text, text, text) from public;
grant execute on function public.log_investor_visit(text, text, text, text, text, text, text) to anon, authenticated, service_role;

-- Signed-in pages: authenticated only.
revoke execute on function public.accept_invitation(text) from public, anon;
grant execute on function public.accept_invitation(text) to authenticated, service_role;

revoke execute on function public.archive_loi(uuid, text) from public, anon;
grant execute on function public.archive_loi(uuid, text) to authenticated, service_role;

revoke execute on function public.change_user_role(uuid, text, text, text) from public, anon;
grant execute on function public.change_user_role(uuid, text, text, text) to authenticated, service_role;

revoke execute on function public.admin_hard_delete_invitation(uuid, text) from public, anon;
grant execute on function public.admin_hard_delete_invitation(uuid, text) to authenticated, service_role;

revoke execute on function public.admin_hard_delete_loi(uuid, text) from public, anon;
grant execute on function public.admin_hard_delete_loi(uuid, text) to authenticated, service_role;

revoke execute on function public.admin_hard_delete_pilot_application(uuid, text) from public, anon;
grant execute on function public.admin_hard_delete_pilot_application(uuid, text) to authenticated, service_role;

revoke execute on function public.get_pilot_draft() from public, anon;
grant execute on function public.get_pilot_draft() to authenticated, service_role;

revoke execute on function public.upsert_pilot_draft(jsonb) from public, anon;
grant execute on function public.upsert_pilot_draft(jsonb) to authenticated, service_role;

revoke execute on function public.delete_pilot_draft() from public, anon;
grant execute on function public.delete_pilot_draft() to authenticated, service_role;

revoke execute on function public.touch_last_active() from public, anon;
grant execute on function public.touch_last_active() to authenticated, service_role;

revoke execute on function public.admin_search_companies(text, real) from public, anon;
grant execute on function public.admin_search_companies(text, real) to authenticated, service_role;

-- Server only.
revoke execute on function public.check_company_status(text) from public, anon, authenticated;
grant execute on function public.check_company_status(text) to service_role;

-- Trigger only.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to service_role;

-- ----------------------------------------------------------------------------
-- Rollback (restores the grants as they were on 2026-10-22 before this file):
--
-- grant execute on function public.is_admin(), public.live_impact_stats(),
--   public.capture_investor_lead(text, text, text, text, text),
--   public.capture_investor_lead(text, text, text, text),
--   public.log_investor_visit(text, text, text, text, text, text, text),
--   public.accept_invitation(text), public.archive_loi(uuid, text),
--   public.change_user_role(uuid, text, text, text),
--   public.admin_hard_delete_invitation(uuid, text),
--   public.admin_hard_delete_loi(uuid, text),
--   public.admin_hard_delete_pilot_application(uuid, text),
--   public.get_pilot_draft(), public.upsert_pilot_draft(jsonb),
--   public.delete_pilot_draft(), public.touch_last_active(),
--   public.check_company_status(text), public.handle_new_user()
--   to public, anon, authenticated;
-- grant execute on function public.admin_search_companies(text, real) to anon;
-- ----------------------------------------------------------------------------
