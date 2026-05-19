import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PendingExploreSection() {
  const [trucks, setTrucks] = useState(50);
  const [milesPerTruck, setMilesPerTruck] = useState(80000);
  const [mpg, setMpg] = useState(6.5);
  const [fuelPrice, setFuelPrice] = useState(3.85);

  const annualMiles = trucks * milesPerTruck;
  const annualGallons = annualMiles / Math.max(mpg, 1);
  const fuelSaved = annualGallons * 0.11;
  const fuelDollars = Math.round(fuelSaved * fuelPrice);
  const driverHours = Math.round(trucks * 1.5 * 50);
  const co2Tons = Math.round((fuelSaved * 10.21) / 1000);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="space-y-6"
    >
      <div className="text-center mb-2">
        <div className="text-[11px] uppercase tracking-widest text-brand-cyan font-semibold mb-1">While you wait</div>
        <h3 className="font-display text-2xl font-bold">Get a feel for what Cruze does for fleets like yours</h3>
      </div>

      <Card className="bg-[#0F131C] border-white/10">
        <CardContent className="p-6">
          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-6">
            <div>
              <h4 className="font-display font-semibold text-lg mb-1">Quick savings calculator</h4>
              <p className="text-white/50 text-sm mb-5">
                Conservative pilot averages: 11% fuel reduction, 1.5 reclaimed driver-hours per week, 50 working weeks
                per year.
              </p>
              <div className="space-y-4">
                <ExploreSlider
                  label="Number of trucks"
                  value={trucks}
                  setValue={setTrucks}
                  min={5}
                  max={2000}
                  step={5}
                  format={(v) => `${v.toLocaleString()} trucks`}
                />
                <ExploreSlider
                  label="Miles per truck per year"
                  value={milesPerTruck}
                  setValue={setMilesPerTruck}
                  min={20000}
                  max={150000}
                  step={1000}
                  format={(v) => `${v.toLocaleString()} mi`}
                />
                <ExploreSlider
                  label="Fleet average MPG"
                  value={mpg}
                  setValue={setMpg}
                  min={4}
                  max={12}
                  step={0.1}
                  format={(v) => `${v.toFixed(1)} mpg`}
                />
                <div>
                  <Label className="text-white/70 text-sm mb-2 block">Fuel price ($/gal)</Label>
                  <Input
                    type="number"
                    step={0.05}
                    value={fuelPrice}
                    onChange={(e) => setFuelPrice(parseFloat(e.target.value) || 0)}
                    className="bg-white/5 border-white/10 text-white max-w-[140px]"
                  />
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-brand-orange/15 to-brand-cyan/10 border border-brand-orange/30 p-6 flex flex-col">
              <div className="text-xs uppercase tracking-widest text-brand-cyan mb-1">Estimated annual fuel savings</div>
              <div className="font-display text-5xl font-bold mb-1">${fuelDollars.toLocaleString()}</div>
              <div className="text-white/40 text-xs mb-5">across {trucks.toLocaleString()} trucks</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <ResultTile label="Driver-hours reclaimed" value={`${driverHours.toLocaleString()} hr/yr`} />
                <ResultTile label="Tons CO₂ avoided" value={`${co2Tons.toLocaleString()} t`} />
                <ResultTile label="Fuel saved" value={`${Math.round(fuelSaved).toLocaleString()} gal`} />
                <ResultTile label="Hours per truck/yr" value={`${Math.round(driverHours / trucks).toLocaleString()}`} />
              </div>
              <p className="text-[11px] text-white/40 leading-relaxed mt-auto pt-5">
                These are projections. Your real numbers come from your 30-day pilot baseline once you're approved,
                using your actual telematics data (not these inputs).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <ExploreLink
          to="/insights/phantom-traffic-jams-explained"
          eyebrow="Deep dive"
          title="Why phantom jams happen and how Cruze dissolves them"
          body="The physics + driver math behind 'traffic that has no cause'."
        />
        <ExploreLink
          to="/insights/fleet-economics-of-stop-and-go"
          eyebrow="Economics"
          title="The hidden cost of stop-and-go for your trucks"
          body="Per-mile fuel breakdown and the marginal-returns curve."
        />
      </div>

      <Card className="bg-[#0F131C] border-white/10">
        <CardContent className="p-6">
          <h4 className="font-display font-semibold text-lg mb-1">Plugs into your FMS in under a day</h4>
          <p className="text-white/50 text-sm mb-4">No rip-and-replace. Cruze runs alongside your existing telematics.</p>
          <div className="flex flex-wrap gap-2">
            {["Samsara", "Geotab", "Motive", "Verizon Connect", "Trimble", "Omnitracs"].map((name) => (
              <span key={name} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs">
                {name}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ExploreSlider({
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
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => setValue(parseFloat(e.target.value))}
        className="w-full accent-brand-cyan"
      />
    </div>
  );
}

function ResultTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/5 p-3">
      <div className="font-display font-bold text-base text-white tabular-nums">{value}</div>
      <div className="text-[11px] text-white/50 mt-0.5">{label}</div>
    </div>
  );
}

function ExploreLink({ to, eyebrow, title, body }: { to: string; eyebrow: string; title: string; body: string }) {
  return (
    <Link
      to={to}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl border border-white/10 bg-[#0F131C] p-5 hover:border-brand-cyan/40 transition-colors group"
    >
      <div className="text-[10px] uppercase tracking-widest text-brand-cyan font-semibold mb-2">{eyebrow}</div>
      <div className="font-display font-semibold mb-1 group-hover:text-brand-cyan">{title}</div>
      <div className="text-white/60 text-sm leading-relaxed">{body}</div>
    </Link>
  );
}
