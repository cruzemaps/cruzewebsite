import { describe, expect, it } from "vitest";
import { TARGETS } from "./apiProbe";
import {
  API_HEALTH,
  API_READY,
  COMPONENTS,
  HEARTBEAT_MS,
  HISTORY_KEEP,
  PAGE_CHECKS,
  PORTAL_JOBS,
  STALE_MS,
  advance,
  observe,
  pageUp,
  renderHtml,
  respond,
  view,
  type ComponentId,
  type PageId,
  type State,
  type StatusRecord,
} from "./status";

const T0 = Date.UTC(2026, 9, 22, 15, 0, 0);
const TICK = 5 * 60_000;
const LOGIN = "https://vercel.com/sso-api?url=https%3A%2F%2Fclient.cruzemaps.com%2F&nonce=abc";

const allPagesUp: Record<PageId, boolean> = { website: true, client: true, driver: true, admin: true };
const allUp: Record<ComponentId, State> = {
  website: "operational",
  api: "operational",
  client: "operational",
  driver: "operational",
  admin: "operational",
};
const targets = (down: string[] = []) => new Map(TARGETS.map((t) => [t, { up: !down.includes(t) }]));

describe("pageUp", () => {
  it("treats 2xx as up", () => {
    expect(pageUp(false, 200, null)).toBe(true);
    expect(pageUp(true, 204, null)).toBe(true);
  });

  it("treats a redirect to the Vercel login as up on a protected portal", () => {
    expect(pageUp(true, 302, LOGIN)).toBe(true);
    expect(pageUp(true, 307, "https://vercel.com/login?next=%2F")).toBe(true);
  });

  it("does not accept that redirect for the public website", () => {
    expect(pageUp(false, 302, LOGIN)).toBe(false);
  });

  it("treats other redirects, errors and bad locations as down", () => {
    expect(pageUp(true, 302, "https://evil.example/sso-api")).toBe(false);
    expect(pageUp(true, 302, "https://vercel.com.evil.example/sso-api")).toBe(false);
    expect(pageUp(true, 302, "http://vercel.com/sso-api")).toBe(false);
    expect(pageUp(true, 302, "/sso-api")).toBe(false);
    expect(pageUp(true, 302, null)).toBe(false);
    expect(pageUp(true, 404, null)).toBe(false);
    expect(pageUp(true, 500, null)).toBe(false);
    expect(pageUp(false, 0, null)).toBe(false);
  });

  it("checks the website without the login exception and every portal with it", () => {
    expect(PAGE_CHECKS.website.login).toBe(false);
    expect([PAGE_CHECKS.client, PAGE_CHECKS.driver, PAGE_CHECKS.admin].every((c) => c.login)).toBe(true);
  });
});

describe("observe", () => {
  it("reuses targets the Discord probe already watches", () => {
    expect(TARGETS).toEqual(expect.arrayContaining([API_HEALTH, API_READY, PORTAL_JOBS]));
  });

  it("is all operational when everything is up", () => {
    expect(observe(allPagesUp, targets())).toEqual(allUp);
  });

  it("marks the API down when /health is down and degraded when only /readyz is", () => {
    expect(observe(allPagesUp, targets([API_HEALTH, API_READY])).api).toBe("down");
    expect(observe(allPagesUp, targets([API_READY])).api).toBe("degraded");
  });

  it("marks the client portal degraded when its background jobs are down", () => {
    expect(observe(allPagesUp, targets([PORTAL_JOBS])).client).toBe("degraded");
    expect(observe({ ...allPagesUp, client: false }, targets([PORTAL_JOBS])).client).toBe("down");
  });

  it("marks a page down when its check failed", () => {
    const seen = observe({ ...allPagesUp, website: false, admin: false }, targets());
    expect(seen).toEqual({ ...allUp, website: "down", admin: "down" });
  });

  it("counts a target with no recorded state as up", () => {
    expect(observe(allPagesUp, new Map())).toEqual(allUp);
  });
});

describe("advance", () => {
  it("writes the first record with every component and no history", () => {
    const { next, write } = advance(null, allUp, T0);
    expect(write).toBe(true);
    expect(next.checkedAt).toBe(T0);
    expect(next.history).toEqual([]);
    expect(Object.keys(next.components).sort()).toEqual(COMPONENTS.map((c) => c.id).sort());
    expect(next.components.api).toEqual({ state: "operational", since: T0 });
  });

  it("skips the write when nothing changed inside the heartbeat window", () => {
    const first = advance(null, allUp, T0).next;
    const r = advance(first, allUp, T0 + TICK);
    expect(r.write).toBe(false);
    expect(r.next).toBe(first);
  });

  it("writes a heartbeat after ten minutes with no history entry", () => {
    const first = advance(null, allUp, T0).next;
    const r = advance(first, allUp, T0 + HEARTBEAT_MS);
    expect(r.write).toBe(true);
    expect(r.next.checkedAt).toBe(T0 + HEARTBEAT_MS);
    expect(r.next.history).toEqual([]);
    expect(r.next.components.api.since).toBe(T0);
  });

  it("writes a state change at once and records it", () => {
    const first = advance(null, allUp, T0).next;
    const r = advance(first, { ...allUp, api: "down" }, T0 + TICK);
    expect(r.write).toBe(true);
    expect(r.next.components.api).toEqual({ state: "down", since: T0 + TICK });
    expect(r.next.components.website).toBe(first.components.website);
    expect(r.next.history).toEqual([{ at: T0 + TICK, id: "api", from: "operational", to: "down" }]);
  });

  it("keeps the newest changes first, capped", () => {
    let rec = advance(null, allUp, T0).next;
    for (let i = 1; i <= HISTORY_KEEP + 5; i++) {
      rec = advance(rec, { ...allUp, driver: i % 2 ? "down" : "operational" }, T0 + i * TICK).next;
    }
    expect(rec.history).toHaveLength(HISTORY_KEEP);
    expect(rec.history[0].at).toBe(T0 + (HISTORY_KEEP + 5) * TICK);
    expect(rec.history[0].at).toBeGreaterThan(rec.history[1].at);
  });

  it("adds a component missing from an older record without calling it a change", () => {
    const old: StatusRecord = { checkedAt: T0, components: { website: { state: "operational", since: T0 } }, history: [] };
    const r = advance(old, allUp, T0 + TICK);
    expect(r.write).toBe(true);
    expect(r.next.history).toEqual([]);
  });

  it("stays far under the free plan's 1,000 KV writes a day", () => {
    // A steady day of 5-minute ticks, plus one short outage of the API.
    let rec: StatusRecord | null = null;
    let writes = 0;
    for (let i = 0; i < 288; i++) {
      const seen = i >= 100 && i < 104 ? { ...allUp, api: "down" as State } : allUp;
      const r = advance(rec, seen, T0 + i * TICK);
      if (r.write) writes++;
      rec = r.next;
    }
    expect(writes).toBeLessThanOrEqual(24 * 6 + 2);
  });
});

