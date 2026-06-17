import { useEffect, useRef, useState } from "react";
import { Volume2, ShieldCheck, Navigation, ArrowDown } from "lucide-react";

/**
 * "What the driver sees" — a lightweight, animated mock of the Cruze in-cab
 * advisory (CSS/SVG, no heavy 3D). It cycles through real product states
 * (cruising -> ease off, wave ahead -> cleared) so a visitor sees how the
 * "Advise" step actually feels. Honest: this is the driver experience we are
 * piloting, not a claim of scale. Reduced-motion users get a single static
 * state. Split layout, contextual UI — the patterns that read as a real product.
 */

const accent = "#E8590C";
const text = "#F2F3F5";
const muted = "#9AA0A8";
const line = "rgba(255,255,255,0.10)";
const display = "'Space Grotesk', ui-sans-serif, system-ui, sans-serif";
const body = "'Inter Tight', ui-sans-serif, system-ui, sans-serif";

type Phase = 0 | 1 | 2;
const PHASES: { speed: number; status: string; clear: boolean; foot: string }[] = [
  { speed: 62, status: "All clear", clear: true, foot: "Cruising. Nothing ahead." },
  { speed: 55, status: "Cruze active", clear: false, foot: "Ease off to soak up the wave ahead." },
  { speed: 58, status: "Nice", clear: true, foot: "Wave cleared. Thanks for the help." },
];

