import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import { createHash } from "node:crypto";
import path from "path";

// Content-Security-Policy delivered as a <meta http-equiv> tag.
//
// WHY A META TAG (and not vercel.json / a _headers file): this site ships to
// GitHub Pages (.github/workflows/deploy.yml -> gh-pages, custom domain
// cruzemaps.com) and Cloudflare Workers static assets (wrangler.jsonc). Neither
// path lets us set arbitrary response headers the way a Vercel/Nginx origin
// would, and the Lighthouse CI check runs against the static ./dist directory
// (staticDistDir) with no header server in front of it. A <meta http-equiv>
// CSP is therefore the only mechanism that (a) is actually enforced on both
// live deploy targets and (b) is picked up by the Lighthouse csp-xss audit.
//
// The post-build prerender (scripts/prerender.mjs) copies dist/index.html into
// each route's index.html and only strips title/description/og/twitter/
// canonical/keywords/robots/JSON-LD, so this http-equiv meta (and the inline
// SPA-redirect <script> whose hash we pin below) propagate unchanged to every
// prerendered route.
//
// The policy is injected ONLY at build time (apply: "build") so it never
// interferes with the Vite dev server's HMR (inline eval, ws:// socket).
//
// Directive sources (audited against actual runtime usage in src/):
//   script-src  'self'                     -> hashed Vite bundle (/assets/*.js)
//               'sha256-<inline>'          -> the inline SPA 404-redirect script
//                                             in index.html (hash auto-computed
//                                             from the built HTML so an edit to
//                                             that script can't silently break)
//               'wasm-unsafe-eval'         -> defensive: bundled TensorFlow.js
//                                             (coco-ssd YOLO lab) feature-detects
//                                             WebAssembly; allows WASM compile
//                                             only, NOT arbitrary JS eval
//               cdn.jsdelivr.net           -> hls.js@1.5.20 injected at runtime
//                                             (SRI-pinned) by the camera players
//               us-assets.i.posthog.com    -> PostHog lazily loads recorder /
//                                             surveys / toolbar assets
//   style-src   'unsafe-inline'            -> framer-motion / recharts inline
//                                             style attrs + an injected <style>
//                                             (V3.tsx) + index.html body style
//               fonts.googleapis.com       -> Google Fonts stylesheet <link>
//   font-src    fonts.gstatic.com, data:   -> Google Fonts files
//   img-src     'self' data: blob: https:  -> local + canvas/video-frame blobs +
//                                             remote preview/analytics pixels
//   media-src   'self' blob: *.skyvdn.com  -> MSE blob URLs from hls.js + the
//                                             TxDOT skyvdn HLS feeds (native HLS)
//   connect-src supabase.co (+wss)         -> Supabase REST + realtime socket
//               us[-assets].i.posthog.com  -> PostHog ingestion + assets
//               cdn.jsdelivr.net           -> us-atlas topojson map data fetch
//               storage.googleapis.com     -> coco-ssd model weights (tfjs-models)
//               *.skyvdn.com               -> hls.js manifest/segment XHR
//   frame-src   cal.com / app.cal.com      -> investor "book a call" iframe
//   worker-src  'self' blob:              -> hls.js transmux Web Worker (blob)
//
// NOTE: frame-ancestors / X-Frame-Options are intentionally omitted -- a <meta>
// CSP ignores frame-ancestors per spec, and GitHub Pages cannot set the header.
// Clickjacking protection should be added at a header/CDN layer if one is
// introduced. See the PR body for origins to smoke-test.
function cspMetaPlugin(): Plugin {
  const buildCsp = (scriptHash: string) => {
    const directives: Record<string, string[]> = {
      "default-src": ["'self'"],
      "base-uri": ["'self'"],
      "object-src": ["'none'"],
      "form-action": ["'self'"],
      "script-src": [
        "'self'",
        "'wasm-unsafe-eval'",
        `'${scriptHash}'`,
        "https://cdn.jsdelivr.net",
        "https://us-assets.i.posthog.com",
      ],
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      "font-src": ["'self'", "data:", "https://fonts.gstatic.com"],
      "img-src": ["'self'", "data:", "blob:", "https:"],
      "media-src": ["'self'", "blob:", "https://*.skyvdn.com"],
      "connect-src": [
        "'self'",
        "https://*.supabase.co",
        "wss://*.supabase.co",
        "https://us.i.posthog.com",
        "https://us-assets.i.posthog.com",
        "https://cdn.jsdelivr.net",
        "https://storage.googleapis.com",
        "https://*.skyvdn.com",
      ],
      "frame-src": ["https://cal.com", "https://app.cal.com"],
      "worker-src": ["'self'", "blob:"],
      "upgrade-insecure-requests": [],
    };
    return Object.entries(directives)
      .map(([k, v]) => (v.length ? `${k} ${v.join(" ")}` : k))
      .join("; ");
  };

  return {
    name: "cruze-csp-meta",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler(html) {
        // Hash the inline classic script (the GH-Pages SPA 404 redirect) so we
        // can allow exactly it without 'unsafe-inline' in script-src. Matches
        // the type="text/javascript" block specifically; JSON-LD blocks are
        // data blocks and are not governed by script-src.
        const m = html.match(
          /<script\s+type=["']text\/javascript["']\s*>([\s\S]*?)<\/script>/i,
        );
        if (!m) {
          throw new Error(
            "cruze-csp-meta: could not find the inline SPA-redirect <script> to hash. " +
              "If index.html changed, update the matcher in vite.config.ts.",
          );
        }
        const hash =
          "sha256-" + createHash("sha256").update(m[1], "utf8").digest("base64");
        const meta = `<meta http-equiv="Content-Security-Policy" content="${buildCsp(hash)}" />`;
        // Inject as early as possible (right after <meta charset>) so the policy
        // governs every subsequent script/style/fetch in the document.
        if (/<meta\s+charset=[^>]*>/i.test(html)) {
          return html.replace(/(<meta\s+charset=[^>]*>)/i, `$1\n    ${meta}`);
        }
        return html.replace(/<head>/i, `<head>\n    ${meta}`);
      },
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  base: "/",
  plugins: [react(), cspMetaPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
