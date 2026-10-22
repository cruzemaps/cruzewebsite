// Unit tests for send-pilot-email request handling. No network, no database:
// the handler gets fake dependencies. Run from the repo root:
//
//   deno test --no-lock supabase/functions/send-pilot-email/
//
// CI runs this in the "edge functions" job of .github/workflows/test.yml.

import { assert, assertEquals } from "jsr:@std/assert@1.0.13";
import { type Deps, type Email, handle, ledgerKey, type Row, serviceKey } from "./handler.ts";

const NOW = new Date("2026-10-22T12:00:00Z");
const ID = "0f8fad5b-d9cb-469f-a165-70867728950e";
const USER = "1b4e28ba-2fa1-41d2-883f-0016d3cca427";
const STAFF = "6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b";
const ENV: Record<string, string> = { RESEND_API_KEY: "re_test" };

const minutesAgo = (m: number) => new Date(NOW.getTime() - m * 60_000).toISOString();

// A pilot application as the database has it: submitted 1 minute ago, never
// reviewed.
const pilotRow = (over: Row = {}): Row => ({
  id: ID,
  user_id: USER,
  company_name: "Acme Freight",
  contact_email: "dana@acme.example",
  status: "pending",
  fleet_visible_message: null,
  created_at: minutesAgo(1),
  reviewed_at: null,
  ...over,
});

type Fake = Deps & {
  rows: Map<string, Row>;
  sent: Email[];
  ledger: Set<string>;
  loads: string[];
  lookups: string[];
};

function fake(opts: {
  rows?: Row[];
  env?: Record<string, string>;
  profileEmail?: string | null;
  loadError?: string;
  lookupError?: string;
  claimError?: boolean;
  resendStatus?: number;
} = {}): Fake {
  const env = opts.env ?? ENV;
  const d: Fake = {
    rows: new Map((opts.rows ?? []).map((r) => [r.id, r])),
    sent: [],
    ledger: new Set(),
    loads: [],
    lookups: [],
    env: (name) => env[name],
    now: () => NOW,
    loadRow(id) {
      d.loads.push(id);
      if (opts.loadError) return Promise.resolve({ row: null, error: opts.loadError });
      return Promise.resolve({ row: d.rows.get(id) ?? null });
    },
    lookupEmail(userId) {
      d.lookups.push(userId);
      if (opts.lookupError) return Promise.resolve({ email: null, error: opts.lookupError });
      return Promise.resolve({ email: opts.profileEmail ?? null });
    },
    claim(key) {
      if (opts.claimError) return Promise.resolve("error");
      if (d.ledger.has(key)) return Promise.resolve("duplicate");
      d.ledger.add(key);
      return Promise.resolve("claimed");
    },
    sendEmail(_apiKey, email) {
      const status = opts.resendStatus ?? 200;
      if (status >= 300) return Promise.resolve({ ok: false, status, text: "upstream said no" });
      d.sent.push(email);
      return Promise.resolve({ ok: true, status, id: `email-${d.sent.length}`, text: "" });
    },
  };
  return d;
}

