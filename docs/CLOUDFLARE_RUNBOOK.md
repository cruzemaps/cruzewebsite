# Cloudflare setup runbook (for Claude in Chrome / extension)

Click-by-click runbook. Every step has an exact URL, button name, and exact text to paste.

> Prereqs: Cloudflare account that owns `cruzemaps.com`, with a Pages project already serving the site (since `wrangler.jsonc` is in the repo and you said you're already on Cloudflare).
>
> Account / project URL pattern:
> - Account dashboard: `https://dash.cloudflare.com/<ACCOUNT_ID>`
> - Pages project: `https://dash.cloudflare.com/<ACCOUNT_ID>/pages/view/cruzewebsite`
> - Workers & Pages: `https://dash.cloudflare.com/<ACCOUNT_ID>/workers-and-pages`
>
> Find `<ACCOUNT_ID>` after signing in — it's in the URL.

---

## Step 1 — Add environment variables to the Pages project

1. Navigate to: `https://dash.cloudflare.com/<ACCOUNT_ID>/pages/view/cruzewebsite/settings/environment-variables`
2. Click **+ Add variable** under the **Production** column for each of the four below. (For each, type the variable name in the left field, paste the value in the right field, leave **Type** as `Plaintext`.)

| Variable name | Value | Where to find it |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://<PROJECT_REF>.supabase.co` | Supabase dashboard → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | a long `eyJhbGciOi...` string | Same page → `anon public` key |
| `VITE_POSTHOG_KEY` | starts with `phc_...` | PostHog → Project Settings → Project API Key |
| `VITE_POSTHOG_HOST` | `https://us.i.posthog.com` | Use exactly this for US region; `https://eu.i.posthog.com` for EU |

3. After adding all four, click **Save**.
4. Navigate to: `https://dash.cloudflare.com/<ACCOUNT_ID>/pages/view/cruzewebsite/deployments`
5. Click **Retry deployment** on the most recent deployment, or push any commit to `main` to trigger a fresh build.
6. Wait ~2 minutes for the build to complete. Open `https://cruzemaps.com` and check it loads.

> Note: do NOT add `VITE_SUPABASE_*` to the Preview column unless you have a separate Supabase project for preview branches. Otherwise preview deploys will write to production data.

---

## Step 2 — Verify SEO files emitted correctly

After Step 1's redeploy, open these URLs in a new tab. Each should load successfully:

- `https://cruzemaps.com/sitemap.xml` — XML with ~10 `<url>` entries
- `https://cruzemaps.com/robots.txt` — plain text, references the sitemap
- `https://cruzemaps.com/for-fleets` — open DevTools → Sources → view source. The `<title>` should read **"Cruze for Fleets | Cut Fuel, Reclaim Driver Hours"** (not the homepage title). This proves the prerender ran.

If `sitemap.xml` 404s: the build skipped the prerender step. Check the build log in `https://dash.cloudflare.com/<ACCOUNT_ID>/pages/view/cruzewebsite/deployments` — look for the line `✓ wrote sitemap.xml`. If absent, the deploy was from a commit before this work landed; push the latest commit.

---

## Step 3 — Generate a Cloudflare API token (for headless OG worker deploy)

This avoids needing `wrangler login` interactively.

1. Navigate to: `https://dash.cloudflare.com/profile/api-tokens`
2. Click **Create Token**.
3. Choose template **Edit Cloudflare Workers** → click **Use template**.
4. Under **Account Resources**: select your account.
5. Under **Zone Resources**: select `Include` → `Specific zone` → `cruzemaps.com`.
6. Click **Continue to summary** → **Create Token**.
7. **Copy the token now** — Cloudflare won't show it again. Save it somewhere temporarily (1Password, etc.).

---

## Step 4 — Deploy the OG image worker

This needs to be done from a terminal, not the browser. Open a terminal in the project root:

```bash
cd workers/og-image
npm install
export CLOUDFLARE_API_TOKEN="paste-the-token-from-step-3"
npx wrangler deploy
```

Expected output ends with `Deployed cruze-og-image triggers (Xms)` and a `*.workers.dev` URL.

> If the extension is doing this and can't access a terminal: skip ahead to Step 5b (manual upload via dashboard).

---

## Step 5a — Bind the worker to `og.cruzemaps.com` (DNS)

1. Navigate to: `https://dash.cloudflare.com/<ACCOUNT_ID>/cruzemaps.com/dns/records`
2. Click **+ Add record**.
3. Set:
   - **Type**: `CNAME`
   - **Name**: `og`
   - **Target**: `cruze-og-image.<your-account>.workers.dev` (use the URL from Step 4's output, with `https://` stripped)
   - **Proxy status**: **Proxied** (orange cloud — important; without this the worker route won't bind)
   - **TTL**: `Auto`
4. Click **Save**.
5. Wait ~1 minute, then open `https://og.cruzemaps.com/?title=Hello&kind=case-study` — you should see a 1200×630 PNG with branded card.

If the URL 502s, the worker route binding didn't apply. Check `wrangler.jsonc` in `workers/og-image/` — the `routes` block must include `og.cruzemaps.com/*`.

---

## Step 5b — (Alternative to 4 + 5a) Manual upload via dashboard

Use this only if you can't run `wrangler` from a terminal.

1. Navigate to: `https://dash.cloudflare.com/<ACCOUNT_ID>/workers-and-pages`
2. Click **Create application** → **Create Worker**.
3. Name: `cruze-og-image`. Click **Deploy**.
4. After deploy, click **Edit code**.
5. Open the repo file: [`workers/og-image/src/index.ts`](../workers/og-image/src/index.ts). Copy the entire contents and paste into the editor (replacing the default handler).
6. ⚠️ The dashboard editor doesn't bundle npm packages. For `workers-og` to work via dashboard, you'd need to inline its bundle — easier path is the CLI approach above. If you must use dashboard, comment out the `import { ImageResponse }` line and return a placeholder `Response("OG worker placeholder", { status: 200 })` until you can run wrangler.
7. Click **Save and Deploy**.
8. Click **Triggers** tab → **Add Custom Domain** → enter `og.cruzemaps.com` → save.

---

## Step 6 — Submit to Google Search Console

1. Navigate to: `https://search.google.com/search-console`
2. Click **Add property**. Choose **Domain** (not URL prefix). Enter `cruzemaps.com`. Click **Continue**.
3. Google shows a TXT record. Copy it.
4. In a new tab: `https://dash.cloudflare.com/<ACCOUNT_ID>/cruzemaps.com/dns/records`
5. Click **+ Add record**:
   - **Type**: `TXT`
   - **Name**: `@` (root domain)
   - **Content**: paste the value from Google
   - **TTL**: `Auto`
   - Save.
6. Back in Search Console → click **Verify**. Should succeed within 30s.
7. After verification, in Search Console left sidebar click **Sitemaps**.
8. Enter: `sitemap.xml` (just the path, the domain is prefilled). Click **Submit**.
9. Verify status: `Success`.

---

## Step 7 — Submit to Bing Webmaster Tools (also feeds Perplexity / ChatGPT crawlers)

1. Navigate to: `https://www.bing.com/webmasters`
2. Sign in. Click **+ Add a site**.
3. **Import from Google Search Console** is the fastest path — click that, authorize, select `cruzemaps.com`, import.
4. After import, in the left sidebar click **Sitemaps** → **Submit sitemap**.
5. Enter: `https://cruzemaps.com/sitemap.xml`. Submit.

---

## Step 8 — Enable Cloudflare's IndexNow integration (auto-pings Bing on every deploy)

1. Navigate to: `https://dash.cloudflare.com/<ACCOUNT_ID>/cruzemaps.com/seo`
2. Find **Crawler Hints** (or **IndexNow**, depending on the dashboard version). Toggle **ON**.
3. (Optional) Find **Crawler Hints — Smart Hints** and enable.

This means every time you deploy, Cloudflare automatically tells Bing/Yandex/etc. that pages have changed, so they re-crawl faster.

---

## Step 9 — Cache page rule for the OG image fallback

The OG worker sets its own cache headers, but the fallback `og-default.png` should also cache aggressively.

1. Navigate to: `https://dash.cloudflare.com/<ACCOUNT_ID>/cruzemaps.com/caching/cache-rules`
2. Click **Create rule**.
3. **Rule name**: `OG image long cache`
4. **When incoming requests match**:
   - Field: `URI Path`
   - Operator: `equals`
   - Value: `/og-default.png`
5. **Then**:
   - Cache eligibility: `Eligible for cache`
   - Edge TTL: `Override origin` → set to `1 month`
   - Browser TTL: `1 day`
6. Save.

---

## Step 10 — (Optional, recommended) Cloudflare Web Analytics

Adds zero-cookie analytics — complementary to PostHog, useful for Lighthouse and Core Web Vitals visibility.

1. Navigate to: `https://dash.cloudflare.com/<ACCOUNT_ID>/web-analytics`
2. Click **Add a site**.
3. **Hostname**: `cruzemaps.com`
4. After save, the dashboard shows a `<script>` snippet. Copy it.
5. Open the repo file `index.html`. Paste the snippet just before `</body>`. Commit + push to trigger redeploy.

---

## Verification checklist (run last)

- [ ] `https://cruzemaps.com/sitemap.xml` loads with ~10+ URLs.
- [ ] `https://cruzemaps.com/robots.txt` loads and references the sitemap.
- [ ] `view-source:https://cruzemaps.com/for-fleets` shows the route-specific `<title>`.
- [ ] `https://og.cruzemaps.com/?title=Test&kind=insight` returns a PNG (only if Steps 4–5 done).
- [ ] Search Console shows `cruzemaps.com` verified, sitemap `Success`.
- [ ] Cloudflare Web Analytics dashboard shows your test pageview within 5 min.

If any check fails, find the corresponding step above — don't proceed to building features until the foundation is solid.
