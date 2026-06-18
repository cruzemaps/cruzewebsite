# Cruze Content, SEO, and GEO Playbook

How Cruze earns organic search traffic and gets cited by AI engines (ChatGPT, Claude, Perplexity, Google AI Overviews), and how we keep it up.

Last updated: 2026-06. Owner: [assign]. Cadence of this doc: review quarterly.

> The one rule that overrides everything: never fabricate traction, customers, or savings. Cite every statistic to a public source. Label any projection as "modeled." Honesty is also good GEO, because AI engines cross-check claims across sources.

---

## 1. The mental model

Traditional SEO (Google's blue links) and GEO (being cited by AI answers) now reward partly different things. The data:

- Only about 12% of AI-cited URLs appear in Google's top 10 for the same query.
- Pages LLMs cite often have fewer backlinks than less-cited pages.
- LLMs cite brands that show consistent strength across many related queries, not a brand that ranks #1 for one keyword.

The single thing that wins both games: **topical authority**, being recognized as deeply expert on a topic, not on a keyword. Everything below builds toward that.

Our unfair advantage: we have real data (live Texas DOT cameras, a computer-vision model, a physics simulation), founders with first-hand experience, and a topic the press and LLMs love to explain (phantom jams). We should be THE source on traffic flow.

---

## 2. SEO: what wins in 2026

1. **Topical authority is the primary ranking signal** (Google's March 2026 core update). A site with 20 interconnected articles on a topic beats a site with one brilliant 5,000-word guide.
2. **Pillar and cluster architecture (hub and spoke):**
   - **Pillar page:** 3,000 to 5,000 words, broad coverage of a topic, links to every cluster page.
   - **Cluster pages:** 1,500 to 2,500 words each, one specific question answered deeply, each linking back to the pillar with keyword-rich anchor text.
   - Bidirectional internal linking (pillar to cluster and back) is what crawlers read as authority.
3. **Depth beats breadth: 3 to 7 deep clusters, not 15 to 20 shallow ones.** Three clusters of 30 to 50 articles each outperform ten clusters of 10 articles, on both SEO and GEO.
4. **E-E-A-T, weighted toward first-hand Experience.** Google rewards content that shows you actually did the thing: author bios, Person schema, original data and screenshots, documented process. Google evaluates the whole digital footprint, not one URL.
5. **Technical health:** fast pages, clean internal links, prerendered HTML (we already do this), no broken links, mobile-first. Keep it boring and solid.

---

## 3. GEO: how to get cited by AI engines

LLMs retrieve sources at query time (RAG), then pick based on five signals: **entity clarity, coverage depth, parsability, third-party mentions, and result proof.** Practical tactics, strongest first:

- **Answer the specific question directly and completely.** The strongest predictor of citation. Put a clear, self-contained answer near the top of the page.
- **Add statistics (about +22% AI visibility) and pull quotes (about +37% citation rate).** Use real, cited numbers and a quotable one-liner per page. We already do this with INRIX and ATRI data.
- **Entity clarity.** State plainly what Cruze is: "Cruze is a traffic-intelligence company that predicts stop-and-go waves and guides a few drivers to smooth them out." Reinforced by schema and by `/llms.txt`.
- **Third-party mentions.** Being referenced across the web (press, Reddit, forums, other sites) matters more than backlinks for GEO. This is the off-page half most teams skip. See the digital PR play in section 6.
- **Parsability.** Clear headings, short paragraphs, lists, plain language. Keep the answer in the static HTML (we prerender, so this is covered).
- **`/llms.txt` and `/llms-full.txt`.** A curated, citable map of the site for Claude, Perplexity, and ChatGPT. Already drafted; keep it current.

---

## 4. FAQ writing craft

- **Answer length: 40 to 60 words** so it can be pulled into an AI answer or snippet. Question as an H2 or H3. Optional expansion (steps, bullets, a link) below.
- **Use real questions.** Mine Google's "People Also Ask," Search Console queries, and real inbound questions. 5 to 10 strong questions beat 30 shallow ones.
- **Conversational phrasing** that matches how people actually search ("Why is there traffic when there is no accident?").
- **2026 reality check:** Google deprecated the FAQ rich-result dropdown on May 7, 2026, and FAQ schema gives no clear uplift in AI Overviews. The answer text itself is what gets pulled. So keep the schema for technical clarity, but the value now is AI Overviews, People Also Ask, and on-page clarity, not the old star snippet.

---

## 5. The content engine: how to keep it up

**Do we publish daily? No.** Daily-for-its-own-sake hurts in 2026. The data:

- Quality is the entry fee, not a differentiator. Publishing many mediocre articles actively weakens visibility.
- Sweet spot is 1 to 4 high-quality pieces per week; returns flatten after about 11 per month.
- Consistency beats frequency. A steady, sustainable beat for 12+ months is what compounds (sustained cluster publishing for a year yields roughly 40% more organic traffic than one-off content).

**Cruze cadence (realistic for a small team):**

- **1 to 2 genuinely good cluster articles per week**, every week, on our own `/insights` hub.
- **Bylined by a founder** (Anudeep) for first-hand E-E-A-T, with a real author bio and Person schema.
- **Every article includes a cited statistic and a quotable pull-quote** (the GEO multipliers).
- **One original-data study per quarter** for digital PR (section 6).
- **Refresh the oldest 2 to 3 articles each month** (freshness is a ranking factor; update stats, add internal links).

**Where to publish (the channel question):**

- **Home base: the `/insights` hub on cruzemaps.com.** Own the asset. This is where authority accrues.
- **Distribution, not home: LinkedIn, X, and relevant subreddits / forums.** Repurpose each article into a post. This also creates the third-party mentions GEO needs. Do not let social be the only home for the content.

---

## 6. What the best operators do (and our version of it)

The top B2B SaaS SEO teams (Omniscient, MADX, Fractl) do not just blog. They run:

- **Digital PR with original research.** Create proprietary data, turn it into a study, pitch it to press. This earns high-authority links, third-party mentions, and becomes the stat everyone cites (including LLMs).
- **A "barbell" content strategy.** High-intent conversion pages on one end (for-fleets, for-cities, pilot), long-form authority pieces on the other (the clusters).
- **Programmatic SEO** for scale (we already have `/cities` and `/lanes`).

**Cruze's digital PR play (our biggest lever):** We have real camera and CV data almost no one else has. Publish original studies like "We analyzed N Texas corridors: here is what share of the jam is phantom, with no crash in sight." Pitch to transportation and local media. This is a backlink engine, a third-party-mention engine, and the exact kind of citable statistic LLMs surface. Aim for one such study per quarter.

---

## 7. The three clusters (own these)

Go deep: 20 to 40 articles per cluster over time. Start with the pillar, then publish clusters around it.

### Cluster 1: Phantom jams and traffic physics (highest GEO upside, the topic we own)
- **Pillar:** "Phantom Traffic Jams: Why Traffic Happens for No Reason"
- **Cluster articles (backlog):**
  - Why is there traffic when there is no accident?
  - What causes stop-and-go traffic?
  - Traffic waves explained (the science of jamitons)
  - The 2008 ring-road experiment that proved phantom jams
  - Why does adding lanes not fix traffic? (induced demand)
  - Can 5% of drivers fix a traffic jam? (the 2018 Arizona study)
  - Why tailgating makes traffic worse
  - Phantom jams vs real bottlenecks: how to tell the difference
  - How navigation apps move traffic instead of removing it

### Cluster 2: Fleet fuel and operations (commercial intent)
- **Pillar:** "How Traffic Quietly Drains Fleet Margins"
- **Cluster articles (backlog):**
  - How much does congestion cost a trucking fleet? (ATRI data)
  - The real fuel cost of stop-and-go driving
  - Idle time: how much fuel a truck burns going nowhere
  - Eco-driving and speed smoothing for fleets
  - Per-truck cost of congestion, and how to cut it
  - Telematics shows the problem; what actually changes it

### Cluster 3: City and DOT congestion (B2G)
- **Pillar:** "Reducing Congestion Without Building More Lanes"
- **Cluster articles (backlog):**
  - Induced demand: why new lanes fill back up
  - Ramp metering and other ITS strategies, explained
  - How to get more throughput from the roads you already have
  - Using existing traffic cameras to measure flow
  - What a corridor pilot looks like for a DOT

---

## 8. Measurement (KPIs)

- **SEO:** impressions, clicks, average position, indexed pages (Google Search Console). Track cluster pages as a group.
- **GEO:** mention rate (percent of AI answers that name Cruze), citation rate (percent that link cruzemaps.com), and position in the answer. Tools: Profound, "Am I Cited," or a monthly manual check (ask ChatGPT and Perplexity "what causes phantom traffic jams" and "who is solving traffic flow," and see if Cruze appears).
- **Pipeline:** contact-form submissions and pilot inquiries attributed to organic and AI sources.
- **Cadence of review:** monthly dashboard, quarterly strategy review.

---

## 9. First 90 days (concrete rollout)

- **Weeks 1 to 2:** Publish the Cluster 1 pillar ("Phantom Traffic Jams"). Add founder author bio + Person schema. Set up Search Console tracking and a baseline AI-citation check.
- **Weeks 3 to 8:** Publish 1 to 2 Cluster 1 articles per week, each linking to the pillar. Repurpose each to LinkedIn/X and one relevant subreddit.
- **Weeks 6 to 8:** Start the first original-data study from camera/CV data. Draft, then pitch to transportation and local press.
- **Weeks 9 to 12:** Begin Cluster 2 (fleets) pillar + first articles. Refresh the two oldest articles. Review the month-1 dashboard and adjust.
- **Ongoing:** 1 to 2 articles/week, one study/quarter, refresh 2 to 3 old articles/month.

---

## 10. Honesty and brand guardrails (do not skip)

- No fabricated traction, customers, partnerships, or savings.
- Every statistic cites a public source (INRIX, ATRI, Sugiyama 2008, Stern 2018, UTSA Draper 2026, etc.).
- Projected fleet or city benefits are labeled "modeled," sized per pilot.
- No em dashes, no AI-cadence filler, plain human prose.
- Founder-bylined where possible; real photos and real data over stock.

---

### Sources
INRIX 2024 Global Traffic Scorecard; ATRI Cost of Congestion (2024 update); Sugiyama et al. 2008 (New Journal of Physics); Stern et al. 2018 (Transportation Research Part C); UTSA Today (Apr 2026). SEO/GEO research: Google March 2026 core update guidance, topical-authority and pillar-cluster studies, GEO citation-signal analyses (statistics +22%, quotes +37%), and 2026 publishing-cadence data. See the chat thread that produced this doc for the full link list.
