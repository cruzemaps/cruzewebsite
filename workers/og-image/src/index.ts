// Cloudflare Worker that generates Open Graph share images on the fly.
// Hits: GET /?title=...&subtitle=...&kind=case-study|insight|fleet|city|investor
// Returns: 1200x630 PNG, edge-cached for 24h.
//
// Uses workers-og (satori + resvg-wasm). No Node deps, runs on the Cloudflare
// edge globally. Deploy via the Wrangler config alongside this worker.

import { ImageResponse } from "workers-og";

const BRAND = {
  cyan: "#00F2FF",
  orange: "#FF8C00",
  charcoal: "#0B0E14",
};

export default {
  async fetch(request: Request, _env: unknown, ctx: ExecutionContext): Promise<Response> {
    // Scanners probe paths like /.env and /info.php all day; only the root
    // path is a real OG request, so bail before touching the renderer.
    if (request.method !== "GET" || new URL(request.url).pathname !== "/") {
      return new Response("Not found", { status: 404 });
    }

    // Rendering costs far more CPU than the free plan's ~10ms budget, so each
    // unique URL renders once per colo and is served from the edge cache after.
    const cache = caches.default;
    const cached = await cache.match(request);
    if (cached) return cached;

    const url = new URL(request.url);
    const title = (url.searchParams.get("title") || "Cruze").slice(0, 140);
    const subtitle = (url.searchParams.get("subtitle") || "Dissolve traffic, not just avoid it").slice(0, 200);
    const kind = url.searchParams.get("kind") || "default";

    const accent = kind === "fleet" ? BRAND.orange : BRAND.cyan;
    const tag = kindLabel(kind);

    const html = `
      <div style="
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        width: 1200px;
        height: 630px;
        background: linear-gradient(135deg, ${BRAND.charcoal} 0%, #050810 100%);
        color: white;
        padding: 80px;
        font-family: 'Inter', sans-serif;
      ">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="
            width: 48px;
            height: 48px;
            border-radius: 12px;
            background: ${accent};
            display: flex;
            align-items: center;
            justify-content: center;
            color: ${BRAND.charcoal};
            font-weight: 800;
            font-size: 28px;
          ">C</div>
          <span style="font-size: 28px; font-weight: 800; letter-spacing: 0.05em;">CRUZE</span>
          <span style="
            margin-left: auto;
            font-size: 16px;
            color: ${accent};
            text-transform: uppercase;
            letter-spacing: 0.2em;
            border: 1px solid ${accent}55;
            padding: 6px 14px;
            border-radius: 999px;
          ">${tag}</span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 16px;">
          <div style="
            display: flex;
            font-size: 64px;
            font-weight: 700;
            line-height: 1.1;
            letter-spacing: -0.02em;
            max-width: 1000px;
          ">${escape(title)}</div>
          <div style="
            display: flex;
            font-size: 28px;
            color: rgba(255,255,255,0.6);
            line-height: 1.4;
            max-width: 1000px;
          ">${escape(subtitle)}</div>
        </div>

        <div style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 18px;
          color: rgba(255,255,255,0.5);
        ">
          <span>cruzemaps.com</span>
          <span style="color: ${accent};">Swarm intelligence · Physics-informed AI</span>
        </div>
      </div>
    `.replace(/>\s+</g, "><"); // whitespace between tags becomes stray flex items

    const rendered = new ImageResponse(html, { width: 1200, height: 630 });
    // Buffer the PNG so a render failure surfaces as a 500 here instead of a
    // 200 with an empty body (workers-og streams, so errors land after headers).
    const png = await rendered.arrayBuffer();
    if (!png.byteLength) return new Response("render failed", { status: 500 });

    const response = new Response(png, {
      headers: {
        "content-type": "image/png",
        "cache-control": "public, max-age=86400, s-maxage=86400, immutable",
      },
    });
    ctx.waitUntil(cache.put(request, response.clone()));
    return response;
  },
};

function kindLabel(kind: string): string {
  switch (kind) {
    case "case-study": return "Case Study";
    case "insight": return "Insight";
    case "fleet": return "For Fleets";
    case "city": return "For Cities";
    case "investor": return "Investors";
    default: return "Cruze";
  }
}

// workers-og does not decode HTML entities (`&amp;` renders literally), so drop
// the characters that would open a tag instead of escaping them.
function escape(s: string): string {
  return s.replace(/[<>]/g, "");
}
