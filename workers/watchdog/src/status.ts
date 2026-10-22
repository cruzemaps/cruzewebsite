// Public status page for status.cruzemaps.com. Pure: no Workers-runtime
// imports, so it is tested from the root Vitest suite like apiProbe.ts.
// index.ts does the fetches and the KV read/write.
//
// Each 5-minute tick turns the probes into one state per public component and
// runs it through `advance`, which keeps one StatusRecord in KV. To stay far
// under the free plan's 1,000 KV writes a day, the record is written only when
// a component's state changes, plus one heartbeat at most every HEARTBEAT_MS
// so "Last check" stays fresh. The page itself only reads that record.
//
// What the page may show: the component names below, their states, check
// times and state changes. Never a probed URL, an HTTP status, an error body
// or anything about Discord.

export type State = "operational" | "degraded" | "down";
export type Shown = State | "unknown";
export type ComponentId = "website" | "api" | "client" | "driver" | "admin";

export const COMPONENTS: readonly { id: ComponentId; name: string }[] = [
  { id: "website", name: "Website (cruzemaps.com)" },
  { id: "api", name: "Platform API" },
  { id: "client", name: "Client Portal" },
  { id: "driver", name: "Driver Web App" },
  { id: "admin", name: "Admin Website" },
];

export type PageId = Exclude<ComponentId, "api">;

/** Pages probed only for this status page. `login`: the host sits behind
 *  Vercel Authentication on purpose, so a redirect to the Vercel login is up. */
export const PAGE_CHECKS: Record<PageId, { url: string; login: boolean }> = {
  website: { url: "https://cruzemaps.com/", login: false },
  client: { url: "https://client.cruzemaps.com/", login: true },
  driver: { url: "https://driver.cruzemaps.com/", login: true },
  admin: { url: "https://admin.cruzemaps.com/", login: true },
};

// Targets the Discord probe already watches (apiProbe.ts TARGETS). Their
// TargetState is reused here, so the page and the alerts agree on "down".
export const API_HEALTH = "https://api.cruzemaps.com/health";
export const API_READY = "https://api.cruzemaps.com/readyz";
export const PORTAL_JOBS = "https://cruze-jobs-tick.cruzemaps.workers.dev/health";

export const STATUS_KEY = "status:v1";
export const HEARTBEAT_MS = 10 * 60_000;
/** Two heartbeats plus a tick: older than this, the checks have stopped. */
export const STALE_MS = 25 * 60_000;
export const HISTORY_KEEP = 10;

export interface Change {
  at: number;
  id: ComponentId;
  from: State;
  to: State;
}

export interface StatusRecord {
  checkedAt: number;
  components: Partial<Record<ComponentId, { state: State; since: number }>>;
  /** Newest first. */
  history: Change[];
}

const REDIRECTS = new Set([301, 302, 303, 307, 308]);

export function pageUp(login: boolean, status: number, location: string | null): boolean {
  if (status >= 200 && status < 300) return true;
  if (!login || !REDIRECTS.has(status) || !location) return false;
  try {
    const to = new URL(location);
    return (
      to.protocol === "https:" &&
      to.hostname === "vercel.com" &&
      (to.pathname.startsWith("/sso-api") || to.pathname.startsWith("/login"))
    );
  } catch {
    return false;
  }
}

/** One state per component from this tick's page checks and the Discord
 *  probe's target states. A target with no state yet counts as up, as in
 *  apiProbe.step. */
export function observe(
  pages: Record<PageId, boolean>,
  targets: ReadonlyMap<string, { up: boolean }>,
): Record<ComponentId, State> {
  const up = (t: string) => targets.get(t)?.up ?? true;
  const page = (id: PageId): State => (pages[id] ? "operational" : "down");
  return {
    website: page("website"),
    api: !up(API_HEALTH) ? "down" : up(API_READY) ? "operational" : "degraded",
    client: !pages.client ? "down" : up(PORTAL_JOBS) ? "operational" : "degraded",
    driver: page("driver"),
    admin: page("admin"),
  };
}

