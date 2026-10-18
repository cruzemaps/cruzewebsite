// Admin "view as user" handoff. DEV builds only: the preview renders the
// dashboards' mock-data demo session (see demoMode.ts), which never ships to
// production, so production has no impersonation path at all.
//
// The browser never decides who is an admin. The handoff calls the
// start_impersonation RPC (migration 017), which runs on the server with the
// caller's real Supabase JWT, checks public.is_admin(), writes the audit row
// to role_history, and returns the target's role and status. Only after that
// succeeds does this tab enter the preview, using the role the server
// returned, not anything from the URL.
import type { AppRole } from "@/hooks/useAuth";
import { demoModeEnabled, setDemoSession } from "@/lib/demoMode";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ROLES: ReadonlySet<string> = new Set(["admin", "fleet_owner", "city_operator"]);

export type RpcResult = { data: unknown; error: { message: string } | null };
export type StartImpersonationRpc = (
  fn: "start_impersonation",
  args: { target_user_id: string },
) => PromiseLike<RpcResult>;

export type HandoffOutcome =
  | { kind: "redirect"; to: string }
  | { kind: "denied"; reason: string };

function dashboardFor(role: AppRole): string {
  if (role === "admin") return "/admin";
  if (role === "city_operator") return "/dashboard";
  return "/fleet-dashboard";
}

/** Build the URL the admin portal opens in a new tab. */
export function impersonationUrl(targetUserId: string): string {
  return `/impersonate?id=${encodeURIComponent(targetUserId)}`;
}

/**
 * Run the handoff for a `/impersonate?id=<uuid>` URL. Writes the preview
 * session into this tab's sessionStorage only when the server accepted the
 * caller as an admin and recorded the audit row.
 */
export async function beginImpersonation(search: string, rpc: StartImpersonationRpc): Promise<HandoffOutcome> {
  if (!demoModeEnabled()) return { kind: "redirect", to: "/" };

  const id = new URLSearchParams(search).get("id") ?? "";
  if (!UUID_RE.test(id)) return { kind: "redirect", to: "/admin" };

  let result: RpcResult;
  try {
    result = await rpc("start_impersonation", { target_user_id: id });
  } catch {
    return { kind: "denied", reason: "The server could not be reached." };
  }
  if (result.error) return { kind: "denied", reason: result.error.message };

  const row = (Array.isArray(result.data) ? result.data[0] : result.data) as
    | { role?: string; status?: string }
    | null
    | undefined;
  const role = row?.role;
  if (!role || !ROLES.has(role)) return { kind: "denied", reason: "The server returned no role for this user." };

  setDemoSession(role as AppRole, { status: row?.status ?? "active", impersonatedUserId: id });
  return { kind: "redirect", to: dashboardFor(role as AppRole) };
}
