import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { identifyUser, resetAnalytics } from "@/lib/analytics";
import { toast } from "sonner";

export type AppRole = "admin" | "fleet_owner" | "city_operator";
export type AppStatus = "pending" | "active" | "suspended" | "archived";

interface AuthContextType {
  user: User | any | null;
  session: Session | any | null;
  role: AppRole | null;
  status: AppStatus | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
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
function readClaims(session: Session | null | undefined): { role: AppRole | null; status: AppStatus | null } {
  if (!session?.access_token) return { role: null, status: null };
  try {
    const payload = JSON.parse(atob(session.access_token.split(".")[1]));
    const role = (payload.app_role as AppRole | undefined) ?? null;
    const status = (payload.app_status as AppStatus | undefined) ?? null;
    return { role, status };
  } catch {
    return { role: null, status: null };
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | any | null>(null);
  const [session, setSession] = useState<Session | any | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [status, setStatus] = useState<AppStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Refs that mirror role/status. The realtime subscription's callback closes
  // over these via the ref, not the state value, so subsequent profile UPDATEs
  // always compare against the latest known role/status (fixes audit #8).
  const roleRef = useRef<AppRole | null>(null);
  const statusRef = useRef<AppStatus | null>(null);
  useEffect(() => { roleRef.current = role; }, [role]);
  useEffect(() => { statusRef.current = status; }, [status]);

  // Helper: re-fetch session from Supabase, which re-runs the JWT hook and
  // returns a token with current claims. Used when an admin updates this
  // user's row remotely so role/status changes propagate immediately.
  //
  // GUARDRAILS:
  //   - On error (e.g., refresh token expired, network failure), DO NOT
  //     clear local state. Keep the existing session intact. The user
  //     stays logged in with their current claims; on next manual nav the
  //     session is re-validated naturally.
  //   - On a successful refresh that returns no session, also DO NOT clear
  //     state — that scenario is ambiguous and shouldn't trigger a sign-out.
  const forceRefresh = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error || !data?.session) return; // keep current session
      setSession(data.session);
      setUser(data.session.user ?? null);
      const { role: r, status: s } = readClaims(data.session);
      setRole(r);
      setStatus(s);
    } catch {
      // Network failure or unexpected. Keep the existing session.
    }
  };

  useEffect(() => {
    // Demo bypass: only honored when the demo flag is set in sessionStorage
    // (per-tab). localStorage was previously used but caused admin sessions
    // to bleed into other tabs during impersonation. sessionStorage isolates.
    // Read both for backwards compat with any open tabs that wrote to
    // localStorage; clear the localStorage version on read to migrate.
    const localDemo = localStorage.getItem("demo_role") as AppRole | null;
    if (localDemo) {
      sessionStorage.setItem("demo_role", localDemo);
      localStorage.removeItem("demo_role");
      localStorage.removeItem("demo_status");
    }
    const demoRole = sessionStorage.getItem("demo_role") as AppRole | null;
    if (demoRole) {
      const fakeUser = { id: `demo-${demoRole}-123`, email: `demo@${demoRole}.com`, user_metadata: { role: demoRole } };
      setUser(fakeUser);
      setSession({ access_token: "dummy-token", user: fakeUser });
      setRole(demoRole);
      setStatus("active");
      setLoading(false);
      return;
    }

    // Real Supabase flow.
    let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;
    let currentUserId: string | null = null;

    const subscribeToProfile = (userId: string) => {
      // Listen for changes to THIS user's profiles row. When admin changes
      // role or status, this fires and forces a token refresh so the UI
      // picks up new claims immediately rather than waiting an hour.
      //
      // GUARDRAILS (added after a profile UPDATE caused unexpected sign-outs):
      //   1. Only act on hard transitions: suspended/archived (sign out),
      //      role change (notify), or active->non-active status (notify).
      //      All other updates (last_active_at touches, name edits) are
      //      explicitly ignored.
      //   2. Never call signOut() except on suspended/archived. Status moving
      //      to 'pending' is NOT a sign-out trigger — admins might briefly
      //      pause a user without intending to fully revoke their session.
      //   3. forceRefresh() failures are silent: never propagate to a sign-out.
      if (realtimeChannel) supabase.removeChannel(realtimeChannel);
      realtimeChannel = supabase
        .channel(`profile_${userId}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${userId}` },
          (payload) => {
            const next = payload.new as { role?: AppRole; status?: AppStatus };

            // Read CURRENT values from local state via closure capture. We
            // intentionally don't use the React state setters' callbacks here
            // because we want to compare against the most recent state we've
            // seen, not stale values.
            const newRole = next.role ?? null;
            const newStatus = next.status ?? null;

            // Hard sign-out triggers: explicit suspension or archive only.
            if (newStatus === "suspended") {
              toast.warning("Your account has been suspended. Signing you out.");
              signOut();
              return;
            }
            if (newStatus === "archived") {
              toast.error("Your account has been archived. Signing you out.");
              signOut();
              return;
            }

            // Read latest role/status from refs (state-mirroring) so the
            // closure isn't stale across multiple updates within the same
            // session. Audit #8 was about this exact bug.
            const currentRole = roleRef.current;
            const currentStatus = statusRef.current;

            // Soft notification: role changed. Refresh JWT so RLS sees new role.
            if (newRole && newRole !== currentRole) {
              toast.info(`Your role was updated to ${newRole}.`);
              forceRefresh();
              return;
            }

            // Soft notification: status moved to pending (admin paused).
            // Do NOT sign out — pending users can still browse public pages.
            // Refresh so the JWT reflects the new app_status claim, but if
            // refresh fails we keep the old session rather than dropping it.
            if (newStatus && newStatus !== currentStatus && newStatus !== "active") {
              toast.warning(`Your account status changed to ${newStatus}. Some features may be limited.`);
              forceRefresh();
              return;
            }

            // Status returned to active — refresh quietly so RLS unblocks.
            if (newStatus === "active" && currentStatus && currentStatus !== "active") {
              forceRefresh();
              return;
            }

            // Anything else (last_active_at touch, name edits, etc.): ignore.
          }
        )
        .subscribe();
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      const { role: r, status: s } = readClaims(session);
      setRole(r);
      setStatus(s);
      if (session?.user) {
        identifyUser(session.user.id, { email: session.user.email });
        currentUserId = session.user.id;
        subscribeToProfile(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      const { role: r, status: s } = readClaims(session);
      setRole(r);
      setStatus(s);
      if (session?.user) {
        identifyUser(session.user.id, { email: session.user.email });
        // 2nd-pass audit #7: also re-subscribe when the JWT's claim role
        // drifts from what we previously had on this user. The user.id
        // check alone misses the case where a session for the same user
        // is reissued with a different app_role (admin demoted/promoted
        // mid-session), which would otherwise leave the channel listening
        // under stale claims.
        const claimDrifted = currentUserId === session.user.id && r !== roleRef.current;
        if (currentUserId !== session.user.id || claimDrifted) {
          currentUserId = session.user.id;
          subscribeToProfile(session.user.id);
        }
      } else if (event === "SIGNED_OUT") {
        currentUserId = null;
        if (realtimeChannel) {
          supabase.removeChannel(realtimeChannel);
          realtimeChannel = null;
        }
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      if (realtimeChannel) supabase.removeChannel(realtimeChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    if (sessionStorage.getItem("demo_role")) {
      sessionStorage.removeItem("demo_role");
      sessionStorage.removeItem("demo_status");
      sessionStorage.removeItem("impersonated_user_id");
      resetAnalytics();
      window.location.href = "/login";
      return;
    }
    await supabase.auth.signOut();
    resetAnalytics();
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, session, role, status, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
