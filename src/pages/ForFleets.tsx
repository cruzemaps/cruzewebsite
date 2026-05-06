import { useMemo, useState } from "react";
import MarketingLayout from "@/components/marketing/MarketingLayout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { motion } from "framer-motion";
import { ArrowRight, Truck, Fuel, Clock, Wallet, Leaf, ShieldCheck, Cable } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { track } from "@/lib/analytics";

export default function ForFleets() {
  const navigate = useNavigate();

  const handleTryDemo = () => {
    track("demo_role_activated", { role: "fleet_owner", from: "/for-fleets" });
    // Audit #1: open the demo in a NEW tab and route through /demo so the
    // demo_role write only happens in the new tab's sessionStorage. Routes
    // through /demo (not /login?demo=...) because the Login URL bypass is
    // gated to import.meta.env.DEV; /demo is the production-safe handoff.
    window.open("/demo?role=fleet_owner", "_blank", "noopener");
  };

  const handleApply = (location: string) => {
    track("fleet_cta_click", { cta: "apply", location });
    navigate("/login?role=fleet_owner");
  };

  return (
    <MarketingLayout>
      <SEO
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: "Cruze for Fleets",
          description:
            "Swarm-coordinated routing software for trucking and last-mile fleets. Cuts fuel use 8–14% and recaptures driver-hours lost to congestion.",
          brand: { "@type": "Brand", name: "Cruze" },
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
            description: "Pilot pricing available on request.",
          },
        }}
      />

      <Hero onTryDemo={handleTryDemo} onApply={() => handleApply("hero")} />
      <ROISection />
      <BenefitsGrid />
      <ComparisonStrip />
      <IntegrationStrip />
      <CTAStrip onApply={() => handleApply("footer")} />
    </MarketingLayout>
  );
}

function Hero({ onTryDemo, onApply }: { onTryDemo: () => void; onApply: () => void }) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-orange/10 via-transparent to-brand-cyan/10 pointer-events-none" />
      <div className="container mx-auto px-6 py-24 grid md:grid-cols-2 gap-12 items-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase bg-brand-orange/10 text-brand-orange border border-brand-orange/30 mb-6">
            For Fleet Operators
          </span>
          <h1 className="font-display text-4xl md:text-6xl font-bold leading-tight mb-6">
            Stop paying for <span className="text-brand-orange">stop-and-go</span>.
          </h1>
          <p className="text-white/70 text-lg mb-8 max-w-lg">
            Cruze coordinates speeds across your drivers, and the swarm around them, to dissolve phantom jams. Pilots show 8 to 14% fuel reduction and 1 to 2 hours per week reclaimed per driver.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={onApply} className="bg-brand-orange hover:bg-brand-orange/90 text-[#0B0E14] font-bold tracking-wide rounded-full px-6 h-12">
              Apply for the Pilot <ArrowRight className="ml-2" size={16} />
            </Button>
            <Button onClick={onTryDemo} variant="outline" className="border-white/20 text-white hover:bg-white/5 rounded-full px-6 h-12">
              Try the live demo
            </Button>
          </div>
          <p className="text-white/40 text-sm mt-4">
            No credit card. The demo loads a pre-populated fleet dashboard.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative"
        >
          <div className="aspect-video rounded-2xl bg-gradient-to-br from-brand-orange/20 to-brand-cyan/10 border border-white/10 flex items-center justify-center">
            <Truck className="w-32 h-32 text-brand-orange/60" strokeWidth={1} />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ROI calculator. Numbers are illustrative pilot averages; tune as data grows.
