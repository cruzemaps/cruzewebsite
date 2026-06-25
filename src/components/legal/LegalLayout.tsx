import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ChevronDown, ArrowUpRight } from "lucide-react";

/**
 * Shared shell for the static legal + support pages (/privacy, /support,
 * /terms). It mirrors the homepage (V3) brand exactly: the same dark cinematic
 * palette, the same Space Grotesk / Inter Tight type pair, and a Nav + Footer
 * that match V3's so these pages do not feel bolted on. Kept self-contained so
 * the App Store / Play Store reviewers land on an on-brand, readable document.
 */

const bg = "#0B0D11";
const bg2 = "#0F1218";
const text = "#F2F3F5";
const muted = "#9AA0A8";
const line = "rgba(255,255,255,0.10)";
const accent = "#E8590C";

const display = "'Space Grotesk', ui-sans-serif, system-ui, sans-serif";
const body = "'Inter Tight', ui-sans-serif, system-ui, sans-serif";

const CAMERA_MAP_URL = "https://cruze-camera-visualization.vercel.app";

export const legalTokens = { bg, bg2, text, muted, line, accent, display, body };

function useFonts() {
  useEffect(() => {
    if (document.getElementById("v3-fonts")) return;
    const pre1 = Object.assign(document.createElement("link"), { rel: "preconnect", href: "https://fonts.googleapis.com" });
    const pre2 = Object.assign(document.createElement("link"), { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" });
    const l = document.createElement("link");
    l.id = "v3-fonts";
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter+Tight:wght@400;500;600&display=swap";
    document.head.append(pre1, pre2, l);
  }, []);
}

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
          <Link to="/insights" className="hover:text-white transition-colors">Insights</Link>
          <Link to="/investors" className="hover:text-white transition-colors">Investors</Link>
          <Link to="/support" className="hover:text-white transition-colors">Support</Link>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/support" className="hidden sm:inline-flex text-[15px] font-medium px-4 py-2 rounded-full transition-opacity hover:opacity-90" style={{ background: accent, color: "#fff", fontFamily: body }}>Get support</Link>
          <button className="md:hidden p-1.5" style={{ color: text }} onClick={() => setOpen((o) => !o)} aria-label="Menu">{open ? <X size={22} /> : <Menu size={22} />}</button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t px-5 py-4 flex flex-col gap-1" style={{ borderColor: line, background: bg, fontFamily: body }}>
          {solutions.map((s) => <Link key={s.to} to={s.to} className="py-2.5" style={{ color: muted }} onClick={() => setOpen(false)}>{s.label}</Link>)}
          <a href={CAMERA_MAP_URL} target="_blank" rel="noopener noreferrer" className="py-2.5" style={{ color: muted }}>Live camera map</a>
          <Link to="/insights" className="py-2.5" style={{ color: muted }} onClick={() => setOpen(false)}>Insights</Link>
          <Link to="/investors" className="py-2.5" style={{ color: muted }} onClick={() => setOpen(false)}>Investors</Link>
          <Link to="/support" className="py-2.5" style={{ color: muted }} onClick={() => setOpen(false)}>Support</Link>
        </div>
      )}
    </nav>
  );
}

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

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  useFonts();
  return (
    <div style={{ background: bg, color: text, fontFamily: body, minHeight: "100vh" }}>
      <Nav />
      <main className="pt-16">{children}</main>
      <Footer />
    </div>
  );
}
