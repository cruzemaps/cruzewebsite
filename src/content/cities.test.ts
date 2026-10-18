// Pure-logic tests for the cities content store (runs in the fast Node env —
// no DOM needed). CITIES is the programmatic-SEO source for /cities and every
// /cities/:slug page (scripts/prerender.mjs maps each slug to a baked route +
// sitemap entry), and findCity is the lookup the detail route uses to decide
// render-vs-redirect. These tests pin the structural invariants the routing +
// SEO layers silently depend on (unique, URL-safe slugs; non-empty required
// copy; finite, positive metrics) and findCity's exact-match semantics. They
// deliberately assert no row count — the file is meant to grow.
import { describe, expect, it } from "vitest";
import { CITIES, findCity } from "./cities";

describe("findCity", () => {
  it("returns the matching city for a known slug", () => {
    const city = findCity("austin-tx");
    expect(city).toBeDefined();
    expect(city?.slug).toBe("austin-tx");
    expect(city?.name).toBe("Austin");
  });

  it("returns undefined for an unknown slug (drives the detail-page redirect)", () => {
    expect(findCity("no-such-city")).toBeUndefined();
  });

  it("is an exact match, not a prefix or substring match", () => {
    // A substring of a real slug must not resolve — the detail route would
    // otherwise render the wrong city page.
    expect(findCity("austin")).toBeUndefined();
    expect(findCity("austin-tx-extra")).toBeUndefined();
  });

  it("does not match on a different-cased slug (URLs are case-sensitive here)", () => {
    expect(findCity("Austin-TX")).toBeUndefined();
  });

  it("round-trips every entry's slug back to its identity object", () => {
    for (const city of CITIES) {
      expect(findCity(city.slug), city.slug).toBe(city);
    }
  });
});

describe("CITIES store invariants", () => {
  it("has at least one city", () => {
    expect(CITIES.length).toBeGreaterThan(0);
  });

  it("every slug is unique (collisions would shadow a /cities/:slug route)", () => {
    const slugs = CITIES.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every slug is URL-safe (lowercase, digits, hyphens only)", () => {
    for (const city of CITIES) {
      expect(city.slug, city.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it("every required text field is a non-empty string", () => {
    for (const city of CITIES) {
      for (const field of ["slug", "name", "state", "metroPopulation", "notes"] as const) {
        expect(typeof city[field], `${city.slug}.${field}`).toBe("string");
        expect(city[field].length, `${city.slug}.${field}`).toBeGreaterThan(0);
      }
    }
  });

  it("every congestion/fuel metric is a finite number greater than zero", () => {
    for (const city of CITIES) {
      for (const field of ["congestionRank", "hoursLostPerDriver", "fuelWastedPerDriverGal"] as const) {
        expect(Number.isFinite(city[field]), `${city.slug}.${field}`).toBe(true);
        expect(city[field], `${city.slug}.${field}`).toBeGreaterThan(0);
      }
    }
  });

  it("congestionRank is a whole number (it is an ordinal ranking)", () => {
    for (const city of CITIES) {
      expect(Number.isInteger(city.congestionRank), city.slug).toBe(true);
    }
  });

  it("every city lists at least one primary corridor", () => {
    for (const city of CITIES) {
      expect(Array.isArray(city.primaryCorridors), city.slug).toBe(true);
      expect(city.primaryCorridors.length, city.slug).toBeGreaterThan(0);
      for (const corridor of city.primaryCorridors) {
        expect(corridor.length, `${city.slug} corridor`).toBeGreaterThan(0);
      }
    }
  });
});
