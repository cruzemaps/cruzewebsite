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
    slug: "why-tailgating-causes-traffic",
    title: "Why does tailgating cause traffic jams?",
    author: "Anudeep Bonagiri",
    authorTitle: "Co-founder & CEO, Cruze",
    publishedAt: "2026-06-28",
    excerpt:
      "Following too closely feels harmless, but short gaps are how one driver's brake tap grows into a mile of stopped cars. Here is the physics of why tailgating makes traffic worse for everyone behind you.",
    body: `Tailgating causes traffic jams because the smaller the gap you leave to the car ahead, the harder you have to brake when it slows, and the harder you brake, the harder the car behind you has to brake. A short following distance turns a tiny speed change at the front of a line into a bigger one a few cars back, and a bigger one after that, until somewhere down the line a car comes to a complete stop on an open road. That stop is a phantom traffic jam, and tight following distances are one of the main things that let it grow.

Most drivers think of tailgating as a safety issue, and it is. But it is also a flow issue. The same short gap that gives you no room to react also strips the whole stream of cars behind you of its ability to absorb small disturbances. This article explains the mechanism, the experiments that prove it, and why leaving a bigger gap is one of the few things an ordinary driver can do that actually helps everyone, not just themselves.

## How a small brake tap becomes a full stop

Imagine a line of cars all moving at 65 mph. The lead driver lifts off the gas for a second, maybe to glance at an exit sign, and slows by 3 mph. Nothing dramatic. The driver right behind sees the gap closing and, because human reactions are not instant, overcorrects slightly, braking to lose 5 mph instead of 3. The next driver back reacts to that larger change with a larger one of their own, dropping 8 mph. Each driver is reacting a beat late and a little too hard, and each one hands a bigger disturbance to the person behind them.

This is called string instability, and it is the core of why traffic jams form with no crash and no bottleneck. A disturbance that should fade out instead grows as it travels backward through the line. After enough cars, the amplification is large enough that someone has to stop completely. We break down the full mechanism in [why there is traffic when there is no accident](/insights/why-traffic-with-no-accident).

The single biggest lever on whether a disturbance grows or shrinks is the gap each driver leaves. A generous following distance gives you time to react gently to the car ahead, so you pass on a smaller disturbance than you received and the wave dies out. A short gap forces you to react sharply, so you pass on a bigger one and the wave builds. Tailgating is, in effect, a choice to amplify every disturbance that reaches you.

## The experiment that proves it

You do not have to take this on faith. In 2008, physicist Yuki Sugiyama and colleagues put 22 cars on a single-lane circular track and asked drivers to do one thing: cruise at a steady speed while keeping a comfortable distance (Sugiyama et al., New Journal of Physics, 2008). There was no light, no merge, no obstacle, and no lead car to blame. Within minutes, tiny variations in human speed-keeping grew into a clear stop-and-go wave that traveled backward around the ring, exactly like a jam on a real highway.

The experiment isolated the cause. With no bottleneck anywhere, the jam came purely from how closely the cars followed each other and how imperfectly humans hold a steady speed. Pack the same cars into a tighter ring, shortening every gap, and the wave forms faster and is harder to escape. The jam is not made of metal and asphalt. It is made of reaction times and following distances.

> A traffic jam with no crash is built out of reaction times and following distances. Leave a bigger gap and you stop amplifying the wave. Tailgate and you feed it.

## Why one tailgater hurts everyone behind them

The frustrating part is that the cost of a short gap is not paid mostly by the tailgater. It is paid by everyone behind them. When you follow too closely and have to brake hard, you inject a disturbance into the stream that grows as it propagates back through dozens of cars you will never see. You may clear your own little gap and feel fine, while a quarter mile back, drivers are rolling to a dead stop because of a chain reaction your braking helped start.

This is also why merely adding lanes does not solve the problem. More lanes raise how many cars a road can hold, but they do nothing to change following behavior, so each lane can still throw its own waves. We cover that in [why adding lanes does not fix traffic](/insights/why-adding-lanes-doesnt-fix-traffic). The bottleneck is not always the road. Often it is the gap.

And the safety and flow problems are the same problem. Rear-end collisions are among the most common crash types on U.S. roads, and they happen for the exact reason phantom jams do: not enough room to react when the car ahead slows. The gap that keeps you from rear-ending someone is the same gap that keeps the stream behind you flowing.

## What this costs

Stop-and-go traffic is not just annoying, it is expensive. In 2024, U.S. drivers lost more than 4 billion hours and about $74 billion to congestion (INRIX 2024 Global Traffic Scorecard). Freight pays an outsized share: congestion added $108.8 billion in operating cost and wasted 6.4 billion gallons of diesel for the trucking industry in 2022 (ATRI, Cost of Congestion to the Trucking Industry, 2024 update). A large slice of that is not raw volume, it is the fuel and time burned accelerating out of waves that short following distances helped create. Every hard brake is energy thrown away as heat, and every car behind it pays the same toll.

## The fix needs only a few drivers

Here is the encouraging part. If short gaps and hard braking make waves grow, then steadier speeds and a little extra room make them shrink, and you do not need every driver to cooperate. A University of Arizona study (Stern et al., Transportation Research Part C, 2018) put a single specially controlled vehicle into a ring of human drivers and had it hold a smooth, steady speed instead of reacting sharply to every fluctuation. That one car, roughly 5% of the traffic, was enough to dissolve the stop-and-go waves the humans kept generating and to cut fuel use for every vehicle behind it.

The lesson is direct: you do not need self-driving cars or wider highways to calm a wave. You need a small number of vehicles, in the right place, leaving enough room to react gently instead of slamming the brakes. The opposite of tailgating, applied by even a few drivers, is enough to break the chain.

## Where Cruze comes in

This is exactly what [Cruze](/) does, automatically and at the right moment. We read the flow from the [traffic cameras already on the poles](/cameras), with no new hardware on the road, predict where a stop-and-go wave is about to form, and give a small share of drivers a gentle, well-timed speed cue, the kind a careful driver leaving a healthy gap would make on their own. It is the 5% finding turned into a product: nudge a few drivers to ease off a few seconds early, and the whole stream behind them stops wave-jamming.

For a [fleet](/for-fleets), that means less fuel burned and fewer hard stops on every congested corridor, plus the safety upside of bigger following distances. For a [city or DOT](/for-cities), it means more reliable throughput from the lanes you already own, measured against the cameras you already have. You can watch a phantom jam form and then dissolve on our [homepage](/).

Tailgating feels like it only affects the space in front of your own bumper. In dense traffic, it does the opposite: it amplifies every disturbance that reaches you and hands a bigger one to everyone behind. The single most useful thing most drivers can do for traffic is also the simplest. Leave a gap. For a longer tour of why traffic forms out of nothing, start with our pillar guide to [phantom traffic jams](/insights/phantom-traffic-jams).`,
    tags: ["fundamentals", "traffic-physics"],
  },
  {
    slug: "why-does-traffic-get-worse-in-the-rain",
    title: "Why does traffic get worse when it rains?",
    author: "Anudeep Bonagiri",
    authorTitle: "Co-founder & CEO, Cruze",
    publishedAt: "2026-07-11",
    excerpt:
      "There is no crash and no closed lane, yet a little rain turns a moving highway into stop-and-go. The reason is not more cars. It is that a wet road quietly holds fewer of them.",
    body: `Traffic gets worse in the rain even when nothing has crashed and no lane is closed. The same commute that flowed at 65 mph on a dry Tuesday crawls the moment the pavement turns wet, and most drivers assume everyone else simply forgot how to drive. The real reason is quieter and more physical than that: rain does not add cars to the road, it removes capacity from the road. And because a busy highway runs close to its limit already, taking away even a slice of that capacity is enough to tip flowing traffic into a jam.

This article explains what actually happens to a highway when it rains, how much capacity a wet road really loses according to the numbers transportation agencies have measured, and why a modest capacity cut produces a jam far larger than you would expect. If you have ever sat in a rain jam with clear road ahead and no accident to blame, this is the mechanism.

## Rain does not add cars, it shrinks the road

Start with the thing that is not happening. A rainstorm does not conjure extra vehicles. Roughly the same number of people are trying to make roughly the same trips they made yesterday. What changes is how much room each of them takes up.

When the pavement is wet, sensible drivers do three things at once, mostly without thinking about it. They ease off the throttle and drop their speed because stopping distances are longer on a slick surface. They leave a bigger gap to the car ahead for the same reason. And they react a beat more cautiously to everything, from brake lights to lane changes, because visibility is worse and grip is lower. Every one of those adjustments is correct and safe. But every one of them also means each car now occupies more time and more space on the road than it did in the dry.

A highway's capacity is just how many vehicles can pass a point per hour, and that number is a product of how fast cars move and how tightly they pack together. Slow them down and spread them out, and you have lowered the capacity of the road without touching a single lane marking. The concrete is the same width it was an hour ago. The usable road just got smaller.

## How much capacity does rain actually cost?

This is measured, not guessed. The Federal Highway Administration's Road Weather Management Program compiles field studies of exactly this effect, and the figures are larger than most drivers would assume.

By the FHWA's numbers, light rain reduces freeway capacity by roughly 4 to 11 percent, and heavy rain cuts it by about 10 to 30 percent (FHWA Road Weather Management Program, "How Do Weather Events Affect Roads?"). Free-flow speeds fall too: around 2 to 13 percent in light rain and 6 to 17 percent in heavy rain. On surface streets the delay compounds, with the FHWA reporting that travel-time delay on arterials can rise anywhere from 11 to 50 percent during precipitation.

Sit with the heavy-rain capacity figure for a second. A highway that could move a certain number of cars per hour in the dry can suddenly move up to a third fewer of them, while the same crowd of drivers keeps arriving at the on-ramps expecting to get through. The demand did not shrink. The supply did.

> Rain does not put more cars on the road. It quietly makes the road hold fewer of them, and a busy highway has no slack to give up.

## Why a small capacity cut causes a big jam

Here is the part that feels out of proportion: even the low end of that range, a 4 to 11 percent capacity loss in light rain, can turn a free-flowing highway into a parking lot. A 10 percent cut sounds survivable. Why does it produce a jam that is far more than 10 percent worse?

Because a busy highway operates right at the edge of its capacity, and traffic flow does not degrade gracefully when you push past that edge. It collapses. As long as the number of cars trying to use the road stays below its capacity, traffic keeps moving and small disturbances fade out. The instant demand exceeds capacity, even briefly, flow breaks down: a queue forms, and once a queue forms it tends to stay and grow, because the stop-and-go crawl of a jammed road actually moves fewer cars per hour than free flow did. The road gets less efficient exactly when it is most overloaded.

So on a dry day your rush-hour highway might be running at 95 percent of capacity, busy but stable. Shave 10 percent off that capacity with a light rain and demand is now above the line. The road tips over the edge, breakdown sets in, and the queue you are sitting in is the result. The rain did not need to be dramatic. It only had to erase the thin margin the highway was running on.

## It is the same physics as a phantom jam

If this sounds familiar, it should. A rain jam is a close cousin of the [phantom traffic jam](/insights/phantom-traffic-jams): congestion that appears with no crash, no merge, and no bottleneck to point at. In a classic phantom jam, dense traffic alone is enough to spawn a stop-and-go wave, because human drivers amplify one another's braking. A 2008 experiment by physicist Yuki Sugiyama and colleagues showed a single lane of cars asked only to hold a steady speed will spontaneously break into a backward-traveling jam with no obstacle present at all (Sugiyama et al., New Journal of Physics, 2008).

Rain does not create that instability from nothing, but it makes it far easier to trigger. Longer gaps and lower speeds mean the road is closer to its breaking point to begin with, and the extra caution makes each driver a slightly louder amplifier of the car in front. The wet-weather jam and the [no-accident phantom jam](/insights/why-traffic-with-no-accident) are the same flow-breakdown story with the dial turned up. It is also why simply having more lanes does not save you, the way [adding lanes rarely fixes traffic for long](/insights/why-adding-lanes-doesnt-fix-traffic): rain lowers the capacity of every lane at once.

## What this costs

Weather-driven congestion is not a rounding error. Across all causes, U.S. drivers lost more than 4 billion hours and about $74 billion to congestion in 2024 (INRIX 2024 Global Traffic Scorecard), and the FHWA has estimated that weather accounts for roughly a quarter of non-recurring traffic delay nationwide. Freight absorbs an outsized share of the pain: congestion added $108.8 billion in operating cost and burned 6.4 billion gallons of diesel for the trucking industry in 2022 (ATRI, Cost of Congestion to the Trucking Industry, 2024 update). A fleet cannot control the weather, but a rainy afternoon that quietly shaves a third off highway capacity turns into missed delivery windows, idling engines, and blown schedules across every truck on the corridor.

## Where Cruze comes in

You cannot make the road dry, and you cannot repeal the physics of flow breakdown. What you can do is stop feeding the instability once the margin gets thin. Because rain works by pushing a busy road over its capacity edge, the leverage is in keeping demand and speeds smooth enough that the road stays just under breakdown instead of just over it. A University of Arizona study (Stern et al., Transportation Research Part C, 2018) found that guiding as few as one vehicle in twenty to hold a steadier speed was enough to dissolve the stop-and-go waves human drivers kept generating and to cut fuel use for every car behind them. In marginal conditions, a small amount of smoother, better-timed behavior is exactly what keeps a fragile flow from collapsing.

That is the wedge [Cruze](/) is built around: reading the state of a corridor in real time and nudging flow before it breaks, rather than measuring the jam after it forms. For a [fleet](/for-fleets), that means fewer hours lost to weather-triggered stop-and-go. For a [city or DOT](/for-cities), it means squeezing reliable throughput out of the road that already exists, on the days the road can least afford to lose it. Rain will always cost some capacity. The goal is to stop it from costing the whole afternoon.`,
    tags: ["fundamentals", "traffic-physics"],
  },
  {
    slug: "why-adding-lanes-doesnt-fix-traffic",
    title: "Why doesn't adding lanes fix traffic? Induced demand, explained",
    author: "Anudeep Bonagiri",
    authorTitle: "Co-founder & CEO, Cruze",
    publishedAt: "2026-06-26",
    excerpt:
      "Widening a highway feels like the obvious fix, but expanded roads tend to fill right back up within a few years. Here is why, what the research actually shows, and what works instead.",
    body: `Adding lanes does not fix traffic, at least not for long. It is the most intuitive fix in the world: the road is full, so make the road bigger. But again and again, widened highways fill back up to roughly the same level of congestion within a few years, and the region is left with a bigger, more expensive road that still jams at rush hour. The reason has a name that every transportation planner knows and most drivers have never heard: induced demand.

This article explains what induced demand is, the research that pinned it down, why it is so reliable that economists call it a law, the famous highway that became a cautionary tale, and what actually moves the needle on congestion when pouring more concrete does not. If you have ever watched a years-long widening project finish and felt the relief evaporate within a season or two, this is why.

## What is induced demand?

Induced demand is the principle that increasing the supply of a road increases the amount it gets used. When you add capacity to a congested highway, you lower the effective cost of driving it, meaning the time it takes. People respond to that lower cost exactly the way they respond to a lower price on anything else: they consume more of it.

That extra driving comes from several places at once. Some people who used to avoid the corridor at peak times start driving it again because it is briefly faster. Some who took side streets or transit shift onto the now-roomier highway. Some make trips they would have skipped or combined before. And over a longer horizon, the cleared-up road reshapes where people choose to live, work, and build, which generates entirely new trips that did not exist before. Each of these is a rational individual decision. Added together, they refill the new lanes.

The key insight is that traffic demand is not a fixed quantity sitting in a queue, waiting for enough road to drain through. It is elastic. It expands and contracts in response to how easy driving is. Build more road and, given a little time, more driving appears to fill it.

## The research: a "fundamental law" of road congestion

This is not a hunch. It is one of the better-measured effects in transportation economics. In 2011, economists Gilles Duranton and Matthew Turner published a study in the American Economic Review titled "The Fundamental Law of Road Congestion," analyzing decades of data across U.S. metropolitan areas. Their finding was stark: vehicle miles traveled rise in close to direct proportion to the lane miles of road you add. The elasticity they measured was near one, meaning a roughly 10% increase in road capacity produced roughly a 10% increase in driving.

In plain terms, the new lanes get used up almost exactly as fast as you build them. That is why they called it a fundamental law rather than a tendency. The relationship was strong enough, and consistent enough across cities, to behave like a rule.

> Vehicle travel rises in close proportion to the lane capacity you add. Build more road and, given a little time, more driving appears to fill it.

Crucially, Duranton and Turner also found that expanding public transit did not durably reduce road congestion either, because any space freed up on the road by new transit riders gets backfilled by induced car trips just the same. The congestion equilibrium is sticky. Whatever you do to relieve it on the supply side, driving demand tends to rise to meet the new capacity.

## The Katy Freeway: a cautionary tale

The most cited real-world illustration is the Katy Freeway, Interstate 10 west of Houston. It was widened in stages and, after a major expansion completed around 2008, became one of the widest freeways in the world, reaching well over 20 lanes across at its broadest point including frontage and managed lanes. If sheer width could beat congestion, this was the experiment.

It did not. Within a few years, peak-period travel times on the corridor had climbed back up, in some analyses ending up worse than before the widening. The road was enormous and it was still congested at rush hour, because the new capacity pulled in exactly the additional trips that induced demand predicts. The Katy Freeway is now shorthand among planners for the limits of widening: you can build the widest highway on the continent and still sit in traffic on it.

## Why phantom jams make widening even less effective

There is a second reason lanes disappoint, and it is one most people miss. Even setting induced demand aside, a wide and under-capacity highway will still throw stop-and-go waves the moment traffic density and driver behavior cross a stability threshold. These are [phantom traffic jams](/insights/phantom-traffic-jams): congestion with no crash, no merge, and no bottleneck behind it, formed purely by the way humans amplify each other's braking in dense traffic.

Lanes raise the ceiling on how many cars a road can hold, but they do nothing to change the physics of how drivers respond to one another. A 2008 experiment by physicist Yuki Sugiyama and colleagues showed that a single lane of cars, asked only to cruise at a steady speed, will spontaneously generate a backward-traveling jam with no obstacle present at all (Sugiyama et al., New Journal of Physics, 2008). Add five more lanes and you have simply created five more places for that same wave to form. You can have all the lanes you want and still wave-jam in every one of them. We unpack the mechanism in [why there is traffic when there is no accident](/insights/why-traffic-with-no-accident).

## What this costs while we keep widening

The stakes are not abstract. In 2024, U.S. drivers lost more than 4 billion hours and about $74 billion to congestion (INRIX 2024 Global Traffic Scorecard). Freight pays an outsized share: congestion added $108.8 billion in operating cost and wasted 6.4 billion gallons of diesel for the trucking industry in 2022 (ATRI, Cost of Congestion to the Trucking Industry, 2024 update). Highway widening, meanwhile, runs into the tens or hundreds of millions of dollars per mile and takes years of construction, during which congestion usually gets worse before the new lanes open and refill. Spending at that scale for a benefit that erodes within a few years is a hard trade to justify, which is why the conversation among forward-looking DOTs has shifted from adding capacity to using existing capacity better.

## What actually reduces congestion

If you cannot build your way out, what works? The honest answer is that nothing erases congestion in a growing region, but several approaches genuinely outperform widening per dollar, because they target demand and flow rather than raw capacity.

- **Pricing the road.** Congestion pricing and managed lanes work because they attack the actual cause: driving is underpriced at peak times. By putting a price on the scarce peak capacity, they shift some trips to other times, routes, or modes, and keep the priced lanes flowing. This is the demand-side lever induced demand implies.

- **Operating the road you have.** Ramp metering, adaptive signal timing, incident management, and other intelligent transportation system tools squeeze more reliable throughput out of existing lanes by smoothing how traffic enters and moves, without pouring concrete.

- **Smoothing the flow itself.** Because so much congestion is stop-and-go waves rather than raw volume, damping those waves recovers throughput the lanes already have. A University of Arizona study (Stern et al., Transportation Research Part C, 2018) found that guiding just one vehicle in twenty, about 5%, to hold a steadier speed was enough to dissolve the stop-and-go waves human drivers kept generating, and to cut fuel use for every car behind them. You do not need more road or self-driving cars to get that benefit. You need a small share of better-timed speeds in the right place.

These are not silver bullets, and we will not pretend they are. But they share a logic that widening lacks: they make better use of the road that already exists instead of betting on capacity that demand will quietly reclaim.

## Where Cruze comes in

This is the gap [Cruze](/) is built to fill. Instead of adding lanes, we help a road carry its existing traffic more smoothly. Cruze reads the flow from the [traffic cameras already on the poles](/cameras), with no new hardware on the highway, predicts where a stop-and-go wave is about to form, and gives a small share of drivers a gentle, well-timed speed cue so the wave never builds. It is the 5% finding turned into a product: change how a few drivers move, a few seconds early, and the whole stream behind them stops wave-jamming.

For a [city or DOT](/for-cities), that means more throughput and more reliable travel times from the lanes you already own, measured against the cameras you already have, at a fraction of the cost and timeline of a widening. For a [fleet](/for-fleets), it is fuel saved and hard stops avoided on every congested corridor. You can watch a phantom jam form and then dissolve on our [homepage](/).

Adding lanes feels like the answer because the problem looks like not enough road. But the research is clear that capacity gets reclaimed by demand, and the physics is clear that wide roads still wave-jam. The durable wins come from using the road better, not just building more of it. That is the whole idea behind dissolving congestion at its source instead of paving over it.`,
    tags: ["city-dot", "traffic-physics"],
  },
  {
    slug: "phantom-traffic-jams",
    title: "Phantom Traffic Jams: Why Traffic Happens for No Reason",
    author: "Anudeep Bonagiri",
    authorTitle: "Co-founder & CEO, Cruze",
    publishedAt: "2026-06-20",
    excerpt:
      "The complete guide to phantom traffic jams: what they are, the experiment that proved them, the physics that makes a single brake tap grow into a mile of stopped cars, what they cost, and why the fix needs only a few drivers.",
    body: `A phantom traffic jam is congestion with no cause you can point to. No crash, no merge, no lane closure, no stalled car. The road is nowhere near full, and traffic still grinds to a stop and then frees up a minute later for no visible reason. It is not bad luck and it is not bad drivers. It is a stop-and-go wave that forms on its own out of the way humans follow each other in dense traffic, and it is responsible for a large share of the congestion you sit in every week.

This is the pillar guide to that phenomenon. If you have ever braked hard on an open highway and then wondered what you just stopped for, this explains the whole thing: what a phantom jam is, the famous experiment that proved it, the physics of why one tap of the brakes becomes a wall of stopped cars, how to tell a phantom jam from a real bottleneck, what it costs drivers and fleets, why none of the usual fixes work, and the surprising finding that you do not need every car to be smart to dissolve it. Along the way we link to deeper articles on each piece.

## What is a phantom traffic jam?

A phantom traffic jam, also called a phantom jam, a traffic wave, or a stop-and-go wave, is a region of stopped or slowed traffic that travels backward along a road without any fixed obstacle creating it. You can think of it as a disturbance moving through the stream of cars, the way a wave moves through water while the water itself stays roughly in place. The cars keep moving forward, but the jam, the dense knot of brake lights, drifts upstream against the flow of traffic at a remarkably steady speed, usually around 10 to 20 km/h.

The defining feature is the missing cause. With a normal bottleneck, you eventually reach the thing that slowed everyone down: the wreck on the shoulder, the work zone, the on-ramp dumping cars into your lane. With a phantom jam there is nothing to reach. By the time the wave gets to you, whatever tiny event started it has long since passed, and the drivers who triggered it are miles down the road moving at full speed. That is why it feels like the traffic appeared from nowhere. In a real sense, it did.

We walk through this from a driver's point of view in [Why is there traffic when there's no accident?](/insights/why-traffic-with-no-accident), which is the best place to start if you want the short version.

## The 2008 experiment that proved phantom jams are real

For decades, phantom jams were a theory. Then in 2008 a team of physicists led by Yuki Sugiyama settled it with one of the most elegant experiments in traffic science. They put 22 cars on a single-lane circular track about 230 meters around and gave every driver a single instruction: drive at a steady speed of roughly 30 km/h, keeping a comfortable distance from the car ahead. There were no intersections, no merges, no obstacles, no slow drivers, and no fast ones. Just a loop and a request to cruise.

For a short while it worked. Then it fell apart. Within minutes a cluster of braking formed on its own, and a stop-and-go wave began traveling backward around the track, exactly opposite to the direction the cars were driving. Some cars came to a complete stop while others a little ahead were still moving freely. Nothing had changed on the track. The jam had emerged purely from the interaction between drivers. (Source: Sugiyama et al., "Traffic jams without bottlenecks: experimental evidence for the physical mechanism of the formation of a jam," New Journal of Physics, 2008.)

> A jam can form on a road that is nowhere near full. The trigger is not too many cars. It is how a small slowdown amplifies as it passes from one driver to the next.

The result was decisive because it removed every other explanation. With a closed loop and identical instructions, the only variable left was human following behavior, and that alone was enough to manufacture a jam from a smoothly flowing ring of traffic. We go deeper on the setup and what it tells us in [Phantom traffic jams, explained](/insights/phantom-traffic-jams-explained).

## The physics: how one tap of the brakes becomes a mile of stopped cars

Here is the mechanism, step by step. In dense traffic, no human holds a perfectly constant speed. Someone drifts slightly close to the car ahead, lifts off the accelerator, or taps the brake. That is normal and unavoidable. The driver behind sees the brake light, reacts a fraction of a second late, and so has to brake a little harder to keep a safe gap. The driver behind them reacts a beat late as well and brakes harder still. Each driver in the chain corrects a touch more aggressively than the one in front.

If the road is not too crowded, that disturbance fades. The extra space between cars absorbs it, and a few cars back, everyone is cruising again. But past a certain density the math changes. The disturbance no longer dies out. It grows as it passes from car to car, feeding on the reaction delay and the over-correction at each step, until somewhere upstream a driver has to come to a complete stop. A tap of the brake has become a wall of stationary cars, and that wall now marches backward through the traffic.

Physicists model this by treating traffic as a kind of fluid, with individual cars playing the role of molecules. Car-following models such as the Intelligent Driver Model, and earlier work by Treiber, Hennecke, and Helbing, capture each driver's tendency to maintain a target speed and a safe gap. What these models show is that the flow has a stability threshold. Below it, small perturbations decay. Above it, they amplify into self-sustaining waves. Researchers have a name for these waves that borrows from physics: jamitons, a play on solitons, the self-reinforcing waves that hold their shape as they travel. (The term comes from work by Flynn, Kasimov, Nave, Rosales, and Seibold on self-sustained nonlinear traffic waves, 2009.) A jamiton, once formed, behaves like a stable structure with its own internal shape, which is why a phantom jam can persist and travel for a long time even as completely different cars flow through it.

The single most important factor in all of this is the response delay combined with density. The slower and later each driver reacts, and the closer the cars are packed, the lower the threshold for instability. This is also why human reaction time matters so much, and why even a small, well-timed smoothing of speed can keep the system on the stable side of the line.

## Density is the trigger, not the number of cars

A common misreading is that phantom jams mean the road is full. They do not. Volume, the raw number of cars, is not the trigger. Density, how tightly those cars are packed into each stretch of road, is. You can have a high-volume highway that flows beautifully because the cars are spread out and moving fast, and you can have a lower-volume road that jams because everyone bunched up.

This distinction matters because it changes what a fix looks like. If the problem were simply too many cars, the only answers would be fewer cars or more road. But because the problem is density and the instability it creates, you can attack it by managing how cars are spaced and how speeds change, without removing a single vehicle or pouring a yard of concrete. That is the opening that makes phantom jams solvable at all.

## What phantom traffic jams cost

This is not a minor irritation. It is one of the largest hidden taxes in the economy. In 2024, U.S. drivers lost more than 4 billion hours and about $74 billion to congestion (INRIX 2024 Global Traffic Scorecard). A substantial portion of that is not crashes or construction. It is everyday stop-and-go that no single event ever caused.

The cost lands even harder on freight. For trucking alone, congestion added $108.8 billion in operational cost and wasted 6.4 billion gallons of diesel in 2022 (ATRI, Cost of Congestion to the Trucking Industry, 2024 update). A heavy truck is brutally inefficient in stop-and-go: every deceleration throws away momentum that diesel has to rebuild, and brake-then-accelerate cycles can burn several times the fuel per mile of steady cruising. That is why smoothing flow is not a comfort feature for a fleet. It is margin. We break down exactly where that fuel goes, per truck and per route, in [The hidden cost of stop-and-go](/insights/fleet-economics-of-stop-and-go), and the same dynamics drive throughput losses for [cities and DOTs](/for-cities).

## Phantom jams versus real bottlenecks: how to tell the difference

Not all congestion is phantom, and the difference is practical. A real bottleneck is a fixed constraint: a crash, a work zone, a merge, a toll plaza, a stretch where lanes drop. The jam sits at the bottleneck and grows upstream from it, and it clears when the constraint clears. If you drive far enough forward, you find the cause.

A phantom jam has no such anchor. It moves. The dense knot of slow cars travels backward along the road while the cause, if there ever was a discrete one, has vanished. You crawl for a minute, then accelerate to full speed, and there is nothing there.

Most real-world congestion is a blend. A genuine bottleneck pushes density high enough that phantom waves start spawning upstream of it, so you get the fixed jam at the merge plus a train of moving waves stacked behind it. Recognizing which is which matters because they need opposite fixes. A bottleneck is a capacity problem you solve with geometry or signal timing. A phantom wave is a stability problem you solve by changing how drivers behave, and the tools that help one often do nothing for the other.

## Why adding lanes does not fix it

The instinct, when a road jams, is to widen it. The evidence on this is humbling. Highway expansions tend to fill back up to a similar level of congestion within a few years, a pattern economists call induced demand. The research is strong enough that Duranton and Turner described a "fundamental law of road congestion": vehicle travel rises in close proportion to the lane capacity you add (American Economic Review, 2011). Build more road and, over time, more driving appears to fill it, and you are back where you started, now with a bigger road to maintain.

Phantom jams sharpen the point. Even a wide, under-capacity highway will throw stop-and-go waves once density and driver behavior cross the instability threshold. Lanes raise the ceiling on volume, but they do not change the physics of how humans amplify each other's braking. You can have all the lanes you want and still wave-jam in every one of them. We go deeper on the economics of capacity in [why adding lanes does not fix traffic](/insights/why-adding-lanes-doesnt-fix-traffic), and expand on this for road owners in our work on [cities and DOTs](/for-cities).

## Why navigation apps cannot solve phantom jams

Apps like Waze, Google Maps, and Apple Maps are genuinely excellent at one job: routing you around a jam that already exists. Given a fixed obstacle ahead, they will find you a faster path around it. But a phantom jam is not a fixed obstacle. It is a moving wave created by driver behavior in real time, and three things make it slip through the cracks of routing.

First, by the time a wave is dense enough to be detected and reported, it is already there, and it is moving, so the "avoid this" instruction is chasing a target that has shifted by the time you act on it. Second, rerouting is a volume tool, not a stability tool: it moves cars from one road to another, but the road you get sent to has the same humans with the same reaction delays, so you can simply seed the instability somewhere new. Third, and most subtly, mass rerouting can intensify the very waves it is trying to escape by pushing a slug of extra cars onto an alternate that then crosses its own density threshold. The jam does not disappear. It relocates. We dig into this paradox in the [FAQ](/faq).

## Can 5% of drivers fix a traffic jam?

Here is the hopeful turn. If a phantom jam is created by how a small number of drivers behave, then changing how a small number of drivers behave can dissolve it. You do not need fully self-driving cars, and you do not need everyone to cooperate.

A University of Arizona study (Stern et al., Transportation Research Part C, 2018) tested this on a real ring of human-driven cars, the same kind of setup as the Sugiyama experiment, but with one car under automated control programmed to hold a steadier speed. Guiding roughly one vehicle in twenty, about 5%, was enough to damp the stop-and-go waves that the human drivers kept generating, and to cut total fuel use for every car on the track, not just the controlled one. One smoothed driver, in other words, calms the chain behind it.

That finding is the whole strategic basis for solving phantom jams at scale. You do not need to replace the fleet or rebuild the road. You need a small share of well-timed, gentle speed adjustments in the right place, and the wave never builds. The leverage is enormous: a few percent of drivers, acting a few seconds earlier, paying off for everyone behind them.

## Why tailgating makes traffic worse

If reaction delay and over-correction are what amplify a disturbance, then the gap you leave to the car ahead is one of the most powerful levers you control. A large gap is a shock absorber. When the car in front slows, a generous following distance lets you ease off the accelerator instead of stabbing the brake, so the slowdown you pass back is gentler than the one you received. The disturbance shrinks as it moves through you. A short gap, the tailgater's gap, does the opposite. You have no room to absorb anything, so you brake hard and late, and you hand the driver behind you a bigger disturbance than you got. Tailgating turns each car into an amplifier instead of a damper.

This is why a road full of close followers goes unstable at a lower density than a road full of patient ones. The aggregate effect of everyone tailgating is to lower the threshold at which phantom waves start spawning, which is the same lever, in reverse, that the 5% smoothing result pulls. Counterintuitively, leaving more space and accelerating and braking more smoothly does not slow you down over the length of a trip. It keeps the whole stream flowing, which gets everyone, including you, through faster. The instinct to close the gap and "make up time" is precisely the behavior that manufactures the jam you are stuck in.

## What you can do behind the wheel

You cannot single-handedly fix a highway, but the Arizona result cuts both ways: individual behavior genuinely moves the system, so a few good habits help more than they seem to. Leave a longer following distance than feels necessary, especially in dense traffic, so you have room to react with the accelerator rather than the brake. Try to hold a steady speed instead of surging up to the bumper ahead and then braking; anticipate the flow two or three cars forward rather than reacting to the one directly in front. Merge early and zipper smoothly rather than darting between lanes, since lane changes inject exactly the kind of disturbance that seeds a wave. None of this requires special equipment, and none of it costs you time over a full trip. It is the human version of what an automated smoother does: keep your own contribution on the stable side of the threshold.

The limit, of course, is coordination. One patient driver helps locally, but a single person cannot reliably be in the right place at the right moment across a whole corridor, and most drivers will keep doing what they have always done. That is the gap between knowing the fix and actually delivering it at scale, and it is exactly where technology has to step in.

## Where Cruze comes in

This is the exact problem [Cruze](/) is built to solve. Instead of routing one driver around a wave that already formed, Cruze works upstream of the wave itself. It reads the road from existing traffic cameras, no new hardware on the truck or the highway, predicts where a stop-and-go wave is about to form, and gives a small share of drivers a gentle, well-timed speed cue so the gap ahead absorbs the disturbance before it can grow. Keep the flow on the stable side of the threshold and the jam never builds in the first place. Same road, same cars, same number of vehicles, smoother flow.

It is the 5% finding turned into a product: change how a few drivers move, a few seconds early, and the whole stream behind them stops wave-jamming. For a [fleet](/for-fleets), that smoother flow is fuel saved and hard stops avoided on every congested corridor. For a [city or DOT](/for-cities), it is more throughput from the lanes you already own, measured from the [cameras](/cameras) already on the poles. You can watch a phantom jam form and then dissolve on our [homepage](/).

That is the whole idea, and the thread running through every article in this cluster: phantom traffic happens for no reason you can see, it costs more than almost anyone realizes, and you do not need to rebuild the roads or replace the cars to fix it. You need to dissolve the wave at its source instead of steering around it.`,
    tags: ["fundamentals", "traffic-physics"],
  },
  {
    slug: "why-traffic-with-no-accident",
    title: "Why is there traffic when there's no accident?",
    author: "Anudeep Bonagiri",
    authorTitle: "Co-founder & CEO, Cruze",
    publishedAt: "2026-06-18",
    excerpt:
      "Most of the traffic you sit in has no crash, no merge, and no bottleneck behind it. Here is what actually causes it, the experiment that proved it, and why routing apps can't fix it.",
    body: `You're cruising at 70 mph on an open highway. Brake lights flare ahead. You slow, then stop. Thirty seconds later traffic is moving again, and you never see a crash, a merge, or a single thing that should have caused it. So why did you just stop?

The answer is one of the most counterintuitive facts about driving: most of the traffic you sit in has no cause you can point to. It is a [phantom traffic jam](/insights/phantom-traffic-jams), a stop-and-go wave that forms on its own, out of nothing but the way humans follow each other in dense traffic.

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

That's a [phantom traffic jam](/insights/phantom-traffic-jams). It is not caused by an accident or a bottleneck. It is caused by one driver tapping the brake a little too hard, and the wave propagating backward through the chain of following vehicles. Each driver brakes slightly more than the one in front, until somewhere upstream, traffic stops.

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

The implication: pilot in the right places. Cruze prioritizes corridors where measured stop-and-go intensity is in the steepest part of the curve. We share the calibration before pilot start so fleet ops know what to expect.

For the physics behind why that stop-and-go forms in the first place, see our pillar guide to [phantom traffic jams](/insights/phantom-traffic-jams).`,
    tags: ["fleet-ops", "economics"],
  },
  {
    slug: "does-changing-lanes-get-you-there-faster",
    title: "Does changing lanes actually get you there faster?",
    author: "Anudeep Bonagiri",
    authorTitle: "Co-founder & CEO, Cruze",
    publishedAt: "2026-07-08",
    excerpt:
      "The lane next to you looks faster, so you switch. Research says the speed gain is mostly an illusion, and every lane change you make helps seed the stop-and-go waves that slow everyone down, including you.",
    body: `In heavy traffic almost no. The lane next to you usually is not moving faster on average, it only feels that way, and each time you switch lanes to chase it you add a small disturbance to the traffic stream that helps trigger the very stop-and-go waves that are slowing you down. Staying in a steady lane at a steady speed gets you there at close to the same time and it keeps the whole road smoother. Here is why the feeling is so convincing and why acting on it backfires.

## The other lane really does look faster, and that is a trick of perception

The sense that you picked the wrong lane is one of the most reliable feelings in driving, and it has been studied directly. In 1999 two researchers, Donald Redelmeier and Robert Tibshirani, published a short paper in Nature titled "Why cars in the next lane seem to go faster." Their answer: in congested traffic a driver spends more time being overtaken than overtaking, so the cars in the next lane are in view for longer while they pass you than while you pass them. Averaged over a trip, the neighboring lane looks like it is winning even when both lanes are moving at the same average speed. (Source: Redelmeier and Tibshirani, "Why cars in the next lane seem to go faster," Nature, volume 401, page 35, 1999.)

They tested the illusion, not just the theory. When they showed drivers a video clip in which the camera car was actually moving slightly faster than the next lane, about 70 percent of viewers guessed, incorrectly, that the other lane was moving faster. The perception is strong enough to override what is happening right in front of you.

There is a second reason the feeling misleads you. Traffic in a dense stream is not smooth, it pulses. Any given lane speeds up and slows down in waves, so at the exact moment you glance over, one lane is often in the fast part of its cycle while yours is in the slow part. A few seconds later the two swap, but by then you have already formed the judgment and started drifting toward the gap.

> The lane you envy is usually the lane you were just in a minute ago. You are not choosing a faster lane, you are chasing the phase of a wave.

## Switching lanes does not just fail to help, it makes traffic worse

If lane changing were merely useless it would not matter much. The problem is that it is not neutral. A lane change is a disturbance injected into two lanes at once: you open a gap in the lane you leave and you force the driver you cut in front of to lift off or brake to rebuild a safe gap. In light traffic that is absorbed instantly. In dense traffic it is exactly the kind of small perturbation that grows.

Traffic scientists have measured this on real freeways. Using detailed vehicle trajectory data, Ahn and Cassidy (2007) found that lane changes can trigger stop-and-go oscillations and make them grow as they travel. Zheng and colleagues (2011) went further and showed that in the absence of other causes, lane changing is a primary trigger that turns small, localized wobbles into substantial stop-and-go disturbances. In other words, the maneuver you make to escape the jam is one of the things that builds the jam. (Sources: Ahn and Cassidy, "Freeway traffic oscillations and vehicle lane-change maneuvers," 2007; Zheng et al., microscopic wavelet analysis of freeway oscillations, Transportation Research Part B, 2011.)

This connects directly to why phantom jams form at all. As we cover in the pillar guide to [phantom traffic jams](/insights/phantom-traffic-jams), a stop-and-go wave grows when one driver's slowdown makes the next driver brake a little harder, and the next harder still, until someone stops. A lane change is a ready-made source of that first slowdown. Every time a driver darts into a gap, the follower behind has to decelerate, and that deceleration can be the seed the road amplifies into a wall of brake lights that then travels backward for miles. We walk through that amplification from a driver's seat in [why there is traffic when there is no accident](/insights/why-traffic-with-no-accident).

## Why the average driver comes out even, or behind

Put the two findings together. The lane you jump to is not actually faster on average, so the best case is that all your weaving nets you almost nothing. But the weaving itself costs something: each merge you make adds a braking event for the drivers around you, and enough of those events tip a stretch of road from smooth flow into oscillation. The aggressive lane-changer is trading a real contribution to congestion for an imaginary time saving.

This is why calm, predictable driving is not just polite, it is efficient. A driver who holds a lane and a steady gap absorbs the wobbles coming from ahead instead of passing them on amplified. A road full of drivers doing that stays under the instability threshold longer. The counterintuitive lesson from the research is that the way to get everyone through faster is for individuals to stop optimizing for their own lane, which is also the thing the individual is worst at judging.

It is the same lesson we reach from the supply side in [why adding lanes does not fix traffic](/insights/why-adding-lanes-doesnt-fix-traffic): the bottleneck is rarely raw capacity, it is how the flow behaves. More lanes give restless drivers more lanes to hunt through. What actually helps is smoothing behavior within the lanes you already have.

## The catch: knowing this does not make anyone stop

The illusion is powerful, and telling drivers that their lane is fine does not beat a feeling that fires every few seconds in stop-and-go. This is the gap between knowing the physics, which we lay out in [phantom traffic jams, explained](/insights/phantom-traffic-jams-explained), and changing what happens on the road. People cannot see the wave they are feeding, and they cannot feel that the neighboring lane will slow down in ten seconds. They only see a gap and an open road ahead of it.

That is the problem Cruze is built to close. Instead of asking drivers to fight an illusion with willpower, the idea is to give a small, well-timed speed cue that keeps a driver smooth through the pulse, so there is no reason to lunge for the next lane in the first place. The striking result from the traffic-wave literature is that this does not require everyone. In the 2018 Arizona ring-road experiment led by Raphael Stern, a single smoothly controlled vehicle among roughly twenty was enough to damp the stop-and-go wave for the whole loop. Fewer than one driver in twenty, driving steadily, changed the behavior of the entire group. (Source: Stern et al., 2018, single controlled-vehicle ring experiment.)

Cruze aims to be the software version of that steady driver, delivered as an in-cab speed advisory rather than a self-driving system or new roadside hardware. For a fleet, the payoff is fuel: brake-then-accelerate cycles burn several times the fuel of steady cruising, which is why stop-and-go is such an expensive tax on trucking, and we break that math down in [the hidden cost of stop-and-go](/insights/fleet-economics-of-stop-and-go). Congestion overall costs U.S. drivers an estimated 74 billion dollars and roughly 4 billion lost hours a year (INRIX 2024), and the trucking industry alone about 108.8 billion dollars and 6.4 billion gallons of wasted diesel (ATRI 2024). A meaningful slice of that is stop-and-go that never needed to happen.

See how the advisory works for [fleets](/for-fleets) and for [cities](/for-cities), and how the [camera pipeline](/cameras) reads the road that feeds it. Cruze is pre-pilot, so these are the mechanisms and the published science behind them, not a measured Cruze result.

## The honest takeaway

Next time the lane beside you looks faster, remember that roughly 70 percent of drivers in a controlled test believed the same thing while their own lane was actually quicker. Hold your lane, keep an even gap, and let the small disturbances die in front of you instead of passing them back amplified. You will arrive at nearly the same time, with less stress, and you will have quietly done the one thing that helps the road: nothing dramatic.`,
    tags: ["fundamentals", "traffic-physics"],
  },
];

export function findInsight(slug: string) {
  return INSIGHTS.find((i) => i.slug === slug);
}
