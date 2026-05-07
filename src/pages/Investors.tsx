import { useState } from "react";
import NavbarV2 from "@/components/v2/NavbarV2";
import InteractiveLabV2 from "@/components/v2/InteractiveLabV2";
import InvestorPitchSections from "@/components/v2/InvestorPitchSections";
import SEO from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Calendar, Mail, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { track } from "@/lib/analytics";
import { SITE } from "@/lib/seo";

// Tier-gated investor flow:
//   Tier 1 (public): summary visible to all (SEO-indexable, content above the fold)
//   Tier 2 (email-gated): full pitch + interactive lab unlocked after email
//   Tier 3 (password-gated dataroom): financials, contracts via VITE_DATAROOM_PASSWORD
//
// Email gate uses sessionStorage (visit-scoped) so investors don't have to
// re-enter on each page nav, but it doesn't persist across sessions — keeps
// the lead-capture intent honest.

type Tier = "public" | "email" | "dataroom";

export default function Investors() {
  const [tier, setTier] = useState<Tier>(() =>
    sessionStorage.getItem("investor_dataroom") === "1" ? "dataroom" :
    sessionStorage.getItem("investor_email") ? "email" : "public"
  );

  return (
    <div className="min-h-screen bg-brand-charcoal text-white font-body selection:bg-brand-cyan/30">
      <SEO
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Cruzemaps",
          description:
            "Cruze is the operating system for moving vehicles. We coordinate driver speeds with swarm intelligence to dissolve phantom traffic jams.",
          url: SITE.url,
          foundingDate: "2024",
        }}
      />
      <NavbarV2 />

      {/* Tier 1: always-visible public summary (SEO + funnel top) */}
      <section className="pt-28 pb-12 md:pt-32 border-b border-white/5">
        <div className="container mx-auto px-6 max-w-5xl">
          <p className="text-xs font-bold tracking-widest uppercase text-brand-orange mb-3 text-center">
            Investor briefing
          </p>
          <h1 className="font-display font-bold text-4xl md:text-6xl text-white tracking-tight text-center mb-6">
            The{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-[#FFB75E]">
              operating system
            </span>{" "}
            for moving vehicles.
          </h1>
          <p className="text-lg text-white/70 max-w-3xl mx-auto leading-relaxed text-center mb-12">
            Apps route drivers around traffic. Cruze coordinates them. Physics-informed swarm intelligence dissolves phantom jams before they form. Pilots show 8 to 14% fuel reduction, 38% fewer stop-and-go events, and zero new roadside hardware.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <PublicStat label="US congestion cost" value="$87B/yr" />
            <PublicStat label="Smartphone penetration" value=">95% of drivers" />
            <PublicStat label="Pilot deployments" value="Live, with measurable ROI" />
            <PublicStat label="Hardware required" value="$0" />
          </div>
        </div>
      </section>

      {/* Tier 2 gate: shown when not yet email-gated */}
      {tier === "public" && (
        <EmailGate
          onSuccess={() => {
            sessionStorage.setItem("investor_email", "1");
            setTier("email");
          }}
        />
      )}

      {/* Tier 2 content: full pitch + interactive lab */}
      {(tier === "email" || tier === "dataroom") && (
        <>
          <InteractiveLabV2 />
          <InvestorPitchSections />
          <CalBookingSection />
        </>
      )}

      {/* Tier 3 gate: dataroom */}
      {tier === "email" && (
        <DataroomGate
          onSuccess={() => {
            sessionStorage.setItem("investor_dataroom", "1");
            setTier("dataroom");
          }}
        />
      )}

      {tier === "dataroom" && <DataroomSection />}
    </div>
  );
}

function PublicStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0F131C] p-5 text-center">
      <div className="font-display text-2xl font-bold text-brand-cyan mb-1">{value}</div>
      <div className="text-white/50 text-xs">{label}</div>
    </div>
  );
}

