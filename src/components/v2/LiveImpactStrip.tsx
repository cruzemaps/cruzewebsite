import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Activity, Truck, Building2 } from "lucide-react";
import { type LiveStats, resolveLiveStats } from "@/lib/stats";

// Compact one-line strip for the old /v2 homepage. Pulls from the
// live_impact_stats RPC. If the call fails the strip renders nothing rather
// than invented numbers, so the page never depends on Supabase.
export default function LiveImpactStrip() {
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.rpc("live_impact_stats");
        if (cancelled) return;
        setStats(resolveLiveStats(data as LiveStats[] | null, error));
      } catch {
        if (!cancelled) setStats(null);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loaded && !stats) return null;

  return (
    <section className="border-y border-white/5 bg-[#0F131C]/40">
      <div className="container mx-auto px-6 py-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-brand-cyan whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse" />
          Live
        </div>
        <Stat icon={<Activity size={14} />} value={stats?.active_pilots ?? 0} label="pilots approved or running" loaded={loaded} />
        <Stat icon={<Truck size={14} />} value={stats?.total_fleets ?? 0} label="fleets" loaded={loaded} />
        <Stat icon={<Building2 size={14} />} value={stats?.total_cities ?? 0} label="cities" loaded={loaded} />
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
