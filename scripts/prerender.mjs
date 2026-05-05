#!/usr/bin/env node
// Post-build SEO emitter.
//
// For every route declared in src/lib/seo.ts, this:
//   1. Reads dist/index.html (the SPA shell).
//   2. Injects route-specific <title>, meta, canonical, OG, Twitter, JSON-LD.
//   3. Writes the result to dist/<route>/index.html so Cloudflare Pages serves
//      a route-specific HTML snapshot to crawlers/LLMs while the SPA bundle
//      hydrates the same React tree.
//
// Also emits dist/sitemap.xml and dist/robots.txt from the same manifest.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DIST = join(ROOT, "dist");

// Dynamically import the TS source via a tiny inline transform: easiest to keep
// the manifest in TS for the app while the build script is JS. We re-implement
// minimal parsing — just import the .ts as text and eval the ROUTES array.
async function loadProgrammaticRoutes(SITE) {
  // Read the raw TS for cities & lanes and extract their slug/title bits.
  // Same eval-in-Function approach as loadRoutes — fragile by design so any
  // schema change forces a deliberate update.
  const cities = await loadModuleArray("src/content/cities.ts", "CITIES");
  const lanes = await loadModuleArray("src/content/lanes.ts", "LANES");

  const cityRoutes = cities.map((c) => ({
    path: `/cities/${c.slug}`,
    title: `Cruze in ${c.name}, ${c.state} | Swarm Routing for ${c.name} Traffic`,
    description: `${c.name} drivers lose ${c.hoursLostPerDriver} hrs and ${c.fuelWastedPerDriverGal} gallons a year to congestion. See where Cruze coordinates speeds across ${c.primaryCorridors.join(", ")}.`,
    changefreq: "monthly",
    priority: 0.6,
  }));

  const laneRoutes = lanes.map((l) => ({
    path: `/lanes/${l.slug}`,
    title: `${l.origin} to ${l.destination} | Cruze Lane Coordination`,
    description: `${l.origin} to ${l.destination} via ${l.primaryRoute}: ${l.distanceMiles} miles, +${l.congestionDelayHours}h peak congestion delay. Per-trip Cruze impact for fleets running this lane.`,
    changefreq: "monthly",
    priority: 0.6,
  }));

  return [...cityRoutes, ...laneRoutes];
}

async function loadModuleArray(relPath, exportName) {
  const src = await readFile(join(ROOT, relPath), "utf8");
  const re = new RegExp(`export const ${exportName}: \\w+\\[\\] = (\\[[\\s\\S]*?\\n\\];)`);
  const m = src.match(re);
  if (!m) throw new Error(`Could not parse ${exportName} from ${relPath}`);
  return new Function(`return ${m[1].replace(/;\s*$/, "")}`)();
}

async function loadRoutes() {
  const src = await readFile(join(ROOT, "src/lib/seo.ts"), "utf8");
  // Strip type-only syntax we don't need for evaluation. We extract SITE,
  // any module-level helper consts (orgJsonLd, softwareJsonLd, ...), and
  // ROUTES, then evaluate them in one program so cross-references resolve.
  const siteMatch = src.match(/export const SITE = (\{[\s\S]*?\}) as const;/);
  const routesMatch = src.match(/export const ROUTES: RouteMeta\[\] = (\[[\s\S]*?\n\];)/);
  if (!siteMatch || !routesMatch) {
    throw new Error("Could not parse SITE or ROUTES from src/lib/seo.ts");
  }

  // Module-level non-exported consts (e.g. orgJsonLd, softwareJsonLd).
  // Match: const NAME = { ... }; — anchored to start-of-line so we don't pick
  // up nested object literals.
  const helperRegex = /^const\s+(\w+)\s*=\s*(\{[\s\S]*?\n\});/gm;
  const helpers = [];
  let m;
  while ((m = helperRegex.exec(src)) !== null) {
    helpers.push(`const ${m[1]} = ${m[2]};`);
  }

  const program = `
    const SITE = ${siteMatch[1]};
    ${helpers.join("\n")}
    const ROUTES = ${routesMatch[1].replace(/;\s*$/, "")};
    return { SITE, ROUTES };
  `;
  return new Function(program)();
}

