# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager: a `bun.lock` is checked in but the deploy workflow uses `npm ci`. Use `npm` to keep lockfiles consistent unless deliberately switching.

- `npm run dev` — Vite dev server on `http://localhost:8080` (host `::`, see [vite.config.ts](vite.config.ts))
- `npm run build` — production build to `dist/` **plus** `node scripts/prerender.mjs` (per-route HTML emitter + sitemap.xml + robots.txt)
- `npm run build:dev` — build with `mode=development` (used for diagnosing prod-only issues)
- `npm run preview` — serve the built `dist/` locally
- `npm run lint` — flat-config ESLint (`eslint.config.js`); `@typescript-eslint/no-unused-vars` is disabled and `react-refresh/only-export-components` is a warning
- `npm run deploy` — build + push `dist/` to `gh-pages` branch via `gh-pages` package (CI also auto-deploys via `.github/workflows/deploy.yml` on push to `main`)

There is no test runner configured.

## Architecture

This is a **Vite + React 18 + TypeScript SPA** for Cruze (a swarm-intelligence traffic product). It is one client app that serves three audiences via role-gated routes plus public marketing/investor pages.

### Routing & role gating

All routes are declared in [src/App.tsx](src/App.tsx). Three role-gated dashboards sit behind `ProtectedRoute`:

| Role            | Route               | Page                                          |
| --------------- | ------------------- | --------------------------------------------- |
| `city_operator` | `/dashboard`        | [MissionControl](src/pages/MissionControl.tsx) |
| `fleet_owner`   | `/fleet-dashboard`  | [FleetDashboard](src/pages/FleetDashboard.tsx) |
| `admin`         | `/admin`            | [AdminPortal](src/pages/AdminPortal.tsx)       |

[ProtectedRoute](src/components/ProtectedRoute.tsx) resolves the role by querying Supabase `profiles.role` for `user.id`, falling back to `user.user_metadata.role` if the table read fails (so the demo path keeps working before SQL is applied). On role mismatch it redirects to that user's correct dashboard rather than the login screen.

### Auth & demo bypass (important)

Auth is Supabase, wrapped by [useAuth](src/hooks/useAuth.tsx). A **localStorage-based demo bypass** runs *before* the Supabase flow: if `localStorage.demo_role` is set, the provider mints a fake `user`/`session` with that role and skips Supabase entirely. The bypass is set by visiting `/login?demo=admin|fleet_owner|city_operator` (see [Login.tsx](src/pages/Login.tsx)). `signOut` clears `demo_role` for demo users instead of calling Supabase.

When changing auth, dashboard data fetching, or `ProtectedRoute`, preserve the demo path — several dashboards (e.g. [AdminPortal](src/pages/AdminPortal.tsx)) check `localStorage.demo_role` and return mock data instead of hitting Supabase. Breaking either branch breaks the no-backend demo.

### Supabase

- Client in [src/lib/supabase.ts](src/lib/supabase.ts) reads `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` and falls back to placeholder values with a `console.error` warning — the build does not fail without them (this is intentional for the demo).
- Schema lives in [supabase-schema.sql](supabase-schema.sql): `profiles` (id, role ∈ {admin, fleet_owner, city_operator}) auto-populated by an `on_auth_user_created` trigger from `raw_user_meta_data`, and `pilot_applications` for the fleet onboarding flow. RLS is enabled on both — admin reads/updates use a `role = 'admin'` subquery in the policy, so any new admin-touching query must work under those policies.

### UI system

- shadcn/ui — ~49 primitives in [src/components/ui/](src/components/ui/), config in [components.json](components.json), no class prefix. Add new shadcn components via the CLI; don't hand-edit primitives unless intentional.
- Tailwind config in [tailwind.config.ts](tailwind.config.ts). Brand palette is the source of truth for product theming: `brand-orange` `#FF8C00`, `brand-charcoal` `#0B0E14`, `brand-cyan` `#00F2FF`. Display font `Unbounded`, body `Inter`.
- Animations via `framer-motion`. Toasts use both `@/components/ui/toaster` (Radix-style) and `sonner` — they are both mounted at the App root; `sonner` is the one most pages call.

### Feature areas

- **Public marketing** (`/`) — [V2.tsx](src/pages/V2.tsx) composes section components from [src/components/v2/](src/components/v2/) (Hero, SegmentSolutions, CruzeLab, HowItWorks, Comparison, ImpactMap, FinalConversion, plus `NavbarV2`).
- **Investor page** (`/investor`, `/investors`) — [Investors.tsx](src/pages/Investors.tsx) + [InvestorPitchSections](src/components/v2/InvestorPitchSections.tsx).
- **Mission Control** (`/dashboard`) — tabbed UI in [src/components/dashboard/](src/components/dashboard/): `LiveFlowTab`, `MarginalGainsTab`, `FleetHealthTab`.
- **Route Planner** (`/route-planner`) is public.
- **Calculator / map** — [USAMap](src/components/calculator/USAMap.tsx) uses `react-simple-maps` + `topojson-client` + `d3-geo`.

