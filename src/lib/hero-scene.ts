/**
 * Hero scene: a hiker seen from behind walks his ridge toward the sun, in
 * vector (SVG paths, blue ink on white).
 *
 * What moves, and why it reads as walking:
 * - the far range and the sun stay still (far away, they would not move);
 * - two big mountains, one on each side, start small near the horizon, grow
 *   as he walks and pass by on their side before leaving the frame, then come
 *   back far away (staggered, so one is always on its way);
 * - low foothills on both sides of an open valley do the same, closer in;
 * - pebbles and tufts on his own ridge stream toward the viewer with his steps.
 *
 * Every mountain is a rigid world-space profile (with its slope strokes)
 * projected in perspective: it only grows and slides, it never changes shape.
 * The same code draws the first frame on the server (fixed seed), so the scene
 * shows without JS and with reduced motion.
 */

export const VIEW = { w: 800, h: 640 } as const;
export const HORIZON = 314; // eye level: through the hiker's head, which hides the vanishing point
export const CX = 470; // vanishing point: the hiker walks toward it
export const FEET_Y = 412; // where the hiker stands on his ridge

const F = 300; // focal length (px)
const CAM = 3; // camera height: the hiker stands on a summit above the range
const Z_BIRTH = 600; // depth at birth: a speck small enough to hide behind the hiker's head
const Z_PAST = 1; // depth at p = 1; it keeps walking past until fully out of frame
const WALK = 32; // seconds from birth to walked past, the same for every mountain

/** Depth along a mountain's walk-by: born a speck at the vanishing point,
 *  hidden behind the hiker's head (p = 0), it grows at a steady rate and
 *  passes by (p = 1 and a little beyond). No fade: it is opaque from its first
 *  frame, so nothing ever shows through. All mountains share the same rate, so
 *  their depth order never changes while they are in view. */
export const depth = (p: number) => Z_BIRTH * (Z_PAST / Z_BIRTH) ** p;

/** Small seeded PRNG so server and client draw the same first frame. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Pt = [number, number]; // world x, height
type Seg = [number, number, number, number];

export interface Layer {
  kind: "peak" | "hill";
  side: -1 | 1;
  p: number; // 0 = born at the vanishing point, ~1 = walking past
  profile: Pt[];
  hatch: Seg[];
}

interface Decal {
  t: number; // 0 at the hiker's feet, 1 at the bottom edge
  u: number; // -1..1 across the ridge
  kind: 0 | 1 | 2; // tuft, rock, pebbles
  seed: number;
}

interface Cloud {
  x: number;
  y: number;
  len: number;
  speed: number;
  seed: number;
}

/** Three birds flying across now and then (dot rendering only). */
interface Flock {
  x: number;
  y: number;
  dir: 1 | -1;
  wait: number; // s until the next pass (0 while crossing)
  t: number; // s since the pass began, for the wing beats
}

export interface Scene {
  layers: Layer[];
  backdrop: { z: number; d: string; opacity: number }[];
  decals: Decal[];
  clouds: Cloud[];
  flock: Flock;
  rand: () => number;
}

// ------------------------------------------------------------ mountains

/** Slope strokes from the main summits, in world space (so they stay put). */
function hatchFor(profile: Pt[], rand: () => number, minProm: number): Seg[] {
  const out: Seg[] = [];
  for (let i = 3; i < profile.length - 3; i++) {
    const [x, h] = profile[i];
    if (!(h > profile[i - 1][1] && h >= profile[i + 1][1] && h > profile[i - 3][1] && h > profile[i + 3][1])) continue;
    // Prominence: how far the ground drops on either side within a short span.
    let lo = h;
    for (let k = Math.max(0, i - 25); k < Math.min(profile.length, i + 25); k++) lo = Math.min(lo, profile[k][1]);
    const prom = h - lo;
    if (prom < minProm) continue;
    const lean = rand() < 0.5 ? -1 : 1;
    const len = prom * (0.45 + rand() * 0.2);
    out.push([x, h - 0.02, x + lean * len * 0.42, h - len]);
    if (prom > minProm * 2) out.push([x - lean * 0.05, h - 0.12, x - lean * len * 0.3, h - len * 0.62]);
  }
  return out;
}

/** Outline height at world x. */
function heightAt(profile: Pt[], x: number): number {
  for (let i = 1; i < profile.length; i++) {
    const [ax, ah] = profile[i - 1];
    const [bx, bh] = profile[i];
    if ((x - ax) * (x - bx) <= 0) return ax === bx ? Math.max(ah, bh) : ah + ((bh - ah) * (x - ax)) / (bx - ax);
  }
  return -Infinity;
}

