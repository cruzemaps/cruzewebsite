import { afterEach, describe, expect, it, vi } from "vitest";

import { LIVE_CAMERAS, resolveStreamUrl } from "./liveCameras";

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

// City -> expected TxDOT Lonestar id prefix. The pre-Sep-2026 list mislabeled
// an Austin camera as San Antonio and a Dallas one as Fort Worth (see the
// module header); these guards fail if that regression is reintroduced.
const CITY_PREFIX: Record<string, string> = {
  Austin: "TX_AUS",
  Dallas: "TX_DAL",
  Houston: "TX_HOU",
  "San Antonio": "TX_SAT",
  "Fort Worth": "TX_FTW",
  "El Paso": "TX_ELP",
};

describe("LIVE_CAMERAS", () => {
  it("lists six cameras with unique ids", () => {
    expect(LIVE_CAMERAS).toHaveLength(6);
    const ids = LIVE_CAMERAS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("uses well-formed TxDOT Lonestar ids", () => {
    for (const cam of LIVE_CAMERAS) {
      expect(cam.id).toMatch(/^TX_[A-Z]{3}_\d+$/);
    }
  });

  it("labels every camera with the city its id prefix belongs to", () => {
    for (const cam of LIVE_CAMERAS) {
      const prefix = CITY_PREFIX[cam.city];
      expect(prefix, `unexpected city "${cam.city}"`).toBeDefined();
      expect(cam.id.startsWith(prefix)).toBe(true);
    }
  });

  it("gives every camera a non-empty location", () => {
    for (const cam of LIVE_CAMERAS) {
      expect(cam.location.trim().length).toBeGreaterThan(0);
    }
  });
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

  it("sends a table/query request carrying the requested camera id", async () => {
    const fetchFn = stubFetch({
      body: tableBody(["TX_HOU_1002"], ["https://x.example/a.m3u8"]),
    });
    await resolveStreamUrl("TX_HOU_1002");
    const calledUrl = new URL(String(fetchFn.mock.calls[0][0]));
    const request = JSON.parse(calledUrl.searchParams.get("request") ?? "{}");
    // Assert the id sits in the WHERE filter value, not merely somewhere in the
    // URL, so dropping it from the query filter would fail this test.
    expect(request.action).toBe("table/query");
    expect(request.query.table.name).toBe("appgeo/cameraPoint");
    expect(request.query.where[0][0]).toMatchObject({
      col: "name",
      test: "Contains",
      value: "TX_HOU_1002",
    });
  });

  it("fails closed (null) when only a substring match is returned, never a wrong camera", async () => {
    // `Contains` matched TX_SAT_0071 but not the exact TX_SAT_007. Serving
    // row 0 here would render a different camera under the caller's fixed
    // label, so the resolver must return null instead.
    const other = "https://host/rtplive/TX_SAT_0071/playlist.m3u8?token=z";
    stubFetch({ body: tableBody(["TX_SAT_0071"], [other]) });

    await expect(resolveStreamUrl("TX_SAT_007")).resolves.toBeNull();
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

  it("clears the abort timer even when fetch rejects (no dangling timer)", async () => {
    const clearSpy = vi.spyOn(globalThis, "clearTimeout");
    stubFetch(new Error("boom"));
    await resolveStreamUrl("TX_SAT_007");
    expect(clearSpy).toHaveBeenCalledTimes(1);
  });
});
