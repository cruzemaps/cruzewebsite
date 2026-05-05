# Testing session notes

A self-contained brief for a future Claude session that adds the Vitest + Playwright test suite. Paste this entire file as the opening prompt; everything needed to start is inside.

## Goal

Add automated test coverage for Cruze's two highest-risk surfaces:

1. **Role-management correctness**: signup pins to `fleet_owner`, admins can change roles, suspended users can't access dashboards, JWT refreshes after role changes, invitations can't be reused, RLS prevents cross-org reads.
2. **Conversion-funnel paths**: homepage → demo activation works, ROI calculator updates outputs as sliders move, multi-step apply wizard validates and submits, investor email gate captures + unlocks tier 2.

Stretch: SEO regressions (verify each prerendered page has a unique title and canonical), Lighthouse-style assertions, accessibility checks.

## Scope this session should NOT cover

- Visual regression (screenshot diffing). Different problem, different toolchain (Percy/Chromatic).
- Load testing. Different scope.
- Database migration tests beyond the auth/role flows. Those should test schema correctness (e.g., that `change_user_role` enforces reason length), not data shape.

## Stack to use

| Tool | What it covers |
|---|---|
| **Vitest** | Unit tests for pure logic. Runs against the existing Vite config. Fastest feedback. |
| **React Testing Library** | Component-level tests where logic and JSX intersect (forms, multi-step wizards). |
| **Playwright** | End-to-end browser tests. Real authentication, real Supabase, real navigation. |
| **MSW (Mock Service Worker)** | Mocks Supabase's REST API at the network layer for component tests so they don't hit the real backend. |

Don't use Jest. The repo is pure ESM; Jest's CJS roots cause more pain than they're worth.
Don't use Cypress. Playwright has caught up and surpassed for parallel execution and built-in browser support.

## Existing context the test suite must understand

The codebase has a **demo bypass** in [src/hooks/useAuth.tsx](../src/hooks/useAuth.tsx). When `localStorage.demo_role` is set, the auth provider mints a fake user/session without calling Supabase. Tests can use this to skip real auth in component tests, but should NOT use it in E2E auth-flow tests — those need the real Supabase path.

The codebase uses **JWT custom claims** for role/status (set by `custom_access_token_hook` in [supabase/migrations/20260504_003_jwt_claims.sql](../supabase/migrations/20260504_003_jwt_claims.sql)). After a role change, the user's existing JWT still has the OLD role until refresh. Tests should explicitly assert this lag and exercise the sign-out-and-back-in flow that resolves it.

The **prerender script** ([scripts/prerender.mjs](../scripts/prerender.mjs)) emits per-route HTML at build time. SEO regression tests should grep through `dist/` after a build and assert each route file has the expected title from the manifest.

Funnel events from [src/lib/analytics.ts](../src/lib/analytics.ts) should be capturable in tests by spying on PostHog's `capture` method.

## Suggested directory layout

```
tests/
  unit/                          # Vitest, no DOM
    seo.test.ts                  # findRouteMeta, ROUTES manifest validity
    analytics.test.ts            # event-name typing, no-op when key missing
    contentStores.test.ts        # cities/lanes/caseStudies/insights have unique slugs
  components/                    # Vitest + RTL
    SEO.test.tsx                 # injects right meta for /, /for-fleets, etc.
    ApplyWizard.test.tsx         # step validation, submit on final step
    ROICalculator.test.tsx       # sliders update output values
    InvestorTierGate.test.tsx    # email submit unlocks tier 2
    UsersTab.test.tsx            # role-change requires reason ≥ 3 chars
  e2e/                           # Playwright
    auth.spec.ts                 # signup pins to fleet_owner
    role-change.spec.ts          # admin promotes user; user re-auths; sees new dashboard
    invitation.spec.ts           # admin creates invite, recipient accepts, ends up with right role
    apply-funnel.spec.ts         # homepage → /apply → submission; analytics events fired
    rls.spec.ts                  # non-admin user can't query other users' role_history
    seo.spec.ts                  # each route returns unique <title>; sitemap.xml has 32 URLs
fixtures/
  test-users.sql                 # idempotent SQL to create deterministic test users in Supabase
  reset-test-state.sql           # truncate role_history, invitations, pilot_applications for test users
```

## Setup commands the session should run

```bash
# Test deps
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @playwright/test msw

# Playwright browser binaries
npx playwright install chromium firefox webkit

# Add to package.json scripts:
#   "test": "vitest"
#   "test:ui": "vitest --ui"
#   "test:e2e": "playwright test"
#   "test:e2e:ui": "playwright test --ui"
```

