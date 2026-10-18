// Pure data resolution behind the public /stats page and the /v2 live strip.
// Extracted so the one decision the page makes (show the live RPC row, or say
// the numbers are unavailable) is testable without mounting the page.
//
// There is deliberately no fallback data. If the `live_impact_stats` RPC fails,
// the page says the numbers are unavailable instead of showing invented counts.
// There is also no CO2 figure: nothing in the product measures avoided CO2 yet.

export type LiveStats = {
  active_pilots: number;
  total_fleets: number;
  total_cities: number;
};

// Pick what to display from a `live_impact_stats` RPC result. The live row is
// used only when the call succeeded (no error) and returned at least one row;
// anything else (null data, error, empty array) returns null, which the UI
// renders as "unavailable".
export function resolveLiveStats(
  data: LiveStats[] | null | undefined,
  error: unknown,
): LiveStats | null {
  if (data && !error && data[0]) {
    return data[0];
  }
  return null;
}
