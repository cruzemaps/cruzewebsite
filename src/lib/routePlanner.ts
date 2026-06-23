// Pure savings math + region table behind the public /route-planner page.
// Extracted from RoutePlanner.tsx so the projection logic (the page's only
// real computation) is testable without mounting the USAMap / recharts stack.
// The page itself just renders the numbers these functions return.

export type RegionKey = "southeast" | "northeast" | "southwest" | "midwest";

export type RegionMetric = {
  label: string;
  savingsRange: [number, number];
  perMileRange: [number, number];
  centsMile: string;
};

export const REGION_METRICS: Record<RegionKey, RegionMetric> = {
  southeast: {
    label: "Southeast",
    savingsRange: [9800, 11500],
    perMileRange: [0.098, 0.115],
    centsMile: "9.8¢ – 11.5¢",
  },
  northeast: {
    label: "Northeast",
    savingsRange: [8900, 10200],
    perMileRange: [0.089, 0.102],
    centsMile: "8.9¢ – 10.2¢",
  },
  southwest: {
    label: "Southwest",
    savingsRange: [7800, 9100],
    perMileRange: [0.078, 0.091],
    centsMile: "7.8¢ – 9.1¢",
  },
  midwest: {
    label: "Midwest / Mountain",
    savingsRange: [6500, 8200],
    perMileRange: [0.065, 0.082],
    centsMile: "6.5¢ – 8.2¢",
  },
};

// Trip counts the "Fleet Volume Projection" chart steps through.
export const TRIP_BUCKETS = [10, 50, 100, 200, 500] as const;

// Low/high projected savings for `trips` runs of a `distance`-mile route in the
// given region — the two ends of the region's per-mile efficiency band, each
// rounded to whole dollars (matches the headline "$X to $Y" the page shows).
export function projectRouteSavings(distance: number, region: RegionKey, trips = 100) {
  const m = REGION_METRICS[region];
  const miles = distance * trips;
  return {
    low: Math.round(miles * m.perMileRange[0]),
    high: Math.round(miles * m.perMileRange[1]),
  };
}

// Cumulative-savings series for the area chart: one point per TRIP_BUCKET, using
// the midpoint of the region's per-mile band. Empty for a not-yet-selected route
// (distance 0) so the chart stays hidden until the user picks two states.
export function tripChartData(distance: number, region: RegionKey) {
  if (distance <= 0) return [];
  const m = REGION_METRICS[region];
  const avgPerMile = (m.perMileRange[0] + m.perMileRange[1]) / 2;
  return TRIP_BUCKETS.map((t) => ({
    trips: `${t} Trips`,
    Savings: Math.round(distance * t * avgPerMile),
  }));
}
