// Friction gate for the investor dataroom.
//
// The dataroom CONTENTS are gated server-side (Notion link-level sharing,
// signed Supabase storage URLs, etc.). This client check only decides whether
// to *reveal those links* in-app — it is not the security boundary.
//
// Even so, the historical implementation compared the typed password against
// `VITE_DATAROOM_PASSWORD`, which Vite inlines into the production bundle at
// build time. Anyone could open the minified JS and read the plaintext, so the
// gate offered essentially zero friction against a curious visitor.
//
// We now prefer `VITE_DATAROOM_PASSWORD_HASH` — a hex SHA-256 digest of the
// password. Only the digest ships in the bundle; the plaintext never does. The
// client hashes the typed password with the Web Crypto API and compares. A weak
// password is still brute-forceable from the digest, so pick a strong passphrase,
// but this removes the trivial view-source leak.
//
// Generate the hash with:  printf '%s' 'your-password' | shasum -a 256 | awk '{print $1}'
// (the `awk` drops shasum's trailing "  -"; the code also tolerates the raw output.)
//
// `VITE_DATAROOM_PASSWORD` (plaintext) is still honored as a legacy fallback so
// existing deploys keep working; it logs a one-time warning nudging migration.

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Length-independent constant-time-ish hex compare. Marginal client-side, but
// keeps the comparison from short-circuiting on the first differing nibble.
function hexEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export type DataroomVerifyResult = "ok" | "incorrect" | "unconfigured";

let warnedPlaintext = false;

export async function verifyDataroomPassword(
  input: string,
  cfg: { hash?: string; plaintext?: string },
): Promise<DataroomVerifyResult> {
  // Extract the 64-hex digest rather than trusting the raw env value. `printf
  // ... | shasum -a 256` (and Linux `sha256sum`) emit `<64hex>  -`, so a copy of
  // the whole command output would otherwise carry a trailing `  -` that `.trim()`
  // can't strip (the `-` isn't whitespace) — the length check would then reject
  // the CORRECT password and surface as "Incorrect password", near-undiagnosable.
  const hash = ((cfg.hash || "").toLowerCase().match(/[0-9a-f]{64}/) || [""])[0];
  if (hash) {
    const got = await sha256Hex(input);
    return hexEqual(got, hash) ? "ok" : "incorrect";
  }

  const plaintext = cfg.plaintext || "";
  if (plaintext) {
    if (!warnedPlaintext && typeof console !== "undefined") {
      warnedPlaintext = true;
      console.warn(
        "[dataroom] Using VITE_DATAROOM_PASSWORD (plaintext) — it ships in the " +
          "client bundle. Set VITE_DATAROOM_PASSWORD_HASH instead: " +
          "printf '%s' '<password>' | shasum -a 256 | awk '{print $1}'",
      );
    }
    return input === plaintext ? "ok" : "incorrect";
  }

  return "unconfigured";
}
