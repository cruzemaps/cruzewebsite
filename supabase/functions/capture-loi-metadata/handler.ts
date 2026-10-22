// Request handling for the capture-loi-metadata edge function, kept free of
// network and Supabase imports so it can be unit tested with `deno test` (see
// handler.test.ts). index.ts wires in the real RPC call.
//
// /apply calls it from the browser right after the signer's LOI insert, to
// record the signer's IP address and user agent through
// set_loi_signature_metadata. It runs with verify_jwt off (the project signs
// user tokens with ES256, which the gateway check does not cover), so it
// authorizes every call itself:
//   - With an Authorization bearer token, the RPC runs as that token. The
//     database decides: a signed-in signer may set metadata on their own LOI,
//     an admin on any; anon holds no EXECUTE (migrations 019 and 021).
//   - With a correct x-loi-secret header (timing-safe compare against
//     LOI_METADATA_SECRET), the RPC runs with the service role. That path is
//     closed while the secret is unset.
//   - Anything else gets 401. It never falls back to the service role, whose
//     null-uid branch in set_loi_signature_metadata may write to any LOI.
// Browser calls come from the site's origins, so it answers CORS preflights
// for those origins only.

export const ALLOWED_ORIGINS = new Set([
  "https://cruzemaps.com",
  "https://www.cruzemaps.com",
  "https://cruzemaps.github.io",
  "http://localhost:8080",
]);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_USER_AGENT = 512;

export interface RpcArgs {
  p_loi_id: string;
  p_ip_address: string | null;
  p_user_agent: string | null;
}

export interface RpcError {
  code?: string;
  message: string;
}

export interface Deps {
  env(name: string): string | undefined;
  // Call set_loi_signature_metadata. `token` is the caller's bearer token, or
  // null for the service role (only after a correct x-loi-secret).
  rpc(token: string | null, args: RpcArgs): Promise<{ error?: RpcError }>;
  secretMatches(provided: string, expected: string): boolean;
}

export async function handle(req: Request, deps: Deps): Promise<Response> {
  const cors = corsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: cors ? 204 : 403, headers: cors ?? {} });
  if (req.method !== "POST") return json({ error: "Method Not Allowed" }, 405, cors);

  let token: string | null = null;
  const providedSecret = req.headers.get("x-loi-secret");
  if (providedSecret !== null) {
    const expected = deps.env("LOI_METADATA_SECRET") ?? "";
    if (!expected || !deps.secretMatches(providedSecret, expected)) {
      return json({ error: "invalid x-loi-secret" }, 401, cors);
    }
  } else {
    token = bearer(req.headers.get("authorization"));
    if (!token) return json({ error: "sign in required" }, 401, cors);
  }

  // deno-lint-ignore no-explicit-any
  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400, cors);
  }
  const loiId = body?.loi_id;
  if (typeof loiId !== "string" || !UUID_RE.test(loiId)) return json({ error: "loi_id must be a uuid" }, 400, cors);

  const ip =
    firstForwarded(req.headers.get("x-forwarded-for")) ||
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    null;
  const agent = typeof body.user_agent === "string" ? body.user_agent : req.headers.get("user-agent");

  const { error } = await deps.rpc(token, {
    p_loi_id: loiId,
    p_ip_address: ip,
    p_user_agent: agent ? agent.slice(0, MAX_USER_AGENT) : null,
  });
  if (error) {
    const status = errorStatus(error);
    if (status === 500) console.error(`capture-loi-metadata: ${error.code ?? ""} ${error.message}`);
    return json({ error: status === 500 ? "could not record the metadata" : error.message }, status, cors);
  }
  return json({ ok: true, ip_captured: !!ip }, 200, cors);
}

// 401 for a token the API rejects, 403 when the caller may not write this
// LOI, 404 for an unknown LOI, else 500.
export function errorStatus(error: RpcError): number {
  const code = error.code ?? "";
  if (code.startsWith("PGRST3")) return 401;
  if (code === "42501" || /not authorized/i.test(error.message)) return 403;
  if (/LOI not found/i.test(error.message)) return 404;
  return 500;
}

export function corsHeaders(origin: string | null): Record<string, string> | null {
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return null;
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };
}

function bearer(header: string | null): string | null {
  const m = header?.match(/^Bearer\s+(\S+)$/i);
  return m ? m[1] : null;
}

function firstForwarded(header: string | null): string | null {
  const first = header?.split(",")[0]?.trim();
  return first || null;
}

function json(body: unknown, status: number, cors: Record<string, string> | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...(cors ?? {}) },
  });
}

// The key a signer's call goes out with: the project's publishable key, else
// the legacy anon key. A low-privilege key, so a token the API rejects can
// never run as more than anon. Supabase injects SUPABASE_PUBLISHABLE_KEYS as a
// JSON object keyed by name.
export function publicKey(env: (name: string) => string | undefined): string | undefined {
  const all = env("SUPABASE_PUBLISHABLE_KEYS");
  if (all) {
    try {
      const parsed = JSON.parse(all);
      if (parsed && typeof parsed.default === "string" && parsed.default) return parsed.default;
    } catch {
      // Not JSON: fall through to the legacy key.
    }
  }
  return env("SUPABASE_ANON_KEY") || undefined;
}

// The key the x-loi-secret path runs with: a secret key when one is
// available, else the legacy service_role key. Same rule as send-pilot-email.
export function serviceKey(env: (name: string) => string | undefined): string | undefined {
  const single = env("SUPABASE_SECRET_KEY");
  if (single) return single;
  const all = env("SUPABASE_SECRET_KEYS");
  if (all) {
    try {
      const parsed = JSON.parse(all);
      if (parsed && typeof parsed.default === "string" && parsed.default) return parsed.default;
    } catch {
      // Not JSON: fall through to the legacy key.
    }
  }
  return env("SUPABASE_SERVICE_ROLE_KEY") || undefined;
}
