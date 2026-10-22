// Unit tests for capture-loi-metadata request handling. No network, no
// database: the handler gets fake dependencies. Run from the repo root:
//
//   deno test --no-lock supabase/functions/capture-loi-metadata/
//
// CI runs this in the "edge functions" job of .github/workflows/test.yml.

import { assert, assertEquals } from "jsr:@std/assert@1.0.13";
import { type Deps, handle, publicKey, type RpcArgs, type RpcError, serviceKey } from "./handler.ts";

const LOI = "0f8fad5b-d9cb-469f-a165-70867728950e";
const SITE = "https://cruzemaps.com";

type Call = { token: string | null; args: RpcArgs };
type Fake = Deps & { calls: Call[] };

function fake(opts: { env?: Record<string, string>; error?: RpcError } = {}): Fake {
  const env = opts.env ?? {};
  const d: Fake = {
    calls: [],
    env: (name) => env[name],
    rpc(token, args) {
      d.calls.push({ token, args });
      return Promise.resolve(opts.error ? { error: opts.error } : {});
    },
    secretMatches: (a, b) => a === b,
  };
  return d;
}

const post = (headers: Record<string, string>, body: unknown = { loi_id: LOI, user_agent: "Browser/1.0" }) =>
  new Request("https://fn.example/capture-loi-metadata", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: SITE, "x-forwarded-for": "203.0.113.7, 10.0.0.1", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

async function call(d: Fake, req: Request) {
  const res = await handle(req, d);
  return { status: res.status, headers: res.headers, body: await res.json().catch(() => null) };
}

Deno.test("a call with no token and no secret is refused and never reaches the database", async () => {
  const d = fake();
  const r = await call(d, post({}));
  assertEquals(r.status, 401);
  assertEquals(d.calls.length, 0);
  const notBearer = await call(d, post({ Authorization: "Basic abc" }));
  assertEquals(notBearer.status, 401);
  assertEquals(d.calls.length, 0);
});

Deno.test("a signer's token runs the RPC as the signer, with the first forwarded IP", async () => {
  const d = fake();
  const r = await call(d, post({ Authorization: "Bearer user.jwt.token" }));
  assertEquals(r.status, 200);
  assertEquals(r.body, { ok: true, ip_captured: true });
  assertEquals(d.calls, [{
    token: "user.jwt.token",
    args: { p_loi_id: LOI, p_ip_address: "203.0.113.7", p_user_agent: "Browser/1.0" },
  }]);
  assertEquals(r.headers.get("access-control-allow-origin"), SITE);
});

Deno.test("the database's refusals map to 401, 403 and 404", async () => {
  const cases: [RpcError, number][] = [
    [{ code: "42501", message: "permission denied for function set_loi_signature_metadata" }, 403],
    [{ code: "P0001", message: "Not authorized" }, 403],
    [{ code: "P0001", message: "LOI not found" }, 404],
    [{ code: "PGRST301", message: "JWT expired" }, 401],
    [{ code: "XX000", message: "boom" }, 500],
  ];
  for (const [error, status] of cases) {
    const r = await call(fake({ error }), post({ Authorization: "Bearer anon.key.jwt" }));
    assertEquals(r.status, status, error.message);
  }
});

Deno.test("the service role is used only after a correct x-loi-secret", async () => {
  const closed = fake();
  assertEquals((await call(closed, post({ "x-loi-secret": "anything" }))).status, 401);
  assertEquals(closed.calls.length, 0);

  const d = fake({ env: { LOI_METADATA_SECRET: "s3cret-value" } });
  assertEquals((await call(d, post({ "x-loi-secret": "wrong" }))).status, 401);
  // A wrong secret is refused even with a bearer token alongside it.
  assertEquals((await call(d, post({ "x-loi-secret": "wrong", Authorization: "Bearer user.jwt.token" }))).status, 401);
  assertEquals(d.calls.length, 0);
  assertEquals((await call(d, post({ "x-loi-secret": "s3cret-value" }))).status, 200);
  assertEquals(d.calls[0].token, null);
});

Deno.test("loi_id must be a uuid and the user agent is capped", async () => {
  const d = fake();
  assertEquals((await call(d, post({ Authorization: "Bearer t" }, { loi_id: "x" }))).status, 400);
  assertEquals((await call(d, post({ Authorization: "Bearer t" }, "{bad"))).status, 400);
  assertEquals(d.calls.length, 0);
  await call(d, post({ Authorization: "Bearer t" }, { loi_id: LOI, user_agent: "a".repeat(2000) }));
  assertEquals(d.calls[0].args.p_user_agent?.length, 512);
});

Deno.test("CORS preflight is answered for the site's origins only", async () => {
  const d = fake();
  const ok = await handle(new Request("https://fn.example/x", { method: "OPTIONS", headers: { Origin: SITE } }), d);
  assertEquals(ok.status, 204);
  assertEquals(ok.headers.get("access-control-allow-origin"), SITE);
  assert(ok.headers.get("access-control-allow-headers")?.includes("authorization"));
  const evil = await handle(new Request("https://fn.example/x", { method: "OPTIONS", headers: { Origin: "https://evil.example" } }), d);
  assertEquals(evil.status, 403);
  assertEquals(evil.headers.get("access-control-allow-origin"), null);
  const get = await handle(new Request("https://fn.example/x", { method: "GET" }), d);
  assertEquals(get.status, 405);
});

Deno.test("key selection: publishable before anon for signers, secret before service_role for the secret path", () => {
  const env = (vals: Record<string, string>) => (name: string) => vals[name];
  assertEquals(publicKey(env({ SUPABASE_PUBLISHABLE_KEYS: '{"default":"sb_publishable_x"}', SUPABASE_ANON_KEY: "anon" })), "sb_publishable_x");
  assertEquals(publicKey(env({ SUPABASE_ANON_KEY: "anon" })), "anon");
  assertEquals(serviceKey(env({ SUPABASE_SECRET_KEYS: '{"default":"sb_secret_x"}', SUPABASE_SERVICE_ROLE_KEY: "svc" })), "sb_secret_x");
  assertEquals(serviceKey(env({ SUPABASE_SERVICE_ROLE_KEY: "svc" })), "svc");
});
