import { useEffect, useRef, useState } from "react";
import { RefreshCw, WifiOff, Loader2 } from "lucide-react";

/**
 * Self-contained live camera card for the redesign. Plays public TxDOT HLS
 * feeds and, crucially, NEVER falls back to the cruze-web.mp4 promo clip (that
 * was misleading on a "this is a real road, right now" section).
 *
 * Reliability, per HLS best practice: on a fatal error it fails over to the
 * next Texas corridor automatically; if every feed is down it shows an honest
 * "reconnecting" state and retries on a timer. So the section shows a real road
 * whenever any feed is up, and an honest offline state otherwise.
 */

export type Feed = { id: number; city: string; location: string; url: string };

export const FEEDS: Feed[] = [
  { id: 3, city: "Austin", location: "IH-35", url: "https://s70.us-east-1.skyvdn.com:443/rtplive/TX_AUS_263/playlist.m3u8" },
  { id: 1, city: "Dallas", location: "IH-635", url: "https://s70.us-east-1.skyvdn.com:443/rtplive/TX_DAL_001/playlist.m3u8" },
  { id: 2, city: "Houston", location: "IH-45", url: "https://s70.us-east-1.skyvdn.com:443/rtplive/TX_HOU_1002/playlist.m3u8" },
  { id: 4, city: "San Antonio", location: "IH-10", url: "https://s70.us-east-1.skyvdn.com:443/rtplive/TX_AUS_262/playlist.m3u8" },
];

const body = "'Inter Tight', ui-sans-serif, system-ui, sans-serif";
const line = "rgba(255,255,255,0.10)";

type Status = "connecting" | "live" | "offline";

export default function LiveCameras() {
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<Status>("connecting");
  const videoRef = useRef<HTMLVideoElement>(null);
  const failed = useRef<Set<number>>(new Set());
  const retry = useRef<number>();

  const scheduleRetry = () => {
    window.clearTimeout(retry.current);
    retry.current = window.setTimeout(() => {
      failed.current.clear();
      setStatus("connecting");
      setIndex(0);
    }, 15000);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let hls: any = null;
    let cancelled = false;
    setStatus("connecting");

    const onLive = () => {
      if (cancelled) return;
      failed.current.clear();
      setStatus("live");
      video.play().catch(() => {});
    };

    const onFail = () => {
      if (cancelled) return;
      failed.current.add(index);
      const next = FEEDS.findIndex((_, i) => !failed.current.has(i));
      if (next === -1) {
        setStatus("offline");
        scheduleRetry();
      } else {
        setIndex(next); // re-runs effect with the next corridor
      }
    };

    const load = () => {
      if (cancelled) return;
      const url = FEEDS[index].url;
      const Hls = (window as any).Hls;
      if (Hls && Hls.isSupported()) {
        hls = new Hls({ manifestLoadingTimeOut: 5000, manifestLoadingMaxRetry: 0, levelLoadingTimeOut: 5000, levelLoadingMaxRetry: 0, fragLoadingMaxRetry: 2 });
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, onLive);
        hls.on(Hls.Events.ERROR, (_e: any, data: any) => { if (data.fatal) onFail(); });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = url;
        video.addEventListener("loadeddata", onLive, { once: true });
        video.addEventListener("error", onFail, { once: true });
      } else {
        onFail();
      }
    };

    if (typeof window !== "undefined" && !(window as any).Hls) {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/hls.js@latest";
      s.async = true;
      s.onload = load;
      document.body.appendChild(s);
    } else {
      load();
    }

    return () => { cancelled = true; if (hls) hls.destroy(); };
  }, [index]);

  useEffect(() => () => window.clearTimeout(retry.current), []);

  const pick = (i: number) => {
    window.clearTimeout(retry.current);
    failed.current.clear();
    setStatus("connecting");
    setIndex(i);
  };

  const cur = FEEDS[index];

  return (
    <div className="rounded-2xl overflow-hidden border shadow-2xl" style={{ borderColor: line, background: "#000" }}>
      <div className="aspect-video relative">
        <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline style={{ opacity: status === "live" ? 1 : 0.25, transition: "opacity .3s" }} />

        {/* live / connecting badge */}
        {status !== "offline" && (
          <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs text-white" style={{ background: "rgba(0,0,0,0.55)", fontFamily: body }}>
            {status === "live" ? (
              <><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> LIVE <span className="opacity-50">·</span> {cur.city}, {cur.location}</>
            ) : (
              <><Loader2 size={12} className="animate-spin" /> Connecting <span className="opacity-50">·</span> {cur.city}</>
            )}
          </div>
        )}

        {/* honest offline state — no promo clip */}
        {status === "offline" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6" style={{ background: "rgba(7,9,12,0.9)", fontFamily: body }}>
            <WifiOff size={26} className="mb-3" style={{ color: "rgba(255,255,255,0.55)" }} />
            <div className="text-white font-medium">Live feed is reconnecting</div>
            <div className="text-sm mt-1 max-w-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Public TxDOT cameras drop now and then. Trying again automatically.</div>
            <button onClick={() => pick(0)} className="mt-4 inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full" style={{ background: "rgba(255,255,255,0.1)", border: `1px solid ${line}`, color: "#fff" }}>
              <RefreshCw size={13} /> Try now
            </button>
          </div>
        )}
      </div>

      {/* corridor tabs */}
      <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto" style={{ background: "#07090C" }}>
        {FEEDS.map((f, i) => (
          <button key={f.id} onClick={() => pick(i)} className="text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors" style={{ fontFamily: body, color: i === index ? "#fff" : "rgba(255,255,255,0.5)", background: i === index ? "rgba(255,255,255,0.12)" : "transparent" }}>{f.city}</button>
        ))}
      </div>
    </div>
  );
}