/** Trim slope strokes to the part that lies inside the mountain, a little
 *  under its outline, so no stroke ever pokes out into the sky. */
function inside(profile: Pt[], segs: Seg[]): Seg[] {
  const out: Seg[] = [];
  const N = 24;
  for (const [x1, h1, x2, h2] of segs) {
    const at = (t: number): Pt => [x1 + (x2 - x1) * t, h1 + (h2 - h1) * t];
    // Longest run of samples under the outline.
    let best: [number, number] | null = null;
    let start = -1;
    for (let i = 0; i <= N; i++) {
      const [x, h] = at(i / N);
      if (h > heightAt(profile, x) - 0.06) {
        start = -1;
        continue;
      }
      if (start < 0) start = i / N;
      if (!best || i / N - start > best[1] - best[0]) best = [start, i / N];
    }
    if (!best || best[1] - best[0] < 0.25) continue;
    const a = at(best[0]);
    const b = at(best[1]);
    out.push([a[0], a[1], b[0], b[1]]);
  }
  return out;
}

/** A big lone mountain with a shoulder, centred on one side of the valley. */
function makePeak(rand: () => number, side: -1 | 1, p: number): Layer {
  const H = 5.4 + rand() * 1.2;
  const W = 3.2 + rand() * 0.8;
  const xc = side * (4 + rand() * 0.6);
  // Normalised outline: foot, shoulder, summit, notch, secondary top, foot.
  const keys: Pt[] = [
    [-1.9, 0.06], [-1, 0.22], [-0.62, 0.42], [-0.4, 0.5], [-0.18, 0.74], [0, 1],
    [0.12, 0.86], [0.24, 0.9], [0.4, 0.66], [0.58, 0.48], [0.8, 0.34], [1.1, 0.2], [1.9, 0.05],
  ];
  if (side > 0) keys.reverse().forEach((k) => (k[0] = -k[0])); // shoulder faces the valley
  const outline: Pt[] = [];
  for (let i = 0; i < keys.length - 1; i++) {
    const [ax, ah] = keys[i];
    const [bx, bh] = keys[i + 1];
    const steps = 6;
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const tremble = s === 0 ? 0 : (rand() - 0.5) * 0.06;
      outline.push([xc + (ax + (bx - ax) * t) * W, (ah + (bh - ah) * t) * H + tremble]);
    }
  }
  outline.push([xc + keys[keys.length - 1][0] * W, keys[keys.length - 1][1] * H]);
  // Its foot stops short of the hiker's line of sight: past it, it would show
  // on his other side, as a stray line behind him.
  const profile = outline.filter(([x]) => side * x > 0.3);
  // Strokes: down both flanks from the summit and the secondary top.
  const top = profile.reduce((a, b) => (b[1] > a[1] ? b : a));
  const hatch: Seg[] = [
    [top[0], top[1] - 0.05, top[0] - W * 0.34, top[1] - H * 0.52],
    [top[0] + 0.05 * W, top[1] - 0.2, top[0] + W * 0.28, top[1] - H * 0.4],
    [top[0] - 0.1 * W, top[1] - H * 0.22, top[0] - W * 0.16, top[1] - H * 0.62],
    [top[0] + 0.3 * W * side, top[1] - H * 0.16, top[0] + 0.42 * W * side, top[1] - H * 0.5],
  ];
  return { kind: "peak", side, p, profile, hatch: inside(profile, hatch) };
}

/** Low foothills on one side, rising away from an open central valley. */
function makeHills(rand: () => number, side: -1 | 1, p: number): Layer {
  const f = [0.42 + rand() * 0.15, 1.1 + rand() * 0.4];
  const ph = [rand() * 2, rand() * 2];
  const amp = 1.4 + rand() * 0.6;
  const profile: Pt[] = [];
  for (let x = 2.8; x <= 14; x += 0.08) {
    const tri = (k: number) => {
      const t = (f[k] * x + ph[k]) % 2;
      return 1 - Math.abs(t - 1);
    };
    const rise = Math.min(1, (x - 2.8) / 2.6); // the valley floor opens toward the centre
    const h = rise * amp * Math.max(tri(0), 0.6 * tri(1) + 0.1) + Math.sin(x * 11 + ph[0] * 9) * 0.02;
    profile.push([side * x, h]);
  }
  if (side < 0) profile.reverse();
  return { kind: "hill", side, p, profile, hatch: inside(profile, hatchFor(profile, rand, 0.5)) };
}

