// Programmatic SEO: top US trucking lanes (origin-destination pairs).
// Each becomes /lanes/[slug].

export type Lane = {
  slug: string;
  origin: string;
  destination: string;
  distanceMiles: number;
  averageDriveTimeHours: number;
  congestionDelayHours: number; // average peak delay above free-flow
  freightVolumeRank: number;    // top US freight lane rank
  primaryRoute: string;
  metroEndpoints: [string, string]; // [origin slug, dest slug] from cities.ts
  notes: string;
};

export const LANES: Lane[] = [
  {
    slug: "los-angeles-to-phoenix",
    origin: "Los Angeles, CA",
    destination: "Phoenix, AZ",
    distanceMiles: 372,
    averageDriveTimeHours: 6.0,
    congestionDelayHours: 1.4,
    freightVolumeRank: 1,
    primaryRoute: "I-10 East",
    metroEndpoints: ["los-angeles-ca", "phoenix-az"],
    notes: "Highest-volume US trucking lane. The first 60 miles east of LA contribute most of the delay.",
  },
  {
    slug: "chicago-to-detroit",
    origin: "Chicago, IL",
    destination: "Detroit, MI",
    distanceMiles: 282,
    averageDriveTimeHours: 4.5,
    congestionDelayHours: 1.1,
    freightVolumeRank: 4,
    primaryRoute: "I-94 East",
    metroEndpoints: ["chicago-il", "detroit-mi"],
    notes: "Auto-industry feeder lane; high reliability requirements.",
  },
  {
    slug: "dallas-to-houston",
    origin: "Dallas, TX",
    destination: "Houston, TX",
    distanceMiles: 239,
    averageDriveTimeHours: 3.7,
    congestionDelayHours: 0.9,
    freightVolumeRank: 2,
    primaryRoute: "I-45 South",
    metroEndpoints: ["dallas-fort-worth-tx", "houston-tx"],
    notes: "I-45 between Dallas and Houston is a Texas Triangle backbone with steady congestion in both metros.",
  },
  {
    slug: "atlanta-to-jacksonville",
    origin: "Atlanta, GA",
    destination: "Jacksonville, FL",
    distanceMiles: 346,
    averageDriveTimeHours: 5.2,
    congestionDelayHours: 1.2,
    freightVolumeRank: 6,
    primaryRoute: "I-75 / I-10",
    metroEndpoints: ["atlanta-ga", "jacksonville-fl"],
    notes: "Southeast freight corridor; Atlanta's I-285 outer loop adds the most delay.",
  },
  {
    slug: "seattle-to-portland",
    origin: "Seattle, WA",
    destination: "Portland, OR",
    distanceMiles: 174,
    averageDriveTimeHours: 2.8,
    congestionDelayHours: 0.8,
    freightVolumeRank: 9,
    primaryRoute: "I-5 South",
    metroEndpoints: ["seattle-wa", "portland-or"],
    notes: "Pacific Northwest spine; weather closures dominate variance.",
  },
  {
    slug: "new-york-to-boston",
    origin: "New York, NY",
    destination: "Boston, MA",
    distanceMiles: 215,
    averageDriveTimeHours: 4.1,
    congestionDelayHours: 1.5,
    freightVolumeRank: 3,
    primaryRoute: "I-95 North",
    metroEndpoints: ["new-york-ny", "boston-ma"],
    notes: "Northeast Corridor freight + commuter overlap creates dense phantom-jam zones in CT.",
  },
];

export function findLane(slug: string) {
  return LANES.find((l) => l.slug === slug);
}