function ROISection() {
  const [trucks, setTrucks] = useState(50);
  const [milesPerTruckYear, setMilesPerTruckYear] = useState(80000);
  const [mpg, setMpg] = useState(6.5);
  const [fuelPrice, setFuelPrice] = useState(3.85);
  const [driverHourly, setDriverHourly] = useState(28);
  const [hasInteracted, setHasInteracted] = useState(false);

  const handleInteraction = () => {
    if (!hasInteracted) {
      track("roi_calc_used", { trucks, milesPerTruckYear });
      setHasInteracted(true);
    }
  };

  const result = useMemo(() => {
    // Conservative assumptions: 11% fuel reduction, 1.5 hours/week reclaimed/driver,
    // 0.45 kg CO2 per gallon of diesel.
    const annualMiles = trucks * milesPerTruckYear;
    const annualGallons = annualMiles / Math.max(mpg, 1);
    const fuelSaved = annualGallons * 0.11;
    const fuelSavingsUSD = fuelSaved * fuelPrice;
    const hoursReclaimedYear = trucks * 1.5 * 50;
    const laborValueUSD = hoursReclaimedYear * driverHourly;
    const co2Tons = (fuelSaved * 10.21) / 1000; // ~10.21 kg CO2 per gallon diesel burned
    return {
      fuelSavingsUSD: Math.round(fuelSavingsUSD),
      laborValueUSD: Math.round(laborValueUSD),
      totalUSD: Math.round(fuelSavingsUSD + laborValueUSD),
      co2Tons: Math.round(co2Tons),
      hoursReclaimedYear: Math.round(hoursReclaimedYear),
    };
  }, [trucks, milesPerTruckYear, mpg, fuelPrice, driverHourly]);

  return (
    <section id="roi" className="py-24 bg-[#0F131C] border-y border-white/5">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">See your savings.</h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            Drop in your fleet specs. We use conservative pilot averages: 11% fuel reduction, and 1.5 reclaimed driver-hours per week.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto" onMouseDown={handleInteraction} onTouchStart={handleInteraction}>
          <Card className="bg-[#0B0E14] border-white/10">
            <CardContent className="p-8 space-y-6">
              <CalcSlider label="Number of trucks" value={trucks} setValue={setTrucks} min={5} max={2000} step={5} format={(v) => `${v.toLocaleString()} trucks`} />
              <CalcSlider label="Miles per truck per year" value={milesPerTruckYear} setValue={setMilesPerTruckYear} min={20000} max={150000} step={1000} format={(v) => `${v.toLocaleString()} mi`} />
              <CalcSlider label="Fleet average MPG" value={mpg} setValue={setMpg} min={4} max={12} step={0.1} format={(v) => `${v.toFixed(1)} mpg`} />
              <CalcInput label="Fuel price ($/gal)" value={fuelPrice} setValue={setFuelPrice} step={0.05} />
              <CalcInput label="Driver $/hr (loaded)" value={driverHourly} setValue={setDriverHourly} step={1} />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-brand-orange/15 to-brand-cyan/10 border-brand-orange/30">
            <CardContent className="p-8 space-y-6">
              <div>
                <div className="text-xs uppercase tracking-widest text-brand-cyan mb-1">Estimated annual impact</div>
                <div className="font-display text-5xl md:text-6xl font-bold">${result.totalUSD.toLocaleString()}</div>
                <div className="text-white/50 text-sm">across {trucks.toLocaleString()} trucks</div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <ResultRow icon={<Fuel size={18} />} label="Fuel saved" value={`$${result.fuelSavingsUSD.toLocaleString()}`} />
                <ResultRow icon={<Clock size={18} />} label="Driver-hours value" value={`$${result.laborValueUSD.toLocaleString()}`} />
                <ResultRow icon={<Leaf size={18} />} label="CO₂ avoided" value={`${result.co2Tons.toLocaleString()} t`} />
                <ResultRow icon={<Wallet size={18} />} label="Hours reclaimed" value={`${result.hoursReclaimedYear.toLocaleString()} hr/yr`} />
              </div>
              <p className="text-xs text-white/40 leading-relaxed">
                Estimates only; actual savings depend on fleet density on Cruze-coordinated corridors and integration depth with your FMS. We share calibrated projections after a 30-day pilot.
              </p>
              <Link to="/login?role=fleet_owner" className="inline-flex items-center gap-2 text-brand-orange font-semibold">
                Run a real 30-day pilot <ArrowRight size={16} />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

function CalcSlider({
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
      <Slider value={[value]} onValueChange={([v]) => setValue(v)} min={min} max={max} step={step} />
    </div>
  );
}

function CalcInput({
  label,
  value,
  setValue,
  step,
}: {
  label: string;
  value: number;
  setValue: (n: number) => void;
  step: number;
}) {
  return (
    <div>
      <Label className="text-white/70 text-sm mb-2 block">{label}</Label>
      <Input
        type="number"
        step={step}
        value={value}
        onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
        className="bg-white/5 border-white/10 text-white"
      />
    </div>
  );
}

function ResultRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
      <div className="text-brand-cyan">{icon}</div>
      <div>
        <div className="text-xs text-white/50">{label}</div>
        <div className="font-semibold">{value}</div>
      </div>
    </div>
  );
}