/** Far range: full width, low, pale, never moving, and kept well under the
 *  horizon line so the two never touch. */
function backdrop(rand: () => number, z: number, amp: number): string {
  const f = [0.16 + rand() * 0.05, 0.47 + rand() * 0.1, 1.3 + rand() * 0.3];
  const p = [rand() * 2, rand() * 2, rand() * 2];
  let d = "";
  for (let sx = -12; sx <= VIEW.w + 12; sx += 4) {
    const x = ((sx - CX) * z) / F;
    const tri = (k: number) => {
      const t = (((f[k] * x + p[k]) % 2) + 2) % 2;
      return 1 - Math.abs(t - 1);
    };
    const h = amp * Math.max(tri(0), 0.7 * tri(1) + 0.05, 0.35 * tri(2) + 0.15) + 0.4;
    const sy = HORIZON + ((CAM - h) * F) / z;
    d += `${d ? "L" : "M"}${sx} ${n1(sy)}`;
  }
  return `${d}L${VIEW.w + 40} ${VIEW.h + 40}L-40 ${VIEW.h + 40}Z`;
}

// ------------------------------------------------------------ scene state

export function createScene(seed = 11): Scene {
  const rand = rng(seed);
  // Evenly staggered: a new mountain sets off every quarter walk, and one big
  // mountain is always on its way.
  const layers: Layer[] = [
    makePeak(rand, -1, 0.6),
    makePeak(rand, 1, 0.1),
    makeHills(rand, -1, 0.35),
    makeHills(rand, 1, 0.85),
  ];
  const decals: Decal[] = Array.from({ length: 22 }, (_, i) => ({
    t: i / 22 + rand() * 0.03,
    u: rand() * 2 - 1,
    kind: Math.floor(rand() * 3) as 0 | 1 | 2,
    seed: rand() * 1000,
  }));
  const clouds: Cloud[] = [
    { x: 330, y: 150, len: 170, speed: 4.4, seed: 2 },
    { x: 120, y: 214, len: 140, speed: 5.2, seed: 4 },
    { x: 640, y: 196, len: 150, speed: 4.8, seed: 5 },
  ];
  return {
    layers,
    backdrop: [{ z: 40, d: backdrop(rand, 40, 1.4), opacity: 0.45 }],
    decals,
    clouds,
    flock: { x: -80, y: 150, dir: 1, wait: 5, t: 0 },
    rand,
  };
}

/** Move the world forward by `dt` seconds. `pace` (0..1) is how fast he walks
 *  the world past: 0 once he stops (HeroDots.astro), the clouds drift on. */
export function advance(scene: Scene, dt: number, pace = 1): void {
  const walk = dt * pace;
  for (const [i, l] of scene.layers.entries()) {
    l.p += walk / WALK;
    if (l.p >= 1 && !inView(l)) {
      // Walked past and out of frame: a new one is born at the vanishing point
      // (keeping the overshoot, so the stagger holds; it is still hidden then).
      const p = l.p - 1;
      scene.layers[i] = l.kind === "peak" ? makePeak(scene.rand, l.side, p) : makeHills(scene.rand, l.side, p);
    }
  }
  for (const d of scene.decals) {
    d.t += walk * 0.085;
    if (d.t > 1) {
      d.t -= 1;
      d.u = scene.rand() * 2 - 1;
      d.kind = Math.floor(scene.rand() * 3) as 0 | 1 | 2;
      d.seed = scene.rand() * 1000;
    }
  }
  for (const c of scene.clouds) {
    c.x -= c.speed * dt;
    if (c.x + c.len < -20) c.x = VIEW.w + 20 + scene.rand() * 80;
  }
  const f = scene.flock;
  if (f.wait > 0) {
    f.wait -= dt;
    if (f.wait <= 0) {
      // Off they go, from either side, at some height in the sky.
      f.dir = scene.rand() < 0.5 ? 1 : -1;
      f.x = f.dir > 0 ? -80 : VIEW.w + 80;
      f.y = 80 + scene.rand() * 110;
      f.t = 0;
    }
  } else {
    f.x += f.dir * 62 * dt;
    f.t += dt;
    if (f.x < -100 || f.x > VIEW.w + 100) f.wait = 16 + scene.rand() * 18;
  }
}

