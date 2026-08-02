# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager: **npm is the source of truth.** `package-lock.json` is committed; `bun.lock` is gitignored (it drifted whenever someone ran `npm install`, and Cloudflare Pages' `bun install --frozen-lockfile` caught the drift — a recurring failure mode). Use `npm` for installs that need to be reproducible. Bun is fine locally if you want install speed; just don't commit `bun.lock`. CF Pages build command should be `npm ci --legacy-peer-deps && npm run build`.

- `npm run dev` — Vite dev server on `http://localhost:8080` (host `::`, see [vite.config.ts](vite.config.ts))
- `npm run build` — production build to `dist/` **plus** `node scripts/prerender.mjs` (per-route HTML emitter + sitemap.xml + robots.txt)
- `npm run build:dev` — build with `mode=development` (used for diagnosing prod-only issues)
- `npm run preview` — serve the built `dist/` locally
- `npm run lint` — flat-config ESLint (`eslint.config.js`); `@typescript-eslint/no-unused-vars` is disabled and `react-refresh/only-export-components` is a warning
- `npm run deploy` — build + push `dist/` to `gh-pages` branch via `gh-pages` package (CI also auto-deploys via `.github/workflows/deploy.yml` on push to `main`)
- `npm test` / `npm run test:watch` — **Vitest** unit suite (config in [vitest.config.ts](vitest.config.ts)). Two flavours: pure-logic `src/lib/*.test.ts` run in a fast Node environment (the default), and React component tests `src/**/*.test.tsx` that opt into jsdom per-file via a `// @vitest-environment jsdom` docblock. `.github/workflows/test.yml` hard-gates `tsc --noEmit` + `npm test` on every PR.

## Architecture

This is a **Vite + React 18 + TypeScript SPA** for Cruze (a swarm-intelligence traffic product). It is one client app that serves three audiences via role-gated routes plus public marketing/investor pages.

### Routing & role gating

All routes are declared in [src/App.tsx](src/App.tsx). Role-gated dashboards sit behind `ProtectedRoute`:

| Role                    | Route               | Page                                          |
| ----------------------- | ------------------- | --------------------------------------------- |
| `city_operator`         | `/dashboard`        | [MissionControl](src/pages/MissionControl.tsx) |
| `fleet_owner`           | `/fleet-dashboard`  | [FleetDashboard](src/pages/FleetDashboard.tsx) |
| `fleet_owner` / `admin` | `/fleet-scores`     | [FleetScores](src/pages/FleetScores.tsx)       |
| `admin`                 | `/admin`            | [AdminPortal](src/pages/AdminPortal.tsx)       |

The homepage `/` is **V3** ([V3.tsx](src/pages/V3.tsx), composed from [src/components/v3/](src/components/v3/)); the previous homepage lives at `/v2` and `/old` ([V2.tsx](src/pages/V2.tsx)), and `/v3` redirects to `/`. Other public routes: `/for-fleets`, `/for-cities`, `/investors` (`/investor` redirects), `/faq`, `/press`, `/stats`, `/insights[/:slug]`, `/cities[/:slug]`, `/lanes[/:slug]`, `/apply`, `/cameras`, `/lab`, `/route-planner`, `/privacy`, `/support`, `/terms` (App Store legal pages), `/login`, `/invite/:token`, `/impersonate`, `/demo`, `/loi/:id`, `/uiinterns`. `/diag` is mounted **only in dev builds** (`import.meta.env.DEV`) — do not make it unconditional; that was a shipped security fix.

[ProtectedRoute](src/components/ProtectedRoute.tsx) takes an `allowedRoles` prop and reads `user`/`role`/`status` from [useAuth](src/hooks/useAuth.tsx) (role rides on the JWT custom claims after migration 003 — see "Role-management workflow"). It is **default-deny**: a null role redirects to `/login?reason=role_unassigned` and deliberately does NOT trust `user_metadata.role` (user-controllable at signup). Suspended/archived users bounce to `/login?reason=account_suspended`. On role mismatch it redirects to that user's correct dashboard rather than the login screen. It also fires the `dashboard_first_view` PostHog activation event once per protected mount.

