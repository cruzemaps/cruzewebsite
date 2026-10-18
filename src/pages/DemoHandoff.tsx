import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { demoModeEnabled, setDemoSession } from "@/lib/demoMode";

// Demo bridge route, DEV builds only (App.tsx mounts it behind
// import.meta.env.DEV and production maps /demo to /login). Open it in a new
// tab so the demo state is only ever written to that tab's sessionStorage.
//
// Accepts `?role=fleet_owner|city_operator` and an optional same-origin
// `?go=` destination. Never accepts role=admin.
const PUBLIC_DEMO_ROLES = new Set(["fleet_owner", "city_operator"]);

export default function DemoHandoff() {
  useEffect(() => {
    if (!demoModeEnabled()) {
      window.location.replace("/login");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const role = params.get("role");

    if (!role || !PUBLIC_DEMO_ROLES.has(role)) {
      window.location.replace("/");
      return;
    }

    setDemoSession(role as "fleet_owner" | "city_operator");

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
