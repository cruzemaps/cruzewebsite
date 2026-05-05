import { useEffect } from "react";
import { Loader2 } from "lucide-react";

// Bridge route that runs only in the freshly-opened impersonation tab.
// Reads role/id/dest from the URL the admin's impersonate() built, writes
// them to sessionStorage (per-tab, isolated from the admin's own tab),
// then redirects to the impersonated user's dashboard. Without this bridge,
// putting demo_role in localStorage would poison the admin's own session.
export default function ImpersonateHandoff() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const role = params.get("role");
    const status = params.get("status");
    const id = params.get("id");
    const go = params.get("go") || "/";

    if (!role || !id) {
      window.location.replace("/admin");
      return;
    }

    sessionStorage.setItem("demo_role", role);
    sessionStorage.setItem("demo_status", status || "active");
    sessionStorage.setItem("impersonated_user_id", id);

    // replace, not assign, so back button skips the bridge
    window.location.replace(go);
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center text-white">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-cyan mx-auto mb-3" />
        <p className="text-white/60">Opening impersonation session…</p>
      </div>
    </div>
  );
}
