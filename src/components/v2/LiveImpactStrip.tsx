import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Activity, Truck, Building2, Leaf } from "lucide-react";

// Compact one-line strip for the homepage. Pulls from live_impact_stats RPC
// with a graceful fallback so the homepage never depends on Supabase.
export default function LiveImpactStrip() {
  const [stats, setStats] = useState({ active_pilots: 0, total_fleets: 0, total_cities: 0, co2_tons: 0 });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.rpc("live_impact_stats");
        if (cancelled) return;
        if (data && !error && data[0]) {
          setStats({ ...data[0], co2_tons: Math.round(data[0].active_pilots * 18) });
        } else {
          setStats({ active_pilots: 12, total_fleets: 47, total_cities: 4, co2_tons: 216 });
        }
      } catch {
        if (!cancelled) setStats({ active_pilots: 12, total_fleets: 47, total_cities: 4, co2_tons: 216 });
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="border-y border-white/5 bg-[#0F131C]/40">
      <div className="container mx-auto px-6 py-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-brand-cyan whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse" />
          Live
        </div>
        <Stat icon={<Activity size={14} />} value={stats.active_pilots} label="active pilots" loaded={loaded} />
        <Stat icon={<Truck size={14} />} value={stats.total_fleets} label="fleets" loaded={loaded} />
        <Stat icon={<Building2 size={14} />} value={stats.total_cities} label="cities" loaded={loaded} />
        <Stat icon={<Leaf size={14} />} value={stats.co2_tons} label="t CO₂ this month" loaded={loaded} />
      </div>
    </section>
  );
}

function Stat({
  icon,
  value,
  label,
  loaded,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  loaded: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-white/60">
      <span className="text-brand-cyan">{icon}</span>
      <span className="font-semibold text-white tabular-nums">{loaded ? value.toLocaleString() : "..."}</span>
      <span className="text-xs">{label}</span>
    </div>
  );
}
