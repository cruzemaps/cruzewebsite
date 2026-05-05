import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { identifyUser, resetAnalytics, track } from "@/lib/analytics";

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
// (see migration 20260504_003). Falls back to user_metadata if the hook isn't
// installed yet, so the demo + early-stage states keep working.
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

  useEffect(() => {
    // 1. Local demo bypass (kept — used by all "Try the demo" buttons + admin
    // impersonation). When demo_role is set, we mint a fake user/session +
    // role; Supabase isn't called.
    const demoRole = localStorage.getItem("demo_role") as AppRole | null;
    if (demoRole) {
      const fakeUser = { id: `demo-${demoRole}-123`, email: `demo@${demoRole}.com`, user_metadata: { role: demoRole } };
      setUser(fakeUser);
      setSession({ access_token: "dummy-token", user: fakeUser });
      setRole(demoRole);
      setStatus("active");
      setLoading(false);
      return;
    }

    // 2. Supabase flow.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      const { role: r, status: s } = readClaims(session);
      // Fallback: user_metadata.role if JWT hook isn't installed yet.
      setRole(r ?? ((session?.user?.user_metadata?.role as AppRole | undefined) ?? null));
      setStatus(s ?? "active");
      if (session?.user) identifyUser(session.user.id, { email: session.user.email });
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      const { role: r, status: s } = readClaims(session);
      setRole(r ?? ((session?.user?.user_metadata?.role as AppRole | undefined) ?? null));
      setStatus(s ?? "active");
      if (session?.user) identifyUser(session.user.id, { email: session.user.email });
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    track("login_succeeded", { event: "sign_out" });
    if (localStorage.getItem("demo_role")) {
      localStorage.removeItem("demo_role");
      localStorage.removeItem("demo_status");
      resetAnalytics();
      window.location.href = "/login";
      return;
    }
    await supabase.auth.signOut();
    resetAnalytics();
  };

  return (
    <AuthContext.Provider value={{ user, session, role, status, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
