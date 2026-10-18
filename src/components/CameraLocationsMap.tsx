import type { LiveCamera } from "@/lib/liveCameras";
import { TEXAS_CITY_POINTS, TEXAS_PATH, TEXAS_VIEWBOX } from "@/lib/texasOutline";

// Map of the Texas DOT cameras Cruze works with, drawn as dots on a static
// state outline. It shows locations only: no camera image, no video and no
// network request. This is what the public site shows while live DOT imagery
// is behind the LIVE_DOT_CAMERAS flag (src/lib/featureFlags.ts).

// Labels sit to the right of the dot except where a neighbour would collide.
const LABEL_LEFT = new Set(["Fort Worth"]);

export default function CameraLocationsMap({
  cameras,
  activeId,
  className = "",
}: {
  cameras: LiveCamera[];
  activeId?: string;
  className?: string;
}) {
  const placed = cameras.filter((c) => TEXAS_CITY_POINTS[c.city]);
  const label = `Map of Texas showing traffic camera locations in ${placed.map((c) => c.city).join(", ")}`;

  return (
    <svg viewBox={TEXAS_VIEWBOX} className={className} role="img" aria-label={label}>
      <path d={TEXAS_PATH} fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.28)" strokeWidth={1.2} strokeLinejoin="round" />
      {placed.map((cam) => {
        const [x, y] = TEXAS_CITY_POINTS[cam.city];
        const active = cam.id === activeId;
        const left = LABEL_LEFT.has(cam.city);
        return (
          <g key={cam.id} data-camera={cam.id}>
            {active && (
              <circle cx={x} cy={y} r={14} fill="none" stroke="#00F2FF" strokeOpacity={0.5} strokeWidth={1.5}>
                <animate attributeName="r" values="7;16;7" dur="2.4s" repeatCount="indefinite" />
                <animate attributeName="stroke-opacity" values="0.6;0;0.6" dur="2.4s" repeatCount="indefinite" />
              </circle>
            )}
            <circle cx={x} cy={y} r={active ? 6 : 4.5} fill={active ? "#00F2FF" : "rgba(0,242,255,0.55)"} stroke="#07090C" strokeWidth={1.5} />
            <text
              x={left ? x - 9 : x + 9}
              y={y + 4}
              textAnchor={left ? "end" : "start"}
              fontSize={12}
              fontFamily="'Inter Tight', Inter, ui-sans-serif, system-ui, sans-serif"
              fill={active ? "#FFFFFF" : "rgba(255,255,255,0.55)"}
              fontWeight={active ? 600 : 400}
            >
              {cam.city}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
