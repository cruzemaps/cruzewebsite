// Supabase Edge Function — sends an invitation email via Resend.
//
// Triggered by a Database Webhook on insert into public.invitations.
// Required secrets:
//   RESEND_API_KEY   - your Resend API key
//   INVITE_BASE_URL  - https://cruzemaps.com (defaults if not set)
// Optional secrets:
//   INVITE_FROM_ADDRESS - From: line, defaults to Cruzemaps invitations
//   DEFAULT_INVITER_NAME - shown when an inviter's profile lookup fails;
//                          defaults to "An admin at Cruzemaps".
//
// The function automatically looks up the inviter's name in public.profiles
// using the invitation row's invited_by column. The Supabase platform
// always exposes SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to Edge
// Functions at runtime, so the lookup uses those — no extra secret needed.
//
// To deploy: paste this file + template.ts into the Supabase dashboard's
// Edge Functions editor (function name `send-invitation`) and click Deploy.

// @ts-nocheck — Deno runtime, not Node. The repo's tsconfig doesn't load this file.

import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { renderInvitationEmail } from "./template.ts";

interface InvitationRow {
  id: string;
  email: string;
  role: "admin" | "fleet_owner" | "city_operator";
  token: string;
  expires_at: string;
  invited_by?: string;
}

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: InvitationRow;
  old_record: InvitationRow | null;
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const INVITE_BASE_URL = Deno.env.get("INVITE_BASE_URL") || "https://cruzemaps.com";
  const FROM_ADDRESS = Deno.env.get("INVITE_FROM_ADDRESS") || "Cruzemaps <invitations@cruzemaps.com>";
  const DEFAULT_INVITER = Deno.env.get("DEFAULT_INVITER_NAME") || "An admin at Cruzemaps";

  if (!RESEND_API_KEY) {
    return json({ error: "RESEND_API_KEY not configured" }, 500);
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (payload.type !== "INSERT" || payload.table !== "invitations") {
    return json({ skipped: true });
  }

  const invite = payload.record;
  const inviteUrl = `${INVITE_BASE_URL}/invite/${invite.token}`;

  // Look up the admin who created this invitation so the email can address
  // the recipient by the actual person's name instead of a generic phrase.
  // Falls back to DEFAULT_INVITER on any lookup failure.
  const inviterName = await lookupInviterName(invite.invited_by, DEFAULT_INVITER);

  const { subject, html, text } = renderInvitationEmail({
    email: invite.email,
    role: invite.role,
    inviteUrl,
    expiresAt: invite.expires_at,
    inviterName,
  });

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [invite.email],
      subject,
      html,
      text,
    }),
  });

  if (!resendRes.ok) {
    const errBody = await resendRes.text();
    console.error("Resend error:", errBody);
    return json({ error: `Resend ${resendRes.status}: ${errBody}` }, 500);
  }

  const result = await resendRes.json();
  return json({ ok: true, messageId: result.id, inviter: inviterName });
});

// Look up an admin's display name from their profiles row.
// Returns the fallback if the lookup fails for any reason — we never want
// to block sending the email just because we couldn't get the inviter's name.
async function lookupInviterName(userId: string | undefined, fallback: string): Promise<string> {
  if (!userId) return fallback;

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.warn("SUPABASE_URL or SERVICE_KEY missing; using fallback inviter name");
    return fallback;
  }

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=first_name,last_name,email&limit=1`,
      {
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
      }
    );
    if (!res.ok) {
      console.warn(`Profile lookup HTTP ${res.status}`);
      return fallback;
    }
    const rows = await res.json();
    if (Array.isArray(rows) && rows.length > 0) {
      const r = rows[0];
      const fullName = [r.first_name, r.last_name].filter(Boolean).join(" ").trim();
      if (fullName) return fullName;
      if (r.email) return r.email;
    }
  } catch (e) {
    console.error("Inviter lookup failed:", e);
  }
  return fallback;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
