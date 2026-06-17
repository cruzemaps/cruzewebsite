import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Menu, X, ChevronDown, Navigation, Hourglass, Smartphone, ArrowUpRight } from "lucide-react";
import LiveFeed, { FEEDS } from "@/components/v3/LiveFeed";
import TruckScene from "@/components/v3/TruckScene";
import ContactForm from "@/components/v3/ContactForm";

/**
 * V3 — redesign sandbox. Isolated route (/v3), unlinked, noindex'd. Dark and
 * cinematic: a real Cruze semi drives a dusk highway and the scene reacts to
 * scroll (open road -> phantom jam -> Cruze clears it). Nav and CTAs link into
 * the existing cruzemaps.com pages so this isn't an island.
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
// TODO(anudeep): confirm this is the live production URL.
const CAMERA_MAP_URL = "https://cruze-camera-visualization.vercel.app";

function useFonts() {
  useEffect(() => {
    if (document.getElementById("v3-fonts")) return;
    const l = document.createElement("link");
    l.id = "v3-fonts";
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter+Tight:wght@400;500;600&display=swap";
    document.head.appendChild(l);
  }, []);
}

function Reveal({ children, delay = 0, y = 28 }: { children: React.ReactNode; delay?: number; y?: number }) {
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
          <a href="#contact" className="hidden sm:inline-flex text-[15px] font-medium px-4 py-2 rounded-full transition-opacity hover:opacity-90" style={{ background: accent, color: "#fff", fontFamily: body }}>Talk to us</a>
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
          <a href="#contact" className="mt-2 inline-flex justify-center px-4 py-2.5 rounded-full font-medium" style={{ background: accent, color: "#fff" }} onClick={() => setOpen(false)}>Talk to us</a>
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

  return (
    <section id="drive" ref={ref} style={{ height: "360vh", position: "relative" }}>
      <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden" }}>
        <TruckScene p={p} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(7,9,12,0.82) 0%, rgba(7,9,12,0.1) 26%, transparent 46%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(100deg, rgba(7,9,12,0.94) 0%, rgba(7,9,12,0.5) 40%, rgba(7,9,12,0) 66%)", pointerEvents: "none" }} />

        <div className="absolute inset-x-0 top-0 z-10">
          <div className="mx-auto max-w-6xl px-5 sm:px-6 pt-24 md:pt-28">
            <motion.div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] mb-5" style={{ color: accent, fontFamily: body }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} /> Pre-seed traffic-intelligence company
            </motion.div>
            <motion.div key={beat} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-3xl">
              <div className="text-sm mb-3" style={{ color: "rgba(255,255,255,0.5)", fontFamily: body }}>{beats[beat].tag}</div>
              <h1 className="font-bold tracking-[-0.025em] leading-[1.0]" style={{ fontFamily: display, color: text, fontSize: "clamp(2.2rem, 5.4vw, 4.6rem)" }}>{beats[beat].h}</h1>
              <p className="mt-5 text-base sm:text-lg md:text-xl leading-relaxed max-w-xl md:max-w-2xl" style={{ color: "rgba(255,255,255,0.8)", fontFamily: body }}>{beats[beat].t}</p>
            </motion.div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-7 z-10">
          <div className="mx-auto max-w-6xl px-5 sm:px-6 flex items-center gap-3" style={{ fontFamily: body }}>
            {[0, 1, 2].map((i) => <span key={i} className="h-1 rounded-full transition-all duration-300" style={{ width: i === beat ? 42 : 16, background: i === beat ? accent : "rgba(255,255,255,0.28)" }} />)}
            <span className="ml-3 text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{beat < 2 ? "keep scrolling" : "the jam is gone"}</span>
            <div className="ml-auto hidden sm:flex gap-3">
              <a href="#live" className="text-[14px] font-medium px-5 py-2 rounded-full" style={{ background: accent, color: "#fff" }}>See it live</a>
              <a href="#contact" className="text-[14px] font-medium px-5 py-2 rounded-full border" style={{ borderColor: "rgba(255,255,255,0.25)", color: "#fff" }}>Talk to us</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------ Live proof */

