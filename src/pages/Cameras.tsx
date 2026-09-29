import { useRef, useState } from "react";
import MarketingLayout from "@/components/marketing/MarketingLayout";
import SEO from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Loader2, MapPin, Radio, WifiOff } from "lucide-react";
import { LIVE_CAMERAS } from "@/lib/liveCameras";
import { useHlsCamera } from "@/lib/useHlsCamera";

// Same camera list used by the homepage LiveFeed (src/lib/liveCameras.ts).
// Surfaced here as a standalone, easily-findable page so the camera feed
// isn't only on the homepage. Live TxDOT HLS video with the tokened stream
// URL resolved at play time; on failure it shows an honest offline card,
// never the promo clip.

type Status = "connecting" | "live" | "offline";

function HlsPlayer({ id }: { id: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<Status>("connecting");

  useHlsCamera(
    videoRef,
    status === "offline" ? null : id,
    () => setStatus("live"),
    () => setStatus("offline")
  );

  return (
    <>
      <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline style={{ opacity: status === "live" ? 1 : 0.25, transition: "opacity .3s" }} />
      {status === "connecting" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 size={22} className="animate-spin text-white/40" />
        </div>
      )}
      {status === "offline" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 gap-2 bg-[#07090C]/90">
          <WifiOff size={24} className="text-white/50" />
          <div className="text-sm text-white/70">Camera is offline right now</div>
          <div className="text-xs text-white/40">Public TxDOT cameras drop now and then. Pick another camera or come back shortly.</div>
        </div>
      )}
    </>
  );
}

export default function Cameras() {
  const [active, setActive] = useState(LIVE_CAMERAS[0]);
  const [retryKey, setRetryKey] = useState(0);

  const pick = (cam: (typeof LIVE_CAMERAS)[number]) => {
    setActive(cam);
    setRetryKey((k) => k + 1); // remount the player so a failed cam retries on re-select
  };

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
            Public TxDOT camera feeds across Texas corridors where Cruze coordinates flow. Click any camera to switch the main feed.
          </p>
        </div>

        <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
          {/* Main player */}
          <Card className="bg-[#0F131C] border-white/10 overflow-hidden">
            <CardContent className="p-0">
              <div className="aspect-video bg-black relative">
                <HlsPlayer key={`${active.id}-${retryKey}`} id={active.id} />
                <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur text-xs">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="font-medium">LIVE</span>
                  <span className="text-white/60">·</span>
                  <span className="text-white/80">{active.city}: {active.location}</span>
                </div>
              </div>
              <div className="p-5 border-t border-white/5 flex items-center gap-3">
                <Camera size={16} className="text-brand-cyan" />
                <div>
                  <div className="font-display font-semibold">{active.city}: {active.location}</div>
                  <div className="text-xs text-white/40 mt-0.5">Source: TxDOT public traffic camera feed, via DriveTexas</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Camera list */}
          <div className="space-y-3">
            {LIVE_CAMERAS.map((cam) => (
              <button
                key={cam.id}
                onClick={() => pick(cam)}
                className={`w-full text-left rounded-xl border p-4 transition-colors ${
                  active.id === cam.id
                    ? "bg-brand-cyan/10 border-brand-cyan/40"
                    : "bg-[#0F131C] border-white/10 hover:border-brand-cyan/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <MapPin size={14} className={active.id === cam.id ? "text-brand-cyan" : "text-white/40"} />
                  <div className="flex-1 min-w-0">
                    <div className={`font-display font-semibold ${active.id === cam.id ? "text-brand-cyan" : ""}`}>{cam.city}</div>
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
          Feeds are sourced from publicly available state DOT camera streams and may experience occasional outages outside Cruze's control. Cruze does not record or retain camera footage.
        </p>
      </section>
    </MarketingLayout>
  );
}
