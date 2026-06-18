# Cruze — Investor Brief

**One line:** Cruze predicts stop-and-go traffic waves before they form and guides a small share of drivers to smooth them out, cutting fuel, time, and crashes, with no new hardware on the road.

cruzemaps.com · info@cruzemaps.com · Pre-seed · Texas

> Note for the team: every number below is cited to a public source or labeled as modeled. Keep it that way. Do not add traction, customers, or savings we have not earned.

## The problem

Most traffic is not caused by crashes or bottlenecks. It is caused by physics. When traffic is dense, one driver tapping the brakes makes the next driver brake harder, and that slowdown rolls backward as a stop-and-go wave. Physicists demonstrated this in 2008: cars driving in a loop jam on their own, with nothing in the way (Sugiyama et al., New Journal of Physics, 2008). These phantom jams are a large share of everyday congestion.

The cost is enormous and growing:
- U.S. drivers lost more than 4 billion hours and about $74 billion to congestion in 2024 (INRIX 2024 Global Traffic Scorecard).
- Congestion added $108.8 billion in cost to the trucking industry and wasted 6.4 billion gallons of diesel in 2022 (ATRI Cost of Congestion, 2024 update).

## Why it is solvable now

You do not need to control every car. A University of Arizona test-track study showed that guiding roughly one in twenty vehicles was enough to damp stop-and-go waves and cut fuel for every car behind them (Stern et al., Transportation Research Part C, 2018).

Cruze applies that result commercially, today, without waiting on self-driving:
- The smartphone is already a real-time actuator: it knows speed and position and can give a driver a gentle cue.
- No autonomous fleet and no roadside hardware required, so it deploys on roads as they are.

## What we have built

- A working computer-vision model that reads live public Texas DOT traffic cameras to measure real density and speed.
- A physics-based flow engine (in development) that predicts where a wave is about to form.
- A live product site and an interactive simulation of the wave forming and dissolving (cruzemaps.com).

## Traction and recognition

- First place and the $35,000 top prize at UTSA's Draper Data Science Business Plan Competition, April 2026 (hosted by UTSA's College of AI, Cyber and Computing; reported by news.utsa.edu).
- First pilot corridors lined up in Texas.

We are pre-pilot and pre-revenue, and we say so. The site claims no customers or savings we have not earned.

## How it goes to market

Low-risk, corridor-based pilots:
1. A fleet or DOT names a painful corridor; Cruze points at the cameras already on it. Nothing gets installed.
2. Within days, a measured baseline: where waves form and what they cost in fuel and time.
3. A guided test with a small group of drivers; measure the change against the baseline.
4. Expand from there.

Initial focus: Texas fleets (fuel and hard-stop savings per truck) and cities/DOTs (more throughput from existing roads).

## Why it is hard to copy

- **Incumbents are misaligned.** Google and Waze make money getting one driver to their own destination fastest. Cruze asks a few drivers to ease off for everyone. That trade-off cuts against their core product, which is a big reason it has stayed unbuilt.
- **Coverage compounds.** Every corridor and every guided driver sharpens where Cruze predicts waves and how well it smooths them. A head start is hard to close.
- **The hard part is the whole stack.** Reading live traffic from cameras, predicting waves with physics, and turning that into one safe speed cue, all on real roads, is the work.

## Team

- **Anudeep Bonagiri** — Co-founder and CEO. Computer science and neuroscience at UT San Antonio. Leads the model, the product, and the company.
- **Sreesanth Senthilkumar** — Co-founder.
- Three founding engineers across computer vision, traffic modeling, and the app.
- Based in Texas.

## Stage and ask

Pre-seed, raising to run our first paid pilots in Texas and harden the prediction engine. If you invest at pre-seed in deep-tech, mobility, or climate-adjacent infrastructure and want to be early, email info@cruzemaps.com.

---

*Sources: Sugiyama et al. 2008 (New Journal of Physics); Stern et al. 2018 (Transportation Research Part C); INRIX 2024 Global Traffic Scorecard; ATRI Cost of Congestion, 2024 update; news.utsa.edu (Apr 2026). Projected fleet/city benefits are modeled and validated per pilot.*
