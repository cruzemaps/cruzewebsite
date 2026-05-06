import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Shield, ChevronLeft, ChevronRight } from "lucide-react";

type ProfileMini = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
};

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

type DemoRow = AuditRow & { _demoUser?: string; _demoChanger?: string };

const DEMO: DemoRow[] = [
  { id: "a1", user_id: "u3", old_role: "fleet_owner", new_role: "city_operator", old_status: "pending", new_status: "active", changed_by: "u4", reason: "Verified employment with Austin DOT.", changed_at: "2026-05-04T11:30:00Z", _demoUser: "Sam Patel", _demoChanger: "Anudeep Bonagiri" },
  { id: "a2", user_id: "u1", old_role: "fleet_owner", new_role: "fleet_owner", old_status: "active", new_status: "suspended", changed_by: "u4", reason: "Account suspected of policy violation; pending review.", changed_at: "2026-04-28T15:11:00Z", _demoUser: "Lori Chen", _demoChanger: "Anudeep Bonagiri" },
];

// Render a profile as a friendly name. Falls back to email, then to a
// short UUID slice when nothing else is known.
function profileLabel(p: ProfileMini | undefined, fallbackId: string): string {
  if (!p) return fallbackId.slice(0, 8) + "…";
  const full = [p.first_name, p.last_name].filter(Boolean).join(" ").trim();
  if (full) return full;
  if (p.email) return p.email;
  return fallbackId.slice(0, 8) + "…";
}

// Audit #28: switch the unbounded `limit(200)` fetch to true server-side
// pagination. The role_history table grows monotonically — at scale the
// admin needed a way to page through history rather than getting silently
// truncated at 200 newest rows.
const PAGE_SIZE = 50;

export default function AuditTab({ isDemo }: { isDemo: boolean }) {
  const [rows, setRows] = useState<DemoRow[]>([]);
  const [profiles, setProfiles] = useState<Map<string, ProfileMini>>(new Map());
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      if (isDemo) {
        setRows(DEMO);
        setTotalCount(DEMO.length);
        setLoading(false);
        return;
      }

      // Fetch this page + the total count in one round trip.
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error, count } = await supabase
        .from("role_history")
        .select("*", { count: "exact" })
        .order("changed_at", { ascending: false })
        .range(from, to);
      if (error || !data) {
        setLoading(false);
        return;
      }
      setRows(data as AuditRow[]);
      setTotalCount(count ?? null);

      // Resolve names for the UUIDs on this page only.
      const ids = new Set<string>();
      for (const r of data as AuditRow[]) {
        ids.add(r.user_id);
        ids.add(r.changed_by);
      }
      if (ids.size > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, email")
          .in("id", Array.from(ids));
        if (profs) {
          const m = new Map<string, ProfileMini>();
          (profs as ProfileMini[]).forEach((p) => m.set(p.id, p));
          setProfiles(m);
        }
      }
      setLoading(false);
    })();
  }, [isDemo, page]);

  const totalPages = totalCount !== null ? Math.max(1, Math.ceil(totalCount / PAGE_SIZE)) : null;
  const hasPrev = page > 0;
  const hasNext = totalPages !== null ? page < totalPages - 1 : rows.length === PAGE_SIZE;

  if (loading) {
    return <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-brand-cyan" /></div>;
  }

  return (
    <Card className="bg-[#0F131C] border-white/10">
      <CardContent className="p-6">
        {totalCount !== null && totalCount > 0 && (
          <div className="flex items-center justify-between mb-4 text-xs text-white/50">
            <span>
              Page <strong className="text-white">{page + 1}</strong>
              {totalPages !== null && <> of <strong className="text-white">{totalPages}</strong></>}
              {" · "}
              <strong className="text-white">{totalCount.toLocaleString()}</strong> total events
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" disabled={!hasPrev || loading} onClick={() => setPage((p) => Math.max(0, p - 1))}>
                <ChevronLeft size={14} className="mr-1" /> Newer
              </Button>
              <Button size="sm" variant="ghost" disabled={!hasNext || loading} onClick={() => setPage((p) => p + 1)}>
                Older <ChevronRight size={14} className="ml-1" />
              </Button>
            </div>
          </div>
        )}
        {rows.length === 0 ? (
          <div className="py-12 text-center text-white/40">
            <Shield className="mx-auto mb-2" />
            No role changes yet.
          </div>
        ) : (
          <ol className="relative border-l border-white/10 ml-3 space-y-6">
            {rows.map((r) => {
              // Demo rows carry pre-resolved names; real rows resolve via the
              // profiles Map populated above.
              const userName = isDemo
                ? r._demoUser ?? r.user_id.slice(0, 8)
                : profileLabel(profiles.get(r.user_id), r.user_id);
              const changerName = isDemo
                ? r._demoChanger ?? r.changed_by.slice(0, 8)
                : profileLabel(profiles.get(r.changed_by), r.changed_by);

              return (
                <li key={r.id} className="ml-6">
                  <span className="absolute -left-1.5 w-3 h-3 rounded-full bg-brand-cyan" />
                  <div className="rounded-lg border border-white/10 bg-[#0B0E14] p-4">
                    <div className="flex flex-wrap items-baseline justify-between mb-2 gap-2">
                      <div className="text-sm">
                        <strong className="text-white">{userName}</strong>
                        <span className="text-white/50"> was changed </span>
                        {r.old_role !== r.new_role ? (
                          <>
                            from <span className="text-white/60 line-through">{r.old_role}</span>{" "}
                            <span className="text-brand-cyan font-semibold">to {r.new_role}</span>
                          </>
                        ) : (
                          <span className="text-white/50">(status only)</span>
                        )}
                        {r.new_status && r.old_status !== r.new_status && (
                          <span className="text-white/50">
                            {" "}· status <span className="text-brand-orange font-semibold">{r.new_status}</span>
                          </span>
                        )}
                      </div>
                      <time className="text-xs text-white/40">{new Date(r.changed_at).toLocaleString()}</time>
                    </div>
                    <p className="text-sm text-white/75 leading-relaxed">{r.reason}</p>
                    <p className="text-xs text-white/40 mt-2">
                      By <span className="text-white/70 font-medium">{changerName}</span>
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
