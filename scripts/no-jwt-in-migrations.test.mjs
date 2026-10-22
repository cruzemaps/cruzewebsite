// CI guard: fails if any file in supabase/migrations, or supabase-schema.sql,
// holds a JWT-shaped string, such as a Supabase service_role or anon key
// copied in from a live trigger or webhook definition (migration 024 took the
// last one out of the database). Reports file and line only, never the match.
// Run with `node --test scripts/no-jwt-in-migrations.test.mjs`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const JWT_SHAPED = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/;

function filesUnder(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? filesUnder(p) : [p];
  });
}

// "file:line" for every line that holds a JWT-shaped string.
function findJwtShaped(files) {
  const hits = [];
  for (const file of files) {
    readFileSync(file, "utf8").split("\n").forEach((line, i) => {
      if (JWT_SHAPED.test(line)) hits.push(`${relative(root, file)}:${i + 1}`);
    });
  }
  return hits;
}

test("the check catches a JWT-shaped string and not the pattern that looks for one", () => {
  // Built from pieces so this file holds no JWT-shaped string itself.
  const sample = ["ey" + "J" + "a".repeat(20), "ey" + "J" + "b".repeat(40), "c".repeat(43)].join(".");
  assert.ok(JWT_SHAPED.test(`'{"Authorization":"Bearer ${sample}"}'`));
  assert.ok(!JWT_SHAPED.test("where prosrc ~ 'eyJ[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+'"));
  assert.ok(!JWT_SHAPED.test('"Authorization":"Bearer <service_role key, pasted by hand>"'));
});

test("no migration holds a JWT-shaped string", () => {
  const files = [...filesUnder(join(root, "supabase", "migrations")), join(root, "supabase-schema.sql")];
  assert.ok(files.length > 20, `expected the migrations, found ${files.length} files`);
  const hits = findJwtShaped(files);
  assert.deepEqual(hits, [], `JWT-shaped string (a Supabase key?) at ${hits.join(", ")}. Remove it and rotate the key.`);
});