/** The three birds as wing strokes: a loose V, each beating its own wings. */
export function flockFrame(f: Flock): string {
  if (f.wait > 0) return "";
  let d = "";
  const place: Pt[] = [
    [0, 0],
    [-26, 9],
    [-44, -6],
  ];
  place.forEach(([dx, dy], i) => {
    const x = f.x + dx * f.dir;
    const y = f.y + dy + Math.sin(f.t * 1.4 + i * 1.7) * 2.5;
    const beat = Math.sin(f.t * 2 * Math.PI * 1.6 + i * 1.9);
    const span = 9.5 - i * 0.8;
    const tip = -beat * 5.5 - 1; // wing tips up and down
    d += `M${n1(x - span)} ${n1(y + tip)}Q${n1(x - span * 0.45)} ${n1(y - 2.5 - beat)} ${n1(x)} ${n1(y)}`;
    d += `Q${n1(x + span * 0.45)} ${n1(y - 2.5 - beat)} ${n1(x + span)} ${n1(y + tip)}`;
  });
  return d;
}

// ---------------------------------------------------------------- drawing

const n1 = (v: number) => Math.round(v * 10) / 10;
export const proj = (x: number, h: number, z: number): Pt => [CX + (x * F) / z, HORIZON + ((CAM - h) * F) / z];

/** Whether any part of a mountain (its outline, or the body under it) is in
 *  frame. Only checked once it has walked past, so it never vanishes in view. */
function inView(l: Layer): boolean {
  const z = depth(l.p);
  const bottom = VIEW.h + 4; // stroke width
  let prev: Pt | null = null;
  for (const [x, h] of l.profile) {
    const pt = proj(x, h, z);
    if (pt[0] >= 0 && pt[0] <= VIEW.w && pt[1] < bottom) return true;
    // An outline segment entering through a side of the frame between two samples.
    if (prev) {
      for (const edge of [0, VIEW.w]) {
        if ((prev[0] - edge) * (pt[0] - edge) >= 0) continue;
        const y = prev[1] + ((pt[1] - prev[1]) * (edge - prev[0])) / (pt[0] - prev[0]);
        if (y < bottom) return true;
      }
    }
    prev = pt;
  }
  return false;
}

export interface LayerFrame {
  fill: string; // the shape closed to the bottom, filled white (hides what is behind)
  d: string; // the outline only, open (no stroke down the cut ends)
  hatch: string;
  width: number;
  fillOpacity: number; // opaque once arrived: a mountain hides what is behind it
  lineOpacity: number; // paler far away
}

export function layerFrame(l: Layer): LayerFrame {
  const z = depth(l.p);
  let d = "";
  let first: Pt | null = null;
  let last: Pt | null = null;
  for (const [x, h] of l.profile) {
    const [sx, sy] = proj(x, h, z);
    if (sx < -120 || sx > VIEW.w + 120) continue;
    if (!first) first = [sx, sy];
    last = [sx, sy];
    d += `${d ? "L" : "M"}${n1(sx)} ${n1(sy)}`;
  }
  const fill = first && last ? `${d}L${n1(last[0])} ${VIEW.h + 40}L${n1(first[0])} ${VIEW.h + 40}Z` : "";
  let hatch = "";
  for (const [x1, h1, x2, h2] of l.hatch) {
    const a = proj(x1, h1, z);
    const b = proj(x2, h2, z);
    if (Math.max(a[0], b[0]) < -20 || Math.min(a[0], b[0]) > VIEW.w + 20) continue;
    hatch += `M${n1(a[0])} ${n1(a[1])}L${n1(b[0])} ${n1(b[1])}`;
  }
  // Nearer means a darker, slightly thicker line. The fill is always opaque.
  const near = Math.min(1, l.p);
  return {
    fill,
    d,
    hatch,
    width: n1(0.9 + near * 0.8),
    fillOpacity: 1,
    lineOpacity: Math.round((0.5 + 0.5 * near) * 100) / 100,
  };
}

/** The hiker's own ridge: a mound from his feet down to the bottom edge. */
export const GROUND_PATH = (() => {
  const top = FEET_Y - 6;
  return [
    `M${CX - 330} ${VIEW.h + 20}`,
    `C${CX - 250} ${VIEW.h - 60} ${CX - 170} ${top + 120} ${CX - 104} ${top + 64}`,
    `C${CX - 80} ${top + 44} ${CX - 62} ${top + 40} ${CX - 44} ${top + 22}`,
    `C${CX - 30} ${top + 8} ${CX - 14} ${top} ${CX + 4} ${top - 1}`,
    `C${CX + 26} ${top} ${CX + 40} ${top + 12} ${CX + 58} ${top + 30}`,
    `C${CX + 84} ${top + 56} ${CX + 120} ${top + 72} ${CX + 150} ${top + 104}`,
    `C${CX + 210} ${top + 168} ${CX + 270} ${VIEW.h - 40} ${CX + 330} ${VIEW.h + 20}`,
    "Z",
  ].join("");
})();

