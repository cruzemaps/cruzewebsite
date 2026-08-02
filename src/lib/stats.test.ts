// Pure-logic tests for the /stats ("live impact") page (fast Node env — no DOM).
// resolveLiveStats decides whether the public page shows the live RPC row or the
// illustrative fallback (it must never render empty / 500 when the DB is absent),
// and co2TonsFromStats drives the headline "Tons CO₂ avoided" tile. Both were
// inline in Stats.tsx and untested. Each numeric expectation is hardcoded AND
// re-derived from CO2_TONS_PER_PILOT_MONTH so a rate edit fails the test.
import { describe, expect, it } from "vitest";
import {
  type LiveStats,
  CO2_TONS_PER_PILOT_MONTH,
  FALLBACK_STATS,
  co2TonsFromStats,
  resolveLiveStats,
} from "./stats";

const liveRow: LiveStats = { active_pilots: 30, total_fleets: 88, total_cities: 9 };

describe("FALLBACK_STATS", () => {
  it("is the illustrative trio the page renders without a DB", () => {
    // Pinned so a fallback edit is a deliberate, reviewed change (this is the
    // public-facing number when Supabase is missing).
    expect(FALLBACK_STATS).toEqual({
      active_pilots: 12,
      total_fleets: 47,
      total_cities: 4,
    });
  });

  it("has the same shape (keys) as a live RPC row", () => {
    expect(Object.keys(FALLBACK_STATS).sort()).toEqual(
      Object.keys(liveRow).sort(),
    );
  });
});

describe("resolveLiveStats", () => {
  it("returns the first RPC row when the call succeeded with data", () => {
    const out = resolveLiveStats([liveRow], null);
    expect(out).toBe(liveRow); // identity — no copy/transform
  });

  it("returns ONLY the first row when the RPC returns several", () => {
    const second: LiveStats = { active_pilots: 1, total_fleets: 1, total_cities: 1 };
    expect(resolveLiveStats([liveRow, second], null)).toBe(liveRow);
  });

  it("falls back when data is null (RPC missing / not configured)", () => {
    expect(resolveLiveStats(null, null)).toBe(FALLBACK_STATS);
  });

  it("falls back when data is undefined", () => {
    expect(resolveLiveStats(undefined, null)).toBe(FALLBACK_STATS);
  });

  it("falls back on an empty result array (success but no rows)", () => {
    expect(resolveLiveStats([], null)).toBe(FALLBACK_STATS);
  });

  it("falls back when the RPC reported an error, even though data is present", () => {
    // The error guard must win over present data — a partial/failed RPC result
    // should not be shown as live.
    expect(resolveLiveStats([liveRow], { message: "boom" })).toBe(FALLBACK_STATS);
  });

  it("treats any truthy error as a failure (string, object, number)", () => {
    expect(resolveLiveStats([liveRow], "rate limited")).toBe(FALLBACK_STATS);
    expect(resolveLiveStats([liveRow], 500)).toBe(FALLBACK_STATS);
    expect(resolveLiveStats([liveRow], { code: "PGRST" })).toBe(FALLBACK_STATS);
  });

  it("falls back when the first row itself is falsy (null hole in the array)", () => {
    // data[0] guard: a null/undefined first element must not be returned as stats.
    expect(resolveLiveStats([null as unknown as LiveStats], null)).toBe(
      FALLBACK_STATS,
    );
  });

  it("does not treat falsy-but-present errors (false/0/'') as failures", () => {
    // Supabase signals success with error === null; guard only on truthiness so a
    // (hypothetical) falsy non-null error still counts as success with data.
    expect(resolveLiveStats([liveRow], false)).toBe(liveRow);
    expect(resolveLiveStats([liveRow], 0)).toBe(liveRow);
    expect(resolveLiveStats([liveRow], "")).toBe(liveRow);
  });
});

describe("co2TonsFromStats", () => {
  it("is 0 before stats load (null) — matches the page's loading state", () => {
    expect(co2TonsFromStats(null)).toBe(0);
  });

  it("is 0 for undefined", () => {
    expect(co2TonsFromStats(undefined)).toBe(0);
  });

  it("multiplies active pilots by the per-pilot monthly rate", () => {
    // Hardcoded 540 AND re-derived so a rate change fails here.
    expect(co2TonsFromStats(liveRow)).toBe(540);
    expect(co2TonsFromStats(liveRow)).toBe(
      liveRow.active_pilots * CO2_TONS_PER_PILOT_MONTH,
    );
  });

  it("uses the fallback's pilot count for the fallback CO2 tile", () => {
    // 12 * 18 = 216 — the number the page shows with no DB.
    expect(co2TonsFromStats(FALLBACK_STATS)).toBe(216);
    expect(co2TonsFromStats(FALLBACK_STATS)).toBe(
      FALLBACK_STATS.active_pilots * CO2_TONS_PER_PILOT_MONTH,
    );
  });

  it("rounds a fractional product to whole tons", () => {
    // 5 * 18 = 90 stays integer; prove rounding by using a fractional count.
    // 1.5 * 18 = 27 (exact), 1.4 * 18 = 25.2 -> 25, 1.49 * 18 = 26.82 -> 27.
    expect(co2TonsFromStats({ ...liveRow, active_pilots: 1.4 })).toBe(25);
    expect(co2TonsFromStats({ ...liveRow, active_pilots: 1.49 })).toBe(27);
  });

  it("ignores total_fleets / total_cities — only active_pilots drives CO2", () => {
    const a = co2TonsFromStats({ active_pilots: 7, total_fleets: 0, total_cities: 0 });
    const b = co2TonsFromStats({ active_pilots: 7, total_fleets: 999, total_cities: 999 });
    expect(a).toBe(b);
    expect(a).toBe(7 * CO2_TONS_PER_PILOT_MONTH);
  });

  it("is 0 when there are zero active pilots", () => {
    expect(co2TonsFromStats({ ...liveRow, active_pilots: 0 })).toBe(0);
  });
});
