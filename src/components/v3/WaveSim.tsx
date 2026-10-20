import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { meanSpeed, startScenario, step, type Ring } from "@/lib/waveSim";

/**
 * Homepage stand-in for live DOT camera video (used while the
 * LIVE_DOT_CAMERAS flag is off, see src/lib/featureFlags.ts). Two identical
 * ring roads start from the same stop-and-go traffic; on the right, one car in
 * 22 follows a Cruze speed cue. It is a simulation and says so on screen.
 * The model lives in src/lib/waveSim.ts.
 */

const body = "'Inter Tight', ui-sans-serif, system-ui, sans-serif";
const line = "rgba(255,255,255,0.10)";
const SPEEDUP = 2; // model seconds per real second, shown on screen
const RUN_FOR = 110; // model seconds after the fork before starting over
// Seeds cycled by the demo and its Restart button. All six seeds in
// src/lib/waveSim.test.ts show the same result; these are the ones where the
// untreated loop reaches full stops soonest, so the contrast shows in time.
const SEEDS = [1, 3, 6, 5];
const DT = 0.1;
const MPH = 2.23694;

// Slow cars red, fast cars cyan.
function speedColor(v: number): string {
  const t = Math.max(0, Math.min(1, v / 7));
  const hue = 0 + t * 185;
  return `hsl(${hue}, 85%, ${52 + t * 6}%)`;
}

function drawRing(ctx: CanvasRenderingContext2D, ring: Ring, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth = Math.max(10, r * 0.16);
  ctx.stroke();
  const carLen = (5 / ring.length) * Math.PI * 2 * 0.85; // radians
  for (const car of ring.cars) {
    const a = (car.x / ring.length) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, a - carLen, a);
    ctx.strokeStyle = car.cruze ? "#E8590C" : speedColor(car.v);
    ctx.lineWidth = Math.max(6, r * 0.1);
    ctx.lineCap = "round";
    ctx.stroke();
    if (car.cruze) {
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a - carLen / 2) * r, cy + Math.sin(a - carLen / 2) * r, Math.max(7, r * 0.11), 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(232,89,12,0.55)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}

type Stats = { stopped: number; mph: number; brakes: number };
const readStats = (r: Ring): Stats => ({
  stopped: r.cars.filter((c) => c.v < 1).length,
  mph: Math.round(meanSpeed(r) * MPH),
  brakes: r.hardBrakes,
});

export default function WaveSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const sim = useRef<{ without: Ring; with: Ring; run: number; t: number } | null>(null);
  const [stats, setStats] = useState<{ without: Stats; with: Stats; t: number } | null>(null);
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const reset = (run: number) => {
      sim.current = { ...startScenario(SEEDS[run % SEEDS.length]), run, t: 0 };
    };
    if (!sim.current) reset(0);

    let visible = false;
    let raf = 0;
    let last = 0;
    let acc = 0;
    let lastStats = 0;

    const draw = () => {
      const s = sim.current;
      const dpr = window.devicePixelRatio || 1;
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const r = Math.min(w / 4, h / 2) * 0.62;
      drawRing(ctx, s.without, w * 0.25, h * 0.5, r);
      drawRing(ctx, s.with, w * 0.75, h * 0.5, r);
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const real = last ? Math.min((now - last) / 1000, 0.1) : 0;
      last = now;
      // Reduced motion: advance in one-second hops instead of smoothly.
      acc += real * SPEEDUP;
      if (reduced && acc < SPEEDUP) return;
      const s = sim.current;
      while (acc >= DT) {
        step(s.without, DT);
        step(s.with, DT);
        s.t += DT;
        acc -= DT;
      }
      if (s.t > RUN_FOR) {
        reset(s.run + 1);
        setRunId((n) => n + 1);
      }
      draw();
      if (now - lastStats > 250) {
        lastStats = now;
        setStats({ without: readStats(sim.current.without), with: readStats(sim.current.with), t: sim.current.t });
      }
    };

    const start = () => {
      if (raf || !visible || document.hidden) return;
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const io = new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting);
      if (visible) start();
      else stop();
    });
    io.observe(wrap);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);
    draw();

    return () => {
      stop();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const restart = () => {
    const run = (sim.current?.run ?? 0) + 1;
    sim.current = { ...startScenario(SEEDS[run % SEEDS.length]), run, t: 0 };
    setRunId((n) => n + 1);
  };

  const panel = (title: string, sub: string, s: Stats | undefined, accent: string) => (
    <div className="flex-1 min-w-0">
      <div className="text-[13px] font-medium text-white" style={{ color: accent }}>{title}</div>
      <div className="text-[11px] text-white/45 mb-1.5">{sub}</div>
      <div className="flex gap-4 text-[11px] text-white/60 tabular-nums">
        <span><span className="text-white text-[13px]">{s ? s.stopped : "-"}</span> stopped</span>
        <span><span className="text-white text-[13px]">{s ? s.mph : "-"}</span> mph avg</span>
        <span><span className="text-white text-[13px]">{s ? s.brakes : "-"}</span> hard brakes</span>
      </div>
    </div>
  );

  return (
    <div className="rounded-2xl overflow-hidden border shadow-2xl" style={{ borderColor: line, background: "#07090C", fontFamily: body }}>
      <div ref={wrapRef} className="aspect-video relative">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          role="img"
          aria-label="Simulation of two identical ring roads with 22 cars each and a stop-and-go wave starting to build. Without Cruze, the wave grows until cars stop. With one car following a Cruze speed cue, the wave fades and traffic flows smoothly."
        />
        <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs text-white" style={{ background: "rgba(0,0,0,0.55)" }}>
          Simulation · not live data · {SPEEDUP}x speed
        </div>
        <button
          onClick={restart}
          className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-white/80 hover:text-white"
          style={{ background: "rgba(0,0,0,0.55)" }}
          aria-label="Restart the simulation"
        >
          <RotateCcw size={12} /> Restart
        </button>
        <div className="absolute bottom-3 left-0 right-0 flex justify-around text-[11px] text-white/60 pointer-events-none">
          <span>Without Cruze</span>
          <span>With Cruze</span>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 px-4 py-3 border-t" style={{ borderColor: line }} key={runId}>
        {panel("Without Cruze", "22 human drivers", stats?.without, "rgba(255,255,255,0.9)")}
        {panel("With Cruze", "1 of 22 cars on a speed cue", stats?.with, "#E8590C")}
      </div>
      <div className="px-4 pb-3 text-[10px] leading-relaxed text-white/40">
        22 cars on a 300 m loop with no bottleneck, using a standard car-following model. Both loops start from the same
        traffic, with a wave starting to build. Red is slow, cyan is moving; the orange car follows the Cruze cue.
        Illustrative only, not a measurement of real roads.
      </div>
    </div>
  );
}
