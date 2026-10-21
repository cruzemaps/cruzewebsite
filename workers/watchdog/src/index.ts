// Cloudflare Worker: account-wide watchdog for the Cruze Workers.
//
// Cron-only (see wrangler.jsonc), no public routes.
//   */5 * * * *  — posts to Discord when any Worker threw, hit the CPU limit,
//                  or otherwise failed in the last check window. Also probes
//                  api.cruzemaps.com (/health, /readyz) and posts when a
//                  target goes down or recovers; state machine in apiProbe.ts,
//                  state kept in the WATCHDOG_STATE KV namespace.
//   0 14 * * *   — daily digest: yesterday's requests vs the free-plan cap,
//                  failures per Worker. Doubles as a heartbeat: if the digest
//                  stops arriving, the watchdog itself is broken.
//
// Data comes from the GraphQL Analytics API, which needs a token scoped to
// Account Analytics: Read. Both secrets are set via `wrangler secret put`.

import {
  TARGETS,
  classify,
  message,
  step,
  unreachable,
  type ProbeResult,
  type TargetState,
} from "./apiProbe";

interface Env {
  CF_ACCOUNT_ID: string;
  CF_API_TOKEN: string;
  DISCORD_WEBHOOK_URL: string;
  WATCHDOG_STATE: KVNamespace;
}

interface Row {
  sum: { requests: number };
  quantiles: { cpuTimeP50: number };
  dimensions: { scriptName: string; status: string };
}

// Workers free plan: 100k requests/day across the account.
const FREE_DAILY_REQUESTS = 100_000;

// Analytics lag a couple of minutes, so each 5-min run checks the window that
// closed 5 minutes ago. Windows tile exactly: every invocation is seen once.
const WINDOW_MS = 5 * 60_000;
const LAG_MS = 5 * 60_000;

// clientDisconnected is the visitor leaving early, not a Worker failure.
const OK_STATUSES = new Set(["success", "clientDisconnected"]);

const STATUS_LABEL: Record<string, string> = {
  scriptThrewException: "threw an exception",
  exceededResources: "hit the CPU limit",
  internalError: "Cloudflare internal error",
  exceededMemory: "ran out of memory",
};

const QUERY = `query($account: String!, $start: Time!, $end: Time!) {
  viewer {
    accounts(filter: { accountTag: $account }) {
      workersInvocationsAdaptive(
        limit: 1000
        filter: { datetime_geq: $start, datetime_lt: $end }
      ) {
        sum { requests }
        quantiles { cpuTimeP50 }
        dimensions { scriptName status }
      }
    }
  }
}`;

// api.cruzemaps.com is served through a Cloudflare Tunnel from the laptop.
const PROBE_TIMEOUT_MS = 10_000;

export default {
  async scheduled(controller: ScheduledController, env: Env): Promise<void> {
    if (!env.DISCORD_WEBHOOK_URL) {
      console.warn("watchdog idle: DISCORD_WEBHOOK_URL not set");
      return;
    }
    if (controller.cron === "0 14 * * *") {
      if (!env.CF_API_TOKEN) return console.warn("digest skipped: CF_API_TOKEN not set");
      await dailyDigest(env, controller.scheduledTime);
      return;
    }
    // The two checks are independent; one failing must not silence the other.
    const results = await Promise.allSettled([
      env.CF_API_TOKEN
        ? errorCheck(env, controller.scheduledTime)
        : Promise.resolve(console.warn("error check skipped: CF_API_TOKEN not set")),
      apiProbe(env, controller.scheduledTime),
    ]);
    for (const r of results) if (r.status === "rejected") console.error(r.reason);
  },
};

async function apiProbe(env: Env, now: number): Promise<void> {
  if (!env.WATCHDOG_STATE) {
    console.warn("api probe skipped: WATCHDOG_STATE KV binding missing");
    return;
  }
  await Promise.all(TARGETS.map((target) => probeTarget(env, target, now)));
}

async function probeTarget(env: Env, target: string, now: number): Promise<void> {
  const key = `api-probe:${target}`;
  const [prev, result] = await Promise.all([
    env.WATCHDOG_STATE.get<TargetState>(key, "json"),
    probe(target),
  ]);
  const { next, alert } = step(prev, result, now);
  console.log(
    `probe ${target}: HTTP ${result.status}` +
      (result.cfCode !== null ? ` cf ${result.cfCode}` : "") +
      (result.error ? ` (${result.error})` : "") +
      ` -> ${next.up ? "up" : "down"} fails=${next.fails}` +
      (alert ? ` alert=${alert}` : ""),
  );
  // KV writes are capped per day on the free plan; only persist a change.
  if (next !== prev) await env.WATCHDOG_STATE.put(key, JSON.stringify(next));
  if (alert) await discord(env, message(alert, target, prev, next, now));
}

