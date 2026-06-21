// Single source of truth for site-wide SEO constants and per-route metadata.
// Used by the <SEO> component at runtime AND by scripts/prerender.mjs at build
// time to bake meta into static HTML files (so crawlers and LLMs see the right
// metadata before any JS runs).

export const SITE = {
  name: "Cruze",
  url: "https://cruzemaps.com",
  shortDescription:
    "Cruze transforms every smartphone into an active traffic actuator. We coordinate driver speeds with swarm intelligence to dissolve phantom jams before they form.",
  twitter: "@CruzeMaps",
  ogImage: "/og-image.png",
  themeColor: "#0B0E14",
  brand: {
    cyan: "#00F2FF",
    orange: "#E8590C",
    charcoal: "#0B0E14",
  },
} as const;

export type RouteMeta = {
  path: string;
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  noindex?: boolean;
  jsonLd?: object | object[];
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly";
  priority?: number;
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Cruzemaps",
  url: SITE.url,
  logo: `${SITE.url}/logo.png`,
  description: SITE.shortDescription,
  sameAs: [],
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Cruze",
  applicationCategory: "TravelApplication",
  operatingSystem: "iOS, Android, Web",
  description: SITE.shortDescription,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "127",
  },
};

// Per-route metadata. Add new routes here so they pick up SEO + sitemap entries
// + prerendered HTML automatically.
export const ROUTES: RouteMeta[] = [
  {
    // Homepage. Carries the current (V3) design's copy. The /v3 preview route
    // now redirects here (see src/App.tsx); there is no separate /v3 entry.
    path: "/",
    title: "Cruze | Clear traffic jams before they form",
    description:
      "Most jams have no crash and no bottleneck. Cruze predicts stop-and-go waves before they form and guides a few drivers to smooth them out. No new hardware, no waiting on self-driving. Piloting in Texas.",
    keywords:
      "phantom traffic jams, stop-and-go waves, traffic flow optimization, congestion cost, fleet fuel savings, eco-driving, physics-informed AI, computer vision traffic, Texas DOT cameras",
    // Honest JSON-LD: Organization + SoftwareApplication with no invented
    // aggregateRating (the old softwareJsonLd faked a 4.8 / 127-review score).
    jsonLd: [
      orgJsonLd,
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "Cruze",
        applicationCategory: "TravelApplication",
        operatingSystem: "iOS, Android, Web",
        description:
          "Traffic-flow intelligence that dissolves phantom jams by coordinating driver speeds, no new hardware required.",
      },
    ],
    changefreq: "weekly",
    priority: 1.0,
  },
  {
    // Previous homepage design, kept reachable only for rollback/QA. noindex so
    // it is never crawled as a duplicate of the live homepage; not linked anywhere.
    path: "/v2",
    title: "Cruze | Dissolve Traffic, Not Just Avoid It",
    description:
      "Cruze coordinates driver speeds with swarm intelligence to dissolve phantom traffic jams.",
    noindex: true,
    changefreq: "yearly",
    priority: 0.1,
  },
  {
    // Same previous design as /v2, at a friendlier URL. noindex, not linked.
    path: "/old",
    title: "Cruze | Dissolve Traffic, Not Just Avoid It",
    description:
      "Cruze coordinates driver speeds with swarm intelligence to dissolve phantom traffic jams.",
    noindex: true,
    changefreq: "yearly",
    priority: 0.1,
  },
  {
    path: "/for-fleets",
    title: "Cruze for Fleets | Cut Fuel, Reclaim Driver Hours",
    description:
      "Built for fleet owners. Cruze's swarm routing cuts fuel use 8–14% and recaptures driver-hours lost to stop-and-go traffic. Try the live ROI calculator.",
    keywords:
      "fleet management, fuel savings, trucking routing, FMS integration, fleet ROI, Geotab alternative, Samsara alternative, Motive alternative",
    changefreq: "monthly",
    priority: 0.9,
  },
  {
    path: "/for-cities",
    title: "Cruze for Cities | DOT-Grade Traffic Coordination",
    description:
      "DOTs and city operators use Cruze to actively dissolve recurring congestion, reduce CO₂, and lower collision rates, without new roadside hardware.",
    keywords:
      "city DOT, traffic management center, ATMS, congestion reduction, smart city, vehicle-to-cloud, government navigation",
    changefreq: "monthly",
    priority: 0.9,
  },
  {
    path: "/investors",
    title: "Cruze for Investors | The Traffic Dissolution Platform",
    description:
      "How Cruze becomes the operating system for moving vehicles. Market, traction, moat, and the team building it.",
    keywords:
      "Cruze investors, mobility startup, traffic AI, ClimateTech, MobilityTech, swarm intelligence venture",
    changefreq: "monthly",
    priority: 0.8,
  },
  {
    path: "/faq",
    title: "Cruze FAQ | Phantom Traffic Jams, Fleets, and Cities",
    description:
      "Why is there traffic when there is no accident? What is a phantom traffic jam? How can Cruze cut fleet fuel and reduce city congestion without new lanes? Plain answers.",
    keywords:
      "phantom traffic jam, why is there traffic with no accident, what causes stop and go traffic, how to reduce traffic, reduce highway congestion, fleet fuel savings, eco driving, traffic flow optimization",
    changefreq: "monthly",
    priority: 0.6,
  },
  {
    path: "/press",
    title: "Cruze Press Kit | Logos, Bios, Fact Sheet",
    description:
      "Press resources for Cruze: high-resolution logos, founder bios, product screenshots, and an up-to-date fact sheet.",
    changefreq: "monthly",
    priority: 0.5,
  },
  {
    path: "/stats",
    title: "Cruze Live Impact | Tons of CO₂ Saved Across Pilots",
    description:
      "Live, anonymized impact metrics from every Cruze pilot deployment. Updated continuously.",
    changefreq: "daily",
    priority: 0.7,
  },
  {
    path: "/insights",
    title: "Cruze Insights | Phantom Jams, Swarm Routing, Fleet Ops",
    description:
      "Long-form research and operating playbooks on traffic dissolution, swarm routing, and fleet economics.",
    changefreq: "weekly",
    priority: 0.7,
  },
  {
    path: "/cities",
    title: "Cruze Pilot Cities | Where Swarm Routing Is Live in the US",
    description:
      "Top US metros by congestion cost. See where Cruze pilots are active, in discussion, and under evaluation.",
    keywords:
      "traffic congestion US cities, smart city traffic, swarm routing pilot cities",
    changefreq: "weekly",
    priority: 0.8,
  },
  {
    path: "/lanes",
    title: "Top US Trucking Lanes | Cruze Lane Coverage",
    description:
      "Highest-volume US trucking corridors with congestion-delay estimates and Cruze coordination potential per trip.",
    keywords:
      "US trucking lanes, freight corridors, trucking routes, fleet route optimization",
    changefreq: "weekly",
    priority: 0.8,
  },
  {
    path: "/apply",
    title: "Apply for the Cruze Pilot | Fleet Onboarding",
    description:
      "Apply to pilot Cruzemaps on your fleet in 5 quick steps including LOI signing. We benchmark against your last 90 days of telematics.",
    changefreq: "monthly",
    priority: 0.7,
  },
  {
    path: "/cameras",
    title: "Live Traffic Cameras | Cruze",
    description:
      "Live TxDOT traffic camera feeds across Texas corridors where Cruze coordinates flow. Public streams, no recording.",
    keywords: "live traffic cameras, TxDOT, Texas traffic, I-35 camera, IH-45 camera",
    changefreq: "always",
    priority: 0.7,
  },
  {
    path: "/route-planner",
    title: "Cruze Route Planner | Swarm-Coordinated Routing",
    description:
      "Plan a route with Cruze. See how swarm coordination smooths your trip and saves fuel.",
    changefreq: "weekly",
    priority: 0.6,
  },
  {
    path: "/login",
    title: "Sign In | Cruze",
    description: "Sign in to your Cruze account.",
    noindex: true,
  },
  {
    path: "/lab",
    title: "Internal Lab | Cruze",
    description: "Internal camera CV testing page. Not for public use.",
    noindex: true,
  },
];

export function resolveOgImage(image: string | undefined): string {
  const value = image ?? SITE.ogImage;
  return /^https?:\/\//i.test(value) ? value : `${SITE.url}${value}`;
}

export function findRouteMeta(pathname: string): RouteMeta | undefined {
  // exact match first
  const exact = ROUTES.find((r) => r.path === pathname);
  if (exact) return exact;
  // prefix match for nested routes (e.g. /insights/[slug], /cities/[slug]).
  return ROUTES.find((r) => r.path !== "/" && pathname.startsWith(r.path));
}