function BenefitsGrid() {
  const items = [
    { icon: Fuel, title: "8–14% fuel reduction", body: "Coordinated speeds eliminate the brake-then-accelerate cycle that consumes the most diesel per mile." },
    { icon: Clock, title: "1–2 hrs/week per driver", body: "Stop-and-go time recaptured. Drivers run fewer disrupted segments and arrive on schedule more often." },
    { icon: ShieldCheck, title: "Fewer rear-end events", body: "Smoother flow lowers sudden-stop incidents, which translates directly to insurance favorability." },
    { icon: Leaf, title: "Audit-ready CO₂ ledger", body: "Per-truck emissions reduction tracked in a SOC 2-aligned dashboard. CDP/CSRD-ready exports." },
  ];
  return (
    <section className="py-24 container mx-auto px-6">
      <h2 className="font-display text-3xl md:text-5xl font-bold mb-12 text-center">Why fleet owners choose Cruze</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((it) => (
          <Card key={it.title} className="bg-[#0F131C] border-white/10 hover:border-brand-orange/30 transition-colors">
            <CardContent className="p-6">
              <div className="w-10 h-10 rounded-lg bg-brand-orange/15 text-brand-orange flex items-center justify-center mb-4">
                <it.icon size={20} />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">{it.title}</h3>
              <p className="text-white/60 text-sm leading-relaxed">{it.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function ComparisonStrip() {
  const rows = [
    { feature: "Routes around traffic", cruze: true, others: true },
    { feature: "Predicts congestion", cruze: true, others: true },
    { feature: "Coordinates driver speeds with the swarm", cruze: true, others: false },
    { feature: "Dissolves phantom jams before they form", cruze: true, others: false },
    { feature: "Audit-grade CO₂ ledger", cruze: true, others: false },
    { feature: "Works without new hardware", cruze: true, others: false },
  ];
  return (
    <section className="py-24 bg-[#0F131C] border-y border-white/5">
      <div className="container mx-auto px-6 max-w-4xl">
        <h2 className="font-display text-3xl md:text-5xl font-bold mb-12 text-center">
          Cruze vs <span className="text-white/40">Geotab · Samsara · Motive</span>
        </h2>
        <Card className="bg-[#0B0E14] border-white/10 overflow-hidden">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 font-medium text-white/60">Capability</th>
                  <th className="p-4 font-display text-brand-orange">Cruze</th>
                  <th className="p-4 font-medium text-white/60">Others</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.feature} className="border-b border-white/5 last:border-0">
                    <td className="p-4 text-white/80">{r.feature}</td>
                    <td className="p-4 text-center">{r.cruze ? "✓" : "·"}</td>
                    <td className="p-4 text-center text-white/40">{r.others ? "✓" : "·"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function IntegrationStrip() {
  const integrations = ["Samsara", "Geotab", "Motive", "Verizon Connect", "Trimble", "Omnitracs"];
  return (
    <section className="py-16 container mx-auto px-6 text-center">
      <div className="flex items-center justify-center gap-2 text-white/50 text-xs uppercase tracking-widest mb-6">
        <Cable size={14} /> Plugs into your existing FMS in under a day
      </div>
      <div className="flex flex-wrap justify-center gap-6 text-white/60 font-display">
        {integrations.map((i) => (
          <span key={i} className="px-4 py-2 rounded-full bg-white/5 border border-white/10">{i}</span>
        ))}
      </div>
    </section>
  );
}

function CTAStrip({ onApply }: { onApply: () => void }) {
  return (
    <section className="py-24 container mx-auto px-6">
      <div className="rounded-3xl bg-gradient-to-br from-brand-orange/20 to-brand-cyan/10 border border-brand-orange/20 p-12 text-center max-w-3xl mx-auto">
        <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Ready to dissolve your fleet's traffic tax?</h2>
        <p className="text-white/70 mb-8">30-day pilot, no rip-and-replace. We benchmark against your last 90 days of telematics.</p>
        <Button onClick={onApply} className="bg-brand-orange hover:bg-brand-orange/90 text-[#0B0E14] font-bold tracking-wide rounded-full px-8 h-12">
          Apply for the pilot
        </Button>
      </div>
    </section>
  );
}
