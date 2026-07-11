// @vitest-environment jsdom
//
// Component tests for <SEO>, the runtime side of the site's SEO system. The
// pure resolvers it leans on (findRouteMeta / resolveOgImage) already have
// unit coverage in src/lib/seo.test.ts; these tests pin the *component's* own
// job: turning props + the route manifest into the exact <title> and <meta>/
// <link>/<script> tags react-helmet-async writes into <head>. A regression
// here (a dropped og tag, a broken canonical, prop precedence flipping) would
// be invisible to the lib tests but would quietly hurt crawlers/LLMs.
//
// react-helmet-async mutates the real document head via effects, so every
// assertion is wrapped in waitFor and reads document.head / document.title.
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import SEO from "./SEO";
import { SITE, resolveOgImage } from "@/lib/seo";

afterEach(() => cleanup());

// A route that is NOT in the manifest, so findRouteMeta() returns undefined and
// the component must fall back to props / SITE defaults rather than a real
// route's metadata. Keeps these tests independent of the live ROUTES content
// (which seo.test.ts already covers).
const UNKNOWN = "/__not-a-real-route__";

function renderSEO(props: ComponentProps<typeof SEO> = {}, path = UNKNOWN) {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>
        <SEO {...props} />
      </MemoryRouter>
    </HelmetProvider>,
  );
}

const metaContent = (selector: string) =>
  document.head.querySelector(selector)?.getAttribute("content") ?? null;

describe("SEO — explicit props", () => {
  it("renders the title, description and keywords passed as props", async () => {
    renderSEO({ title: "My Title", description: "My description", keywords: "a, b, c" });
    await waitFor(() => expect(document.title).toBe("My Title"));
    expect(metaContent('meta[name="description"]')).toBe("My description");
    expect(metaContent('meta[name="keywords"]')).toBe("a, b, c");
  });

  it("omits the keywords meta entirely when no keywords resolve", async () => {
    renderSEO({ title: "No Keywords", description: "d" });
    await waitFor(() => expect(document.title).toBe("No Keywords"));
    // waitFor (not a bare assert): helmet removes a prior test's tags on its own
    // rAF tick, so a stale keywords meta can briefly linger after this mounts.
    await waitFor(() => expect(document.head.querySelector('meta[name="keywords"]')).toBeNull());
  });

  it("mirrors title/description into the Open Graph and Twitter tags", async () => {
    renderSEO({ title: "Shared", description: "Shared desc" });
    await waitFor(() => expect(metaContent('meta[property="og:title"]')).toBe("Shared"));
    expect(metaContent('meta[property="og:description"]')).toBe("Shared desc");
    expect(metaContent('meta[name="twitter:title"]')).toBe("Shared");
    expect(metaContent('meta[name="twitter:description"]')).toBe("Shared desc");
  });

  it("emits the static social + theme tags from SITE", async () => {
    renderSEO({ title: "Static tags" });
    await waitFor(() => expect(document.title).toBe("Static tags"));
    expect(metaContent('meta[name="twitter:card"]')).toBe("summary_large_image");
    expect(metaContent('meta[property="og:type"]')).toBe("website");
    expect(metaContent('meta[property="og:site_name"]')).toBe(SITE.name);
    expect(metaContent('meta[name="twitter:site"]')).toBe(SITE.twitter);
    expect(metaContent('meta[name="theme-color"]')).toBe(SITE.themeColor);
  });
});

describe("SEO — manifest fallback for an unknown route", () => {
  it("falls back to the SITE name and short description when no props/manifest match", async () => {
    renderSEO({});
    await waitFor(() => expect(document.title).toBe(SITE.name));
    expect(metaContent('meta[name="description"]')).toBe(SITE.shortDescription);
  });
});

describe("SEO — canonical URL", () => {
  it("appends the pathname to SITE.url for a normal route", async () => {
    renderSEO({ title: "Canon" }, "/for-fleets");
    await waitFor(() => expect(document.title).toBe("Canon"));
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(
      `${SITE.url}/for-fleets`,
    );
  });

  it("does NOT append a trailing slash for the home route", async () => {
    // The component special-cases "/" so the canonical is the bare origin, not
    // "https://cruzemaps.com/" — pin that so the branch can't silently regress.
    renderSEO({ title: "Home" }, "/");
    await waitFor(() => expect(document.title).toBe("Home"));
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(SITE.url);
  });

  it("honors canonicalOverride over the derived URL", async () => {
    renderSEO({ title: "Override", canonicalOverride: "https://example.com/x" }, "/for-fleets");
    await waitFor(() => expect(document.title).toBe("Override"));
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(
      "https://example.com/x",
    );
  });
});

describe("SEO — robots / noindex", () => {
  it("emits a noindex,nofollow robots meta when noindex is true", async () => {
    renderSEO({ title: "Hidden", noindex: true });
    await waitFor(() => expect(metaContent('meta[name="robots"]')).toBe("noindex,nofollow"));
  });

  it("omits the robots meta by default (indexable)", async () => {
    renderSEO({ title: "Indexable" });
    await waitFor(() => expect(document.title).toBe("Indexable"));
    await waitFor(() => expect(document.head.querySelector('meta[name="robots"]')).toBeNull());
  });
});

describe("SEO — og:image resolution", () => {
  it("passes an absolute ogImage through unchanged", async () => {
    renderSEO({ title: "Abs", ogImage: "https://cdn.example.com/a.png" });
    await waitFor(() => expect(metaContent('meta[property="og:image"]')).toBe("https://cdn.example.com/a.png"));
    expect(metaContent('meta[name="twitter:image"]')).toBe("https://cdn.example.com/a.png");
  });

  it("prefixes a relative ogImage with SITE.url", async () => {
    renderSEO({ title: "Rel", ogImage: "/social/card.png" });
    await waitFor(() => expect(metaContent('meta[property="og:image"]')).toBe(`${SITE.url}/social/card.png`));
  });

  it("falls back to SITE.ogImage when none is provided", async () => {
    renderSEO({ title: "Default OG" });
    await waitFor(() => expect(document.title).toBe("Default OG"));
    // The component runs the default through resolveOgImage, which absolutizes
    // a relative default (e.g. "/og-image.png") against SITE.url.
    expect(metaContent('meta[property="og:image"]')).toBe(resolveOgImage(SITE.ogImage));
  });
});

describe("SEO — JSON-LD scripts", () => {
  const ldScripts = () =>
    Array.from(document.head.querySelectorAll('script[type="application/ld+json"]'));

  it("renders one ld+json script for a single jsonLd object", async () => {
    renderSEO({ title: "One LD", jsonLd: { "@type": "Thing", name: "x" } });
    await waitFor(() => expect(ldScripts()).toHaveLength(1));
    expect(JSON.parse(ldScripts()[0].textContent ?? "{}")).toEqual({ "@type": "Thing", name: "x" });
  });

  it("renders one script per entry for a jsonLd array", async () => {
    renderSEO({ title: "Two LD", jsonLd: [{ "@type": "A" }, { "@type": "B" }] });
    await waitFor(() => expect(ldScripts()).toHaveLength(2));
    const types = ldScripts().map((s) => JSON.parse(s.textContent ?? "{}")["@type"]);
    expect(types).toEqual(["A", "B"]);
  });

  it("renders no ld+json scripts when jsonLd is absent", async () => {
    renderSEO({ title: "No LD" });
    await waitFor(() => expect(document.title).toBe("No LD"));
    await waitFor(() => expect(ldScripts()).toHaveLength(0));
  });
});
