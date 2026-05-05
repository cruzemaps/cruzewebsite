import { Link, Navigate, useParams } from "react-router-dom";
import MarketingLayout from "@/components/marketing/MarketingLayout";
import SEO from "@/components/SEO";
import { findCity } from "@/content/cities";
import { LANES } from "@/content/lanes";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, MapPin, TrendingDown, Fuel, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/seo";

export default function CityDetail() {
  const { slug } = useParams<{ slug: string }>();
  const city = slug ? findCity(slug) : undefined;

  if (!city) return <Navigate to="/cities" replace />;

  // Naive but effective: 11% reduction on the per-driver hours/fuel waste numbers.
  const hoursReclaimed = Math.round(city.hoursLostPerDriver * 0.11);
  const fuelReclaimed = Math.round(city.fuelWastedPerDriverGal * 0.11);
  const lanesHere = LANES.filter((l) => l.metroEndpoints.includes(city.slug));

  const title = `Cruze in ${city.name}, ${city.state} | Swarm Routing for ${city.name} Traffic`;
  const description = `${city.name} drivers lose ${city.hoursLostPerDriver} hours and ${city.fuelWastedPerDriverGal} gallons per year to congestion. See where Cruze coordinates speeds across ${city.primaryCorridors.join(", ")} and what swarm intelligence can recover.`;

  return (
    <MarketingLayout>
      <SEO
        title={title}
        description={description}
        canonicalOverride={`${SITE.url}/cities/${city.slug}`}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "Place",
            name: `${city.name}, ${city.state}`,
            address: { "@type": "PostalAddress", addressLocality: city.name, addressRegion: city.state, addressCountry: "US" },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Cities", item: `${SITE.url}/cities` },
              { "@type": "ListItem", position: 2, name: `${city.name}, ${city.state}`, item: `${SITE.url}/cities/${city.slug}` },
            ],
          },
        ]}
      />

      <article className="container mx-auto px-6 py-16 max-w-5xl">
        <Link to="/cities" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-8">
          <ArrowLeft size={14} /> All cities
        </Link>

        <header className="mb-12">
          <div className="flex items-center gap-3 mb-3">
            <MapPin size={18} className="text-brand-cyan" />
            <span className="text-white/50 text-sm">Pilot snapshot</span>
            <PilotBadge status={city.pilotStatus} />
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-4">{city.name}, {city.state}</h1>
          <p className="text-white/70 text-lg max-w-3xl">{city.notes}</p>
        </header>

        <div className="grid md:grid-cols-4 gap-4 mb-12">
          <StatTile icon={<Clock size={18} />} label="Hours lost / driver / year" value={city.hoursLostPerDriver.toString()} />
          <StatTile icon={<Fuel size={18} />} label="Gallons wasted / driver / year" value={city.fuelWastedPerDriverGal.toString()} />
          <StatTile icon={<TrendingDown size={18} />} label="Hours reclaimable w/ Cruze" value={`~${hoursReclaimed}`} accent />
          <StatTile icon={<TrendingDown size={18} />} label="Gallons reclaimable w/ Cruze" value={`~${fuelReclaimed}`} accent />
        </div>

        <Card className="bg-[#0F131C] border-white/10 mb-12">
          <CardContent className="p-8">
            <h2 className="font-display text-2xl font-bold mb-4">Primary congestion corridors</h2>
            <p className="text-white/60 mb-6">{city.name}'s recurring bottlenecks where swarm coordination has the highest marginal impact:</p>
            <ul className="grid sm:grid-cols-2 gap-3">
              {city.primaryCorridors.map((corridor) => (
                <li key={corridor} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                  <div className="w-2 h-2 rounded-full bg-brand-cyan" />
                  <span className="font-medium">{corridor}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {lanesHere.length > 0 && (
          <Card className="bg-[#0F131C] border-white/10 mb-12">
            <CardContent className="p-8">
              <h2 className="font-display text-2xl font-bold mb-4">Freight lanes touching {city.name}</h2>
              <div className="space-y-3">
                {lanesHere.map((lane) => (
                  <Link
                    key={lane.slug}
                    to={`/lanes/${lane.slug}`}
                    className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
                  >
                    <div>
                      <div className="font-display font-semibold">{lane.origin} → {lane.destination}</div>
                      <div className="text-xs text-white/50 mt-1">
                        {lane.distanceMiles} mi · {lane.averageDriveTimeHours}h drive · +{lane.congestionDelayHours}h delay
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-white/40 group-hover:text-brand-cyan group-hover:translate-x-1 transition-all" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="rounded-2xl border border-brand-cyan/20 bg-gradient-to-br from-brand-cyan/15 to-transparent p-8 text-center">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">
            {city.pilotStatus === "active" ? "Want a corridor on Cruze too?" : `Want Cruze in ${city.name}?`}
          </h2>
          <p className="text-white/70 mb-6 max-w-xl mx-auto">
            {city.pilotStatus === "active"
              ? `${city.name} has an active pilot. Get yours added to the next wave.`
              : `We prioritize cities by stakeholder pull. Tell us why ${city.name} should be next.`}
          </p>
          <Button asChild className="bg-brand-cyan text-[#0B0E14] hover:bg-brand-cyan/90 font-bold rounded-full px-6 h-12">
            <Link to="/for-cities">Talk to the team</Link>
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
        <div className={`font-display text-3xl font-bold tabular-nums mb-1 ${accent ? "text-brand-cyan" : ""}`}>{value}</div>
        <div className="text-white/50 text-xs">{label}</div>
      </CardContent>
    </Card>
  );
}

function PilotBadge({ status }: { status: "active" | "in_discussion" | "target" }) {
  const map = {
    active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    in_discussion: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    target: "bg-white/5 text-white/50 border-white/15",
  };
  const label = { active: "Active pilot", in_discussion: "In discussion", target: "Target city" };
  return <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border ${map[status]}`}>{label[status]}</span>;
}
