// Case-study content store. Add new entries here; routes /case-studies and
// /case-studies/:slug pick them up automatically.

export type CaseStudy = {
  slug: string;
  title: string;
  customer: string;
  segment: "fleet" | "city";
  publishedAt: string; // ISO
  excerpt: string;
  metrics: { label: string; value: string }[];
  body: string; // markdown-ish; rendered as paragraphs
  ogImage?: string;
};

export const CASE_STUDIES: CaseStudy[] = [
  {
    slug: "austin-i35-corridor",
    title: "Dissolving the I-35 morning wave: Austin pilot",
    customer: "City of Austin Transportation Department",
    segment: "city",
    publishedAt: "2026-03-12",
    excerpt:
      "A 90-day deployment on the I-35 north-south corridor reduced peak-period stop-and-go events by 38% with zero new roadside hardware.",
    metrics: [
      { label: "Stop-and-go events ↓", value: "38%" },
      { label: "Avg. peak speed ↑", value: "11 mph" },
      { label: "Roadside hardware", value: "0 units" },
      { label: "Time to first signal", value: "9 days" },
    ],
    body: `When Austin's TxDOT engineers shared their TMC data with the Cruze team, the morning wave on I-35 was visible at half-mile resolution. Peak-period braking events propagated 3.2 miles upstream in under five minutes.

We deployed Cruze coordination across a corridor-aware subset of vehicles. The first cohort of 1.4% adoption was enough to register an effect on the wave's amplitude. Within 21 days, the morning wave's measured propagation distance dropped 62%, and peak-period travel time variance fell 28%.

What made this work: smartphone-only deployment, no mast arms, no DSRC, no closed-loop signal control. The Cruze coordination layer ran alongside the existing ATMS, providing a per-corridor dashboard the city's engineers could compare to baseline.`,
  },
  {
    slug: "midwest-class8-fleet",
    title: "11.4% diesel reduction across a 600-truck Class 8 fleet",
    customer: "Midwest regional carrier",
    segment: "fleet",
    publishedAt: "2026-02-28",
    excerpt:
      "After integrating Cruze with Samsara across 600 Class 8 tractors, the carrier measured 11.4% diesel reduction and 1.8 reclaimed driver-hours per week.",
    metrics: [
      { label: "Fuel reduction", value: "11.4%" },
      { label: "Driver-hours reclaimed", value: "1.8/wk" },
      { label: "Trucks deployed", value: "600" },
      { label: "Integration time", value: "1 day" },
    ],
    body: `The carrier ran a 90-day blinded pilot: half the fleet on Cruze coordination, half on the existing Samsara workflow. Pre/post analysis used the same lanes, same drivers, same shift patterns.

Within 30 days, fuel-per-mile on Cruze-coordinated trucks tracked 8.7% under the control group. By day 90, once driver familiarity and corridor density both rose, the gap had widened to 11.4%. Insurance rear-end claim count on the pilot cohort fell to a third of the control's.

The integration ran inside the existing FMS workflow: drivers saw Cruze coordination overlaid on their normal Samsara routing UI, with optional voice prompts. Adoption hit 94% by week three.`,
  },
];

export function findCaseStudy(slug: string) {
  return CASE_STUDIES.find((c) => c.slug === slug);
}
