import React, { createContext, useContext, useEffect, useState } from "react";
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

  // Helper: re-fetch session from Supabase, which re-runs the JWT hook and
  // returns a token with current claims. Used when an admin updates this
  // user's row remotely so role/status changes propagate immediately.
  const forceRefresh = async () => {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) return;
    setSession(data.session);
    setUser(data.session?.user ?? null);
    const { role: r, status: s } = readClaims(data.session);
    setRole(r);
    setStatus(s);
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
      if (realtimeChannel) supabase.removeChannel(realtimeChannel);
      realtimeChannel = supabase
        .channel(`profile_${userId}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${userId}` },
          (payload) => {
            const next = payload.new as { role?: AppRole; status?: AppStatus };
            // Detect meaningful changes vs. noise (e.g. last_active_at touch)
            const roleChanged = next.role && next.role !== role;
            const statusChanged = next.status && next.status !== status;
            if (roleChanged || statusChanged) {
              if (statusChanged && next.status === "suspended") {
                toast.warning("Your account has been suspended. Signing you out.");
                signOut();
                return;
              }
              if (statusChanged && next.status === "archived") {
                toast.error("Your account has been archived. Signing you out.");
                signOut();
                return;
              }
              if (roleChanged) {
                toast.info(`Your role has been updated to ${next.role}.`);
              }
              forceRefresh();
            }
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
        if (currentUserId !== session.user.id) {
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
