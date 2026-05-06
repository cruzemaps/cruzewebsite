import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Building, Truck, FileSignature, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const LIFECYCLE = ["pending", "in_review", "approved", "onboarding", "active", "denied", "archived"] as const;
type LifecycleState = (typeof LIFECYCLE)[number];

type PilotApp = {
  id: string;
  user_id: string;
  company_name: string | null;
  truck_size: string | null;
  fleet_size: string | null;
  status: LifecycleState;
  notes: string | null;
  created_at: string;
};

const DEMO_APPS: PilotApp[] = [
  { id: "p1", user_id: "u1", company_name: "Swift Transport Logistics", truck_size: "Class 8", fleet_size: "1500", status: "pending", notes: null, created_at: "2026-04-30T10:00:00Z" },
  { id: "p2", user_id: "u2", company_name: "National Carrier Partners", truck_size: "Class 6", fleet_size: "350", status: "in_review", notes: "Reference call scheduled.", created_at: "2026-04-22T10:00:00Z" },
  { id: "p3", user_id: "u3", company_name: "Alpha Freight", truck_size: "Class 8", fleet_size: "2000", status: "approved", notes: null, created_at: "2026-04-15T10:00:00Z" },
];

export default function PilotsTab({ isDemo }: { isDemo: boolean }) {
  const [apps, setApps] = useState<PilotApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PilotApp | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelected = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const bulkSetStatus = async (newStatus: LifecycleState) => {
    if (selected.size === 0) return;
    if (!confirm(`Set ${selected.size} pilot applications to "${newStatus}"?`)) return;
    if (isDemo) {
      setApps((prev) => prev.map((a) => (selected.has(a.id) ? { ...a, status: newStatus } : a)));
      setSelected(new Set());
      toast.success(`Demo: ${selected.size} pilots updated.`);
      return;
    }
    const ids = Array.from(selected);
    const { error } = await supabase
      .from("pilot_applications")
      .update({ status: newStatus, reviewed_at: new Date().toISOString() })
      .in("id", ids);
    if (error) return toast.error(error.message);
    setApps((prev) => prev.map((a) => (selected.has(a.id) ? { ...a, status: newStatus } : a)));
    setSelected(new Set());
    toast.success(`${ids.length} pilots → ${newStatus}.`);
  };

  const load = async () => {
    setLoading(true);
    if (isDemo) {
      setApps(DEMO_APPS);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("pilot_applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setApps((data as PilotApp[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [isDemo]);

  return (
    <Card className="bg-[#0F131C] border-white/10">
      <CardContent className="p-6">
        {selected.size > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2 p-3 rounded-lg bg-brand-cyan/10 border border-brand-cyan/30">
            <span className="text-sm text-brand-cyan font-semibold mr-2">{selected.size} selected</span>
            <Button size="sm" variant="ghost" onClick={() => bulkSetStatus("in_review")}>→ in review</Button>
            <Button size="sm" variant="ghost" onClick={() => bulkSetStatus("approved")}>→ approved</Button>
            <Button size="sm" variant="ghost" onClick={() => bulkSetStatus("onboarding")}>→ onboarding</Button>
            <Button size="sm" variant="ghost" onClick={() => bulkSetStatus("denied")}>→ denied</Button>
            <Button size="sm" variant="ghost" onClick={() => bulkSetStatus("archived")}>→ archived</Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())} className="ml-auto text-white/40">Clear</Button>
          </div>
        )}
        {loading ? (
          <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-brand-cyan" /></div>
        ) : apps.length === 0 ? (
          <div className="py-16 text-center text-white/40">No pilot applications yet.</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {apps.map((a) => (
              <div key={a.id} className="rounded-xl border border-white/10 bg-[#0B0E14] p-5 hover:border-brand-cyan/40 transition-colors">
                <div className="flex items-start justify-between mb-3 gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      aria-label={`Select ${a.company_name}`}
                      checked={selected.has(a.id)}
                      onChange={() => toggleSelected(a.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Building size={16} className="text-brand-orange flex-shrink-0" />
                    <button onClick={() => setEditing(a)} className="font-display font-semibold text-left truncate hover:text-brand-cyan">
                      {a.company_name || "(no company)"}
                    </button>
                  </div>
                  <LifecycleBadge state={a.status} />
                </div>
                <button onClick={() => setEditing(a)} className="text-left w-full">
                  <div className="flex flex-wrap gap-3 text-xs text-white/50 mb-3">
                    <span className="inline-flex items-center gap-1"><Truck size={12} /> {a.truck_size || "N/A"}</span>
                    <span>{a.fleet_size ? `${a.fleet_size} vehicles` : "N/A"}</span>
                    <span>· {new Date(a.created_at).toLocaleDateString()}</span>
                  </div>
                  {a.notes && <p className="text-white/60 text-sm line-clamp-2">{a.notes}</p>}
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {editing && (
        <ManagePilotDialog
          app={editing}
          isDemo={isDemo}
          onClose={() => setEditing(null)}
          onUpdated={(a) => {
            setApps((prev) => prev.map((p) => (p.id === a.id ? a : p)));
            setEditing(null);
          }}
        />
      )}
    </Card>
  );
}

function LifecycleBadge({ state }: { state: LifecycleState }) {
  const map: Record<LifecycleState, string> = {
    pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    in_review: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    approved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    onboarding: "bg-brand-cyan/15 text-brand-cyan border-brand-cyan/30",
    active: "bg-emerald-500/25 text-emerald-300 border-emerald-500/40",
    denied: "bg-red-500/15 text-red-400 border-red-500/30",
    archived: "bg-white/10 text-white/40 border-white/20",
  };
  return <span className={`text-xs px-2 py-1 rounded-full border ${map[state]}`}>{state.replace("_", " ")}</span>;
}

function ManagePilotDialog({
  app,
  isDemo,
  onClose,
  onUpdated,
}: {
  app: PilotApp;
  isDemo: boolean;
  onClose: () => void;
  onUpdated: (a: PilotApp) => void;
}) {
  const [status, setStatus] = useState<LifecycleState>(app.status);
  const [notes, setNotes] = useState(app.notes || "");
  const [busy, setBusy] = useState(false);
  const [loi, setLoi] = useState<{ id: string; signed_at: string; initials: string; participant_name: string } | null>(null);

  // Look up the signed LOI tied to this pilot application (if any)
  useEffect(() => {
    if (isDemo) return;
    (async () => {
      const { data } = await supabase
        .from("loi_signatures")
        .select("id, signed_at, initials, participant_name")
        .eq("pilot_application_id", app.id)
        .order("signed_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setLoi(data as typeof loi extends null ? never : any);
    })();
  }, [app.id, isDemo]);

  const save = async () => {
    setBusy(true);
    if (isDemo) {
      onUpdated({ ...app, status, notes });
      toast.success("Demo: pilot updated locally.");
      setBusy(false);
      return;
    }
    const { error } = await supabase
      .from("pilot_applications")
      .update({ status, notes, reviewed_at: new Date().toISOString() })
      .eq("id", app.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Pilot updated.");
    onUpdated({ ...app, status, notes });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-[#0B0E14] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="font-display">{app.company_name || "Pilot application"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label className="text-white/70 text-sm mb-2 block">Lifecycle stage</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as LifecycleState)}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                {LIFECYCLE.map((s) => (
                  <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-white/70 text-sm mb-2 block">Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
              rows={4}
              placeholder="Disposition, next steps, integration timeline…"
            />
          </div>

          {loi && (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 flex items-center gap-3">
              <FileSignature size={18} className="text-brand-cyan flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">Signed Letter of Intent</div>
                <div className="text-xs text-white/50 mt-0.5">
                  Signed by {loi.participant_name} ({loi.initials}) on{" "}
                  {new Date(loi.signed_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                </div>
              </div>
              <Button asChild size="sm" variant="outline" className="border-white/15 text-white hover:bg-white/5">
                <Link to={`/loi/${loi.id}`} target="_blank" rel="noopener noreferrer">
                  View <ExternalLink size={12} className="ml-1.5" />
                </Link>
              </Button>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={busy} className="bg-brand-cyan text-[#0B0E14] hover:bg-brand-cyan/90">
            {busy ? <Loader2 className="animate-spin mr-2" size={14} /> : null} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
