// Pure data resolution + CO2 math behind the public /stats ("live impact") page.
// Extracted from Stats.tsx so the two decisions the page makes — which numbers to
// show (live RPC row vs illustrative fallback) and the CO2-avoided estimate — are
// testable without mounting MarketingLayout/SEO or stubbing the Supabase client.
// Stats.tsx just renders whatever these functions return.

export type LiveStats = {
  active_pilots: number;
  total_fleets: number;
  total_cities: number;
};

// Illustrative numbers shown when the live RPC is missing/errors (e.g. local dev
// without Supabase). The page is public and must not 500 just because the DB
// isn't configured, so it always has something to render.
export const FALLBACK_STATS: LiveStats = {
  active_pilots: 12,
  total_fleets: 47,
  total_cities: 4,
};

// Rough illustrative CO2 estimate: each active pilot ≈ this many tons/month.
export const CO2_TONS_PER_PILOT_MONTH = 18;

// Pick which stats to display from a `live_impact_stats` RPC result. The live
// row is used only when the call succeeded (no error) and returned at least one
// row; anything else (null data, error, empty array) falls back to FALLBACK_STATS.
export function resolveLiveStats(
  data: LiveStats[] | null | undefined,
  error: unknown,
): LiveStats {
  if (data && !error && data[0]) {
    return data[0];
  }
  return FALLBACK_STATS;
}

// Tons of CO2 avoided this month = active pilots × the per-pilot rate, rounded to
// whole tons. Returns 0 before stats have loaded (null), matching the page's
// loading state.
export function co2TonsFromStats(stats: LiveStats | null | undefined): number {
  return stats ? Math.round(stats.active_pilots * CO2_TONS_PER_PILOT_MONTH) : 0;
}
