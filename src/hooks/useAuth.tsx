import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  user: User | any | null; // using any to support our mock user object easily
  session: Session | any | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | any | null>(null);
  const [session, setSession] = useState<Session | any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check for local demo bypass
    const demoRole = localStorage.getItem("demo_role");
    if (demoRole) {
      setUser({
        id: `demo-${demoRole}-123`,
        email: `demo@${demoRole}.com`,
        user_metadata: { role: demoRole }
      });
      setSession({
        access_token: "dummy-token",
        user: { id: `demo-${demoRole}-123` }
      });
      setLoading(false);
      return;
    }

    // 2. Normal Supabase flow
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    if (localStorage.getItem("demo_role")) {
      localStorage.removeItem("demo_role");
      window.location.href = "/login";
      return;
    }
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
