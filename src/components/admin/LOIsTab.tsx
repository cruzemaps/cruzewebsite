import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, FileSignature, Search, ExternalLink, Download } from "lucide-react";

type LOIRow = {
  id: string;
  user_id: string;
  pilot_application_id: string | null;
  participant_name: string;
  participant_company: string;
  participant_title: string | null;
  fleet_size: string;
  initials: string;
  signed_at: string;
  loi_version: string;
};

const DEMO_LOIS: LOIRow[] = [
  {
    id: "demo-loi-1",
    user_id: "u1",
    pilot_application_id: "p1",
    participant_name: "Lori Chen",
    participant_company: "Swift Transport Logistics",
    participant_title: "VP Operations",
    fleet_size: "501-1500",
    initials: "LC",
    signed_at: "2026-05-04T10:00:00Z",
    loi_version: "1.0",
  },
];

export default function LOIsTab({ isDemo }: { isDemo: boolean }) {
  const [lois, setLois] = useState<LOIRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      if (isDemo) {
        setLois(DEMO_LOIS);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("loi_signatures")
        .select(
          "id, user_id, pilot_application_id, participant_name, participant_company, participant_title, fleet_size, initials, signed_at, loi_version"
        )
        .order("signed_at", { ascending: false });
      if (!error && data) setLois(data as LOIRow[]);
      setLoading(false);
    })();
  }, [isDemo]);

  const filtered = lois.filter((l) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      l.participant_name.toLowerCase().includes(q) ||
      l.participant_company.toLowerCase().includes(q) ||
      l.fleet_size.toLowerCase().includes(q)
    );
  });

  return (
    <Card className="bg-[#0F131C] border-white/10">
      <CardContent className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="font-display font-semibold text-lg flex items-center gap-2">
              <FileSignature size={18} className="text-brand-cyan" /> Signed Letters of Intent
            </h3>
            <p className="text-white/50 text-sm mt-0.5">
              Every LOI signed via the pilot application flow. Click any row to view or download a printable copy.
            </p>
          </div>
          <div className="text-xs text-white/50">
            <span className="text-white font-display text-lg font-bold">{lois.length}</span> total
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
          <Input
            placeholder="Search by name, company, or fleet size"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 text-white"
          />
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="animate-spin text-brand-cyan" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-white/40">
            <FileSignature className="mx-auto mb-3 opacity-50" size={32} />
            {lois.length === 0 ? (
              <>
                <div className="font-medium mb-1">No LOIs signed yet</div>
                <div className="text-xs text-white/30 max-w-md mx-auto">
                  An LOI is captured automatically when a fleet operator submits a pilot application via /apply. Once anyone completes the wizard, their signed LOI will appear here.
                </div>
              </>
            ) : (
              "No LOIs match this search."
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-white/50 border-b border-white/5">
                  <th className="py-3 px-2 font-medium">Participant</th>
                  <th className="py-3 px-2 font-medium">Company</th>
                  <th className="py-3 px-2 font-medium">Fleet</th>
                  <th className="py-3 px-2 font-medium">Signed</th>
                  <th className="py-3 px-2 font-medium">Version</th>
                  <th className="py-3 px-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="py-3 px-2">
                      <div className="font-medium">{l.participant_name}</div>
                      {l.participant_title && (
                        <div className="text-white/40 text-xs">{l.participant_title}</div>
                      )}
                      <div className="text-white/30 text-[11px] font-mono mt-0.5">/s/ {l.initials}</div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="font-medium">{l.participant_company}</div>
                    </td>
                    <td className="py-3 px-2 text-white/70">{l.fleet_size}</td>
                    <td className="py-3 px-2 text-white/60 text-xs whitespace-nowrap">
                      {new Date(l.signed_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                      <div className="text-white/40 text-[10px]">
                        {new Date(l.signed_at).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border border-white/15 text-white/60">
                        v{l.loi_version}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right whitespace-nowrap">
                      <Button asChild size="sm" variant="ghost" className="text-brand-cyan hover:bg-white/5">
                        <Link to={`/loi/${l.id}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink size={12} className="mr-1.5" /> View
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 p-4 rounded-lg border border-brand-cyan/15 bg-brand-cyan/5 text-xs text-white/60 leading-relaxed">
          <strong className="text-brand-cyan">LOIs are immutable.</strong> Once signed, a record cannot be edited
          or deleted from the admin portal. The DB has no UPDATE/DELETE policy on this table. To revise a customer's
          LOI, send them a new invitation with updated terms; they'll sign a new version while the old one remains in
          the audit trail.
        </div>
      </CardContent>
    </Card>
  );
}
