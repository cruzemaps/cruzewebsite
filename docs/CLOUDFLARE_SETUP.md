# Cloudflare setup

What you need to do in the Cloudflare dashboard so all the new SEO + analytics + OG infra goes live.

## 1. Cloudflare Pages — main site

You're already deploying via Wrangler/Cloudflare Pages (per `wrangler.jsonc`). Two changes needed:

### a) Environment variables

Add these as **Production** env vars (Pages project → Settings → Environment variables):

| Variable | Value | Required for |
|----------|-------|--------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Auth, admin, /stats |
| `VITE_SUPABASE_ANON_KEY` | Supabase `anon` key | Auth, admin, /stats |
| `VITE_POSTHOG_KEY` | PostHog public project API key | Analytics & funnels |
| `VITE_POSTHOG_HOST` | `https://us.i.posthog.com` (or EU equivalent) | Analytics |

After saving, trigger a redeploy so the build picks them up. The site builds and runs without these (placeholders kick in), but `/admin`, `/stats` live data, and analytics will be inert.

### b) Confirm SPA + sitemap routing

`wrangler.jsonc` already has `not_found_handling: "single-page-application"` — leave it. Our `scripts/prerender.mjs` step now writes per-route `dist/<path>/index.html` files so Cloudflare serves real HTML for `/for-fleets`, `/for-cities`, `/investors`, etc. Unknown routes still fall back to the SPA shell, which is what you want.

After your next deploy, verify:

- `https://cruzemaps.com/sitemap.xml` returns the XML sitemap
- `https://cruzemaps.com/robots.txt` returns the robots file
- `https://cruzemaps.com/for-fleets` returns HTML containing the right `<title>` *before* JS executes (use `curl -A "Googlebot"` or view source)

## 2. Cloudflare Worker — dynamic OG images

Lives in [workers/og-image/](../workers/og-image/). Generates 1200×630 share images per route.

### Deploy

```bash
cd workers/og-image
npm install
npx wrangler login          # one-time auth
npx wrangler deploy
```

This deploys a worker named `cruze-og-image`.

### Custom domain

The worker config tries to bind `og.cruzemaps.com`. To make that work:

1. In Cloudflare DNS (cruzemaps.com zone), add a CNAME:
   - Name: `og`
   - Target: `cruze-og-image.<your-account>.workers.dev`
   - Proxy: enabled (orange cloud)
2. Confirm: `https://og.cruzemaps.com/?title=Hello&kind=case-study` returns a PNG.

To use a different subdomain, edit `workers/og-image/wrangler.jsonc#routes`.

### Wire it from React (optional, after the worker is live)

In `src/lib/seo.ts`, you can swap any route's `ogImage` to point at the worker, e.g.:

```ts
ogImage: "https://og.cruzemaps.com/?title=Cruze%20for%20Fleets&kind=fleet"
```

For per-case-study OG images, set `canonicalOverride` + `ogImage` in `CaseStudyDetail.tsx`'s `<SEO>` block.

## 3. Cloudflare Worker — frame analyzer (Claude vision)

Lives in [workers/frame-analyze/](../workers/frame-analyze/). The investor-page InteractiveLab modal captures a frame from the live HLS feed every 10 seconds (after the user draws an ROI), POSTs it to this worker, and the worker calls Claude Haiku 4.5 vision to return `{ count, meanSpeedMph, density, severity, recommendedSpeedMph }`. The SPA prefers these values over the regime simulation when the worker is reachable.

### Secret

The worker reads `ANTHROPIC_API_KEY` from a wrangler secret — **never** add it to source, env vars, or VITE_*. The SPA never sees the key; only the worker holds it.

```bash
cd workers/frame-analyze
npm install
npx wrangler secret put ANTHROPIC_API_KEY    # paste your Anthropic API key when prompted
```

### Deploy

```bash
npx wrangler deploy
```

Deploys a worker named `cruze-frame-analyze`.

### Custom domain

Worker is bound to `analyze.cruzemaps.com`. Add the CNAME in Cloudflare DNS:

- Name: `analyze`
- Target: `cruze-frame-analyze.<your-account>.workers.dev`
- Proxy: enabled (orange cloud)

Confirm: `curl https://analyze.cruzemaps.com/health` returns `{"ok":true,"service":"cruze-frame-analyze"}`.

### Override URL in dev

By default the SPA points at `https://analyze.cruzemaps.com/analyze`. To hit `wrangler dev` locally, set:

```
VITE_FRAME_ANALYZE_URL=http://localhost:8787/analyze
```

in your `.env.local`. Without this the dev SPA either hits prod or (if CORS blocks the frame capture) silently falls back to the regime simulation — the UI badge flips from "Live AI Vision" to "Simulation Mode" so you can tell which mode is active.

### Cost

At one investor session ≈ 6–12 frames per camera modal, Haiku 4.5 vision runs ~$0.001 per frame → ~$0.01/session. Refresh cadence is in [`InteractiveLabV2.tsx`](../src/components/v2/InteractiveLabV2.tsx) (`ANALYZE_INTERVAL_MS`). Don't tighten without a cost re-estimate.

## 4. (Optional) Plausible-style analytics on Cloudflare

If you'd rather host analytics yourself rather than PostHog, Cloudflare Web Analytics is free and zero-cookie. Pages project → Web Analytics → Add a site → paste the token into a `<script>` in `index.html`. We skipped this so you can choose; PostHog gives funnels + session replay.

## 5. Search engine submission

Once the new sitemap is live:

1. **Google Search Console** — add `cruzemaps.com`, verify via DNS (Cloudflare can auto-add the TXT). Submit `https://cruzemaps.com/sitemap.xml`.
2. **Bing Webmaster Tools** — same, submit the sitemap. Bing indexes faster than Google for new sites and feeds Perplexity/ChatGPT.
3. **IndexNow** — Cloudflare has a one-click IndexNow integration in the Pages project that pings Bing/Yandex on every deploy. Enable it.

## 6. Page rules / cache

For optimal Core Web Vitals:

- Pages → Settings → Caching: leave defaults (Cloudflare auto-caches static assets).
- Add a Page Rule: `cruzemaps.com/og-default.png` → Edge cache TTL: 1 month.
- The OG worker sets its own `cache-control: public, max-age=86400` so generated images cache at the edge.

That's it. After this, run `npm run build` locally and inspect `dist/sitemap.xml` and `dist/for-fleets/index.html` to confirm the prerender ran.