describe("view", () => {
  const steady = advance(null, allUp, T0).next;

  it("reports unknown before any check ran", () => {
    const v = view(null, T0);
    expect(v.status).toBe("unknown");
    expect(v.checkedAt).toBeNull();
    expect(v.components.every((c) => c.status === "unknown" && c.since === null)).toBe(true);
  });

  it("rolls the components up into one overall status", () => {
    expect(view(steady, T0).status).toBe("operational");
    const degraded = advance(steady, { ...allUp, api: "degraded" }, T0 + TICK).next;
    expect(view(degraded, T0 + TICK).status).toBe("degraded");
    const down = advance(degraded, { ...allUp, api: "degraded", admin: "down" }, T0 + 2 * TICK).next;
    expect(view(down, T0 + 2 * TICK).status).toBe("down");
  });

  it("goes unknown and stale when the checks stop", () => {
    expect(view(steady, T0 + STALE_MS).stale).toBe(false);
    const v = view(steady, T0 + STALE_MS + 1);
    expect(v.stale).toBe(true);
    expect(v.status).toBe("unknown");
    expect(v.components[0].status).toBe("operational");
  });

  it("names each change with the public component name", () => {
    const rec = advance(steady, { ...allUp, client: "down" }, T0 + TICK).next;
    expect(view(rec, T0 + TICK).history).toEqual([
      { at: new Date(T0 + TICK).toISOString(), id: "client", name: "Client Portal", from: "operational", to: "down" },
    ]);
  });
});

describe("respond", () => {
  const rec = advance(advance(null, allUp, T0).next, { ...allUp, api: "down", client: "degraded" }, T0 + TICK).next;
  const NOW = T0 + 2 * TICK;

  it("serves the HTML page on /", async () => {
    const res = respond("GET", "/", rec, NOW);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("text/html; charset=utf-8");
    expect(res.headers.get("content-security-policy")).toContain("default-src 'none'");
    const html = await res.text();
    expect(html).toContain("<title>Cruze Status</title>");
    expect(html).toContain("Some systems are down");
    for (const c of COMPONENTS) expect(html).toContain(c.name);
    expect(html).toContain('class="pill down">Down');
    expect(html).toContain('class="pill degraded">Degraded');
    expect(html).toContain("Last check <time datetime=\"2026-10-22T15:05:00.000Z\">2026-10-22 15:05 UTC</time>");
    expect(html).toContain("Platform API: Operational to <b class=\"down\">Down</b>");
  });

  it("serves the same data on /status.json", async () => {
    const res = respond("GET", "/status.json", rec, NOW);
    expect(res.headers.get("content-type")).toBe("application/json; charset=utf-8");
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    const body = await res.json();
    expect(body).toEqual(JSON.parse(JSON.stringify(view(rec, NOW))));
    expect(body.status).toBe("down");
    expect(body.components.map((c: { name: string }) => c.name)).toEqual(COMPONENTS.map((c) => c.name));
  });

  it("never shows a probed host, a status code or Discord", async () => {
    for (const path of ["/", "/status.json"]) {
      const text = await respond("GET", path, rec, NOW).text();
      for (const secret of [
        "api.cruzemaps.com",
        "client.cruzemaps.com",
        "driver.cruzemaps.com",
        "admin.cruzemaps.com",
        "workers.dev",
        "jobs-tick",
        "/health",
        "/readyz",
        "vercel",
        "HTTP ",
        "discord",
        "Discord",
      ]) {
        expect(text, `${path} leaks ${secret}`).not.toContain(secret);
      }
    }
  });

  it("answers HEAD with headers only", async () => {
    const res = respond("HEAD", "/status.json", rec, NOW);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("");
  });

  it("404s other paths and 405s other methods", () => {
    expect(respond("GET", "/admin", rec, NOW).status).toBe(404);
    expect(respond("GET", "/status.json/", rec, NOW).status).toBe(404);
    const post = respond("POST", "/", rec, NOW);
    expect(post.status).toBe(405);
    expect(post.headers.get("allow")).toBe("GET, HEAD");
  });

  it("renders before the first check", () => {
    const html = renderHtml(view(null, T0));
    expect(html).toContain("Status unknown");
    expect(html).toContain("No checks have been recorded yet.");
    expect(html).toContain("No state changes recorded yet.");
    expect(html).toContain("Website (cruzemaps.com)");
  });
});
