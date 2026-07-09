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
  {
    slug: "do-ramp-meters-work",
    title: "Do ramp meters actually work? The on-ramp traffic light, explained",
    author: "Cruze Research",
    publishedAt: "2026-07-03",
    excerpt:
      "Those stop-and-go lights on the freeway on-ramp look like they slow you down. The evidence, including a rare eight-week experiment where an entire city switched all of them off, says they do the opposite.",
    body: `Yes, ramp meters work, and there is unusually strong evidence for it. Most traffic fixes are hard to prove because you can never rerun the same commute with and without them. Ramp metering is the rare case where a whole metro area ran that exact experiment, turned every meter off for eight weeks, and measured what happened. Traffic got worse across the board. This article explains what a ramp meter does, the mechanism that makes it help, the natural experiment that proved it, where it falls short, and how the same idea shows up inside the car instead of on the ramp.

## What is a ramp meter?

A ramp meter is the small traffic signal you see partway down a freeway on-ramp, usually cycling red to green every few seconds so that one or two cars enter per green. Its only job is to control the rate at which cars join the freeway. Instead of a whole platoon of merging cars arriving at the mainline together, the meter releases them one at a time, spaced a few seconds apart.

That sounds like it should make your trip longer, because you now wait at a light you did not used to wait at. The counterintuitive part is that the short wait on the ramp buys a much larger saving on the freeway itself, for you and for everyone already on it.

## The mechanism: protecting the freeway from breakdown

To see why a few seconds of delay on the ramp pays off, you have to know one fact about highways: a freeway carries the most cars per hour just below the point where it jams, not at it. Push the density past that critical point and throughput does not level off, it drops. The same road that was moving 2,000 cars per lane per hour can fall to 1,700 or 1,800 once flow breaks down. Traffic engineers call this the capacity drop, and it is the reason a freeway can carry fewer cars when it is packed than when it is merely busy.

A big, bunched group of cars forcing its way in at an on-ramp is one of the most common ways to tip the mainline over that edge. The merge compresses the gaps, drivers already on the freeway brake to make room, and that braking becomes the seed of a backward-traveling wave, the same stop-and-go mechanism we describe in [why there is traffic when there is no accident](/insights/why-traffic-with-no-accident). Once the mainline breaks down, it stays broken long after the merge that triggered it.

The meter's job is to never let the freeway cross that line. By metering the inflow, it keeps mainline density just under the critical point, where throughput is highest. Smarter meters do this with feedback: a well-known control law called ALINEA (Papageorgiou, Hadj-Salem, and Blosseville, 1991) measures how occupied the freeway is just downstream and continuously adjusts the meter rate to hold that occupancy near its sweet spot, loosening when the road is clear and tightening the moment it starts to fill.

> The few seconds you wait on the ramp are the price of keeping the freeway on the fast side of its own breakdown point, where it carries the most cars.

## The experiment that proved it: the Twin Cities meter shutdown

In fall 2000, the Minnesota Department of Transportation did something almost no agency ever gets to do. Under a legislative mandate to prove the meters were worth it, they switched off all 433 ramp meters in the Minneapolis and Saint Paul metro area for eight weeks and measured freeway performance with the meters dark against the same corridors with the meters running. It cost about 650,000 dollars and remains one of the cleanest before-and-after tests in traffic operations.

The results, from the independent Cambridge Systematics evaluation, were consistent and in one direction. With the meters off:

- Freeway throughput fell about 9 percent, meaning the road actually moved fewer cars without metering.
- Travel time rose about 22 percent.
- Freeway speeds dropped about 7 percent.
- Crashes increased about 26 percent, because unmetered merges create exactly the abrupt speed differences that cause rear-end and sideswipe collisions.

(Source: Minnesota Department of Transportation, Twin Cities Ramp Meter Evaluation, Cambridge Systematics, 2001.) The state turned the meters back on. The finding that the road carried fewer cars without metering is the key one: the meters were not just redistributing delay from the freeway to the ramp, they were raising the total capacity of the system.

## Where ramp meters fall short

Ramp meters are not a cure for congestion, and it is worth being honest about the limits.

- **They move the queue, and it can spill.** The cars held back have to wait somewhere. If a meter is too aggressive, the ramp queue backs up onto the surface street it feeds, trading a freeway problem for an arterial one. Good metering caps the ramp wait and lets cars through faster when the queue gets long.
- **They cannot beat oversaturation.** When far more people want to travel than the freeway can carry, no metering rate makes the demand fit. Metering smooths the approach to capacity, it does not add lanes of it.
- **They raise fairness questions.** A driver entering downstream, past the worst metering, can get a better deal than one entering upstream, and that has drawn real complaints in every city that meters heavily.

And crucially, a ramp meter only guards the on-ramp. It does nothing about a phantom jam that forms a mile past the last meter, out in free-flowing traffic, from nothing but the way drivers follow each other. That failure mode is the whole subject of our pillar guide to [phantom traffic jams](/insights/phantom-traffic-jams), and it is one reason adding capacity alone keeps disappointing, as we cover in [why adding lanes does not fix traffic](/insights/why-adding-lanes-doesnt-fix-traffic).

## The same idea, moved into the car

Strip a ramp meter down to its principle and it is simple: hold the flow just under the density where it breaks down, and everyone gets through faster. The meter does that at one fixed point, the on-ramp, with hardware bolted to the pavement.

Cruze applies the same principle everywhere at once, from inside the car. Instead of a light on a ramp, it is a speed cue on the driver's screen. When the traffic ahead is drifting toward the breakdown point, a small, well-timed easing of speed across a handful of drivers keeps the stream on the stable side of the line, the same way the meter keeps the mainline below critical occupancy. The research says you do not need many participants for this: the landmark 2018 experiment led by Raphael Stern showed that a single smoothly driven car in a stream of about twenty was enough to damp a stop-and-go wave for everyone behind it.

The advantage of doing it in software is reach. A ramp meter helps only the merges that have one installed, after an expensive infrastructure build. An in-cab cue works on any road, metered or not, on the open highway where phantom jams actually form, with nothing to install on the roadside. Cruze is pre-pilot, and we make no traffic-reduction claims yet. But the Minnesota shutdown is the strongest field proof we have that gently regulating flow, rather than routing around jams after they form, is what actually raises a road's real capacity.

For fleets weighing what smoother flow is worth per truck, see [the hidden cost of stop-and-go](/insights/fleet-economics-of-stop-and-go). To bring this thinking to a corridor you manage, that is what we build for [cities](/for-cities) and [fleets](/for-fleets).`,
    tags: ["fundamentals", "traffic-physics"],
  },
  {
    slug: "do-variable-speed-limits-work",
    title: "Do variable speed limits actually work? Speed harmonization, explained",
    author: "Anudeep Bonagiri",
    authorTitle: "Co-founder & CEO, Cruze",
    publishedAt: "2026-07-02",
    excerpt:
      "Those overhead signs telling you to slow to 40 in a 70 zone are not arbitrary. Here is the physics of speed harmonization, the field evidence that it works, and where the gantry approach hits its limits.",
    body: `You are on the highway, traffic is moving fine, and an overhead sign suddenly drops the speed limit from 70 to 40. There is no crash in sight, no construction, no obvious reason at all. It feels like the road is messing with you. It isn't. That sign is one of the few tools traffic engineers have that attacks congestion at its actual source, and the evidence says it works, within limits worth understanding.

## What variable speed limits are

A variable speed limit system, sometimes called speed harmonization or a managed or smart motorway, is a stretch of highway instrumented with traffic sensors and overhead electronic signs. When the sensors detect congestion building downstream, the system lowers the posted limit for the traffic still approaching it, often in steps: 60, then 50, then 40, spread across the gantries leading up to the trouble spot.

The goal is not to slow your trip. It is to do two things at once: shrink the speed difference between the fast traffic arriving and the slow traffic ahead, and meter how quickly new cars pour into the back of the queue. Both matter, and both come straight from the physics of how jams grow.

## The physics: slow down early so you don't stop at all

A [phantom traffic jam](/insights/phantom-traffic-jams) is a wave. Cars pile into its back edge faster than they escape its front, so the jam grows and rolls backward down the highway toward you. Once you see the brake lights, it is too late to do anything but join it.

But the wave has a weakness: it has to be fed. A jam only persists if traffic keeps arriving at its tail faster than the front can discharge. Slow the arriving traffic down early, a mile or two upstream, and cars trickle into the queue at a rate closer to the rate cars are leaving it. Starve the wave and it shrinks. Starve it enough and it dissolves entirely, before most drivers ever touch their brakes.

> A lower limit ahead of a jam is not there to slow your trip. It is there to dissolve the stop-and-go wave before you reach it, trading a brief 40 for never sitting at 0.

That is the counterintuitive bargain: briefly driving slower can get everyone through sooner and far more smoothly than driving fast into a wall of stopped cars. The stop is what costs you, in time, in fuel, and in rear-end crash risk. This is the same insight behind [why jams form with no accident at all](/insights/why-traffic-with-no-accident): the enemy is the speed variance, not the speed.

## The evidence: it actually works

This is not just theory. It has been measured on real highways for decades.

The most famous deployment is London's M25 orbital motorway, where mandatory variable limits with camera enforcement went live in 1995. The UK's Transport Research Laboratory evaluated it for years and found injury accidents fell by roughly 10%, drivers kept steadier speeds and more uniform gaps with noticeably less braking, and fuel consumption and emissions dropped by a few percent (TRL, "Speed-control and incident-detection on the M25 Controlled Motorway," summary of results 1995 to 2002).

The sharpest test came from the Netherlands. Researchers Andreas Hegyi and Serge Hoogendoorn built an algorithm called SPECIALIST that used variable speed limits for one purpose only: detect a stop-and-go shockwave rolling backward down the A12 freeway and kill it by slowing the traffic upstream of it. In the field test, run from late 2009 into 2010 across 14 kilometers of highway, the system resolved the targeted shockwaves in roughly 80% of the cases where it activated on one (Hegyi and Hoogendoorn, "Dynamic speed limit control to resolve shock waves on freeways: Field test results of the SPECIALIST algorithm," IEEE ITSC, 2010). A backward-rolling jam, the kind [our pillar piece](/insights/phantom-traffic-jams) explains in depth, was detected and deliberately dissolved by slowing drivers who had not even reached it yet. Studies of German autobahn systems point the same direction, with crash reductions concentrated exactly where the theory predicts: rear-end collisions at the back of queues.

Honesty requires the caveat: the A12 test did not measurably cut total travel time, and about half its activations fired on other kinds of congestion where it helped less. The consistent, replicated wins are safety, smoothness, and fuel, not a faster commute. Anyone selling speed harmonization as a travel-time miracle is overselling it.

## The honest limits of the gantry approach

If variable speed limits work, why doesn't every highway have them? Because the tool is expensive, blunt, and stuck where it is built.

- **It is infrastructure.** Gantries, sensors, signs, and enforcement cameras every few hundred meters, plus a control room. That is why deployments cover a handful of urban corridors, not the road network. The freeway where your fleet actually loses its time and fuel probably is not one of them.
- **It is a blanket.** The sign slows every vehicle in every lane, including hundreds of drivers who did not need to change anything, because a gantry cannot talk to the one platoon whose behavior actually feeds the wave.
- **It depends on compliance.** The M25's results came with mandatory limits and automated cameras. Advisory-only versions, where the sign merely suggests, show much weaker effects, because a sign that most drivers ignore harmonizes nothing.
- **It cannot move.** The wave rolls; the gantry doesn't. And [adding more pavement doesn't escape the problem either](/insights/why-adding-lanes-doesnt-fix-traffic), because new lanes fill and then breed the same waves.

Meanwhile the cost of leaving the waves alone keeps compounding: U.S. drivers lost about 4 billion hours and $74 billion to congestion in 2024 (INRIX 2024 Global Traffic Scorecard), and congestion cost trucking $108.8 billion and 6.4 billion gallons of diesel in 2022 (ATRI Cost of Congestion, 2024 update). Stop-and-go is a large share of that bill, and it lands hardest on [fleets](/insights/fleet-economics-of-stop-and-go).

## From the gantry to the cab

Here is the encouraging part. The physics that makes a gantry work does not require a gantry. It requires that some of the approaching traffic smooths out at the right moment.

In 2008, Yuki Sugiyama's team showed that 22 ordinary drivers on a ring road spontaneously create a stop-and-go wave with no bottleneck at all (Sugiyama et al., "Traffic jams without bottlenecks," New Journal of Physics, 2008). A decade later, a University of Arizona-led experiment showed the inverse: guiding roughly 5% of vehicles to hold a steadier speed damped the wave for everyone and cut the whole traffic stream's fuel burn (Stern et al., Transportation Research Part C, 2018). You do not need to slow every car from a sign. You need the right few vehicles to do the smoothing, and they can be told individually, in the cab, on any road, whether or not the highway department ever budgeted for gantries there.

That turns speed harmonization from a civil-engineering project into a software problem: know where the wave is forming, and deliver the right speed cue to a small share of drivers approaching it.

## Where Cruze comes in

That software problem is what [Cruze](/) is built on. Instead of waiting for a corridor to get instrumented, Cruze reads the road through existing traffic [cameras](/cameras), spots the conditions of a forming stop-and-go wave, and delivers gentle advisory speed guidance to participating drivers upstream, the in-cab version of what the M25's gantries do for one orbital road, available anywhere a camera already watches the road. For a [fleet](/for-fleets), the payoff channel is the same one TRL measured: fewer hard stops, steadier speeds, less wasted fuel. For a [city](/for-cities), it is corridor smoothing without the per-mile capital cost of gantries.

We are honest about where we are: the physics and the field evidence above belong to the researchers and road agencies who published them, and Cruze's own pilot numbers will be reported when we have them. But the mechanism is not speculative. Road agencies have been dissolving phantom jams by harmonizing speed for thirty years. The question we are answering is simpler: what happens when that tool stops being bolted to one expensive stretch of highway and starts riding along in the cab?`,
    tags: ["fundamentals", "traffic-physics"],
  },
  {
    slug: "why-you-hit-every-red-light",
    title: "Why do you hit every red light? The green wave, explained",
    author: "Anudeep Bonagiri",
    authorTitle: "Co-founder & CEO, Cruze",
    publishedAt: "2026-07-02",
    excerpt:
      "Hitting one red after another rarely means bad luck. It usually means the lights are not timed to your speed. Here is what a green wave is, why so many corridors do not have one, and how the right speed at the right moment lets you ride the greens.",
    body: `If you hit every red light on the same street, day after day, it is almost never bad luck. It is a design outcome. The lights on that corridor are either not coordinated with each other, or they are coordinated for a speed you are not driving. When both of those things are handled well, a driver can catch a long string of greens in a row without ever touching the brake. Traffic engineers have a name for that string: a green wave.

This article explains what a green wave actually is, why so many roads fail to give you one, why arriving too early at a light is just as bad as arriving too late, and how a small nudge to your speed a few seconds ahead of time can turn a corridor of reds into a smooth ride. If you have ever felt like the lights were personally out to get you, the real story is more mechanical and more fixable than that.

## What is a green wave?

A green wave is what happens when a series of traffic signals along a road are timed so that a vehicle traveling at a target speed arrives at each intersection just as the light turns, or is already, green. The greens open in sequence, like a wave rolling down the street ahead of you, and if you match the speed the corridor was tuned for, you ride the crest of that wave through every intersection.

Engineers build this on purpose. It is called signal coordination or progression, and the core design number is the offset: the time gap between when one light turns green and when the next one downstream turns green. Set the offsets to match how long it takes a car to travel between intersections at the intended speed, and you have progression. Get the offsets wrong, or leave each light running on its own independent timer, and the greens open at random relative to each other. Then your odds at each light are basically a coin flip, and over a dozen intersections a coin flip means you will stop again and again.

The width of the wave matters too. Engineers talk about the bandwidth of a progression: the size of the window of green you can travel within before the front of the platoon catches a red. A wide band forgives small differences in speed and lets a whole clump of cars through together. A narrow band means only the first few cars make it and everyone behind gets chopped off at the next red.

## Why you keep hitting reds

There are a handful of very ordinary reasons a corridor does not give you a green wave, and none of them are about you personally.

- **The lights are not coordinated at all.** Many signals run on independent timers or purely on their own sensors, with no relationship to the light a block away. Each one is doing a locally reasonable thing and the sequence is uncoordinated, so a smooth run through all of them is pure chance.

- **They are coordinated, but for a different speed.** Progression is tuned for one design speed. If the corridor is timed for 30 mph and you are doing 40 to catch the light you can see, you will arrive too early and wait for it. Drive the exact posted speed and the greens often line up. This is the counterintuitive part: on a coordinated street, speeding up usually makes you hit more reds, not fewer.

- **The timing plan is stale.** Traffic patterns drift as neighborhoods and commutes change, but retiming a corridor costs staff time and money, so plans often go years without an update. The 2007 National Traffic Signal Report Card from the National Transportation Operations Coalition graded the nation's traffic signal operations a D, largely because so many signals run on out-of-date timing.

- **Two directions fight each other.** A single set of offsets cannot perfectly serve both directions of travel unless the intersections are evenly spaced. Engineers usually favor the heavier peak direction, which means the lighter direction gets the worse deal and more reds.

- **A cross street or a pedestrian call interrupts the plan.** A gap-out, a long walk phase, or a burst of side-street traffic can knock a signal off its coordinated slot, and it takes a cycle or two to recover. During that recovery the wave is broken.

Notice what almost none of these are: your driving. The pattern of reds is set upstream of you, by how the corridor is timed and how well that timing still matches reality.

## Arriving too early is as wasteful as arriving too late

Here is the insight that makes green waves matter beyond convenience. The costly part of a red light is not only the wait. It is the deceleration and the re-acceleration around it. Braking a heavy vehicle to a full stop throws away kinetic energy as heat in the brakes, and then getting back up to speed from zero is the single thirstiest thing an engine does. A vehicle that has to stop and launch at every light burns far more fuel and brake than one that glides through at a steady speed, even if their average speeds end up similar.

That is why arriving at a green too early is almost as wasteful as arriving too late. If you race ahead and reach the intersection before it turns green, you brake, you wait, and you launch again. You paid the full stop-and-go penalty to gain nothing. The efficient move is to shed a little speed early and coast in so the light goes green just before you get there, keeping the vehicle rolling. Same trip, but no stop.

> The costly part of a red light is not the wait. It is braking a rolling vehicle to a stop and then dragging it back up to speed. Time your approach to keep moving and you skip both.

This is exactly the logic behind a green-light optimal speed advisory, or GLOSA: use knowledge of the signal timing ahead to tell a driver the speed that will reach the next light on green, so they neither stop short nor arrive too fast. In a 2022 field test of a GLOSA system for buses on the Virginia Smart Road, published in the journal Energies, advising drivers on the right approach speed cut fuel consumption by about 22 percent and travel time by about 6 percent compared with uninformed driving. The mechanism is the same one described above: fewer full stops, less braking, less launching from zero.

## Green waves and phantom jams are the same problem

Repeatedly stopping at lights is not just annoying, it is a wave-maker. Every time a platoon of cars stomps on the brakes at a red and then surges away from the green, it seeds the same stop-and-go pattern that produces [phantom traffic jams](/insights/phantom-traffic-jams) on the highway: congestion with no crash and no bottleneck, formed purely by drivers amplifying each other's braking. Smooth signal progression keeps the platoon rolling as a coherent group and starves that pattern of the sharp brake-and-launch events it feeds on.

It is the same lesson we keep running into across traffic science. A single well-timed speed can dissolve a jam that raw capacity cannot. A University of Arizona study (Stern et al., Transportation Research Part C, 2018) found that guiding just one vehicle in twenty to hold a steadier speed was enough to break up the stop-and-go waves human drivers kept generating. Green waves apply that same principle to city streets: get the speed right relative to the lights and the whole stream flows. And it is why [adding lanes rarely fixes traffic](/insights/why-adding-lanes-doesnt-fix-traffic) while smarter timing and smoother speeds often do. The bottleneck is coordination, not concrete. We unpack the highway version of this in [why there is traffic when there is no accident](/insights/why-traffic-with-no-accident).

## What this costs, and what better timing recovers

The waste is enormous and well measured. In 2024, U.S. drivers lost more than 4 billion hours and about $74 billion to congestion (INRIX 2024 Global Traffic Scorecard), and much of that is the stop-and-go of poorly timed arterials, not just highway gridlock. Freight pays the sharpest edge: congestion added $108.8 billion in operating cost and wasted 6.4 billion gallons of diesel for the trucking industry in 2022 (ATRI, Cost of Congestion to the Trucking Industry, 2024 update), and every unnecessary stop-and-launch on a signalized corridor is diesel poured into the brakes.

The upside of fixing timing is just as concrete. The Federal Highway Administration reports that traffic signal retiming programs across the country have delivered travel-time and delay reductions of 5 to 20 percent and fuel savings of 10 to 15 percent (FHWA, Managing Traffic Flow Through Signal Timing). These are among the highest benefit-cost ratios in all of transportation, because the fix is software and study time rather than construction. The catch is that retiming is periodic and expensive to keep current, which is why so many corridors drift back into the D-grade state the report card described.

## Where Cruze comes in

Signal retiming fixes the lights. [Cruze](/) works the other side of the same equation: the speed of the vehicle. Instead of asking a city to constantly re-tune every signal, we read the flow from the [traffic cameras already on the poles](/cameras), with no new roadside hardware, and give a driver a gentle, well-timed speed cue so they arrive into the green and keep rolling rather than stopping short or launching from zero. It is the GLOSA idea and the 5 percent finding turned into a product that works with the infrastructure a corridor already has.

For a [city or DOT](/for-cities), that means smoother arterials and fewer wasteful stops measured against the cameras you already own, complementing signal retiming instead of waiting on the next expensive timing study. For a [fleet](/for-fleets), it is fuel saved and brake wear avoided on every signalized mile, since the stop you never make is the cheapest one. You can watch stop-and-go form and then smooth out on our [homepage](/).

So the next time you catch every red on the same street, know that it is a timing problem, not a personal curse, and that the fix is not a bigger road. It is getting the right speed to meet the right green. That is the whole idea behind riding the wave instead of fighting it.`,
    tags: ["fundamentals", "traffic-physics"],
  },
  {
    slug: "how-much-does-traffic-cost",
    title: "How much does traffic actually cost? Drivers, fleets, and cities, by the numbers",
    author: "Anudeep Bonagiri",
    authorTitle: "Co-founder & CEO, Cruze",
    publishedAt: "2026-06-30",
    excerpt:
      "The typical U.S. driver lost 43 hours and $771 to congestion in 2024, and the average truck lost $7,588. Here is the real bill for drivers, fleets, and cities, and why most of it is avoidable.",
    body: `Traffic is expensive in a way most people never add up. In 2024 the typical U.S. driver lost 43 hours stuck in congestion, about a full work week, at a cost of $771 in wasted time (INRIX 2024 Global Traffic Scorecard). For the average truck the bill was far larger: $7,588 per truck in 2022, driven by both lost hours and burned fuel (ATRI Cost of Congestion, 2024 update). Across the whole country congestion cost drivers more than $74 billion and trucking alone $108.8 billion. This article puts real numbers on what traffic costs you, your fleet, and your city, and explains why a large share of that bill comes from jams that did not have to happen.

The reason this matters is not just the size of the number. It is that most of this cost is not caused by crashes or by roads that are simply too small. A great deal of it is stop-and-go waves that form on their own and tax every vehicle behind them. That distinction is the whole difference between a cost you have to accept and one you can actually attack.

## What traffic costs you, the individual driver

Start with the figure most people feel but never measure. In 2024 the average American driver lost 43 hours to traffic, roughly one full work week, worth about $771 in time alone (INRIX 2024 Global Traffic Scorecard). That is before you count the extra fuel your car burns crawling and braking, the wear on the vehicle, or the trips you simply did not take because the drive was not worth it.

Where you live changes the bill sharply. Drivers in the most congested U.S. cities, including New York and Chicago at about 102 hours each, lost more than $1,800 in wasted time in a single year. A daily commuter in one of those corridors is giving up more than two and a half work weeks a year to sitting still.

The $771 average is a floor, not a ceiling. It is the time cost alone, valued conservatively, and it does not include the fuel you waste in the stop-and-go that makes up so much of a bad commute.

## What traffic costs a trucking fleet

For commercial fleets the math is brutal because every hour of delay is a paid hour, and every gallon of diesel burned crawling is a hard cost. In 2022, congestion on U.S. highways added $108.8 billion in cost to the trucking industry and wasted more than 6.4 billion gallons of diesel, which alone accounted for $32.1 billion in extra fuel spend (ATRI Cost of Congestion, 2024 update).

Brought down to a single truck, congestion cost $7,588 per truck in 2022, equal to about 2.8% of the average per-truck revenue in the truckload sector. For a fleet of a hundred trucks that is roughly three quarters of a million dollars a year evaporating into idling engines and missed delivery windows. Unlike a driver's lost personal time, this comes straight off the operating margin, which is why congestion is one of the costs [fleet operators](/for-fleets) watch most closely. We break the fuel side of this down further in [the hidden cost of stop-and-go](/insights/fleet-economics-of-stop-and-go).

## What traffic costs a city or region

Zoom out and the costs stack into the tens of billions. Nationally, U.S. drivers lost more than four billion hours and about $74 billion to congestion in 2024 (INRIX 2024 Global Traffic Scorecard), and that is just the passenger side. Add the $108.8 billion hitting trucking and the freight that moves on those same roads, and congestion becomes one of the largest avoidable drags on a regional economy.

For a [city or DOT](/for-cities), this is not only a mobility problem, it is a budget and growth problem. Slower freight raises the delivered cost of goods. Unreliable travel times push businesses to pad schedules and hold more inventory. And the traditional fix, widening the road, tends to disappoint, because new capacity gets reclaimed by new trips. We cover that trap in [why adding lanes does not fix traffic](/insights/why-adding-lanes-doesnt-fix-traffic).

## Why most of this bill is avoidable

Here is the part that turns a depressing set of numbers into an opportunity. A large share of everyday congestion is not caused by a crash or by raw volume that overwhelms the road. It is stop-and-go waves that form on their own out of nothing but the way humans follow each other in dense traffic.

In 2008 a team of physicists put 22 cars on a circular track and asked everyone to hold a steady speed. Within minutes a stop-and-go jam formed and traveled backward around the loop with nothing at all blocking the road (Sugiyama et al., New Journal of Physics, 2008). We explain that result in [why there is traffic when there is no accident](/insights/why-traffic-with-no-accident). These [phantom traffic jams](/insights/phantom-traffic-jams) are pure waste: every car behind the wave pays in time and fuel, and no crash ever caused it.

Because the wave is created by behavior rather than by a physical bottleneck, you do not need to remove a physical obstacle to fix it. A University of Arizona study found that guiding just one vehicle in twenty, about 5%, to hold a steadier speed was enough to dissolve these waves and cut fuel use for every car behind them (Stern et al., Transportation Research Part C, 2018). We unpack that in [can a few drivers fix traffic for everyone](/insights/can-a-few-drivers-fix-traffic).

> A large part of what traffic costs you is not the road being too small. It is stop-and-go waves that form on their own, and those are exactly the part you can take back.

That is the line that separates the recoverable cost from the rest. Some congestion really is raw demand on an undersized road, and no software erases that. But the stop-and-go portion, the part that makes a moderately busy road feel like a parking lot, is a behavior problem, and behavior problems have cheaper fixes than concrete.

## Where Cruze comes in

This is the cost [Cruze](/) is built to claw back. Instead of adding lanes or waiting for self-driving cars, we read the flow from the [traffic cameras already on the poles](/cameras), predict where a stop-and-go wave is about to form, and give a small share of drivers a gentle, well-timed speed cue so the wave never builds. It is the 5% finding turned into a product, with no new hardware in any vehicle.

For a [fleet](/for-fleets), that is fuel saved and hard stops avoided on the corridors where $7,588 per truck is leaking out today. For a [city or DOT](/for-cities), it is throughput and reliability recovered from lanes you already own, measured against cameras you already have, at a fraction of the cost of a widening. You can watch a phantom jam form and then dissolve on our [homepage](/).

The full cost of traffic will never be zero in a growing region. But a real and measurable slice of it, the stop-and-go that no crash ever caused, is money sitting on the table. The point of putting hard numbers on the problem is to see how much of it is actually recoverable, and then to go recover it.`,
    tags: ["economics", "fundamentals"],
  },
  {
    slug: "why-merging-causes-traffic-jams",
    title: "Why does merging cause traffic jams? The zipper merge, explained",
    author: "Anudeep Bonagiri",
    authorTitle: "Co-founder & CEO, Cruze",
    publishedAt: "2026-06-30",
    excerpt:
      "On-ramps and lane drops are where most freeway jams actually start. Here is the physics of why merging breaks down traffic, what the capacity drop is, and why the zipper merge beats merging early.",
    body: `Merging causes traffic jams because a merge point is where two streams of cars compete for the same space, and the moment that competition forces drivers to brake, flow can collapse into stop-and-go that takes far longer to clear than the merge itself. Most freeway congestion that is not a crash starts at a bottleneck, and the most common bottleneck on the network is a place where lanes combine: an on-ramp feeding the mainline, or a lane drop where three lanes become two. The road right there is doing more work than anywhere else, so it is the first place to break.

This article explains why merging is so reliably the trigger, what transportation engineers mean by the capacity drop, the long-running debate between merging early and merging late, why the zipper merge wins in congested conditions, and how a single rough merge seeds the [phantom traffic jams](/insights/phantom-traffic-jams) you sit in miles downstream. If you have ever wondered why a simple on-ramp can back up an entire highway, this is the mechanism.

## Why a merge is a bottleneck

A bottleneck is any point where the road's ability to pass cars dips below the number of cars trying to get through. At a merge, that dip is built in. Two lanes of traffic have to interleave into the space of fewer lanes, and the only way to do that safely is for cars to leave gaps and adjust speed for each other. Every one of those adjustments is a small brake or a small hesitation, and in dense traffic those small disturbances do not stay small.

When traffic is light, merging is invisible because there is plenty of room to interleave without anyone slowing. The trouble starts as density climbs. Gaps shrink, drivers entering from the ramp cannot find a slot, mainline drivers brake to let them in or to avoid them, and the cars behind brake harder in response. At a critical density, that chain of braking stops dissipating and starts feeding on itself. The merge has broken down, and once it breaks down it does not simply recover when the ramp empties.

## The capacity drop: the cruel twist of a broken merge

Here is the part that surprises most people. Once a merge bottleneck breaks down into stop-and-go, the rate at which it discharges cars actually falls below the rate it was handling just before it broke. Engineers call this the capacity drop, and it has been measured at freeway bottlenecks for decades (Cassidy and Bertini, Transportation Research Part B, 1999, documented discharge flows falling once a queue forms upstream). The drop is typically in the range of 5 to 15 percent.

> A jammed merge does not just carry the same traffic more slowly. It carries less traffic. The road's throughput literally falls the moment it breaks down, so the queue grows faster than the merge can drain it.

That is why a merge backup is so stubborn. The instant flow collapses, the bottleneck loses a chunk of its own capacity, so the queue behind it grows faster than the merge can clear it. A road that could pass, say, 2,000 cars an hour per lane while flowing might pass only 1,700 to 1,900 while jammed. The few hundred cars an hour of lost throughput pile up minute after minute, which is how a thirty-second hesitation at an on-ramp becomes a twenty-minute crawl two miles back.

## Merging early versus the zipper merge

This is where driver behavior matters, and where most of us do the wrong thing out of politeness. When drivers see a "lane ends ahead" sign, the instinct is to merge over as soon as possible and then sit in the surviving lane, leaving the ending lane empty for the last half mile. It feels orderly and courteous. It also throws away road.

The alternative is the zipper merge, also called the late merge: drivers use both lanes all the way to the merge point, then take turns combining one car at a time, like the teeth of a zipper. It feels rude to the drivers who merged early, but it is what the geometry wants. Using both lanes to the merge point keeps the queue shorter, balances traffic between the lanes so neither sits empty, and concentrates the interleaving into one predictable spot instead of a long, ragged stretch of jockeying.

## Why the zipper merge works (the evidence)

The case for the zipper is not just intuition. State transportation departments that have studied and promoted it report real gains. Minnesota's Department of Transportation, which runs a long-standing public campaign for the zipper merge, states that using both lanes to the merge point can reduce the length of traffic backups by up to 40 percent in congested conditions. Other states, including Kansas, have piloted dynamic late-merge systems that use signs to tell drivers to stay in their lane and zipper at the point of closure, precisely because early merging wastes the capacity of the ending lane.

The logic is consistent with the bottleneck physics above. Early merging creates a long single-file queue and a half-empty lane beside it, which is a worse use of pavement and a longer stretch over which braking can amplify. The zipper keeps both lanes loaded and pushes all the interleaving into one location, which is easier to keep flowing and less likely to trigger the capacity drop. The catch is that the zipper only works if everyone does it; a few early mergers and a few aggressive late ones reintroduce exactly the uneven, brake-heavy behavior that breaks a merge down. That fragility is the whole problem with relying on human coordination at a merge.

## How a rough merge seeds a phantom jam

A merge does not only jam itself. It launches waves. Every time a driver brakes hard to let someone in, the car behind brakes a little harder, and the one behind that harder still, until a knot of stopped cars forms and begins traveling backward up the road against the flow of traffic. That backward-moving wave is a [phantom traffic jam](/insights/why-traffic-with-no-accident), and a busy on-ramp is one of the most reliable places to start one.

This is the same self-amplifying instability that physicist Yuki Sugiyama and colleagues produced with no merge at all, just cars asked to cruise on a ring road, which spontaneously generated a backward-traveling jam from nothing (Sugiyama et al., New Journal of Physics, 2008). A merge simply gives that instability a constant supply of triggers. So the cost of a poorly flowing merge is paid twice: once in the queue at the merge, and again in the stop-and-go waves it sends miles upstream to drivers who never see the ramp that started their delay.

## What it costs

The bill for all this braking is enormous. In 2024, U.S. drivers lost more than 4 billion hours and about $74 billion to congestion (INRIX 2024 Global Traffic Scorecard). Freight pays an outsized share: congestion added $108.8 billion in operating cost and wasted 6.4 billion gallons of diesel for the trucking industry in 2022 (ATRI, Cost of Congestion to the Trucking Industry, 2024 update). A large slice of that is the stop-and-go born at merges and bottlenecks, not at crashes, which is exactly the kind of congestion that better-timed driving can prevent rather than just endure.

## Where Cruze comes in

Merges break down because human coordination at the merge is fragile, and because once flow collapses the capacity drop makes the queue grow faster than it can clear. [Cruze](/) attacks both. We read the flow from the [traffic cameras already on the poles](/cameras), with no new hardware, and watch the density climbing toward the point where a merge or a downstream section is about to break. Then we give a small share of drivers a gentle, well-timed speed cue so they arrive at the merge already spaced to interleave, instead of arriving fast and braking hard.

That matters because the research says you do not need every car to cooperate. A University of Arizona study found that guiding just one vehicle in twenty, about 5 percent, to hold a steadier speed was enough to dissolve the stop-and-go waves human drivers kept generating (Stern et al., Transportation Research Part C, 2018). Smoothing the approach to a merge is the same idea applied to the spot where jams are most likely to start: change how a few drivers arrive, a few seconds early, and the merge keeps flowing instead of breaking down.

For a [city or DOT](/for-cities), that means more reliable throughput out of the on-ramps and lane drops you already operate, measured against the cameras you already have. For a [fleet](/for-fleets), it is fuel and hard stops saved on every merge-heavy corridor. The next time an on-ramp backs up a whole highway behind it, remember that the road did not run out of space. The merge ran out of coordination, and that is a far cheaper thing to fix than concrete. You can watch a wave form and then dissolve on our [homepage](/).`,
    tags: ["fundamentals", "traffic-physics"],
  },
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
    slug: "what-is-a-jamiton",
    title: "What is a jamiton? Self-sustaining traffic waves explained",
    author: "Anudeep Bonagiri",
    authorTitle: "Co-founder & CEO, Cruze",
    publishedAt: "2026-06-29",
    excerpt:
      "A jamiton is the name physicists gave to a self-sustaining stop-and-go traffic wave. It forms with no crash and no bottleneck, and it behaves mathematically like a detonation wave. Here is how it works.",
    body: `A jamiton is a self-sustaining traffic wave: a moving band of stop-and-go congestion that forms on its own, with no crash, no merge, and no bottleneck causing it, and then keeps itself alive as it travels backward through the stream of cars. The word is a blend of "jam" and "soliton," the physics term for a wave that holds its shape as it moves. If you have ever crawled to a near stop in heavy traffic, inched forward, and then sped back up only to find no reason for the slowdown at all, you have very likely driven straight through a jamiton.

The term comes from a 2009 paper in Physical Review E by a group of applied mathematicians, M. R. Flynn, A. R. Kasimov, J.-C. Nave, R. R. Rosales, and B. Seibold, titled "Self-sustained nonlinear waves in traffic flow." What makes their result striking is not just that these waves exist, but what they turn out to resemble. Mathematically, a jamiton behaves almost exactly like a detonation wave, the kind of self-propagating blast wave studied in gas dynamics. The same equations that describe an explosion traveling through a reactive gas also describe a traffic jam traveling backward through a line of cars. This article explains what a jamiton is, why the detonation analogy holds, how the wave feeds itself, and what it means for anyone trying to fix congestion.

## What is a jamiton, exactly?

Start with what it is not. A jamiton is not the jam you hit behind a stalled truck or a lane closure. Those have an obvious cause sitting at the front of the queue. A jamiton has no cause at the front. It is a region of high density and low speed that exists purely because of how cars interact, and it drifts opposite to the direction of travel even as every individual car keeps moving forward.

Picture a stretch of highway flowing smoothly but densely. One driver taps the brakes a little harder than necessary. The driver behind, reacting a beat late, brakes a little harder still to keep a safe gap. That driver's overreaction forces the next one to brake harder again. The disturbance does not fade as it passes back through the line; it grows. A few seconds later, cars a quarter mile behind the original tap are at a dead stop, while the first driver is long gone and cruising. The dense, slow band that results is the jamiton. It has a sharp front where cars hit the brakes and a long tail where they gradually accelerate back to speed.

> A jamiton is a traffic jam with no cause at its head. It is congestion that organizes and sustains itself out of nothing more than dense traffic and ordinary human reaction time.

The reason it persists rather than smoothing out is that it is a stable structure of the flow itself. Once dense traffic crosses a certain threshold, small disturbances no longer dampen; they amplify and lock into a traveling wave. The math calls this regime string instability, and the jamiton is the wave it produces.

## The detonation analogy: why a traffic jam is like a blast wave

The 2009 paper's central insight is that the equations governing a jamiton share their structure with the equations for a detonation. A detonation wave in gas dynamics has two parts: a sharp shock front, where pressure jumps almost instantly, followed by an attached reaction zone, where the gas releases energy and settles. A jamiton has the same two-part shape. Its shock front is the abrupt wall of brake lights where free-flowing cars slam into the back of the jam. Its reaction zone is the long recovery stretch ahead of that wall, where stopped cars slowly accelerate and thin back out into open road.

This is not a loose metaphor. Flynn and colleagues showed that the second-order traffic models, the ones that account for how drivers anticipate and adjust rather than reacting instantly, produce traveling-wave solutions that satisfy the same kind of mathematical conditions as detonation waves. They even found that under the right road conditions, jamitons are attracting solutions: start the system in almost any dense state and it tends to converge toward a configuration dominated by these waves. In other words, dense traffic does not just permit jamitons. Left alone, it actively organizes itself into them.

## How a jamiton sustains itself, and travels backward

What makes a jamiton self-sustaining is that it feeds on the very flow it disrupts. At the shock front, fast cars arrive and are forced to brake hard, dumping their kinetic energy into the jam. At the back of the wave, cars accelerate away, draining the jam from the other side. As long as traffic keeps arriving at the front faster than it clears at the back, the wave maintains itself, the same way a detonation maintains itself by consuming fresh fuel at its leading edge.

Because cars are constantly entering the front of the wave and leaving the back, the band of congestion itself moves backward against traffic, even though no single car ever goes backward. This backward drift is one of the most reliably measured features of real stop-and-go traffic, and it is exactly what a jamiton predicts: the wave is a pattern in the flow, not a fixed location on the road.

## From theory to the real road

The mathematics would be a curiosity if real traffic did not actually do this, but it does. The cleanest demonstration came a year before the jamiton paper. In 2008, physicist Yuki Sugiyama and colleagues put about twenty-two cars on a single-lane circular track and asked the drivers to do one thing: hold a steady speed (Sugiyama et al., New Journal of Physics, 2008). There was no merge, no obstacle, and no slow driver. For a while the cars circled smoothly. Then a stop-and-go wave appeared on its own and began traveling backward around the ring, exactly as the jamiton picture says it should. The experiment turned a theoretical wave into something you can watch on video.

We walk through that experiment and the everyday version of it in [why there is traffic when there is no accident](/insights/why-traffic-with-no-accident), and we put the whole phenomenon in context in our pillar explainer on [phantom traffic jams](/insights/phantom-traffic-jams). The jamiton is the formal, physics-grade name for the wave those pieces describe.

## Why you cannot widen your way out of a jamiton

Here is the part that matters for policy and for money. Because a jamiton is a property of how drivers interact at high density, not of how many lanes exist, adding lanes does not address it. A wider road raises the number of cars it can hold, but every lane still obeys the same instability, so you simply get the same self-sustaining wave forming in each one. This is one reason highway widening so reliably disappoints, on top of the separate problem that new lanes fill with new trips, which we cover in [why adding lanes doesn't fix traffic](/insights/why-adding-lanes-doesnt-fix-traffic).

The cost of leaving these waves to run is enormous. In 2024, U.S. drivers lost more than 4 billion hours and roughly $74 billion to congestion (INRIX 2024 Global Traffic Scorecard). Trucking alone absorbed $108.8 billion in added operating cost and burned 6.4 billion extra gallons of diesel because of congestion in 2022 (ATRI, Cost of Congestion to the Trucking Industry, 2024 update). A large share of that is not raw volume but exactly this kind of stop-and-go waste, vehicles repeatedly braking and re-accelerating through waves no one can see the cause of.

## Where Cruze comes in

If a jamiton sustains itself on overreaction at its shock front, then the way to kill it is to stop feeding it: have cars approach the wave at a steadier speed so the front never sharpens. You do not need to control most of the traffic to do this. A University of Arizona study found that guiding just one vehicle in twenty, about 5%, to hold a smoother speed was enough to dissolve the stop-and-go waves human drivers kept generating, and to cut fuel use for every car behind them (Stern et al., Transportation Research Part C, 2018). A small number of well-timed speeds, in the right place, drains the wave instead of feeding it.

That is the problem [Cruze](/) works on. Using existing roadside and traffic-camera views, Cruze reads the flow forming downstream and gives a driver a gentle, early speed cue, the steady approach that keeps them from slamming into the back of a forming jam and amplifying it. No new hardware in the cab and no self-driving cars required, just a small share of better-timed speeds. For fleets, that translates directly into less fuel burned in stop-and-go and fewer hard-braking events, which is why we built the math out for operators on the [fleets](/for-fleets) page and for road authorities on the [cities](/for-cities) page. The jamiton is a wave that organizes itself out of nothing. The encouraging news from the science is that it can be taken apart by a surprisingly small nudge in the right direction.`,
    tags: ["fundamentals", "traffic-physics"],
  },
  {
    slug: "does-adaptive-cruise-control-prevent-traffic-jams",
    title: "Does adaptive cruise control prevent or cause traffic jams?",
    author: "Anudeep Bonagiri",
    authorTitle: "Co-founder & CEO, Cruze",
    publishedAt: "2026-06-29",
    excerpt:
      "Adaptive cruise control feels like it should smooth traffic, but the research shows most systems sold today actually amplify stop-and-go waves. Here is why, what the studies found, and what it takes to make automation calm a jam instead of feeding it.",
    body: `Adaptive cruise control feels like it should be the cure for stop-and-go traffic. The car holds your speed, watches the vehicle ahead, and brakes and accelerates for you. So a road full of these systems should glide, smoothly absorbing each little slowdown instead of amplifying it into a jam. That is the intuition. The research says the opposite is closer to the truth.

The honest answer is that it depends entirely on how the system is tuned, and most adaptive cruise control sold in cars today is tuned in a way that makes phantom traffic jams slightly worse, not better. The same automation, designed differently, can dissolve those jams. The deciding factor is a property called string stability, and almost nobody buying a car has ever heard of it. This article explains what adaptive cruise control actually does, why the version in showrooms tends to feed traffic waves, what it would take to flip that, and why the most practical fix may not require everyone to own a self-driving car at all.

## The short answer: it depends on string stability

Adaptive cruise control, or ACC, is not one thing. It is a control law, a set of rules deciding how hard to brake or accelerate in response to the gap and closing speed to the car ahead. You can write that control law to be gentle and forward-looking, so a small brake tap ahead of you fades as it passes back through the line of cars. Or you can write it to react sharply and protectively, so that same brake tap grows louder with each car behind. Engineers call the first behavior string stable and the second string unstable.

Whether ACC prevents or causes traffic jams comes down to which of those two behaviors the manufacturer shipped. And measurements of real cars on real test tracks have found that the systems people actually drive land mostly on the wrong side of that line.

## What adaptive cruise control actually does

Standard cruise control holds a fixed speed. Adaptive cruise control adds a radar or camera that watches the vehicle in front, and it trades speed for distance: it will slow below your set speed to keep a chosen following gap, then speed back up when the road clears. To a driver it feels like a relief, because the car handles the tedious modulation of the pedal in moderate traffic.

The catch is in how aggressively the system closes and opens that gap. Human drivers, for all our flaws, anticipate. We watch several cars ahead and ease off early. A radar-based ACC, by contrast, mostly reacts to the single car directly in front, and many production systems are tuned to restore the set gap quickly once it is disturbed. That quick, reactive correction is exactly the ingredient that turns a small disturbance into a growing wave.

## String stability: the property that decides everything

Here is the mechanism. Picture a line of cars. The lead car taps its brakes for a moment, then resumes. In a string stable line, each following car reacts a little more softly than the car ahead of it, so the disturbance shrinks as it travels backward and dies out after a few vehicles. In a string unstable line, each car reacts a little harder, so the disturbance grows as it travels backward until, several cars back, someone is slamming on the brakes and a full stop-and-go wave is born.

This is the same physics behind [phantom traffic jams](/insights/phantom-traffic-jams), the jams that appear with no crash, no merge, and no bottleneck at all. A 2008 experiment by physicist Yuki Sugiyama and colleagues put human drivers on a single-lane ring and asked them only to hold a steady speed; a backward-traveling jam formed spontaneously, purely from drivers amplifying one another's tiny speed corrections (Sugiyama et al., New Journal of Physics, 2008). We walk through that mechanism in [why there is traffic when there is no accident](/insights/why-traffic-with-no-accident). The promise of automation was that a machine, free of human reaction lag and inattention, could break that cycle. Whether it does depends on string stability.

> The question is not whether a car drives itself. It is whether the car absorbs the brake tap ahead of it or passes it on, amplified, to everyone behind.

## What the research found about real ACC systems

This is measurable, and it has been measured. In a study published in the IEEE Transactions on Intelligent Transportation Systems in 2021, researchers Gunter, Gloudemans, Stern and colleagues took commercially available vehicles with factory adaptive cruise control, ran them in controlled platoons, and tested whether a speed disturbance from the lead car grew or shrank down the line. The finding was that the systems were string unstable: the disturbances were amplified as they propagated backward through the following vehicles, not damped.

A parallel effort in Europe reached the same conclusion at larger scale. The Joint Research Centre of the European Commission assembled the OpenACC database by track-testing a fleet of different production ACC cars, and analyses of that data (Makridis and colleagues, 2021) found that the great majority of commercial ACC systems on the market were string unstable. In other words, this is not one bad model. It is the prevailing tuning of the technology as sold.

The reason is not incompetence. Manufacturers tune ACC for how it feels to the person in the car and for safe, comfortable gap-keeping, not for the collective stability of a hundred-car platoon nobody in any single car can perceive. A system that reacts firmly to restore your following distance feels confident and safe to you, and quietly makes the wave behind you worse. The incentives point at the individual experience, and string stability is a property of the crowd.

## So how can automation calm a jam?

The same studies that exposed the problem also point at the fix, because string instability is a choice, not a law of automation. A control law that hangs back, accepts a slightly larger and more variable gap, and responds gently rather than snapping the gap closed can be made provably string stable. The question is whether enough vehicles run that kind of controller in the same stream.

The landmark demonstration came earlier, from the same research lineage. In 2018, a University of Arizona team led by Raphael Stern put a single automated vehicle into a ring of about twenty human-driven cars that were busily generating the usual stop-and-go waves, and had that one car hold a steady, wave-aware speed. The waves dissolved, and fuel use dropped for every car in the ring (Stern et al., Transportation Research Part C, 2018). One car in twenty, tuned for stability instead of reactivity, was enough to calm the whole loop.

Researchers have since pushed this onto real highways. In late 2022 the CIRCLES Consortium ran roughly one hundred vehicles equipped with specially designed wave-smoothing controllers in live rush-hour traffic on Interstate 24 near Nashville, instrumented by a dense camera testbed, to see whether a small fraction of stabilizing vehicles could calm congestion at freeway scale. The work shows the direction the field is heading: not more automation for its own sake, but automation tuned specifically to absorb waves rather than amplify them.

## Why you may not need everyone to own ACC

There is a more practical reading of all this, and it is the one that matters for the next several years. The wave-damping benefit does not require a road full of self-driving cars. It requires a small share of vehicles moving at the right speed at the right moment. Stern's result was roughly one vehicle in twenty. The controller in that car was not doing anything a human could not do; it was simply holding a steadier, better-timed speed than the humans around it.

That reframes the goal. Instead of waiting one or two decades for the entire car fleet to turn over to string stable ACC, you can deliver the same smoothing today by getting a few existing drivers to ease off at the right second, before the wave forms. The frontier of this research has moved toward exactly that idea: advisory systems that suggest speeds to ordinary human drivers and account for the messy reality that people follow suggestions inconsistently. The hard, mostly unsolved problem is wave damping under variable human compliance, and it is where the practical leverage now sits.

## What this costs while the fleet turns over

The waiting is not free. In 2024, U.S. drivers lost more than 4 billion hours and about $74 billion to congestion (INRIX 2024 Global Traffic Scorecard), and a large share of that is stop-and-go waves rather than raw volume. Freight pays an outsized share: congestion added $108.8 billion in operating cost and wasted 6.4 billion gallons of diesel for the trucking industry in 2022 (ATRI, Cost of Congestion to the Trucking Industry, 2024 update). Every year we wait for string stable automation to filter into the fleet is another year of that bill. The case for a fix that works with the cars already on the road, rather than the cars we hope to sell, is mostly a case about time.

## Where Cruze comes in

This is the gap [Cruze](/) is built to fill. We do not wait for everyone to buy a string stable car. We read the flow from the [traffic cameras already on the poles](/cameras), with no new hardware on the highway, predict where a stop-and-go wave is about to form, and give a small share of drivers a gentle, well-timed speed cue so the wave never builds. It is the one-in-twenty finding turned into a product, delivered to human drivers through an advisory rather than to robots through a control law.

For a [fleet](/for-fleets), that means smoother speeds, less hard braking, and fuel saved on every congested corridor, today, on the phones drivers already carry. For a [city or DOT](/for-cities), it means recovering throughput from the lanes you already own, measured against the cameras you already have. Adaptive cruise control asked the right question, whether a machine can break the human cycle of amplified braking. The answer turned out to depend not on automation but on tuning, and on getting just enough of the stream to move a little more smoothly. You can watch a phantom jam form and then dissolve on our [homepage](/).`,
    tags: ["fundamentals", "traffic-physics"],
  },
  {
    slug: "can-a-few-drivers-fix-traffic",
    title: "Can a few drivers fix traffic for everyone? The 5% rule, explained",
    author: "Anudeep Bonagiri",
    authorTitle: "Co-founder & CEO, Cruze",
    publishedAt: "2026-06-28",
    excerpt:
      "You don't need self-driving cars or every driver to cooperate. Research shows that guiding roughly one in twenty vehicles to hold a steady speed can dissolve stop-and-go waves for the whole road.",
    body: `Yes, and the number is smaller than almost anyone guesses. You do not need self-driving cars, you do not need a new road, and you do not need every driver to cooperate. Research on real vehicles found that guiding roughly one in twenty cars, about 5%, to hold a steadier speed was enough to dissolve stop-and-go traffic waves for every car behind them.

That is a strange and hopeful idea, so it is worth understanding why it is true. The traffic you sit in for no visible reason is usually a [phantom traffic jam](/insights/phantom-traffic-jams): a wave that forms on its own out of nothing but the way humans follow each other in dense traffic. Because the wave is created by driver behavior, changing how a small fraction of drivers behave can take it apart. This article walks through the experiment that proved the 5% number, the mechanism that makes it work, the larger test that moved it from a lab track to a live highway, and why this is the exact problem Cruze is built to solve.

## A jam with no cause, and why that is good news

Most everyday congestion is not caused by a crash, a merge, or a bottleneck. It is a self-sustaining wave. In 2008, a team of physicists led by Yuki Sugiyama put 22 cars on a single-lane circular track and asked every driver to do one thing: hold a steady speed and keep a safe gap. Within minutes a stop-and-go jam formed on its own and began traveling backward around the loop, with nothing at all blocking the road. (Source: Sugiyama et al., "Traffic jams without bottlenecks," New Journal of Physics, 2008.) We cover that result in depth in [why there is traffic when there is no accident](/insights/why-traffic-with-no-accident).

Here is the part that matters for fixing it. If a jam can appear out of pure driver behavior, with no physical cause, then there is no physical thing you have to remove to make it go away. You only have to change the behavior. And it turns out you only have to change a little of it.

## The mechanism: how a small slowdown becomes a full stop

In dense traffic no human holds a perfectly constant speed. Someone drifts a little close, lifts off the gas, or taps the brake. The driver behind reacts a beat late, so they brake slightly harder to rebuild their gap. The next driver brakes harder still. The disturbance does not fade as it passes back through the line. It grows.

Engineers call this string instability. Past a certain density, the chain of human reactions amplifies a tiny tap of the brake into a complete stop somewhere upstream. By the time the wave reaches you, the original trigger is long gone, which is why you never see a cause.

The flip side of that mechanism is the whole opportunity. If you can insert even a few vehicles into the chain that refuse to amplify the disturbance, that absorb it instead of passing it on amplified, the wave loses the feedback it needs to grow. A handful of steady drivers act like shock absorbers spaced through the traffic.

## The experiment that proved 5% is enough

In 2017, researchers ran the modern version of Sugiyama's experiment with one crucial change. They again put about 20 vehicles on a circular track and let a phantom jam form on its own. Then they handed control of a single one of those vehicles, roughly 5% of the cars on the road, to a simple automated controller programmed to hold a steady speed and a generous following gap.

The single controlled car damped the stop-and-go wave for the entire ring. The waves that had been forming on their own flattened out. (Source: Stern et al., "Dissipation of stop-and-go waves via control of autonomous vehicles: Field experiments," Transportation Research Part C, 2018.) The benefits landed on every car, not just the controlled one. In their experiments the team reported that the single steady vehicle reduced total fuel consumption across all the cars by up to roughly 40%, and cut the number of hard braking events dramatically, because the cars behind it were no longer slamming on and off the brakes in a wave.

> You do not need every car on the road to be smart. You need about one in twenty to stop amplifying the wave, and the whole line of traffic behind them smooths out.

The reason one car can do so much is that it is not trying to control the other nineteen. It is only removing itself as a link in the amplification chain and, by holding a steady gap, giving the disturbance somewhere to dissipate. The wave needs an unbroken chain of overreacting followers to keep growing. Break the chain in a few places and it cannot sustain itself.

## From a test track to a real highway

A ring road is a clean experiment, but a skeptic should ask whether the same thing holds in messy, real, multi-lane rush-hour traffic. That test has now been run. In November 2022, the CIRCLES Consortium, a research collaboration including teams from Vanderbilt and UC Berkeley, deployed around 100 automated vehicles into live morning traffic on Interstate 24 near Nashville. It was the largest coordinated test of this idea ever attempted on an open public freeway, run over a stretch instrumented with cameras to measure how the traffic responded.

The point of the experiment was exactly the question this article asks: does the small-fraction result survive contact with a real highway, where vehicles change lanes, enter and exit, and behave far less tidily than 20 cars on a loop. Moving wave-damping from a controlled track to live interstate traffic is the bridge between a neat physics result and something that can actually save fuel and time at scale, and it is an active, ongoing area of measurement rather than a finished story. The direction of the evidence is consistent: you do not need to automate the whole fleet to take the sharpest edges off these waves.

## Why this matters in dollars and diesel

This is not an academic curiosity. U.S. drivers lost more than 4 billion hours and about $74 billion to congestion in 2024 (INRIX 2024 Global Traffic Scorecard). For trucking alone, congestion added $108.8 billion in cost and wasted 6.4 billion gallons of diesel in 2022 (ATRI Cost of Congestion, 2024 update). A large share of that is stop-and-go that no crash ever caused. The same physics that says a few steady drivers can damp a wave also says the prize for doing it is enormous, because the wave is taxing every vehicle behind it the entire time it exists. For a [fleet](/for-fleets), smoother flow is fuel saved and hard stops avoided. For a [city or DOT](/for-cities), it is throughput recovered on roads that are already built.

## The catch: who gets to be the steady 5%?

The research result is settled enough to build on. The hard part is the deployment question it leaves open. In the experiments, someone chose which vehicle to control and handed it to an automated driver. On a real road, you cannot install self-driving hardware in one in twenty trucks and cars and call it done. That would be expensive, slow, and dependent on technology that is not evenly available.

So the practical problem becomes: how do you get roughly 5% of the vehicles on a given stretch of road to hold a steadier speed at the right moment, without new hardware in the car and without asking everyone to buy a new vehicle? That is the gap between a beautiful research finding and a fix that actually reaches the road.

## Where Cruze comes in

This is the problem [Cruze](/) is built to close. Instead of putting an automated controller inside the car, Cruze reads the road from traffic cameras that already exist, predicts where a wave is about to form, and delivers a gentle speed cue to a small share of drivers through the phone they already have. The human stays in control. They just get a quiet nudge to ease off a beat early, so the gap ahead absorbs the disturbance instead of passing it back amplified. That is the steady 5%, achieved in software, with no new hardware in any vehicle.

In other words, the science already told us the lever exists and how small it is. One in twenty. The missing piece was a way to pull that lever on a real road, for real drivers, at the moment it matters. You can watch a phantom jam form and then dissolve on our [homepage](/). That is the whole idea: not a smarter route around the jam, but a way to keep the jam from forming in the first place, by changing what just a few drivers do.`,
    tags: ["fundamentals", "traffic-physics"],
  },
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
