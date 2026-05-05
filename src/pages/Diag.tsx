import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

// Auth/permissions diagnostic. Visit /diag while signed in to see exactly
// what the server sees vs. what the client thinks. Helps narrow the
// "row violates RLS" failures to a specific layer.
export default function Diag() {
  const auth = useAuth();
  const [serverChecks, setServerChecks] = useState<{
    isAdmin: boolean | null;
    isAdminError: string | null;
    profileRow: any;
    profileError: string | null;
    insertOk: boolean | null;
    insertError: string | null;
    rpcOk: boolean | null;
    rpcError: string | null;
  }>({
    isAdmin: null,
    isAdminError: null,
    profileRow: null,
    profileError: null,
    insertOk: null,
    insertError: null,
    rpcOk: null,
    rpcError: null,
  });
  const [running, setRunning] = useState(false);

  const run = async () => {
    setRunning(true);
    const next = { ...serverChecks };

    // 1. Get the current Supabase session (independent of useAuth)
    const { data: sessionData } = await supabase.auth.getSession();

    // 2. Test is_admin() RPC (server-side authoritative)
    {
      const { data, error } = await supabase.rpc("is_admin");
      next.isAdmin = error ? null : !!data;
      next.isAdminError = error?.message ?? null;
    }

    // 3. Try to read the caller's profile via auth.uid() (RLS-permitted)
    if (auth.user?.id) {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, role, status, email, first_name, last_name")
        .eq("id", auth.user.id)
        .maybeSingle();
      next.profileRow = data;
      next.profileError = error?.message ?? null;
    }

    // 4. Try the actual invitation insert that's failing in production
    if (auth.user?.id) {
      const testEmail = `diag-${Date.now()}@cruzemaps.test`;
      const { error } = await supabase.from("invitations").insert({
        email: testEmail,
        role: "fleet_owner",
        invited_by: auth.user.id,
      });
      next.insertOk = !error;
      next.insertError = error?.message ?? null;
      // Clean up so we don't spam the table
      if (!error) {
        await supabase.from("invitations").delete().eq("email", testEmail);
      }
    }

    // 5. Try a simple read of invitations (also RLS-gated)
    {
      const { error } = await supabase.from("invitations").select("id").limit(1);
      next.rpcOk = !error;
      next.rpcError = error?.message ?? null;
    }

    setServerChecks(next);
    setRunning(false);
    console.log("[diag] session:", sessionData);
    console.log("[diag] auth.user:", auth.user);
    console.log("[diag] decoded JWT:", decodeJwt(sessionData?.session?.access_token));
  };

  const decodeJwt = (token?: string | null) => {
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch {
      return null;
    }
  };

  const session = supabase.auth as any; // for read-only inspection
  const decoded = decodeJwt((session as any)?._currentSession?.access_token);

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold mb-2">Auth Diagnostic</h1>
          <p className="text-white/60 text-sm">
            Run this signed in. It tests what the server actually sees, not what the client hopes for.
          </p>
        </div>

        <Card className="bg-[#0F131C] border-white/10">
          <CardContent className="p-6 space-y-3">
            <h2 className="font-display font-semibold text-lg mb-2">Client view</h2>
            <Row label="useAuth.user.id" value={auth.user?.id ?? "(null)"} />
            <Row label="useAuth.user.email" value={auth.user?.email ?? "(null)"} />
            <Row label="useAuth.role" value={auth.role ?? "(null)"} />
            <Row label="useAuth.status" value={auth.status ?? "(null)"} />
            <Row label="sessionStorage.demo_role" value={sessionStorage.getItem("demo_role") ?? "(none)"} accent={!!sessionStorage.getItem("demo_role")} />
            <Row label="sessionStorage.impersonated_user_id" value={sessionStorage.getItem("impersonated_user_id") ?? "(none)"} accent={!!sessionStorage.getItem("impersonated_user_id")} />
            <Row label="localStorage.demo_role (legacy)" value={localStorage.getItem("demo_role") ?? "(none)"} accent={!!localStorage.getItem("demo_role")} />
            <Row label="localStorage Supabase auth token present" value={Object.keys(localStorage).find((k) => k.startsWith("sb-")) ? "YES" : "NO"} accent={!Object.keys(localStorage).find((k) => k.startsWith("sb-"))} />
          </CardContent>
        </Card>

        <Card className="bg-[#0F131C] border-white/10">
          <CardContent className="p-6 space-y-3">
            <h2 className="font-display font-semibold text-lg mb-2">JWT (what the server actually receives)</h2>
            {decoded ? (
              <>
                <Row label="sub (= auth.uid)" value={decoded.sub ?? "(missing)"} />
                <Row label="email" value={decoded.email ?? "(missing)"} />
                <Row label="app_role (custom claim)" value={decoded.app_role ?? "(missing — auth hook may not be installed)"} accent={!decoded.app_role} />
                <Row label="app_status (custom claim)" value={decoded.app_status ?? "(missing — auth hook may not be installed)"} accent={!decoded.app_status} />
                <Row label="exp (expires)" value={new Date(decoded.exp * 1000).toLocaleString()} />
              </>
            ) : (
              <p className="text-yellow-400 text-sm">No JWT in client. You're not signed in to Supabase. Demo bypass alone doesn't give you a real session.</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-[#0F131C] border-white/10">
          <CardContent className="p-6">
            <Button onClick={run} disabled={running} className="bg-brand-cyan text-[#0B0E14] hover:bg-brand-cyan/90 mb-4">
              {running && <Loader2 className="animate-spin mr-2" size={14} />}
              Run server-side checks
            </Button>

            {serverChecks.isAdmin !== null || serverChecks.isAdminError ? (
              <div className="space-y-3">
                <h2 className="font-display font-semibold text-lg">Server view</h2>
                <ResultRow
                  label="is_admin() RPC"
                  ok={serverChecks.isAdmin === true}
                  detail={serverChecks.isAdminError ?? (serverChecks.isAdmin ? "true" : "false")}
                />
                <ResultRow
                  label="profiles select where id = auth.uid()"
                  ok={!!serverChecks.profileRow}
                  detail={serverChecks.profileError ?? (serverChecks.profileRow ? `role=${serverChecks.profileRow.role} status=${serverChecks.profileRow.status}` : "no row returned")}
                />
                <ResultRow
                  label="invitations select"
                  ok={serverChecks.rpcOk === true}
                  detail={serverChecks.rpcError ?? "OK"}
                />
                <ResultRow
                  label="invitations insert (the failing op)"
                  ok={serverChecks.insertOk === true}
                  detail={serverChecks.insertError ?? "OK (test row inserted then deleted)"}
                />
              </div>
            ) : null}
          </CardContent>
        </Card>

        <p className="text-xs text-white/40">
          Inspect the browser console for the full session and decoded JWT objects.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between text-sm py-1">
      <span className="text-white/60">{label}</span>
      <code className={`font-mono ${accent ? "text-yellow-400" : "text-white/90"}`}>{value}</code>
    </div>
  );
}

function ResultRow({ label, ok, detail }: { label: string; ok: boolean; detail: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
      {ok ? (
        <CheckCircle2 className="text-emerald-400 flex-shrink-0 mt-0.5" size={16} />
      ) : (
        <XCircle className="text-red-400 flex-shrink-0 mt-0.5" size={16} />
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{label}</div>
        <div className={`text-xs mt-1 ${ok ? "text-white/50" : "text-red-400/90"}`}>{detail}</div>
      </div>
    </div>
  );
}
