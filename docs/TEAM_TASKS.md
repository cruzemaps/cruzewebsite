# Cruze website: content tasks for the team

The website is technically complete. These are the content-shaped tasks that turn the live scaffolding into a fully populated site. Everything below is non-technical: a writer, a designer, or a marketing-savvy founder can knock these out without touching code.

## Priority 1 — Press kit assets (visible at /press)

The page exists and shows download cards. The download links currently return 404. Replace them with real files.

**What's needed:**

1. **Brand asset bundle** (`cruze-brand-assets.zip`)
   - Logo on dark background: SVG + PNG at 2400px wide
   - Logo on light background: SVG + PNG at 2400px wide
   - Wordmark only (no icon) in both color variants
   - Brand color hex codes in a `colors.txt` file: `#FF8C00` orange, `#00F2FF` cyan, `#0B0E14` charcoal

2. **Founder bios + headshots** (`cruze-founders.zip`)
   - For each founder: 150-word bio in `firstname-bio.txt` and a 300dpi square headshot at 2000×2000px
   - Don't over-polish. Plain background, natural light, clear face.

3. **Fact sheet** (`cruze-fact-sheet.pdf`)
   - One page, exportable from Google Docs or Figma
   - Sections: company name, founded year, HQ city, mission (1 sentence), team size, current funding stage, current pilot count, traction headline, founder names + LinkedIn links, press contact email
   - Match brand colors

4. **Product screenshots** (`cruze-product-screens.zip`)
   - Mission Control dashboard at 2880×1800
   - Fleet Dashboard at 2880×1800
   - Consumer driving experience (mobile mockup)
   - Save as PNGs, compressed but lossless

**Where to upload them:** Supabase Storage. Create a public bucket called `press` and drop all four files in. Then ping the engineer to swap the four `/press/...` paths in `src/pages/Press.tsx` with the public Supabase Storage URLs.

**Time estimate:** 4 hours if assets exist; 1 day if creating from scratch.

---

## Priority 2 — Real case studies (visible at /case-studies)

Currently has 2 starter case studies. Each new case study is one TypeScript object added to `src/content/caseStudies.ts`. The route picks it up automatically.

**For each pilot you've run:**

1. Get permission from the customer to publish (most important step — easy to forget)
2. Write 3-4 paragraphs (300-500 words) covering:
   - The problem they had (specific corridor, fleet size, fuel cost baseline)
   - What we deployed (number of vehicles, integration partner, timeline)
   - What changed in measurable terms (the metrics that matter to *that* audience: fleets care about fuel and driver hours; cities care about peak speed and stop-and-go events)
3. Pull 4 hard metrics with units and time windows
4. One-sentence excerpt for the index page

**Format the team writes in (sample):**

```
slug: "midwest-class8-fleet"
title: "11.4% diesel reduction across a 600-truck Class 8 fleet"
customer: "Midwest regional carrier"
segment: "fleet"
publishedAt: "2026-02-28"

excerpt: "After integrating Cruze with Samsara across 600 Class 8 tractors, the carrier measured 11.4% diesel reduction and 1.8 reclaimed driver-hours per week."

metrics:
  - Fuel reduction: 11.4%
  - Driver-hours reclaimed: 1.8/wk
  - Trucks deployed: 600
  - Integration time: 1 day

body: [3-4 paragraphs]
```

Send these to the engineer (or paste into a doc) and they get added to the site in under 5 minutes per study.

**Time estimate:** 2 hours per case study, 80% of which is customer approval back-and-forth.

---

## Priority 3 — Insights blog posts (visible at /insights)

Same pattern as case studies. Currently has 2 starter posts. Each new post is one entry in `src/content/insights.ts`.

**Topic ideas that fit Cruze's existing positioning:**

- "How fleet ops change once you stop optimizing for fuel and start optimizing for stability"
- "Why the worst congestion isn't on the routes you'd guess"
- "What 30 days of Cruze pilot data tells us about driver behavior"
- "The economics of stop-and-go: a per-mile breakdown"
- "Phantom jams in dense city corridors vs interstate corridors: different physics, same fix"

**Per post:**
- 600-1200 words
- 2-3 word topic tags
- One excerpt sentence
- Date

These build SEO long-tail traffic over time. A new post per 2-3 weeks is plenty.

**Time estimate:** 3-5 hours per post.

---

## Priority 4 — Real partner / pilot logos (currently hidden)

You asked us to remove the partner trust strip until you're ready to disclose. When you're ready:

- Get explicit written permission from each partner to use their name and logo on cruzemaps.com
- Collect SVG logos from each (their PR/marketing team usually has a brand portal)
- Drop a TrustStrip back onto the homepage with the real logos

**Time estimate:** Mostly waiting on partner approvals. 1-2 weeks elapsed time.

---

## Priority 5 — Investor dataroom

Tier 3 of the investor page expects two environment variables wired in Cloudflare Pages:

- `VITE_DATAROOM_PASSWORD` — the password investors enter (use something memorable like a 4-word passphrase)
- `VITE_DATAROOM_URL` — base URL for your dataroom (Notion, DocSend, Carta, etc.)

Then update the `items` array in `src/pages/Investors.tsx`'s `DataroomSection` to point at real document links: deck, financial model, customer pipeline, pilot outcome reports, cap table, references.

**Time estimate:** 1 hour once dataroom is organized in your tool of choice.

---

## Priority 6 — Cal.com booking link (visible on /investors)

Investors can click "Book a call" on the page. Right now it points at `cruze/intro` which probably doesn't exist on cal.com.

- Sign up for Cal.com at https://cal.com (free tier is fine)
- Create an event type called "Investor intro" (30 minutes, video)
- Get your username (e.g., `anudeep`)
- Set Cloudflare env var `VITE_CALCOM_USER` to `anudeep/investor-intro` (or whatever your event slug is)

**Time estimate:** 30 minutes.

---

## Priority 7 — Cruze hero video

You have `public/cruze-web.mp4` but it's not used on the homepage. Decide whether to:

- Embed it in the hero section as autoplay-muted (high impact, costs bandwidth)
- Keep it for the press kit only (low impact, no bandwidth cost)
- Embed it intersection-observer-triggered below the fold (compromise)

This is a product/marketing call, not an engineering one. Decide and tell the engineer.

**Time estimate:** 15-minute decision; 30-minute implementation once decided.

---

## What you do NOT need to do

The team does not need to:

- Write SEO meta descriptions (engineers maintain in `src/lib/seo.ts`)
- Generate sitemap.xml (auto-built)
- Manage social share images (auto-generated by the OG worker)
- Wire analytics events (already typed)
- Touch the admin portal copy (that's internal-facing)

Everything in this doc is content the team can ship without engineering bandwidth.
