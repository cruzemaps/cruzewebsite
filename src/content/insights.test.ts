// Pure-logic tests for the insights content store (runs in the fast Node env —
// no DOM needed). INSIGHTS drives /insights and every /insights/:slug page, and
// findInsight is the lookup the detail route uses to decide render-vs-redirect.
// These tests pin (a) the store's structural invariants that the routing + SEO
// layers silently depend on (unique slugs, parseable dates, non-empty tags for
// the related-articles cluster) and (b) findInsight's exact match semantics.
import { describe, expect, it } from "vitest";
import { INSIGHTS, findInsight } from "./insights";

describe("findInsight", () => {
  it("returns the matching insight for a known slug", () => {
    const post = findInsight("why-traffic-with-no-accident");
    expect(post).toBeDefined();
    expect(post?.slug).toBe("why-traffic-with-no-accident");
    expect(post?.title).toBe("Why is there traffic when there's no accident?");
  });

  it("returns undefined for an unknown slug (drives the detail-page redirect)", () => {
    expect(findInsight("no-such-article")).toBeUndefined();
  });

  it("is an exact match, not a prefix or substring match", () => {
    // A substring of a real slug must not resolve — the detail route would
    // otherwise render the wrong article (or worse, leak a draft slug).
    expect(findInsight("why-traffic")).toBeUndefined();
    expect(findInsight("why-traffic-with-no-accident-extra")).toBeUndefined();
  });

  it("does not match on a different-cased slug (URLs are case-sensitive here)", () => {
    expect(findInsight("Why-Traffic-With-No-Accident")).toBeUndefined();
  });

  it("returns the first entry's identity object, not a copy", () => {
    expect(findInsight(INSIGHTS[0].slug)).toBe(INSIGHTS[0]);
  });
});

describe("INSIGHTS store invariants", () => {
  it("has at least one published insight", () => {
    expect(INSIGHTS.length).toBeGreaterThan(0);
  });

  it("every slug is unique (collisions would shadow a route)", () => {
    const slugs = INSIGHTS.map((i) => i.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every slug is URL-safe (lowercase, digits, hyphens only)", () => {
    for (const post of INSIGHTS) {
      expect(post.slug, post.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it("every required field is a non-empty string", () => {
    for (const post of INSIGHTS) {
      for (const field of ["slug", "title", "author", "publishedAt", "excerpt", "body"] as const) {
        expect(typeof post[field], `${post.slug}.${field}`).toBe("string");
        expect(post[field].length, `${post.slug}.${field}`).toBeGreaterThan(0);
      }
    }
  });

  it("publishedAt is an ISO calendar date that Date can parse (the byline formats it)", () => {
    for (const post of INSIGHTS) {
      expect(post.publishedAt, post.slug).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(new Date(post.publishedAt).getTime()), post.slug).toBe(false);
    }
  });

  it("every insight has at least one tag (the related-articles cluster keys off tags)", () => {
    for (const post of INSIGHTS) {
      expect(Array.isArray(post.tags), post.slug).toBe(true);
      expect(post.tags.length, post.slug).toBeGreaterThan(0);
      for (const tag of post.tags) {
        expect(typeof tag).toBe("string");
        expect(tag.length).toBeGreaterThan(0);
      }
    }
  });

  it("authorTitle, when present, is a non-empty string (it drives the Person schema)", () => {
    for (const post of INSIGHTS) {
      if (post.authorTitle !== undefined) {
        expect(typeof post.authorTitle, post.slug).toBe("string");
        expect(post.authorTitle.length, post.slug).toBeGreaterThan(0);
      }
    }
  });
});
