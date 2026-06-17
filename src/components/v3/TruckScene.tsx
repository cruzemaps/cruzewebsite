import { useEffect, useRef } from "react";

/**
 * Cinematic side-view driving scene. A detailed Cruze semi drives down a dusk
 * highway: wheels spin, the cab bobs, parallax layers (sun, hills, skyline,
 * streetlights, road dashes) scroll past, exhaust trails off the stack.
 *
 * The looping motion runs on the Web Animations API so its playbackRate can be
 * modulated in real time: the entire scene physically SLOWS when the truck hits
 * the phantom jam and SPEEDS UP once Cruze dissolves it. Continuous, smooth,
 * GPU-driven, and reactive to scroll.
 *
 * `p` (0..1) drives the story:
 *   p < 0.33  open road, light traffic, dusk
 *   0.33-0.66 traffic bunches ahead, brake lights, the truck slows, a jam
 *   p > 0.66  Cruze guides the pack (orange + swarm links), flow + light return
 */

const CSS = `
@keyframes tsx-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
@keyframes tsx-puff { 0% { opacity:.5; transform: translate(0,0) scale(.6);} 100% { opacity:0; transform: translate(-60px,-26px) scale(1.9);} }
@keyframes tsx-twinkle { 0%,100% { opacity:.2; } 50% { opacity:.9; } }
@keyframes tsx-dash { to { stroke-dashoffset: -24; } }
.tsx-wheel { transform-box: fill-box; transform-origin: center; }
.tsx-truck { animation: tsx-bob 1.4s ease-in-out infinite; }
.tsx-layer { position:absolute; top:0; height:100%; left:0; width:200%; display:flex; will-change:transform; }
.tsx-layer > div { width:50%; height:100%; flex:0 0 50%; position:relative; }
.tsx-puff { animation: tsx-puff 1.6s ease-out infinite; }
.tsx-link { animation: tsx-dash .6s linear infinite; }
`;

function useInjectCSS() {
  useEffect(() => {
    if (document.getElementById("tsx-style")) return;
    const s = document.createElement("style");
    s.id = "tsx-style";
    s.textContent = CSS;
    document.head.appendChild(s);
  }, []);
}