### Auth & demo bypass (important)

Auth is Supabase, wrapped by [useAuth](src/hooks/useAuth.tsx). A **sessionStorage-based demo bypass** runs *before* the Supabase flow: if `sessionStorage.demo_role` is set, the provider mints a fake `user`/`session` with that role and skips Supabase entirely. The bypass is set by visiting `/login?demo=admin|fleet_owner|city_operator` (see [Login.tsx](src/pages/Login.tsx)). `signOut` clears `demo_role` for demo users instead of calling Supabase.

**Why sessionStorage and not localStorage** — `localStorage` is shared across every tab on the same origin, so an admin visiting the marketing page and clicking "Try Demo" used to overwrite their real admin tab's session. We now use `sessionStorage` (per-tab) for `demo_role` and `demo_status`. Marketing CTAs that activate a demo (`/for-fleets`, `/for-cities`) `window.open(..., "_blank")` so the write only lands in the new tab. Same goes for [admin impersonation](src/components/admin/UsersTab.tsx) — it routes through `/impersonate` in a new tab so the admin's own session is never touched.

When changing auth, dashboard data fetching, or `ProtectedRoute`, preserve the demo path — several dashboards (e.g. [AdminPortal](src/pages/AdminPortal.tsx), [FleetDashboard](src/pages/FleetDashboard.tsx)) check `sessionStorage.demo_role` and return mock data instead of hitting Supabase. Breaking either branch breaks the no-backend demo. Read `demo_role` from `sessionStorage` only — do **not** add a `localStorage` fallback, that's the bug we just removed.

### Supabase

- Client in [src/lib/supabase.ts](src/lib/supabase.ts) reads `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` and falls back to placeholder values with a `console.error` warning — the build does not fail without them (this is intentional for the demo).
- Base schema lives in [supabase-schema.sql](supabase-schema.sql): `profiles` (id, role ∈ {admin, fleet_owner, city_operator}) auto-populated by an `on_auth_user_created` trigger from `raw_user_meta_data`, and `pilot_applications` for the fleet onboarding flow. RLS is enabled on both — admin reads/updates use a `role = 'admin'` subquery in the policy, so any new admin-touching query must work under those policies.
- **Incremental changes go in [supabase/migrations/](supabase/migrations/)** — 15 numbered SQL migrations (security fixes, role management, JWT claims, investor leads/visits, LOI signatures + amendments, pilot-application enhancements, `contact_messages`). Add a new migration file; don't retro-edit `supabase-schema.sql`.
- **Edge functions** in [supabase/functions/](supabase/functions/): `capture-loi-metadata` (guards writes with a timing-safe `x-loi-secret` header check against `LOI_METADATA_SECRET` — path is closed when the secret is unconfigured; keep it that way), `notify-discord`, `send-invitation`, `send-pilot-email`. Preview invitation emails locally with `node scripts/preview-invitation-emails.mjs`.
- **Fleet backend SSO bridge** — [useFleetScores](src/hooks/useFleetScores.ts) exchanges the Supabase session for a CruzePlatform backend session to power `/fleet-scores`. Backend base URL comes from `VITE_CRUZE_API_URL`; production builds **must not** fall back to localhost when it's unset (integration disables itself with a console warning + user-facing error — a shipped security fix, don't reintroduce the fallback).

### UI system

- shadcn/ui — ~49 primitives in [src/components/ui/](src/components/ui/), config in [components.json](components.json), no class prefix. Add new shadcn components via the CLI; don't hand-edit primitives unless intentional.
- Tailwind config in [tailwind.config.ts](tailwind.config.ts). Brand palette is the source of truth for product theming: `brand-orange` `#E8590C`, `brand-charcoal` `#0B0D11`, `brand-cyan` `#00F2FF`. Display font `Unbounded`, body `Inter`. The brand system was aligned to the V3 homepage across the whole site (2026-06-21) — new pages should match V3, not V2.
- Animations via `framer-motion`. Toasts use both `@/components/ui/toaster` (Radix-style) and `sonner` — they are both mounted at the App root; `sonner` is the one most pages call.

