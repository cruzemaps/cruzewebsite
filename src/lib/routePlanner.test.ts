// Pure-logic tests for the /route-planner savings math (fast Node env — no DOM).
// projectRouteSavings drives the headline "$X to $Y" span and tripChartData drives
// the area chart; both were inline in RoutePlanner.tsx and untested. Each numeric
// expectation is hardcoded AND independently re-derived from REGION_METRICS so a
// per-mile-band edit fails the test instead of silently sliding through.
import { describe, expect, it } from "vitest";
import {
  REGION_METRICS,
  TRIP_BUCKETS,
  projectRouteSavings,
  tripChartData,
  type RegionKey,
} from "./routePlanner";

const REGIONS = Object.keys(REGION_METRICS) as RegionKey[];

describe("REGION_METRICS table", () => {
  it("has the four region keys the USAMap dispatches", () => {
    expect(new Set(REGIONS)).toEqual(
      new Set(["southeast", "northeast", "southwest", "midwest"]),
    );
  });

  it("every region's perMileRange is an ascending [low, high] pair of positive rates", () => {
    for (const r of REGIONS) {
      const [lo, hi] = REGION_METRICS[r].perMileRange;
      expect(lo, r).toBeGreaterThan(0);
      expect(hi, r).toBeGreaterThan(lo);
    }
  });

  it("every region carries a non-empty label + centsMile display string", () => {
    for (const r of REGIONS) {
      expect(REGION_METRICS[r].label.length, r).toBeGreaterThan(0);
      expect(REGION_METRICS[r].centsMile.length, r).toBeGreaterThan(0);
    }
  });
});

describe("projectRouteSavings", () => {
  it("computes the southwest 100-trip headline span (golden + re-derived)", () => {
    // 500 mi route, southwest band 0.078–0.091 $/mi, 100 trips = 50,000 mi.
    const out = projectRouteSavings(500, "southwest");
    expect(out.low).toBe(3900); // 50000 * 0.078
    expect(out.high).toBe(4550); // 50000 * 0.091
    const m = REGION_METRICS.southwest;
    expect(out.low).toBe(Math.round(500 * 100 * m.perMileRange[0]));
    expect(out.high).toBe(Math.round(500 * 100 * m.perMileRange[1]));
  });

  it("low never exceeds high for any region at a non-trivial distance", () => {
    for (const r of REGIONS) {
      const { low, high } = projectRouteSavings(742, r);
      expect(low, r).toBeLessThanOrEqual(high);
    }
  });

  it("defaults to 100 trips but honors an explicit trip count", () => {
    const m = REGION_METRICS.northeast;
    const def = projectRouteSavings(300, "northeast");
    expect(def.low).toBe(Math.round(300 * 100 * m.perMileRange[0]));
    const ten = projectRouteSavings(300, "northeast", 10);
    expect(ten.low).toBe(Math.round(300 * 10 * m.perMileRange[0]));
    // 10 trips is one-tenth the mileage, so ~one-tenth the (rounded) savings.
    expect(ten.low).toBe(Math.round(def.low / 10));
  });

  it("rounds to whole dollars (no fractional cents leak into the headline)", () => {
    const { low, high } = projectRouteSavings(333, "midwest");
    expect(Number.isInteger(low)).toBe(true);
    expect(Number.isInteger(high)).toBe(true);
  });

  it("a zero-distance route projects zero savings", () => {
    expect(projectRouteSavings(0, "southeast")).toEqual({ low: 0, high: 0 });
  });
});

describe("tripChartData", () => {
  it("returns [] for a not-yet-selected route (distance 0) so the chart stays hidden", () => {
    expect(tripChartData(0, "southwest")).toEqual([]);
    expect(tripChartData(-5, "southwest")).toEqual([]);
  });

  it("emits one point per TRIP_BUCKET, labeled '<n> Trips'", () => {
    const data = tripChartData(100, "southeast");
    expect(data).toHaveLength(TRIP_BUCKETS.length);
    expect(data.map((d) => d.trips)).toEqual(TRIP_BUCKETS.map((t) => `${t} Trips`));
  });

  it("uses the midpoint of the region's per-mile band (golden + re-derived)", () => {
    // southeast band 0.098–0.115, midpoint 0.1065; 100 mi * 100 trips = 10,000 mi.
    const data = tripChartData(100, "southeast");
    const hundred = data.find((d) => d.trips === "100 Trips");
    expect(hundred?.Savings).toBe(1065); // 10000 * 0.1065
    const m = REGION_METRICS.southeast;
    const avg = (m.perMileRange[0] + m.perMileRange[1]) / 2;
    expect(hundred?.Savings).toBe(Math.round(100 * 100 * avg));
  });

  it("savings increase monotonically with the trip bucket", () => {
    const data = tripChartData(250, "midwest");
    for (let i = 1; i < data.length; i++) {
      expect(data[i].Savings).toBeGreaterThan(data[i - 1].Savings);
    }
  });

  it("the chart midpoint sits between the projection's low and high for the same trips", () => {
    // Sanity bridge between the two functions: the avg-band chart value for 100
    // trips must lie within the low/high projection span for 100 trips.
    const span = projectRouteSavings(420, "northeast", 100);
    const chart = tripChartData(420, "northeast").find((d) => d.trips === "100 Trips");
    expect(chart!.Savings).toBeGreaterThanOrEqual(span.low);
    expect(chart!.Savings).toBeLessThanOrEqual(span.high);
  });
});
