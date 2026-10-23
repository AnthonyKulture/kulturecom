/**
 * Fourth illustration: a wide view of a mountain lake, as a tone map for the
 * dot screen (halftone.ts). Far range, a great snowy peak, wooded shoulders,
 * the lake mirroring them, a shore with pines in front; the sun, drifting
 * clouds and a few birds in the sky. Light from the left: the slopes facing
 * right are the dense ones.
 *
 * Drawn far to near; each mountain first clears what is behind it. The
 * context is set up in view-box units by the caller (runDots).
 */

import { cloud, hash, ink, occlude, puff, ridgeGlow } from "~/lib/halftone-ink";
import { rng } from "~/lib/hero-scene";

export const LAKE_VIEW = { w: 1600, h: 600 } as const;
const W = LAKE_VIEW.w;
const H = LAKE_VIEW.h;
const SHORE = 400; // where the mountains meet the water
const BANK = 520; // the near shore
const SUN = { x: 1180, y: 150, r: 42 };

interface Range {
  peaks: { x: number; h: number; w: number }[];
  seed: number;
  jag: number; // height of the small irregularities on the ridge
  k: number; // tone strength: far ranges are paler
}

const RANGES: Range[] = [
  // Far range, pale, all along the horizon.
  {
    peaks: [
      { x: 120, h: 170, w: 260 },
      { x: 420, h: 210, w: 300 },
      { x: 760, h: 180, w: 260 },
      { x: 1040, h: 230, w: 320 },
      { x: 1380, h: 190, w: 300 },
      { x: 1620, h: 160, w: 240 },
    ],
    seed: 11,
    jag: 12,
    k: 0.32,
  },
  // The great peak, a little right of centre, and its neighbour.
  {
    peaks: [
      { x: 860, h: 300, w: 380 },
      { x: 560, h: 200, w: 260 },
      { x: 1180, h: 170, w: 240 },
    ],
    seed: 23,
    jag: 16,
    k: 0.9,
  },
  // Wooded shoulders coming down to the water on both sides.
  {
    peaks: [
      { x: -40, h: 190, w: 420 },
      { x: 300, h: 90, w: 220 },
      { x: 1500, h: 170, w: 380 },
      { x: 1700, h: 210, w: 300 },
    ],
    seed: 37,
    jag: 10,
    k: 1.3,
  },
];

/** Ridge points of a range, every 6 units, as heights above the shore. */
function profile(r: Range): [number, number][] {
  const rand = rng(r.seed);
  const waves = Array.from({ length: 4 }, () => ({ f: 0.004 + rand() * 0.02, p: rand() * 6.3, a: rand() }));
  // Each peak gets two shoulders (smaller summits on its flanks), so no
  // ridge reads as a plain triangle.
  const peaks = r.peaks.flatMap((p) => [
    p,
    { x: p.x - p.w * (0.35 + 0.15 * rand()), h: p.h * (0.62 + 0.12 * rand()), w: p.w * 0.45 },
    { x: p.x + p.w * (0.3 + 0.2 * rand()), h: p.h * (0.55 + 0.15 * rand()), w: p.w * 0.4 },
  ]);
  const pts: [number, number][] = [];
  for (let x = -60; x <= W + 60; x += 6) {
    let h = 0;
    for (const p of peaks) {
      const u = Math.abs(x - p.x) / p.w;
      // Steep near the summit, easing out at the foot.
      if (u < 1) h = Math.max(h, p.h * Math.pow(1 - u, 1.7) * (1 + 0.25 * u));
    }
    let n = 0;
    for (const w of waves) n += Math.sin(x * w.f + w.p) * w.a;
    h += (n / 2) * r.jag + (hash(x, r.seed) - 0.5) * r.jag * 0.6;
    pts.push([x, Math.max(0, h)]);
  }
  return pts;
}

const SHAPES = RANGES.map((r) => {
  const pts = profile(r);
  const ridge = new Path2D();
  pts.forEach(([x, h], i) => (i ? ridge.lineTo(x, SHORE - h) : ridge.moveTo(x, SHORE - h)));
  const body = new Path2D(ridge);
  body.lineTo(W + 60, SHORE + 2);
  body.lineTo(-60, SHORE + 2);
  body.closePath();
  return { r, pts, ridge, body, top: SHORE - Math.max(...pts.map((p) => p[1])) };
});

/** One range: cleared, a light mass, tone under the ridge, then streaks down
 *  the slopes, dense on the shaded (right-facing) side. */
