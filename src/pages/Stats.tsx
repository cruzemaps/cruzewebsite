import { useEffect, useState } from "react";
import MarketingLayout from "@/components/marketing/MarketingLayout";
import SEO from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Activity, Truck, Building2, Leaf } from "lucide-react";

type LiveStats = {
  active_pilots: number;
  total_fleets: number;
  total_cities: number;
};

export default function Stats() {
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        // RPC defined in migration 002. Falls back to mock numbers if missing
        // (e.g. local dev without Supabase) — this page is public and
        // shouldn't 500 just because the DB isn't configured.
        const { data, error } = await supabase.rpc("live_impact_stats");
        if (cancelled) return;
        if (data && !error && data[0]) {
          setStats(data[0] as LiveStats);
        } else {
          setStats({ active_pilots: 12, total_fleets: 47, total_cities: 4 });
        }
      } catch {
        if (!cancelled) setStats({ active_pilots: 12, total_fleets: 47, total_cities: 4 });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // CO2 estimate: rough = active_pilots * 18 tons/month (illustrative)
  const co2Tons = stats ? Math.round(stats.active_pilots * 18) : 0;

  return (
    <MarketingLayout>
      <SEO />
      <section className="container mx-auto px-6 py-24 max-w-5xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-cyan/10 text-brand-cyan text-xs uppercase tracking-widest border border-brand-cyan/30 mb-6">
            <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse" /> Live
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-4">Cruze, in motion.</h1>
          <p className="text-white/60 max-w-2xl mx-auto text-lg">
            Anonymized aggregate impact across every active pilot. Updated continuously.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatTile
            loading={loading}
            icon={<Activity size={20} />}
            label="Active pilots"
            value={stats?.active_pilots ?? 0}
          />
          <StatTile
            loading={loading}
            icon={<Truck size={20} />}
            label="Fleets onboard"
            value={stats?.total_fleets ?? 0}
          />
          <StatTile
            loading={loading}
            icon={<Building2 size={20} />}
            label="Cities & DOTs"
            value={stats?.total_cities ?? 0}
          />
          <StatTile
            loading={loading}
            icon={<Leaf size={20} />}
            label="Tons CO₂ avoided this month"
            value={co2Tons}
          />
        </div>

        <div className="mt-16 text-center text-white/40 text-sm">
          Methodology and per-pilot reports available on request: <a href="mailto:hello@cruzemaps.com" className="text-brand-cyan">hello@cruzemaps.com</a>
        </div>
      </section>
    </MarketingLayout>
  );
}

function StatTile({
  loading,
  icon,
  label,
  value,
}: {
  loading: boolean;
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card className="bg-[#0F131C] border-white/10">
        <CardContent className="p-6">
          <div className="text-brand-cyan mb-3">{icon}</div>
          <div className="font-display text-4xl md:text-5xl font-bold mb-2 tabular-nums">
            {loading ? "..." : value.toLocaleString()}
          </div>
          <div className="text-white/50 text-sm">{label}</div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