export function advance(
  prev: StatusRecord | null,
  observed: Record<ComponentId, State>,
  now: number,
): { next: StatusRecord; write: boolean } {
  const components: StatusRecord["components"] = {};
  const changes: Change[] = [];
  let changed = !prev;
  for (const { id } of COMPONENTS) {
    const was = prev?.components[id];
    const to = observed[id];
    if (was?.state === to) {
      components[id] = was;
      continue;
    }
    changed = true;
    components[id] = { state: to, since: now };
    // A component seen for the first time is not a state change.
    if (was) changes.push({ at: now, id, from: was.state, to });
  }
  if (prev && !changed && now - prev.checkedAt < HEARTBEAT_MS) return { next: prev, write: false };
  const history = [...changes, ...(prev?.history ?? [])].slice(0, HISTORY_KEEP);
  return { next: { checkedAt: now, components, history }, write: true };
}

export interface StatusView {
  status: Shown;
  checkedAt: string | null;
  stale: boolean;
  components: { id: ComponentId; name: string; status: Shown; since: string | null }[];
  history: { at: string; id: ComponentId; name: string; from: State; to: State }[];
}

const NAME = Object.fromEntries(COMPONENTS.map((c) => [c.id, c.name])) as Record<ComponentId, string>;
const iso = (t: number) => new Date(t).toISOString();

export function view(record: StatusRecord | null, now: number): StatusView {
  const components = COMPONENTS.map(({ id, name }) => {
    const c = record?.components[id];
    return { id, name, status: (c?.state ?? "unknown") as Shown, since: c ? iso(c.since) : null };
  });
  const stale = !!record && now - record.checkedAt > STALE_MS;
  const shown = components.map((c) => c.status);
  const status: Shown =
    !record || stale || shown.includes("unknown")
      ? "unknown"
      : shown.includes("down")
        ? "down"
        : shown.includes("degraded")
          ? "degraded"
          : "operational";
  return {
    status,
    checkedAt: record ? iso(record.checkedAt) : null,
    stale,
    components,
    history: (record?.history ?? []).map((h) => ({ at: iso(h.at), id: h.id, name: NAME[h.id], from: h.from, to: h.to })),
  };
}

const LABEL: Record<Shown, string> = {
  operational: "Operational",
  degraded: "Degraded",
  down: "Down",
  unknown: "No data",
};

const HEADLINE: Record<Shown, string> = {
  operational: "All systems operational",
  degraded: "Some systems are degraded",
  down: "Some systems are down",
  unknown: "Status unknown",
};

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function when(isoTime: string): string {
  return `<time datetime="${esc(isoTime)}">${esc(isoTime.slice(0, 16).replace("T", " "))} UTC</time>`;
}

