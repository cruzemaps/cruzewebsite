import { describe, expect, it } from "vitest";
import {
  QUIET_MS,
  classify,
  formatDuration,
  message,
  step,
  unreachable,
  type ProbeResult,
  type TargetState,
} from "./apiProbe";

const TARGET = "https://api.cruzemaps.com/health";
const T0 = Date.UTC(2026, 9, 21, 12, 0, 0);
const TICK = 5 * 60_000;

const ok: ProbeResult = { status: 200, cfCode: null, error: null };
const tunnelDown = classify(530, "<html>error code: 1033</html>");
const http502 = classify(502, "bad gateway");

/** Run `probes` through step() in order, returning each tick's alert. */
function run(start: TargetState | null, probes: ProbeResult[]) {
  let state = start;
  const alerts: (string | null)[] = [];
  const states: TargetState[] = [];
  probes.forEach((p, i) => {
    const r = step(state, p, T0 + i * TICK);
    alerts.push(r.alert);
    states.push(r.next);
    state = r.next;
  });
  return { alerts, states, state: state as TargetState };
}

describe("classify", () => {
  it("treats 200 as up", () => {
    expect(classify(200, "")).toEqual(ok);
  });

  it("reads the Cloudflare error code out of a 530 body", () => {
    expect(tunnelDown).toEqual({ status: 530, cfCode: 1033, error: null });
    expect(classify(530, "Error Code: 1016")).toMatchObject({ cfCode: 1016 });
  });

  it("leaves cfCode null for plain upstream errors", () => {
    expect(http502).toEqual({ status: 502, cfCode: null, error: null });
    expect(unreachable("timeout")).toEqual({ status: 0, cfCode: null, error: "timeout" });
  });
});

describe("step", () => {
  it("starts up with no alert on a fresh target", () => {
    const { alerts, state } = run(null, [ok]);
    expect(alerts).toEqual([null]);
    expect(state.up).toBe(true);
    expect(state.fails).toBe(0);
  });

  it("ignores a single blip", () => {
    const { alerts, state } = run(null, [ok, http502, ok]);
    expect(alerts).toEqual([null, null, null]);
    expect(state.up).toBe(true);
    expect(state.fails).toBe(0);
  });

  it("alerts down after two consecutive failures, once", () => {
    const { alerts, states } = run(null, [ok, tunnelDown, tunnelDown, tunnelDown]);
    expect(alerts).toEqual([null, null, "down", null]);
    // The outage is dated from the first failed probe, not the alert.
    expect(states[2].up).toBe(false);
    expect(states[2].since).toBe(T0 + TICK);
    expect(states[2].lastAlertAt).toBe(T0 + 2 * TICK);
    expect(states[2].fails).toBe(2);
  });

  it("does not alert if the state was never recorded and the first probe fails", () => {
    const { alerts } = run(null, [http502]);
    expect(alerts).toEqual([null]);
  });

  it("stays quiet for 30 minutes while down, then reminds", () => {
    // Ticks 0..1 fail -> down alert at tick 1 (T0 + 5m). Then 5-minute ticks.
    const probes = [tunnelDown, tunnelDown, ...Array(8).fill(tunnelDown)];
    const { alerts, states } = run(null, probes);
    expect(alerts[1]).toBe("down");
    // Ticks 2..6 are within 30 minutes of the alert at tick 1.
    expect(alerts.slice(2, 7)).toEqual([null, null, null, null, null]);
    // Tick 7 is exactly 30 minutes after the down alert.
    expect(alerts[7]).toBe("still");
    expect(states[7].lastAlertAt - states[1].lastAlertAt).toBe(QUIET_MS);
    expect(alerts.slice(8)).toEqual([null, null]);
  });

  it("always alerts recovery, with the state reset", () => {
    const down = run(null, [tunnelDown, tunnelDown, tunnelDown]).state;
    const r = step(down, ok, T0 + 3 * TICK);
    expect(r.alert).toBe("recovered");
    expect(r.next).toEqual({ up: true, since: T0 + 3 * TICK, fails: 0, lastAlertAt: null, last: ok });
  });

  it("recovers even inside the quiet period", () => {
    const { alerts } = run(null, [tunnelDown, tunnelDown, tunnelDown, ok]);
    expect(alerts).toEqual([null, "down", null, "recovered"]);
  });

  it("returns the same state object when nothing changed (no KV write)", () => {
    const first = step(null, ok, T0).next;
    expect(step(first, ok, T0 + TICK).next).toBe(first);
  });
});

describe("message", () => {
  it("names the tunnel case on a 530 with error 1033", () => {
    const { states } = run(null, [tunnelDown, tunnelDown]);
    const m = message("down", TARGET, states[0], states[1], T0 + TICK);
    expect(m).toContain("**API down** `/health`");
    expect(m).toContain("tunnel down (1033): the laptop cannot reach Cloudflare; containers are probably fine");
    expect(m).toContain("2 probes in a row");
    expect(m).toContain(`<${TARGET}>`);
    expect(m).not.toMatch(/@(everyone|here)/);
  });

  it("reports plain HTTP errors and unreachable targets", () => {
    const { states } = run(null, [http502, http502]);
    expect(message("down", TARGET, states[0], states[1], T0 + TICK)).toContain("HTTP 502.");
    const { states: s2 } = run(null, [unreachable("timeout"), unreachable("timeout")]);
    expect(message("down", TARGET, s2[0], s2[1], T0 + TICK)).toContain("unreachable (timeout)");
  });

  it("includes the outage duration on recovery", () => {
    const { states } = run(null, [tunnelDown, tunnelDown, tunnelDown]);
    const now = T0 + 95 * 60_000;
    const r = step(states[2], ok, now);
    const m = message("recovered", TARGET, states[2], r.next, now);
    expect(m).toContain("**API recovered** `/health`");
    expect(m).toContain("after 1h 35m down");
    expect(m).toContain("since 12:00 UTC");
  });

  it("includes how long the target has been down on a reminder", () => {
    const { states } = run(null, Array(8).fill(tunnelDown));
    const m = message("still", TARGET, states[6], states[7], T0 + 7 * TICK);
    expect(m).toContain("**API still down**");
    expect(m).toContain("Down for 35m");
  });
});

describe("formatDuration", () => {
  it("rounds to minutes and rolls into hours and days", () => {
    expect(formatDuration(20_000)).toBe("0m");
    expect(formatDuration(5 * 60_000)).toBe("5m");
    expect(formatDuration(60 * 60_000)).toBe("1h");
    expect(formatDuration(125 * 60_000)).toBe("2h 5m");
    expect(formatDuration(26 * 3_600_000)).toBe("1d 2h");
    expect(formatDuration(48 * 3_600_000)).toBe("2d");
  });
});
