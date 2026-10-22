// Supabase Edge Function: records the signer's IP address and user agent on a
// signed LOI (called from /apply right after the LOI insert), through
// set_loi_signature_metadata.
//
// Authorization is in handler.ts: a caller's bearer token runs the RPC as that
// caller (the database lets a signer write only their own LOI); the service
// role is used only after a correct x-loi-secret header, a path closed while
// LOI_METADATA_SECRET is unset. A call with neither gets 401. Tests in
// handler.test.ts.
//
// Secrets: LOI_METADATA_SECRET (optional; server-side callers only).
// SUPABASE_URL and the keys are injected by Supabase (publicKey and serviceKey
// in handler.ts).
//
// Deploy from the repo root (the gateway's JWT check does not cover the
// project's ES256 user tokens, so the function checks every call itself):
//   supabase functions deploy capture-loi-metadata --project-ref zodrljxcwqkjiipobrhs --no-verify-jwt --use-api

// @ts-nocheck: Deno runtime, not Node. The repo's tsconfig doesn't load this file.

import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { timingSafeEqual } from "https://deno.land/std@0.192.0/crypto/timing_safe_equal.ts";
import { handle, publicKey, serviceKey } from "./handler.ts";

const url = Deno.env.get("SUPABASE_URL");
const env = (name: string) => Deno.env.get(name);

serve((req) =>
  handle(req, {
    env,

    async rpc(token, args) {
      const key = token ? publicKey(env) : serviceKey(env);
      if (!url || !key) return { error: { message: "Supabase credentials missing" } };
      const db = createClient(url, key, {
        auth: { persistSession: false },
        global: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
      });
      const { error } = await db.rpc("set_loi_signature_metadata", args);
      return error ? { error: { code: error.code, message: error.message } } : {};
    },

    secretMatches(provided, expected) {
      const enc = new TextEncoder();
      const a = enc.encode(provided);
      const b = enc.encode(expected);
      if (a.byteLength !== b.byteLength) return false;
      return timingSafeEqual(a, b);
    },
  })
);