### Path aliases & TS config

- `@/*` resolves to `src/*` in both [vite.config.ts](vite.config.ts) and [tsconfig.json](tsconfig.json). Always use the alias, not relative `../../` paths.
- TypeScript is configured loosely: `strictNullChecks: false`, `noImplicitAny: false`, `noUnusedLocals/Parameters: false`. Don't add fake non-null assertions or `any`-casts to satisfy strictness — it's off on purpose. Don't tighten these flags as a side quest.

### Deployment

Two deploy targets coexist:

- **GitHub Pages** — [.github/workflows/deploy.yml](.github/workflows/deploy.yml) on push to `main`. SPA fallback is implemented via the `<script>` block in [index.html](index.html) that decodes a redirected query string (paired with a `404.html` shim that gets removed/added — recent commits have churned on this; the canonical state is in `index.html`'s redirect block). Custom domain: `cruzemaps.com` (`package.json#homepage`).
- **Cloudflare Workers/Pages** — [wrangler.jsonc](wrangler.jsonc) serves `dist/` with `not_found_handling: "single-page-application"`. Don't reintroduce a `public/_redirects` or `public/404.html` — they cause Cloudflare deploy error 10021 (see commits `559cf97`, `3a2b0e8`).

When changing routing, SPA-fallback assets, or `vite.config.ts#base`, verify both targets — they handle 404s differently.

### SEO & content

- **Per-route SEO** — [src/lib/seo.ts](src/lib/seo.ts) is the single manifest of route metadata + JSON-LD. The `<SEO>` component ([src/components/SEO.tsx](src/components/SEO.tsx)) reads it at runtime via `react-helmet-async`. The post-build script [scripts/prerender.mjs](scripts/prerender.mjs) reads the same manifest and emits per-route `dist/<path>/index.html` files with meta baked in (so crawlers and LLMs see the right `<title>` before JS runs). It also emits `dist/sitemap.xml` and `dist/robots.txt`. **Add a route → add an entry to ROUTES → both runtime and prerender pick it up.**
- **JSON-LD** — Organization on every page, plus per-route schemas (SoftwareApplication on `/`, FAQPage on `/faq`, Product on `/for-fleets`, GovernmentService on `/for-cities`, Article on each `/case-studies/:slug` and `/insights/:slug`).
- **Content stores** — [src/content/caseStudies.ts](src/content/caseStudies.ts) and [src/content/insights.ts](src/content/insights.ts) drive the `/case-studies/[slug]` and `/insights/[slug]` routes. Add an entry to the array → new page exists.
- **Analytics** — [src/lib/analytics.ts](src/lib/analytics.ts) wraps `posthog-js`. Init is no-op without `VITE_POSTHOG_KEY`. Funnel events are typed; add new event names to the `FunnelEvent` union before calling `track()`.
- **Dynamic OG images** — [workers/og-image/](workers/og-image/) is a separate Cloudflare Worker (`workers-og` / satori). Deploy independently; bind to `og.cruzemaps.com`. See [docs/CLOUDFLARE_SETUP.md](docs/CLOUDFLARE_SETUP.md).

### Role-management workflow (database side)

- Migrations live in [supabase/migrations/](supabase/migrations/) and **must be applied in order** (001 fixes the privilege-escalation hole; 002 adds organizations/role_history/invitations + helper functions; 003 installs the JWT custom-claims hook). Setup steps in [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md).
- After migration 003, role/status/organization_id ride on the JWT — [ProtectedRoute.tsx](src/components/ProtectedRoute.tsx) reads them via [useAuth.tsx](src/hooks/useAuth.tsx)'s `readClaims()` instead of querying `profiles` per nav. Falls back to `user_metadata.role` when the auth hook isn't installed yet, so demo + early-stage states still work.
- Admin actions — `change_user_role()`, `accept_invitation()`, `live_impact_stats()`, `is_admin()` are all `SECURITY DEFINER` functions; the React app calls them via `supabase.rpc()`. Don't reach for direct table writes from the client for these flows.
- The admin portal lives in [src/components/admin/](src/components/admin/) (UsersTab / PilotsTab / InvitationsTab / AuditTab) — each is one file, edit in place rather than splitting.

### Known scratch areas

- `scrap/` (`scrap/components/`, `scrap/pages/`) holds legacy code. Not imported by `src/`. Don't edit unless explicitly asked.
- `check_cams.cjs` is a one-off probe script for Austin traffic-cam URLs — unrelated to the app build.
- `public/InteractiveLabV2-old.txt` is archived markup, not served code.