function smooth(e0: number, e1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function mixHex(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const m = pa.map((v, i) => Math.round(lerp(v, pb[i], t)));
  return `rgb(${m[0]},${m[1]},${m[2]})`;
}

const STARS = Array.from({ length: 46 }, () => ({
  x: Math.random() * 100,
  y: Math.random() * 46,
  r: Math.random() * 1.3 + 0.4,
  d: Math.random() * 3,
}));

/* A single Cruze semi, facing right. */
function Truck({ brake, night }: { brake: number; night: number }) {
  const wheel = (cx: number) => (
    <g key={cx} transform={`translate(${cx},300)`}>
      <circle r="34" fill="#0c0e11" />
      <circle r="33" fill="none" stroke="#26292f" strokeWidth="2" />
      <g className="tsx-wheel" data-anim="spin" data-dur="550">
        <circle r="16" fill="#3a3f47" />
        <circle r="15" fill="none" stroke="#5b626d" strokeWidth="1.5" />
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <rect key={a} x="-2.2" y="-15" width="4.4" height="14" rx="1.5" fill="#7a828d" transform={`rotate(${a})`} />
        ))}
        <circle r="4.5" fill="#9aa3ad" />
      </g>
    </g>
  );

  return (
    <svg className="tsx-truck" viewBox="0 0 1000 360" width="100%" height="100%" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="tsx-beam" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffe2a8" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffe2a8" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* headlight beam (stronger as night falls) */}
      <polygon points="860,240 1080,196 1110,300 860,256" fill="url(#tsx-beam)" opacity={0.15 + night * 0.85} />

      {/* ground shadow */}
      <ellipse cx="470" cy="338" rx="430" ry="16" fill="rgba(0,0,0,0.45)" />

      {/* trailer */}
      <rect x="55" y="78" width="520" height="180" rx="10" fill="#eef1f5" />
      <rect x="55" y="78" width="520" height="180" rx="10" fill="none" stroke="#cfd5dd" strokeWidth="2" />
      {[150, 245, 340, 435].map((x) => <line key={x} x1={x} y1="84" x2={x} y2="252" stroke="#d7dce3" strokeWidth="2" />)}
      <rect x="55" y="150" width="520" height="40" fill="#E8590C" />
      <text x="300" y="179" textAnchor="middle" fontFamily="'Space Grotesk', sans-serif" fontWeight="700" fontSize="34" letterSpacing="6" fill="#fff">CRUZE</text>
      <rect x="70" y="258" width="490" height="20" rx="4" fill="#cdd3db" />

      {/* trailer rear brake lights (left edge, the rear since we move right) */}
      <rect x="52" y="96" width="9" height="34" rx="2" fill={`rgba(255,52,38,${0.25 + brake * 0.75})`} />
      <rect x="52" y="206" width="9" height="34" rx="2" fill={`rgba(255,52,38,${0.25 + brake * 0.75})`} />
      {brake > 0.05 && <ellipse cx="50" cy="168" rx={26 + brake * 18} ry={70} fill="rgba(255,40,30,0.18)" opacity={brake} />}

      {/* cab */}
      <path d="M595 258 V120 q0-14 14-14 h70 l46 56 v96 z" fill="#E8590C" />
      <path d="M595 258 V120 q0-14 14-14 h70 l46 56 v96 z" fill="none" stroke="#c24a08" strokeWidth="2" />
      <line x1="640" y1="112" x2="640" y2="252" stroke="#c24a08" strokeWidth="2" />
      {/* hood */}
      <path d="M725 258 V178 q0-8 8-8 h84 q10 0 16 9 l21 34 q4 6 4 13 v32 z" fill="#f3742a" />
      <path d="M725 258 V178 q0-8 8-8 h84 q10 0 16 9 l21 34 q4 6 4 13 v32 z" fill="none" stroke="#c24a08" strokeWidth="2" />
      {/* glass */}
      <path d="M686 116 l40 52 v6 h-40 z" fill="#9fd2e6" opacity="0.9" />
      <rect x="650" y="120" width="28" height="46" rx="3" fill="#9fd2e6" opacity="0.85" />
      <rect x="678" y="150" width="6" height="26" rx="2" fill="#2a2d33" />
      {/* grille + headlight (glows at night) */}
      <rect x="861" y="206" width="9" height="34" rx="2" fill="#2a2d33" />
      <circle cx="858" cy="248" r="7" fill="#ffe9a8" />
      <circle cx="858" cy="248" r={12 + night * 8} fill="#ffe9a8" opacity={0.2 + night * 0.35} />
      {/* stack + exhaust */}
      <rect x="606" y="92" width="9" height="30" rx="3" fill="#2a2d33" />
      <g transform="translate(610,92)">
        {[0, 0.5, 1].map((d, i) => (
          <circle key={i} className="tsx-puff" style={{ animationDelay: `${d}s` }} r="8" fill="rgba(180,185,195,0.5)" />
        ))}
      </g>

      {[150, 235, 660, 815].map(wheel)}
    </svg>
  );
}

/* A small car ahead. */
function Car({ x, color, brake }: { x: number; color: string; brake: number }) {
  return (
    <g transform={`translate(${x},118)`}>
      {/* brake-light glow behind, so a jam reads as a wall of red */}
      {brake > 0.08 && <ellipse cx="2" cy="74" rx={14 + brake * 26} ry={26} fill="rgba(255,45,28,0.55)" opacity={brake} />}
      <ellipse cx="52" cy="96" rx="58" ry="9" fill="rgba(0,0,0,0.4)" />
      <path d="M6 70 q7-34 34-36 h28 q22 0 34 19 l20 17 v18 q0 8-8 8 H12 q-6 0-6-6 z" fill={color} />
      <path d="M36 36 h22 q15 0 24 14 l11 12 H36 z" fill="#9fd2e6" opacity="0.85" />
      <circle cx="34" cy="96" r="14" fill="#0c0e11" /><circle cx="34" cy="96" r="5.5" fill="#5b626d" />
      <circle cx="98" cy="96" r="14" fill="#0c0e11" /><circle cx="98" cy="96" r="5.5" fill="#5b626d" />
      {/* rear brake-light cluster */}
      <rect x="2" y="62" width="10" height="20" rx="2.5" fill={`rgba(255,48,30,${0.25 + brake * 0.75})`} />
    </g>
  );
}

