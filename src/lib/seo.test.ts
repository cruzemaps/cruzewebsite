import { describe, it, expect } from "vitest";
import { SITE, ROUTES, resolveOgImage, findRouteMeta } from "./seo";

describe("resolveOgImage", () => {
  it("falls back to the site default OG image, absolutized, when given undefined", () => {
    // resolveOgImage always returns an absolute URL (Open Graph requires one);
    // the default SITE.ogImage is a relative path, so it gets the origin prefix.
    expect(resolveOgImage(undefined)).toBe(`${SITE.url}${SITE.ogImage}`);
  });

  it("passes absolute http(s) URLs through unchanged", () => {
    expect(resolveOgImage("https://cdn.example.com/x.png")).toBe(
      "https://cdn.example.com/x.png"
    );
    expect(resolveOgImage("http://example.com/y.jpg")).toBe(
      "http://example.com/y.jpg"
    );
  });

  it("is case-insensitive about the scheme", () => {
    expect(resolveOgImage("HTTPS://Example.com/z.png")).toBe(
      "HTTPS://Example.com/z.png"
    );
  });

  it("prefixes relative paths with the site origin", () => {
    expect(resolveOgImage("/og/fleets.png")).toBe(`${SITE.url}/og/fleets.png`);
  });

  it("does not treat a protocol-relative path as absolute", () => {
    // "//cdn/x" has no http(s) scheme, so the relative branch prefixes the
    // site origin (it is NOT recognized as an absolute URL).
    expect(resolveOgImage("//cdn/x")).toBe(`${SITE.url}//cdn/x`);
  });
});

describe("findRouteMeta", () => {
  it("returns the exact route for a known path", () => {
    const meta = findRouteMeta("/for-fleets");
    expect(meta?.path).toBe("/for-fleets");
    expect(meta?.title).toContain("Fleets");
  });

  it("returns the homepage for '/'", () => {
    expect(findRouteMeta("/")?.path).toBe("/");
  });

  it("prefix-matches nested routes onto their parent", () => {
    // /insights/:slug has no own entry, so it resolves to the /insights parent.
    expect(findRouteMeta("/insights/phantom-traffic-jams")?.path).toBe(
      "/insights"
    );
    expect(findRouteMeta("/cities/austin")?.path).toBe("/cities");
  });

  it("never prefix-matches everything onto the homepage", () => {
    // "/" is excluded from prefix matching, otherwise every unknown path would
    // resolve to it. An unknown top-level path must return undefined.
    expect(findRouteMeta("/totally-unknown-xyz")).toBeUndefined();
  });

  it("prefers the exact route over a prefix match", () => {
    // /apply is an exact route; it must not resolve to some shorter prefix.
    expect(findRouteMeta("/apply")?.path).toBe("/apply");
  });

  it("only prefix-matches on a path-segment boundary", () => {
    // A sibling path that merely shares a string prefix is NOT a nested route
    // and must not inherit the shorter route's metadata. "/login-help" shares
    // "/login" as a string prefix but is a different path, so it is unknown.
    expect(findRouteMeta("/login-help")).toBeUndefined();
    expect(findRouteMeta("/for-fleets-xyz")).toBeUndefined();
    expect(findRouteMeta("/v2x")).toBeUndefined();
  });

  it("resolves a nested slug to its own parent, not an earlier string prefix", () => {
    // "/privacy" sits before "/privacy-drives" in ROUTES. A nested path under
    // the longer route must resolve to "/privacy-drives", not leak the earlier
    // "/privacy" entry via a boundary-less startsWith.
    expect(findRouteMeta("/privacy-drives/section-3")?.path).toBe(
      "/privacy-drives"
    );
    // noindex internal routes keep matching their own nested paths.
    expect(findRouteMeta("/lab/frame-42")?.path).toBe("/lab");
    expect(findRouteMeta("/lab/frame-42")?.noindex).toBe(true);
  });

  it("treats a trailing slash on an exact route as that route", () => {
    // "/for-fleets/" is the same page as "/for-fleets"; the boundary match
    // accepts the trailing slash rather than returning undefined.
    expect(findRouteMeta("/for-fleets/")?.path).toBe("/for-fleets");
  });
});

describe("ROUTES invariants", () => {
  it("has unique paths (no accidental duplicate route entries)", () => {
    const paths = ROUTES.map((r) => r.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("gives every route a non-empty title and description", () => {
    for (const r of ROUTES) {
      expect(r.title.length, `title for ${r.path}`).toBeGreaterThan(0);
      expect(r.description.length, `description for ${r.path}`).toBeGreaterThan(0);
    }
  });

  it("keeps priorities within the sitemap-valid [0,1] range", () => {
    for (const r of ROUTES) {
      if (r.priority !== undefined) {
        expect(r.priority, `priority for ${r.path}`).toBeGreaterThanOrEqual(0);
        expect(r.priority, `priority for ${r.path}`).toBeLessThanOrEqual(1);
      }
    }
  });

  it("marks the internal/auth-only routes noindex", () => {
    const byPath = Object.fromEntries(ROUTES.map((r) => [r.path, r]));
    expect(byPath["/login"]?.noindex).toBe(true);
    expect(byPath["/lab"]?.noindex).toBe(true);
    // The live homepage must stay indexable.
    expect(byPath["/"]?.noindex).toBeFalsy();
  });
});
