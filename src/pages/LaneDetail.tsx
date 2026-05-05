import { Link, Navigate, useParams } from "react-router-dom";
import MarketingLayout from "@/components/marketing/MarketingLayout";
import SEO from "@/components/SEO";
import { findLane } from "@/content/lanes";
import { findCity } from "@/content/cities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, MapPin, Truck, Clock, TrendingDown, Fuel } from "lucide-react";
import { SITE } from "@/lib/seo";

export default function LaneDetail() {
  const { slug } = useParams<{ slug: string }>();
  const lane = slug ? findLane(slug) : undefined;

  if (!lane) return <Navigate to="/lanes" replace />;

  // Per-trip projections at conservative pilot averages
  const reclaimableHours = +(lane.congestionDelayHours * 0.4).toFixed(1);
  // Class 8 at 6.5 mpg averaging $3.85/gal: per-trip fuel ≈ distance/6.5 * $3.85
  const tripGallons = +(lane.distanceMiles / 6.5).toFixed(1);
  const tripFuelCost = +(tripGallons * 3.85).toFixed(0);
  const tripFuelSaved = +(tripFuelCost * 0.11).toFixed(0);

  const originCity = findCity(lane.metroEndpoints[0]);
  const destCity = findCity(lane.metroEndpoints[1]);

  const title = `${lane.origin} to ${lane.destination} | Cruze Lane Coordination`;
  const description = `${lane.origin} to ${lane.destination} via ${lane.primaryRoute}: ${lane.distanceMiles} miles, ${lane.averageDriveTimeHours}h typical drive with +${lane.congestionDelayHours}h peak congestion delay. See Cruze's per-trip impact for fleets running this lane.`;

  return (
    <MarketingLayout>
      <SEO
        title={title}
        description={description}
        canonicalOverride={`${SITE.url}/lanes/${lane.slug}`}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "TravelAction",
            name: `${lane.origin} to ${lane.destination}`,
            distance: { "@type": "Distance", value: `${lane.distanceMiles} mi` },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Lanes", item: `${SITE.url}/lanes` },
              { "@type": "ListItem", position: 2, name: `${lane.origin} → ${lane.destination}`, item: `${SITE.url}/lanes/${lane.slug}` },
            ],
          },
        ]}
      />

      <article className="container mx-auto px-6 py-16 max-w-4xl">
        <Link to="/lanes" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-8">
          <ArrowLeft size={14} /> All lanes
        </Link>

        <header className="mb-12">
          <div className="flex items-center gap-2 text-sm text-white/50 mb-3">
            <Truck size={16} className="text-brand-orange" />
            <span>US freight lane #{lane.freightVolumeRank}</span>
          </div>
          <h1 className="font-display text-3xl md:text-5xl font-bold mb-4">
            {lane.origin} <span className="text-brand-cyan">→</span> {lane.destination}
          </h1>
          <p className="text-white/60 text-lg max-w-3xl">{lane.notes}</p>
        </header>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <StatTile icon={<MapPin size={18} />} label="Distance" value={`${lane.distanceMiles} mi`} />
          <StatTile icon={<Clock size={18} />} label="Typical drive" value={`${lane.averageDriveTimeHours} h`} />
          <StatTile icon={<TrendingDown size={18} />} label="Reclaimable / trip" value={`~${reclaimableHours} h`} accent />
          <StatTile icon={<Fuel size={18} />} label="Fuel saved / trip" value={`~$${tripFuelSaved}`} accent />
        </div>

        <Card className="bg-[#0F131C] border-white/10 mb-8">
          <CardContent className="p-8">
            <h2 className="font-display text-2xl font-bold mb-3">How the lane breaks down</h2>
            <p className="text-white/70 leading-relaxed mb-4">
              At free flow, this lane runs {lane.distanceMiles} miles via {lane.primaryRoute} in roughly {lane.averageDriveTimeHours} hours. Peak periods add about {lane.congestionDelayHours} hours of delay, almost entirely caused by phantom-jam waves in the metro endpoints.
            </p>
            <p className="text-white/70 leading-relaxed">
              For a 50-truck fleet running this lane daily, the projected annual recovery is{" "}
              <strong className="text-brand-cyan">{Math.round(reclaimableHours * 50 * 250)} driver-hours</strong> and{" "}
              <strong className="text-brand-cyan">${(tripFuelSaved * 50 * 250).toLocaleString()}</strong> in fuel, before accounting for downstream insurance and maintenance benefits.
            </p>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {originCity && (
            <Link to={`/cities/${originCity.slug}`} className="rounded-xl border border-white/10 bg-[#0F131C] p-5 hover:border-brand-cyan/40 group">
              <div className="text-xs text-white/40 uppercase tracking-widest mb-2">Origin metro</div>
              <div className="font-display font-bold mb-1 group-hover:text-brand-cyan flex items-center gap-2">
                {originCity.name}, {originCity.state} <ArrowRight size={14} className="opacity-0 group-hover:opacity-100" />
              </div>
              <div className="text-xs text-white/50">{originCity.hoursLostPerDriver} hrs/driver lost annually</div>
            </Link>
          )}
          {destCity && destCity.slug !== originCity?.slug && (
            <Link to={`/cities/${destCity.slug}`} className="rounded-xl border border-white/10 bg-[#0F131C] p-5 hover:border-brand-cyan/40 group">
              <div className="text-xs text-white/40 uppercase tracking-widest mb-2">Destination metro</div>
              <div className="font-display font-bold mb-1 group-hover:text-brand-cyan flex items-center gap-2">
                {destCity.name}, {destCity.state} <ArrowRight size={14} className="opacity-0 group-hover:opacity-100" />
              </div>
              <div className="text-xs text-white/50">{destCity.hoursLostPerDriver} hrs/driver lost annually</div>
            </Link>
          )}
        </div>

        <div className="rounded-2xl border border-brand-orange/20 bg-gradient-to-br from-brand-orange/15 to-transparent p-8 text-center">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">Run this lane often?</h2>
          <p className="text-white/70 mb-6 max-w-xl mx-auto">
            Cruze pilots prioritize fleets with concentrated lane density. Apply with this lane's annual trip count for fast-track review.
          </p>
          <Button asChild className="bg-brand-orange text-[#0B0E14] hover:bg-brand-orange/90 font-bold rounded-full px-6 h-12">
            <Link to="/apply">Apply for the pilot</Link>
          </Button>
        </div>
      </article>
    </MarketingLayout>
  );
}

function StatTile({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <Card className={`bg-[#0F131C] border-white/10 ${accent ? "border-brand-cyan/30" : ""}`}>
      <CardContent className="p-5">
        <div className={`mb-3 ${accent ? "text-brand-cyan" : "text-white/50"}`}>{icon}</div>
        <div className={`font-display text-2xl font-bold tabular-nums mb-1 ${accent ? "text-brand-cyan" : ""}`}>{value}</div>
        <div className="text-white/50 text-xs">{label}</div>
      </CardContent>
    </Card>
  );
}
