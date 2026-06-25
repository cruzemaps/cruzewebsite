import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Data hook for the Fleet Driver Scores dashboard (Phase 2b of the driver-scoring
// rollout). It talks to the CruzePlatform backend, NOT Supabase. The backend runs
// its own session-token auth (POST /api/login -> Bearer token), separate from the
// website's Supabase auth.
//
// PRODUCTION-SSO TODO: this phase obtains the backend token via a direct manager
// login (or a pre-pasted token). The production design should bridge the website's
// Supabase session to a backend session token (a short-lived exchange endpoint that
// trusts the Supabase JWT and mints a backend token), so the manager never types a
// second set of credentials. Until that bridge ships, keep the explicit login below.

// Configurable backend base. Defaults to the local Functions host used in dev.
export const CRUZE_API_URL: string =
  (import.meta.env.VITE_CRUZE_API_URL as string) || "http://127.0.0.1:7071/api";

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
  | "needs_auth" // no token yet; show the connect-backend panel
  | "loading"
  | "ready"
  | "empty" // authenticated but the fleet returned zero drivers
  | "error";

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

export function useFleetScores(initialWindowDays = 7): UseFleetScores {
  const [token, setTokenState] = useState<string | null>(() => readStoredToken());
  const [windowDays, setWindowDays] = useState(initialWindowDays);
  const [data, setData] = useState<FleetScoresResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<FleetScoresStatus>(() =>
    readStoredToken() ? "loading" : "needs_auth"
  );

  // Used to ignore responses from a stale fetch (token/window changed mid-flight).
  const reqIdRef = useRef(0);

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

  const login = useCallback(
    async (username: string, password: string) => {
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