function EmailGate({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [firm, setFirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return toast.error("Valid email please.");
    setSubmitting(true);

    track("investor_cta_click", { tier: "email_gate", firm });

    // Persist the lead via the SECURITY DEFINER RPC (migration 006).
    // Failure is non-fatal — the gate experience still proceeds.
    try {
      await supabase.rpc("capture_investor_lead", {
        p_name: name,
        p_email: email,
        p_firm: firm,
        p_user_agent: navigator.userAgent,
        p_referrer: document.referrer,
      });
    } catch {
      // ignored
    }

    setSubmitting(false);
    onSuccess();
  };

  return (
    <section className="py-24 container mx-auto px-6 max-w-2xl">
      <Card className="bg-gradient-to-br from-brand-orange/15 to-transparent border-brand-orange/30">
        <CardContent className="p-10 text-center">
          <Mail className="mx-auto text-brand-orange mb-4" size={36} />
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">Continue to the full pitch</h2>
          <p className="text-white/60 mb-6">
            Drop your details below to access the interactive corridor lab, unit economics, defensible moat, and the latest deck.
          </p>
          <form onSubmit={submit} className="space-y-3 max-w-md mx-auto text-left">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-white/70 text-xs mb-1 block">Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-white/5 border-white/10 text-white" />
              </div>
              <div>
                <Label className="text-white/70 text-xs mb-1 block">Firm</Label>
                <Input value={firm} onChange={(e) => setFirm(e.target.value)} placeholder="(optional)" className="bg-white/5 border-white/10 text-white" />
              </div>
            </div>
            <div>
              <Label className="text-white/70 text-xs mb-1 block">Email *</Label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white/5 border-white/10 text-white" />
            </div>
            <Button type="submit" disabled={submitting} className="w-full bg-brand-orange text-[#0B0E14] hover:bg-brand-orange/90 font-bold">
              Unlock the full briefing
            </Button>
            <p className="text-xs text-white/40 text-center pt-2">
              We don't share your details. Used to follow up if you have questions.
            </p>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}

function CalBookingSection() {
  // Cal.com embed URL — set VITE_CALCOM_USER (e.g. "anudeep-cruze/investor-intro") to override.
  const calUser = (import.meta.env.VITE_CALCOM_USER as string) || "anudeep-cruze/investor-intro";
  return (
    <section className="py-24 bg-[#0F131C] border-y border-white/5">
      <div className="container mx-auto px-6 max-w-4xl text-center">
        <Calendar className="mx-auto text-brand-cyan mb-4" size={36} />
        <h2 className="font-display text-3xl md:text-5xl font-bold mb-3">Talk to the founders.</h2>
        <p className="text-white/60 mb-10 max-w-xl mx-auto">
          30 minutes, video. We'll walk through the live corridor data and answer anything diligence-relevant.
        </p>
        <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#0B0E14]">
          <iframe
            src={`https://cal.com/${calUser}?embed=1&theme=dark`}
            title="Schedule a Cruze investor call"
            className="w-full h-[640px]"
            loading="lazy"
          />
        </div>
        <p className="text-xs text-white/40 mt-3">
          Trouble loading? Email <a href="mailto:investors@cruzemaps.com" className="text-brand-cyan">investors@cruzemaps.com</a>.
        </p>
      </div>
    </section>
  );
}

function DataroomGate({ onSuccess }: { onSuccess: () => void }) {
  const [pw, setPw] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const expected = (import.meta.env.VITE_DATAROOM_PASSWORD as string) || "";
    // Basic equality check at the client. NOT a security boundary — anything in
    // the dataroom is gated server-side too (e.g. Notion link with link-level
    // sharing, or a signed Supabase storage URL). This is a friction gate.
    await new Promise((r) => setTimeout(r, 300));
    setSubmitting(false);
    if (!expected) {
      toast.error("Dataroom not yet configured. Email investors@cruzemaps.com.");
      return;
    }
    if (pw !== expected) {
      toast.error("Incorrect password.");
      return;
    }
    track("investor_cta_click", { tier: "dataroom_unlock" });
    onSuccess();
  };

  return (
    <section className="py-24 container mx-auto px-6 max-w-md">
      <Card className="bg-[#0F131C] border-white/10">
        <CardContent className="p-8 text-center">
          <Lock className="mx-auto text-white/60 mb-3" size={28} />
          <h3 className="font-display text-xl font-bold mb-3">Have a dataroom password?</h3>
          <p className="text-white/50 text-sm mb-6">
            Active diligence partners receive a password for financials, contracts, and the cap table. Don't have one? Book a call above.
          </p>
          <form onSubmit={submit} className="space-y-3">
            <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Dataroom password" className="bg-white/5 border-white/10 text-white text-center" />
            <Button type="submit" disabled={submitting || !pw} className="w-full bg-brand-cyan text-[#0B0E14] hover:bg-brand-cyan/90">
              Unlock dataroom
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}

function DataroomSection() {
  // Replace the items array with your real dataroom links.
  const dataroomUrl = (import.meta.env.VITE_DATAROOM_URL as string) || "";
  const items = [
    { label: "Pitch deck (full v2026.05)", href: dataroomUrl ? `${dataroomUrl}/deck` : "#" },
    { label: "Financial model", href: dataroomUrl ? `${dataroomUrl}/financials` : "#" },
    { label: "Customer pipeline", href: dataroomUrl ? `${dataroomUrl}/pipeline` : "#" },
    { label: "Pilot outcome reports", href: dataroomUrl ? `${dataroomUrl}/pilots` : "#" },
    { label: "Cap table", href: dataroomUrl ? `${dataroomUrl}/cap-table` : "#" },
    { label: "Founder references", href: dataroomUrl ? `${dataroomUrl}/refs` : "#" },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-24 container mx-auto px-6 max-w-4xl"
    >
      <div className="flex items-center gap-3 mb-6">
        <Lock size={20} className="text-emerald-400" />
        <h2 className="font-display text-2xl font-bold">Dataroom</h2>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {items.map((item) => (
          <a
            key={item.label}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0F131C] p-5 hover:border-brand-cyan/40 transition-colors"
          >
            <FileText size={18} className="text-brand-cyan" />
            <span className="font-medium">{item.label}</span>
          </a>
        ))}
      </div>
      {!dataroomUrl && (
        <p className="text-xs text-white/40 mt-4">
          Dataroom URLs aren't configured yet. Set <code>VITE_DATAROOM_URL</code> in Cloudflare Pages env vars.
        </p>
      )}
    </motion.section>
  );
}
