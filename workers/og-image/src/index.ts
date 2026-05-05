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
  async fetch(request: Request): Promise<Response> {
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
        width: 100%;
        height: 100%;
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
            font-size: 64px;
            font-weight: 700;
            line-height: 1.1;
            letter-spacing: -0.02em;
            max-width: 1000px;
          ">${escape(title)}</div>
          <div style="
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
    `;

    return new ImageResponse(html, {
      width: 1200,
      height: 630,
      headers: {
        "cache-control": "public, max-age=86400, s-maxage=86400, immutable",
      },
    });
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

function escape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
