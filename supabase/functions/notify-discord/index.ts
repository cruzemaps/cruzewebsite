// Supabase Edge Function: posts a Discord embed when a pilot application, LOI
// signature or contact message row is inserted.
//
// Called by three database webhook triggers (no auth header, so deploy with
// --no-verify-jwt):
//   1. notify_discord_on_pilot_application  pilot_applications INSERT
//   2. notify_discord_on_loi_signed          loi_signatures INSERT
//   3. notify_discord_on_contact_message     contact_messages INSERT (migration 020)
//
// The payload is not trusted beyond type, table and record.id: the row is read
// back from the database with the service role and the embed is built from
// that. Rules and embeds live in handler.ts; tests in handler.test.ts.
//
// Secrets (Supabase dashboard, Edge Function Secrets):
//   - DISCORD_WEBHOOK_URL       (default channel for every event)
//   - DISCORD_WEBHOOK_PILOTS    (optional; pilot_applications)
//   - DISCORD_WEBHOOK_LOIS      (optional; loi_signatures)
//   - DISCORD_WEBHOOK_CONTACT   (optional; contact_messages)
//   - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY are injected by Supabase.
//
// Needs public.discord_notifications_sent from migration 020; apply it first.
//
// Deploy from the repo root:
//   supabase functions deploy notify-discord --project-ref zodrljxcwqkjiipobrhs --no-verify-jwt

// @ts-nocheck: Deno runtime, not Node. The repo's tsconfig doesn't load this file.

import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { COLUMNS, handle } from "./handler.ts";

const url = Deno.env.get("SUPABASE_URL");
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const db = url && serviceKey ? createClient(url, serviceKey, { auth: { persistSession: false } }) : null;

serve((req) =>
  handle(req, {
    env: (name) => Deno.env.get(name),
    now: () => new Date(),

    async loadRow(table, id) {
      if (!db) return { row: null, error: "Supabase service credentials missing" };
      const { data, error } = await db.from(table).select(COLUMNS[table]).eq("id", id).maybeSingle();
      if (error) return { row: null, error: error.message };
      return { row: data };
    },

    async claim(key) {
      if (!db) return "error";
      const { error } = await db.from("discord_notifications_sent").insert({ key });
      if (!error) return "claimed";
      if (error.code === "23505") return "duplicate";
      console.error(`notify-discord: claim ${key} failed: ${error.message}`);
      return "error";
    },

    async countContactsSince(sinceIso) {
      if (!db) return null;
      const { count, error } = await db
        .from("contact_messages")
        .select("id", { count: "exact", head: true })
        .gte("created_at", sinceIso);
      return error ? null : count ?? 0;
    },

    async postDiscord(webhookUrl, body) {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return { ok: res.ok, status: res.status, text: res.ok ? "" : await res.text() };
    },
  })
);
