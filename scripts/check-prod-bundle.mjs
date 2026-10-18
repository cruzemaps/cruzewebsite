// Fails the production build if the client-side demo login, admin
// impersonation or /diag code made it into dist/.
//
// Those paths are DEV-only (see src/lib/demoMode.ts and App.tsx). Vite compiles
// import.meta.env.DEV to `false` in a production build, so their storage keys,
// handoff pages and the Diag chunk should be gone from the shipped JavaScript.
// If any marker below shows up, someone read demo state outside demoMode.ts or
// mounted a dev page unconditionally.
//
// Runs as the last step of `npm run build`. Unit test:
// `node --test scripts/check-prod-bundle.test.mjs`.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

export const BYPASS_MARKERS = [
  "demo_role", // demo session key
  "demo_status", // demo pilot-status key
  "impersonated_user_id", // impersonation key
  "start_impersonation", // impersonation RPC, only called by the dev handoff
  "Dev demo access", // Login.tsx dev buttons
  "Opening impersonation session", // ImpersonateHandoff page
  "Opening Cruze demo", // DemoHandoff page
  "what the server actually sees", // Diag page
];

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (p.endsWith(".js")) out.push(p);
  }
  return out;
}

/** Returns [{ file, marker }] for every bypass marker found in dir's .js files. */
export function findBypassMarkers(dir, markers = BYPASS_MARKERS) {
  const hits = [];
  for (const file of walk(dir)) {
    const text = readFileSync(file, "utf8");
    for (const marker of markers) {
      if (text.includes(marker)) hits.push({ file: relative(dir, file), marker });
    }
  }
  return hits;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const dir = process.argv[2] ?? "dist";
  const hits = findBypassMarkers(dir);
  if (hits.length > 0) {
    console.error("check-prod-bundle: dev-only demo/impersonation/diag code found in the production bundle:");
    for (const h of hits) console.error(`  ${h.file}: "${h.marker}"`);
    process.exit(1);
  }
  console.log("check-prod-bundle: no demo, impersonation or diag code in the production bundle.");
}
