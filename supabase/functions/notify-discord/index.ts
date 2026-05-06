// Supabase Edge Function — posts a Discord embed when a pilot application or
// LOI signature row is inserted.
//
// Wire two DB webhooks (Database → Webhooks in the Supabase dashboard):
//   1. pilot_applications INSERT → POST → this function
//   2. loi_signatures     INSERT → POST → this function
//
// The function inspects payload.table to decide which embed to send.
//
// Secrets (Supabase dashboard → Edge Function Secrets):
//   - DISCORD_WEBHOOK_URL          (required; default channel for both events)
//   - DISCORD_WEBHOOK_PILOTS       (optional; used for pilot_applications if set)
//   - DISCORD_WEBHOOK_LOIS         (optional; used for loi_signatures if set)
//
// If only DISCORD_WEBHOOK_URL is set, both events go there. Set the
// per-event URLs to split notifications into different Discord channels.
//
// Deploy: paste this file contents into a new Edge Function called
// "notify-discord" in the Supabase dashboard.

// @ts-nocheck — Deno runtime, not Node. The repo's tsconfig doesn't load this file.

import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

interface PilotApplicationRow {
  id: string;
  user_id: string;
  company_name: string | null;
  truck_size: string | null;
  fleet_size: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

interface LOISignatureRow {
  id: string;
  user_id: string;
  pilot_application_id: string | null;
  participant_name: string;
  participant_company: string;
  participant_title: string | null;
  fleet_size: string;
  initials: string;
  signed_at: string;
}

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: PilotApplicationRow | LOISignatureRow;
  old_record: any;
}

// Discord embed colors (decimal-encoded hex)
const COLOR_PILOT = 0xff8c00;      // brand orange
const COLOR_LOI   = 0x00b4c0;      // brand cyan-teal

const SITE_URL = "https://cruzemaps.com";

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const DEFAULT_URL = Deno.env.get("DISCORD_WEBHOOK_URL");
  const PILOTS_URL  = Deno.env.get("DISCORD_WEBHOOK_PILOTS") || DEFAULT_URL;
  const LOIS_URL    = Deno.env.get("DISCORD_WEBHOOK_LOIS")   || DEFAULT_URL;

  if (!DEFAULT_URL && !PILOTS_URL && !LOIS_URL) {
    return json({ error: "No Discord webhook URL configured" }, 500);
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (payload.type !== "INSERT") {
    return json({ skipped: "not an insert" });
  }

  let webhookUrl: string | undefined;
  let body: any;

  if (payload.table === "pilot_applications") {
    const row = payload.record as PilotApplicationRow;
    webhookUrl = PILOTS_URL;
    body = pilotEmbed(row);
  } else if (payload.table === "loi_signatures") {
    const row = payload.record as LOISignatureRow;
    webhookUrl = LOIS_URL;
    body = loiEmbed(row);
  } else {
    return json({ skipped: `unknown table ${payload.table}` });
  }

  if (!webhookUrl) {
    return json({ error: `No webhook URL configured for ${payload.table}` }, 500);
  }

  const discordRes = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!discordRes.ok) {
    const errText = await discordRes.text();
    console.error("Discord error:", errText);
    return json({ error: `Discord ${discordRes.status}: ${errText}` }, 500);
  }

  return json({ ok: true, table: payload.table });
});

function pilotEmbed(row: PilotApplicationRow) {
  const fields = [
    { name: "Company", value: row.company_name || "(unspecified)", inline: true },
    { name: "Fleet size", value: row.fleet_size || "(unspecified)", inline: true },
    { name: "Truck class", value: row.truck_size || "(unspecified)", inline: true },
  ];

  if (row.notes) {
    fields.push({
      name: "Notes",
      value: row.notes.length > 1024 ? row.notes.slice(0, 1020) + "…" : row.notes,
      inline: false,
    });
  }

  return {
    username: "Cruzemaps",
    avatar_url: `${SITE_URL}/logo.png`,
    embeds: [
      {
        title: "🚛 New pilot application",
        description: `A new fleet just submitted a pilot application.`,
        url: `${SITE_URL}/admin`,
        color: COLOR_PILOT,
        fields,
        footer: {
          text: `Application ID ${row.id.slice(0, 8)} · ${new Date(row.created_at).toLocaleString("en-US")}`,
          icon_url: `${SITE_URL}/logo.png`,
        },
        timestamp: row.created_at,
      },
    ],
  };
}

function loiEmbed(row: LOISignatureRow) {
  const fields: any[] = [
    { name: "Participant", value: row.participant_name, inline: true },
    { name: "Initials", value: row.initials, inline: true },
    { name: "Company", value: row.participant_company, inline: false },
    { name: "Fleet size", value: row.fleet_size, inline: true },
  ];

  if (row.participant_title) {
    fields.push({ name: "Title", value: row.participant_title, inline: true });
  }

  return {
    username: "Cruzemaps",
    avatar_url: `${SITE_URL}/logo.png`,
    embeds: [
      {
        title: "✍️ LOI signed",
        description: `**${row.participant_name}** just signed the Letter of Intent.`,
        url: `${SITE_URL}/loi/${row.id}`,
        color: COLOR_LOI,
        fields,
        footer: {
          text: `Signature ID ${row.id.slice(0, 8)} · ${new Date(row.signed_at).toLocaleString("en-US")}`,
          icon_url: `${SITE_URL}/logo.png`,
        },
        timestamp: row.signed_at,
      },
    ],
  };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
