// Request handling for the send-invitation edge function, kept free of network
// and Supabase imports so it can be unit tested with `deno test` (see
// handler.test.ts). index.ts wires in the real database and Resend calls.
//
// Called by the database webhook invite_email_on_insert on public.invitations
// with no auth header, so it runs with verify_jwt off and anyone on the
// internet can POST to it. It therefore trusts only `type`, `table` and
// `record.id` from the payload. The email address, role, token, expiry and
// inviter all come from the invitation row, read back by id with the service
// role.
//   - Only admins can insert invitations (RLS "Admins manage invitations"),
//     and the row's invited_by must still be an admin with an active status,
//     so the function only ever acts for an admin.
//   - Only a row created in the last 10 minutes, not accepted and not expired.
//   - Each invitation is emailed at most once: the key invitations:<id> goes
//     into public.invitation_emails_sent (migration 025) before the email is
//     sent, so a replayed or forged payload sends nothing new.

import { renderInvitationEmail } from "./template.ts";

export const TABLE = "invitations";

// Columns read back. Nothing else from the row is used.
export const COLUMNS = "id, email, role, token, expires_at, accepted_at, invited_by, created_at";

export const FRESH_MS = 10 * 60 * 1000;
export const CREATED_FUTURE_SKEW_MS = 60 * 1000;

export const DEFAULT_FROM = "Cruzemaps <invitations@cruzemaps.com>";
export const DEFAULT_SITE = "https://cruzemaps.com";
export const DEFAULT_INVITER = "An admin at Cruzemaps";

const ROLES = new Set(["admin", "fleet_owner", "city_operator"]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// deno-lint-ignore no-explicit-any
export type Row = Record<string, any>;

export type ClaimResult = "claimed" | "duplicate" | "error";

export interface Email {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text: string;
}

export interface SendResult {
  ok: boolean;
  status: number;
  id?: string;
  text: string;
}

export interface Deps {
  env(name: string): string | undefined;
  now(): Date;
  // Re-read the invitation by id with the service role. `error` is set on a
  // query failure; `row` is null when no row has that id.
  loadRow(id: string): Promise<{ row: Row | null; error?: string }>;
  // The inviter's profile (role, status, first_name, last_name, email), or
  // null when there is none.
  loadProfile(userId: string): Promise<{ profile: Row | null; error?: string }>;
  // Record that `key` was emailed. "duplicate" when it already was.
  claim(key: string): Promise<ClaimResult>;
  sendEmail(apiKey: string, email: Email): Promise<SendResult>;
}

export async function handle(req: Request, deps: Deps): Promise<Response> {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  // deno-lint-ignore no-explicit-any
  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  if (!payload || typeof payload !== "object") return json({ error: "Invalid payload" }, 400);

  if (payload.type !== "INSERT") return json({ skipped: "not an insert" });
  if (payload.table !== TABLE) return json({ skipped: "unknown table" });

  const id = payload.record?.id;
  if (typeof id !== "string" || !UUID_RE.test(id)) {
    return json({ error: "record.id must be a uuid" }, 400);
  }

  // Without Resend the invitation row still stands; the admin copies the link
  // from the Invitations tab. 200 so the webhook does not report an error.
  const apiKey = deps.env("RESEND_API_KEY");
  if (!apiKey) return json({ skipped: "RESEND_API_KEY not configured" });

  const { row, error } = await deps.loadRow(id);
  if (error) {
    console.error(`send-invitation: could not read ${TABLE} ${id}: ${error}`);
    return json({ error: "could not read the row" }, 500);
  }
  if (!row) return json({ skipped: "row not found" });

  const now = deps.now();
  if (!within(row.created_at, now, FRESH_MS, CREATED_FUTURE_SKEW_MS)) {
    return json({ skipped: "row is not new" });
  }
  if (row.accepted_at) return json({ skipped: "already accepted" });
  const expires = typeof row.expires_at === "string" ? Date.parse(row.expires_at) : NaN;
  if (Number.isNaN(expires) || expires <= now.getTime()) return json({ skipped: "expired" });

  const email = typeof row.email === "string" ? row.email.trim() : "";
  if (!email || !email.includes("@")) return json({ skipped: "no recipient email" });
  if (!ROLES.has(row.role)) return json({ skipped: "unknown role" });
  if (typeof row.token !== "string" || !row.token) return json({ skipped: "no token" });

  if (typeof row.invited_by !== "string" || !UUID_RE.test(row.invited_by)) {
    return json({ skipped: "inviter is not an active admin" });
  }
  const inviter = await deps.loadProfile(row.invited_by);
  if (inviter.error) {
    console.error(`send-invitation: could not read the inviter of ${TABLE} ${id}: ${inviter.error}`);
    return json({ error: "could not read the inviter" }, 500);
  }
  if (!isActiveAdmin(inviter.profile)) return json({ skipped: "inviter is not an active admin" });

  const claim = await deps.claim(ledgerKey(row.id));
  if (claim === "duplicate") return json({ skipped: "already emailed" });
  if (claim === "error") return json({ error: "could not record the email" }, 500);

  const site = deps.env("INVITE_BASE_URL") || DEFAULT_SITE;
  const inviterName = displayName(inviter.profile, deps.env("DEFAULT_INVITER_NAME") || DEFAULT_INVITER);
  const mail = renderInvitationEmail({
    email,
    role: row.role,
    inviteUrl: `${site}/invite/${encodeURIComponent(row.token)}`,
    expiresAt: row.expires_at,
    inviterName,
  });

  const res = await deps.sendEmail(apiKey, {
    from: deps.env("INVITE_FROM_ADDRESS") || DEFAULT_FROM,
    to: [email],
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  });
  if (!res.ok) {
    console.error(`send-invitation: Resend ${res.status}: ${res.text.slice(0, 500)}`);
    return json({ error: `Resend ${res.status}` }, 500);
  }
  return json({ ok: true, id: res.id ?? null });
}

export function ledgerKey(id: string): string {
  return `${TABLE}:${id}`;
}

export function isActiveAdmin(profile: Row | null): boolean {
  return !!profile && profile.role === "admin" && profile.status === "active";
}

function displayName(profile: Row | null, fallback: string): string {
  if (!profile) return fallback;
  const full = [profile.first_name, profile.last_name].filter((s) => typeof s === "string" && s.trim()).join(" ").trim();
  if (full) return full;
  if (typeof profile.email === "string" && profile.email.trim()) return profile.email.trim();
  return fallback;
}

// True when `ts` is at most `pastMs` old and at most `futureMs` ahead of now.
export function within(ts: unknown, now: Date, pastMs: number, futureMs: number): boolean {
  if (typeof ts !== "string" || !ts) return false;
  const t = Date.parse(ts);
  if (Number.isNaN(t)) return false;
  const age = now.getTime() - t;
  return age <= pastMs && age >= -futureMs;
}

// The key the function reads rows with: a secret key (sb_secret_...) when one
// is available, else the legacy service_role key. Same rule as send-pilot-email.
export function serviceKey(env: (name: string) => string | undefined): string | undefined {
  const single = env("SUPABASE_SECRET_KEY");
  if (single) return single;
  const all = env("SUPABASE_SECRET_KEYS");
  if (all) {
    try {
      const parsed = JSON.parse(all);
      if (parsed && typeof parsed.default === "string" && parsed.default) return parsed.default;
    } catch {
      // Not JSON: fall through to the legacy key.
    }
  }
  return env("SUPABASE_SERVICE_ROLE_KEY") || undefined;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
