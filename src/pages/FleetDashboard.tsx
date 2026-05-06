import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, FileText, MessageCircle, Truck, Clock, CheckCircle, FileSignature, Download } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AppStatus = null | "pending" | "in_review" | "approved" | "onboarding" | "active" | "denied" | "archived";

type LOISummary = { id: string; signed_at: string; participant_company: string };

const FleetDashboard = () => {
  const { user, signOut } = useAuth();
  const [status, setStatus] = useState<AppStatus>(null);
  const [loading, setLoading] = useState(true);
  const [loi, setLoi] = useState<LOISummary | null>(null);

  // Form State
  const [companyName, setCompanyName] = useState("");
  const [truckSize, setTruckSize] = useState("");
  const [fleetSize, setFleetSize] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Cancellation flag (audit #22): prevents the async fetch from writing
    // state into a stale FleetDashboard instance after the user has changed
    // (sign-out, switch role, etc.).
    let cancelled = false;

    const fetchApplication = async () => {
      if (!user) return;

      const isDemo = sessionStorage.getItem("demo_role");

      if (isDemo) {
        const demoStatus = sessionStorage.getItem("demo_status") as AppStatus;
        if (!cancelled && demoStatus) setStatus(demoStatus);
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('pilot_applications')
          .select('status')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!cancelled && data && !error) {
          setStatus(data.status as AppStatus);
        }
      } catch (e) {
        console.error("Fetch error:", e);
      }

      // Fetch latest signed LOI for the "Your LOI" card.
      try {
        const { data: loiRow } = await supabase
          .from("loi_signatures")
          .select("id, signed_at, participant_company")
          .eq("user_id", user.id)
          .order("signed_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!cancelled && loiRow) setLoi(loiRow as LOISummary);
      } catch {
        // ignore — card just won't render
      }
      if (!cancelled) setLoading(false);
    };

    fetchApplication();

    // REAL-TIME STATUS LISTENER. Always declare and return cleanup so a
    // channel from a previous render (different user) cannot leak.
    let channel: ReturnType<typeof supabase.channel> | null = null;
    if (user && !(sessionStorage.getItem("demo_role"))) {
      channel = supabase
        .channel(`status_updates_${user.id}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'pilot_applications',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          if (cancelled) return;
          setStatus(payload.new.status as AppStatus);
          // Humanize the raw enum status before showing it (audit #21).
          const rawStatus = payload.new.status as string;
          const humanLabel: Record<string, string> = {
            pending: "received and queued for review",
            in_review: "under review",
            approved: "approved",
            onboarding: "in onboarding",
            active: "live and active",
            denied: "not selected for the current cohort",
            archived: "archived",
          };
          toast.info(`Application status: ${humanLabel[rawStatus] ?? rawStatus}.`);
        })
        .subscribe();
    }

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [user]);

  const handleSubmitPilot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    
    if (sessionStorage.getItem("demo_role")) {
      setTimeout(() => {
        toast.success("Demo Application submitted successfully.");
        sessionStorage.setItem("demo_status", "pending");
        setStatus("pending");
        setSubmitting(false);
      }, 800);
      return;
    }
    
    // Optimistic fallback for frontend simulation if DB not configured yet
    try {
      const { error } = await supabase
        .from('pilot_applications')
        .insert({
          user_id: user.id,
          company_name: companyName,
          truck_size: truckSize,
          fleet_size: fleetSize,
          status: 'pending'
        });

      if (error) throw error;
      toast.success("Application submitted successfully.");
      setStatus("pending");
    } catch (e: any) {
      console.warn("DB not connected or table missing, mocking pending state locally.");
      toast.success("Application submitted successfully. (Mocked locally)");
      setStatus("pending");
    }
    setSubmitting(false);
  };

  if (loading) {
     return <div className="min-h-screen bg-[#0B0E14] text-white flex items-center justify-center">Loading Data...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white overflow-hidden relative">
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-brand-orange/10 rounded-full blur-[150px] pointer-events-none" />
      
      {/* Navbar */}
      <nav className="relative z-50 w-full p-6 border-b border-white/5 bg-[#0B0E14]/50 backdrop-blur-md flex items-center justify-between pointer-events-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium tracking-wide">Back to Home</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-white/50 text-sm hidden sm:block">{user?.email}</span>
          <Button
            variant="ghost"
            onClick={() => signOut()}
            className="text-white hover:text-brand-orange hover:bg-transparent"
          >
            Sign Out
          </Button>
        </div>
      </nav>

      {/* Main Content Area based on Status */}
      <main className="relative z-10 container mx-auto px-6 py-12 max-w-4xl">
        
        {status === null && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-display font-bold mb-2">Fleet Pilot Application</h1>
            <p className="text-white/60 mb-8">Register your fleet details to participate in the hardware-free speed harmonization pilot.</p>
            
            <div className="grid md:grid-cols-2 gap-8">
               <Card className="bg-white/5 border-white/10 text-white backdrop-blur-lg">
                 <CardHeader>
                    <CardTitle>Fleet Logistics Form</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <form onSubmit={handleSubmitPilot} className="space-y-4">
                     <div className="space-y-2">
                       <Label>Company / Fleet Name</Label>
                       <Input required value={companyName} onChange={e=>setCompanyName(e.target.value)} className="bg-white/5 border-white/10 text-white" />
                     </div>
                     <div className="space-y-2">
                       <Label>Primary Truck Weight Class</Label>
                       <Input required placeholder="Class 8 (e.g. 80,000 lbs)" value={truckSize} onChange={e=>setTruckSize(e.target.value)} className="bg-white/5 border-white/10 text-white" />
                     </div>
                     <div className="space-y-2">
                       <Label>Total Active Vehicles (Fleet Size)</Label>
                       <Input required type="number" value={fleetSize} onChange={e=>setFleetSize(e.target.value)} className="bg-white/5 border-white/10 text-white" />
                     </div>
                     <Button type="submit" disabled={submitting} className="w-full bg-brand-orange text-black font-bold hover:bg-brand-orange/90 mt-4">
                       {submitting ? "Submitting..." : "Submit Pilot Request"}
                     </Button>
                   </form>
                 </CardContent>
               </Card>

               <div className="flex flex-col gap-4">
                 <Card className="bg-gradient-to-br from-brand-cyan/10 to-transparent border-brand-cyan/20 text-white backdrop-blur-lg h-1/2">
                   <CardContent className="h-full flex flex-col items-center justify-center p-6 text-center">
                     <FileText className="w-12 h-12 text-brand-cyan mb-4" />
                     <h3 className="font-bold text-lg mb-2">Cruze Pilot Information Kit</h3>
                     <p className="text-sm text-white/60 mb-4">Learn why and how we reduce $11k in fuel spend per truck annually.</p>
                     <Button asChild variant="outline" className="border-brand-cyan text-brand-cyan hover:bg-brand-cyan/10">
                       <a href="/press/cruze-fact-sheet.pdf" target="_blank" rel="noopener noreferrer" download>
                         Download PDF
                       </a>
                     </Button>
                   </CardContent>
                 </Card>
                 
                 <Card className="bg-white/5 border-white/10 text-white backdrop-blur-lg h-1/2 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => { window.location.href = "mailto:hello@cruzemaps.com?subject=Pilot%20question"; }}>
                   <CardContent className="h-full flex items-center gap-4 p-6">
                     <div className="p-3 bg-white/10 rounded-full">
                       <MessageCircle className="w-6 h-6 text-white" />
                     </div>
                     <div>
                       <h3 className="font-bold text-lg">Need Assistance?</h3>
                       <p className="text-sm text-white/50">Chat live with our routing specialists.</p>
                     </div>
                   </CardContent>
                 </Card>
               </div>
            </div>
          </motion.div>
        )}

        {/* Only show the signed-LOI summary once the user has an application
            in flight; on the empty form view it would float above the form
            without context. (audit #33) */}
        {loi && status !== null && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <Card className="bg-[#0F131C] border-white/10">
              <CardContent className="p-5 flex flex-wrap items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-brand-cyan/10 text-brand-cyan flex items-center justify-center flex-shrink-0">
                  <FileSignature size={18} />
                </div>
                <div className="flex-1 min-w-[220px]">
                  <div className="font-display font-semibold">Your signed Letter of Intent</div>
                  <div className="text-xs text-white/50 mt-0.5">
                    {loi.participant_company} · signed{" "}
                    {new Date(loi.signed_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                  </div>
                </div>
                <Button asChild variant="outline" size="sm" className="border-white/15 text-white hover:bg-white/5">
                  <Link to={`/loi/${loi.id}`}>
                    <Download size={14} className="mr-2" /> View / Download
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {(status === "pending" || status === "in_review") && (
          <div className="space-y-8">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center justify-center mt-8">
              <Card className="w-full max-w-2xl bg-gradient-to-br from-white/10 to-transparent border-white/20 text-white backdrop-blur-xl text-center overflow-hidden">
                <div className="h-2 w-full bg-brand-orange/50 animate-pulse"></div>
                <CardContent className="p-10 flex flex-col items-center">
                  <div className="w-20 h-20 bg-brand-orange/10 rounded-full flex items-center justify-center mb-6">
                    <Clock className="w-10 h-10 text-brand-orange animate-spin-slow" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">{status === "in_review" ? "Application Under Review" : "Application Received"}</h2>
                  <p className="text-white/60 max-w-md">{status === "in_review"
                    ? "Our mission control team is currently verifying your route telemetry and evaluating pilot alignment."
                    : "Your fleet application has been received. We will move it into review within 2 business days."}</p>
                  <p className="mt-6 text-sm text-white/40">We'll contact you via email with next steps.</p>
                </CardContent>
              </Card>
            </motion.div>

            <PendingExploreSection />
          </div>
        )}

        {(status === "approved" || status === "onboarding" || status === "active") && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
             <div className="p-8 bg-green-500/10 border border-green-500/30 rounded-2xl flex flex-col sm:flex-row items-center gap-6">
               <CheckCircle className="w-16 h-16 text-green-400 shrink-0" />
               <div>
                 <h2 className="text-2xl font-bold text-white mb-2">
                   {status === "active" ? "Pilot Active" : status === "onboarding" ? "Onboarding in Progress" : "Pilot Deployment Approved"}
                 </h2>
                 <p className="text-white/70">
                   {status === "active"
                     ? "Your fleet is live on Cruze coordination. Track impact and route metrics from your dashboard."
                     : status === "onboarding"
                     ? "Integration with your FMS is underway. Our team will reach out for kickoff shortly."
                     : "Your fleet is locked in. Click below to begin integrating your routing manifests into the Cruze API."}
                 </p>
               </div>
             </div>
          </motion.div>
        )}

        {status === "denied" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
             <div className="p-8 bg-red-500/10 border border-red-500/30 rounded-2xl">
               <h2 className="text-2xl font-bold text-white mb-2">Application Not Selected for Pilot Cohort</h2>
               <p className="text-white/70">Your application was reviewed but not selected for the current pilot cohort. Contact us at <a href="mailto:hello@cruzemaps.com" className="text-brand-cyan">hello@cruzemaps.com</a> to discuss alternative paths or future cohorts.</p>
             </div>
          </motion.div>
        )}

        {status === "archived" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
             <div className="p-8 bg-white/5 border border-white/10 rounded-2xl">
               <h2 className="text-2xl font-bold text-white mb-2">Application Archived</h2>
               <p className="text-white/70">This application has been archived. To start a new pilot conversation, email <a href="mailto:hello@cruzemaps.com" className="text-brand-cyan">hello@cruzemaps.com</a>.</p>
             </div>
          </motion.div>
        )}

      </main>

      {/* Floating contact button — mailto in lieu of a real chat widget. */}
      <a
        href="mailto:hello@cruzemaps.com?subject=Fleet%20pilot%20question"
        className="fixed bottom-6 right-6 p-4 bg-brand-cyan text-black rounded-full shadow-2xl hover:scale-105 transition-transform z-50 flex items-center justify-center"
        aria-label="Email Cruze fleet support"
        title="Email hello@cruzemaps.com"
      >
        <MessageCircle className="w-6 h-6" />
      </a>

    </div>
  );
};

export default FleetDashboard;

// ----------------------------------------------------------------------------
// PendingExploreSection
// Shown to fleet users while their application is pending or in review.
// Gives them three things to do: play with the ROI calculator, read deeper
// content, or look up their corridor.
// ----------------------------------------------------------------------------

function PendingExploreSection() {
  const [trucks, setTrucks] = useState(50);
  const [milesPerTruck, setMilesPerTruck] = useState(80000);
  const [mpg, setMpg] = useState(6.5);
  const [fuelPrice, setFuelPrice] = useState(3.85);

  const annualMiles = trucks * milesPerTruck;
  const annualGallons = annualMiles / Math.max(mpg, 1);
  const fuelSaved = annualGallons * 0.11;
  const fuelDollars = Math.round(fuelSaved * fuelPrice);
  const driverHours = Math.round(trucks * 1.5 * 50);
  const co2Tons = Math.round((fuelSaved * 10.21) / 1000);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="space-y-6"
    >
      <div className="text-center mb-2">
        <div className="text-[11px] uppercase tracking-widest text-brand-cyan font-semibold mb-1">While you wait</div>
        <h3 className="font-display text-2xl font-bold">Get a feel for what Cruze does for fleets like yours</h3>
      </div>

      {/* ROI calculator */}
      <Card className="bg-[#0F131C] border-white/10">
        <CardContent className="p-6">
          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-6">
            <div>
              <h4 className="font-display font-semibold text-lg mb-1">Quick savings calculator</h4>
              <p className="text-white/50 text-sm mb-5">
                Conservative pilot averages: 11% fuel reduction, 1.5 reclaimed driver-hours per week, 50 working
                weeks per year.
              </p>
              <div className="space-y-4">
                <ExploreSlider label="Number of trucks" value={trucks} setValue={setTrucks} min={5} max={2000} step={5} format={(v) => `${v.toLocaleString()} trucks`} />
                <ExploreSlider label="Miles per truck per year" value={milesPerTruck} setValue={setMilesPerTruck} min={20000} max={150000} step={1000} format={(v) => `${v.toLocaleString()} mi`} />
                <ExploreSlider label="Fleet average MPG" value={mpg} setValue={setMpg} min={4} max={12} step={0.1} format={(v) => `${v.toFixed(1)} mpg`} />
                <div>
                  <Label className="text-white/70 text-sm mb-2 block">Fuel price ($/gal)</Label>
                  <Input
                    type="number"
                    step={0.05}
                    value={fuelPrice}
                    onChange={(e) => setFuelPrice(parseFloat(e.target.value) || 0)}
                    className="bg-white/5 border-white/10 text-white max-w-[140px]"
                  />
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-brand-orange/15 to-brand-cyan/10 border border-brand-orange/30 p-6 flex flex-col">
              <div className="text-xs uppercase tracking-widest text-brand-cyan mb-1">Estimated annual fuel savings</div>
              <div className="font-display text-5xl font-bold mb-1">${fuelDollars.toLocaleString()}</div>
              <div className="text-white/40 text-xs mb-5">across {trucks.toLocaleString()} trucks</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <ResultTile label="Driver-hours reclaimed" value={`${driverHours.toLocaleString()} hr/yr`} />
                <ResultTile label="Tons CO₂ avoided" value={`${co2Tons.toLocaleString()} t`} />
                <ResultTile label="Fuel saved" value={`${Math.round(fuelSaved).toLocaleString()} gal`} />
                <ResultTile label="Hours per truck/yr" value={`${Math.round(driverHours / trucks).toLocaleString()}`} />
              </div>
              <p className="text-[11px] text-white/40 leading-relaxed mt-auto pt-5">
                These are projections. Your real numbers come from your 30-day pilot baseline once you're approved,
                using your actual telematics data (not these inputs).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content blocks: case study + insight + integrations */}
      <div className="grid md:grid-cols-3 gap-4">
        <ExploreLink
          to="/case-studies/midwest-class8-fleet"
          eyebrow="Case study"
          title="11.4% diesel reduction across 600 Class-8 trucks"
          body="Read the full pilot writeup from a Midwest regional carrier."
        />
        <ExploreLink
          to="/insights/phantom-traffic-jams-explained"
          eyebrow="Deep dive"
          title="Why phantom jams happen and how Cruze dissolves them"
          body="The physics + driver math behind 'traffic that has no cause'."
        />
        <ExploreLink
          to="/insights/fleet-economics-of-stop-and-go"
          eyebrow="Economics"
          title="The hidden cost of stop-and-go for your trucks"
          body="Per-mile fuel breakdown and the marginal-returns curve."
        />
      </div>

      {/* Integrations strip */}
      <Card className="bg-[#0F131C] border-white/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div>
              <h4 className="font-display font-semibold text-lg mb-1">Plugs into your FMS in under a day</h4>
              <p className="text-white/50 text-sm">No rip-and-replace. Cruze runs alongside your existing telematics.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {["Samsara", "Geotab", "Motive", "Verizon Connect", "Trimble", "Omnitracs"].map((name) => (
              <span key={name} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs">
                {name}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ExploreSlider({
  label,
  value,
  setValue,
  min,
  max,
  step,
  format,
}: {
  label: string;
  value: number;
  setValue: (n: number) => void;
  min: number;
  max: number;
  step: number;
  format: (n: number) => string;
}) {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <Label className="text-white/70 text-sm">{label}</Label>
        <span className="text-brand-cyan text-sm font-semibold">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => setValue(parseFloat(e.target.value))}
        className="w-full accent-brand-cyan"
      />
    </div>
  );
}

function ResultTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/5 p-3">
      <div className="font-display font-bold text-base text-white tabular-nums">{value}</div>
      <div className="text-[11px] text-white/50 mt-0.5">{label}</div>
    </div>
  );
}

function ExploreLink({ to, eyebrow, title, body }: { to: string; eyebrow: string; title: string; body: string }) {
  return (
    <Link
      to={to}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl border border-white/10 bg-[#0F131C] p-5 hover:border-brand-cyan/40 transition-colors group"
    >
      <div className="text-[10px] uppercase tracking-widest text-brand-cyan font-semibold mb-2">{eyebrow}</div>
      <div className="font-display font-semibold mb-1 group-hover:text-brand-cyan">{title}</div>
      <div className="text-white/60 text-sm leading-relaxed">{body}</div>
    </Link>
  );
}
