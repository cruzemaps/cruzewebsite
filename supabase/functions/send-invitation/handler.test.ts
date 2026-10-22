// Unit tests for send-invitation request handling. No network, no database:
// the handler gets fake dependencies. Run from the repo root:
//
//   deno test --no-lock supabase/functions/send-invitation/
//
// CI runs this in the "edge functions" job of .github/workflows/test.yml.

import { assert, assertEquals } from "jsr:@std/assert@1.0.13";
import { type Deps, type Email, handle, ledgerKey, type Row } from "./handler.ts";

const NOW = new Date("2026-10-22T12:00:00Z");
const ID = "0f8fad5b-d9cb-469f-a165-70867728950e";
const ADMIN = "1b4e28ba-2fa1-41d2-883f-0016d3cca427";
const ENV: Record<string, string> = { RESEND_API_KEY: "re_test" };

const minutesAgo = (m: number) => new Date(NOW.getTime() - m * 60_000).toISOString();
const daysAhead = (d: number) => new Date(NOW.getTime() + d * 86_400_000).toISOString();

// An invitation as the database has it: created 1 minute ago by an admin.
const inviteRow = (over: Row = {}): Row => ({
  id: ID,
  email: "dana@acme.example",
  role: "fleet_owner",
  token: "invite-token-1",
  expires_at: daysAhead(7),
  accepted_at: null,
  invited_by: ADMIN,
  created_at: minutesAgo(1),
  ...over,
});

const adminProfile = (over: Row = {}): Row => ({
  id: ADMIN,
  role: "admin",
  status: "active",
  first_name: "Sam",
  last_name: "Rivera",
  email: "sam@cruzemaps.com",
  ...over,
});

type Fake = Deps & { sent: Email[]; ledger: Set<string>; loads: string[] };

function fake(opts: {
  rows?: Row[];
  profiles?: Row[];
  env?: Record<string, string>;
  loadError?: string;
  profileError?: string;
  claimError?: boolean;
  resendStatus?: number;
} = {}): Fake {
  const env = opts.env ?? ENV;
  const rows = new Map((opts.rows ?? []).map((r) => [r.id, r]));
  const profiles = new Map((opts.profiles ?? [adminProfile()]).map((p) => [p.id, p]));
  const d: Fake = {
    sent: [],
    ledger: new Set(),
    loads: [],
    env: (name) => env[name],
    now: () => NOW,
    loadRow(id) {
      d.loads.push(id);
      if (opts.loadError) return Promise.resolve({ row: null, error: opts.loadError });
      return Promise.resolve({ row: rows.get(id) ?? null });
    },
    loadProfile(userId) {
      if (opts.profileError) return Promise.resolve({ profile: null, error: opts.profileError });
      return Promise.resolve({ profile: profiles.get(userId) ?? null });
    },
    claim(key) {
      if (opts.claimError) return Promise.resolve("error");
      if (d.ledger.has(key)) return Promise.resolve("duplicate");
      d.ledger.add(key);
      return Promise.resolve("claimed");
    },
    sendEmail(_apiKey, email) {
      const status = opts.resendStatus ?? 200;
      if (status >= 300) return Promise.resolve({ ok: false, status, text: "rejected" });
      d.sent.push(email);
      return Promise.resolve({ ok: true, status, id: "msg_1", text: "" });
    },
  };
  return d;
}

