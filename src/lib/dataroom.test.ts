import { describe, expect, it, vi } from "vitest";

import { sha256Hex, verifyDataroomPassword } from "./dataroom";

// A known SHA-256 vector anchors the digest implementation to something
// independently verifiable (echo -n abc | shasum -a 256), rather than only
// checking sha256Hex against itself.
const SHA256_ABC =
  "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";

describe("sha256Hex", () => {
  it("matches the canonical SHA-256('abc') vector, lowercase hex", async () => {
    expect(await sha256Hex("abc")).toBe(SHA256_ABC);
  });

  it("hashes the empty string to the well-known empty digest", async () => {
    expect(await sha256Hex("")).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
  });

  it("is deterministic and 64 hex chars wide", async () => {
    const a = await sha256Hex("a four word passphrase");
    const b = await sha256Hex("a four word passphrase");
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("verifyDataroomPassword — hash path", async () => {
  const PASSWORD = "correct horse battery staple";
  const HASH = await sha256Hex(PASSWORD);

  it("returns 'ok' when the password hashes to the configured digest", async () => {
    expect(await verifyDataroomPassword(PASSWORD, { hash: HASH })).toBe("ok");
  });

  it("returns 'incorrect' for a wrong password", async () => {
    expect(await verifyDataroomPassword("wrong", { hash: HASH })).toBe(
      "incorrect",
    );
  });

  it("tolerates raw `shasum -a 256` output with the trailing '  -'", async () => {
    // `printf '%s' pw | shasum -a 256` emits "<64hex>  -"; the trailing "  -"
    // isn't whitespace, so a naive .trim() would leave it and reject the
    // CORRECT password. The digest must still be extracted.
    expect(
      await verifyDataroomPassword(PASSWORD, { hash: `${HASH}  -` }),
    ).toBe("ok");
  });

  it("normalizes surrounding whitespace and uppercase in the configured hash", async () => {
    expect(
      await verifyDataroomPassword(PASSWORD, {
        hash: `  ${HASH.toUpperCase()}\n`,
      }),
    ).toBe("ok");
  });

  it("prefers the hash over a (mismatched) plaintext fallback when both are set", async () => {
    // Hash matches, plaintext is deliberately wrong: hash must win.
    expect(
      await verifyDataroomPassword(PASSWORD, {
        hash: HASH,
        plaintext: "some-other-legacy-password",
      }),
    ).toBe("ok");
  });

  it("does not treat an empty submission as a match against a real hash", async () => {
    expect(await verifyDataroomPassword("", { hash: HASH })).toBe("incorrect");
  });
});

describe("verifyDataroomPassword — legacy plaintext fallback", () => {
  it("returns 'ok' on an exact plaintext match when no hash is configured", async () => {
    expect(
      await verifyDataroomPassword("legacy-pw", { plaintext: "legacy-pw" }),
    ).toBe("ok");
  });

  it("returns 'incorrect' on a plaintext mismatch", async () => {
    expect(
      await verifyDataroomPassword("nope", { plaintext: "legacy-pw" }),
    ).toBe("incorrect");
  });

  it("warns on the FIRST plaintext use, then stays silent (module-scoped latch)", async () => {
    // The `warnedPlaintext` latch is module-scoped, and earlier specs in this
    // file already tripped it — so re-importing the statically-bound module
    // here would observe 0 warnings and assert nothing. Reset the module
    // registry and import a FRESH copy with an untripped latch (the same
    // technique #33's analytics.test.ts uses), so we actually exercise
    // first-call-warns / second-call-silent.
    vi.resetModules();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const fresh = await import("./dataroom");
      expect(
        await fresh.verifyDataroomPassword("legacy-pw", { plaintext: "legacy-pw" }),
      ).toBe("ok");
      expect(warn).toHaveBeenCalledTimes(1);
      // Second use of the plaintext path must NOT warn again.
      expect(
        await fresh.verifyDataroomPassword("legacy-pw", { plaintext: "legacy-pw" }),
      ).toBe("ok");
      expect(warn).toHaveBeenCalledTimes(1);
    } finally {
      warn.mockRestore();
      vi.resetModules();
    }
  });
});

describe("verifyDataroomPassword — unconfigured", () => {
  it("returns 'unconfigured' when neither hash nor plaintext is set", async () => {
    expect(await verifyDataroomPassword("anything", {})).toBe("unconfigured");
  });

  it("treats a hash that contains no 64-hex digest as unconfigured (falls through to plaintext/none)", async () => {
    // e.g. a placeholder like "TODO" — no digest to compare, no plaintext:
    // must not throw and must not accept the input.
    expect(
      await verifyDataroomPassword("anything", { hash: "TODO-set-me" }),
    ).toBe("unconfigured");
  });
});
