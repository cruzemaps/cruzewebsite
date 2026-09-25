import { afterEach, describe, expect, it, vi } from "vitest";

import { resolveStreamUrl } from "./liveCameras";

// resolveStreamUrl queries the DriveTexas (MapLarge) camera table over
// `fetch` and pulls the tokened HLS URL out of `body.data.data`. It is the
// contract InteractiveLabV2's live CV demo now depends on, so lock its
// happy path and every fail-closed branch. We stub `fetch` per test.

/** Build a MapLarge-shaped response for the given name/httpsurl columns. */
function tableBody(name: string[], httpsurl: string[]) {
  return { data: { data: { name, httpsurl } } };
}

/** Stub global fetch with one canned response (ok + json), or a rejection. */
function stubFetch(impl: { ok?: boolean; body?: unknown } | Error) {
  const fn =
    impl instanceof Error
      ? vi.fn().mockRejectedValue(impl)
      : vi.fn().mockResolvedValue({
          ok: impl.ok ?? true,
          json: async () => impl.body,
        });
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("resolveStreamUrl", () => {
  it("returns the tokened HLS URL on a single-row hit", async () => {
    const url =
      "https://s71.us-east-1.skyvdn.com/rtplive/TX_SAT_007/playlist.m3u8?token=abc";
    const fetchFn = stubFetch({ body: tableBody(["TX_SAT_007"], [url]) });

    await expect(resolveStreamUrl("TX_SAT_007")).resolves.toBe(url);
    expect(fetchFn).toHaveBeenCalledOnce();
  });

  it("prefers the exact name when `Contains` matches more than one row", async () => {
    // `Contains` can also match e.g. TX_SAT_0070; the exact id must win, not
    // the first row returned.
    const wrong = "https://host/rtplive/TX_SAT_0070/playlist.m3u8?token=x";
    const right = "https://host/rtplive/TX_SAT_007/playlist.m3u8?token=y";
    stubFetch({
      body: tableBody(["TX_SAT_0070", "TX_SAT_007"], [wrong, right]),
    });

    await expect(resolveStreamUrl("TX_SAT_007")).resolves.toBe(right);
  });

  it("falls back to the first row when the exact name is absent", async () => {
    const only = "https://host/rtplive/TX_SAT_0071/playlist.m3u8?token=z";
    stubFetch({ body: tableBody(["TX_SAT_0071"], [only]) });

    await expect(resolveStreamUrl("TX_SAT_007")).resolves.toBe(only);
  });

  it("returns null when the API responds non-ok", async () => {
    stubFetch({ ok: false, body: tableBody(["TX_SAT_007"], ["https://x"]) });

    await expect(resolveStreamUrl("TX_SAT_007")).resolves.toBeNull();
  });

  it("returns null when the table returns no rows", async () => {
    stubFetch({ body: tableBody([], []) });

    await expect(resolveStreamUrl("TX_SAT_007")).resolves.toBeNull();
  });

  it("returns null when the resolved URL is not https (no downgrade)", async () => {
    stubFetch({
      body: tableBody(["TX_SAT_007"], ["http://insecure/playlist.m3u8"]),
    });

    await expect(resolveStreamUrl("TX_SAT_007")).resolves.toBeNull();
  });

  it("returns null (never throws) when fetch rejects", async () => {
    stubFetch(new Error("network down"));

    await expect(resolveStreamUrl("TX_SAT_007")).resolves.toBeNull();
  });
});