const post = (body: unknown) =>
  new Request("https://fn.example/send-invitation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

const webhook = (record: Row, over: Row = {}) => post({ type: "INSERT", table: "invitations", schema: "public", record, old_record: null, ...over });

async function call(d: Fake, req: Request) {
  const res = await handle(req, d);
  return { status: res.status, body: await res.json().catch(() => null) };
}

Deno.test("sends the invitation built from the database row, not the payload", async () => {
  const d = fake({ rows: [inviteRow()] });
  const forged = { id: ID, email: "victim@evil.example", role: "admin", token: "evil", invited_by: "x", expires_at: daysAhead(30) };
  const r = await call(d, webhook(forged));
  assertEquals(r.status, 200);
  assertEquals(r.body.ok, true);
  assertEquals(d.sent.length, 1);
  assertEquals(d.sent[0].to, ["dana@acme.example"]);
  assert(d.sent[0].text.includes("https://cruzemaps.com/invite/invite-token-1"));
  assert(!d.sent[0].text.includes("evil"));
  assert(d.sent[0].text.includes("Sam Rivera"));
  assertEquals([...d.ledger], [ledgerKey(ID)]);
});

Deno.test("a forged payload for an id that does not exist sends nothing", async () => {
  const d = fake({ rows: [] });
  const r = await call(d, webhook({ id: ID, email: "victim@evil.example", role: "admin", token: "t" }));
  assertEquals(r.body.skipped, "row not found");
  assertEquals(d.sent.length, 0);
  assertEquals(d.ledger.size, 0);
});

Deno.test("a replay of the same invitation sends nothing new", async () => {
  const d = fake({ rows: [inviteRow()] });
  await call(d, webhook({ id: ID }));
  const r = await call(d, webhook({ id: ID }));
  assertEquals(r.body.skipped, "already emailed");
  assertEquals(d.sent.length, 1);
});

Deno.test("an old invitation is not emailed again", async () => {
  const d = fake({ rows: [inviteRow({ created_at: minutesAgo(11) })] });
  const r = await call(d, webhook({ id: ID }));
  assertEquals(r.body.skipped, "row is not new");
  assertEquals(d.sent.length, 0);
});

Deno.test("accepted or expired invitations are skipped", async () => {
  let d = fake({ rows: [inviteRow({ accepted_at: minutesAgo(0) })] });
  assertEquals((await call(d, webhook({ id: ID }))).body.skipped, "already accepted");
  d = fake({ rows: [inviteRow({ expires_at: minutesAgo(0) })] });
  assertEquals((await call(d, webhook({ id: ID }))).body.skipped, "expired");
  assertEquals(d.sent.length, 0);
});

Deno.test("acts only for an active admin inviter", async () => {
  for (const profile of [adminProfile({ role: "fleet_owner" }), adminProfile({ status: "pending" }), adminProfile({ status: "suspended" })]) {
    const d = fake({ rows: [inviteRow()], profiles: [profile] });
    const r = await call(d, webhook({ id: ID }));
    assertEquals(r.body.skipped, "inviter is not an active admin");
    assertEquals(d.sent.length, 0);
    assertEquals(d.ledger.size, 0);
  }
  const none = fake({ rows: [inviteRow()], profiles: [] });
  assertEquals((await call(none, webhook({ id: ID }))).body.skipped, "inviter is not an active admin");
  const noInviter = fake({ rows: [inviteRow({ invited_by: null })] });
  assertEquals((await call(noInviter, webhook({ id: ID }))).body.skipped, "inviter is not an active admin");
});

Deno.test("only INSERT on invitations, with a uuid id", async () => {
  const d = fake({ rows: [inviteRow()] });
  assertEquals((await call(d, webhook({ id: ID }, { type: "UPDATE" }))).body.skipped, "not an insert");
  assertEquals((await call(d, webhook({ id: ID }, { table: "profiles" }))).body.skipped, "unknown table");
  assertEquals((await call(d, webhook({ id: "not-a-uuid" }))).status, 400);
  assertEquals((await call(d, post("{not json"))).status, 400);
  const get = await handle(new Request("https://fn.example/send-invitation"), d);
  assertEquals(get.status, 405);
  assertEquals(d.sent.length, 0);
  assertEquals(d.loads.length, 0);
});

Deno.test("without RESEND_API_KEY nothing is read or sent", async () => {
  const d = fake({ rows: [inviteRow()], env: {} });
  const r = await call(d, webhook({ id: ID }));
  assertEquals(r.body.skipped, "RESEND_API_KEY not configured");
  assertEquals(d.loads.length, 0);
});

Deno.test("database and ledger failures fail closed", async () => {
  assertEquals((await call(fake({ rows: [inviteRow()], loadError: "boom" }), webhook({ id: ID }))).status, 500);
  assertEquals((await call(fake({ rows: [inviteRow()], profileError: "boom" }), webhook({ id: ID }))).status, 500);
  const d = fake({ rows: [inviteRow()], claimError: true });
  assertEquals((await call(d, webhook({ id: ID }))).status, 500);
  assertEquals(d.sent.length, 0);
});

Deno.test("a Resend failure is reported", async () => {
  const d = fake({ rows: [inviteRow()], resendStatus: 422 });
  const r = await call(d, webhook({ id: ID }));
  assertEquals(r.status, 500);
  assertEquals(r.body.error, "Resend 422");
});
