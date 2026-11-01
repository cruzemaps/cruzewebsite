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

describe("useFleetScores: fetching with a stored token", () => {
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

describe("useFleetScores: SSO exchange degrades quietly to manual fallback", () => {
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

  it("does not re-exchange on a benign re-render, but retries for a new token", async () => {
    // First token: exchange fails (503) -> needs_auth, token stays null.
    fetchMock.mockResolvedValue(jsonResponse({ error: "sso-not-configured" }, 503));

    const { result, rerender } = renderHook(
      ({ jwt }) => useFleetScores(7, { supabaseAccessToken: jwt }),
      { initialProps: { jwt: "jwt-a" } }
    );

    await waitFor(() => expect(result.current.status).toBe("needs_auth"));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Re-rendering with the same Supabase token must not fire a second exchange
    // (covers the effect-level dedup; the exchangeAttemptedFor ref backstops the
    // token-flip case this harness can't reach without StrictMode).
    rerender({ jwt: "jwt-a" });
    await new Promise((r) => setTimeout(r, 0));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // A different Supabase token must retry the exchange.
    rerender({ jwt: "jwt-b" });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it("stores the backend token and fetches scores when the exchange succeeds", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ auth_token: "backend-tok" }))
      .mockResolvedValueOnce(jsonResponse(DRIVERS_PAYLOAD));

    const { result } = renderHook(() =>
      useFleetScores(7, { supabaseAccessToken: "good-jwt" })
    );

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.token).toBe("backend-tok");
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      `${CRUZE_API_URL}/fleet/driver-scores?window_days=7`,
      { headers: { Authorization: "Bearer backend-tok" } }
    );
  });
});

describe("useFleetScores: manual login / token path", () => {
  it("stores the token from a successful login (token or access_token)", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ access_token: "from-login" }))
      .mockResolvedValueOnce(jsonResponse(DRIVERS_PAYLOAD));

    const { result } = renderHook(() => useFleetScores());
    await waitFor(() => expect(result.current.status).toBe("needs_auth"));

    await act(async () => {
      await result.current.login("manager", "pw");
    });

    await waitFor(() => expect(result.current.token).toBe("from-login"));
    expect(sessionStorage.getItem(TOKEN_KEY)).toBe("from-login");
  });

  it("surfaces 'Invalid credentials.' on a 401 login and stays needs_auth", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "no" }, 401));

    const { result } = renderHook(() => useFleetScores());
    await waitFor(() => expect(result.current.status).toBe("needs_auth"));

    await act(async () => {
      await result.current.login("manager", "wrong");
    });

    expect(result.current.status).toBe("needs_auth");
    expect(result.current.error).toBe("Invalid credentials.");
    expect(result.current.token).toBeNull();
  });

  it("treats a whitespace-only pasted token as no token", async () => {
    const { result } = renderHook(() => useFleetScores());
    await waitFor(() => expect(result.current.status).toBe("needs_auth"));

    act(() => result.current.setToken("   "));

    expect(result.current.token).toBeNull();
    expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it("logout clears the cached token and returns to needs_auth", async () => {
    sessionStorage.setItem(TOKEN_KEY, "tok");
    fetchMock.mockResolvedValue(jsonResponse(DRIVERS_PAYLOAD));

    const { result } = renderHook(() => useFleetScores());
    await waitFor(() => expect(result.current.status).toBe("ready"));

    act(() => result.current.logout());

    expect(result.current.status).toBe("needs_auth");
    expect(result.current.token).toBeNull();
    expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(result.current.data).toBeNull();
  });

  it("a scores fetch in flight at logout cannot overwrite state afterwards", async () => {
    // Regression guard: the request-id must be bumped before fetchScores'
    // early returns, so the stale in-flight response is discarded after logout
    // instead of flipping the hook back to 'ready' with stale data.
    sessionStorage.setItem(TOKEN_KEY, "tok");
    let resolveFetch: (r: Response) => void = () => {};
    const inFlight = new Promise<Response>((r) => {
      resolveFetch = r;
    });
    fetchMock.mockReturnValueOnce(inFlight);

    const { result } = renderHook(() => useFleetScores());
    await waitFor(() => expect(result.current.status).toBe("loading"));

    act(() => result.current.logout());
    await waitFor(() => expect(result.current.status).toBe("needs_auth"));

    // Resolve the stale fetch and fully drain its continuation (fetch -> .json()
    // -> the reqId check) via a macrotask tick, so this asserts the request-id
    // guard rather than a microtask-timing artifact.
    await act(async () => {
      resolveFetch(jsonResponse(DRIVERS_PAYLOAD));
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.status).toBe("needs_auth");
    expect(result.current.data).toBeNull();
  });
});

describe("useFleetScores: production build with no backend URL (security invariant)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("disables the backend instead of falling back to localhost", async () => {
    // CRUZE_API_URL is resolved at module load from import.meta.env, so stub the
    // env and re-import to exercise the production-no-URL branch.
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_CRUZE_API_URL", "");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.resetModules();

    const mod = await import("./useFleetScores");
    expect(mod.CRUZE_API_URL).toBe("");
    // The module warns once at load time that the backend is disabled.
    expect(warn).toHaveBeenCalledTimes(1);

    const { result } = renderHook(() => mod.useFleetScores());

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error).toMatch(/not configured for this deployment/i);
    // Critically: no probe to 127.0.0.1 or anywhere else.
    expect(fetchMock).not.toHaveBeenCalled();

    // A manual login must also refuse rather than hit localhost.
    await act(async () => {
      await result.current.login("manager", "pw");
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.status).toBe("error");
  });
});
