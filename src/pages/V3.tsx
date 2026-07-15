import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useMotionValueEvent, useReducedMotion } from "framer-motion";
import SEO from "@/components/SEO";
import { Menu, X, ChevronDown, Navigation, Hourglass, Smartphone, ArrowUpRight, Award } from "lucide-react";
import LiveCameras from "@/components/v3/LiveFeed";
import TruckScene from "@/components/v3/TruckScene";
import ContactForm from "@/components/v3/ContactForm";
import RoadRail from "@/components/v3/RoadRail";
import LaneDivider from "@/components/v3/LaneDivider";
import ProductShowcase from "@/components/v3/ProductShowcase";

/**
 * Cruze homepage. Dark and cinematic: a real Cruze semi drives a dusk highway
 * and the scene reacts to scroll (open road -> phantom jam -> Cruze clears it).
 * (Formerly the /v3 redesign; promoted to "/". /v3 now redirects here.)
 */

const bg = "#0B0D11";
const bg2 = "#0F1218";
const text = "#F2F3F5";
const muted = "#9AA0A8";
const line = "rgba(255,255,255,0.10)";
const accent = "#E8590C";

const display = "'Space Grotesk', ui-sans-serif, system-ui, sans-serif";
const body = "'Inter Tight', ui-sans-serif, system-ui, sans-serif";

// Deployed camera-visualization (Vercel project: cruze-camera-visualization).
// Confirmed live: returns 200 and serves the "Cruze Camera Globe" dashboard.
const CAMERA_MAP_URL = "https://cruze-camera-visualization.vercel.app";