async function probe(target: string): Promise<ProbeResult> {
  try {
    const res = await fetch(target, {
      method: "GET",
      headers: { "user-agent": "cruze-watchdog/1 (+https://cruzemaps.com)" },
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
      cf: { cacheTtl: 0 },
    });
    // Only an error page needs its body read (for the Cloudflare error code).
    const body = res.status === 200 ? "" : (await res.text()).slice(0, 4096);
    return classify(res.status, body);
  } catch (err) {
    const name = err instanceof Error ? err.name : "";
    return unreachable(name === "TimeoutError" ? "timeout" : "fetch failed");
  }
}

async function errorCheck(env: Env, now: number): Promise<void> {
  const end = Math.floor((now - LAG_MS) / WINDOW_MS) * WINDOW_MS;
  const start = end - WINDOW_MS;
  const failures = (await invocations(env, start, end)).filter(
    (r) => !OK_STATUSES.has(r.dimensions.status),
  );
  if (!failures.length) return;

  const lines = failures
    .sort((a, b) => b.sum.requests - a.sum.requests)
    .map(
      (r) =>
        `- **${r.dimensions.scriptName}** ${label(r.dimensions.status)}: ` +
        `${r.sum.requests}x (median CPU ${ms(r.quantiles.cpuTimeP50)})`,
    );
  await discord(
    env,
    `:rotating_light: **Worker failures** ${clock(start)}-${clock(end)} UTC\n` +
      lines.join("\n") +
      `\n${dashboardLink(env)}`,
  );
}

async function dailyDigest(env: Env, now: number): Promise<void> {
  const end = Date.UTC(
    new Date(now).getUTCFullYear(),
    new Date(now).getUTCMonth(),
    new Date(now).getUTCDate(),
  );
  const start = end - 86_400_000;
  const rows = await invocations(env, start, end);

  const byScript = new Map<string, { total: number; failed: number; cpuLimit: number }>();
  for (const r of rows) {
    const s = byScript.get(r.dimensions.scriptName) ?? { total: 0, failed: 0, cpuLimit: 0 };
    s.total += r.sum.requests;
    if (!OK_STATUSES.has(r.dimensions.status)) s.failed += r.sum.requests;
    if (r.dimensions.status === "exceededResources") s.cpuLimit += r.sum.requests;
    byScript.set(r.dimensions.scriptName, s);
  }

  const total = [...byScript.values()].reduce((n, s) => n + s.total, 0);
  const pct = (total / FREE_DAILY_REQUESTS) * 100;
  const anyFailures = [...byScript.values()].some((s) => s.failed > 0);
  const icon = pct >= 80 || anyFailures ? ":warning:" : ":white_check_mark:";

  const lines = [...byScript.entries()]
    .sort((a, b) => b[1].total - a[1].total)
    .map(
      ([name, s]) =>
        `- **${name}**: ${s.total} requests, ${s.failed} failed` +
        (s.cpuLimit ? ` (${s.cpuLimit} CPU-limit)` : ""),
    );
  await discord(
    env,
    `${icon} **Workers daily digest** for ${new Date(start).toISOString().slice(0, 10)}\n` +
      `Requests: ${total.toLocaleString("en-US")} / ${FREE_DAILY_REQUESTS.toLocaleString("en-US")} free-plan cap (${pct.toFixed(1)}%)\n` +
      (lines.length ? lines.join("\n") : "- no invocations") +
      `\n${dashboardLink(env)}`,
  );
}

async function invocations(env: Env, start: number, end: number): Promise<Row[]> {
  const res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.CF_API_TOKEN}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      query: QUERY,
      variables: {
        account: env.CF_ACCOUNT_ID,
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
      },
    }),
  });
  const body = (await res.json()) as {
    data?: { viewer: { accounts: { workersInvocationsAdaptive: Row[] }[] } };
    errors?: { message: string }[] | null;
  };
  if (!res.ok || body.errors?.length || !body.data) {
    // Surface watchdog breakage (expired token, schema change) instead of
    // going silent.
    const reason = body.errors?.map((e) => e.message).join("; ") || `HTTP ${res.status}`;
    await discord(env, `:x: **Watchdog** could not read Workers analytics: ${reason}`);
    return [];
  }
  return body.data.viewer.accounts[0]?.workersInvocationsAdaptive ?? [];
}

async function discord(env: Env, content: string): Promise<void> {
  // Discord caps message content at 2000 characters. No message from here
  // may ping anyone, whatever text it carries.
  const res = await fetch(env.DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ content: content.slice(0, 2000), allowed_mentions: { parse: [] } }),
  });
  if (!res.ok) console.error(`discord webhook failed: HTTP ${res.status}`);
}

function label(status: string): string {
  return STATUS_LABEL[status] ?? status;
}

// Analytics report CPU time in microseconds.
function ms(us: number): string {
  return `${(us / 1000).toFixed(1)}ms`;
}

function clock(t: number): string {
  return new Date(t).toISOString().slice(11, 16);
}

function dashboardLink(env: Env): string {
  return `<https://dash.cloudflare.com/${env.CF_ACCOUNT_ID}/workers-and-pages>`;
}
