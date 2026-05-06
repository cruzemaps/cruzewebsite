// Single source of truth for site-wide SEO constants and per-route metadata.
// Used by the <SEO> component at runtime AND by scripts/prerender.mjs at build
// time to bake meta into static HTML files (so crawlers and LLMs see the right
// metadata before any JS runs).

export const SITE = {
  name: "Cruze",
  url: "https://cruzemaps.com",
  shortDescription:
    "Cruze transforms every smartphone into an active traffic actuator. We coordinate driver speeds with swarm intelligence to dissolve phantom jams before they form.",
  twitter: "@cruzemaps",
  ogImage: "/og-default.png",
  themeColor: "#0B0E14",
  brand: {
    cyan: "#00F2FF",
    orange: "#FF8C00",
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
    path: "/",
    title: "Cruze | Dissolve Traffic, Not Just Avoid It",
    description:
      "Cruze coordinates driver speeds with swarm intelligence and physics-informed AI to dissolve phantom traffic jams, saving fuel, time, and lives.",
    keywords:
      "swarm navigation, traffic dissolution, phantom traffic jams, fleet routing, eco-driving, physics-informed AI, smart navigation",
    jsonLd: [orgJsonLd, softwareJsonLd],
    changefreq: "weekly",
    priority: 1.0,
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
    title: "Cruze FAQ | How Swarm Routing Works",
    description:
      "Answers to the most common questions about Cruze, swarm intelligence routing, fleet integration, and city deployments.",
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
    path: "/case-studies",
    title: "Cruze Case Studies | Pilot Outcomes",
    description:
      "Detailed pilot outcomes from fleet and city deployments using Cruze.",
    changefreq: "monthly",
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
      "Apply to pilot Cruze on your fleet in 4 quick steps. We benchmark against your last 90 days of telematics.",
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
];

export function findRouteMeta(pathname: string): RouteMeta | undefined {
  // exact match first
  const exact = ROUTES.find((r) => r.path === pathname);
  if (exact) return exact;
  // prefix match for nested (case-studies/[slug] etc.)
  return ROUTES.find((r) => r.path !== "/" && pathname.startsWith(r.path));
}
