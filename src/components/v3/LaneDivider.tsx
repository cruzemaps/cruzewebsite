import { useEffect } from "react";

/**
 * Thin animated lane-dash strip placed between sections so the road motif
 * threads the whole page. GPU transform only, and the animation is gated behind
 * `prefers-reduced-motion: no-preference`, so reduced-motion users get a static
 * dashed line instead of moving dashes.
 */

const CSS = `
@keyframes lane-scroll { from { transform: translate(0, -50%); } to { transform: translate(-50%, -50%); } }
.lane-div-track { transform: translate(0, -50%); }
@media (prefers-reduced-motion: no-preference) {
  .lane-div-track { animation: lane-scroll 5s linear infinite; }
}
`;

function useInjectCSS() {
  useEffect(() => {
    if (document.getElementById("lane-div-style")) return;
    const s = document.createElement("style");
    s.id = "lane-div-style";
    s.textContent = CSS;
    document.head.appendChild(s);
  }, []);
}

export default function LaneDivider() {
  useInjectCSS();
  return (
    <div aria-hidden style={{ position: "relative", height: 22, overflow: "hidden", background: "#0A0C10" }}>
      <div className="lane-div-track" style={{ position: "absolute", top: "50%", left: 0, width: "200%", height: 2, display: "flex" }}>
        {[0, 1].map((k) => (
          <div key={k} style={{ width: "50%", height: "100%", background: "repeating-linear-gradient(90deg, rgba(233,177,58,0.28) 0 26px, transparent 26px 92px)" }} />
        ))}
      </div>
    </div>
  );
}
