// Single source of truth for the client-side demo session (the mock-data
// dashboards engineers use locally, and the admin "view as user" preview built
// on top of it).
//
// The whole thing is DEV-only. Every reader below starts with an
// `import.meta.env.DEV` check, which Vite replaces with the literal `false` in
// a production build, so the minifier drops the storage reads and the key names
// from the shipped bundle. scripts/check-prod-bundle.mjs fails the build if any
// of these keys ever reappear in dist/.
//
// Rules:
//   - Read and write demo state ONLY through this module. Never call
//     sessionStorage.getItem("demo_role") directly; a direct read is not
//     DEV-gated and would ship to production.
//   - sessionStorage only (per-tab). Never localStorage: it is shared across
//     tabs and used to bleed a demo or impersonation session into an admin's
//     real tab.
//   - Demo state never carries Supabase credentials. Demo dashboards render
//     mock data; any real query still runs under the browser's real Supabase
//     session and its RLS policies.
import type { AppRole } from "@/hooks/useAuth";

export type DemoStatus = "pending" | "active" | "suspended" | "archived" | string;

const KEY_ROLE = "demo_role";
const KEY_STATUS = "demo_status";
const KEY_IMPERSONATED = "impersonated_user_id";

const VALID_ROLES: ReadonlySet<string> = new Set(["admin", "fleet_owner", "city_operator"]);

function read(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

/** True only in a Vite dev build. Production builds compile this to false. */
export function demoModeEnabled(): boolean {
  return import.meta.env.DEV === true;
}

/** The demo role for this tab, or null. Always null in production. */
export function getDemoRole(): AppRole | null {
  if (!import.meta.env.DEV) return null;
  const role = read(KEY_ROLE);
  return role && VALID_ROLES.has(role) ? (role as AppRole) : null;
}

export function isDemoSession(): boolean {
  return getDemoRole() !== null;
}

/** The pilot status to preview in a demo session. Always null in production. */
export function getDemoStatus(): DemoStatus | null {
  if (!import.meta.env.DEV) return null;
  return read(KEY_STATUS);
}

/** Target user id while an admin is previewing as that user. Always null in production. */
export function getImpersonatedUserId(): string | null {
  if (!import.meta.env.DEV) return null;
  return read(KEY_IMPERSONATED);
}

/** Start a demo session in this tab. No-op in production. */
export function setDemoSession(role: AppRole, opts: { status?: string | null; impersonatedUserId?: string | null } = {}): void {
  if (!import.meta.env.DEV) return;
  if (!VALID_ROLES.has(role)) return;
  try {
    sessionStorage.setItem(KEY_ROLE, role);
    if (opts.status) sessionStorage.setItem(KEY_STATUS, opts.status);
    else sessionStorage.removeItem(KEY_STATUS);
    if (opts.impersonatedUserId) sessionStorage.setItem(KEY_IMPERSONATED, opts.impersonatedUserId);
    else sessionStorage.removeItem(KEY_IMPERSONATED);
  } catch {
    /* storage unavailable: no demo session */
  }
}

/** Clear any demo or impersonation state in this tab. */
export function clearDemoSession(): void {
  if (!import.meta.env.DEV) return;
  try {
    sessionStorage.removeItem(KEY_ROLE);
    sessionStorage.removeItem(KEY_STATUS);
    sessionStorage.removeItem(KEY_IMPERSONATED);
  } catch {
    /* nothing to clear */
  }
}
