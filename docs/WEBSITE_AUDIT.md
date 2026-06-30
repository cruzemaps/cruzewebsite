# Cruze website audit

**Date:** May 2026  
**Scope:** Full-site read-only review (marketing, auth, dashboards, admin, Supabase integrations).  
**Status:** Findings only — no fixes applied in this doc.

Use this as a comeback checklist. Pilot apply/LOI work (migration `014`, `send-pilot-email`, fleet dashboard stages) is assumed deployed separately.

---

## Critical (broken or misleading)

### 1. Case studies are built but not routable

- **Files:** `src/pages/CaseStudies.tsx`, `src/pages/CaseStudyDetail.tsx`, `src/content/caseStudies.ts`
- **Problem:** `App.tsx` has **no routes** for `/case-studies` or `/case-studies/:slug`. Links and docs assume they exist; visitors get **404**.
- **Also missing:** entries in `src/lib/seo.ts` and prerender (`scripts/prerender.mjs`) for case study slugs.
- **Fix:** Register routes in `App.tsx`, add SEO + prerender, link from footer or For Fleets.

### 2. Press kit downloads 404

- **Page:** `/press` (`src/pages/Press.tsx`)
- **Problem:** Links point to `/press/cruze-brand-assets.zip`, PDFs, etc. Files are not in `public/` or Supabase Storage yet (`docs/TEAM_TASKS.md` Priority 1).
- **Fix:** Upload to Supabase `press` bucket (see `docs/SUPABASE_SETUP.md`) or `public/press/`, then update hrefs.

### 3. `/stats` can show fake “live” numbers

- **Page:** `src/pages/Stats.tsx`
- **Problem:** If RPC `live_impact_stats()` fails, UI silently uses `{ active_pilots: 12, total_fleets: 47, total_cities: 4 }` while still showing a **“Live”** pulsing badge.
- **Fix:** Show unavailable state, hide live badge on fallback, or fail closed.

### 4. Homepage JSON-LD `aggregateRating`

- **File:** `src/lib/seo.ts` — `SoftwareApplication` on `/` includes `aggregateRating` (4.8 / 127 reviews).
- **Problem:** Risky if not backed by real verifiable reviews (Google rich-result / trust policies).
- **Fix:** Remove until real, or replace with non-rating schema.

---

## Security & access

### 5. `/diag` is public

- **Page:** `src/pages/Diag.tsx` — no `ProtectedRoute`
- **Problem:** Anyone can run RLS/admin diagnostic checks and inspect JWT/profile details.
- **Fix:** Admin-only, `noindex` + block in production, or remove route.

### 6. `/uiinterns` is public

- **Route:** `App.tsx` → `/uiinterns`
- **Problem:** Internal-looking page with no auth; not marked noindex in SEO manifest.
- **Fix:** Gate or noindex; remove from production if unused.

### 7. `/lab` is public (noindex only)

- **Route:** `/lab` — SEO has `noindex`; still reachable by URL.
- **Fix:** Acceptable for internal CV testing; gate if needed.

### 8. City operator self-signup vs database

- **UI:** `Login.tsx` signup offers **City Operator**
- **DB:** Migration `001` forces new signups to `role = fleet_owner`; `requested_role` stores intent
- **Problem:** City signups land on **fleet dashboard** until admin promotes — confusing for DOT prospects.
- **Fix:** Copy (“city access is invite-only”), hide city self-signup, or dedicated pending state + messaging.

### 9. Two meanings of “archived”

| Layer | Effect |
|--------|--------|
| `profiles.status = archived` | Locked out at login (`ProtectedRoute`) |
| `pilot_applications.status = archived` | Application closed; user can still log in |

- **Fix:** Different labels in UI/support docs (e.g. “account suspended” vs “application closed”).

---

## Product truth (mock / “coming soon”)

### 10. City Mission Control is largely simulated

- **File:** `src/components/dashboard/LiveFlowTab.tsx` — hardcoded map nodes + scripted logs
- **Fix:** Banner: “Illustrative demo data” unless wired to real telemetry.

### 11. Fleet “active” pilot — no real metrics UI

- Fleet dashboard honest copy exists (“coming soon”); still no live metrics — align sales/demo language.

### 12. Production demo via `/demo`

- **Route:** `/demo?role=fleet_owner|city_operator` (`DemoHandoff.tsx`)
- Sets `sessionStorage.demo_role` → mock data in that tab. Good for sales; label in demos.

### 13. Admin demo counts

- When `demo_role` is set, `AdminPortal` shows fake counts — low risk if demo URL isn’t publicized.

---

## Funnel & navigation

### 14. For Fleets “Apply” → login, not apply wizard

- **File:** `src/pages/ForFleets.tsx` — `handleApply` → `/login?role=fleet_owner` **without** `apply=1`
- **Navbar:** “Start the Pilot” correctly goes to `/apply`
- **Fix:** Point fleet CTAs to `/apply` or `/login?role=fleet_owner&apply=1`

### 15. Footer gaps

- No **Case Studies** link (and routes missing anyway)
- **LinkedIn** footer: `https://linkedin.com` — not company page
- Apply is under Product — OK

### 16. No Privacy / Terms pages