export function renderHtml(v: StatusView): string {
  const note = !v.checkedAt
    ? "No checks have been recorded yet."
    : v.stale
      ? `Checks are delayed: the last one ran at ${when(v.checkedAt)}.`
      : `Last check ${when(v.checkedAt)}. Checks run every 5 minutes.`;
  const rows = v.components
    .map(
      (c) =>
        `<li><div><span class="name">${esc(c.name)}</span>` +
        (c.since ? `<span class="since">Since ${when(c.since)}</span>` : "") +
        `</div><span class="pill ${c.status}">${LABEL[c.status]}</span></li>`,
    )
    .join("");
  const changes = v.history.length
    ? `<ol class="changes">${v.history
        .map(
          (h) =>
            `<li>${when(h.at)}<span>${esc(h.name)}: ${LABEL[h.from]} to ` +
            `<b class="${h.to}">${LABEL[h.to]}</b></span></li>`,
        )
        .join("")}</ol>`
    : `<p class="muted">No state changes recorded yet.</p>`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="refresh" content="300">
<title>Cruze Status</title>
<meta name="description" content="Live status of the Cruze website, Platform API and portals.">
<link rel="icon" href="https://cruzemaps.com/favicon.ico">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap">
<style>
:root{--bg:hsl(222 47% 6%);--bg2:hsl(222 47% 3%);--card:hsl(222 47% 8%);--border:hsl(222 30% 18%);--fg:hsl(210 40% 98%);--muted:hsl(215 20% 55%);--orange:#E8590C;--ok:#22C55E;--warn:#EAB308;--bad:hsl(0 84% 60%)}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;color:var(--fg);background:linear-gradient(180deg,var(--bg) 0%,var(--bg2) 100%);font:16px/1.5 'Inter Tight','Inter',ui-sans-serif,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
main{max-width:720px;margin:0 auto;padding:32px 16px 48px}
h1,h2,.brand{font-family:'Space Grotesk',ui-sans-serif,system-ui,sans-serif}
a{color:inherit}
header{display:flex;align-items:center;justify-content:space-between;margin-bottom:32px}
.brand{display:flex;align-items:center;gap:12px;font-weight:700;font-size:20px;text-decoration:none;letter-spacing:.02em}
.brand img{height:32px;width:auto}
.tag{color:var(--muted);font-size:14px}
.banner{border:1px solid var(--border);border-left:4px solid var(--muted);background:var(--card);border-radius:12px;padding:20px 24px;margin-bottom:32px}
.banner.operational{border-left-color:var(--ok)}.banner.degraded{border-left-color:var(--warn)}.banner.down{border-left-color:var(--bad)}
.banner h1{margin:0 0 4px;font-size:24px;line-height:1.25}
.banner p,.muted{margin:0;color:var(--muted);font-size:14px}
h2{font-size:16px;margin:0 0 12px}
ul,ol{list-style:none;margin:0 0 32px;padding:0;border:1px solid var(--border);border-radius:12px;background:var(--card);overflow:hidden}
li{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 20px}
li+li{border-top:1px solid var(--border)}
.name{display:block;font-weight:600}
.since{display:block;color:var(--muted);font-size:13px}
.pill{flex:none;font-size:13px;font-weight:600;padding:4px 10px;border-radius:999px;border:1px solid currentColor}
.operational{color:var(--ok)}.degraded{color:var(--warn)}.down{color:var(--bad)}.unknown{color:var(--muted)}
.changes li{justify-content:flex-start;font-size:14px}
.changes time{flex:none;color:var(--muted);min-width:150px}
.changes b{font-weight:600}
footer{display:flex;gap:16px;color:var(--muted);font-size:13px}
footer a:hover,.brand:hover{color:var(--orange)}
@media (max-width:480px){.changes li{flex-direction:column;align-items:flex-start;gap:2px}}
</style>
</head>
<body>
<main>
<header><a class="brand" href="https://cruzemaps.com"><img src="https://cruzemaps.com/logo.png" alt="">CRUZE</a><span class="tag">System status</span></header>
<section class="banner ${v.status}"><h1>${HEADLINE[v.status]}</h1><p>${note}</p></section>
<h2>Components</h2>
<ul>${rows}</ul>
<h2>Recent changes</h2>
${changes}
<footer><a href="https://cruzemaps.com">cruzemaps.com</a><a href="/status.json">status.json</a></footer>
</main>
</body>
</html>
`;
}

const CSP =
  "default-src 'none'; img-src https://cruzemaps.com; style-src 'unsafe-inline' https://fonts.googleapis.com; " +
  "font-src https://fonts.gstatic.com; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";

/** The public routes: GET or HEAD on / (HTML) and /status.json. */
export function respond(method: string, pathname: string, record: StatusRecord | null, now: number): Response {
  if (method !== "GET" && method !== "HEAD") {
    return new Response("Method not allowed\n", { status: 405, headers: { allow: "GET, HEAD" } });
  }
  if (pathname !== "/" && pathname !== "/status.json") return new Response("Not found\n", { status: 404 });
  const v = view(record, now);
  const isJson = pathname === "/status.json";
  const headers: Record<string, string> = {
    "content-type": isJson ? "application/json; charset=utf-8" : "text/html; charset=utf-8",
    "cache-control": "public, max-age=60",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
    ...(isJson ? { "access-control-allow-origin": "*" } : { "content-security-policy": CSP }),
  };
  const body = isJson ? JSON.stringify(v, null, 2) + "\n" : renderHtml(v);
  return new Response(method === "HEAD" ? null : body, { status: 200, headers });
}