function renderHead(SITE, route) {
  const canonical = `${SITE.url}${route.path === "/" ? "" : route.path}`;
  const ogImage = `${SITE.url}${route.ogImage || SITE.ogImage}`;
  const robots = route.noindex ? `<meta name="robots" content="noindex,nofollow" />` : "";
  const keywords = route.keywords ? `<meta name="keywords" content="${escapeAttr(route.keywords)}" />` : "";
  const jsonLdArr = Array.isArray(route.jsonLd) ? route.jsonLd : route.jsonLd ? [route.jsonLd] : [];
  const jsonLd = jsonLdArr
    .map((blob) => `<script type="application/ld+json">${JSON.stringify(blob)}</script>`)
    .join("\n    ");

  return `
    <title>${escapeText(route.title)}</title>
    <meta name="description" content="${escapeAttr(route.description)}" />
    ${keywords}
    <link rel="canonical" href="${canonical}" />
    ${robots}
    <meta property="og:title" content="${escapeAttr(route.title)}" />
    <meta property="og:description" content="${escapeAttr(route.description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:site_name" content="${SITE.name}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeAttr(route.title)}" />
    <meta name="twitter:description" content="${escapeAttr(route.description)}" />
    <meta name="twitter:image" content="${ogImage}" />
    ${SITE.twitter ? `<meta name="twitter:site" content="${SITE.twitter}" />` : ""}
    ${jsonLd}`.trim();
}

function escapeAttr(s) {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeText(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function injectIntoHead(html, snippet) {
  // Replace the existing <title> + og + description with our route-specific
  // block. We anchor on the closing </head> so we always emit fresh meta even
  // if Vite added more.
  // Strategy: strip any existing <title>, description meta, og:* meta, twitter:* meta,
  // canonical link, JSON-LD scripts in the original head, then inject ours just
  // before </head>.
  const stripped = html
    .replace(/<title>[\s\S]*?<\/title>/gi, "")
    .replace(/<meta\s+name=["']description["'][^>]*>/gi, "")
    .replace(/<meta\s+name=["']keywords["'][^>]*>/gi, "")
    .replace(/<meta\s+property=["']og:[^"']+["'][^>]*>/gi, "")
    .replace(/<meta\s+name=["']twitter:[^"']+["'][^>]*>/gi, "")
    .replace(/<meta\s+name=["']robots["'][^>]*>/gi, "")
    .replace(/<link\s+rel=["']canonical["'][^>]*>/gi, "")
    .replace(/<script\s+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, "");

  return stripped.replace("</head>", `${snippet}\n  </head>`);
}

async function emitSitemap(SITE, ROUTES) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = ROUTES.filter((r) => !r.noindex)
    .map((r) => {
      const loc = `${SITE.url}${r.path === "/" ? "" : r.path}`;
      return `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq || "monthly"}</changefreq>
    <priority>${r.priority?.toFixed(1) || "0.5"}</priority>
  </url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  await writeFile(join(DIST, "sitemap.xml"), xml, "utf8");
  console.log("✓ wrote sitemap.xml");
}

async function emitRobots(SITE) {
  const txt = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /dashboard
Disallow: /fleet-dashboard
Disallow: /invite/

Sitemap: ${SITE.url}/sitemap.xml
`;
  await writeFile(join(DIST, "robots.txt"), txt, "utf8");
  console.log("✓ wrote robots.txt");
}

async function main() {
  const { SITE, ROUTES } = await loadRoutes();
  const programmatic = await loadProgrammaticRoutes(SITE);
  const allRoutes = [...ROUTES, ...programmatic];
  const shell = await readFile(join(DIST, "index.html"), "utf8");

  for (const route of allRoutes) {
    const html = injectIntoHead(shell, renderHead(SITE, route));
    if (route.path === "/") {
      // Overwrite the root index.html with the homepage's meta baked in.
      await writeFile(join(DIST, "index.html"), html, "utf8");
      console.log(`✓ baked / -> dist/index.html`);
    } else {
      const dir = join(DIST, route.path.replace(/^\//, ""));
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, "index.html"), html, "utf8");
      console.log(`✓ baked ${route.path} -> ${route.path}/index.html`);
    }
  }

  await emitSitemap(SITE, allRoutes);
  await emitRobots(SITE);
  console.log("✓ prerender complete");
}

main().catch((err) => {
  console.error("✗ prerender failed:", err);
  process.exit(1);
});
