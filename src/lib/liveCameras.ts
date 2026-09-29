// Public live traffic cameras used by the homepage LiveFeed and /cameras.
//
// History: these TxDOT HLS streams on skyvdn.com were once open URLs; in Sep
// 2026 the host moved behind short-lived JWT tokens (~15 min), which killed
// direct embedding. TxDOT's own public map, DriveTexas (drivetexas.org),
// serves the same streams by querying its MapLarge camera table, which
// returns each camera's HLS URL with a fresh token attached. That API is
// anonymous and CORS-open (`Access-Control-Allow-Origin: *`), so the site
// resolves stream URLs the same way at play time. The skyvdn server signs
// child playlists and segments with the same token, so hls.js needs no
// special handling — but a long-running viewer must re-resolve when the
// token expires (handled in src/lib/useHlsCamera.ts).
//
// Camera ids are TxDOT Lonestar feed names, verified live via the table's
// `active`/`problemstream` flags. All six are real cameras in the city they
// claim (the pre-Sep-2026 list mislabeled an Austin camera as San Antonio
// and a Dallas one as Fort Worth — don't reintroduce that).

export type LiveCamera = {
  id: string; // TxDOT Lonestar camera name, e.g. "TX_DAL_001"
  city: string;
  location: string;
};

export const LIVE_CAMERAS: LiveCamera[] = [
  { id: "TX_AUS_263", city: "Austin", location: "IH-35 @ Northwest Blvd" },
  { id: "TX_DAL_001", city: "Dallas", location: "IH-635 @ US-75 (High Five)" },
  { id: "TX_HOU_1002", city: "Houston", location: "IH-45 North @ Calvary" },
  { id: "TX_SAT_007", city: "San Antonio", location: "IH-10 @ Callaghan" },
  { id: "TX_FTW_010", city: "Fort Worth", location: "IH-30 @ Eastchase" },
  { id: "TX_ELP_252", city: "El Paso", location: "IH-10 @ Thorn" },
];

const API = "https://dtx-e-cdn.maplarge.com/Api/ProcessDirect";

// Fetch the camera's HLS URL (with a fresh ~15-min token) from the DriveTexas
// camera table. Returns null on any failure so callers can fail over.
export async function resolveStreamUrl(id: string): Promise<string | null> {
  const request = JSON.stringify({
    action: "table/query",
    query: {
      table: { name: "appgeo/cameraPoint" },
      where: [[{ col: "name", test: "Contains", value: id }]],
      sqlselect: ["name", "httpsurl"],
      take: 5,
    },
  });
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(
      `${API}?request=${encodeURIComponent(request)}&aInfo=${encodeURIComponent("mluser:null;mltoken:null")}`,
      { signal: ctrl.signal }
    );
    clearTimeout(timer);
    if (!res.ok) return null;
    const body = await res.json();
    const data = body?.data?.data;
    if (!data?.name?.length) return null;
    // Contains can match more than one row; prefer the exact name.
    const i = data.name.indexOf(id);
    const url = data.httpsurl?.[i >= 0 ? i : 0];
    return typeof url === "string" && url.startsWith("https://") ? url : null;
  } catch {
    return null;
  }
}
