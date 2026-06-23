// Pure-logic tests for the case-study content store (runs in the fast Node env —
// no DOM needed). CASE_STUDIES drives /case-studies and every /case-studies/:slug
// page, and findCaseStudy is the lookup the detail route uses to decide
// render-vs-redirect (CaseStudyDetail.tsx: `if (!study) return <Navigate .../>`).
// These tests pin (a) the store's structural invariants the routing + SEO + the
// segment-styled badge silently depend on and (b) findCaseStudy's exact-match
// semantics. Mirrors insights.test.ts for the sibling store.
import { describe, expect, it } from "vitest";
import { CASE_STUDIES, findCaseStudy } from "./caseStudies";

describe("findCaseStudy", () => {
  it("returns the matching study for a known slug", () => {
    const study = findCaseStudy("austin-i35-corridor");
    expect(study).toBeDefined();
    expect(study?.slug).toBe("austin-i35-corridor");
    expect(study?.segment).toBe("city");
  });

  it("returns undefined for an unknown slug (drives the detail-page redirect)", () => {
    expect(findCaseStudy("no-such-study")).toBeUndefined();
  });

  it("is an exact match, not a prefix or substring match", () => {
    // A substring of a real slug must not resolve — the detail route would
    // otherwise render the wrong study (or leak a draft slug into the URL).
    expect(findCaseStudy("austin-i35")).toBeUndefined();
    expect(findCaseStudy("austin-i35-corridor-extra")).toBeUndefined();
  });

  it("does not match on a different-cased slug (URLs are case-sensitive here)", () => {
    expect(findCaseStudy("Austin-I35-Corridor")).toBeUndefined();
  });

  it("returns the first entry's identity object, not a copy", () => {
    expect(findCaseStudy(CASE_STUDIES[0].slug)).toBe(CASE_STUDIES[0]);
  });
});

describe("CASE_STUDIES store invariants", () => {
  it("has at least one published study", () => {
    expect(CASE_STUDIES.length).toBeGreaterThan(0);
  });

  it("every slug is unique (collisions would shadow a route)", () => {
    const slugs = CASE_STUDIES.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every slug is URL-safe (lowercase, digits, hyphens only)", () => {
    for (const study of CASE_STUDIES) {
      expect(study.slug, study.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it("every required string field is non-empty", () => {
    for (const study of CASE_STUDIES) {
      for (const field of ["slug", "title", "customer", "publishedAt", "excerpt", "body"] as const) {
        expect(typeof study[field], `${study.slug}.${field}`).toBe("string");
        expect(study[field].length, `${study.slug}.${field}`).toBeGreaterThan(0);
      }
    }
  });

  it("segment is one of the two values the badge + JSON-LD branch on", () => {
    // CaseStudyDetail styles the badge on `segment === "city"` and falls through
    // to the fleet style otherwise — an unexpected value would silently render
    // as a fleet pilot. Pin the closed set.
    for (const study of CASE_STUDIES) {
      expect(["fleet", "city"], study.slug).toContain(study.segment);
    }
  });

  it("publishedAt is an ISO calendar date that Date can parse (the byline + datePublished format it)", () => {
    for (const study of CASE_STUDIES) {
      expect(study.publishedAt, study.slug).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(new Date(study.publishedAt).getTime()), study.slug).toBe(false);
    }
  });

  it("every study has at least one metric with non-empty label + value (the stat grid renders them)", () => {
    for (const study of CASE_STUDIES) {
      expect(Array.isArray(study.metrics), study.slug).toBe(true);
      expect(study.metrics.length, study.slug).toBeGreaterThan(0);
      for (const m of study.metrics) {
        expect(typeof m.label, study.slug).toBe("string");
        expect(m.label.length, study.slug).toBeGreaterThan(0);
        expect(typeof m.value, study.slug).toBe("string");
        expect(m.value.length, study.slug).toBeGreaterThan(0);
      }
    }
  });

  it("metric labels are unique within a study (CaseStudyDetail keys the grid on label)", () => {
    // The detail page renders `study.metrics.map((m) => <div key={m.label}>)` —
    // a duplicate label inside one study would collide React keys.
    for (const study of CASE_STUDIES) {
      const labels = study.metrics.map((m) => m.label);
      expect(new Set(labels).size, study.slug).toBe(labels.length);
    }
  });

  it("ogImage, when present, is a non-empty string", () => {
    for (const study of CASE_STUDIES) {
      if (study.ogImage !== undefined) {
        expect(typeof study.ogImage, study.slug).toBe("string");
        expect(study.ogImage.length, study.slug).toBeGreaterThan(0);
      }
    }
  });
});