function range(ctx: CanvasRenderingContext2D, s: (typeof SHAPES)[number]): void {
  const { r, pts, ridge, body, top } = s;
  occlude(ctx, body);
  const mass = ctx.createLinearGradient(0, top, 0, SHORE);
  mass.addColorStop(0, ink(0.16 * r.k));
  mass.addColorStop(1, ink(0.07 * r.k));
  ctx.fillStyle = mass;
  ctx.fillRect(-60, top - 2, W + 120, SHORE - top + 4);
  ridgeGlow(ctx, ridge, 26 + 30 * r.k, 0.12 * r.k);
  ctx.lineWidth = 1.6;
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, h] = pts[i];
    if (h < 8) continue;
    const slope = pts[i + 1][1] - pts[i - 1][1]; // < 0: the ground falls to the right
    const shade = slope < 0 ? Math.min(1, -slope / 10) : 0;
    const len = h * (0.25 + 0.55 * hash(i, r.seed + 1));
    const a = (0.05 + 0.5 * shade) * r.k;
    if (a < 0.04) continue;
    ctx.strokeStyle = ink(a);
    ctx.beginPath();
    ctx.moveTo(x, SHORE - h + 3);
    ctx.lineTo(x + (shade > 0 ? 10 : -6) * (len / 100), SHORE - h + len);
    ctx.stroke();
  }
  ctx.restore();
}

/** Snow on the great peak: its top cleared to paper, with a ragged edge and a
 *  few dark rock ribs left through it. */
function snow(ctx: CanvasRenderingContext2D): void {
  const s = SHAPES[1];
  ctx.save();
  ctx.clip(s.body);
  ctx.globalCompositeOperation = "destination-out";
  const line = new Path2D();
  line.moveTo(-60, -10);
  for (let x = 600; x <= 1120; x += 8) line.lineTo(x, SHORE - 215 + Math.sin(x * 0.05) * 9 + (hash(x, 5) - 0.5) * 18);
  line.lineTo(1180, -10);
  line.closePath();
  ctx.fillStyle = ink(0.75);
  ctx.fill(line);
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = ink(0.35);
  ctx.lineWidth = 1.4;
  for (const [x0, len] of [[840, 70], [880, 55], [905, 40], [800, 45]] as const) {
    ctx.beginPath();
    ctx.moveTo(x0, SHORE - 290 + (x0 - 860) * 0.6);
    ctx.lineTo(x0 + 14, SHORE - 290 + (x0 - 860) * 0.6 + len);
    ctx.stroke();
  }
  ctx.restore();
}

function sun(ctx: CanvasRenderingContext2D, t: number): void {
  puff(ctx, SUN.x, SUN.y, SUN.r * 3.2, SUN.r * 3.2, 0.05);
  const g = ctx.createRadialGradient(SUN.x, SUN.y, 0, SUN.x, SUN.y, SUN.r);
  g.addColorStop(0, ink(0.12));
  g.addColorStop(0.8, ink(0.32));
  g.addColorStop(1, ink(0.5));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(SUN.x, SUN.y, SUN.r, 0, Math.PI * 2);
  ctx.fill();
  // Two faint rings breathing out.
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 2; i++) {
    const u = (t * 0.12 + i / 2) % 1;
    ctx.strokeStyle = ink(0.16 * (1 - u));
    ctx.beginPath();
    ctx.arc(SUN.x, SUN.y, SUN.r * (1.25 + u * 1.2), 0, Math.PI * 2);
    ctx.stroke();
  }
}

const CLOUDS = [
  { x: 120, y: 120, len: 260, seed: 3, v: 6 },
  { x: 620, y: 70, len: 200, seed: 7, v: 4 },
  { x: 980, y: 210, len: 170, seed: 5, v: 8 },
  { x: 1400, y: 100, len: 240, seed: 9, v: 5 },
];

const BIRDS = Array.from({ length: 6 }, (_, i) => ({
  dx: [0, 26, 48, 18, 64, 40][i],
  dy: [0, 10, -6, 22, 14, 30][i],
  s: [1, 0.85, 0.9, 0.75, 0.8, 0.7][i],
  phase: i * 1.7,
}));

function birds(ctx: CanvasRenderingContext2D, t: number): void {
  const span = W + 400;
  const x0 = ((200 + t * 22) % span) - 200;
  const y0 = 190 + Math.sin(t * 0.3) * 14;
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = ink(0.75);
  for (const b of BIRDS) {
    const x = x0 + b.dx;
    const y = y0 + b.dy + Math.sin(t * 1.3 + b.phase) * 3;
    const flap = Math.sin(t * 7 + b.phase) * 5 * b.s;
    const w = 9 * b.s;
    ctx.beginPath();
    ctx.moveTo(x - w, y - flap);
    ctx.quadraticCurveTo(x - w * 0.45, y - 2 - flap * 0.4, x, y);
    ctx.quadraticCurveTo(x + w * 0.45, y - 2 - flap * 0.4, x + w, y - flap);
    ctx.stroke();
  }
}