function Phone() {
  const [phase, setPhase] = useState<Phase>(1);
  const [speed, setSpeed] = useState(55);
  const raf = useRef(0);

  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setPhase(1); setSpeed(55); return; }

    let cur = 62;
    const tween = (to: number) => {
      const from = cur, start = performance.now(), dur = 1100;
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / dur);
        const e = t * (2 - t);
        cur = from + (to - from) * e;
        setSpeed(cur);
        if (t < 1) raf.current = requestAnimationFrame(step);
      };
      raf.current = requestAnimationFrame(step);
    };

    let i: Phase = 0;
    const go = (idx: Phase) => { setPhase(idx); tween(PHASES[idx].speed); };
    go(0);
    const iv = setInterval(() => { i = ((i + 1) % 3) as Phase; go(i); }, 2900);
    return () => { clearInterval(iv); cancelAnimationFrame(raf.current); };
  }, []);

  const p = PHASES[phase];
  const advisory = phase === 1;

  return (
    <div style={{ perspective: 1400 }}>
      <div
        style={{
          width: "clamp(248px, 78vw, 300px)", aspectRatio: "300 / 620", margin: "0 auto",
          borderRadius: 42, background: "#05060A", border: "1px solid rgba(255,255,255,0.14)",
          boxShadow: "0 40px 90px rgba(0,0,0,0.6), inset 0 0 0 6px #0b0d11",
          transform: "rotateY(-13deg) rotateX(6deg)", transition: "transform .6s ease", position: "relative", overflow: "hidden",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "rotateY(0deg) rotateX(0deg)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "rotateY(-13deg) rotateX(6deg)")}
      >
        {/* screen */}
        <div style={{ position: "absolute", inset: 8, borderRadius: 36, overflow: "hidden", background: "radial-gradient(120% 80% at 50% 0%, #14202e 0%, #0a0e15 55%, #07090d 100%)", fontFamily: body }}>
          {/* dynamic island */}
          <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", width: 70, height: 18, borderRadius: 12, background: "#000", zIndex: 5 }} />

          {/* faint road backdrop */}
          <svg viewBox="0 0 300 600" width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.5 }} preserveAspectRatio="xMidYMid slice">
            <defs><linearGradient id="rd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0d1622" /><stop offset="1" stopColor="#070a0f" /></linearGradient></defs>
            <path d="M120 600 L135 230 H165 L180 600 Z" fill="#10161f" />
            <path d="M148 600 L150 240 L152 600 Z" fill="rgba(233,177,58,0.5)" />
            <circle cx="150" cy="205" r="60" fill="rgba(232,89,12,0.10)" />
          </svg>

          {/* content */}
          <div style={{ position: "absolute", inset: 0, padding: "44px 18px 18px", display: "flex", flexDirection: "column" }}>
            {/* status pill */}
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 12px", borderRadius: 999, background: p.clear ? "rgba(52,199,89,0.14)" : "rgba(232,89,12,0.16)", border: `1px solid ${p.clear ? "rgba(52,199,89,0.4)" : "rgba(232,89,12,0.5)"}` }}>
                <span style={{ width: 7, height: 7, borderRadius: 999, background: p.clear ? "#34c759" : accent, boxShadow: `0 0 8px ${p.clear ? "#34c759" : accent}` }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: p.clear ? "#9be8ac" : "#ffc4a3" }}>{p.status}</span>
              </div>
            </div>

            {/* speedometer */}
            <div style={{ position: "relative", margin: "26px auto 0", width: 168, height: 168 }}>
              <svg viewBox="0 0 168 168" width="168" height="168">
                <circle cx="84" cy="84" r="74" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                <circle cx="84" cy="84" r="74" fill="none" stroke={advisory ? accent : "#34c759"} strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 74} strokeDashoffset={2 * Math.PI * 74 * (1 - Math.min(1, speed / 80))}
                  transform="rotate(-90 84 84)" style={{ transition: "stroke .5s" }} />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontFamily: display, fontWeight: 700, fontSize: 52, lineHeight: 1, color: text }}>{Math.round(speed)}</div>
                <div style={{ fontSize: 11, letterSpacing: 2, color: muted, marginTop: 2 }}>MPH</div>
              </div>
            </div>

            {/* advisory card */}
            <div style={{ marginTop: 22, height: 74, display: "flex", alignItems: "center" }}>
              <div style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 16,
                background: "rgba(232,89,12,0.12)", border: `1px solid rgba(232,89,12,0.45)`,
                opacity: advisory ? 1 : 0, transform: advisory ? "translateY(0)" : "translateY(8px)", transition: "opacity .4s, transform .4s",
              }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <ArrowDown size={18} color="#fff" />
                </div>
                <div>
                  <div style={{ fontFamily: display, fontWeight: 600, color: text, fontSize: 16, lineHeight: 1.1 }}>Ease to 55</div>
                  <div style={{ color: "#ffc4a3", fontSize: 12, marginTop: 2 }}>wave forming ½ mile ahead</div>
                </div>
              </div>
            </div>

            {/* footer line */}
            <div style={{ marginTop: "auto", textAlign: "center", color: muted, fontSize: 12.5, minHeight: 18, transition: "color .4s" }}>{p.foot}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductShowcase() {
  const points = [
    { icon: Volume2, t: "Voice-first. Hands stay on the wheel, eyes on the road." },
    { icon: ShieldCheck, t: "Always optional. It is a suggestion, never a command." },
    { icon: Navigation, t: "Works alongside the nav app you already use." },
  ];
  return (
    <section id="product" className="mx-auto max-w-6xl px-5 sm:px-6 py-16 md:py-28">
      <div className="grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] mb-5" style={{ color: accent, fontFamily: body }}>The driver app</p>
          <h2 className="font-bold tracking-[-0.02em] leading-[1.05]" style={{ fontFamily: display, color: text, fontSize: "clamp(1.9rem, 4vw, 3rem)" }}>
            A quiet nudge, not a backseat driver.
          </h2>
          <p className="mt-6 text-lg leading-relaxed" style={{ color: muted, fontFamily: body }}>
            When a wave is forming ahead, Cruze suggests easing off a few miles per hour, by voice and a
            glance. Hold the speed for a moment and the gap in front of you absorbs the wave instead of
            passing it back. The driver stays in charge the whole time.
          </p>
          <div className="mt-8 space-y-3" style={{ fontFamily: body }}>
            {points.map((pt) => {
              const Icon = pt.icon;
              return (
                <div key={pt.t} className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(232,89,12,0.12)", border: "1px solid rgba(232,89,12,0.25)" }}>
                    <Icon size={16} style={{ color: accent }} />
                  </span>
                  <span className="text-[15px]" style={{ color: text }}>{pt.t}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-7 text-sm" style={{ color: muted, fontFamily: body }}>Rolling out with our first pilot fleets in Texas.</p>
        </div>

        <div className="relative">
          <div className="absolute inset-0 -z-0" style={{ background: "radial-gradient(60% 50% at 60% 40%, rgba(232,89,12,0.16), transparent 70%)" }} />
          <div className="relative z-10"><Phone /></div>
        </div>
      </div>
    </section>
  );
}
