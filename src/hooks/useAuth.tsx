import { createContext, useContext } from "react";
import type { User, Session } from "@supabase/supabase-js";

export type AppRole = "admin" | "fleet_owner" | "city_operator";
export type AppStatus = "pending" | "active" | "suspended" | "archived";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  status: AppStatus | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

// The provider lives in AuthProvider.tsx, so this file exports no components
// and React Fast Refresh keeps working for both.
export const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  role: null,
  status: null,
  loading: true,
  signOut: async () => {},
});

// Decode role/status from the JWT custom claims set by the access_token hook
// (see migration 20260504_003). Returns nulls when claims are missing — the
// SPA defaults to deny in that case (ProtectedRoute treats null role as
// unauthenticated). DO NOT fall back to user_metadata.role: that field is
// user-controllable at signup and bypassing the privilege-escalation fix in
// migration 001 would re-open the security hole.
export function readClaims(session: Session | null | undefined): { role: AppRole | null; status: AppStatus | null } {
  if (!session?.access_token) return { role: null, status: null };
  try {
    const seg = session.access_token.split(".")[1];
    if (!seg) return { role: null, status: null };
    // JWT payloads are base64URL, not standard base64: atob() chokes on the
    // '-'/'_' alphabet (and missing '=' padding), which would throw for any
    // legitimate token whose payload happens to encode those chars and —
    // via the catch below — deny a valid user. Normalize before decoding.
    const b64 = seg.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded));
    const role = (payload.app_role as AppRole | undefined) ?? null;
    const status = (payload.app_status as AppStatus | undefined) ?? null;
    return { role, status };
  } catch {
    return { role: null, status: null };
  }
}

export const useAuth = () => useContext(AuthContext);
