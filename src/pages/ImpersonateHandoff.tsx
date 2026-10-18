import { useEffect, useState } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { beginImpersonation } from "@/lib/impersonation";
import { getImpersonatedUserId } from "@/lib/demoMode";
import { track } from "@/lib/analytics";

// Bridge route for the admin "view as user" preview. Mounted in DEV builds
// only (see App.tsx); production has no impersonation route.
//
// The admin check and the audit row both happen on the server inside the
// start_impersonation RPC (migration 017). This page never reads the role
// from the URL or from the JWT: it only enters the preview with the role the
// server returned. Supabase keeps its session in localStorage, which is shared
// across tabs of the same origin, so the RPC carries the admin's real JWT.
export default function ImpersonateHandoff() {
  const [denied, setDenied] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const outcome = await beginImpersonation(window.location.search, (fn, args) => supabase.rpc(fn, args));
      if (outcome.kind === "denied") {
        setDenied(outcome.reason);
        return;
      }
      // Analytics only after the server accepted and audited the session.
      const target = getImpersonatedUserId();
      if (target) track("role_changed", { event: "impersonation", target });
      // replace, not assign, so back button skips the bridge
      window.location.replace(outcome.to);
    })();
  }, []);

  if (denied) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center text-white p-6">
        <div className="text-center max-w-md">
          <ShieldAlert className="w-10 h-10 text-red-400 mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold mb-2">Impersonation requires admin sign-in</h1>
          <p className="text-white/60 text-sm">
            The server did not accept this request. Sign in as an active admin and try again from the Users tab.
          </p>
          <p className="text-white/30 text-xs mt-3">{denied}</p>
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
