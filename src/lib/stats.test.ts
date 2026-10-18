// Pure-logic tests for the /stats page data resolution (fast Node env, no DOM).
// resolveLiveStats decides whether the public page shows the live RPC row or an
// honest "unavailable" state. It must never substitute invented numbers.
import { describe, expect, it } from "vitest";
import * as statsModule from "./stats";
import { type LiveStats, resolveLiveStats } from "./stats";

const liveRow: LiveStats = { active_pilots: 30, total_fleets: 88, total_cities: 9 };

describe("stats module", () => {
  it("exports no fallback numbers and no CO2 estimate", () => {
    expect(Object.keys(statsModule).sort()).toEqual(["resolveLiveStats"]);
  });
});

describe("resolveLiveStats", () => {
  it("returns the first RPC row when the call succeeded with data", () => {
    const out = resolveLiveStats([liveRow], null);
    expect(out).toBe(liveRow); // identity, no copy or transform
  });

  it("returns ONLY the first row when the RPC returns several", () => {
    const second: LiveStats = { active_pilots: 1, total_fleets: 1, total_cities: 1 };
    expect(resolveLiveStats([liveRow, second], null)).toBe(liveRow);
  });

  it("returns null when data is null (RPC missing or not configured)", () => {
    expect(resolveLiveStats(null, null)).toBeNull();
  });

  it("returns null when data is undefined", () => {
    expect(resolveLiveStats(undefined, null)).toBeNull();
  });

  it("returns null on an empty result array (success but no rows)", () => {
    expect(resolveLiveStats([], null)).toBeNull();
  });

  it("returns null when the RPC reported an error, even though data is present", () => {
    // A partial or failed RPC result must not be shown as live.
    expect(resolveLiveStats([liveRow], { message: "boom" })).toBeNull();
  });

  it("treats any truthy error as a failure (string, object, number)", () => {
    expect(resolveLiveStats([liveRow], "rate limited")).toBeNull();
    expect(resolveLiveStats([liveRow], 500)).toBeNull();
    expect(resolveLiveStats([liveRow], { code: "PGRST" })).toBeNull();
  });

  it("returns null when the first row itself is falsy (null hole in the array)", () => {
    expect(resolveLiveStats([null as unknown as LiveStats], null)).toBeNull();
  });

  it("does not treat falsy-but-present errors (false/0/'') as failures", () => {
    // Supabase signals success with error === null; guard only on truthiness.
    expect(resolveLiveStats([liveRow], false)).toBe(liveRow);
    expect(resolveLiveStats([liveRow], 0)).toBe(liveRow);
    expect(resolveLiveStats([liveRow], "")).toBe(liveRow);
  });
});
