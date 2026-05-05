import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Shield } from "lucide-react";

type AuditRow = {
  id: string;
  user_id: string;
  old_role: string | null;
  new_role: string;
  old_status: string | null;
  new_status: string | null;
  changed_by: string;
  reason: string;
  changed_at: string;
};

const DEMO: AuditRow[] = [
  { id: "a1", user_id: "u3", old_role: "fleet_owner", new_role: "city_operator", old_status: "pending", new_status: "active", changed_by: "u4", reason: "Verified employment with Austin DOT.", changed_at: "2026-05-04T11:30:00Z" },
  { id: "a2", user_id: "u1", old_role: "fleet_owner", new_role: "fleet_owner", old_status: "active", new_status: "suspended", changed_by: "u4", reason: "Account suspected of policy violation; pending review.", changed_at: "2026-04-28T15:11:00Z" },
];

export default function AuditTab({ isDemo }: { isDemo: boolean }) {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (isDemo) {
        setRows(DEMO);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("role_history")
        .select("*")
        .order("changed_at", { ascending: false })
        .limit(200);
      if (!error && data) setRows(data as AuditRow[]);
      setLoading(false);
    })();
  }, [isDemo]);

  if (loading) {
    return <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-brand-cyan" /></div>;
  }

  return (
    <Card className="bg-[#0F131C] border-white/10">
      <CardContent className="p-6">
        {rows.length === 0 ? (
          <div className="py-12 text-center text-white/40">
            <Shield className="mx-auto mb-2" />
            No role changes yet.
          </div>
        ) : (
          <ol className="relative border-l border-white/10 ml-3 space-y-6">
            {rows.map((r) => (
              <li key={r.id} className="ml-6">
                <span className="absolute -left-1.5 w-3 h-3 rounded-full bg-brand-cyan" />
                <div className="rounded-lg border border-white/10 bg-[#0B0E14] p-4">
                  <div className="flex flex-wrap items-baseline justify-between mb-2 gap-2">
                    <div className="text-sm">
                      <span className="text-white/50">User</span>{" "}
                      <code className="text-xs px-2 py-1 rounded bg-white/5 text-white/70">{r.user_id.slice(0, 8)}</code>
                      <span className="text-white/50"> changed </span>
                      {r.old_role !== r.new_role ? (
                        <>
                          <span className="text-white/40 line-through">{r.old_role}</span>{" "}
                          <span className="text-brand-cyan font-semibold">→ {r.new_role}</span>
                        </>
                      ) : (
                        <span className="text-white/50">status only</span>
                      )}
                      {r.new_status && r.old_status !== r.new_status && (
                        <span className="text-white/50"> · status <span className="text-brand-orange">{r.new_status}</span></span>
                      )}
                    </div>
                    <time className="text-xs text-white/40">{new Date(r.changed_at).toLocaleString()}</time>
                  </div>
                  <p className="text-sm text-white/70">{r.reason}</p>
                  <p className="text-xs text-white/30 mt-2">By <code>{r.changed_by.slice(0, 8)}</code></p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