function LiveProof() {
  const [active, setActive] = useState(FEEDS[0]);
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
              <a href={CAMERA_MAP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[15px] font-medium px-5 py-2.5 rounded-full transition-opacity hover:opacity-90" style={{ background: accent, color: "#fff" }}>
                Open the camera map <ArrowUpRight size={15} />
              </a>
              <Link to="/lab" className="text-[15px] font-medium px-5 py-2.5 rounded-full border transition-colors hover:border-white" style={{ borderColor: line, color: text }}>Watch detection run</Link>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="rounded-2xl overflow-hidden border shadow-2xl" style={{ borderColor: line, background: "#000" }}>
            <div className="aspect-video relative">
              <LiveFeed key={active.id} src={active.url} />
              <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs text-white" style={{ background: "rgba(0,0,0,0.55)", fontFamily: body }}>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> LIVE <span className="opacity-50">·</span> {active.city}, {active.location}
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto" style={{ background: "#07090C" }}>
              {FEEDS.map((f) => (
                <button key={f.id} onClick={() => setActive(f)} className="text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors" style={{ fontFamily: body, color: active.id === f.id ? "#fff" : "rgba(255,255,255,0.5)", background: active.id === f.id ? "rgba(255,255,255,0.12)" : "transparent" }}>{f.city}</button>
              ))}
            </div>
          </div>
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
    <section className="mx-auto max-w-6xl px-5 sm:px-6 py-16 md:py-28">
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

/* ------------------------------------------------------- Insight (trimmed) */

function Insight() {
  return (
    <section className="border-y" style={{ borderColor: line, background: bg2 }}>
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

/* ----------------------------------------------------- Audiences */

function Audiences() {
  const cards = [
    { k: "For fleets", h: "Less fuel and fewer hard stops, per truck.", p: "Steadier speeds mean less braking and acceleration, which is exactly where fuel and brake wear go, and fewer rear-end risks. How much you save depends on the route, so we measure it with you during a pilot instead of quoting one number.", to: "/for-fleets", cta: "How it works for fleets" },
    { k: "For cities and DOTs", h: "More out of the roads you already have.", p: "Smoothing waves lets a corridor carry more cars with no construction. Because Cruze reads your existing cameras, you can see real flow on your own roads before anything reaches a driver.", to: "/for-cities", cta: "How it works for cities" },
  ];
  return (
    <section className="border-t" style={{ borderColor: line, background: bg2 }}>
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
    ["Anudeep Bonagiri", "Co-founder", "CS at UT San Antonio. Leads the model, the product, and the company."],
    ["Srisanth Santhalkumar", "Co-founder", "Builds across the engineering and the day-to-day of getting Cruze off the ground."],
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
            <p className="mt-6 text-lg leading-relaxed" style={{ color: muted, fontFamily: body }}>
              We are a pre-seed company. There is a working detection model on live feeds, a physics
              engine still being built, and our first pilot roads lined up in Texas. We are not going
              to claim customers or savings we have not earned. If you run a fleet or a road network
              and want to be early, that is exactly who we want to hear from.
            </p>
            <a href="#contact" className="mt-8 inline-flex px-6 py-3 rounded-full font-medium text-[15px] transition-opacity hover:opacity-90" style={{ background: accent, color: "#fff", fontFamily: body }}>Say hello</a>
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
  ];
  return (
    <footer className="border-t" style={{ borderColor: line, background: bg }}>
      <div className="mx-auto max-w-6xl px-5 sm:px-6 py-12 grid sm:grid-cols-[1.5fr_1fr_1fr] gap-8" style={{ fontFamily: body }}>
        <div>
          <div className="font-bold text-xl mb-2" style={{ fontFamily: display, color: text }}>Cruze</div>
          <p className="text-sm max-w-xs" style={{ color: muted }}>Pre-seed. Building in Texas. This is a design preview, not the live site.</p>
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
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>Cruze — redesign preview</title>
      </Helmet>
      <Nav />
      <DriveHero />
      <LiveProof />
      <Problem />
      <Insight />
      <How />
      <Audiences />
      <Team />
      <Contact />
      <Footer />
    </div>
  );
}
