// Ring-road stop-and-go simulation used on the public site in place of live
// DOT camera video (see src/lib/featureFlags.ts). It is a model, not data:
// nothing here comes from a camera.
//
// Setup follows the classic Sugiyama et al. (2008) experiment: 22 cars on a
// circular track (theirs was 230 m; 300 m here, so cars move at city-street
// speed instead of a crawl). Human drivers use the Intelligent Driver Model (IDM,
// Treiber et al. 2000) plus a little random acceleration noise, which is
// enough to grow a stop-and-go wave out of uniform flow with no bottleneck.
// In the "with Cruze" ring one car (or a few) instead follows an advisory speed cue:
// hold the speed the road can sustain at its density and let the gap ahead
// breathe rather than chasing the car in front. That is the same idea as the single smoothing
// vehicle in Stern et al. (2018), simplified for a browser demo. Timing
// matters: in this model one car damps a wave that is still building, but a
// fully formed jam (several cars stopped) outlasts it, which is why the demo
// forks while the wave is young.

export type Car = {
  x: number; // position along the ring, metres
  v: number; // speed, m/s
  cruze: boolean; // follows the speed cue instead of plain IDM
  cue: number; // smoothed target speed (Cruze cars only), m/s
};

export type Ring = {
  cars: Car[];
  length: number;
  time: number;
  rand: () => number;
  hardBrakes: number; // count of decelerations harder than HARD_BRAKE
  braking: boolean[]; // per-car flag so one hard stop counts once
};

const VEH_LEN = 5; // m
// IDM parameters (human drivers).
const V0 = 30; // desired speed, m/s
const T = 1.0; // time headway, s
const A = 1.0; // max acceleration, m/s^2
const B = 1.5; // comfortable deceleration, m/s^2
const S0 = 2; // jam distance, m
const NOISE = 0.6; // std dev of acceleration noise, m/s^2
const HARD_BRAKE = -2.0; // m/s^2, counted as a hard brake
const CUE_MARGIN = 0.95; // cue sits a touch under the steady-flow speed

// Small deterministic PRNG so the demo (and its tests) are reproducible.
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(rand: () => number): number {
  const u = Math.max(rand(), 1e-9);
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function idm(v: number, gap: number, dv: number, v0: number): number {
  const sStar = S0 + Math.max(0, v * T + (v * dv) / (2 * Math.sqrt(A * B)));
  return A * (1 - Math.pow(v / v0, 4) - Math.pow(sStar / Math.max(gap, 0.1), 2));
}

// Speed at which IDM traffic with this bumper-to-bumper gap would flow
// steadily (zero acceleration, everyone at the same speed). Bisection on
// gap = s*(v) / sqrt(1 - (v/V0)^4).
export function equilibriumSpeed(gap: number): number {
  let lo = 0;
  let hi = V0;
  for (let i = 0; i < 40; i++) {
    const v = (lo + hi) / 2;
    const need = (S0 + v * T) / Math.sqrt(Math.max(1e-9, 1 - Math.pow(v / V0, 4)));
    if (need > gap) hi = v;
    else lo = v;
  }
  return lo;
}

export function createRing({
  cars = 22,
  length = 300,
  cruzeEvery = 0, // 0 = no Cruze cars; 11 = cars 0 and 11 follow the cue
  seed = 1,
}: { cars?: number; length?: number; cruzeEvery?: number; seed?: number } = {}): Ring {
  const rand = mulberry32(seed);
  const spacing = length / cars;
  const list: Car[] = [];
  for (let i = 0; i < cars; i++) {
    list.push({
      x: i * spacing,
      v: 6,
      cruze: cruzeEvery > 0 && i % cruzeEvery === 0,
      cue: 6,
    });
  }
  return { cars: list, length, time: 0, rand, hardBrakes: 0, braking: list.map(() => false) };
}

// Copy a ring's state (positions, speeds) so two rings can start from the
// same traffic. cruzeCars lists which cars follow the cue in the copy; each
// starts its cue at its own current speed. The copy gets its own noise
// stream from seed.
export function cloneRing(ring: Ring, { cruzeCars = [] as number[], seed = 7 } = {}): Ring {
  const cars = ring.cars.map((c, i) => ({ ...c, cruze: cruzeCars.includes(i), cue: c.v }));
  return { ...ring, cars, rand: mulberry32(seed), hardBrakes: 0, braking: cars.map(() => false) };
}

export function meanSpeed(ring: Ring): number {
  return ring.cars.reduce((s, c) => s + c.v, 0) / ring.cars.length;
}

// Spread of speeds around the ring right now. Near zero means smooth flow;
// large means some cars are stopped while others speed up (a wave).
export function speedSpread(ring: Ring): number {
  const m = meanSpeed(ring);
  return Math.sqrt(ring.cars.reduce((s, c) => s + (c.v - m) ** 2, 0) / ring.cars.length);
}

export function step(ring: Ring, dt = 0.1): void {
  const { cars, length } = ring;
  const n = cars.length;
  const target = CUE_MARGIN * equilibriumSpeed(length / n - VEH_LEN);
  const acc = new Array<number>(n);

  for (let i = 0; i < n; i++) {
    const me = cars[i];
    const lead = cars[(i + 1) % n];
    let gap = lead.x - me.x - VEH_LEN;
    if (gap < -VEH_LEN) gap += length; // wrap around the ring
    const dv = me.v - lead.v;

    if (me.cruze) {
      // The cue is the speed this road can hold steadily at its current
      // density (cars per metre, which is what a camera sees), eased in over
      // a few seconds. It ignores the wave's swings instead of mirroring them.
      me.cue += ((target - me.cue) * dt) / 5;
      const toward = 0.5 * (me.cue - me.v); // gently settle onto the cue
      const safe = idm(me.v, gap, dv, V0); // never closer than a human would follow
      acc[i] = Math.min(toward, safe);
    } else {
      acc[i] = idm(me.v, gap, dv, V0) + NOISE * gauss(ring.rand);
    }
  }

  for (let i = 0; i < n; i++) {
    const me = cars[i];
    const a = Math.max(acc[i], -9);
    if (a < HARD_BRAKE && me.v > 0.5) {
      if (!ring.braking[i]) ring.hardBrakes++;
      ring.braking[i] = true;
    } else if (a > -1) {
      ring.braking[i] = false;
    }
    me.v = Math.max(0, me.v + a * dt);
    me.x = (me.x + me.v * dt) % length;
  }

  // Keep cars from overlapping after a coarse step (no passing on the ring).
  for (let i = 0; i < n; i++) {
    const me = cars[i];
    const lead = cars[(i + 1) % n];
    let gap = lead.x - me.x;
    if (gap < 0) gap += length;
    if (gap < VEH_LEN + 0.5) {
      me.x = (lead.x - VEH_LEN - 0.5 + length) % length;
      me.v = Math.min(me.v, lead.v);
    }
  }

  ring.time += dt;
}

// The scenario the site shows: run one ring of human drivers for three
// minutes of model time, until a stop-and-go wave is building but cars have
// not yet stopped, then fork it into two identical rings. "without" keeps all human drivers; in "with",
// car 0 (one car in 22) switches to the Cruze speed cue.
export function startScenario(seed: number, warmup = 180): { without: Ring; with: Ring } {
  const base = createRing({ seed });
  for (let t = 0; t < warmup; t += 0.1) step(base, 0.1);
  return {
    without: cloneRing(base, { seed: seed + 1000 }),
    with: cloneRing(base, { cruzeCars: [0], seed: seed + 1000 }),
  };
}
