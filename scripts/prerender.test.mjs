// Contract lock for the SEO structured-data baked into /insights/:slug pages.
//
// The prerenderer must inject the SAME Article + Person (E-E-A-T) JSON-LD that
// InsightDetail.tsx injects at runtime — otherwise crawlers/LLMs snapshot the
// pre-hydration HTML and see zero structured data. These tests assert the shape
// of that JSON-LD and that renderHead() actually emits it as a valid
// <script type="application/ld+json"> block.
//
// Zero-dependency: run with `node --test scripts/prerender.test.mjs`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { insightArticleJsonLd, renderHead } from "./prerender.mjs";

const SITE = { url: "https://cruze.example", name: "Cruze", ogImage: "/og.png" };

const bylined = {
  slug: "phantom-traffic-jams",
  title: "Phantom Traffic Jams",
  excerpt: "Why traffic appears from nowhere.",
  author: "Anudeep Bonagiri",
  authorTitle: "Founder, Cruze",
  publishedAt: "2026-01-01",
  tags: ["traffic", "phantom-jams"],
};

const orgAuthored = {
  slug: "fleet-economics-of-stop-and-go",
  title: "The hidden cost of stop-and-go",
  excerpt: "What idling really costs a fleet.",
  author: "Cruze",
  publishedAt: "2026-02-02",
  tags: ["fleet", "economics"],
};

test("bylined post → Person author with E-E-A-T fields", () => {
  const ld = insightArticleJsonLd(SITE, bylined);
  assert.equal(ld["@context"], "https://schema.org");
  assert.equal(ld["@type"], "Article");
  assert.equal(ld.author["@type"], "Person");
  assert.equal(ld.author.name, "Anudeep Bonagiri");
  assert.equal(ld.author.jobTitle, "Founder, Cruze");
  assert.deepEqual(ld.author.worksFor, { "@type": "Organization", name: "Cruze" });
});

test("non-bylined post → Organization author (matches runtime branch)", () => {
  const ld = insightArticleJsonLd(SITE, orgAuthored);
  assert.equal(ld.author["@type"], "Organization");
  assert.equal(ld.author.name, "Cruze");
  assert.equal(ld.author.jobTitle, undefined);
});

test("core Article fields are populated from the post", () => {
  const ld = insightArticleJsonLd(SITE, bylined);
  assert.equal(ld.headline, bylined.title);
  assert.equal(ld.description, bylined.excerpt);
  assert.equal(ld.datePublished, bylined.publishedAt);
  assert.equal(ld.keywords, "traffic, phantom-jams");
  assert.equal(ld.mainEntityOfPage, `${SITE.url}/insights/${bylined.slug}`);
  assert.equal(ld.publisher.logo.url, `${SITE.url}/logo.png`);
});

test("keywords omitted (not crashed) when a post has no tags", () => {
  const noTags = { ...bylined, tags: undefined };
  const ld = insightArticleJsonLd(SITE, noTags);
  assert.equal(ld.keywords, undefined);
});

test("renderHead bakes exactly one valid ld+json Article block", () => {
  const route = {
    path: `/insights/${bylined.slug}`,
    title: `${bylined.title} | Cruze Insights`,
    description: bylined.excerpt,
    jsonLd: insightArticleJsonLd(SITE, bylined),
  };
  const head = renderHead(SITE, route);
  const blocks = [...head.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)];
  assert.equal(blocks.length, 1, "exactly one JSON-LD block");
  const parsed = JSON.parse(blocks[0][1]);
  assert.equal(parsed["@type"], "Article");
  assert.equal(parsed.author["@type"], "Person");
});

test("renderHead emits no ld+json block when a route has none", () => {
  const head = renderHead(SITE, { path: "/plain", title: "Plain", description: "x" });
  assert.equal(head.includes("application/ld+json"), false);
});
