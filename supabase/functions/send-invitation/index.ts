// Supabase Edge Function — sends an invitation email via Resend.
//
// Triggered by a Database Webhook on insert into public.invitations.
// Set RESEND_API_KEY and INVITE_BASE_URL secrets in the Supabase dashboard.
//
// To deploy: paste the entire contents of THIS file plus template.ts into
// the Supabase dashboard's Edge Functions editor (function name
// `send-invitation`) and click Deploy. The Supabase editor supports
// multiple files in one function — paste template.ts as a sibling file.
//
// To change the email design, edit template.ts (subject, copy, layout,
// role-specific bullets). This file just handles plumbing.

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
  const FROM_ADDRESS = Deno.env.get("INVITE_FROM_ADDRESS") || "Cruze <invitations@cruzemaps.com>";

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

  const { subject, html, text } = renderInvitationEmail({
    email: invite.email,
    role: invite.role,
    inviteUrl,
    expiresAt: invite.expires_at,
    // inviterName is optional; could be looked up from invite.invited_by → profiles
    // table, but that requires service-role auth in the function. Skipping for now.
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
  return json({ ok: true, messageId: result.id });
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
