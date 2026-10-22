// Supabase Edge Function: sends an invitation email through Resend.
//
// Called by the database webhook invite_email_on_insert on public.invitations
// (migration 023), with no auth header, so deploy with --no-verify-jwt.
//
// The payload is not trusted beyond type, table and record.id: the invitation
// is read back from the database with the service role, it must be new, not
// accepted, not expired and created by an active admin, and each invitation is
// emailed at most once (public.invitation_emails_sent, migration 025). Rules
// live in handler.ts; tests in handler.test.ts; the email copy in template.ts.
//
// Secrets (Supabase dashboard, Edge Function Secrets):
//   - RESEND_API_KEY        (without it the function sends nothing)
//   - INVITE_BASE_URL       (optional; default https://cruzemaps.com)
//   - INVITE_FROM_ADDRESS   (optional; default Cruzemaps <invitations@cruzemaps.com>)
//   - DEFAULT_INVITER_NAME  (optional; used when the inviter has no name or email)
//   - SUPABASE_URL and the key are injected by Supabase (see serviceKey in
//     handler.ts).
//
// Needs public.invitation_emails_sent from migration 025. Without it the
// function sends nothing (it cannot record the email, so it fails closed).
//
// Deploy from the repo root:
//   supabase functions deploy send-invitation --project-ref zodrljxcwqkjiipobrhs --no-verify-jwt --use-api

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

    async loadProfile(userId) {
      if (!db) return { profile: null, error: "Supabase service credentials missing" };
      const { data, error } = await db
        .from("profiles")
        .select("id, role, status, first_name, last_name, email")
        .eq("id", userId)
        .maybeSingle();
      if (error) return { profile: null, error: error.message };
      return { profile: data };
    },

    async claim(key) {
      if (!db) return "error";
      const { error } = await db.from("invitation_emails_sent").insert({ key });
      if (!error) return "claimed";
      if (error.code === "23505") return "duplicate";
      console.error(`send-invitation: claim ${key} failed: ${error.message}`);
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
