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

// Storage keys and the RPC name are matched only as whole quoted string
// literals, so analytics event names such as "demo_role_activated" do not
// count.
const quoted = (key) => new RegExp(`["'\`]${key}["'\`]`);

export const BYPASS_MARKERS = [
  { name: "demo_role", re: quoted("demo_role") }, // demo session key
  { name: "demo_status", re: quoted("demo_status") }, // demo pilot-status key
  { name: "impersonated_user_id", re: quoted("impersonated_user_id") }, // impersonation key
  { name: "start_impersonation", re: quoted("start_impersonation") }, // RPC, only called by the dev handoff
  { name: "Dev demo access", re: /Dev demo access/ }, // Login.tsx dev buttons
  { name: "Opening impersonation session", re: /Opening impersonation session/ }, // ImpersonateHandoff page
  { name: "Opening Cruze demo", re: /Opening Cruze demo/ }, // DemoHandoff page
  { name: "what the server actually sees", re: /what the server actually sees/ }, // Diag page
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
    for (const { name, re } of markers) {
      if (re.test(text)) hits.push({ file: relative(dir, file), marker: name });
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