function post(body: unknown): Request {
  return new Request("https://fn.invalid/send-pilot-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

async function call(d: Fake, payload: unknown) {
  const res = await handle(post(payload), d);
  return { status: res.status, body: await res.json() };
}

// What the database webhook sends: the whole row, and old_record on UPDATE.
const insertPayload = (record: Row = { id: ID }) => ({
  type: "INSERT",
  table: "pilot_applications",
  schema: "public",
  record,
  old_record: null,
});
const updatePayload = (record: Row = { id: ID }, old_record: Row | null = { id: ID }) => ({
  type: "UPDATE",
  table: "pilot_applications",
  schema: "public",
  record,
  old_record,
});

// The admin portal changes the status and sets reviewed_at to now.
function review(d: Fake, status: string, minutes = 0) {
  d.rows.set(ID, { ...d.rows.get(ID), status, reviewed_at: minutesAgo(minutes) });
}

Deno.test("rejects non-POST and bad JSON", async () => {
  const d = fake({ rows: [pilotRow()] });
  const res = await handle(new Request("https://fn.invalid/x", { method: "GET" }), d);
  assertEquals(res.status, 405);
  assertEquals((await call(d, "{not json")).status, 400);
  assertEquals((await call(d, "null")).status, 400);
  assertEquals(d.sent.length, 0);
});

Deno.test("only INSERT and UPDATE on pilot_applications, with a uuid id", async () => {
  const d = fake({ rows: [pilotRow()] });
  assertEquals((await call(d, { ...insertPayload(), type: "DELETE" })).body, { skipped: "not an insert or update" });
  assertEquals((await call(d, { ...insertPayload(), table: "profiles" })).body, { skipped: "unknown table" });
  assertEquals((await call(d, insertPayload({ id: "x' or 1=1" }))).status, 400);
  assertEquals((await call(d, insertPayload({}))).status, 400);
  assertEquals((await call(d, { type: "INSERT", table: "pilot_applications" })).status, 400);
  assertEquals(d.sent.length, 0);
  assertEquals(d.loads.length, 0);
});

Deno.test("a genuine insert sends the confirmation once, built from the database row", async () => {
  const d = fake({ rows: [pilotRow()] });
  const { status, body } = await call(d, insertPayload(pilotRow()));
  assertEquals(status, 200);
  assertEquals(body, { ok: true, id: "email-1", event: "INSERT" });
  assertEquals(d.loads, [ID]);
  assertEquals(d.sent.length, 1);
  const mail = d.sent[0];
  assertEquals(mail.to, ["dana@acme.example"]);
  assertEquals(mail.from, "Cruzemaps <hello@cruzemaps.com>");
  assertEquals(mail.subject, "We received your Cruze pilot application");
  assert(mail.html.includes("(Acme Freight)"));
  assert(mail.html.includes("https://cruzemaps.com/fleet-dashboard"));
  assert(mail.text.includes("View fleet dashboard: https://cruzemaps.com/fleet-dashboard"));
  assertEquals([...d.ledger], [ledgerKey(ID, "pending")]);
});

Deno.test("a replayed insert sends nothing", async () => {
  const d = fake({ rows: [pilotRow()] });
  assertEquals((await call(d, insertPayload())).body.ok, true);
  assertEquals((await call(d, insertPayload())).body, { skipped: "already emailed" });
  assertEquals((await call(d, insertPayload(pilotRow()))).body, { skipped: "already emailed" });
  assertEquals(d.sent.length, 1);
});

Deno.test("spoofed payload fields cannot change who gets an email or what it says", async () => {
  const d = fake({ rows: [pilotRow()] });
  const forged = {
    id: ID,
    contact_email: "victim@evil.example",
    user_id: "00000000-0000-0000-0000-000000000000",
    company_name: "Reset your password at https://evil.example",
    status: "approved",
    fleet_visible_message: "Pay the deposit at https://evil.example",
    created_at: NOW.toISOString(),
    reviewed_at: NOW.toISOString(),
  };
  await call(d, insertPayload(forged));
  assertEquals(d.sent.length, 1);
  const mail = d.sent[0];
  assertEquals(mail.to, ["dana@acme.example"]);
  assertEquals(mail.subject, "We received your Cruze pilot application");
  assert(!JSON.stringify(mail).includes("evil.example"));
  assertEquals(d.lookups.length, 0);

  // An UPDATE with a forged record and old_record: the stored row has not
  // been reviewed, so there is nothing to send.
  const res = await call(d, updatePayload(forged, { ...forged, status: "pending" }));
  assertEquals(res.body, { skipped: "no recent status change" });
  assertEquals(d.sent.length, 1);

  // After a genuine review, the email follows the stored status and message,
  // not the payload's.
  d.rows.set(ID, { ...d.rows.get(ID), status: "in_review", fleet_visible_message: "We will call you Tuesday.", reviewed_at: minutesAgo(0), reviewed_by: STAFF });
  await call(d, updatePayload(forged, { ...forged, status: "denied" }));
  assertEquals(d.sent.length, 2);
  const status = d.sent[1];
  assertEquals(status.to, ["dana@acme.example"]);
  assertEquals(status.subject, "Your Cruze pilot application is under review");
  assert(status.html.includes("We will call you Tuesday."));
  assert(!JSON.stringify(status).includes("evil.example"));
});

Deno.test("a message no staff member saved is never sent as Message from Cruze", async () => {
  // The applicant typed fleet_visible_message at apply time (possible before
  // migration 025); a bulk status change sets reviewed_at but not reviewed_by.
  const d = fake({ rows: [pilotRow({ fleet_visible_message: "Wire the deposit to https://evil.example" })] });
  review(d, "approved");
  assertEquals((await call(d, updatePayload())).body.ok, true);
  assertEquals(d.sent.length, 1);
  assert(!JSON.stringify(d.sent[0]).includes("evil.example"));
  assert(!d.sent[0].html.includes("Message from Cruze"));

  // Once a staff member saves the row, its message goes out.
  d.rows.set(ID, { ...d.rows.get(ID), status: "onboarding", fleet_visible_message: "Kickoff on Monday.", reviewed_at: minutesAgo(0), reviewed_by: STAFF });
  assertEquals((await call(d, updatePayload())).body.ok, true);
  assert(d.sent[1].html.includes("Message from Cruze"));
  assert(d.sent[1].html.includes("Kickoff on Monday."));
});

Deno.test("an id with no row sends nothing", async () => {
  const d = fake({ rows: [] });
  assertEquals((await call(d, insertPayload())).body, { skipped: "row not found" });
  assertEquals((await call(d, updatePayload())).body, { skipped: "row not found" });
  assertEquals(d.sent.length, 0);
  assertEquals(d.ledger.size, 0);
});

Deno.test("an old or future-dated row gets no confirmation", async () => {
  for (const created_at of [minutesAgo(11), minutesAgo(60 * 24 * 30), minutesAgo(-5), null, "not a date"]) {
    const d = fake({ rows: [pilotRow({ created_at })] });
    assertEquals((await call(d, insertPayload())).body, { skipped: "row is not new" }, String(created_at));
    assertEquals(d.sent.length, 0);
    assertEquals(d.ledger.size, 0);
  }
  const edge = fake({ rows: [pilotRow({ created_at: minutesAgo(10) })] });
  assertEquals((await call(edge, insertPayload())).body.ok, true);
});

Deno.test("a status change sends once per status", async () => {
  const d = fake({ rows: [pilotRow()] });
  await call(d, insertPayload());

  review(d, "approved");
  assertEquals((await call(d, updatePayload())).body, { ok: true, id: "email-2", event: "UPDATE" });
  assertEquals(d.sent[1].subject, "Your Cruze pilot application was approved");
  // The webhook fires again for the same change, or the payload is replayed.
  assertEquals((await call(d, updatePayload())).body, { skipped: "already emailed" });

  // An edit that keeps the status (notes, message) sends nothing.
  d.rows.set(ID, { ...d.rows.get(ID), fleet_visible_message: "New note", reviewed_at: minutesAgo(0) });
  assertEquals((await call(d, updatePayload())).body, { skipped: "already emailed" });

  review(d, "active");
  assertEquals((await call(d, updatePayload())).body.ok, true);
  assertEquals(d.sent[2].subject, "Your Cruze pilot is now active");

  // Back to a status that was already emailed: nothing new.
  review(d, "approved");
  assertEquals((await call(d, updatePayload())).body, { skipped: "already emailed" });
  // Pending was emailed as the confirmation.
  review(d, "pending");
  assertEquals((await call(d, updatePayload())).body, { skipped: "already emailed" });

  assertEquals(d.sent.length, 3);
  assertEquals([...d.ledger].sort(), [ledgerKey(ID, "active"), ledgerKey(ID, "approved"), ledgerKey(ID, "pending")]);
});

Deno.test("an update is only emailed when the row was reviewed in the last 10 minutes", async () => {
  for (const reviewed_at of [null, minutesAgo(11), minutesAgo(60 * 24), minutesAgo(-11), "not a date"]) {
    const d = fake({ rows: [pilotRow({ status: "approved", created_at: minutesAgo(60 * 24 * 30), reviewed_at })] });
    assertEquals((await call(d, updatePayload())).body, { skipped: "no recent status change" }, String(reviewed_at));
    assertEquals(d.sent.length, 0);
    assertEquals(d.ledger.size, 0);
  }
  // The admin's browser sets reviewed_at, so a clock a few minutes fast counts.
  for (const reviewed_at of [minutesAgo(10), minutesAgo(-5)]) {
    const d = fake({ rows: [pilotRow({ status: "approved", reviewed_at })] });
    assertEquals((await call(d, updatePayload())).body.ok, true, String(reviewed_at));
  }
});

Deno.test("a forged UPDATE right after an insert sends nothing new", async () => {
  const d = fake({ rows: [pilotRow({ reviewed_at: minutesAgo(0) })] });
  await call(d, insertPayload());
  assertEquals((await call(d, updatePayload({ id: ID, status: "approved" }, { id: ID, status: "pending" }))).body, {
    skipped: "already emailed",
  });
  assertEquals(d.sent.length, 1);
});

Deno.test("recipient: contact_email, else the applicant's account email, else nothing", async () => {
  const a = fake({ rows: [pilotRow({ contact_email: "  dana@acme.example  " })] });
  await call(a, insertPayload());
  assertEquals(a.sent[0].to, ["dana@acme.example"]);
  assertEquals(a.lookups.length, 0);

  const b = fake({ rows: [pilotRow({ contact_email: " " })], profileEmail: "owner@acme.example" });
  await call(b, insertPayload());
  assertEquals(b.lookups, [USER]);
  assertEquals(b.sent[0].to, ["owner@acme.example"]);

  const c = fake({ rows: [pilotRow({ contact_email: null })], profileEmail: null });
  assertEquals((await call(c, insertPayload())).body, { skipped: "no recipient email" });
  assertEquals(c.sent.length, 0);
  assertEquals(c.ledger.size, 0);
});

Deno.test("fails closed when the database cannot be read or the email cannot be recorded", async () => {
  const a = fake({ loadError: "boom" });
  assertEquals((await call(a, insertPayload())).status, 500);
  const b = fake({ rows: [pilotRow()], claimError: true });
  assertEquals((await call(b, insertPayload())).status, 500);
  const c = fake({ rows: [pilotRow({ contact_email: null })], lookupError: "boom" });
  assertEquals((await call(c, insertPayload())).status, 500);
  assertEquals(a.sent.length + b.sent.length + c.sent.length, 0);
  assertEquals(c.ledger.size, 0);
});

Deno.test("no RESEND_API_KEY is a 200 skip before any database read", async () => {
  const d = fake({ env: {}, rows: [pilotRow()] });
  const { status, body } = await call(d, insertPayload());
  assertEquals(status, 200);
  assertEquals(body, { skipped: "RESEND_API_KEY not configured" });
  assertEquals(d.loads.length, 0);
});

Deno.test("Resend failure is a 500 that does not echo Resend's reply", async () => {
  const d = fake({ rows: [pilotRow()], resendStatus: 422 });
  const { status, body } = await call(d, insertPayload());
  assertEquals(status, 500);
  assertEquals(body, { error: "Resend 422" });
});

Deno.test("PILOT_FROM_ADDRESS and SITE_BASE_URL still apply", async () => {
  const d = fake({
    rows: [pilotRow()],
    env: { ...ENV, PILOT_FROM_ADDRESS: "Pilots <pilots@cruzemaps.com>", SITE_BASE_URL: "https://staging.cruzemaps.com" },
  });
  await call(d, insertPayload());
  assertEquals(d.sent[0].from, "Pilots <pilots@cruzemaps.com>");
  assert(d.sent[0].text.includes("https://staging.cruzemaps.com/fleet-dashboard"));
});

Deno.test("serviceKey prefers a secret key over the legacy service_role key", () => {
  const env = (vars: Record<string, string>) => (name: string) => vars[name];
  assertEquals(serviceKey(env({ SUPABASE_SECRET_KEY: "a", SUPABASE_SECRET_KEYS: '{"default":"b"}', SUPABASE_SERVICE_ROLE_KEY: "c" })), "a");
  assertEquals(serviceKey(env({ SUPABASE_SECRET_KEYS: '{"default":"b"}', SUPABASE_SERVICE_ROLE_KEY: "c" })), "b");
  assertEquals(serviceKey(env({ SUPABASE_SECRET_KEYS: "not json", SUPABASE_SERVICE_ROLE_KEY: "c" })), "c");
  assertEquals(serviceKey(env({ SUPABASE_SECRET_KEYS: '{"other":"b"}', SUPABASE_SERVICE_ROLE_KEY: "c" })), "c");
  assertEquals(serviceKey(env({ SUPABASE_SERVICE_ROLE_KEY: "c" })), "c");
  assertEquals(serviceKey(env({})), undefined);
});