## Vitest config

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    globals: true,
  },
});
```

`tests/setup.ts`:

```ts
import "@testing-library/jest-dom";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});
```

## Playwright config

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  reporter: [["html"], ["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:8080",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
  ],
  webServer: process.env.CI
    ? undefined
    : { command: "npm run dev", url: "http://localhost:8080", reuseExistingServer: true, timeout: 30_000 },
});
```

## Test data strategy

Create a separate Supabase project for E2E (or reuse the production project with a `_test` schema). Never run E2E auth tests against your live Supabase — the role-change tests need to be repeatable, which means truncating `role_history` between runs.

Recommended: spin up a free-tier second Supabase project named `cruze-test`, apply all three migrations to it, and set `E2E_SUPABASE_URL` + `E2E_SUPABASE_ANON_KEY` in CI secrets. Run `fixtures/reset-test-state.sql` between runs.

Create three deterministic test users via auth.users seeding:
- `test-admin@cruze.dev` (role admin)
- `test-fleet@cruze.dev` (role fleet_owner)
- `test-city@cruze.dev` (role city_operator)

Bake their UUIDs into a `tests/test-users.ts` constants file so assertions don't have to look them up.

## First test to write (proves the harness works end-to-end)

Start with the SEO regression test because it's purely deterministic and exercises the build pipeline:

```ts
// tests/e2e/seo.spec.ts
import { test, expect } from "@playwright/test";
import { ROUTES } from "../../src/lib/seo";

for (const route of ROUTES) {
  if (route.noindex) continue;
  test(`${route.path} has correct title`, async ({ page }) => {
    await page.goto(route.path);
    await expect(page).toHaveTitle(route.title);
  });
}
```

This single block produces 13+ tests automatically. Run it; if it fails, you know either the dev server isn't running or the helmet integration broke. If it passes, you've validated the test harness against real Helmet output.

## Test priorities (do in this order)

1. SEO regression suite (above) — validates harness, builds confidence
2. Component tests for the apply wizard (most frequently touched, most likely to regress)
3. Component test for the investor email gate
4. E2E auth flow: signup → confirm pinned to fleet_owner
5. E2E role change: admin promotes user → user re-auths → sees admin route
6. E2E invitation: admin creates → user accepts → ends up with the right role
7. E2E suspended-user lockout: admin suspends user → user gets bounced from dashboard
8. RLS test: directly hit `role_history` as a non-admin user, confirm 403
9. Funnel event spy tests: ROI calc, demo activation, application submitted

## CI integration

Add a new GitHub Actions workflow `.github/workflows/test.yml`:

```yaml
name: Test
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]
jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20", cache: "npm" }
      - run: npm ci
      - run: npm run test -- --run
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20", cache: "npm" }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run build
      - run: npm run test:e2e
        env:
          E2E_SUPABASE_URL: ${{ secrets.E2E_SUPABASE_URL }}
          E2E_SUPABASE_ANON_KEY: ${{ secrets.E2E_SUPABASE_ANON_KEY }}
```

Make the existing Lighthouse CI workflow depend on the test workflow passing first, so we don't run Lighthouse against broken builds.

## Definition of done for this session

- [ ] `npm run test` runs and passes locally with at least 25 unit + component tests
- [ ] `npm run test:e2e` runs against a dedicated Supabase test project and passes with at least 8 E2E specs
- [ ] CI runs both on every PR
- [ ] README or CLAUDE.md updated to mention how to run tests
- [ ] Test data fixtures committed; reset script idempotent

## Time estimate

For a Claude session with focused execution: 4-6 hours of model time. The bulk goes to the E2E specs and the Supabase test-project setup. Component tests are fast. Unit tests are trivial.

## Things to be careful about

**Do not commit real API keys to test fixtures.** Even if it's a test project, the anon key still grants RLS-bound access; treat it like a secret.

**Beware async race conditions in role-change E2E**. Supabase's session refresh isn't instantaneous after `change_user_role` is called. Tests that promote a user should explicitly sign out and sign back in (don't rely on `supabase.auth.refreshSession()` to pick up new claims; the auth hook only fires on token issuance).

**Demo bypass cleanup**. Tests that set `localStorage.demo_role` must clean it up in `afterEach` or subsequent tests will leak demo state.

**Playwright + Supabase rate limits**. Supabase has aggressive rate limits on auth endpoints. If running E2E in parallel, either rate-limit the test concurrency to 1 for auth tests, or stub Supabase for component tests and reserve real auth for a smaller E2E surface.

**Test against a real production-mode build for SEO tests.** The dev server doesn't run the prerender script; the SEO regression test must run against `npm run build` output. Use Playwright's `webServer.command: 'npx serve dist'` for the SEO suite specifically.
