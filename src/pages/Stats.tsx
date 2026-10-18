import { useEffect, useState } from "react";
import MarketingLayout from "@/components/marketing/MarketingLayout";
import SEO from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Activity, Truck, Building2 } from "lucide-react";
import { type LiveStats, resolveLiveStats } from "@/lib/stats";

export default function Stats() {
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        // RPC defined in migration 002. If it is missing or fails, stats stays
        // null and the page says the numbers are unavailable. It never shows
        // invented numbers in their place.
        const { data, error } = await supabase.rpc("live_impact_stats");
        if (cancelled) return;
        setStats(resolveLiveStats(data as LiveStats[] | null, error));
      } catch {
        if (!cancelled) setStats(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const unavailable = !loading && !stats;

  return (
    <MarketingLayout>
      <SEO />
      <section className="container mx-auto px-6 py-24 max-w-5xl">
        <div className="text-center mb-16">
          {!unavailable && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-cyan/10 text-brand-cyan text-xs uppercase tracking-widest border border-brand-cyan/30 mb-6">
              <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse" /> Live
            </div>
          )}
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-4">Cruze, in motion.</h1>
          <p className="text-white/60 max-w-2xl mx-auto text-lg">
            Live counts from our database: pilots approved or running, fleets onboard, and city partners. Fuel and CO₂ results will appear here once pilots have measured them.
          </p>
        </div>

        {unavailable ? (
          <Card className="bg-[#0F131C] border-white/10">
            <CardContent className="p-8 text-center text-white/60">
              Live numbers are unavailable right now. Please check back later.
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            <StatTile
              loading={loading}
              icon={<Activity size={20} />}
              label="Pilots approved or running"
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
          </div>
        )}

        <div className="mt-16 text-center text-white/40 text-sm">
          Questions about these numbers: <a href="mailto:hello@cruzemaps.com" className="text-brand-cyan">hello@cruzemaps.com</a>
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
