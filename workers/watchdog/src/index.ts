// Cloudflare Worker: account-wide watchdog for the Cruze Workers.
//
// Cron-only (see wrangler.jsonc), no public routes.
//   */5 * * * *  — posts to Discord when any Worker threw, hit the CPU limit,
//                  or otherwise failed in the last check window.
//   0 14 * * *   — daily digest: yesterday's requests vs the free-plan cap,
//                  failures per Worker. Doubles as a heartbeat: if the digest
//                  stops arriving, the watchdog itself is broken.
//
// Data comes from the GraphQL Analytics API, which needs a token scoped to
// Account Analytics: Read. Both secrets are set via `wrangler secret put`.

interface Env {
  CF_ACCOUNT_ID: string;
  CF_API_TOKEN: string;
  DISCORD_WEBHOOK_URL: string;
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

export default {
  async scheduled(controller: ScheduledController, env: Env): Promise<void> {
    if (!env.CF_API_TOKEN || !env.DISCORD_WEBHOOK_URL) {
      console.warn("watchdog idle: CF_API_TOKEN / DISCORD_WEBHOOK_URL not set");
      return;
    }
    if (controller.cron === "0 14 * * *") {
      await dailyDigest(env, controller.scheduledTime);
    } else {
      await errorCheck(env, controller.scheduledTime);
    }
  },
};

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
  // Discord caps message content at 2000 characters.
  const res = await fetch(env.DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ content: content.slice(0, 2000) }),
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