function useFonts() {
  useEffect(() => {
    if (document.getElementById("v3-fonts")) return;
    // preconnect first so the font CSS + files start fetching sooner
    const pre1 = Object.assign(document.createElement("link"), { rel: "preconnect", href: "https://fonts.googleapis.com" });
    const pre2 = Object.assign(document.createElement("link"), { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" });
    const l = document.createElement("link");
    l.id = "v3-fonts";
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter+Tight:wght@400;500;600&display=swap";
    document.head.append(pre1, pre2, l);
  }, []);
}

function Reveal({ children, delay = 0, y = 28 }: { children: React.ReactNode; delay?: number; y?: number }) {
  const reduce = useReducedMotion();
  if (reduce) return <div>{children}</div>; // no entrance motion for reduced-motion users
  return (
    <motion.div initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-70px" }} transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

/* ----------------------------------------------------------------- Nav */

function Nav() {
  const [open, setOpen] = useState(false);
  const solutions = [
    { label: "For fleets", to: "/for-fleets" },
    { label: "For cities & DOTs", to: "/for-cities" },
    { label: "Route planner", to: "/route-planner" },
  ];
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b backdrop-blur" style={{ background: "rgba(11,13,17,0.72)", borderColor: line }}>
      <div className="mx-auto max-w-6xl px-5 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="font-bold tracking-tight text-xl" style={{ fontFamily: display, color: text }}>Cruze</Link>

        <div className="hidden md:flex items-center gap-7 text-[15px]" style={{ color: muted, fontFamily: body }}>
          <div className="relative group">
            <button className="flex items-center gap-1 hover:text-white transition-colors">Solutions <ChevronDown size={14} /></button>
            <div className="absolute top-full left-0 pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <div className="w-52 rounded-xl border p-2" style={{ background: bg, borderColor: line }}>
                {solutions.map((s) => (
                  <Link key={s.to} to={s.to} className="block px-3 py-2 rounded-lg text-[14px] hover:text-white" style={{ color: muted }}>{s.label}</Link>
                ))}
                <a href={CAMERA_MAP_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-2 rounded-lg text-[14px] hover:text-white" style={{ color: muted }}>Live camera map <ArrowUpRight size={12} /></a>
              </div>
            </div>
          </div>
          <a href="#how" className="hover:text-white transition-colors">How it works</a>
          <Link to="/insights" className="hover:text-white transition-colors">Insights</Link>
          <Link to="/investors" className="hover:text-white transition-colors">Investors</Link>
        </div>

        <div className="flex items-center gap-3">
          <a href="#contact" className="hidden sm:inline-flex text-[15px] font-medium px-4 py-2 rounded-full transition-opacity hover:opacity-90" style={{ background: accent, color: "#0B0E14", fontFamily: body }}>Talk to us</a>
          <button className="md:hidden p-1.5" style={{ color: text }} onClick={() => setOpen((o) => !o)} aria-label="Menu">{open ? <X size={22} /> : <Menu size={22} />}</button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t px-5 py-4 flex flex-col gap-1" style={{ borderColor: line, background: bg, fontFamily: body }}>
          {solutions.map((s) => <Link key={s.to} to={s.to} className="py-2.5" style={{ color: muted }} onClick={() => setOpen(false)}>{s.label}</Link>)}
          <a href={CAMERA_MAP_URL} target="_blank" rel="noopener noreferrer" className="py-2.5" style={{ color: muted }}>Live camera map</a>
          <a href="#how" className="py-2.5" style={{ color: muted }} onClick={() => setOpen(false)}>How it works</a>
          <Link to="/insights" className="py-2.5" style={{ color: muted }} onClick={() => setOpen(false)}>Insights</Link>
          <Link to="/investors" className="py-2.5" style={{ color: muted }} onClick={() => setOpen(false)}>Investors</Link>
          <a href="#contact" className="mt-2 inline-flex justify-center px-4 py-2.5 rounded-full font-medium" style={{ background: accent, color: "#0B0E14" }} onClick={() => setOpen(false)}>Talk to us</a>
        </div>
      )}
    </nav>
  );
}

/* ----------------------------------------- Cinematic scroll hero */

function DriveHero() {
  const ref = useRef<HTMLDivElement>(null);
  const [p, setP] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => setP(v));

  const beats = [
    { tag: "Open road", h: "We clear traffic jams before they form.", t: "Most jams have no crash and no bottleneck. They are waves that start the moment one driver hits the brakes. Cruze sees them coming and nudges a few drivers to ease off, so the wave never builds. Scroll to watch it happen." },
    { tag: "The phantom jam", h: "No crash. No bottleneck. Still a jam.", t: "One tap of the brakes, and the car behind taps a little harder. That ripple rolls backward for miles. It is where most of your rush hour actually goes." },
    { tag: "Cruze steps in", h: "Nudge a few drivers. The jam clears.", t: "The orange trucks are holding a steady speed on Cruze's cue. The gap ahead soaks up the wave instead of passing it back. Same road, same trucks, nothing bolted to the highway." },
  ];
  const beat = p < 0.34 ? 0 : p < 0.66 ? 1 : 2;

  // Height-aware sizing so the hero text never collides with the truck/cars on
  // short laptop screens (13" displays etc.). Width clamps alone don't account
  // for viewport height, which is what runs out on a wide-but-short laptop.
  useEffect(() => {
    if (document.getElementById("v3-hero-css")) return;
    const s = document.createElement("style");
    s.id = "v3-hero-css";
    s.textContent = `
      .v3-hero-top { padding-top: 6.5rem; }
      @media (max-height: 860px) {
        .v3-hero-top { padding-top: 5rem; }
        .v3-hero-h1 { font-size: clamp(1.8rem, 4.4vw, 3.2rem) !important; }
        .v3-hero-body { font-size: 1rem !important; line-height: 1.5 !important; }
      }
      @media (max-height: 720px) {
        .v3-hero-top { padding-top: 4.25rem; }
        .v3-hero-h1 { font-size: clamp(1.55rem, 3.8vw, 2.4rem) !important; }
        .v3-hero-body { font-size: 0.9rem !important; margin-top: 0.75rem !important; }
        .v3-hero-cta { margin-top: 1rem !important; }
      }
      @media (max-height: 600px) {
        .v3-hero-body { display: none !important; }
        .v3-hero-h1 { font-size: 1.45rem !important; }
      }
    `;
    document.head.appendChild(s);
  }, []);

  return (
    <section id="drive" ref={ref} style={{ height: "360vh", position: "relative" }}>
      <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden" }}>
        <TruckScene p={p} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(7,9,12,0.82) 0%, rgba(7,9,12,0.12) 30%, transparent 50%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(100deg, rgba(7,9,12,0.94) 0%, rgba(7,9,12,0.5) 42%, rgba(7,9,12,0) 68%)", pointerEvents: "none" }} />

        <div className="relative z-10 h-full flex flex-col">
          {/* Text zone: stays in the top band, never reaches the truck/cars below */}
          <div className="v3-hero-top flex-none">
            <div className="mx-auto max-w-6xl px-5 sm:px-6">
              <motion.div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] mb-4" style={{ color: accent, fontFamily: body }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} /> Pre-seed traffic-intelligence company
              </motion.div>
              <motion.div key={beat} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-2xl">
                <div className="text-sm mb-2.5" style={{ color: "rgba(255,255,255,0.5)", fontFamily: body }}>{beats[beat].tag}</div>
                <h1 className="v3-hero-h1 font-bold tracking-[-0.025em] leading-[1.02]" style={{ fontFamily: display, color: text, fontSize: "clamp(2.2rem, 5.4vw, 4.4rem)" }}>{beats[beat].h}</h1>
                <p className="v3-hero-body mt-4 text-base sm:text-lg leading-relaxed max-w-xl" style={{ color: "rgba(255,255,255,0.82)", fontFamily: body }}>{beats[beat].t}</p>
                <div className="v3-hero-cta mt-6 flex flex-wrap items-center gap-3" style={{ fontFamily: body }}>
                  <a href="#live" className="text-[14px] font-medium px-5 py-2.5 rounded-full transition-opacity hover:opacity-90" style={{ background: accent, color: "#0B0E14" }}>See it live</a>
                  <a href="#contact" className="text-[14px] font-medium px-5 py-2.5 rounded-full border transition-colors hover:border-white" style={{ borderColor: "rgba(255,255,255,0.28)", color: "#fff" }}>Talk to us</a>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Spacer: the truck and cars animate behind this region */}
          <div className="flex-1 min-h-0" />

          {/* Bottom: just the thin progress dots, over the empty road */}
          <div className="flex-none pb-5 sm:pb-6">
            <div className="mx-auto max-w-6xl px-5 sm:px-6 flex items-center gap-3" style={{ fontFamily: body }}>
              {[0, 1, 2].map((i) => <span key={i} className="h-1 rounded-full transition-all duration-300" style={{ width: i === beat ? 42 : 16, background: i === beat ? accent : "rgba(255,255,255,0.28)" }} />)}
              <span className="ml-3 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{beat < 2 ? "keep scrolling" : "the jam is gone"}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------ Live proof */

function LiveProof() {
  return (
    <section id="live" className="border-y" style={{ borderColor: line, background: bg2 }}>
      <div className="mx-auto max-w-6xl px-5 sm:px-6 py-16 md:py-28 grid lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-12 items-center">
        <Reveal>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] mb-5" style={{ color: accent, fontFamily: body }}>Not a render</p>
            <h2 className="font-bold tracking-[-0.02em] leading-[1.05]" style={{ fontFamily: display, color: text, fontSize: "clamp(1.9rem, 4vw, 3rem)" }}>This is a real road, right now.</h2>
            <p className="mt-6 text-lg leading-relaxed" style={{ color: muted, fontFamily: body }}>
              The drive above is our model. This is the actual feed. Cruze watches public Texas
              traffic cameras and works out how fast everything is really moving, which is the
              signal the rest of the system runs on. Pick a city and look around.
            </p>
            <div className="mt-7 flex flex-wrap gap-3" style={{ fontFamily: body }}>
              <a href={CAMERA_MAP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[15px] font-medium px-5 py-2.5 rounded-full transition-opacity hover:opacity-90" style={{ background: accent, color: "#0B0E14" }}>
                Open the camera map <ArrowUpRight size={15} />
              </a>
              <Link to="/lab" className="text-[15px] font-medium px-5 py-2.5 rounded-full border transition-colors hover:border-white" style={{ borderColor: line, color: text }}>Watch detection run</Link>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <LiveCameras />
        </Reveal>
      </div>
    </section>
  );
}

/* --------------------------------------------------------- Problem */

function Problem() {
  const points = [
    { icon: Navigation, h: "Maps just move the jam", t: "Waze and Google send you around the mess. The mess still exists, it is just somewhere else now." },
    { icon: Hourglass, h: "Self-driving is too far off", t: "A fully automated road is decades and trillions away. The cars already out there are the lever." },
    { icon: Smartphone, h: "The phone can already help", t: "A phone knows your speed and position and can suggest a small change in real time. That is enough to bend the flow." },
  ];
  return (
    <section id="problem" className="mx-auto max-w-6xl px-5 sm:px-6 py-16 md:py-28">
      <Reveal>
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.18em] mb-5" style={{ color: accent, fontFamily: body }}>The problem</p>
          <h2 className="font-bold tracking-[-0.02em] leading-[1.05]" style={{ fontFamily: display, color: text, fontSize: "clamp(1.9rem, 4vw, 3rem)" }}>It is a physics problem, not a road problem.</h2>
          <p className="mt-5 text-lg leading-relaxed" style={{ color: muted, fontFamily: body }}>
            Put cars on a circular track and ask everyone to hold a steady speed, and a stop-and-go
            jam still forms on its own and rolls backward, with nothing in the way. Physicists showed
            this in 2008. Real highways do the same thing every evening.
          </p>
        </div>
      </Reveal>
      <div className="mt-10 grid sm:grid-cols-3 gap-4 md:gap-5">
        {points.map((pt, i) => {
          const Icon = pt.icon;
          return (
            <Reveal key={pt.h} delay={i * 0.08}>
              <div className="rounded-2xl border p-6 md:p-7 h-full" style={{ borderColor: line, background: bg2, fontFamily: body }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5" style={{ background: "rgba(232,89,12,0.12)", border: "1px solid rgba(232,89,12,0.25)" }}>
                  <Icon size={18} style={{ color: accent }} />
                </div>
                <div className="font-semibold mb-2" style={{ color: text, fontFamily: display }}>{pt.h}</div>
                <p className="text-[15px] leading-relaxed" style={{ color: muted }}>{pt.t}</p>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

/* --------------------------------------------------------- The stakes */

function Stakes() {
  const stats = [
    { n: "$74B", l: "lost by U.S. drivers to congestion in 2024", s: "INRIX 2024" },
    { n: "4B hrs", l: "Americans spent sitting in traffic that year", s: "INRIX 2024" },
    { n: "$108.8B", l: "in extra cost to the trucking industry alone", s: "ATRI, 2022" },
    { n: "6.4B gal", l: "of diesel burned by trucks idling in traffic", s: "ATRI, 2022" },
  ];
  return (
    <section id="stakes" className="border-y" style={{ borderColor: line, background: bg2 }}>
      <div className="mx-auto max-w-6xl px-5 sm:px-6 py-16 md:py-24">
        <Reveal>
          <div className="max-w-3xl mb-12">
            <p className="text-xs uppercase tracking-[0.18em] mb-5" style={{ color: accent, fontFamily: body }}>The stakes</p>
            <h2 className="font-bold tracking-[-0.02em] leading-[1.05]" style={{ fontFamily: display, color: text, fontSize: "clamp(1.9rem, 4vw, 3rem)" }}>
              It is not just annoying. It is one of the most expensive problems we ignore.
            </h2>
          </div>
        </Reveal>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px rounded-2xl overflow-hidden border" style={{ borderColor: line, background: line }}>
          {stats.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.07}>
              <div className="p-6 md:p-8 h-full" style={{ background: bg, fontFamily: body }}>
                <div className="font-bold tracking-[-0.02em]" style={{ fontFamily: display, color: accent, fontSize: "clamp(2rem, 4.4vw, 3.1rem)", lineHeight: 1 }}>{s.n}</div>
                <div className="mt-3 text-[14px] leading-snug" style={{ color: text }}>{s.l}</div>
                <div className="mt-3 text-xs" style={{ color: muted }}>{s.s}</div>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <p className="mt-8 text-lg leading-relaxed max-w-3xl" style={{ color: muted, fontFamily: body }}>
            Not all of that is ours to fix. But a big slice is not full roads or crashes, it is stop-and-go
            waves rippling through traffic that was moving fine a second ago. That slice is exactly what
            Cruze is built to remove.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------- Insight (trimmed) */

function Insight() {
  return (
    <section id="insight" className="border-y" style={{ borderColor: line, background: bg2 }}>
      <div className="mx-auto max-w-4xl px-5 sm:px-6 py-16 md:py-24 text-center">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.18em] mb-6" style={{ color: accent, fontFamily: body }}>Why it can work</p>
          <div className="font-bold leading-none tracking-[-0.03em]" style={{ fontFamily: display, color: accent, fontSize: "clamp(4rem, 12vw, 8rem)" }}>~5%</div>
          <p className="mt-5 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto" style={{ color: text, fontFamily: body }}>
            That is the share of cars you have to guide. In a real test-track study, steering about
            one in twenty vehicles was enough to smooth the waves and cut fuel for everyone behind them.
          </p>
          <p className="mt-4 text-sm" style={{ color: muted, fontFamily: body }}>University of Arizona, 2018. Cruze does it with driver guidance instead of self-driving cars.</p>
        </Reveal>
      </div>
    </section>
  );
}

/* --------------------------------------------------- How it works */

function How() {
  const steps = [
    { n: "01", t: "See the road", d: "Computer vision reads existing traffic cameras for how dense and how fast traffic is, plus anonymous data from connected vehicles. Nothing new gets installed on the highway.", tag: "Working today on Texas feeds" },
    { n: "02", t: "Catch the wave early", d: "A physics model spots where a jam is about to start, before any driver would feel it. This is the part a normal maps app does not do.", tag: "In development" },
    { n: "03", t: "Suggest a small change", d: "A few drivers get a gentle cue, like holding 55, so the gap ahead absorbs the wave. Less braking means less fuel and fewer hard stops.", tag: "Pilot stage" },
  ];
  return (
    <section id="how" className="mx-auto max-w-6xl px-5 sm:px-6 py-16 md:py-28">
      <Reveal>
        <div className="max-w-2xl mb-12 md:mb-14">
          <p className="text-xs uppercase tracking-[0.18em] mb-5" style={{ color: accent, fontFamily: body }}>How it works</p>
          <h2 className="font-bold tracking-[-0.02em] leading-[1.05]" style={{ fontFamily: display, color: text, fontSize: "clamp(1.9rem, 4vw, 3rem)" }}>What Cruze actually does.</h2>
        </div>
      </Reveal>
      <div className="grid md:grid-cols-3 gap-px rounded-2xl overflow-hidden border" style={{ borderColor: line, background: line }}>
        {steps.map((s, i) => (
          <Reveal key={s.n} delay={i * 0.08}>
            <div className="p-7 md:p-9 h-full flex flex-col" style={{ background: bg2, fontFamily: body }}>
              <div className="text-sm font-mono mb-6" style={{ color: accent }}>{s.n}</div>
              <div className="font-semibold text-xl mb-3" style={{ color: text, fontFamily: display }}>{s.t}</div>
              <p className="text-[15px] leading-relaxed flex-1" style={{ color: muted }}>{s.d}</p>
              <div className="mt-6 inline-flex self-start text-xs px-2.5 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.05)", color: text, border: `1px solid ${line}` }}>{s.tag}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ----------------------------------------------------- Moat / defensibility */

function Moat() {
  const rows: [string, string][] = [
    ["The incumbents are pointed the other way.", "Google and Waze make their money getting one driver to their own destination fastest. Cruze asks a few drivers to ease off so everyone moves. That trade-off cuts against their core product, which is a big reason it has stayed unbuilt."],
    ["It gets sharper the more road it covers.", "Every corridor and every guided driver improves where Cruze predicts waves and how well it smooths them. Coverage compounds into a better product, so a head start is hard to close."],
    ["The hard part is the whole stack.", "Reading live traffic from cameras, predicting waves with physics, and turning that into a single safe speed cue, all on real roads, is the work. That combination is the lead we are building."],
  ];
  return (
    <section id="moat" className="border-y" style={{ borderColor: line, background: bg2 }}>
      <div className="mx-auto max-w-4xl px-5 sm:px-6 py-16 md:py-28">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.18em] mb-5" style={{ color: accent, fontFamily: body }}>Defensibility</p>
          <h2 className="font-bold tracking-[-0.02em] leading-[1.05]" style={{ fontFamily: display, color: text, fontSize: "clamp(1.9rem, 4vw, 3rem)" }}>Why this is hard to copy.</h2>
          <p className="mt-5 text-lg leading-relaxed max-w-2xl" style={{ color: muted, fontFamily: body }}>
            The research behind it is public. Doing it on live roads, and getting better the more roads you cover, is not.
          </p>
        </Reveal>
        <div className="mt-10">
          {rows.map(([lead, copy], i) => (
            <Reveal key={lead} delay={i * 0.08}>
              <div className="py-6 border-t flex flex-col md:flex-row md:gap-10" style={{ borderColor: line, fontFamily: body }}>
                <div className="md:w-2/5 font-semibold mb-2 md:mb-0 flex items-start gap-3" style={{ color: text, fontFamily: display }}>
                  <span className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: accent }} />
                  {lead}
                </div>
                <p className="md:w-3/5 text-[15px] leading-relaxed" style={{ color: muted }}>{copy}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------- Audiences */

function Audiences() {
  const cards = [
    { k: "For fleets", h: "Less fuel and fewer hard stops, per truck.", p: "Steadier speeds mean less braking and acceleration, which is exactly where fuel and brake wear go, and fewer rear-end risks. How much you save depends on the route, so we measure it with you during a pilot instead of quoting one number.", to: "/for-fleets", cta: "How it works for fleets" },
    { k: "For cities and DOTs", h: "More out of the roads you already have.", p: "Smoothing waves lets a corridor carry more cars with no construction. Because Cruze reads your existing cameras, you can see real flow on your own roads before anything reaches a driver.", to: "/for-cities", cta: "How it works for cities" },
  ];
  return (
    <section id="audiences" className="border-t" style={{ borderColor: line, background: bg2 }}>
      <div className="mx-auto max-w-6xl px-5 sm:px-6 py-16 md:py-28">
        <Reveal><p className="text-xs uppercase tracking-[0.18em] mb-5" style={{ color: accent, fontFamily: body }}>Who it's for</p></Reveal>
        <div className="grid md:grid-cols-2 gap-5">
          {cards.map((c, i) => (
            <Reveal key={c.k} delay={i * 0.08}>
              <div className="rounded-2xl border p-7 md:p-10 h-full flex flex-col" style={{ borderColor: line, background: bg }}>
                <div className="text-sm font-medium mb-4" style={{ color: accent, fontFamily: body }}>{c.k}</div>
                <h3 className="font-bold tracking-[-0.01em] mb-4" style={{ fontFamily: display, color: text, fontSize: "clamp(1.4rem, 2.6vw, 1.9rem)" }}>{c.h}</h3>
                <p className="text-[15px] leading-relaxed flex-1" style={{ color: muted, fontFamily: body }}>{c.p}</p>
                <Link to={c.to} className="mt-6 inline-flex items-center gap-1.5 text-[15px] font-medium" style={{ color: accent, fontFamily: body }}>{c.cta} <ArrowUpRight size={15} /></Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------- Stage & team */

function Team() {
  const people = [
    ["Anudeep Bonagiri", "Co-founder & CEO", "Computer science and neuroscience at UT San Antonio. Leads the model, the product, and the company."],
    ["Sreesanth Senthilkumar", "Co-founder", "Builds across the engineering and the day-to-day of getting Cruze off the ground."],
    ["Founding engineers", "Three on the team", "Computer vision, traffic modeling, and the app."],
    ["Based in", "Texas", "Starting on the corridors we know best."],
  ];
  return (
    <section id="team" className="mx-auto max-w-6xl px-5 sm:px-6 py-16 md:py-28">
      <div className="grid md:grid-cols-[1fr_1.1fr] gap-10 md:gap-16 items-start">
        <Reveal>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] mb-5" style={{ color: accent, fontFamily: body }}>Where we are</p>
            <h2 className="font-bold tracking-[-0.02em] leading-[1.05]" style={{ fontFamily: display, color: text, fontSize: "clamp(1.9rem, 4vw, 3rem)" }}>Early, and honest about it.</h2>
            <div className="mt-6 inline-flex items-center gap-2.5 px-3.5 py-2 rounded-full" style={{ background: "rgba(232,89,12,0.1)", border: "1px solid rgba(232,89,12,0.3)", fontFamily: body }}>
              <Award size={15} style={{ color: accent }} />
              <span style={{ color: text, fontSize: 13.5 }}>First place and $35,000 at the UTSA Draper Data Science Business Plan Competition, 2026</span>
            </div>
            <p className="mt-6 text-lg leading-relaxed" style={{ color: muted, fontFamily: body }}>
              We are a pre-seed company. There is a working detection model on live feeds, a physics
              engine still being built, and our first pilot roads lined up in Texas. We are not going
              to claim customers or savings we have not earned. If you run a fleet or a road network
              and want to be early, that is exactly who we want to hear from.
            </p>
            <a href="#contact" className="mt-8 inline-flex px-6 py-3 rounded-full font-medium text-[15px] transition-opacity hover:opacity-90" style={{ background: accent, color: "#0B0E14", fontFamily: body }}>Talk to us</a>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="grid sm:grid-cols-2 gap-4" style={{ fontFamily: body }}>
            {people.map(([n, r, d]) => (
              <div key={n} className="rounded-2xl border p-6" style={{ borderColor: line, background: bg2 }}>
                <div className="font-semibold" style={{ color: text }}>{n}</div>
                <div className="text-sm mb-3" style={{ color: accent }}>{r}</div>
                <div className="text-[14px] leading-relaxed" style={{ color: muted }}>{d}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ----------------------------------------------------- How a pilot works */

function Pilot() {
  const steps = [
    { t: "Pick a corridor", d: "You name a road that hurts. We point Cruze at the traffic cameras already on it. Nothing gets installed." },
    { t: "See your baseline", d: "Within days you get the real picture of that road: where waves form, and what they cost in fuel and time." },
    { t: "Run a guided test", d: "A small group of drivers gets gentle speed cues on that corridor. We measure what actually changes." },
    { t: "Review together", d: "Fuel, hard stops, and throughput against the baseline. You decide whether to widen it from there." },
  ];
  return (
    <section id="pilot" className="border-t" style={{ borderColor: line, background: bg }}>
      <div className="mx-auto max-w-6xl px-5 sm:px-6 py-16 md:py-28">
        <Reveal>
          <div className="max-w-2xl mb-12 md:mb-16">
            <p className="text-xs uppercase tracking-[0.18em] mb-5" style={{ color: accent, fontFamily: body }}>How a pilot works</p>
            <h2 className="font-bold tracking-[-0.02em] leading-[1.05]" style={{ fontFamily: display, color: text, fontSize: "clamp(1.9rem, 4vw, 3rem)" }}>Trying it is easy on purpose.</h2>
            <p className="mt-5 text-lg leading-relaxed" style={{ color: muted, fontFamily: body }}>
              No hardware on the road. No long contract. A pilot starts on the cameras and corridors you already run.
            </p>
          </div>
        </Reveal>

        <div className="relative grid sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
          <div className="hidden lg:block absolute top-5 left-[11%] right-[11%] h-px" style={{ background: line }} />
          {steps.map((s, i) => (
            <Reveal key={s.t} delay={i * 0.08}>
              <div className="relative" style={{ fontFamily: body }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center mb-5 relative z-10" style={{ background: bg, border: `1.5px solid ${accent}`, color: accent, fontFamily: display, fontWeight: 700 }}>{i + 1}</div>
                <div className="font-semibold text-lg mb-2" style={{ color: text, fontFamily: display }}>{s.t}</div>
                <p className="text-[15px] leading-relaxed" style={{ color: muted }}>{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-12 flex flex-col sm:flex-row sm:items-center gap-4" style={{ fontFamily: body }}>
            <a href="#contact" className="inline-flex justify-center px-6 py-3 rounded-full font-medium text-[15px] transition-opacity hover:opacity-90" style={{ background: accent, color: "#0B0E14" }}>Start with one corridor</a>
            <span className="text-sm" style={{ color: muted }}>Most pilots begin with a single road in Texas.</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ----------------------------------------------------- Contact */

function Contact() {
  return (
    <section id="contact" className="border-t" style={{ borderColor: line, background: bg2 }}>
      <div className="mx-auto max-w-2xl px-5 sm:px-6 py-20 md:py-28 text-center">
        <Reveal>
          <h2 className="font-bold tracking-[-0.02em] leading-[1.04]" style={{ fontFamily: display, color: text, fontSize: "clamp(2rem, 4.6vw, 3.2rem)" }}>Want this on your roads?</h2>
          <p className="mt-5 mb-8 text-lg" style={{ color: muted, fontFamily: body }}>We are lining up our first pilots in Texas. Fleets, DOTs, and investors who want in early, send us a note.</p>
          <ContactForm />
        </Reveal>
      </div>
    </section>
  );
}

/* --------------------------------------------------------- Footer */

function Footer() {
  const cols = [
    { h: "Product", links: [["For fleets", "/for-fleets"], ["For cities & DOTs", "/for-cities"], ["Route planner", "/route-planner"], ["Live cameras", "/cameras"]] },
    { h: "Company", links: [["Insights", "/insights"], ["Investors", "/investors"], ["Press", "/press"], ["FAQ", "/faq"]] },
    { h: "Legal & support", links: [["Support", "/support"], ["Privacy policy", "/privacy"], ["Terms of service", "/terms"]] },
  ];
  return (
    <footer className="border-t" style={{ borderColor: line, background: bg }}>
      <div className="mx-auto max-w-6xl px-5 sm:px-6 py-12 grid sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] gap-8" style={{ fontFamily: body }}>
        <div>
          <div className="font-bold text-xl mb-2" style={{ fontFamily: display, color: text }}>Cruze</div>
          <p className="text-sm max-w-xs" style={{ color: muted }}>Pre-seed traffic intelligence. Building in Texas.</p>
        </div>
        {cols.map((col) => (
          <div key={col.h}>
            <div className="text-xs uppercase tracking-widest mb-3" style={{ color: muted }}>{col.h}</div>
            <div className="flex flex-col gap-2">
              {col.links.map(([l, to]) => <Link key={to} to={to} className="text-sm hover:text-white transition-colors" style={{ color: muted }}>{l}</Link>)}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t px-6 py-5 text-center text-xs" style={{ borderColor: line, color: muted, fontFamily: body }}>cruzemaps.com</div>
    </footer>
  );
}

/* --------------------------------------------------------- Page */

export default function V3() {
  useFonts();
  return (
    <div style={{ background: bg, color: text, fontFamily: body }}>
      {/* Reads the "/v3" entry from src/lib/seo.ts (title, description, OG,
          canonical, JSON-LD, noindex). The prerender bakes it into the static HTML. */}
      <SEO />
      <Nav />
      <RoadRail />
      <DriveHero />
      <LiveProof />
      <Problem />
      <Stakes />
      <Insight />
      <LaneDivider />
      <How />
      <ProductShowcase />
      <Moat />
      <LaneDivider />
      <Audiences />
      <Team />
      <Pilot />
      <Contact />
      <Footer />
    </div>
  );
}