### Feature areas

- **Public marketing** (`/`) — [V3.tsx](src/pages/V3.tsx) composes section components from [src/components/v3/](src/components/v3/) (animated jam hero with a road motif threaded through the page, `LiveFeed` resilient live camera, product/driver-app showcase, "The stakes" market-size, "How a pilot works", "Why this is hard to copy" moat section). The old V2 sections remain in [src/components/v2/](src/components/v2/) for `/v2`.
- **Investor page** (`/investors`) — [Investors.tsx](src/pages/Investors.tsx) + [InvestorPitchSections](src/components/v2/InvestorPitchSections.tsx). The tier-3 dataroom gate compares against `VITE_DATAROOM_PASSWORD_HASH` (hashed; PR #36) — never reintroduce a plaintext `VITE_DATAROOM_PASSWORD` in the bundle.
- **LOI flow** — `/loi/:id` ([LOIView.tsx](src/pages/LOIView.tsx)) with signatures/amendments in Supabase and metadata capture via the `capture-loi-metadata` edge function.
- **Press kit** (`/press`) — downloads served from `public/press/`; default OG card is the branded `public/og-image.png`.
- **Mission Control** (`/dashboard`) — tabbed UI in [src/components/dashboard/](src/components/dashboard/): `LiveFlowTab`, `MarginalGainsTab`, `FleetHealthTab`.
- **Fleet driver scores** (`/fleet-scores`) — reads the CruzePlatform backend through the SSO bridge (see Supabase section).
- **Live cameras** (`/cameras`, plus `LiveFeed` on `/` and `InteractiveLabV2` on `/v2`) — HLS playback via `hls.js` **pinned at 1.5.20 with SRI (sha384) + `crossorigin=anonymous`**; never load `hls.js@latest` at runtime (shipped security fix).
- **Route Planner** (`/route-planner`) is public.
- **Calculator / map** — [USAMap](src/components/calculator/USAMap.tsx) uses `react-simple-maps` + `topojson-client` + `d3-geo`.

### Cloudflare Workers (separate deployables)

Two standalone Workers live in [workers/](workers/), each with its own `wrangler.jsonc` and custom domain — deploy with `npx wrangler deploy --config workers/<name>/wrangler.jsonc`; runbooks in [docs/CLOUDFLARE_RUNBOOK.md](docs/CLOUDFLARE_RUNBOOK.md) / [docs/CLOUDFLARE_SETUP.md](docs/CLOUDFLARE_SETUP.md):

- **`workers/frame-analyze`** → `analyze.cruzemaps.com` — Claude vision on traffic-cam frames (details under "SEO & content" below). Guarded by native Cloudflare rate limits (`RL_PER_IP` 8/min, `RL_GLOBAL` 240/min) because the upstream Anthropic call costs money — keep the limiters when touching the config.
- **`workers/og-image`** → `og.cruzemaps.com` — dynamic OG image generation (`workers-og` / satori, `nodejs_compat`).

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
- **JSON-LD** — Organization on every page, plus per-route schemas (SoftwareApplication on `/`, FAQPage on `/faq`, Product on `/for-fleets`, GovernmentService on `/for-cities`, Article + Person baked into each prerendered `/insights/:slug` page — PR #64).
- **Content stores** — [src/content/insights.ts](src/content/insights.ts), [src/content/cities.ts](src/content/cities.ts), and [src/content/lanes.ts](src/content/lanes.ts) drive the `/insights/:slug`, `/cities/:slug`, and `/lanes/:slug` routes. Add an entry to the array → new page exists. The article system + editorial strategy live in [docs/CONTENT-SEO-STRATEGY.md](docs/CONTENT-SEO-STRATEGY.md) — the `/cruze-article` skill follows it; read it before writing insight content by hand.
- **GEO / AI-search** — [public/llms.txt](public/llms.txt) + [public/llms-full.txt](public/llms-full.txt) are maintained for LLM citation. Update them when adding significant pages or changing positioning claims.
- **Analytics** — [src/lib/analytics.ts](src/lib/analytics.ts) wraps `posthog-js`. Init is no-op without `VITE_POSTHOG_KEY`. Funnel events are typed; add new event names to the `FunnelEvent` union before calling `track()`.
- **Dynamic OG images** — [workers/og-image/](workers/og-image/) is a separate Cloudflare Worker (`workers-og` / satori). Deploy independently; bind to `og.cruzemaps.com`. See [docs/CLOUDFLARE_SETUP.md](docs/CLOUDFLARE_SETUP.md).
- **Frame-analyze worker** — [workers/frame-analyze/](workers/frame-analyze/) holds the Anthropic API key as a wrangler secret and calls Claude Haiku 4.5 vision on traffic-cam frames captured by the InteractiveLab modal. The SPA captures one masked frame when the user closes their ROI polygon, POSTs it to the worker, and holds the result for the lifetime of the ROI — no background polling. To get a fresh read the user clears the ROI and redraws. Falls back to the regime simulation on any failure (network, CORS-tainted canvas, worker outage). The key never appears in the client bundle — set it via `wrangler secret put ANTHROPIC_API_KEY` and read in the worker as `env.ANTHROPIC_API_KEY`. Override the URL for dev via `VITE_FRAME_ANALYZE_URL`.

### Role-management workflow (database side)

- Migrations live in [supabase/migrations/](supabase/migrations/) and **must be applied in order** (001 fixes the privilege-escalation hole; 002 adds organizations/role_history/invitations + helper functions; 003 installs the JWT custom-claims hook). Setup steps in [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md).
- After migration 003, role/status/organization_id ride on the JWT — [ProtectedRoute.tsx](src/components/ProtectedRoute.tsx) reads them via [useAuth.tsx](src/hooks/useAuth.tsx)'s `readClaims()` instead of querying `profiles` per nav. Falls back to `user_metadata.role` when the auth hook isn't installed yet, so demo + early-stage states still work.
- Admin actions — `change_user_role()`, `accept_invitation()`, `live_impact_stats()`, `is_admin()` are all `SECURITY DEFINER` functions; the React app calls them via `supabase.rpc()`. Don't reach for direct table writes from the client for these flows.
- The admin portal lives in [src/components/admin/](src/components/admin/) (UsersTab / PilotsTab / InvitationsTab / AuditTab) — each is one file, edit in place rather than splitting.

### CI & security posture

- **Lint + type-check workflow** runs on PRs (PR #21) alongside the Lighthouse workflow ([.github/workflows/lighthouse.yml](.github/workflows/lighthouse.yml), 4 category gates — the `no-pwa` preset is deliberately dropped, PR #66).
- **CSP** is a build-only `<meta http-equiv>` tag injected by a Vite plugin (PR #56) — the dev server (HMR/eval/ws) is unaffected, and `scripts/prerender.mjs` preserves it on every prerendered route. Don't move it to a runtime header without checking both deploy targets.
- **Secret scanning** — a gitleaks workflow runs in CI (PR #56). Wrangler secrets and Supabase keys must never land in source.
- **hls.js CDN fallback** — `/cameras` falls back to the recorded feed when the CDN load fails (PR #65); keep the SRI pin when touching it.

### Known scratch areas

- `check_cams.cjs` is a one-off probe script for Austin traffic-cam URLs — unrelated to the app build.
- `public/InteractiveLabV2-old.txt` is archived markup, not served code.
- (`scrap/` and the superseded case-studies pages were deleted in PR #40 — don't resurrect them.)
