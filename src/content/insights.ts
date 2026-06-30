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
    slug: "why-traffic-jams-move-backward",
    title: "Why do traffic jams move backward? Shockwaves, explained",
    author: "Anudeep Bonagiri",
    authorTitle: "Co-founder & CEO, Cruze",
    publishedAt: "2026-06-30",
    excerpt:
      "Every car in a jam is moving forward, yet the jam itself slides toward you. Here is why traffic jams travel backward, the 1950s shockwave theory that explains it, and why you can't drive around one.",
    body: `You are crawling along in stop-and-go traffic when you notice something strange. The jam is moving toward you. The cars around you inch forward, but the wall of brake lights keeps sliding back down the highway, against the direction of travel, like a wave rolling upstream against a river. Why does a traffic jam move backward when every car in it is moving forward?

The short answer: the thing moving backward is not the cars. It is a wave. A traffic jam is a pattern, a boundary between packed cars and open road, and that boundary travels in the opposite direction from the traffic itself. Understanding why is one of the most useful things you can know about congestion, because it explains why jams feel like they come out of nowhere and why you can't simply drive around them.

## The cars go forward, the jam goes back

Picture the back edge of a jam, the point where free-flowing traffic first has to slam on the brakes. Every few seconds, another car arrives at that edge from behind and joins the back of the queue. So the back of the jam keeps reaching further and further upstream, even as the cars inside it creep forward.

Now picture the front edge, where cars finally accelerate out of the jam and back up to speed. Cars leave from the front one at a time. As long as cars are joining the back faster than they are leaving the front, the whole jam slides backward down the road. The cars move forward; the jam moves back. They are two different motions, and confusing them is why backward-moving traffic feels so baffling.

Traffic scientists call this moving boundary a shockwave, and the whole pattern a [phantom traffic jam](/insights/phantom-traffic-jams) or stop-and-go wave.

## The theory that named it: shockwaves on the highway

This is not a loose metaphor. It is a piece of math worked out in the 1950s. In 1955, Michael Lighthill and Gerald Whitham modeled traffic as a flowing medium and showed that changes in traffic density travel along a road as kinematic waves, much like waves in water or sound. The next year, Paul Richards independently published a paper with a title that says it all: "Shock Waves on the Highway." (Sources: Lighthill and Whitham, "On Kinematic Waves II: A Theory of Traffic Flow on Long Crowded Roads," Proceedings of the Royal Society A, 1955; Richards, "Shock Waves on the Highway," Operations Research, 1956.) Together their work is known as the LWR model, and it is still the foundation of how engineers think about congestion.

The core idea is simple. Where traffic is dense and slow, cars are packed tightly. Where it is light and fast, they are spread out. The line separating those two states is a shock, much like the boundary in front of a snowplow piling up snow. And the math shows that under normal highway conditions, that boundary moves backward, upstream, against the flow.

> The cars are moving forward the whole time. What is traveling toward you is the boundary between jammed and free road, and that boundary moves the opposite way.

## Why it moves backward at a steady speed

Here is the part that surprises people: the backward speed of a jam is remarkably consistent. Whether the jam is on a city ring road or an interstate, the upstream edge tends to slide back at a steady pace, often measured in the range of roughly 12 to 20 km/h, about 8 to 12 mph. It does not depend much on how fast the cars themselves are going.

That steadiness falls straight out of the shockwave picture. The speed of the boundary is set by the rate cars join the back versus leave the front, and those rates are governed by how closely humans pack together and how quickly they react, which do not change much from one jam to the next. So the wave keeps a near-constant backward pace, which is why a jam can roll a mile down the highway and still be going when it finally reaches you.

## Watching it happen with no cause at all

The cleanest proof that these backward waves are real, and not just a reaction to crashes or merges, came from a deceptively simple experiment. In 2008, a team led by Yuki Sugiyama put 22 cars on a single-lane circular track and asked every driver to do one thing: hold a steady speed and keep a safe gap. No obstacles, no merges, no intersections.

Within minutes a stop-and-go jam formed on its own and began traveling backward around the loop, exactly as shockwave theory predicts, even though nothing was blocking the road. (Source: Sugiyama et al., "Traffic jams without bottlenecks," New Journal of Physics, 2008.) The jam was a pure wave, created by nothing but the way humans follow one another, and it marched backward against the cars the whole time. We tell the fuller story of that experiment in [why there's traffic when there's no accident](/insights/why-traffic-with-no-accident).

## Why you can't drive around a backward wave

This is the practical punchline. A backward-traveling wave is not a place. It is not a stalled truck you can route around or a closed lane you can avoid. By the time you hit the brakes, the disturbance that started the jam happened far ahead of you and minutes ago. You are reacting to a wave that has been rolling toward you the whole time.

That is also why [adding lanes rarely fixes the problem](/insights/why-adding-lanes-doesnt-fix-traffic) and why navigation apps can only do so much. They are excellent at steering you around a fixed obstacle, but a shockwave is a moving pattern in the traffic itself. Reroute enough drivers and you often just seed the same wave on the next road over. The jam relocates; it does not dissolve.

## What these waves cost

Backward-rolling stop-and-go is not a minor nuisance. U.S. drivers lost more than 4 billion hours and about $74 billion to congestion in 2024 (INRIX 2024 Global Traffic Scorecard). For trucking alone, congestion added $108.8 billion in cost and wasted 6.4 billion gallons of diesel in 2022 (ATRI Cost of Congestion, 2024 update). A large share of that is exactly this kind of stop-and-go, the waves that no crash ever caused, which is why they cost [fleets](/for-fleets) so much fuel and [cities](/for-cities) so much throughput.

## The fix: damp the wave, don't chase it

If a jam is a wave created by how drivers behave, then you stop it by changing how a few of them behave at the right moment. You do not need self-driving cars and you do not need everyone.

A University of Arizona study (Stern et al., Transportation Research Part C, 2018) tested this on a real track: guiding roughly one in twenty vehicles, about 5%, to hold a steadier speed was enough to damp the stop-and-go waves and cut fuel use for every car behind them. Smooth out the way a handful of drivers approach the back edge, and the wave loses its fuel and fades instead of rolling on.

## Where Cruze comes in

This is the problem [Cruze](/) is built to solve. Instead of routing one driver around a wave they can't escape, Cruze reads the road from existing traffic [cameras](/cameras), predicts where a backward wave is about to form, and gives a small share of drivers a gentle speed cue so the gap ahead absorbs the disturbance before it becomes a wall of brake lights. The wave never gets going. Same road, same cars, no new hardware.

You can watch a phantom jam form and then dissolve on our [homepage](/). If you run a fleet or a road network, a wave that never builds is fuel saved, hard stops avoided, and time given back. That is the whole idea: stop the wave at its source instead of chasing it down the highway.`,
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
];

export function findInsight(slug: string) {
  return INSIGHTS.find((i) => i.slug === slug);
}
