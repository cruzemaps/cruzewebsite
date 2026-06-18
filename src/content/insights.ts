// Insights blog content store. Same shape as caseStudies — drives /insights
// and /insights/:slug.

export type Insight = {
  slug: string;
  title: string;
  author: string;
  authorTitle?: string; // e.g. "Co-founder & CEO" — drives the byline + Person schema (E-E-A-T)
  publishedAt: string;
  excerpt: string;
  body: string; // Markdown subset: ## / ### headings, > pull quotes, - lists, **bold**, [links](/path)
  tags: string[];
};

export const INSIGHTS: Insight[] = [
  {
    slug: "why-traffic-with-no-accident",
    title: "Why is there traffic when there's no accident?",
    author: "Anudeep Bonagiri",
    authorTitle: "Co-founder & CEO, Cruze",
    publishedAt: "2026-06-18",
    excerpt:
      "Most of the traffic you sit in has no crash, no merge, and no bottleneck behind it. Here is what actually causes it, the experiment that proved it, and why routing apps can't fix it.",
    body: `You're cruising at 70 mph on an open highway. Brake lights flare ahead. You slow, then stop. Thirty seconds later traffic is moving again, and you never see a crash, a merge, or a single thing that should have caused it. So why did you just stop?

The answer is one of the most counterintuitive facts about driving: most of the traffic you sit in has no cause you can point to. It is a **phantom traffic jam**, a stop-and-go wave that forms on its own, out of nothing but the way humans follow each other in dense traffic.

## Traffic jams that have no cause

We tend to assume a jam means something is wrong ahead: a wreck, a lane closure, a merge. Those exist, and they cause congestion too. But a huge share of everyday stop-and-go has none of that. The road is nowhere near full, nothing is blocking it, and traffic still grinds to a halt and then frees up for no visible reason.

That pattern has a name. Traffic engineers call it a phantom jam, or a stop-and-go wave. Once you know it exists, you start seeing it on every commute.

## The 2008 experiment that proved it

In 2008, a team of physicists led by Yuki Sugiyama ran a beautifully simple experiment. They put 22 cars on a single-lane circular track and asked every driver to do just one thing: hold a steady speed of about 30 km/h, keeping a safe distance from the car ahead. No obstacles, no intersections, no merges. Just a loop.

Within minutes, a stop-and-go jam formed on its own and began traveling backward around the track, even though nothing was in the way and the drivers were trying to keep moving. (Source: Sugiyama et al., "Traffic jams without bottlenecks," New Journal of Physics, 2008.)

> A jam can form on a road that is nowhere near full. The trigger is not too many cars. It is how a small slowdown amplifies as it passes from one driver to the next.

## Why one tap of the brakes becomes a mile of stopped cars

Here is the mechanism. In dense traffic, no human keeps a perfectly constant speed. Someone drifts a little close, lifts off the gas, or taps the brake. The driver behind reacts a beat late, so they brake a little harder to keep their gap. The next driver brakes harder still. The disturbance does not fade out; it grows as it moves backward through the line of cars.

Past a certain density, the system becomes unstable: a slowdown that started as a tap of the brake amplifies into a full stop somewhere upstream. By the time the wave reaches you, the original cause is long gone, which is why you never see it.

The single most important factor is density. Pack cars close enough and these small disturbances can no longer dissipate, so they feed on themselves and become a self-sustaining wave.

## Why routing apps can't fix it

Apps like Waze, Google Maps, and Apple Maps are excellent at one job: getting you around a jam that already exists. But a phantom jam is not a fixed obstacle you can route around. It is a moving wave created by driver behavior in real time.

Reroute enough drivers onto the next road and you often just seed the same instability there. The jam moves; it does not disappear. We dig into that difference in the [FAQ](/faq).

## What it costs

This is not a small annoyance. U.S. drivers lost more than 4 billion hours and about $74 billion to congestion in 2024 (INRIX 2024 Global Traffic Scorecard). For trucking alone, congestion added $108.8 billion in cost and wasted 6.4 billion gallons of diesel in 2022 (ATRI Cost of Congestion, 2024 update). A large share of that is stop-and-go that no crash ever caused, which is exactly why it costs [fleets](/for-fleets) so much fuel and [cities](/for-cities) so much throughput.

## The surprising fix: you don't need every car

If the wave is created by how a few drivers behave, then changing how a few drivers behave can dissolve it. You do not need self-driving cars and you do not need everyone.

A University of Arizona study (Stern et al., Transportation Research Part C, 2018) put this to the test on a real track: guiding roughly one in twenty vehicles, about 5%, to hold a steadier speed was enough to damp the stop-and-go waves and cut fuel use for every car behind them.

## Where Cruze comes in

This is the problem [Cruze](/) is built to solve. Instead of routing one driver around the wave, Cruze reads the road from existing traffic cameras, predicts where a wave is about to form, and gives a small share of drivers a gentle speed cue so the gap ahead absorbs the disturbance. The wave never builds. Same road, same cars, no new hardware.

You can watch a phantom jam form and then dissolve on our [homepage](/). If you run a fleet or a road network, that smoother flow is fuel saved, hard stops avoided, and time given back. That is the whole idea: dissolve traffic at its source, instead of just steering around it.`,
    tags: ["fundamentals", "traffic-physics"],
  },
  {
    slug: "phantom-traffic-jams-explained",
    title: "Phantom traffic jams, explained: the wave you can't see coming",
    author: "Cruze Research",
    publishedAt: "2026-04-22",
    excerpt:
      "Why traffic suddenly stops on an empty highway, the math behind the wave, and why routing-around can't solve a problem that's caused by routing-around.",
    body: `You're driving 70 mph. Suddenly brake lights. You stop. Thirty seconds later you're moving again, and there's no obstruction in sight.

That's a phantom traffic jam. It is not caused by an accident or a bottleneck. It is caused by one driver tapping the brake a little too hard, and the wave propagating backward through the chain of following vehicles. Each driver brakes slightly more than the one in front, until somewhere upstream, traffic stops.

The math is well-understood. The Treiber-Helbing model and its successors describe traffic as a fluid with drivers as molecules. Stability depends on the response gain, meaning how aggressively each driver corrects to maintain a safe gap. When that gain crosses a threshold, the system goes unstable.

Apps like Waze and Google Maps don't address this. They route you around an existing wave, which paradoxically can intensify the wave by adding traffic to the workaround route. Cruze takes a different approach: rather than route around the wave, we change the inputs that create it. Coordinated speed adjustments across the swarm dampen the response gain below the instability threshold. The wave never forms.`,
    tags: ["fundamentals", "traffic-physics"],
  },
  {
    slug: "fleet-economics-of-stop-and-go",
    title: "The hidden cost of stop-and-go: a fleet ops deep dive",
    author: "Cruze Research",
    publishedAt: "2026-04-08",
    excerpt:
      "Per-truck, per-route, per-shift: where does the fuel actually go in stop-and-go traffic, and what's the real margin on a swarm-routing intervention?",
    body: `For a Class 8 tractor at highway speeds, brake-then-accelerate cycles can consume 4-7x the fuel-per-mile of steady-state cruise. Multiply that across a 600-truck fleet running 80,000 miles per truck per year, and the variance in routes from "smooth" to "congested" represents 8-figure annual swings in fuel spend.

The marginal-returns curve is non-linear. The first 5% of stop-and-go reduction recovers 6 to 8% of fuel. The next 5% recovers another 3 to 5%. After that, the curve flattens, because pure swarm coordination cannot fully eliminate congestion when demand exceeds capacity.

The implication: pilot in the right places. Cruze prioritizes corridors where measured stop-and-go intensity is in the steepest part of the curve. We share the calibration before pilot start so fleet ops know what to expect.`,
    tags: ["fleet-ops", "economics"],
  },
];

export function findInsight(slug: string) {
  return INSIGHTS.find((i) => i.slug === slug);
}
