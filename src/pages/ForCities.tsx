import MarketingLayout from "@/components/marketing/MarketingLayout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ArrowRight, Building2, ShieldCheck, FileText, MapPin, Users, Network, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { track } from "@/lib/analytics";

export default function ForCities() {
  const navigate = useNavigate();

  const handleTryDemo = () => {
    track("demo_role_activated", { role: "city_operator", from: "/for-cities" });
    localStorage.setItem("demo_role", "city_operator");
    window.location.href = "/dashboard";
  };

  return (
    <MarketingLayout>
      <SEO
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "GovernmentService",
          name: "Cruze for Cities & DOTs",
          serviceType: "Traffic management coordination platform",
          provider: { "@type": "Organization", name: "Cruze Technologies" },
          areaServed: { "@type": "Country", name: "United States" },
        }}
      />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-bl from-brand-cyan/15 via-transparent to-brand-orange/5 pointer-events-none" />
        <div className="container mx-auto px-6 py-24 grid md:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/30 mb-6">
              For DOTs & City Operators
            </span>
            <h1 className="font-display text-4xl md:text-6xl font-bold leading-tight mb-6">
              Coordinate the corridor. <span className="text-brand-cyan">No new hardware.</span>
            </h1>
            <p className="text-white/70 text-lg mb-8 max-w-lg">
              Cruze is the first traffic management layer that actively coordinates driver speeds across your network. We dissolve recurring congestion before it forms, with zero roadside installation.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => navigate("/login?role=city_operator")} className="bg-brand-cyan hover:bg-brand-cyan/90 text-[#0B0E14] font-bold tracking-wide rounded-full px-6 h-12">
                Request a briefing <ArrowRight className="ml-2" size={16} />
              </Button>
              <Button onClick={handleTryDemo} variant="outline" className="border-white/20 text-white hover:bg-white/5 rounded-full px-6 h-12">
                Tour Mission Control
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="aspect-video rounded-2xl bg-gradient-to-br from-brand-cyan/15 to-transparent border border-white/10 flex items-center justify-center"
          >
            <Building2 className="w-32 h-32 text-brand-cyan/60" strokeWidth={1} />
          </motion.div>
        </div>
      </section>

      <section className="py-24 bg-[#0F131C] border-y border-white/5">
        <div className="container mx-auto px-6 max-w-5xl">
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-12 text-center">Built for procurement, sized for impact.</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: ShieldCheck, title: "SOC 2 Type II in progress", body: "Independent audit underway. Full data residency controls available; pilot data stays in your jurisdiction." },
              { icon: FileText, title: "RFP-ready language", body: "Reusable response templates, signed BAAs/IAAs, and standard procurement narratives ready on request." },
              { icon: Network, title: "Integrates with your TMC", body: "Streams into ATMS systems via standard protocols. No rip-and-replace; no roadside hardware to install." },
              { icon: MapPin, title: "Corridor-level deployment", body: "Start on a single recurring-congestion corridor. Expand once measured benefits are confirmed." },
              { icon: Activity, title: "Measurable in 30 days", body: "Pre/post analyses with control segments. We share calibrated impact reports each Monday." },
              { icon: Users, title: "Equity dashboard built in", body: "Per-corridor distributional impact reports, required for many federal program co-funding." },
            ].map((it) => (
              <Card key={it.title} className="bg-[#0B0E14] border-white/10">
                <CardContent className="p-6">
                  <div className="w-10 h-10 rounded-lg bg-brand-cyan/15 text-brand-cyan flex items-center justify-center mb-4">
                    <it.icon size={20} />
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2">{it.title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{it.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 container mx-auto px-6 max-w-4xl">
        <div className="rounded-3xl bg-gradient-to-br from-brand-cyan/15 to-transparent border border-brand-cyan/20 p-12">
          <h2 className="font-display text-2xl md:text-4xl font-bold mb-4">Download the executive briefing.</h2>
          <p className="text-white/70 mb-8 max-w-xl">
            16-page primer for transportation directors: phantom jam economics, deployment patterns, federal funding alignment (USDOT SMART Grants, ARPA-IT/CARS).
          </p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => navigate("/login?role=city_operator")} className="bg-brand-cyan hover:bg-brand-cyan/90 text-[#0B0E14] font-bold tracking-wide rounded-full px-6 h-12">
              Get the briefing
            </Button>
            <a
              href="mailto:cities@cruzemaps.com?subject=Cruze%20briefing%20request"
              className="inline-flex items-center px-6 h-12 rounded-full border border-white/20 text-white hover:bg-white/5"
            >
              Email cities@cruzemaps.com
            </a>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
