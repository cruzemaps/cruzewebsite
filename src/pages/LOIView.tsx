import { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Loader2, Download, ArrowLeft, Printer, Plus, FileEdit, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SEO from "@/components/SEO";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// /loi/:id renders a signed LOI as a printable, paper-styled page.
// Users hit "Download PDF" → opens browser print dialog → save as PDF.
// Modern browsers do this natively, no extra library needed.
//
// Access:
//   - User can view their own signed LOI (RLS enforced by Supabase)
//   - Admin can view any signed LOI AND record amendments
//
// Amendments append to loi_amendments without mutating the original LOI.
// They render below the signature panel as an "Amendments" section.

interface LOISig {
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
  loi_full_text: string;
  performance_fee_min_pct: number;
  performance_fee_max_pct: number;
  user_agent: string | null;
}

interface Amendment {
  id: string;
  loi_signature_id: string;
  field: string;
  previous_value: string | null;
  new_value: string;
  reason: string;
  amended_by: string;
  amended_at: string;
}

// Fields admins commonly need to amend. They can also type a custom one.
const COMMON_FIELDS = [
  "Company name",
  "Participant name",
  "Title",
  "Fleet size",
  "Performance fee bracket",
  "Pilot start date",
  "Telematics access scope",
  "Other clarification",
];

export default function LOIView() {
  const { id } = useParams<{ id: string }>();
  const { user, role, loading: authLoading } = useAuth();
  const [loi, setLoi] = useState<LOISig | null>(null);
  const [amendments, setAmendments] = useState<Amendment[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [amendOpen, setAmendOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveReason, setArchiveReason] = useState("");
  const [archiving, setArchiving] = useState(false);

  const isAdmin = role === "admin";

  const reloadAmendments = async () => {
    if (!id) return;
    // Audit #31: surface amendment-load errors instead of swallowing them.
    // Otherwise an admin could record an amendment, see no error, and not
    // realize their list view is stale because the reload silently failed.
    const { data, error } = await supabase
      .from("loi_amendments")
      .select("*")
      .eq("loi_signature_id", id)
      .order("amended_at", { ascending: true });
    if (error) {
      toast.error(`Couldn't reload amendments: ${error.message}`);
      return;
    }
    if (data) setAmendments(data as Amendment[]);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!id) {
      setNotFound(true);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("loi_signatures")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setLoi(data as LOISig);
      await reloadAmendments();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-brand-cyan" />
      </div>
    );
  }
  if (!user) return <Navigate to={`/login?next=/loi/${id}`} replace />;
  // Audit #12: admins land on /admin (not /fleet-dashboard) when the LOI
  // can't be found — they don't have a fleet dashboard, so the previous
  // redirect would bounce them back through ProtectedRoute anyway.
  if (notFound || !loi) {
    return <Navigate to={isAdmin ? "/admin" : "/fleet-dashboard"} replace />;
  }

  const signedDate = new Date(loi.signed_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const signedTime = new Date(loi.signed_at).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

  return (
    <>
      <SEO title="Signed LOI | Cruze" noindex />

      {/* Print-only styles. The screen view shows on the dark site shell;
          when the user prints, only the white paper renders. */}
      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .loi-paper {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 1in !important;
            max-width: none !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-[#0B0E14]">
        {/* Toolbar (hidden on print) */}
        <div className="no-print sticky top-0 z-50 border-b border-white/10 bg-[#0B0E14]/95 backdrop-blur">
          <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
            <Link to="/fleet-dashboard" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm">
              <ArrowLeft size={16} /> Back to dashboard
            </Link>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setAmendOpen(true)}
                    className="border-brand-orange/30 text-brand-orange hover:bg-brand-orange/10"
                  >
                    <Plus size={14} className="mr-2" /> Add amendment
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setArchiveReason("");
                      setArchiveOpen(true);
                    }}
                    className="border-white/15 text-white/70 hover:bg-white/5"
                  >
                    <Archive size={14} className="mr-2" /> Archive
                  </Button>
                </>
              )}
              <Button
                onClick={() => window.print()}
                className="bg-brand-cyan text-[#0B0E14] hover:bg-brand-cyan/90"
              >
                <Download size={14} className="mr-2" /> Download PDF
              </Button>
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="border-white/20 text-white hover:bg-white/5"
              >
                <Printer size={14} className="mr-2" /> Print
              </Button>
            </div>
          </div>
        </div>

        {/* Paper */}
        <div className="max-w-4xl mx-auto px-6 py-10 print:p-0 print:max-w-none">
          <div className="loi-paper bg-white text-gray-900 rounded-md shadow-2xl print:rounded-none print:shadow-none mx-auto" style={{ maxWidth: "8.5in", padding: "0.75in 1in" }}>
            {/* Header (logo + title) */}
            <div className="flex items-start justify-between mb-8 pb-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Cruze" className="w-12 h-12" />
                <div>
                  <div className="font-bold tracking-widest text-sm text-gray-900">CRUZE</div>
                  <div className="text-xs text-gray-500 mt-0.5">Cruzemaps · Austin, TX</div>
                </div>
              </div>
              <div className="text-right text-xs text-gray-500">
                <div>LOI version {loi.loi_version}</div>
                <div className="mt-0.5 font-mono">#{loi.id.slice(0, 8)}</div>
                {amendments.length > 0 && (
                  <div className="mt-1 inline-block px-2 py-0.5 rounded-full border border-amber-300 bg-amber-50 text-amber-800">
                    {amendments.length} amendment{amendments.length === 1 ? "" : "s"}
                  </div>
                )}
              </div>
            </div>

            {/* The LOI body — preserved verbatim from when they signed */}
            <pre
              className="whitespace-pre-wrap font-serif text-[13.5px] leading-[1.65] text-gray-800"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              {loi.loi_full_text}
            </pre>

            {/* Signature panel */}
            <div className="mt-10 pt-6 border-t-2 border-gray-300 grid sm:grid-cols-2 gap-8">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-semibold">Participant Signature</div>
                <div className="font-serif italic text-2xl text-gray-900 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                  /s/ {loi.initials}
                </div>
                <div className="text-sm text-gray-700">{loi.participant_name}</div>
                {loi.participant_title && <div className="text-sm text-gray-600">{loi.participant_title}</div>}
                <div className="text-sm text-gray-600">{loi.participant_company}</div>
                <div className="text-xs text-gray-500 mt-2">
                  Signed electronically on {signedDate} at {signedTime}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-semibold">For Cruze</div>
                <div className="font-serif italic text-2xl text-gray-900 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                  /s/ AB
                </div>
                <div className="text-sm text-gray-700">Anudeep Bonagiri</div>
                <div className="text-sm text-gray-600">Founder, Cruzemaps</div>
                <div className="text-sm text-gray-600">Austin, Texas</div>
              </div>
            </div>

            {/* Amendments — append-only ledger, renders below the signature.
                The original LOI text above is unmodified; amendments listed
                here clarify or correct fields after signing. */}
            {amendments.length > 0 && (
              <div className="mt-10 pt-6 border-t border-gray-300">
                <div className="flex items-center gap-2 mb-1">
                  <FileEdit size={14} className="text-amber-700" />
                  <h3 className="text-sm font-bold tracking-widest uppercase text-amber-800">
                    Amendments
                  </h3>
                </div>
                <p className="text-xs text-gray-500 mb-5">
                  The following changes were recorded after signing. The original signed text above remains unchanged.
                  Amendments are listed in the order they were applied.
                </p>
                <ol className="space-y-4">
                  {amendments.map((a, i) => (
                    <li key={a.id} className="rounded-md border border-amber-200 bg-amber-50/40 p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="text-sm font-semibold text-gray-900">
                          Amendment {i + 1}: <span className="text-amber-800">{a.field}</span>
                        </div>
                        <div className="text-[11px] text-gray-500 whitespace-nowrap">
                          {new Date(a.amended_at).toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                        </div>
                      </div>
                      {a.previous_value && (
                        <div className="text-[13px] text-gray-700 mb-1">
                          <span className="text-gray-500">Was:</span> <span className="line-through">{a.previous_value}</span>
                        </div>
                      )}
                      <div className="text-[13px] text-gray-900 mb-2">
                        <span className="text-gray-500">Now:</span> <strong>{a.new_value}</strong>
                      </div>
                      <div className="text-[12px] text-gray-600 italic border-t border-amber-100 pt-2">
                        Reason: {a.reason}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-2 font-mono">
                        Recorded by admin {a.amended_by.slice(0, 8)}… · amendment ID {a.id.slice(0, 8)}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Audit footer */}
            <div className="mt-10 pt-4 border-t border-gray-200 text-[10px] text-gray-400 leading-relaxed">
              <div>
                Electronic signature audit: signature ID <span className="font-mono">{loi.id}</span> ·
                {" "}signed by user <span className="font-mono">{loi.user_id.slice(0, 8)}…</span>
                {loi.user_agent && <> · agent: <span className="font-mono">{loi.user_agent.slice(0, 60)}…</span></>}
              </div>
              <div className="mt-1">
                This document is the binding text of what was electronically agreed to. Cruze retains an immutable copy.
                {amendments.length > 0 && " Amendments recorded after signing are listed above and do not alter the original signed text."}
              </div>
            </div>
          </div>
        </div>

        {amendOpen && user && (
          <AmendmentDialog
            loi={loi}
            onClose={() => setAmendOpen(false)}
            onAdded={async () => {
              setAmendOpen(false);
              await reloadAmendments();
              toast.success("Amendment recorded.");
            }}
          />
        )}

        {/* Archive dialog (audit #13) — replaces the bare browser prompt() */}
        <Dialog open={archiveOpen} onOpenChange={(o) => {
          // 2nd-pass audit #8: clear the typed reason on any close path
          // (backdrop, Esc, Cancel) so a half-typed reason can never be
          // submitted against an LOI viewed later in the same session.
          if (archiving) return;
          if (!o) setArchiveReason("");
          setArchiveOpen(o);
        }}>
          <DialogContent className="bg-[#0B0E14] border-white/10 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display flex items-center gap-2">
                <Archive size={18} /> Archive this LOI
              </DialogTitle>
              <DialogDescription className="text-white/50">
                Archived LOIs are removed from the live LOIs list and surface in the Archive Library. The original
                signed text and audit trail are preserved.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label className="text-white/70 text-sm">Reason for archive (required, 3+ characters)</Label>
              <Textarea
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value)}
                rows={3}
                placeholder="e.g. Superseded by amended LOI v1.1"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setArchiveOpen(false)} disabled={archiving}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  const reason = archiveReason.trim();
                  if (reason.length < 3) {
                    toast.error("Please give a reason (3+ characters).");
                    return;
                  }
                  setArchiving(true);
                  const { error } = await supabase.rpc("archive_loi", {
                    p_loi_id: loi.id,
                    p_reason: reason,
                  });
                  setArchiving(false);
                  if (error) {
                    toast.error(error.message);
                    return;
                  }
                  setArchiveOpen(false);
                  toast.success("LOI archived. Find it in the Archive Library.");
                  // Use react-router instead of full page reload would lose
                  // the LOI page mid-archive; admin lands on the portal.
                  window.location.href = "/admin";
                }}
                disabled={archiving || archiveReason.trim().length < 3}
                className="bg-brand-orange text-[#0B0E14] hover:bg-brand-orange/90 font-bold"
              >
                {archiving && <Loader2 className="animate-spin mr-2" size={14} />} Archive LOI
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

function AmendmentDialog({
  loi,
  onClose,
  onAdded,
}: {
  loi: LOISig;
  onClose: () => void;
  onAdded: () => void;
}) {
  // Audit #37: read the admin ID from useAuth directly instead of plumbing
  // it down as a prop. The Supabase trigger enforces amended_by = auth.uid()
  // anyway, so the parent's prop drilling was redundant.
  const { user } = useAuth();
  const [field, setField] = useState<string>("");
  const [customField, setCustomField] = useState("");
  const [previousValue, setPreviousValue] = useState("");
  const [newValue, setNewValue] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  // Pre-fill previous_value when a known field is selected
  const handleFieldChange = (f: string) => {
    setField(f);
    if (f === "Company name") setPreviousValue(loi.participant_company);
    else if (f === "Participant name") setPreviousValue(loi.participant_name);
    else if (f === "Title") setPreviousValue(loi.participant_title || "(none)");
    else if (f === "Fleet size") setPreviousValue(loi.fleet_size);
    else if (f === "Performance fee bracket") setPreviousValue(`${loi.performance_fee_min_pct}–${loi.performance_fee_max_pct}%`);
    else setPreviousValue("");
  };

  const submit = async () => {
    if (!user) return toast.error("Not signed in.");
    const finalField = field === "Other clarification" ? customField : field;
    if (!finalField || finalField.length < 2) return toast.error("Pick or type the field being amended.");
    if (!newValue.trim()) return toast.error("Enter the new value.");
    if (reason.trim().length < 5) return toast.error("Reason is required (5+ characters).");

    setBusy(true);
    const { error } = await supabase.from("loi_amendments").insert({
      loi_signature_id: loi.id,
      field: finalField,
      previous_value: previousValue || null,
      new_value: newValue,
      reason,
      amended_by: user.id,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    onAdded();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-[#0B0E14] border-white/10 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <FileEdit size={18} /> Add amendment
          </DialogTitle>
          <DialogDescription className="text-white/50">
            The original signed LOI text stays unchanged. Amendments are added as a separate, append-only record below the signature.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label className="text-white/70 text-sm mb-2 block">Which field is being amended?</Label>
            <div className="grid grid-cols-2 gap-2">
              {COMMON_FIELDS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => handleFieldChange(f)}
                  className={`text-left text-xs px-3 py-2 rounded-md border transition-colors ${
                    field === f
                      ? "border-brand-orange/60 bg-brand-orange/10 text-brand-orange"
                      : "border-white/10 bg-white/5 text-white/70 hover:border-white/20"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            {field === "Other clarification" && (
              <Input
                value={customField}
                onChange={(e) => setCustomField(e.target.value.slice(0, 60))}
                placeholder="Describe the field (e.g. 'Pilot start date')"
                className="bg-white/5 border-white/10 text-white mt-3"
              />
            )}
          </div>

          {field && field !== "Other clarification" && (
            <div>
              <Label className="text-white/70 text-sm mb-2 block">Previous value (auto-filled, edit if needed)</Label>
              <Input
                value={previousValue}
                onChange={(e) => setPreviousValue(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          )}

          {field === "Other clarification" && (
            <div>
              <Label className="text-white/70 text-sm mb-2 block">Previous value (optional)</Label>
              <Input
                value={previousValue}
                onChange={(e) => setPreviousValue(e.target.value)}
                placeholder="What it was before, if applicable"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          )}

          <div>
            <Label className="text-white/70 text-sm mb-2 block">New value *</Label>
            <Input
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="What it is now"
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div>
            <Label className="text-white/70 text-sm mb-2 block">Reason for amendment *</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="e.g. Customer reported the company name was misspelled at signing — confirmed correct legal name via email."
              className="bg-white/5 border-white/10 text-white"
            />
            <p className="text-[11px] text-white/40 mt-1">
              The reason shows up in the LOI's amendments section and is part of the permanent audit trail.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            onClick={submit}
            disabled={busy || !field || (field === "Other clarification" && !customField) || !newValue.trim() || reason.trim().length < 5}
            className="bg-brand-orange text-[#0B0E14] hover:bg-brand-orange/90 font-bold"
          >
            {busy && <Loader2 className="animate-spin mr-2" size={14} />} Record amendment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
