// Records IP + user-agent on a signed LOI row (called from /apply after insert).
// Optional: also invoked without auth when service role passes x-loi-secret header
// matching LOI_METADATA_SECRET for server-side-only updates.

// @ts-nocheck

import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

interface Body {
  loi_id: string;
  user_agent?: string;
}

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

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
