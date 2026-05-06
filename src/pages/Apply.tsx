import { useEffect, useMemo, useState } from "react";
import MarketingLayout from "@/components/marketing/MarketingLayout";
import SEO from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Building, Truck, Cable, User, Check, Loader2, FileSignature, Download } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
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

type WizardData = {
  companyName: string;
  website: string;
  fleetSize: string;
  truckSize: string;
  primaryLanes: string;
  fmsProvider: string;
  contactEmail: string;
  contactName: string;
  contactPhone: string;
  contactTitle: string;
  notes: string;
  // LOI
  loiAgreed: boolean;
  loiInitials: string;
};

const STEPS = [
  { key: "company", label: "Company", icon: Building },
  { key: "fleet", label: "Fleet specs", icon: Truck },
  { key: "integration", label: "Integration", icon: Cable },
  { key: "contact", label: "Contact", icon: User },
  { key: "loi", label: "Sign LOI", icon: FileSignature },
] as const;

export default function Apply() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [data, setData] = useState<WizardData>({
    companyName: "",
    website: "",
    fleetSize: "",
    truckSize: "",
    primaryLanes: "",
    fmsProvider: "",
    contactEmail: user?.email || "",
    contactName: "",
    contactPhone: "",
    contactTitle: "",
    notes: "",
    loiAgreed: false,
    loiInitials: "",
  });

  // Auto-suggest initials from contactName when LOI step opens, but let
  // the user override.
  useEffect(() => {
    if (step === 4 && !data.loiInitials && data.contactName) {
      setData((prev) => ({ ...prev, loiInitials: suggestInitials(data.contactName) }));
    }
  }, [step, data.contactName, data.loiInitials]);

  const update = <K extends keyof WizardData>(key: K, value: WizardData[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const advance = () => {
    if (step === 0) track("application_started", { fleet_size: data.fleetSize });
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const submit = async () => {
    // Re-validate every step before submission, not just the final step.
    // Without this, a user could fill steps 0+3, skip 1+2 via keyboard
    // navigation, and submit a row with NULL company_name/fleet_size.
    for (let i = 0; i < STEPS.length; i++) {
      if (!stepValid(i, data)) {
        setStep(i);
        return toast.error(`Please complete step ${i + 1}: ${STEPS[i].label}`);
      }
    }
    setSubmitting(true);

    if (!user) {
      // Not signed in: park the form so we can resume after signup.
      sessionStorage.setItem("pending_application", JSON.stringify(data));
      navigate("/login?role=fleet_owner&apply=1");
      setSubmitting(false);
      return;
    }

    // 1. Insert pilot_applications row first; capture id so we can link the LOI to it.
    const { data: pilotRow, error: pilotErr } = await supabase
      .from("pilot_applications")
      .insert({
        user_id: user.id,
        company_name: data.companyName,
        truck_size: data.truckSize,
        fleet_size: data.fleetSize,
        notes: [
          data.website && `Website: ${data.website}`,
          data.primaryLanes && `Primary lanes: ${data.primaryLanes}`,
          data.fmsProvider && `FMS provider: ${data.fmsProvider}`,
          data.contactName && `Contact: ${data.contactName}`,
          data.contactTitle && `Title: ${data.contactTitle}`,
          data.contactPhone && `Phone: ${data.contactPhone}`,
          data.notes && `Notes: ${data.notes}`,
        ].filter(Boolean).join("\n"),
      })
      .select("id")
      .single();

    if (pilotErr) {
      setSubmitting(false);
      return toast.error(pilotErr.message);
    }

    // 2. Snapshot the rendered LOI text and insert the signature row.
    const signedDate = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const loiFullText = renderLOIText({
      participantName: data.contactName,
      participantCompany: data.companyName,
      participantTitle: data.contactTitle || undefined,
      fleetSize: data.fleetSize,
      signedDate,
      initials: data.loiInitials,
    });

    const { error: loiErr } = await supabase.from("loi_signatures").insert({
      user_id: user.id,
      pilot_application_id: pilotRow?.id ?? null,
      participant_name: data.contactName,
      participant_company: data.companyName,
      participant_title: data.contactTitle || null,
      fleet_size: data.fleetSize,
      agreed: true,
      initials: data.loiInitials.trim().toUpperCase(),
      loi_version: LOI_VERSION,
      loi_full_text: loiFullText,
      performance_fee_min_pct: PERFORMANCE_FEE_MIN_PCT,
      performance_fee_max_pct: PERFORMANCE_FEE_MAX_PCT,
      user_agent: navigator.userAgent,
    });

    setSubmitting(false);
    if (loiErr) {
      toast.error("Application saved but the LOI signature failed: " + loiErr.message);
      return;
    }

    track("application_submitted", { fleet_size: data.fleetSize, fms: data.fmsProvider, loi_signed: true });
    setDone(true);
    setTimeout(() => navigate("/fleet-dashboard"), 1800);
  };

  return (
    <MarketingLayout>
      <SEO />
      <section className="container mx-auto px-6 py-16 max-w-3xl">
        {!done && (
          <>
            <h1 className="font-display text-3xl md:text-5xl font-bold mb-2">Apply for the Cruze pilot.</h1>
            <p className="text-white/60 mb-10">
              Four short steps. We'll respond within two business days with a calibrated 30-day pilot proposal.
            </p>

            <Stepper current={step} />

            <Card className="bg-[#0F131C] border-white/10">
              <CardContent className="p-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                  >
                    {step === 0 && <CompanyStep data={data} update={update} />}
                    {step === 1 && <FleetStep data={data} update={update} />}
                    {step === 2 && <IntegrationStep data={data} update={update} />}
                    {step === 3 && <ContactStep data={data} update={update} />}
                    {step === 4 && <LOIStep data={data} update={update} />}
                  </motion.div>
                </AnimatePresence>

                <div className="mt-8 flex justify-between">
                  <Button
                    variant="ghost"
                    disabled={step === 0}
                    onClick={() => setStep((s) => Math.max(0, s - 1))}
                    className="text-white/60"
                  >
                    <ArrowLeft size={14} className="mr-2" /> Back
                  </Button>

                  {step < STEPS.length - 1 ? (
                    <Button
                      onClick={advance}
                      className="bg-brand-cyan text-[#0B0E14] hover:bg-brand-cyan/90"
                      disabled={!stepValid(step, data)}
                    >
                      Next <ArrowRight size={14} className="ml-2" />
                    </Button>
                  ) : (
                    <Button
                      onClick={submit}
                      disabled={submitting || !STEPS.every((_, i) => stepValid(i, data))}
                      className="bg-brand-orange text-[#0B0E14] hover:bg-brand-orange/90 font-bold"
                    >
                      {submitting && <Loader2 className="animate-spin mr-2" size={14} />}
                      Sign &amp; submit
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
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

function stepValid(step: number, data: WizardData): boolean {
  switch (step) {
    case 0: return !!data.companyName;
    case 1: return !!data.fleetSize && !!data.truckSize;
    case 2: return true; // optional
    case 3: return !!data.contactEmail && !!data.contactName;
    case 4: return data.loiAgreed && data.loiInitials.trim().length >= 1;
    default: return false;
  }
}

function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-between mb-8">
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        const active = i === current;
        const done = i < current;
        return (
          <div key={s.key} className="flex-1 flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors
                ${done ? "bg-brand-cyan border-brand-cyan text-[#0B0E14]" :
                  active ? "border-brand-cyan text-brand-cyan" : "border-white/10 text-white/40"}`}>
                {done ? <Check size={16} /> : <Icon size={16} />}
              </div>
              <span className={`mt-2 text-xs ${active ? "text-brand-cyan font-semibold" : "text-white/40"}`}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-3 ${i < current ? "bg-brand-cyan" : "bg-white/10"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function CompanyStep({ data, update }: { data: WizardData; update: <K extends keyof WizardData>(k: K, v: WizardData[K]) => void }) {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-bold mb-4">Tell us about your company</h2>
      <div>
        <Label className="text-white/70 text-sm mb-1 block">Company name *</Label>
        <Input value={data.companyName} onChange={(e) => update("companyName", e.target.value)} placeholder="Swift Transport Logistics" className="bg-white/5 border-white/10 text-white" />
      </div>
      <div>
        <Label className="text-white/70 text-sm mb-1 block">Website</Label>
        <Input value={data.website} onChange={(e) => update("website", e.target.value)} placeholder="https://…" className="bg-white/5 border-white/10 text-white" />
      </div>
    </div>
  );
}

function FleetStep({ data, update }: { data: WizardData; update: <K extends keyof WizardData>(k: K, v: WizardData[K]) => void }) {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-bold mb-4">Fleet specifications</h2>
      <div>
        <Label className="text-white/70 text-sm mb-1 block">Fleet size *</Label>
        <Select value={data.fleetSize} onValueChange={(v) => update("fleetSize", v)}>
          <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue placeholder="How many trucks?" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1-25">1–25 trucks</SelectItem>
            <SelectItem value="26-100">26–100 trucks</SelectItem>
            <SelectItem value="101-500">101–500 trucks</SelectItem>
            <SelectItem value="501-1500">501–1,500 trucks</SelectItem>
            <SelectItem value="1500+">1,500+ trucks</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-white/70 text-sm mb-1 block">Primary truck class *</Label>
        <Select value={data.truckSize} onValueChange={(v) => update("truckSize", v)}>
          <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue placeholder="Class…" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Class 8">Class 8 (heavy tractor)</SelectItem>
            <SelectItem value="Class 6-7">Class 6–7 (medium)</SelectItem>
            <SelectItem value="Class 3-5">Class 3–5 (light commercial)</SelectItem>
            <SelectItem value="Mixed">Mixed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-white/70 text-sm mb-1 block">Primary lanes (optional)</Label>
        <Textarea value={data.primaryLanes} onChange={(e) => update("primaryLanes", e.target.value)} rows={3} placeholder="e.g. LA → Phoenix, Dallas → Houston" className="bg-white/5 border-white/10 text-white" />
      </div>
    </div>
  );
}

function IntegrationStep({ data, update }: { data: WizardData; update: <K extends keyof WizardData>(k: K, v: WizardData[K]) => void }) {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-bold mb-4">Current FMS / telematics</h2>
      <p className="text-white/60 text-sm mb-4">Cruze runs alongside your existing platform. No rip-and-replace required.</p>
      <div>
        <Label className="text-white/70 text-sm mb-1 block">Provider</Label>
        <Select value={data.fmsProvider} onValueChange={(v) => update("fmsProvider", v)}>
          <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue placeholder="Pick your stack" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Samsara">Samsara</SelectItem>
            <SelectItem value="Geotab">Geotab</SelectItem>
            <SelectItem value="Motive">Motive</SelectItem>
            <SelectItem value="Verizon Connect">Verizon Connect</SelectItem>
            <SelectItem value="Trimble">Trimble</SelectItem>
            <SelectItem value="Omnitracs">Omnitracs</SelectItem>
            <SelectItem value="Other">Other / multiple</SelectItem>
            <SelectItem value="None">None yet</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function ContactStep({ data, update }: { data: WizardData; update: <K extends keyof WizardData>(k: K, v: WizardData[K]) => void }) {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-bold mb-4">Where can we reach you?</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label className="text-white/70 text-sm mb-1 block">Name *</Label>
          <Input value={data.contactName} onChange={(e) => update("contactName", e.target.value)} className="bg-white/5 border-white/10 text-white" placeholder="Full name (used on your LOI)" />
        </div>
        <div>
          <Label className="text-white/70 text-sm mb-1 block">Email *</Label>
          <Input type="email" value={data.contactEmail} onChange={(e) => update("contactEmail", e.target.value)} className="bg-white/5 border-white/10 text-white" />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label className="text-white/70 text-sm mb-1 block">Job title</Label>
          <Input value={data.contactTitle} onChange={(e) => update("contactTitle", e.target.value)} className="bg-white/5 border-white/10 text-white" placeholder="e.g. VP Operations" />
        </div>
        <div>
          <Label className="text-white/70 text-sm mb-1 block">Phone</Label>
          <Input type="tel" value={data.contactPhone} onChange={(e) => update("contactPhone", e.target.value)} className="bg-white/5 border-white/10 text-white" />
        </div>
      </div>
      <div>
        <Label className="text-white/70 text-sm mb-1 block">Anything else we should know?</Label>
        <Textarea value={data.notes} onChange={(e) => update("notes", e.target.value)} rows={3} className="bg-white/5 border-white/10 text-white" />
      </div>
    </div>
  );
}

function LOIStep({ data, update }: { data: WizardData; update: <K extends keyof WizardData>(k: K, v: WizardData[K]) => void }) {
  const [showFullText, setShowFullText] = useState(false);
  const signedDate = useMemo(() => new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }), []);
  const fullText = useMemo(
    () =>
      renderLOIText({
        participantName: data.contactName || "[your name]",
        participantCompany: data.companyName || "[your company]",
        participantTitle: data.contactTitle || undefined,
        fleetSize: data.fleetSize || "[fleet size]",
        signedDate,
        initials: data.loiInitials || "—",
      }),
    [data.contactName, data.companyName, data.contactTitle, data.fleetSize, data.loiInitials, signedDate]
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-bold mb-1">Sign your Letter of Intent</h2>
        <p className="text-white/55 text-sm">
          Standard 30-day pilot terms. Non-binding. We pre-filled everything from your previous answers.
        </p>
      </div>

      {/* The plain-English summary card */}
      <div className="rounded-xl border border-brand-cyan/25 bg-brand-cyan/5 p-5">
        <div className="text-[11px] uppercase tracking-widest text-brand-cyan font-semibold mb-3">The plain-English version</div>
        <ul className="space-y-2.5">
          {LOI_SUMMARY_BULLETS.map((b) => (
            <li key={b} className="flex items-start gap-2 text-sm text-white/80 leading-relaxed">
              <Check size={14} className="text-brand-cyan flex-shrink-0 mt-1" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Pre-filled key fields */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
        <div className="text-[11px] uppercase tracking-widest text-white/50 font-semibold mb-3">Filled from your previous answers</div>
        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <PreFill label="Company" value={data.companyName} />
          <PreFill label="Participant" value={data.contactName} />
          <PreFill label="Title" value={data.contactTitle || "(none)"} />
          <PreFill label="Fleet size" value={data.fleetSize} />
        </dl>
      </div>

      {/* Full LOI text (collapsible) */}
      <div className="rounded-xl border border-white/10 bg-[#0B0E14]">
        <button
          type="button"
          onClick={() => setShowFullText((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-white/80 hover:text-white"
        >
          <span>{showFullText ? "Hide" : "Read"} the full LOI text</span>
          <ArrowRight size={14} className={`transition-transform ${showFullText ? "rotate-90" : ""}`} />
        </button>
        {showFullText && (
          <div className="border-t border-white/10 px-5 py-4 max-h-72 overflow-y-auto">
            <pre className="text-xs text-white/70 leading-relaxed whitespace-pre-wrap font-sans">{fullText}</pre>
          </div>
        )}
      </div>

      {/* Sign block */}
      <div className="rounded-xl border border-brand-orange/30 bg-brand-orange/5 p-5 space-y-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox
            checked={data.loiAgreed}
            onCheckedChange={(v) => update("loiAgreed", !!v)}
            className="mt-0.5 border-white/30 data-[state=checked]:bg-brand-orange data-[state=checked]:text-[#0B0E14] data-[state=checked]:border-brand-orange"
          />
          <span className="text-sm text-white/85 leading-relaxed">
            I have read and agree to the Letter of Intent above. I understand this is a 30-day non-binding pilot
            with a {PERFORMANCE_FEE_MIN_PCT}–{PERFORMANCE_FEE_MAX_PCT}% performance fee charged only on documented savings.
          </span>
        </label>

        <div>
          <Label className="text-white/70 text-sm mb-1 block">Type your initials to sign</Label>
          <Input
            value={data.loiInitials}
            onChange={(e) => update("loiInitials", e.target.value.toUpperCase().slice(0, 4))}
            placeholder="e.g. AB"
            className="bg-white/5 border-white/10 text-white font-display text-lg tracking-widest max-w-[180px]"
          />
          <p className="text-xs text-white/40 mt-2">
            Your typed initials act as an electronic signature, timestamped {signedDate}. You'll be able to download a PDF copy from your dashboard after submitting.
          </p>
        </div>
      </div>
    </div>
  );
}

function PreFill({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-white/40 text-xs uppercase tracking-wider mb-1">{label}</dt>
      <dd className="text-white/90">{value || <span className="text-yellow-400/80">missing</span>}</dd>
    </div>
  );
}
