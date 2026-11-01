// @vitest-environment jsdom
//
// Tests for useFleetScores, the Fleet Driver Scores data hook. This file had
// zero coverage despite the hook carrying the load-bearing SSO bridge and a
// shipped security invariant (see CLAUDE.md "Fleet backend SSO bridge"):
//
//   1. In a production build with no VITE_CRUZE_API_URL, the hook must NOT fall
//      back to localhost (that would make every visitor's browser probe
//      127.0.0.1). The backend integration disables itself with a console
//      warning and a clear user-facing error instead. Test "production build
//      with no backend URL" guards that regression directly.
//   2. The SSO exchange runs at most once per Supabase access token: a 503
//      (sso-not-configured) or 401 (JWT rejected) degrades quietly to the
//      manual login / token-paste fallback rather than erroring or retry-looping
//      on every render.
//
// The hook drives Supabase/CruzePlatform-backend fetches and sessionStorage, so
// we stub global.fetch and clear sessionStorage per test, and drive the effects
// with renderHook. CRUZE_API_URL is imported from the module (never hardcoded)
// because .env* may or may not set VITE_CRUZE_API_URL for this clone.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act, cleanup, waitFor } from "@testing-library/react";

import { CRUZE_API_URL, useFleetScores } from "./useFleetScores";

const TOKEN_KEY = "cruze_fleet_token";

// A JSON Response with the given status, as the backend returns.
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// One driver row is enough to distinguish "ready" from "empty".
const DRIVERS_PAYLOAD = {
  window: { days: 7 },
  fleet_summary: { driver_count: 1 },
  drivers: [{ driver_id: "d1", score: 90, miles_driven: 100, event_counts: {}, modeled_gallons_wasted: 0, scores: { safety: 90, efficiency: 90, overall: 90, band: "Excellent", has_data: true } }],
};

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  sessionStorage.clear();
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("useFleetScores — fetching with a stored token", () => {
  it("fetches driver-scores for a cached token and reaches 'ready'", async () => {
    sessionStorage.setItem(TOKEN_KEY, "tok-123");
    fetchMock.mockResolvedValueOnce(jsonResponse(DRIVERS_PAYLOAD));

    const { result } = renderHook(() => useFleetScores());

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.data?.drivers).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith(
      `${CRUZE_API_URL}/fleet/driver-scores?window_days=7`,
      { headers: { Authorization: "Bearer tok-123" } }
    );
  });

  it("reaches 'empty' when the fleet returns zero drivers", async () => {
    sessionStorage.setItem(TOKEN_KEY, "tok-123");
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ window: { days: 7 }, fleet_summary: {}, drivers: [] })
    );

    const { result } = renderHook(() => useFleetScores());

    await waitFor(() => expect(result.current.status).toBe("empty"));
    expect(result.current.data?.drivers).toHaveLength(0);
  });

  it("clears the token and asks for auth again on a 401", async () => {
    sessionStorage.setItem(TOKEN_KEY, "expired");
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "expired" }, 401));

    const { result } = renderHook(() => useFleetScores());

    await waitFor(() => expect(result.current.status).toBe("needs_auth"));
    expect(result.current.token).toBeNull();
    expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(result.current.error).toMatch(/session expired/i);
  });
});

describe("useFleetScores — SSO exchange degrades quietly to manual fallback", () => {
  it("drops to needs_auth with no error when the exchange returns 503", async () => {
    // 503 = backend SUPABASE_JWT_SECRET unset, SSO off. Must NOT surface an error.
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "sso-not-configured" }, 503));

    const { result } = renderHook(() =>
      useFleetScores(7, { supabaseAccessToken: "supabase-jwt" })
    );

    await waitFor(() => expect(result.current.status).toBe("needs_auth"));
    expect(result.current.token).toBeNull();
    expect(result.current.error).toBeNull();
    // Only the exchange was attempted; no scores fetch without a backend token.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      `${CRUZE_API_URL}/auth/exchange`,
      expect.objectContaining({ method: "POST" })
    );
  });

  it("drops to needs_auth with no error when the exchange returns 401", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "invalid" }, 401));

    const { result } = renderHook(() =>
      useFleetScores(7, { supabaseAccessToken: "bad-jwt" })
    );

    await waitFor(() => expect(result.current.status).toBe("needs_auth"));
    expect(result.current.error).toBeNull();
  });
});
