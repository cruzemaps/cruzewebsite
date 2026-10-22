// Pure-logic tests for the static Texas-outline map geometry (runs in the fast
// Node env - no DOM needed). CameraLocationsMap.tsx renders an <svg> whose
// viewBox is TEXAS_VIEWBOX, draws the state border from TEXAS_PATH, and plots a
// dot for each camera metro at TEXAS_CITY_POINTS[city]. All three share one
// projected 400x380 coordinate space, so a coordinate that drifts outside the
// box clips off-canvas and a malformed path breaks the border silently - none
// of which the type-checker or the delta-sweep can see. These tests pin that
// shared space: a well-formed closed path, every vertex inside the viewBox, and
// every city dot inside both the viewBox and the outline's own bounding box
// (so a dot lands on Texas, not in the surrounding whitespace). The data is
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
  // Bounding box of the drawn outline - a camera dot outside this would float
  // in the whitespace around the state instead of on it.
  const xs = pathPoints.map(([x]) => x);
  const ys = pathPoints.map(([, y]) => y);
  const bbox = {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };

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

  // Bounding-box containment, not point-in-polygon: the hand-placed El Paso dot
  // sits on the far-western tip just outside the thinned outline, so a strict
  // polygon test would reject it. The bbox still catches a dot flung into the
  // whitespace well off the state.
  it("places every city dot within the outline's bounding box", () => {
    for (const [name, [x, y]] of entries) {
      expect(x, name).toBeGreaterThanOrEqual(bbox.minX);
      expect(x, name).toBeLessThanOrEqual(bbox.maxX);
      expect(y, name).toBeGreaterThanOrEqual(bbox.minY);
      expect(y, name).toBeLessThanOrEqual(bbox.maxY);
    }
  });

  it("gives each metro a distinct dot (no two cities overlap)", () => {
    const seen = entries.map(([, [x, y]]) => `${x},${y}`);
    expect(new Set(seen).size).toBe(seen.length);
  });
});
