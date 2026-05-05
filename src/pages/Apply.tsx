import { useState } from "react";
import MarketingLayout from "@/components/marketing/MarketingLayout";
import SEO from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Building, Truck, Cable, User, Check, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { track } from "@/lib/analytics";

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
  notes: string;
};

const STEPS = [
  { key: "company", label: "Company", icon: Building },
  { key: "fleet", label: "Fleet specs", icon: Truck },
  { key: "integration", label: "Integration", icon: Cable },
  { key: "contact", label: "Contact", icon: User },
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
    notes: "",
  });

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

    const { error } = await supabase.from("pilot_applications").insert({
      user_id: user.id,
      company_name: data.companyName,
      truck_size: data.truckSize,
      fleet_size: data.fleetSize,
      notes: [
        data.website && `Website: ${data.website}`,
        data.primaryLanes && `Primary lanes: ${data.primaryLanes}`,
        data.fmsProvider && `FMS provider: ${data.fmsProvider}`,
        data.contactName && `Contact: ${data.contactName}`,
        data.contactPhone && `Phone: ${data.contactPhone}`,
        data.notes && `Notes: ${data.notes}`,
      ].filter(Boolean).join("\n"),
    });

    setSubmitting(false);
    if (error) return toast.error(error.message);
    track("application_submitted", { fleet_size: data.fleetSize, fms: data.fmsProvider });
    setDone(true);
    setTimeout(() => navigate("/fleet-dashboard"), 1500);
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
                      Submit application
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
    case 3: return !!data.contactEmail;
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
          <Label className="text-white/70 text-sm mb-1 block">Name</Label>
          <Input value={data.contactName} onChange={(e) => update("contactName", e.target.value)} className="bg-white/5 border-white/10 text-white" />
        </div>
        <div>
          <Label className="text-white/70 text-sm mb-1 block">Email *</Label>
          <Input type="email" value={data.contactEmail} onChange={(e) => update("contactEmail", e.target.value)} className="bg-white/5 border-white/10 text-white" />
        </div>
      </div>
      <div>
        <Label className="text-white/70 text-sm mb-1 block">Phone</Label>
        <Input type="tel" value={data.contactPhone} onChange={(e) => update("contactPhone", e.target.value)} className="bg-white/5 border-white/10 text-white" />
      </div>
      <div>
        <Label className="text-white/70 text-sm mb-1 block">Anything else we should know?</Label>
        <Textarea value={data.notes} onChange={(e) => update("notes", e.target.value)} rows={3} className="bg-white/5 border-white/10 text-white" />
      </div>
    </div>
  );
}
