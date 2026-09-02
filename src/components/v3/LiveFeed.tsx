import { useEffect, useRef, useState } from "react";
import { RefreshCw, WifiOff, Loader2 } from "lucide-react";
import { LIVE_CAMERAS, snapshotUrl } from "@/lib/liveCameras";

/**
 * Self-contained live camera card for the homepage. Renders public City of
 * Austin traffic-camera snapshots (the old TxDOT HLS streams went behind
 * signed-token auth — see src/lib/liveCameras.ts) and, crucially, NEVER falls
 * back to the cruze-web.mp4 promo clip (that was misleading on a "this is a
 * real road, right now" section).
 *
 * Reliability: on a load error it fails over to the next corridor
 * automatically; if every camera is down it shows an honest "reconnecting"
 * state and retries on a timer. Refreshes preload off-DOM and swap in only
 * once loaded, so the visible frame never blanks mid-refresh.
 */

const FEEDS = LIVE_CAMERAS.slice(0, 4);
const REFRESH_MS = 60_000;

const body = "'Inter Tight', ui-sans-serif, system-ui, sans-serif";
const line = "rgba(255,255,255,0.10)";

type Status = "connecting" | "live" | "offline";

export default function LiveCameras() {
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<Status>("connecting");
  const [bust, setBust] = useState(0); // 0 = not started; lazy-init near viewport
  const [src, setSrc] = useState<string | null>(null); // last successfully loaded frame
  const cardRef = useRef<HTMLDivElement>(null);
  const failed = useRef<Set<number>>(new Set());
  const retry = useRef<number>();

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => { if (entries.some((e) => e.isIntersecting)) { setBust(Date.now()); io.disconnect(); } },
      { rootMargin: "300px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Periodic refresh while live: a new bust value re-runs the preload effect.
  useEffect(() => {
    if (status !== "live") return;
    const t = window.setInterval(() => setBust(Date.now()), REFRESH_MS);
    return () => window.clearInterval(t);
  }, [status]);

  const scheduleRetry = () => {
    window.clearTimeout(retry.current);
    retry.current = window.setTimeout(() => {
      failed.current.clear();
      setStatus("connecting");
      setIndex(0);
      setBust(Date.now());
    }, 15000);
  };

  // Preload the current camera's snapshot off-DOM; only swap the visible
  // frame once it has fully loaded. On error, fail over to the next camera.
  useEffect(() => {
    if (bust === 0) return;
    const cam = FEEDS[index];
    const url = snapshotUrl(cam.id, bust);
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      failed.current.clear();
      setSrc(url);
      setStatus("live");
    };
    img.onerror = () => {
      if (cancelled) return;
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
    img.src = url;
    return () => { cancelled = true; };
  }, [index, bust]);

  useEffect(() => () => window.clearTimeout(retry.current), []);

  const pick = (i: number) => {
    window.clearTimeout(retry.current);
    failed.current.clear();
    setStatus("connecting");
    setIndex(i);
    setBust(Date.now());
  };

  const cur = FEEDS[index];

  return (
    <div ref={cardRef} className="rounded-2xl overflow-hidden border shadow-2xl" style={{ borderColor: line, background: "#000" }}>
      <div className="aspect-video relative">
        {src && (
          <img
            src={src}
            alt={`Live traffic camera: ${cur.location}, Austin`}
            className="w-full h-full object-cover"
            style={{ opacity: status === "live" ? 1 : 0.25, transition: "opacity .3s" }}
          />
        )}

        {/* live / connecting badge */}
        {status !== "offline" && (
          <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs text-white" style={{ background: "rgba(0,0,0,0.55)", fontFamily: body }}>
            {status === "live" ? (
              <><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> LIVE SNAPSHOT <span className="opacity-50">·</span> {cur.location}</>
            ) : (
              <><Loader2 size={12} className="animate-spin" /> Connecting <span className="opacity-50">·</span> {cur.corridor}</>
            )}
          </div>
        )}
        {status === "live" && (
          <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full text-[10px] text-white/70" style={{ background: "rgba(0,0,0,0.55)", fontFamily: body }}>
            Public City of Austin camera · refreshes automatically
          </div>
        )}

        {/* honest offline state — no promo clip */}
        {status === "offline" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6" style={{ background: "rgba(7,9,12,0.9)", fontFamily: body }}>
            <WifiOff size={26} className="mb-3" style={{ color: "rgba(255,255,255,0.55)" }} />
            <div className="text-white font-medium">Live feed is reconnecting</div>
            <div className="text-sm mt-1 max-w-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Public traffic cameras drop now and then. Trying again automatically.</div>
            <button onClick={() => pick(0)} className="mt-4 inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full" style={{ background: "rgba(255,255,255,0.1)", border: `1px solid ${line}`, color: "#fff" }}>
              <RefreshCw size={13} /> Try now
            </button>
          </div>
        )}
      </div>

      {/* corridor tabs */}
      <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto" style={{ background: "#07090C" }}>
        {FEEDS.map((f, i) => (
          <button key={f.id} onClick={() => pick(i)} className="text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors" style={{ fontFamily: body, color: i === index ? "#fff" : "rgba(255,255,255,0.5)", background: i === index ? "rgba(255,255,255,0.12)" : "transparent" }}>{f.corridor}</button>
        ))}
      </div>
    </div>
  );
}