/** The lake: the mountains mirrored, broken into drifting lines of light. */
function lake(ctx: CanvasRenderingContext2D, t: number): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(-60, SHORE, W + 120, BANK - SHORE);
  ctx.clip();
  // A darker band right under the shore, the reflection.
  ctx.save();
  ctx.translate(0, SHORE * 2);
  ctx.scale(1, -1);
  for (const s of SHAPES) {
    ctx.fillStyle = ink(0.28 * s.r.k);
    ctx.fill(s.body);
  }
  ctx.restore();
  // The reflection fades with depth, the open water keeps a light tone.
  ctx.globalCompositeOperation = "destination-out";
  const fade = ctx.createLinearGradient(0, SHORE, 0, BANK);
  fade.addColorStop(0, ink(0));
  fade.addColorStop(1, ink(0.7));
  ctx.fillStyle = fade;
  ctx.fillRect(-60, SHORE, W + 120, BANK - SHORE);
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = ink(0.05);
  ctx.fillRect(-60, SHORE, W + 120, BANK - SHORE);
  // Water lines: the reflection is cut by thin light gaps that drift.
  ctx.globalCompositeOperation = "destination-out";
  ctx.lineWidth = 2.4;
  for (let y = SHORE + 5, row = 0; y < BANK; y += 6, row++) {
    const shift = Math.sin(t * 0.4 + row * 0.9) * 18;
    ctx.strokeStyle = ink(0.7);
    ctx.beginPath();
    for (let x = -60 + (hash(row, 1) * 80) + shift; x < W + 60; x += 90 + hash(row, x | 0) * 120) {
      ctx.moveTo(x, y);
      ctx.lineTo(x + 30 + hash(x | 0, row) * 90, y);
    }
    ctx.stroke();
  }
  ctx.globalCompositeOperation = "source-over";
  // The sun's path on the water: short dashes, shivering.
  ctx.lineWidth = 1.6;
  for (let y = SHORE + 8, row = 0; y < BANK - 6; y += 6, row++) {
    const spread = 12 + (y - SHORE) * 0.35;
    const wob = Math.sin(t * 1.6 + row) * 4;
    const len = spread * (0.4 + 0.6 * hash(row, 7));
    ctx.strokeStyle = ink(0.32 - (y - SHORE) * 0.0012);
    ctx.beginPath();
    ctx.moveTo(SUN.x - len / 2 + wob, y);
    ctx.lineTo(SUN.x + len / 2 + wob, y);
    ctx.stroke();
  }
  ctx.restore();
  // The shore line itself.
  ctx.strokeStyle = ink(0.3);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-60, SHORE + 1);
  ctx.lineTo(W + 60, SHORE + 1);
  ctx.stroke();
}

/** A pine: stacked tiers, darkest at the trunk side away from the light. */
function pine(ctx: CanvasRenderingContext2D, x: number, base: number, h: number): void {
  const tiers = 4;
  const p = new Path2D();
  for (let i = 0; i < tiers; i++) {
    const top = base - h + (i * h) / (tiers + 1);
    const bot = base - h + ((i + 2) * h) / (tiers + 1);
    const half = (h * 0.16 * (i + 1.4)) / tiers;
    p.moveTo(x, top);
    p.lineTo(x + half, bot);
    p.lineTo(x - half, bot);
    p.closePath();
  }
  p.rect(x - h * 0.02, base - h * 0.12, h * 0.04, h * 0.12);
  ctx.globalCompositeOperation = "destination-out";
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 4;
  ctx.stroke(p);
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = ink(0.62);
  ctx.fill(p);
}

const PINES: [number, number][] = [
  [60, 120], [110, 160], [150, 100], [210, 135], [1380, 110], [1440, 150], [1500, 120], [1555, 170],
];

function shore(ctx: CanvasRenderingContext2D): void {
  const bank = new Path2D();
  bank.moveTo(-60, H + 10);
  for (let x = -60; x <= W + 60; x += 20) {
    // Lower in the middle, rising toward both sides.
    bank.lineTo(x, BANK + 8 + Math.sin(x * 0.03) * 4 + (hash(x, 3) - 0.5) * 6 - (Math.abs(x - 800) / 800) * 26);
  }
  bank.lineTo(W + 60, H + 10);
  bank.closePath();
  occlude(ctx, bank);
  const g = ctx.createLinearGradient(0, BANK - 20, 0, H);
  g.addColorStop(0, ink(0.32));
  g.addColorStop(1, ink(0.55));
  ctx.fillStyle = g;
  ctx.fillRect(-60, BANK - 30, W + 120, H - BANK + 40);
  // Grass strokes along the edge.
  ctx.strokeStyle = ink(0.75);
  ctx.lineWidth = 1.2;
  for (let x = -40; x < W + 40; x += 9) {
    const y = BANK + 10 - (Math.abs(x - 800) / 800) * 26;
    ctx.beginPath();
    ctx.moveTo(x, y + 6);
    ctx.lineTo(x + (hash(x, 9) - 0.5) * 6, y - 4 - hash(x, 4) * 6);
    ctx.stroke();
  }
  ctx.restore();
  for (const [x, h] of PINES) pine(ctx, x, BANK + 14 - (Math.abs(x - 800) / 800) * 26, h);
}

export function drawLakeTone(ctx: CanvasRenderingContext2D, t: number, w: number, hgt: number): void {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, w, hgt);
  ctx.restore();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  sun(ctx, t);
  for (const c of CLOUDS) {
    const span = W + c.len * 2;
    const x = ((c.x + c.len + t * c.v) % span) - c.len;
    cloud(ctx, { x, y: c.y, len: c.len, seed: c.seed });
  }
  for (const s of SHAPES) range(ctx, s);
  snow(ctx);
  lake(ctx, t);
  birds(ctx, t);
  shore(ctx);
}
