// Unit test for the production-bundle bypass scanner.
// Run with `node --test scripts/check-prod-bundle.test.mjs`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { findBypassMarkers } from "./check-prod-bundle.mjs";

function fixture(files) {
  const dir = mkdtempSync(join(tmpdir(), "prod-bundle-"));
  for (const [name, body] of Object.entries(files)) {
    const p = join(dir, name);
    mkdirSync(join(p, ".."), { recursive: true });
    writeFileSync(p, body);
  }
  return dir;
}

test("flags a bundle that still reads the demo session key", () => {
  const dir = fixture({ "assets/index.js": 'if(sessionStorage.getItem("demo_role")){}' });
  try {
    assert.deepEqual(findBypassMarkers(dir), [{ file: join("assets", "index.js"), marker: "demo_role" }]);
  } finally {
    rmSync(dir, { recursive: true });
  }
});

test("flags a shipped impersonation handoff chunk", () => {
  const dir = fixture({ "assets/ImpersonateHandoff-x.js": 'rpc("start_impersonation",{});"impersonated_user_id"' });
  try {
    const markers = findBypassMarkers(dir).map((h) => h.marker).sort();
    assert.deepEqual(markers, ["impersonated_user_id", "start_impersonation"]);
  } finally {
    rmSync(dir, { recursive: true });
  }
});

test("passes a clean bundle and ignores non-JS files", () => {
  const dir = fixture({
    "assets/index.js": "console.log('hello')",
    "insights/demo/index.html": "<p>demo_role is a word in an article</p>",
  });
  try {
    assert.deepEqual(findBypassMarkers(dir), []);
  } finally {
    rmSync(dir, { recursive: true });
  }
});
