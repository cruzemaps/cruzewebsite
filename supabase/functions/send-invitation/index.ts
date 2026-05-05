// Supabase Edge Function — sends an invitation email via Resend.
//
// Triggered by a Database Webhook on insert into public.invitations.
// Set RESEND_API_KEY and INVITE_BASE_URL secrets in the Supabase dashboard.
//
// To deploy: paste this entire file into the Supabase dashboard's Edge
// Functions editor (function name `send-invitation`) and click Deploy.

// @ts-nocheck — Deno runtime, not Node. The repo's tsconfig doesn't load this file.

import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

interface InvitationRow {
  id: string;
  email: string;
  role: "admin" | "fleet_owner" | "city_operator";
  token: string;
  expires_at: string;
}

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: InvitationRow;
  old_record: InvitationRow | null;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  fleet_owner: "Fleet Operator",
  city_operator: "City / DOT Operator",
};

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const INVITE_BASE_URL = Deno.env.get("INVITE_BASE_URL") || "https://cruzemaps.com";

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
    // Idempotent no-op for other events
    return json({ skipped: true });
  }

  const invite = payload.record;
  const inviteUrl = `${INVITE_BASE_URL}/invite/${invite.token}`;
  const expiresIso = new Date(invite.expires_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const html = `<!DOCTYPE html>
<html lang="en">
  <body style="background:#0B0E14;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:0;">
    <div style="max-width:560px;margin:0 auto;padding:48px 32px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:32px;">
        <span style="display:inline-flex;width:36px;height:36px;border-radius:8px;background:#00F2FF;color:#0B0E14;align-items:center;justify-content:center;font-weight:800;">C</span>
        <span style="font-weight:800;letter-spacing:0.05em;">CRUZE</span>
      </div>
      <h1 style="font-size:28px;line-height:1.2;margin:0 0 16px;">You've been invited to Cruze.</h1>
      <p style="color:rgba(255,255,255,0.7);margin:0 0 24px;line-height:1.5;">
        An admin at Cruze has invited you to join as a <strong style="color:#00F2FF;">${ROLE_LABELS[invite.role] ?? invite.role}</strong>.
        Accept the invitation to activate your account.
      </p>
      <a href="${inviteUrl}" style="display:inline-block;background:#00F2FF;color:#0B0E14;padding:14px 28px;border-radius:9999px;font-weight:700;text-decoration:none;">
        Accept invitation
      </a>
      <p style="color:rgba(255,255,255,0.4);margin:32px 0 0;font-size:13px;line-height:1.5;">
        Or paste this link into your browser:<br>
        <span style="color:#00F2FF;word-break:break-all;">${inviteUrl}</span>
      </p>
      <p style="color:rgba(255,255,255,0.4);margin:24px 0 0;font-size:13px;">
        This invitation expires on <strong>${expiresIso}</strong>. If you weren't expecting this, you can safely ignore the email.
      </p>
      <hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:48px 0 24px;">
      <p style="color:rgba(255,255,255,0.3);font-size:12px;margin:0;">
        Cruze Technologies · Dissolve traffic, not just avoid it.
      </p>
    </div>
  </body>
</html>`;

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Cruze <invitations@cruzemaps.com>",
      to: [invite.email],
      subject: "You've been invited to Cruze",
      html,
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
