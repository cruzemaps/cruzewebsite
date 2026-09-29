import { useEffect, useRef, useState } from "react";
import { RefreshCw, WifiOff, Loader2 } from "lucide-react";
import { LIVE_CAMERAS } from "@/lib/liveCameras";
import { useHlsCamera } from "@/lib/useHlsCamera";

/**
 * Self-contained live camera card for the homepage. Plays public TxDOT HLS
 * feeds (tokened stream URLs resolved at play time — see
 * src/lib/liveCameras.ts) and, crucially, NEVER falls back to the
 * cruze-web.mp4 promo clip (that was misleading on a "this is a real road,
 * right now" section).
 *
 * Reliability: on a fatal error it fails over to the next Texas city
 * automatically; if every feed is down it shows an honest "reconnecting"
 * state and retries on a timer. So the section shows a real road whenever
 * any feed is up, and an honest offline state otherwise.
 */

const FEEDS = LIVE_CAMERAS.slice(0, 4); // Austin, Dallas, Houston, San Antonio

const body = "'Inter Tight', ui-sans-serif, system-ui, sans-serif";
const line = "rgba(255,255,255,0.10)";

type Status = "connecting" | "live" | "offline";

export default function LiveCameras() {
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<Status>("connecting");
  const [ready, setReady] = useState(false); // lazy: only start once near viewport
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const failed = useRef<Set<number>>(new Set());
  const retry = useRef<number>();

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => { if (entries.some((e) => e.isIntersecting)) { setReady(true); io.disconnect(); } },
      { rootMargin: "300px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const scheduleRetry = () => {
    window.clearTimeout(retry.current);
    retry.current = window.setTimeout(() => {
      failed.current.clear();
      setStatus("connecting");
      setIndex(0);
    }, 15000);
  };

  const onLive = () => {
    failed.current.clear();
    setStatus("live");
  };

  const onFail = () => {
    failed.current.add(index);
    const next = FEEDS.findIndex((_, i) => !failed.current.has(i));
    if (next === -1) {
      setStatus("offline");
      scheduleRetry();
    } else {
      setStatus("connecting");
      setIndex(next);
    }
  };

  useHlsCamera(videoRef, ready && status !== "offline" ? FEEDS[index].id : null, onLive, onFail);

  useEffect(() => () => window.clearTimeout(retry.current), []);

  const pick = (i: number) => {
    window.clearTimeout(retry.current);
    failed.current.clear();
    setStatus("connecting");
    setIndex(i);
  };

  const cur = FEEDS[index];

  return (
    <div ref={cardRef} className="rounded-2xl overflow-hidden border shadow-2xl" style={{ borderColor: line, background: "#000" }}>
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
        {status === "live" && (
          <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full text-[10px] text-white/70" style={{ background: "rgba(0,0,0,0.55)", fontFamily: body }}>
            Public TxDOT camera · via DriveTexas
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

      {/* city tabs */}
      <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto" style={{ background: "#07090C" }}>
        {FEEDS.map((f, i) => (
          <button key={f.id} onClick={() => pick(i)} className="text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors" style={{ fontFamily: body, color: i === index ? "#fff" : "rgba(255,255,255,0.5)", background: i === index ? "rgba(255,255,255,0.12)" : "transparent" }}>{f.city}</button>
        ))}
      </div>
    </div>
  );
}
