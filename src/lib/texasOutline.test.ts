// Pure-logic tests for the static Texas-outline map geometry (runs in the fast
// Node env - no DOM needed). CameraLocationsMap.tsx renders an <svg> whose
// viewBox is TEXAS_VIEWBOX, draws the state border from TEXAS_PATH, and plots a
// dot for each camera metro at TEXAS_CITY_POINTS[city]. All three share one
// projected 400x380 coordinate space, so a coordinate that drifts outside the
// box clips off-canvas and a malformed path breaks the border silently - none
// of which the type-checker or the delta-sweep can see. These tests pin that
// shared space: a well-formed closed path, every vertex inside the viewBox, and
// every city dot inside the viewBox and on (or within 1px of) the outline, so a
// dot lands on Texas rather than in the surrounding whitespace. The data is
// static on purpose (no network), so these invariants hold at build time.
import { describe, expect, it } from "vitest";
import { TEXAS_CITY_POINTS, TEXAS_PATH, TEXAS_VIEWBOX } from "./texasOutline";

// The projected box the component binds to viewBox and all coordinates live in.
const [vbMinX, vbMinY, vbWidth, vbHeight] = TEXAS_VIEWBOX.split(" ").map(Number);

// Parse "M119,8L139.5,8.5L...L118,8Z" into [x, y] vertices. The outline is one
// subpath of M/L commands closed by Z, so splitting on the command letters and
// reading the comma pairs recovers every vertex.
function parsePathPoints(path: string): [number, number][] {
  return path
    .replace(/^M/, "")
    .replace(/Z$/, "")
    .split(/[ML]/)
    .filter((seg) => seg.length > 0)
    .map((seg) => {
      const [x, y] = seg.split(",").map(Number);
      return [x, y] as [number, number];
    });
}

// Parsed once and shared: both the path and the city-dot checks read it.
const pathPoints = parsePathPoints(TEXAS_PATH);

// Even-odd ray cast: is [px, py] strictly inside the closed outline?
function pointInPolygon([px, py]: [number, number], poly: [number, number][]) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    const crosses =
      yi > py !== yj > py &&
      px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

// Shortest distance from [px, py] to the polygon's edges, so a dot sitting on a
// thin boundary tip (El Paso) still counts as "on the outline".
function distanceToOutline([px, py]: [number, number], poly: [number, number][]) {
  let min = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [x1, y1] = poly[j];
    const [x2, y2] = poly[i];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    const t = len2 ? Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2)) : 0;
    min = Math.min(min, Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy)));
  }
  return min;
}

describe("TEXAS_VIEWBOX", () => {
  it("is the 400x380 box the component and all coordinates assume", () => {
    expect(TEXAS_VIEWBOX).toBe("0 0 400 380");
  });

  it("parses to a zero-origin, positive-size box", () => {
    expect(vbMinX).toBe(0);
    expect(vbMinY).toBe(0);
    expect(vbWidth).toBeGreaterThan(0);
    expect(vbHeight).toBeGreaterThan(0);
  });
});

describe("TEXAS_PATH", () => {
  it("is a single closed subpath (moveto ... closepath)", () => {
    expect(TEXAS_PATH.startsWith("M")).toBe(true);
    expect(TEXAS_PATH.endsWith("Z")).toBe(true);
    // Only one subpath: the opening M is the only moveto command.
    expect(TEXAS_PATH.slice(1).includes("M")).toBe(false);
  });

  it("uses only the M/L/Z commands the parser understands", () => {
    // parsePathPoints splits on M/L and strips a trailing Z. A curve or
    // shorthand command (H/V/C/S/Q/T/A) or a space-delimited coordinate from a
    // regenerated path would parse into garbage pairs, so pin the vocabulary to
    // absolute moveto/lineto/closepath plus numeric coordinate characters.
    expect(TEXAS_PATH).toMatch(/^[MLZ0-9.,-]+$/);
  });

  it("is a detailed outline, not a truncated stub", () => {
    // The thinned Census boundary has hundreds of vertices; a sudden collapse
    // to a handful would mean the generator or an edit dropped most of them.
    expect(pathPoints.length).toBeGreaterThan(50);
  });

  it("has only finite numeric vertices", () => {
    for (const [x, y] of pathPoints) {
      expect(Number.isFinite(x)).toBe(true);
      expect(Number.isFinite(y)).toBe(true);
    }
  });

  it("keeps every vertex inside the viewBox (nothing clips off-canvas)", () => {
    for (const [x, y] of pathPoints) {
      expect(x).toBeGreaterThanOrEqual(vbMinX);
      expect(x).toBeLessThanOrEqual(vbMinX + vbWidth);
      expect(y).toBeGreaterThanOrEqual(vbMinY);
      expect(y).toBeLessThanOrEqual(vbMinY + vbHeight);
    }
  });
});

describe("TEXAS_CITY_POINTS", () => {
  const entries = Object.entries(TEXAS_CITY_POINTS);
  // El Paso's dot sits on the far-western tip, ~0.3px outside the thinned
  // outline, so allow a 1px skin; an off-state dot (e.g. the Gulf or New
  // Mexico) is tens of px away and still fails.
  const EDGE_TOLERANCE_PX = 1;

  it("covers the Texas metros the camera map plots", () => {
    const names = Object.keys(TEXAS_CITY_POINTS);
    expect(names).toEqual(
      expect.arrayContaining([
        "Austin",
        "Dallas",
        "Houston",
        "San Antonio",
        "Fort Worth",
        "El Paso",
      ]),
    );
  });

  it("gives every city a finite [x, y] pair", () => {
    for (const [, point] of entries) {
      expect(point).toHaveLength(2);
      const [x, y] = point;
      expect(Number.isFinite(x)).toBe(true);
      expect(Number.isFinite(y)).toBe(true);
    }
  });

  it("places every city dot inside the viewBox", () => {
    for (const [name, [x, y]] of entries) {
      expect(x, name).toBeGreaterThanOrEqual(vbMinX);
      expect(x, name).toBeLessThanOrEqual(vbMinX + vbWidth);
      expect(y, name).toBeGreaterThanOrEqual(vbMinY);
      expect(y, name).toBeLessThanOrEqual(vbMinY + vbHeight);
    }
  });

  it("places every city dot on the Texas outline (inside, or within 1px)", () => {
    for (const [name, point] of entries) {
      const onState =
        pointInPolygon(point, pathPoints) ||
        distanceToOutline(point, pathPoints) <= EDGE_TOLERANCE_PX;
      expect(onState, `${name} dot is off the state outline`).toBe(true);
    }
  });

  it("gives each metro a distinct dot (no two cities overlap)", () => {
    const seen = entries.map(([, [x, y]]) => `${x},${y}`);
    expect(new Set(seen).size).toBe(seen.length);
  });
});