- LOI covers pilot terms; no site-wide Privacy Policy or Terms of Service routes
- **Fix:** Footer legal links when ready

---

## Backend & ops (site-adjacent)

### 17. Invitation emails may still be manual

- `send-invitation` exists in repo; setup doc says copy-link until Resend DB webhook is wired (`docs/SUPABASE_SETUP.md` §6).

### 18. `capture-loi-metadata` Edge Function

- Called from `/apply` after LOI sign for IP + user agent
- Deploy separately from `send-pilot-email` if not done yet

### 19. Duplicate Postgres `capture_investor_lead`

- Dashboard shows two function signatures — migration drift; consolidate when touching SQL

### 20. Build-time env vars

Required on Cloudflare / GitHub Actions (see `.github/workflows/deploy.yml`):

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase client |
| `VITE_SUPABASE_ANON_KEY` | Supabase client |
| `VITE_POSTHOG_KEY` | Analytics (optional) |
| `VITE_DATAROOM_PASSWORD_HASH` | Investors tier 3 (hex SHA-256; plaintext `VITE_DATAROOM_PASSWORD` is a legacy fallback) |
| `VITE_DATAROOM_URL` | Investors dataroom |
| `VITE_CALCOM_USER` | Investors scheduling embed |

Missing Supabase vars → placeholder client + console error; features degrade silently.

---

## Content & SEO

### 21. Case studies + prerender

After adding routes, extend `prerender.mjs` / `seo.ts` for dynamic slugs from `caseStudies.ts` (same pattern as insights/cities).

### 22. Starter content

- `docs/TEAM_TASKS.md`: 2 starter case studies, 2 insights — expand over time
- Insights in nav; case studies invisible until routes exist

### 23. Organization schema `sameAs: []`

- Empty in `seo.ts` — add X/LinkedIn when ready

### 24. Contact emails

- `hello@cruzemaps.com`, `press@cruzemaps.com`, invitation from addresses in edge functions — consider one contact page

---

## UX polish (lower priority)

| Item | Note |
|------|------|
| Login copy | “Register Network Node” — on-brand; may feel odd to enterprise buyers |
| OAuth | Google SSO on sign-in only, not signup |
| Apply contact email | Stored in DB; confirm screen could echo address used |
| Stats CO₂ | `active_pilots * 18` — illustrative; methodology footnote exists |
| Cameras / Route planner | External/simulated — set expectations on page |
| Investors dataroom | Placeholder if `VITE_DATAROOM_*` unset |
| `OWNER_EMAIL` in Investors.tsx | Hardcoded for visit-log skip |
| Tests | No test runner in repo (`CLAUDE.md`) |

---

## What’s in good shape

- Role-gated dashboards (`ProtectedRoute`, JWT `app_role` / `app_status`, no trusting `user_metadata` for authorization)
- Pilot apply + LOI + admin lifecycle (structured fields, emails, fleet stage UI)
- SEO architecture (`seo.ts`, prerender, sitemap) for most marketing routes
- Investor funnel (visit logging, email gate, optional dataroom)
- Demo isolation (`sessionStorage`, `/demo` in new tab, dev-only admin demo on login)
- Admin portal (users, pilots, LOIs, archive, audit, invitations)

---

## Suggested priority order

| Priority | Item | Effort |
|----------|------|--------|
| **P0** | Wire `/case-studies` routes + footer link | Small |
| **P0** | Press kit files or disable broken downloads | Content |
| **P0** | `/stats` — don’t present fallback as live | Small |
| **P1** | For Fleets CTAs → `/apply` | Tiny |
| **P1** | Gate or noindex `/diag` | Small |
| **P1** | City signup copy / invite-only flow | Small–medium |
| **P1** | Remove or justify `aggregateRating` in schema | Tiny |
| **P2** | Privacy + Terms pages | Content |
| **P2** | Mission Control “demo data” banner | Small |
| **P2** | Wire `send-invitation` webhook | Ops |
| **P2** | Deploy `capture-loi-metadata` | Ops |
| **P3** | Real case studies / insights (`docs/TEAM_TASKS.md`) | Ongoing |
| **P3** | Footer LinkedIn URL, `sameAs` in schema | Tiny |

---

## Related docs

- `docs/TEAM_TASKS.md` — content tasks (press kit, case studies, insights)
- `docs/SUPABASE_SETUP.md` — migrations, edge functions, webhooks
- `docs/SUPABASE_RUNBOOK.md` — click-by-click Supabase setup
- `CLAUDE.md` — repo conventions, routing, auth, deploy targets

---

## Pilot stack checklist (already done on your side)

- [ ] Migration `20260518_014_pilot_application_enhancements.sql`
- [ ] Edge Function `send-pilot-email` (+ `template.ts`)
- [ ] Secrets: `RESEND_API_KEY`, `SITE_BASE_URL`, optional `PILOT_FROM_ADDRESS`
- [ ] DB webhooks: `pilot_applications` INSERT + UPDATE → `send-pilot-email`
- [ ] Edge Function `capture-loi-metadata` (optional)
- [ ] Frontend deployed from `main` with `VITE_SUPABASE_*`

Test later: apply → confirmation email; admin status change → status email; fleet dashboard stages.
