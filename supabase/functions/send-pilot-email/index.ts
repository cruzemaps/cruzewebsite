// Supabase Edge Function — transactional emails for fleet pilot applications.
//
// Wire Database Webhooks:
//   1. pilot_applications INSERT  → confirmation email
//   2. pilot_applications UPDATE  → status-change email (when status column changes)
//
// Secrets: RESEND_API_KEY, PILOT_FROM_ADDRESS (optional), SITE_BASE_URL (optional)

// @ts-nocheck

import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { renderPilotSubmittedEmail, renderPilotStatusEmail } from "./template.ts";

interface PilotRow {
  id: string;
  user_id: string;
  company_name: string | null;
  contact_email: string | null;
  status: string;
  fleet_visible_message: string | null;
}

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: PilotRow;
  old_record: PilotRow | null;
}

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const FROM =
    Deno.env.get("PILOT_FROM_ADDRESS") || "Cruzemaps <hello@cruzemaps.com>";
  const BASE = Deno.env.get("SITE_BASE_URL") || "https://cruzemaps.com";

  if (!RESEND_API_KEY) {
    return json({ skipped: "RESEND_API_KEY not configured" });
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (payload.table !== "pilot_applications") {
    return json({ skipped: `table ${payload.table}` });
  }

  const row = payload.record;
  const email = await resolveRecipientEmail(row);
  if (!email) {
    return json({ skipped: "no recipient email" });
  }

  const dashboardUrl = `${BASE}/fleet-dashboard`;
  let mail: { subject: string; html: string; text: string };

  if (payload.type === "INSERT") {
    mail = renderPilotSubmittedEmail({
      email,
      companyName: row.company_name || "your fleet",
      dashboardUrl,
    });
  } else if (payload.type === "UPDATE") {
    const oldStatus = payload.old_record?.status;
    if (!oldStatus || oldStatus === row.status) {
      return json({ skipped: "status unchanged" });
    }
    mail = renderPilotStatusEmail({
      email,
      companyName: row.company_name || "your fleet",
      status: row.status,
      dashboardUrl,
      fleetMessage: row.fleet_visible_message,
    });
  } else {
    return json({ skipped: "not insert/update" });
  }

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: [email],
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    }),
  });

  if (!resendRes.ok) {
    const errBody = await resendRes.text();
    console.error("Resend error:", errBody);
    return json({ error: errBody.slice(0, 500) }, 500);
  }

  const result = await resendRes.json();
  return json({ ok: true, id: result.id, event: payload.type });
});

async function resolveRecipientEmail(row: PilotRow): Promise<string | null> {
  if (row.contact_email?.trim()) return row.contact_email.trim();

  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key || !row.user_id) return null;

  const supabase = createClient(url, key);
  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", row.user_id)
    .maybeSingle();
  if (profile?.email) return profile.email;

  const { data: authUser } = await supabase.auth.admin.getUserById(row.user_id);
  return authUser?.user?.email ?? null;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
