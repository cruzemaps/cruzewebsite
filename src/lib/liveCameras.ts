// Public live traffic cameras used by the homepage LiveFeed and /cameras.
//
// History: these were TxDOT HLS streams on skyvdn.com. That host started
// returning 401 on every playlist (signed-token auth was added upstream) in
// Sep 2026, which silently killed every camera on the site. City of Austin
// publishes its ~800 traffic cameras as open-data JPEG snapshots with no
// auth, so the site now renders those and refreshes them on a timer.
//
// Snapshots update on roughly a 5-minute sweep server-side; treat them as
// "live snapshot", not video, in any user-facing copy.
//
// Camera IDs come from the City of Austin open-data camera inventory
// (data.austintexas.gov, dataset b4k4-adkb, camera_status=TURNED_ON).

export type LiveCamera = {
  id: number;
  corridor: string; // short label used in tabs / list rows
  location: string; // fuller human-readable location
};

const SNAPSHOT_BASE = "https://cctv.austinmobility.io/image";

export const LIVE_CAMERAS: LiveCamera[] = [
  { id: 1440, corridor: "I-35 · Downtown", location: "IH-35 @ 4th St (NB)" },
  { id: 211, corridor: "I-35 · Anderson Ln", location: "IH-35 @ Anderson Ln" },
  { id: 958, corridor: "MoPac · Braker Ln", location: "MoPac Expy @ Braker Ln" },
  { id: 96, corridor: "Lamar · 5th St", location: "Lamar Blvd @ 5th St" },
  { id: 1046, corridor: "MoPac · Park Bend", location: "MoPac Expy @ Park Bend Dr" },
  { id: 635, corridor: "US-290 · MoPac", location: "US-290 @ MoPac Expy" },
  { id: 1443, corridor: "US-183 · Burleson", location: "US-183 @ Burleson Rd" },
  { id: 269, corridor: "US-183 · Metropolis", location: "US-183 @ Metropolis Dr" },
];

// `bust` defeats browser/CDN caching so a timer-driven reload actually
// refetches; pass the same value across one render so React doesn't loop.
export const snapshotUrl = (id: number, bust: number) =>
  `${SNAPSHOT_BASE}/${id}.jpg?t=${bust}`;
