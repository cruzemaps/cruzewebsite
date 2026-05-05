import { useEffect, useRef, useState } from "react";
import MarketingLayout from "@/components/marketing/MarketingLayout";
import SEO from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, MapPin, Radio } from "lucide-react";

// Same camera list used inside the InteractiveLab on /investors. Surfaced
// here as a standalone, easily-findable page so the camera feed isn't only
// behind the investor tier-gate.
const CAMERAS = [
  { id: 1, city: "Dallas", location: "IH-635", url: "https://s70.us-east-1.skyvdn.com:443/rtplive/TX_DAL_001/playlist.m3u8" },
  { id: 2, city: "Houston", location: "IH-45", url: "https://s70.us-east-1.skyvdn.com:443/rtplive/TX_HOU_1002/playlist.m3u8" },
  { id: 3, city: "Austin", location: "IH-35", url: "https://s70.us-east-1.skyvdn.com:443/rtplive/TX_AUS_263/playlist.m3u8" },
  { id: 4, city: "San Antonio", location: "IH-10", url: "https://s70.us-east-1.skyvdn.com:443/rtplive/TX_AUS_262/playlist.m3u8" },
  { id: 5, city: "Fort Worth", location: "FM-1709 @ Brock", url: "https://s70.us-east-1.skyvdn.com:443/rtplive/TX_DAL_002/playlist.m3u8" },
  { id: 6, city: "El Paso", location: "IH-10 @ Lee Trevino", url: "https://s70.us-east-1.skyvdn.com:443/rtplive/TX_ELP_242/playlist.m3u8" },
];

function HlsPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let hls: any = null;
    const init = () => {
      const video = videoRef.current;
      if (!video) return;
      const Hls = (window as any).Hls;
      if (Hls && Hls.isSupported()) {
        hls = new Hls({ maxBufferLength: 10, maxMaxBufferLength: 20 });
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
        video.addEventListener("loadedmetadata", () => video.play().catch(() => {}));
      }
    };
    if (typeof window !== "undefined" && !(window as any).Hls) {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/hls.js@latest";
      script.async = true;
      script.onload = init;
      document.body.appendChild(script);
    } else {
      init();
    }
    return () => {
      if (hls) hls.destroy();
    };
  }, [src]);

  return <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />;
}

export default function Cameras() {
  const [active, setActive] = useState(CAMERAS[2]); // default Austin

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
                <HlsPlayer key={active.id} src={active.url} />
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
                  <div className="text-xs text-white/40 mt-0.5">Source: TxDOT public traffic camera feed</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Camera list */}
          <div className="space-y-3">
            {CAMERAS.map((cam) => (
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
