import { useEffect, useRef, useState } from "react";

/**
 * Fixed "highway" progress rail down the side of the page. As you drive down,
 * the orange fill and marker advance and each section's exit lights up; clicking
 * an exit jumps there. This is the connective road motif plus a progress
 * indicator and skip-ahead nav (all recommended for long scroll pages).
 *
 * Motion here is scroll-driven and discrete (no autoplay loops), so it is fine
 * under reduced-motion. Hidden below xl so it never crowds the content column.
 */

const accent = "#E8590C";

const SECTIONS: [string, string][] = [
  ["drive", "The drive"],
  ["live", "Live road"],
  ["problem", "The problem"],
  ["insight", "Why it works"],
  ["how", "How it works"],
  ["audiences", "Who it's for"],
  ["team", "The team"],
  ["contact", "Talk to us"],
];

export default function RoadRail() {
  const [active, setActive] = useState(0);
  const ratios = useRef<number[]>(SECTIONS.map(() => 0));

  useEffect(() => {
    const index = new Map(SECTIONS.map(([id], i) => [id, i]));
    const els = SECTIONS.map(([id]) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const i = index.get(e.target.id);
          if (i != null) ratios.current[i] = e.isIntersecting ? e.intersectionRatio : 0;
        }
        let best = -1, bi = 0;
        ratios.current.forEach((r, i) => { if (r > best) { best = r; bi = i; } });
        setActive(bi);
      },
      { threshold: [0, 0.15, 0.4, 0.7, 1], rootMargin: "-18% 0px -34% 0px" }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const n = SECTIONS.length;
  const pct = (i: number) => (i / (n - 1)) * 100;

  return (
    <div className="hidden xl:block" aria-hidden style={{ position: "fixed", left: 26, top: "50%", transform: "translateY(-50%)", height: "min(600px, 66vh)", width: 26, zIndex: 40 }}>
      {/* track — clean hairline with an orange progress fill */}
      <div style={{ position: "absolute", left: 12, top: 0, bottom: 0, width: 1.5, background: "rgba(255,255,255,0.10)", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: `${pct(active)}%`, background: accent, transition: "height .55s cubic-bezier(.22,1,.36,1)" }} />
      </div>

      {/* exits */}
      {SECTIONS.map(([id, label], i) => {
        const done = i <= active;
        const here = i === active;
        return (
          <button
            key={id}
            onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })}
            className="group"
            style={{ position: "absolute", top: `${pct(i)}%`, left: 0, transform: "translateY(-50%)", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", cursor: "pointer", padding: 0 }}
          >
            <span style={{ width: here ? 10 : 6, height: here ? 10 : 6, borderRadius: 999, background: done ? accent : "rgba(255,255,255,0.28)", boxShadow: here ? `0 0 9px rgba(232,89,12,0.7)` : "none", transition: "all .3s" }} />
            <span
              className="opacity-0 group-hover:opacity-100"
              style={{ position: "absolute", left: 28, whiteSpace: "nowrap", fontFamily: "'Inter Tight', sans-serif", fontSize: 12, color: "#fff", background: "rgba(11,13,17,0.92)", border: "1px solid rgba(255,255,255,0.12)", padding: "3px 9px", borderRadius: 8, transition: "opacity .2s", pointerEvents: "none" }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