/** Half-width of the hiker's ridge at screen y (matches GROUND_PATH roughly). */
const ridgeHalf = (y: number) => 14 + (y - FEET_Y) * 1.05;

export function decalFrame(d: Decal): string {
  const y = FEET_Y + 4 + (VIEW.h + 30 - FEET_Y) * d.t * d.t;
  const s = 0.3 + 1.7 * d.t;
  const x = CX + d.u * ridgeHalf(y) * 0.86;
  const r = rng(Math.floor(d.seed));
  if (d.kind === 0) {
    // Tuft: a fan of short blades.
    let p = "";
    for (let i = 0; i < 5; i++) {
      const a = -1.2 + i * 0.6 + (r() - 0.5) * 0.3;
      const l = (6 + r() * 5) * s;
      p += `M${n1(x + (i - 2) * 1.2 * s)} ${n1(y)}q${n1(Math.sin(a) * l * 0.4)} ${n1(-l * 0.6)} ${n1(Math.sin(a) * l)} ${n1(-l)}`;
    }
    return p;
  }
  if (d.kind === 1) {
    // Rock: a lumpy outline with a crease.
    const w = (7 + r() * 6) * s;
    const h = w * (0.55 + r() * 0.2);
    return `M${n1(x - w)} ${n1(y)}q${n1(w * 0.15)} ${n1(-h * 1.1)} ${n1(w * 0.85)} ${n1(-h)}q${n1(w * 0.8)} ${n1(-h * 0.2)} ${n1(w * 1.15)} ${n1(h)}M${n1(x - w * 0.1)} ${n1(y - h * 0.9)}l${n1(w * 0.25)} ${n1(h * 0.7)}`;
  }
  // Pebbles: a few dots.
  let p = "";
  for (let i = 0; i < 4; i++) {
    const px = x + (r() - 0.5) * 16 * s;
    const py = y + (r() - 0.5) * 4 * s;
    const rr = Math.max(0.6, (0.6 + r() * 0.9) * s);
    p += `M${n1(px - rr)} ${n1(py)}a${n1(rr)} ${n1(rr)} 0 1 0 ${n1(rr * 2)} 0a${n1(rr)} ${n1(rr)} 0 1 0 ${n1(-rr * 2)} 0`;
  }
  return p;
}

export function cloudFrame(c: Cloud): string {
  // Two or three long, slightly wavy strokes, like the drawing's cirrus.
  const r = rng(c.seed * 97);
  let p = "";
  const rows = 2 + (c.seed % 2);
  for (let k = 0; k < rows; k++) {
    const x0 = c.x + k * c.len * 0.12 + r() * 10;
    const y0 = c.y + k * 6;
    const len = c.len * (1 - k * 0.22);
    p += `M${n1(x0)} ${n1(y0)}`;
    const segs = 4;
    for (let i = 1; i <= segs; i++) {
      const x = x0 + (len * i) / segs;
      const y = y0 + Math.sin(i * 1.7 + c.seed) * 2.2;
      p += `Q${n1(x - len / segs / 2)} ${n1(y0 + (i % 2 ? -3 : 3))} ${n1(x)} ${n1(y)}`;
    }
  }
  return p;
}

/** Every mountain, far first, so a nearer one is drawn over (and hides) a
 *  farther one. The still far range always stays behind: a mountain coming in
 *  rises in front of it, never through it. */
export function sceneFrame(scene: Scene) {
  const still = scene.backdrop.map(
    (b): LayerFrame => ({ fill: b.d, d: b.d, hatch: "", width: 0.8, fillOpacity: 1, lineOpacity: b.opacity }),
  );
  const moving = scene.layers
    .map((l) => ({ z: depth(l.p), frame: layerFrame(l) }))
    .sort((a, b) => b.z - a.z)
    .map((x) => x.frame);
  return {
    layers: [...still, ...moving],
    decals: scene.decals.map(decalFrame).join(""),
    clouds: scene.clouds.map(cloudFrame).join(""),
  };
}

export const LAYER_COUNT = 5; // the still far range + 2 big mountains + 2 foothills
