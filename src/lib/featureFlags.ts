// Build-time feature flags. Vite inlines VITE_* values at build time, so a
// flag that is off compiles its gated branch out of the production bundle.

// Live DOT camera imagery on the public site: the TxDOT HLS video on the
// homepage and /cameras (stream URLs resolved through DriveTexas, see
// src/lib/liveCameras.ts), the CV lab feed on /lab, and the outbound links to
// the camera map app. TxDOT and Houston TranStar terms restrict copying,
// redistributing or framing their camera images, so this stays OFF until a
// signed data-use agreement covers it. With it off, those surfaces show a map
// of camera locations (no images) or Cruze's own recorded clip, and the CSP
// built in vite.config.ts drops the DOT stream hosts entirely.
//
// Turn it on by building with VITE_LIVE_DOT_CAMERAS=true (vite.config.ts reads
// the same variable for the CSP).
export const LIVE_DOT_CAMERAS = import.meta.env.VITE_LIVE_DOT_CAMERAS === "true";
