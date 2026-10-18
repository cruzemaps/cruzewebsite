import { describe, expect, it } from "vitest";
import { createRing, equilibriumSpeed, meanSpeed, speedSpread, startScenario, step } from "./waveSim";

// The homepage simulation is the public stand-in for live camera video, so
// its headline behaviour is pinned here: human-only traffic on the ring grows
// a stop-and-go wave, and one car on the Cruze cue (1 of 22) smooths it out.
// If a tweak to the model breaks that, the demo would be telling a story the
// model no longer shows.

const run = (ring: ReturnType<typeof createRing>, seconds: number) => {
  for (let i = 0; i < seconds * 10; i++) step(ring, 0.1);
};

describe("waveSim", () => {
  it("is deterministic for a seed", () => {
    const a = startScenario(3);
    const b = startScenario(3);
    run(a.with, 20);
    run(b.with, 20);
    expect(a.with.cars.map((c) => c.x)).toEqual(b.with.cars.map((c) => c.x));
  });

  it("grows a stop-and-go wave from near-uniform flow with human drivers only", () => {
    const ring = createRing({ seed: 1 });
    run(ring, 5);
    const early = speedSpread(ring);
    let slowest = Infinity;
    for (let i = 0; i < 2750; i++) {
      step(ring, 0.1);
      slowest = Math.min(slowest, ...ring.cars.map((c) => c.v));
    }
    expect(speedSpread(ring)).toBeGreaterThan(early * 3);
    expect(slowest).toBeLessThan(1); // cars come to a near stop
  });

  // The site restarts the demo after 100 model seconds, so that is the window.
  it.each([1, 2, 3, 4, 5, 6])("one car on the Cruze cue dissolves the wave (seed %i)", (seed) => {
    const { without, with: withCruze } = startScenario(seed);
    expect(withCruze.cars.filter((c) => c.cruze)).toHaveLength(1);
    run(without, 100);
    run(withCruze, 100);
    expect(speedSpread(withCruze)).toBeLessThan(1.5);
    expect(speedSpread(without)).toBeGreaterThan(speedSpread(withCruze) * 2);
    expect(withCruze.hardBrakes).toBeLessThan(without.hardBrakes / 2);
    // Smoothing must not come from slowing the whole ring down.
    expect(meanSpeed(withCruze)).toBeGreaterThan(meanSpeed(without));
  });

  it.each([1, 3, 5, 6])("without Cruze the young wave grows into full stops (demo seed %i)", (seed) => {
    const { without } = startScenario(seed);
    expect(without.cars.some((c) => c.v < 1)).toBe(false); // not stopped yet at the fork
    let stopped = 0;
    for (let i = 0; i < 1100; i++) {
      step(without, 0.1);
      stopped = Math.max(stopped, without.cars.filter((c) => c.v < 1).length);
    }
    expect(stopped).toBeGreaterThanOrEqual(3);
  });

  it("aims the cue at the steady-flow speed for the ring's density", () => {
    // 22 cars on 300 m: about 8.6 m bumper to bumper.
    const v = equilibriumSpeed(300 / 22 - 5);
    expect(v).toBeGreaterThan(5);
    expect(v).toBeLessThan(8);
  });

  it("never lets cars overlap", () => {
    const { without } = startScenario(2);
    for (let i = 0; i < 600; i++) {
      step(without, 0.1);
      const xs = without.cars.map((c) => c.x);
      for (let j = 0; j < xs.length; j++) {
        let gap = xs[(j + 1) % xs.length] - xs[j];
        if (gap < 0) gap += without.length;
        expect(gap).toBeGreaterThanOrEqual(5);
      }
    }
  });
});
