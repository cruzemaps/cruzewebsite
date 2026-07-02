import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Data hook for the Fleet Driver Scores dashboard (Phase 2b of the driver-scoring
// rollout). It talks to the CruzePlatform backend, NOT Supabase. The backend runs
// its own session-token auth (POST /api/login -> Bearer token), separate from the
// website's Supabase auth.
//
// SSO BRIDGE: when the manager already has a Supabase session, the hook first tries
// the backend's exchange endpoint (POST /auth/exchange with the Supabase access
// token) to transparently mint a backend session token, so they never type a second
// set of credentials. If the exchange is unavailable (503 sso-not-configured) or the
// Supabase JWT is rejected (401), the hook falls back to the manual manager-login /
// pasted-token path below — that fallback is intentionally preserved.

// Configurable backend base. Defaults to the local Functions host in DEV only.
// In a production build we refuse to silently fall back to localhost (that
// would make every visitor's browser probe 127.0.0.1); with no
// VITE_CRUZE_API_URL configured, the backend integration is disabled and a
// clear warning is logged instead.
export const CRUZE_API_URL: string =
  (import.meta.env.VITE_CRUZE_API_URL as string) ||
  (import.meta.env.PROD ? "" : "http://127.0.0.1:7071/api");

if (!CRUZE_API_URL) {
  console.warn(
    "[useFleetScores] VITE_CRUZE_API_URL is not set for this production build — " +
      "the fleet-scores backend is disabled (not falling back to localhost)."
  );
}

const BACKEND_DISABLED_MSG =
  "The fleet backend is not configured for this deployment (VITE_CRUZE_API_URL is unset).";

// Persist the backend token per-tab. sessionStorage (not localStorage) mirrors the
// site's demo-bypass convention: per-tab, never shared across tabs.
const TOKEN_STORAGE_KEY = "cruze_fleet_token";

export type ScoreBand =
  | "Excellent"
  | "Good"
  | "Fair"
  | "Needs Improvement"
  | "At Risk";

export interface DriverScores {
  safety: number | null;
  efficiency: number | null;
  overall: number | null;
  band: ScoreBand | null;
  has_data: boolean;
}

export interface FleetDriver {
  driver_id: string;
  score: number | null;
  miles_driven: number;
  event_counts: Record<string, number>;
  modeled_gallons_wasted: number;
  scores: DriverScores;
}

export interface FleetSummary {
  driver_count?: number;
  avg_overall?: number | null;
  avg_safety?: number | null;
  avg_efficiency?: number | null;
  total_miles?: number;
  total_gallons_wasted?: number;
  [key: string]: unknown;
}

export interface FleetScoresWindow {
  days?: number;
  start?: string;
  end?: string;
  [key: string]: unknown;
}

export interface FleetScoresResponse {
  window: FleetScoresWindow;
  fleet_summary: FleetSummary;
  drivers: FleetDriver[];
  phase_0_notes?: string[];
}

export type FleetScoresStatus =
  | "exchanging" // bridging the Supabase session to a backend token via SSO
  | "needs_auth" // no token yet; show the connect-backend panel
  | "loading"
  | "ready"
  | "empty" // authenticated but the fleet returned zero drivers
  | "error";

interface UseFleetScoresOptions {
  // The current Supabase access token (JWT). When present and no backend token
  // is cached yet, the hook attempts the SSO exchange before falling back to the
  // manual login / token-paste path.
  supabaseAccessToken?: string | null;
}

interface UseFleetScores {
  status: FleetScoresStatus;
  data: FleetScoresResponse | null;
  error: string | null;
  windowDays: number;
  token: string | null;
  setWindowDays: (days: number) => void;
  login: (username: string, password: string) => Promise<void>;
  setToken: (token: string) => void;
  logout: () => void;
  refresh: () => void;
}

function readStoredToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function useFleetScores(
  initialWindowDays = 7,
  options: UseFleetScoresOptions = {}
): UseFleetScores {
  const { supabaseAccessToken = null } = options;

  const [token, setTokenState] = useState<string | null>(() => readStoredToken());
  const [windowDays, setWindowDays] = useState(initialWindowDays);
  const [data, setData] = useState<FleetScoresResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<FleetScoresStatus>(() => {
    if (readStoredToken()) return "loading";
    // A Supabase session is available: we'll attempt the SSO exchange first.
    return "needs_auth";
  });

  // Used to ignore responses from a stale fetch (token/window changed mid-flight).
  const reqIdRef = useRef(0);
  // Guards the SSO exchange so it runs at most once per Supabase access token —
  // a 503/401 must fall back to manual entry, not retry-loop on every render.
  const exchangeAttemptedFor = useRef<string | null>(null);

  const persistToken = useCallback((next: string | null) => {
    try {
      if (next) sessionStorage.setItem(TOKEN_STORAGE_KEY, next);
      else sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      /* sessionStorage may be unavailable; in-memory token still works */
    }
    setTokenState(next);
  }, []);

  const fetchScores = useCallback(async () => {
    if (!CRUZE_API_URL) {
      setStatus("error");
      setError(BACKEND_DISABLED_MSG);
      return;
    }
    if (!token) {
      setStatus("needs_auth");
      return;
    }
    const reqId = ++reqIdRef.current;
    setStatus("loading");
    setError(null);
    try {
      const url = `${CRUZE_API_URL}/fleet/driver-scores?window_days=${windowDays}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (reqId !== reqIdRef.current) return; // superseded
      if (res.status === 401 || res.status === 403) {
        persistToken(null);
        setData(null);
        setStatus("needs_auth");
        setError("Session expired. Please connect to the backend again.");
        return;
      }
      if (!res.ok) {
        throw new Error(`Backend returned ${res.status}`);
      }
      const json = (await res.json()) as FleetScoresResponse;
      if (reqId !== reqIdRef.current) return;
      setData(json);
      setStatus(json.drivers && json.drivers.length > 0 ? "ready" : "empty");
    } catch (e) {
      if (reqId !== reqIdRef.current) return;
      setData(null);
      setStatus("error");
      setError(
        e instanceof Error
          ? `Could not reach the fleet backend at ${CRUZE_API_URL}. ${e.message}`
          : "Could not reach the fleet backend."
      );
    }
  }, [token, windowDays, persistToken]);

  useEffect(() => {
    fetchScores();
  }, [fetchScores]);

  // SSO bridge: exchange the Supabase access token for a backend session token.
  // Returns true if a backend token was obtained, false if the caller should fall
  // back to the manual login / token-paste path (exchange not configured, JWT
  // rejected, or the backend was unreachable).
  const exchangeSupabaseSession = useCallback(
    async (supabaseJwt: string): Promise<boolean> => {
      if (!CRUZE_API_URL) return false; // backend disabled for this deploy
      try {
        const res = await fetch(`${CRUZE_API_URL}/auth/exchange`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseJwt}`,
          },
          body: JSON.stringify({ supabase_jwt: supabaseJwt }),
        });
        // 503: the backend's SUPABASE_JWT_SECRET isn't set, so SSO is off for now.
        // 401: the Supabase JWT was invalid/expired for the backend's purposes.
        // Either way, degrade quietly to the manual fallback rather than erroring.
        if (res.status === 503 || res.status === 401) return false;
        if (!res.ok) return false;
        const json = (await res.json()) as {
          auth_token?: string;
          auth_token_expires_in?: number;
          email?: string;
        };
        const nextToken = json.auth_token ?? null;
        if (!nextToken) return false;
        persistToken(nextToken);
        // fetchScores re-runs via effect once token state updates.
        return true;
      } catch {
        // Network failure / backend unreachable: fall back to manual entry.
        return false;
      }
    },
    [persistToken]
  );

  useEffect(() => {
    // Only attempt the exchange when we have a Supabase session, no backend token
    // cached yet, and we haven't already tried for this exact Supabase token.
    if (!supabaseAccessToken) return;
    if (token) return;
    if (exchangeAttemptedFor.current === supabaseAccessToken) return;

    exchangeAttemptedFor.current = supabaseAccessToken;
    let cancelled = false;
    setStatus("exchanging");
    setError(null);
    exchangeSupabaseSession(supabaseAccessToken).then((ok) => {
      if (cancelled) return;
      // On success, token state updates and fetchScores runs via its effect. On
      // failure, drop to needs_auth so the manual ConnectPanel is shown.
      if (!ok) setStatus("needs_auth");
    });
    return () => {
      cancelled = true;
    };
  }, [supabaseAccessToken, token, exchangeSupabaseSession]);

  const login = useCallback(
    async (username: string, password: string) => {
      if (!CRUZE_API_URL) {
        setStatus("error");
        setError(BACKEND_DISABLED_MSG);
        return;
      }
      setError(null);
      setStatus("loading");
      try {
        const res = await fetch(`${CRUZE_API_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        if (!res.ok) {
          throw new Error(
            res.status === 401 ? "Invalid credentials." : `Login failed (${res.status}).`
          );
        }
        const json = (await res.json()) as { token?: string; access_token?: string };
        const nextToken = json.token ?? json.access_token ?? null;
        if (!nextToken) throw new Error("Login response did not include a token.");
        persistToken(nextToken);
        // fetchScores re-runs via effect once token state updates.
      } catch (e) {
        setStatus("needs_auth");
        setError(
          e instanceof Error
            ? e.message
            : "Login failed. Check the backend URL and credentials."
        );
      }
    },
    [persistToken]
  );

  const setToken = useCallback(
    (next: string) => {
      persistToken(next.trim() || null);
    },
    [persistToken]
  );

  const logout = useCallback(() => {
    persistToken(null);
    setData(null);
    setStatus("needs_auth");
    setError(null);
  }, [persistToken]);

  return useMemo(
    () => ({
      status,
      data,
      error,
      windowDays,
      token,
      setWindowDays,
      login,
      setToken,
      logout,
      refresh: fetchScores,
    }),
    [status, data, error, windowDays, token, login, setToken, logout, fetchScores]
  );
}
