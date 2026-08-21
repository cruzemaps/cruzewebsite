import { useEffect, useMemo, useRef, useState } from "react";
import MarketingLayout from "@/components/marketing/MarketingLayout";
import SEO from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Check,
  Loader2,
  Timer,
  FormInput,
  PenLine,
  Shield,
  FileX,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { track } from "@/lib/analytics";
import {
  LOI_VERSION,
  PERFORMANCE_FEE_MIN_PCT,
  PERFORMANCE_FEE_MAX_PCT,
  LOI_SUMMARY_BULLETS,
  renderLOIText,
  suggestInitials,
} from "@/lib/loi";
import { pilotInsertFromWizard, TERMINAL_PILOT_STATUSES } from "@/lib/pilotApplication";
import {
  clearAllDrafts,
  loadWizardDraft,
  saveSessionDraft,
  scheduleDraftPersist,
  type WizardDraft,
} from "@/lib/applyDraft";

type WizardData = WizardDraft;

const APPLY_PROCESS_FEATURES = [
  {
    icon: Timer,
    title: "30-Second Setup",
    body: "Complete your entire application on one short screen.",
  },
  {
    icon: FormInput,
    title: "One-Page Form",
    body: "Just your name, company, email, phone, and fleet size.",
  },
  {
    icon: PenLine,
    title: "Instant E-Signing",
    body: 'Check "I Agree" to execute your LOI immediately.',
  },
  {
    icon: Shield,
    title: "Corporate Protection",
    body: "Automatically signs under your company name to protect personal assets.",
  },
  {
    icon: FileX,
    title: "Zero Paperwork Hassle",
    body: "Eliminates messy PDFs, printing, and scanning for busy entrepreneurs.",
  },
] as const;

function isNonEmpty(value: string | undefined): boolean {
  return !!value?.trim();
}

