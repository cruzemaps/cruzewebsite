import { useEffect, useRef, useState } from "react";
import MarketingLayout from "@/components/marketing/MarketingLayout";
import SEO from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Loader2, MapPin, Radio, WifiOff } from "lucide-react";
import { LIVE_CAMERAS, snapshotUrl } from "@/lib/liveCameras";

// Same camera list used by the homepage LiveFeed (src/lib/liveCameras.ts).
// Surfaced here as a standalone, easily-findable page. These are public City
// of Austin open-data snapshots refreshed on a timer; the old TxDOT HLS
// streams went behind signed-token auth in Sep 2026 and are gone.

const REFRESH_MS = 60_000;

function SnapshotPlayer({ id, alt }: { id: number; alt: string }) {
  const [src, setSrc] = useState<string | null>(null); // last successfully loaded frame
  const [dead, setDead] = useState(false);
  const hasFrame = useRef(false);

  // Preload off-DOM and swap in only once loaded, so the visible frame never
  // blanks mid-refresh. A transient refresh error keeps the last good frame;
  // "offline" only shows when the camera never produced a frame at all.
  useEffect(() => {
    let cancelled = false;
    const load = () => {
      const url = snapshotUrl(id, Date.now());
      const img = new Image();
      img.onload = () => {
        if (cancelled) return;
        hasFrame.current = true;
        setSrc(url);
        setDead(false);
      };
      img.onerror = () => {
        if (cancelled) return;
        if (!hasFrame.current) setDead(true);
      };
      img.src = url;
    };
    load();
    const t = window.setInterval(load, REFRESH_MS);
    return () => { cancelled = true; window.clearInterval(t); };
  }, [id]);

  if (dead) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center px-6 gap-2">
        <WifiOff size={24} className="text-white/50" />
        <div className="text-sm text-white/70">Camera is offline right now</div>
        <div className="text-xs text-white/40">Public cameras drop now and then. Retrying automatically.</div>
      </div>
    );
  }

  if (!src) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 size={22} className="animate-spin text-white/40" />
      </div>
    );
  }

  return <img src={src} alt={alt} className="w-full h-full object-cover" />;
}

export default function Cameras() {
  const [active, setActive] = useState(LIVE_CAMERAS[0]);

  return (
    <MarketingLayout>
      <SEO />
      <section className="container mx-auto px-6 py-16 max-w-6xl">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-cyan/10 text-brand-cyan text-xs uppercase tracking-widest border border-brand-cyan/30 mb-4">
            <Radio className="w-3 h-3 animate-pulse" /> Live feeds
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-3">Live traffic cameras.</h1>
          <p className="text-white/60 text-lg max-w-2xl">
            Public City of Austin camera feeds on the corridors where Cruze coordinates flow. Snapshots refresh automatically. Click any camera to switch the main feed.
          </p>
        </div>

        <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
          {/* Main viewer */}
          <Card className="bg-[#0F131C] border-white/10 overflow-hidden">
            <CardContent className="p-0">
              <div className="aspect-video bg-black relative">
                <SnapshotPlayer key={active.id} id={active.id} alt={`Live traffic camera: ${active.location}, Austin`} />
                <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur text-xs">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="font-medium">LIVE SNAPSHOT</span>
                  <span className="text-white/60">·</span>
                  <span className="text-white/80">{active.location}</span>
                </div>
              </div>
              <div className="p-5 border-t border-white/5 flex items-center gap-3">
                <Camera size={16} className="text-brand-cyan" />
                <div>
                  <div className="font-display font-semibold">{active.location}</div>
                  <div className="text-xs text-white/40 mt-0.5">Source: City of Austin public traffic camera</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Camera list */}
          <div className="space-y-3">
            {LIVE_CAMERAS.map((cam) => (
              <button
                key={cam.id}
                onClick={() => setActive(cam)}
                className={`w-full text-left rounded-xl border p-4 transition-colors ${
                  active.id === cam.id
                    ? "bg-brand-cyan/10 border-brand-cyan/40"
                    : "bg-[#0F131C] border-white/10 hover:border-brand-cyan/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <MapPin size={14} className={active.id === cam.id ? "text-brand-cyan" : "text-white/40"} />
                  <div className="flex-1 min-w-0">
                    <div className={`font-display font-semibold ${active.id === cam.id ? "text-brand-cyan" : ""}`}>{cam.corridor}</div>
                    <div className="text-xs text-white/50 truncate">{cam.location}</div>
                  </div>
                  {active.id === cam.id && (
                    <span className="text-[10px] uppercase tracking-widest text-brand-cyan">Now playing</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-white/40 mt-10 max-w-3xl">
          Feeds are sourced from publicly available City of Austin traffic camera snapshots and may experience occasional outages outside Cruze's control. Cruze does not record or retain camera footage.
        </p>
      </section>
    </MarketingLayout>
  );
}
