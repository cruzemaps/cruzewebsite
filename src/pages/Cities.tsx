import MarketingLayout from "@/components/marketing/MarketingLayout";
import SEO from "@/components/SEO";
import { Link } from "react-router-dom";
import { CITIES } from "@/content/cities";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, MapPin } from "lucide-react";

export default function Cities() {
  return (
    <MarketingLayout>
      <SEO
        title="Cruze Pilot Cities | Where Swarm Routing Is Live"
        description="Top US metros by congestion cost. See where Cruze pilots are active, in discussion, or under evaluation."
      />
      <section className="container mx-auto px-6 py-24 max-w-6xl">
        <h1 className="font-display text-4xl md:text-6xl font-bold mb-4">Cruze across the US.</h1>
        <p className="text-white/60 mb-12 text-lg max-w-2xl">
          Each metro has a per-corridor pilot snapshot and the projected impact of swarm coordination on its primary congestion bottlenecks.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CITIES.map((c) => (
            <Link
              key={c.slug}
              to={`/cities/${c.slug}`}
              className="group rounded-xl border border-white/10 bg-[#0F131C] p-5 hover:border-brand-cyan/40 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-brand-cyan" />
                  <span className="font-display font-semibold">{c.name}, {c.state}</span>
                </div>
                <PilotBadge status={c.pilotStatus} />
              </div>
              <div className="text-xs text-white/50 grid grid-cols-2 gap-y-2 mb-4">
                <div>Pop: {c.metroPopulation}</div>
                <div>Rank: #{c.congestionRank}</div>
                <div>{c.hoursLostPerDriver} hrs/driver lost</div>
                <div>{c.fuelWastedPerDriverGal} gal/driver wasted</div>
              </div>
              <div className="text-xs text-white/40 line-clamp-2">{c.notes}</div>
              <div className="flex items-center gap-1.5 mt-3 text-brand-cyan text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                See coverage <ArrowRight size={12} />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </MarketingLayout>
  );
}

function PilotBadge({ status }: { status: "active" | "in_discussion" | "target" }) {
  const map = {
    active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    in_discussion: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    target: "bg-white/5 text-white/50 border-white/15",
  };
  const label = { active: "Active", in_discussion: "In discussion", target: "Target" };
  return <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border ${map[status]}`}>{label[status]}</span>;
}
