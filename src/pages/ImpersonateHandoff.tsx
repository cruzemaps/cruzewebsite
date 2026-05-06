import { useEffect, useState } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { supabase } from "@/lib/supabase";

// Bridge route that runs only in the freshly-opened impersonation tab.
// Reads role/id/dest from the URL the admin's impersonate() built, writes
// them to sessionStorage (per-tab, isolated from the admin's own tab),
// then redirects to the impersonated user's dashboard.
//
// 2nd-pass audit #2: the route is mounted unauthenticated in App.tsx, which
// previously meant ANY visitor could craft `/impersonate?role=admin&id=...`
// and walk into the admin portal in their tab. Hardening: before honoring the
// query string, we verify that this origin's Supabase session belongs to an
// admin (Supabase persists tokens to localStorage, which IS shared across
// tabs of the same origin — so the admin's real session is visible to this
// tab too). Non-admins / unauthenticated visitors get bounced.
export default function ImpersonateHandoff() {
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const role = params.get("role");
      const status = params.get("status");
      const id = params.get("id");
      const go = params.get("go") || "/";

      if (!role || !id) {
        window.location.replace("/");
        return;
      }

      // Same-origin destination only. Defeats open-redirect attempts where
      // an attacker injects `?go=https://evil.example/`.
      if (!go.startsWith("/") || go.startsWith("//")) {
        window.location.replace("/admin");
        return;
      }

      // Whitelist roles the admin tooling actually impersonates.
      const allowedRoles = new Set(["fleet_owner", "city_operator", "admin"]);
      if (!allowedRoles.has(role)) {
        window.location.replace("/admin");
        return;
      }

      // Verify caller is an admin in this origin's persisted Supabase session.
      const { data } = await supabase.auth.getSession();
      let appRole: string | undefined;
      try {
        if (data.session?.access_token) {
          const payload = JSON.parse(atob(data.session.access_token.split(".")[1]));
          appRole = payload.app_role;
        }
      } catch {
        appRole = undefined;
      }
      // user_metadata fallback (matches the rest of the app's role resolution
      // in case the JWT custom-claims hook isn't installed yet).
      const metaRole = data.session?.user?.user_metadata?.role as string | undefined;
      const isAdmin = appRole === "admin" || metaRole === "admin";

      if (!isAdmin) {
        setDenied(true);
        return;
      }

      sessionStorage.setItem("demo_role", role);
      sessionStorage.setItem("demo_status", status || "active");
      sessionStorage.setItem("impersonated_user_id", id);

      // replace, not assign, so back button skips the bridge
      window.location.replace(go);
    })();
  }, []);

  if (denied) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center text-white p-6">
        <div className="text-center max-w-md">
          <ShieldAlert className="w-10 h-10 text-red-400 mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold mb-2">Impersonation requires admin sign-in</h1>
          <p className="text-white/60 text-sm">
            This bridge can only be opened from the admin portal in an authenticated session.
            Sign in as an admin and try again from the Users tab.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center text-white">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-cyan mx-auto mb-3" />
        <p className="text-white/60">Opening impersonation session…</p>
      </div>
    </div>
  );
}
