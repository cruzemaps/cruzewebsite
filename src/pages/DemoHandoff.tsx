import { useEffect } from "react";
import { Loader2 } from "lucide-react";

// Public-demo bridge route. The marketing pages (`/for-fleets`,
// `/for-cities`) `window.open` this in a new tab so the demo activation
// only writes to *that* new tab's sessionStorage — the original tab keeps
// whatever real session the user has. Distinct from `/impersonate`, which
// sets `impersonated_user_id` and surfaces an ImpersonationBanner.
//
// Accepts `?role=fleet_owner|city_operator` and an optional `?go=`
// destination. Falls back to the role's natural dashboard.
//
// Lives outside Login.tsx because the URL-bypass branch in Login is
// gated to `import.meta.env.DEV`. The marketing CTAs need the demo to
// work in production too — that's what this bridge enables, while keeping
// the broader URL-bypass attack surface dev-only.
//
// Audit (2nd pass) #2: deliberately does NOT accept `role=admin`. The admin
// demo is always dev-only (`/login?demo=admin` is gated to import.meta.env.DEV).
// A public `/demo?role=admin` would let anyone walk into the admin portal in
// their tab and read the local mock data. Marketing only uses fleet_owner +
// city_operator anyway; admin demo is for engineers.
const PUBLIC_DEMO_ROLES = new Set(["fleet_owner", "city_operator"]);

export default function DemoHandoff() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const role = params.get("role");

    if (!role || !PUBLIC_DEMO_ROLES.has(role)) {
      window.location.replace("/");
      return;
    }

    sessionStorage.setItem("demo_role", role);

    const fallback = role === "city_operator" ? "/dashboard" : "/fleet-dashboard";
    const go = params.get("go") || fallback;

    // Only allow same-origin destinations to defeat open-redirect attempts.
    if (!go.startsWith("/") || go.startsWith("//")) {
      window.location.replace(fallback);
      return;
    }

    window.location.replace(go);
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center text-white">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-cyan mx-auto mb-3" />
        <p className="text-white/60">Opening Cruze demo…</p>
      </div>
    </div>
  );
}
