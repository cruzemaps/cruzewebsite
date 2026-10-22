// Supabase Edge Function: transactional emails for fleet pilot applications.
//
// Called by two database webhook triggers on pilot_applications (migration
// 024), with no auth header, so deploy with --no-verify-jwt:
//   1. pilot_email_on_insert          INSERT  confirmation email
//   2. pilot_email_on_status_update   UPDATE  email for the new status
//
// The payload is not trusted beyond type, table and record.id: the row is read
// back from the database with the service role and the email is built from
// that. Each application gets at most one email per status. Rules live in
// handler.ts; tests in handler.test.ts; the email copy in template.ts.
//
// Secrets (Supabase dashboard, Edge Function Secrets):
//   - RESEND_API_KEY        (without it the function sends nothing)
//   - PILOT_FROM_ADDRESS    (optional; default Cruzemaps <hello@cruzemaps.com>)
//   - SITE_BASE_URL         (optional; default https://cruzemaps.com)
//   - SUPABASE_URL and the key are injected by Supabase: a secret key from
//     SUPABASE_SECRET_KEY or SUPABASE_SECRET_KEYS when present, else
//     SUPABASE_SERVICE_ROLE_KEY (see serviceKey in handler.ts).
//
// Needs public.pilot_email_notifications_sent from migration 024. Without it
// the function sends nothing (it cannot record the email, so it fails closed).
//
// Deploy from the repo root:
//   supabase functions deploy send-pilot-email --project-ref zodrljxcwqkjiipobrhs --no-verify-jwt --use-api

// @ts-nocheck: Deno runtime, not Node. The repo's tsconfig doesn't load this file.

import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { COLUMNS, handle, serviceKey, TABLE } from "./handler.ts";

const url = Deno.env.get("SUPABASE_URL");
const key = serviceKey((name) => Deno.env.get(name));
const db = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;

serve((req) =>
  handle(req, {
    env: (name) => Deno.env.get(name),
    now: () => new Date(),

    async loadRow(id) {
      if (!db) return { row: null, error: "Supabase service credentials missing" };
      const { data, error } = await db.from(TABLE).select(COLUMNS).eq("id", id).maybeSingle();
      if (error) return { row: null, error: error.message };
      return { row: data };
    },

    async lookupEmail(userId) {
      if (!db) return { email: null, error: "Supabase service credentials missing" };
      const { data: profile, error } = await db.from("profiles").select("email").eq("id", userId).maybeSingle();
      if (error) return { email: null, error: error.message };
      if (profile?.email) return { email: profile.email };
      const { data: auth } = await db.auth.admin.getUserById(userId);
      return { email: auth?.user?.email ?? null };
    },

    async claim(key) {
      if (!db) return "error";
      const { error } = await db.from("pilot_email_notifications_sent").insert({ key });
      if (!error) return "claimed";
      if (error.code === "23505") return "duplicate";
      console.error(`send-pilot-email: claim ${key} failed: ${error.message}`);
      return "error";
    },

    async sendEmail(apiKey, email) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(email),
      });
      if (!res.ok) return { ok: false, status: res.status, text: await res.text() };
      const body = await res.json().catch(() => ({}));
      return { ok: true, status: res.status, id: body?.id, text: "" };
    },
  })
);
