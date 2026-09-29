import { afterEach, describe, expect, it, vi } from "vitest";
import { LIVE_CAMERAS, resolveStreamUrl } from "./liveCameras";

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

function mockFetchOnce(impl: () => Partial<Response> | Promise<Partial<Response>>) {
  const fn = vi.fn(async () => impl());
  vi.stubGlobal("fetch", fn);
  return fn;
}

function jsonResponse(body: unknown, ok = true): Partial<Response> {
  return { ok, json: async () => body };
}

describe("resolveStreamUrl", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns the HLS url for the row whose name exactly matches the id", async () => {
    const fetchMock = mockFetchOnce(() =>
      jsonResponse({
        data: {
          data: {
            name: ["TX_DAL_0011", "TX_DAL_001"],
            httpsurl: [
              "https://skyvdn.example/other.m3u8?token=a",
              "https://skyvdn.example/match.m3u8?token=b",
            ],
          },
        },
      })
    );
    const url = await resolveStreamUrl("TX_DAL_001");
    expect(url).toBe("https://skyvdn.example/match.m3u8?token=b");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("sends a table/query request carrying the requested camera id", async () => {
    const fetchMock = mockFetchOnce(() =>
      jsonResponse({
        data: { data: { name: ["TX_HOU_1002"], httpsurl: ["https://x.example/a.m3u8"] } },
      })
    );
    await resolveStreamUrl("TX_HOU_1002");
    const calledUrl = String(fetchMock.mock.calls[0][0]);
    const decoded = decodeURIComponent(calledUrl);
    expect(decoded).toContain('"action":"table/query"');
    expect(decoded).toContain("TX_HOU_1002");
  });

  it("falls back to the first row when no exact name match is present", async () => {
    mockFetchOnce(() =>
      jsonResponse({
        data: {
          data: {
            name: ["TX_AUS_999", "TX_AUS_998"],
            httpsurl: ["https://x.example/first.m3u8", "https://x.example/second.m3u8"],
          },
        },
      })
    );
    const url = await resolveStreamUrl("TX_AUS_263");
    expect(url).toBe("https://x.example/first.m3u8");
  });

  it("returns null on a non-ok HTTP response", async () => {
    mockFetchOnce(() => jsonResponse({}, false));
    expect(await resolveStreamUrl("TX_DAL_001")).toBeNull();
  });

  it("returns null when the table returns no rows", async () => {
    mockFetchOnce(() => jsonResponse({ data: { data: { name: [], httpsurl: [] } } }));
    expect(await resolveStreamUrl("TX_DAL_001")).toBeNull();
  });

  it("returns null when the resolved url is not an https string", async () => {
    mockFetchOnce(() =>
      jsonResponse({
        data: { data: { name: ["TX_DAL_001"], httpsurl: ["http://insecure.example/a.m3u8"] } },
      })
    );
    expect(await resolveStreamUrl("TX_DAL_001")).toBeNull();
  });

  it("returns null when fetch rejects (network error / abort)", async () => {
    mockFetchOnce(() => Promise.reject(new Error("boom")));
    expect(await resolveStreamUrl("TX_DAL_001")).toBeNull();
  });
});
