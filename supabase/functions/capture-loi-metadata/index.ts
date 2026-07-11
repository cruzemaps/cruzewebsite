// Records IP + user-agent on a signed LOI row (called from /apply after insert).
// The browser path is gated by Supabase's function JWT verification (anon key).
// Server-side-only callers instead send an `x-loi-secret` header, which is
// ENFORCED below: when present it must match the LOI_METADATA_SECRET env var
// (timing-safe compare) or the request is rejected with 401.

// @ts-nocheck

import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { timingSafeEqual } from "https://deno.land/std@0.192.0/crypto/timing_safe_equal.ts";

interface Body {
  loi_id: string;
  user_agent?: string;
}

function loiSecretOk(provided: string): boolean {
  const expected = Deno.env.get("LOI_METADATA_SECRET") ?? "";
  if (!expected) return false; // no secret configured -> the header path is closed
  const enc = new TextEncoder();
  const a = enc.encode(provided);
  const b = enc.encode(expected);
  if (a.byteLength !== b.byteLength) return false;
  return timingSafeEqual(a, b);
}

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  // Enforce the server-side gate: an x-loi-secret header, when sent, must match
  // LOI_METADATA_SECRET exactly — otherwise 401. (Requests without the header
  // arrive through Supabase's JWT-verified function gateway.)
  const providedSecret = req.headers.get("x-loi-secret");
  if (providedSecret !== null && !loiSecretOk(providedSecret)) {
    return json({ error: "invalid x-loi-secret" }, 401);
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!body.loi_id) return json({ error: "loi_id required" }, 400);

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    null;

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) {
    return json({ skipped: "Supabase service credentials missing" });
  }

  const authHeader = req.headers.get("Authorization");
  const supabase = createClient(url, serviceKey, {
    global: authHeader ? { headers: { Authorization: authHeader } } : undefined,
  });

  const { error } = await supabase.rpc("set_loi_signature_metadata", {
    p_loi_id: body.loi_id,
    p_ip_address: ip,
    p_user_agent: body.user_agent ?? req.headers.get("user-agent"),
  });

  if (error) {
    console.error("set_loi_signature_metadata:", error);
    return json({ error: error.message }, 500);
  }

  return json({ ok: true, ip_captured: !!ip });
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