export default function TruckScene({ p }: { p: number }) {
  useInjectCSS();
  const rootRef = useRef<HTMLDivElement>(null);
  const pRef = useRef(p);
  useEffect(() => { pRef.current = p; }, [p]);

  // Build the looping animations once, then steer their speed every frame.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof (Element.prototype as any).animate !== "function") return;
    // Respect reduced-motion: skip the continuous loops (wheels/parallax stay
    // still). The scroll-driven story (cars, brake lights, sky) still updates,
    // since that is user-driven motion, not autoplay.
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const anims: { a: Animation }[] = [];

    root.querySelectorAll<HTMLElement>('[data-anim="x"]').forEach((el) => {
      const dur = Number(el.dataset.dur) || 10000;
      const a = el.animate([{ transform: "translate3d(0,0,0)" }, { transform: "translate3d(-50%,0,0)" }], { duration: dur, iterations: Infinity, easing: "linear" });
      anims.push({ a });
    });
    root.querySelectorAll<SVGElement>('[data-anim="spin"]').forEach((el) => {
      const dur = Number((el as any).dataset.dur) || 550;
      const a = el.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }], { duration: dur, iterations: Infinity, easing: "linear" });
      anims.push({ a });
    });

    let raf = 0;
    const tick = () => {
      const pp = pRef.current;
      const cong = smooth(0.28, 0.5, pp) * (1 - smooth(0.62, 0.82, pp));
      const cruze = smooth(0.6, 0.82, pp);
      const speed = Math.max(0.08, 1 - 0.9 * cong + 0.3 * cruze);
      for (const { a } of anims) { try { a.playbackRate = speed; } catch { /* noop */ } }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); anims.forEach(({ a }) => a.cancel()); };
  }, []);

  const cong = smooth(0.28, 0.5, p) * (1 - smooth(0.62, 0.82, p));
  const cruze = smooth(0.6, 0.82, p);
  const night = smooth(0.4, 0.92, p);

  // Cars ahead of the truck: tight queue when jammed, spread out when flowing.
  const baseGap = 122 - cong * 62 + cruze * 36;
  const cars = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
    const guided = cruze > 0.4 && i % 2 === 0;
    return { x: 14 + i * baseGap, color: guided ? "#E8590C" : i % 2 ? "#c9d0d8" : "#8a93a0", brake: guided ? 0 : cong, guided };
  });
  const guidedXs = cars.filter((c) => c.guided).map((c) => c.x + 52);

  const skyTop = mixHex("0a1730", "03050a", night);
  const skyMid = mixHex("28344f", "0a1018", night);
  const horizon = mixHex("3a2016", "120c0a", night);

  return (
    <div ref={rootRef} style={{ position: "absolute", inset: 0, overflow: "hidden", background: `linear-gradient(180deg, ${skyTop} 0%, ${skyMid} 55%, ${horizon} 78%, #120e0c 100%)` }}>
      {/* stars (fade in as night falls) */}
      <div style={{ position: "absolute", inset: 0, opacity: night }}>
        {STARS.map((s, i) => (
          <span key={i} style={{ position: "absolute", left: `${s.x}%`, top: `${s.y}%`, width: s.r * 2, height: s.r * 2, borderRadius: "50%", background: "#fff", animation: `tsx-twinkle ${2.5 + s.d}s ease-in-out infinite`, animationDelay: `${s.d}s` }} />
        ))}
      </div>

      {/* sun glow (sinks + dims into night) */}
      <div style={{ position: "absolute", left: "62%", top: `${46 + night * 16}%`, width: 380, height: 380, transform: "translate(-50%,-50%)", borderRadius: "50%", background: "radial-gradient(circle, rgba(255,150,70,0.95) 0%, rgba(255,120,50,0.4) 35%, transparent 68%)", opacity: 1 - night * 0.75 }} />

      {/* far hills */}
      <div className="tsx-layer" data-anim="x" data-dur="60000" style={{ opacity: 0.7 }}>
        {[0, 1].map((k) => (
          <div key={k}>
            <svg viewBox="0 0 1000 400" width="100%" height="100%" preserveAspectRatio="none">
              <path d="M0 300 Q120 230 240 270 T520 250 T800 280 T1000 255 V400 H0 Z" fill="#1c2742" />
            </svg>
          </div>
        ))}
      </div>

      {/* skyline */}
      <div className="tsx-layer" data-anim="x" data-dur="32000" style={{ opacity: 0.85 }}>
        {[0, 1].map((k) => (
          <div key={k}>
            <svg viewBox="0 0 1000 400" width="100%" height="100%" preserveAspectRatio="none">
              <g fill="#141d33">
                {Array.from({ length: 16 }).map((_, i) => {
                  const bw = 30 + ((i * 37) % 40);
                  const bh = 60 + ((i * 53) % 140);
                  return <rect key={i} x={i * 62} y={320 - bh} width={bw} height={bh} />;
                })}
              </g>
              {/* lit windows after dark */}
              <g fill="#ffd27a" opacity={night * 0.8}>
                {Array.from({ length: 26 }).map((_, i) => (
                  <rect key={i} x={18 + ((i * 73) % 980)} y={210 + ((i * 41) % 90)} width="4" height="6" />
                ))}
              </g>
            </svg>
          </div>
        ))}
      </div>

      {/* streetlights */}
      <div className="tsx-layer" data-anim="x" data-dur="6000" style={{ bottom: 0, top: "auto", height: "62%" }}>
        {[0, 1].map((k) => (
          <div key={k} style={{ position: "relative" }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ position: "absolute", bottom: 0, left: `${i * 17 + 4}%`, width: 4, height: "70%", background: "#0c1119" }}>
                <div style={{ position: "absolute", top: 0, left: -2, width: 40, height: 5, background: "#0c1119", borderRadius: 3 }} />
                <div style={{ position: "absolute", top: 2, left: 32, width: 8, height: 8, borderRadius: "50%", background: "#ffd27a", boxShadow: `0 0 ${10 + night * 14}px #ffb24a` }} />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* road */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "26%", background: "linear-gradient(180deg,#23262c,#15171b)" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "#3a3f47" }} />
        <div className="tsx-layer" data-anim="x" data-dur="1100" style={{ top: "46%", height: 6 }}>
          {[0, 1].map((k) => (
            <div key={k} style={{ height: "100%", background: "repeating-linear-gradient(90deg,#e9b13a 0 46px, transparent 46px 92px)" }} />
          ))}
        </div>
      </div>

      {/* lead traffic + truck in the lower band */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "47%" }}>
        <div style={{ position: "absolute", left: "44%", right: "2%", bottom: "8%", height: "50%" }}>
          <svg viewBox="0 0 1120 250" width="100%" height="100%" preserveAspectRatio="xMinYMax meet" style={{ overflow: "visible" }}>
            {/* swarm coordination links between Cruze-guided cars */}
            {guidedXs.length > 1 && guidedXs.slice(0, -1).map((gx, i) => (
              <line key={i} className="tsx-link" x1={gx} y1={150} x2={guidedXs[i + 1]} y2={150} stroke="#E8590C" strokeWidth="3" strokeDasharray="8 8" opacity={cruze * 0.9} />
            ))}
            {guidedXs.map((gx, i) => <circle key={i} cx={gx} cy={150} r="4" fill="#E8590C" opacity={cruze} />)}
            {cars.map((c, i) => <Car key={i} x={c.x} color={c.color} brake={c.brake} />)}
          </svg>
        </div>
        <div style={{ position: "absolute", left: "4%", bottom: "6%", width: "clamp(300px, 52%, 640px)", height: "88%" }}>
          <Truck brake={cong} night={night} />
          <div style={{ position: "absolute", left: "46%", top: "2%", opacity: cruze, transform: `translateY(${(1 - cruze) * 12}px)` }}>
            <div style={{ background: "rgba(8,10,14,0.85)", border: "1px solid rgba(232,89,12,0.6)", borderRadius: 12, padding: "8px 14px", backdropFilter: "blur(6px)", boxShadow: "0 0 24px rgba(232,89,12,0.35)" }}>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", color: "#fff", fontWeight: 700, fontSize: 20, lineHeight: 1 }}>HOLD 55 <span style={{ fontSize: 11, color: "#E8590C" }}>MPH</span></div>
              <div style={{ fontFamily: "'Inter Tight',sans-serif", color: "rgba(255,255,255,0.6)", fontSize: 10, marginTop: 3 }}>dissolving wave ahead</div>
            </div>
          </div>
        </div>
      </div>

      {/* speed streaks */}
      <div className="tsx-layer" data-anim="x" data-dur="700" style={{ opacity: 0.22 * (1 - cong * 0.7) }}>
        {[0, 1].map((k) => (
          <div key={k} style={{ position: "relative" }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ position: "absolute", top: `${18 + i * 13}%`, left: `${i * 19}%`, width: 90, height: 2, background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.7))" }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
