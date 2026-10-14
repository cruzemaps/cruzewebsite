// Pure-logic tests for the lanes content store (runs in the fast Node env — no
// DOM needed). LANES is the programmatic-SEO source for /lanes and every
// /lanes/:slug page (scripts/prerender.mjs maps each slug to a baked route +
// sitemap entry), and findLane is the lookup the detail route uses to decide
// render-vs-redirect. Beyond the usual slug/field invariants these tests pin
// the cross-store contract the type only hints at: each lane's metroEndpoints
// must resolve to real cities.ts slugs, so a /lanes/:slug page never links to a
// /cities/:slug that 404s. No row count is asserted — the file is meant to grow.
import { describe, expect, it } from "vitest";
import { LANES, findLane } from "./lanes";
import { findCity } from "./cities";

describe("findLane", () => {
  it("returns the matching lane for a known slug", () => {
    const lane = findLane("los-angeles-to-phoenix");
    expect(lane).toBeDefined();
    expect(lane?.slug).toBe("los-angeles-to-phoenix");
    expect(lane?.origin).toBe("Los Angeles, CA");
  });

  it("returns undefined for an unknown slug (drives the detail-page redirect)", () => {
    expect(findLane("no-such-lane")).toBeUndefined();
  });

  it("is an exact match, not a prefix or substring match", () => {
    expect(findLane("los-angeles")).toBeUndefined();
    expect(findLane("los-angeles-to-phoenix-extra")).toBeUndefined();
  });

  it("does not match on a different-cased slug (URLs are case-sensitive here)", () => {
    expect(findLane("Los-Angeles-To-Phoenix")).toBeUndefined();
  });

  it("round-trips every entry's slug back to its identity object", () => {
    for (const lane of LANES) {
      expect(findLane(lane.slug), lane.slug).toBe(lane);
    }
  });
});

describe("LANES store invariants", () => {
  it("has at least one lane", () => {
    expect(LANES.length).toBeGreaterThan(0);
  });

  it("every slug is unique (collisions would shadow a /lanes/:slug route)", () => {
    const slugs = LANES.map((l) => l.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every slug is URL-safe (lowercase, digits, hyphens only)", () => {
    for (const lane of LANES) {
      expect(lane.slug, lane.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it("every required text field is a non-empty string", () => {
    for (const lane of LANES) {
      for (const field of ["slug", "origin", "destination", "primaryRoute", "notes"] as const) {
        expect(typeof lane[field], `${lane.slug}.${field}`).toBe("string");
        expect(lane[field].length, `${lane.slug}.${field}`).toBeGreaterThan(0);
      }
    }
  });

  it("every distance/time/rank metric is a finite number greater than zero", () => {
    for (const lane of LANES) {
      for (const field of ["distanceMiles", "averageDriveTimeHours", "congestionDelayHours", "freightVolumeRank"] as const) {
        expect(Number.isFinite(lane[field]), `${lane.slug}.${field}`).toBe(true);
        expect(lane[field], `${lane.slug}.${field}`).toBeGreaterThan(0);
      }
    }
  });
});

describe("LANES ↔ CITIES referential integrity", () => {
  it("every lane's two metroEndpoints resolve to real cities", () => {
    for (const lane of LANES) {
      for (const slug of lane.metroEndpoints) {
        expect(
          findCity(slug),
          `${lane.slug} references a city slug "${slug}" that is not in CITIES`,
        ).toBeDefined();
      }
    }
  });

  it("a lane's two endpoints are distinct cities", () => {
    for (const lane of LANES) {
      const [origin, destination] = lane.metroEndpoints;
      expect(origin, lane.slug).not.toBe(destination);
    }
  });
});
