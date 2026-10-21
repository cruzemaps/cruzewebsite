// Pure state machine for the api.cruzemaps.com uptime probe. No I/O here so
// it can be unit-tested from the root Vitest suite; index.ts does the fetch,
// the KV read/write and the Discord post.
//
// Per target the Worker keeps one TargetState in KV. Each 5-minute tick runs
// one probe through `step`, which returns the next state and which alert (if
// any) to send:
//   - "down"      after FAILS_BEFORE_ALERT consecutive failures (one blip is
//                 ignored), once.
//   - "still"     while the target stays down, at most once per QUIET_MS.
//   - "recovered" on the first 200 after a down alert, always, with the
//                 outage duration measured from the first failed probe.

export const FAILS_BEFORE_ALERT = 2;
export const QUIET_MS = 30 * 60_000;

export const TARGETS = [
  "https://api.cruzemaps.com/health",
  "https://api.cruzemaps.com/readyz",
] as const;

export interface ProbeResult {
  /** HTTP status, or 0 when the request itself failed (timeout, DNS, TLS). */
  status: number;
  /** Cloudflare error code parsed from an error page body, e.g. 1033. */
  cfCode: number | null;
  /** Short reason for a status-0 result ("timeout", "fetch failed"). */
  error: string | null;
}

export interface TargetState {
  up: boolean;
  /** When the current up/down run started (first failed probe for a down run). */
  since: number;
  /** Consecutive failed probes, including the ones before the down alert. */
  fails: number;
  /** Last down/still alert for this run; null while up. */
  lastAlertAt: number | null;
  /** Last probe result, kept so a "still down" message can say what it sees. */
  last: ProbeResult;
}

export type Alert = "down" | "still" | "recovered" | null;

export function classify(status: number, body: string): ProbeResult {
  if (status === 200) return { status, cfCode: null, error: null };
  // Cloudflare error pages carry "error code: NNNN" in the body. 1033 on a 530
  // is "Argo Tunnel error": the tunnel from the laptop has no live connection.
  const m = /error code:\s*(\d{3,4})/i.exec(body);
  return { status, cfCode: m ? Number(m[1]) : null, error: null };
}

export function unreachable(error: string): ProbeResult {
  return { status: 0, cfCode: null, error };
}

export function isUp(r: ProbeResult): boolean {
  return r.status === 200;
}

export function step(
  prev: TargetState | null,
  probe: ProbeResult,
  now: number,
): { next: TargetState; alert: Alert } {
  const state: TargetState = prev ?? {
    up: true,
    since: now,
    fails: 0,
    lastAlertAt: null,
    last: probe,
  };

  if (isUp(probe)) {
    if (!state.up) {
      // Recovery: the down run ends. The duration is computed by the caller
      // from the previous state's `since`.
      return {
        next: { up: true, since: now, fails: 0, lastAlertAt: null, last: probe },
        alert: "recovered",
      };
    }
    // Up, possibly clearing a single blip. Only rewrite when something changed.
    if (state.fails === 0 && state.last.status === 200) return { next: state, alert: null };
    return { next: { ...state, fails: 0, last: probe }, alert: null };
  }

  const fails = state.fails + 1;
  if (state.up) {
    if (fails < FAILS_BEFORE_ALERT) {
      // First failure: remember when it started, but do not alert yet.
      return { next: { ...state, fails, since: state.fails === 0 ? now : state.since, last: probe }, alert: null };
    }
    return {
      next: { up: false, since: state.since, fails, lastAlertAt: now, last: probe },
      alert: "down",
    };
  }

  // Already down. Repeat at most once per quiet period.
  const due = state.lastAlertAt === null || now - state.lastAlertAt >= QUIET_MS;
  return {
    next: { ...state, fails, last: probe, lastAlertAt: due ? now : state.lastAlertAt },
    alert: due ? "still" : null,
  };
}

export function describe(r: ProbeResult): string {
  if (r.status === 0) return `unreachable (${r.error ?? "request failed"})`;
  if (r.status === 530 && r.cfCode === 1033) {
    return "HTTP 530, tunnel down (1033): the laptop cannot reach Cloudflare; containers are probably fine";
  }
  if (r.cfCode !== null) return `HTTP ${r.status}, Cloudflare error ${r.cfCode}`;
  return `HTTP ${r.status}`;
}

export function formatDuration(ms: number): string {
  const min = Math.max(0, Math.round(ms / 60_000));
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h < 24) return m ? `${h}h ${m}m` : `${h}h`;
  const d = Math.floor(h / 24);
  return h % 24 ? `${d}d ${h % 24}h` : `${d}d`;
}

function clock(t: number): string {
  return new Date(t).toISOString().slice(11, 16);
}

/** Discord message for an alert. Target URLs are wrapped in <> so Discord
 *  does not unfurl them. Nothing here comes from a secret or user input. */
export function message(alert: Exclude<Alert, null>, target: string, prev: TargetState | null, next: TargetState, now: number): string {
  const path = new URL(target).pathname;
  switch (alert) {
    case "down":
      return (
        `:rotating_light: **API down** \`${path}\`: ${describe(next.last)}. ` +
        `Failing since ${clock(next.since)} UTC (${next.fails} probes in a row). <${target}>`
      );
    case "still":
      return (
        `:rotating_light: **API still down** \`${path}\`: ${describe(next.last)}. ` +
        `Down for ${formatDuration(now - next.since)} (since ${clock(next.since)} UTC). <${target}>`
      );
    case "recovered": {
      const downSince = prev?.since ?? now;
      return (
        `:white_check_mark: **API recovered** \`${path}\`: HTTP 200 after ` +
        `${formatDuration(now - downSince)} down (since ${clock(downSince)} UTC). <${target}>`
      );
    }
  }
}