function isValidEmail(value: string | undefined): boolean {
  const email = value?.trim() ?? "";
  // Practical check — HTML type=email is UX only; submit must not accept "a@b".
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function formValid(data: WizardData): boolean {
  return (
    isNonEmpty(data.contactName) &&
    isNonEmpty(data.companyName) &&
    isValidEmail(data.contactEmail) &&
    isNonEmpty(data.contactPhone) &&
    isNonEmpty(data.fleetSize) &&
    !!data.loiAgreed
  );
}

export default function Apply() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [showFullLOI, setShowFullLOI] = useState(false);
  const submitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedRef = useRef(false);

  const [data, setData] = useState<WizardData>({
    companyName: "",
    website: "",
    fleetSize: "",
    truckSize: "",
    primaryLanes: "",
    fmsProvider: "",
    fmsOther: "",
    contactEmail: user?.email || "",
    contactName: "",
    contactPhone: "",
    contactTitle: "",
    notes: "",
    loiAgreed: false,
    loiInitials: "",
  });

  // Restore session + DB drafts (Apply → Login → resume).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const restored = await loadWizardDraft(user?.id, user?.email ?? undefined);
      if (cancelled) return;
      setData(restored);
      if (user && isNonEmpty(restored.contactName) && isNonEmpty(restored.companyName)) {
        toast.success("We restored your answers. Check the box and submit to finish.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.email]);

  // Clear any pending submit timer on unmount so navigating away during
  // the success animation doesn't navigate us back unexpectedly. (Audit #17)
  useEffect(() => {
    return () => {
      if (submitTimerRef.current) clearTimeout(submitTimerRef.current);
    };
  }, []);

  const update = <K extends keyof WizardData>(key: K, value: WizardData[K]) => {
    if (!startedRef.current) {
      startedRef.current = true;
      track("application_started", { fleet_size: data.fleetSize });
    }
    setData((prev) => {
      let next: WizardData = { ...prev, [key]: value };
      // Editing LOI-material fields invalidates a prior agree — the signed
      // text would no longer match what they checked.
      const loiMaterial: (keyof WizardData)[] = ["contactName", "companyName", "fleetSize"];
      if (loiMaterial.includes(key) && prev.loiAgreed) {
        next = { ...next, loiAgreed: false };
      }
      scheduleDraftPersist(user?.id, next);
      return next;
    });
  };

  const signedDate = useMemo(
    () => new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    []
  );

  const initials = useMemo(() => suggestInitials(data.contactName) || "—", [data.contactName]);

  const fullLOIText = useMemo(
    () =>
      renderLOIText({
        participantName: data.contactName.trim() || "[your name]",
        participantCompany: data.companyName.trim() || "[your company]",
        fleetSize: data.fleetSize || "[fleet size]",
        signedDate,
        initials,
      }),
    [data.contactName, data.companyName, data.fleetSize, signedDate, initials]
  );

  const submit = async () => {
    if (!formValid(data)) {
      toast.error("Please fill every field and check the agreement box.");
      return;
    }
    setSubmitting(true);

    if (!user) {
      saveSessionDraft(data);
      navigate("/login?role=fleet_owner&apply=1");
      setSubmitting(false);
      return;
    }

    const { data: existing } = await supabase
      .from("pilot_applications")
      .select("id, status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing && !(TERMINAL_PILOT_STATUSES as readonly string[]).includes(existing.status)) {
      setSubmitting(false);
      toast.error("You already have an application in progress.", {
        action: { label: "View dashboard", onClick: () => navigate("/fleet-dashboard") },
      });
      return;
    }

    const { data: pilotRow, error: pilotErr } = await supabase
      .from("pilot_applications")
      .insert(pilotInsertFromWizard(user.id, data))
      .select("id")
      .single();

    if (pilotErr) {
      setSubmitting(false);
      const dup =
        pilotErr.message.includes("pilot_applications_one_active_per_user") ||
        pilotErr.code === "23505";
      if (dup) {
        toast.error("You already have an active application.", {
          action: { label: "View dashboard", onClick: () => navigate("/fleet-dashboard") },
        });
      } else {
        toast.error(pilotErr.message);
      }
      return;
    }

    const contactName = data.contactName.trim();
    const companyName = data.companyName.trim();
    const signedInitials = suggestInitials(contactName);
    const loiFullText = renderLOIText({
      participantName: contactName,
      participantCompany: companyName,
      fleetSize: data.fleetSize,
      signedDate,
      initials: signedInitials,
    });

    const { data: loiRow, error: loiErr } = await supabase
      .from("loi_signatures")
      .insert({
        user_id: user.id,
        pilot_application_id: pilotRow?.id ?? null,
        participant_name: contactName,
        participant_company: companyName,
        participant_title: null,
        contact_email: data.contactEmail.trim(),
        fleet_size: data.fleetSize,
        agreed: true,
        initials: signedInitials,
        loi_version: LOI_VERSION,
        loi_full_text: loiFullText,
        performance_fee_min_pct: PERFORMANCE_FEE_MIN_PCT,
        performance_fee_max_pct: PERFORMANCE_FEE_MAX_PCT,
        user_agent: navigator.userAgent,
      })
      .select("id")
      .single();

    if (loiErr) {
      // Roll back the pilot row so we don't leave an orphan. fleet_owner has
      // no DELETE policy on pilot_applications, so use the SECURITY DEFINER
      // rollback_unsigned_pilot RPC (owner-scoped, refuses if an LOI exists).
      if (pilotRow?.id) {
        try {
          await supabase.rpc("rollback_unsigned_pilot", { p_id: pilotRow.id });
        } catch (rollbackErr) {
          console.error("Pilot rollback failed:", rollbackErr);
        }
      }
      setSubmitting(false);
      toast.error("Couldn't sign the LOI: " + loiErr.message + ". Your application was rolled back; please try again.");
      return;
    }

    if (loiRow?.id) {
      supabase.functions
        .invoke("capture-loi-metadata", {
          body: { loi_id: loiRow.id, user_agent: navigator.userAgent },
        })
        .catch((err) => console.warn("LOI metadata capture:", err));
    }

    await clearAllDrafts();

    setSubmitting(false);
    track("application_submitted", { fleet_size: data.fleetSize, fms: data.fmsProvider, loi_signed: true });
    setDone(true);
    submitTimerRef.current = setTimeout(() => navigate("/fleet-dashboard"), 1800);
  };

  return (
    <MarketingLayout>
      <SEO />
      <section className="container mx-auto px-6 py-16 max-w-2xl">
        {!done && (
          <>
            <h1 className="font-display text-3xl md:text-5xl font-bold mb-2">Apply for the Cruze pilot.</h1>
            <p className="text-white/60 mb-8">
              One short form, done in 30 seconds. Check I Agree to e-sign your non-binding LOI. We'll respond within
              two business days with a calibrated 30-day pilot proposal.
            </p>

            <Card className="bg-[#0F131C] border-white/10">
              <CardContent className="p-8 space-y-5">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white/70 text-sm mb-1 block">Your name *</Label>
                    <Input
                      value={data.contactName}
                      onChange={(e) => update("contactName", e.target.value)}
                      placeholder="Full name (used on your LOI)"
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white/70 text-sm mb-1 block">Company name *</Label>
                    <Input
                      value={data.companyName}
                      onChange={(e) => update("companyName", e.target.value)}
                      placeholder="Swift Transport Logistics"
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white/70 text-sm mb-1 block">Work email *</Label>
                    <Input
                      type="email"
                      value={data.contactEmail}
                      onChange={(e) => update("contactEmail", e.target.value)}
                      placeholder="you@company.com"
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white/70 text-sm mb-1 block">Phone *</Label>
                    <Input
                      type="tel"
                      value={data.contactPhone}
                      onChange={(e) => update("contactPhone", e.target.value)}
                      placeholder="(210) 555-0100"
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-white/70 text-sm mb-1 block">How many trucks? *</Label>
                  <Select value={data.fleetSize} onValueChange={(v) => update("fleetSize", v)}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Fleet size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-25">1–25 trucks</SelectItem>
                      <SelectItem value="26-100">26–100 trucks</SelectItem>
                      <SelectItem value="101-500">101–500 trucks</SelectItem>
                      <SelectItem value="501-1500">501–1,500 trucks</SelectItem>
                      <SelectItem value="1500+">1,500+ trucks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* LOI agreement */}
                <div className="rounded-xl border border-brand-cyan/25 bg-brand-cyan/5 p-5 space-y-4">
                  <div className="text-[11px] uppercase tracking-widest text-brand-cyan font-semibold">
                    Your Letter of Intent — the plain-English version
                  </div>
                  <ul className="space-y-2">
                    {LOI_SUMMARY_BULLETS.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-sm text-white/80 leading-relaxed">
                        <Check size={14} className="text-brand-cyan flex-shrink-0 mt-1" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() => setShowFullLOI((v) => !v)}
                    className="inline-flex items-center gap-1.5 text-xs text-brand-cyan hover:underline"
                  >
                    {showFullLOI ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    {showFullLOI ? "Hide the full LOI text" : "Read the full LOI text"}
                  </button>

                  {showFullLOI && (
                    <div className="rounded-lg border border-white/10 bg-[#0B0E14] px-4 py-3 max-h-72 overflow-y-auto">
                      <pre className="text-xs text-white/80 leading-relaxed whitespace-pre-wrap font-sans">{fullLOIText}</pre>
                    </div>
                  )}

                  <label className="flex items-start gap-3 cursor-pointer">
                    <Checkbox
                      checked={data.loiAgreed}
                      onCheckedChange={(v) => update("loiAgreed", !!v)}
                      className="mt-0.5 border-white/30 data-[state=checked]:bg-brand-orange data-[state=checked]:text-[#0B0E14] data-[state=checked]:border-brand-orange"
                    />
                    <span className="text-sm text-white/85 leading-relaxed">
                      <span className="font-semibold text-white">I Agree</span>
                      {" "}— I accept the Letter of Intent and terms above on behalf of{" "}
                      <span className="text-brand-cyan">{data.companyName.trim() || "my company"}</span>. This is a
                      30-day <span className="font-semibold text-white">non-binding</span> pilot with a{" "}
                      {PERFORMANCE_FEE_MIN_PCT}–{PERFORMANCE_FEE_MAX_PCT}% performance fee only on documented savings.
                      My initials ({initials}) are applied as my electronic signature, timestamped {signedDate}.
                    </span>
                  </label>
                </div>

                <Button
                  onClick={submit}
                  disabled={submitting || !formValid(data)}
                  className="w-full bg-brand-orange text-[#0B0E14] hover:bg-brand-orange/90 font-bold h-12 text-base"
                >
                  {submitting && <Loader2 className="animate-spin mr-2" size={16} />}
                  Sign &amp; submit
                </Button>
                <p className="text-xs text-white/40 text-center">
                  No printing, no scanning. A copy of your signed LOI is available from your dashboard.
                </p>
              </CardContent>
            </Card>

            {/* Why it's fast + pilot context, below the form */}
            <div className="mt-8 rounded-xl border border-brand-cyan/20 bg-brand-cyan/5 p-5">
              <div className="text-[11px] uppercase tracking-widest text-brand-cyan font-semibold mb-4">
                Why applying takes under a minute
              </div>
              <ul className="space-y-3.5">
                {APPLY_PROCESS_FEATURES.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <li key={feature.title} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-cyan/10 text-brand-cyan">
                        <Icon size={15} />
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-white">{feature.title}</div>
                        <p className="text-sm text-white/60 leading-relaxed mt-0.5">{feature.body}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="mt-6 rounded-xl border border-brand-orange/20 bg-gradient-to-br from-brand-orange/10 to-transparent p-5">
              <div className="text-[11px] uppercase tracking-widest text-brand-orange font-semibold mb-3">
                About the Cruze pilot
              </div>
              <p className="text-white/80 text-sm leading-relaxed mb-4">
                Cruze coordinates speeds across your drivers and the swarm around them, dissolving phantom traffic
                jams before they form. The 30-day pilot is software-only (no hardware to install) and zero upfront cost.
              </p>
              <div className="grid sm:grid-cols-3 gap-3 text-xs">
                <div className="rounded-lg bg-white/5 p-3">
                  <div className="font-display text-2xl font-bold text-brand-orange">8 to 14%</div>
                  <div className="text-white/60 mt-1">fuel reduction in pilots</div>
                </div>
                <div className="rounded-lg bg-white/5 p-3">
                  <div className="font-display text-2xl font-bold text-brand-cyan">1 to 2 hrs</div>
                  <div className="text-white/60 mt-1">reclaimed per driver per week</div>
                </div>
                <div className="rounded-lg bg-white/5 p-3">
                  <div className="font-display text-2xl font-bold text-white">$0</div>
                  <div className="text-white/60 mt-1">upfront, only pay on documented savings</div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-xs">
                <a href="/for-fleets" target="_blank" rel="noopener noreferrer" className="text-brand-orange hover:underline">
                  See the full fleet pitch →
                </a>
                <a href="/faq" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:underline">
                  FAQ →
                </a>
              </div>
            </div>
          </>
        )}

        {done && (
          <Card className="bg-[#0F131C] border-brand-cyan/30">
            <CardContent className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-cyan/15 text-brand-cyan mb-4">
                <Check size={32} />
              </div>
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">Application submitted.</h2>
              <p className="text-white/60">We'll be in touch within 2 business days. Routing you to your dashboard…</p>
            </CardContent>
          </Card>
        )}
      </section>
    </MarketingLayout>
  );
}
