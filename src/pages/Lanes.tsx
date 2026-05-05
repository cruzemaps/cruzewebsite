import MarketingLayout from "@/components/marketing/MarketingLayout";
import SEO from "@/components/SEO";
import { Link } from "react-router-dom";
import { LANES } from "@/content/lanes";
import { ArrowRight, TrendingDown } from "lucide-react";

export default function Lanes() {
  const sorted = [...LANES].sort((a, b) => a.freightVolumeRank - b.freightVolumeRank);
  return (
    <MarketingLayout>
      <SEO
        title="Top US Trucking Lanes | Cruze Coverage"
        description="Highest-volume US trucking lanes with congestion delay estimates and Cruze coordination potential."
      />
      <section className="container mx-auto px-6 py-24 max-w-5xl">
        <h1 className="font-display text-4xl md:text-6xl font-bold mb-4">Top US lanes.</h1>
        <p className="text-white/60 mb-12 text-lg max-w-2xl">
          Where freight runs heaviest. Coordinated swarm routing has the largest absolute impact on lanes that combine high volume with consistent congestion.
        </p>

        <div className="space-y-3">
          {sorted.map((lane) => {
            const reclaimable = (lane.congestionDelayHours * 0.4).toFixed(1);
            return (
              <Link
                key={lane.slug}
                to={`/lanes/${lane.slug}`}
                className="block rounded-xl border border-white/10 bg-[#0F131C] p-6 hover:border-brand-cyan/40 transition-colors group"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs text-brand-cyan font-display font-bold">#{lane.freightVolumeRank}</span>
                      <h2 className="font-display text-xl font-bold">{lane.origin} → {lane.destination}</h2>
                    </div>
                    <div className="text-xs text-white/50">
                      {lane.distanceMiles} mi · {lane.averageDriveTimeHours}h typical · +{lane.congestionDelayHours}h peak delay · via {lane.primaryRoute}
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-xs text-white/40 uppercase tracking-widest">Reclaimable / trip</div>
                      <div className="font-display text-2xl font-bold text-brand-cyan flex items-center gap-1.5">
                        <TrendingDown size={16} /> {reclaimable}h
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-white/40 group-hover:text-brand-cyan group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </MarketingLayout>
  );
}
