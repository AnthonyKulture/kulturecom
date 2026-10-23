/**
 * The waterfall scene as a tone map, for the dot screen (halftone.ts): the
 * geometry of waterfall-scene.ts drawn as densities, and its loop (falling
 * water, boiling foam, spray, ripples, drifting clouds) computed here at time
 * `t` instead of in CSS. White water is where dots are missing: the rock
 * around it is dense, so the fall and its foam read bright.
 *
 * Drawn far to near; each shape first clears what is behind it, so nothing
 * shows through. The context is set up in view-box units by the caller.
 */

import { cloud, drawHiker, hash, ink, occlude, ridgeGlow, type HikerState } from "~/lib/halftone-ink";
import {
  BANK,
  BUSHES,
  CLIFF_TOPS,
  CLIFFS,
  CLOUD_SET,
  FAR,
  LIP,
  POOL_MARKS,
  POOL_ROCKS,
  RIPPLE,
  RIPPLE_PATH,
  RIVER,
  SHEET,
  SIDE_WALLS,
  SPRAY,
  STREAKS,
  VIEW,
} from "~/lib/waterfall-scene";

const TAU = Math.PI * 2;
const frac = (v: number) => v - Math.floor(v);
const P = (d: string) => new Path2D(d);

/** Length of a one-cubic path "M x y C x y x y x y". */
function cubicLength(d: string): number {
  const [x0, y0, x1, y1, x2, y2, x3, y3] = (d.match(/-?[\d.]+/g) ?? []).map(Number);
  let len = 0;
  let px = x0;
  let py = y0;
  for (let i = 1; i <= 40; i++) {
    const t = i / 40;
    const u = 1 - t;
    const x = u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3;
    const y = u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3;
    len += Math.hypot(x - px, y - py);
    px = x;
    py = y;
  }
  return len;
}

// Every path parsed once.
const far = { fill: P(FAR.fill), line: P(FAR.line) };
const river = { fill: P(RIVER.fill), banks: P(RIVER.banks), flow: P(RIVER.flow) };
const sheet = P(SHEET);
const lip = P(LIP);
const ripple = P(RIPPLE_PATH);
const poolMarks = P(POOL_MARKS);
const rocks = { fill: P(POOL_ROCKS.fill), marks: P(POOL_ROCKS.marks) };
const cliffs = CLIFFS.map((c) => ({ d: P(c.d), rock: P(c.rock) }));
const walls = SIDE_WALLS.map(P);
const bushes = P(BUSHES);
const bank = { d: P(BANK.d), marks: P(`${BANK.marks}${BANK.tufts}`) };

/** White water at the foot of the fall: soft blobs of mist, no edges
 *  ([x, y, rx, ry, delay]), breathing out of step. */
const MIST = [
  [262, 462, 34, 22, 0],
  [338, 460, 34, 22, 1.1],
  [240, 486, 42, 26, 0.6],
  [286, 476, 50, 30, 2.1],
  [332, 480, 48, 29, 1.6],
  [372, 488, 38, 24, 2.7],
  [300, 504, 78, 22, 0.3],
] as const;
/** Churn: short waves running out from the impact ([x, y, dir, delay]). */
const CHURN = Array.from({ length: 12 }, (_, i) => {
  const dir = i % 2 ? 1 : -1;
  return [300 + dir * (6 + hash(i, 3) * 30), 474 + hash(i, 5) * 40, dir, hash(i, 7) * 2.6] as const;
});

/** Rock grain: streaks running down each cliff from its top edge, of every
 *  length, in a few strengths (the cliffs never move: built once). */
const ROCK_LEVELS = 4;
const rockGrain = CLIFF_TOPS.map((top, c) => {
  const levels = Array.from({ length: ROCK_LEVELS }, () => new Path2D());
  for (let i = 1; i < top.length; i++) {
    const [ax, ay] = top[i - 1];
    const [bx, by] = top[i];
    const n = Math.max(1, Math.round(Math.abs(bx - ax) / 2.6));
    for (let j = 0; j < n; j++) {
      const t = (j + hash(c * 97 + i, j)) / n;
      const x = ax + (bx - ax) * t;
      const y = ay + (by - ay) * t + 1;
      const r = hash(c * 131 - i, j + 7);
      const len = 30 + 320 * r * r;
      levels[Math.floor(hash(i, j * 3 + c) * ROCK_LEVELS)].moveTo(x, y);
      levels[Math.floor(hash(i, j * 3 + c) * ROCK_LEVELS)].lineTo(x + (hash(j, i) - 0.5) * 6, y + len);
    }
  }
  return levels;
});
// Dash patterns are in hundredths of each streak's length (pathLength 100 in the svg).
const streaks = STREAKS.map((s) => {
  const len = cubicLength(s.d);
  return { ...s, path: P(s.d), unit: len / 100, pattern: s.dash.split(" ").map((v) => (Number(v) * len) / 100) };
});

/** Draw the whole scene's tones at time `t` (s); `w`×`h` is the tone canvas
 *  in pixels. `breath` (0..1) is the standing hiker's breathing. */
export function drawWaterfallTone(
  ctx: CanvasRenderingContext2D,
  t: number,
  h: HikerState,
  breath: number,
  w: number,
  hgt: number,
): void {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, w, hgt);
  ctx.restore();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Sky: soft clouds drifting a little to and fro.
  const drift = -10 + 12 * (1 - Math.cos((TAU * t) / 44));
  for (const c of CLOUD_SET) cloud(ctx, { ...c, x: c.x + drift });

  // Far peaks seen through the gorge, and the river coming to the lip.
  occlude(ctx, far.fill);
  ridgeGlow(ctx, far.line, 34, 0.07);
  ctx.restore();
  occlude(ctx, river.fill);
  ctx.fillStyle = ink(0.09);
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  ctx.restore();
  ctx.strokeStyle = ink(0.4);
  ctx.lineWidth = 1.4;
  ctx.stroke(river.banks);
  ctx.strokeStyle = ink(0.3);
  ctx.stroke(river.flow);

  // The fall: white water, dashes running down it.
  occlude(ctx, sheet);
  const veil = ctx.createLinearGradient(0, 190, 0, 500);
  veil.addColorStop(0, ink(0.08));
  veil.addColorStop(1, ink(0.02));
  ctx.fillStyle = veil;
  ctx.fillRect(0, 180, VIEW.w, 330);
  for (const s of streaks) {
    ctx.setLineDash(s.pattern);
    ctx.lineDashOffset = (s.offset - 100 * frac(t / s.dur)) * s.unit;
    ctx.strokeStyle = ink(0.48 * s.opacity);
    ctx.lineWidth = s.width * 1.6;
    ctx.stroke(s.path);
  }
  ctx.setLineDash([]);
  // Spray veil: the streaks dissolve into white before reaching the foam.
  ctx.globalCompositeOperation = "destination-out";
  const veilOut = ctx.createLinearGradient(0, 360, 0, 466);
  veilOut.addColorStop(0, ink(0));
  veilOut.addColorStop(0.6, ink(0.45));
  veilOut.addColorStop(1, ink(0.9));
  ctx.fillStyle = veilOut;
  ctx.fillRect(0, 360, VIEW.w, 150);
  ctx.globalCompositeOperation = "source-over";
  ctx.restore();
  ctx.strokeStyle = ink(0.36);
  ctx.lineWidth = 1.4;
  ctx.stroke(lip);

  // The pool: a light tone of water (the foam reads white on it), and
  // rings spreading from under the foam.
  const pool = ctx.createLinearGradient(0, 470, 0, VIEW.h);
  pool.addColorStop(0, ink(0.04));
  pool.addColorStop(1, ink(0.1));
  ctx.fillStyle = pool;
  ctx.fillRect(0, 470, VIEW.w, VIEW.h - 470);
  for (let i = 0; i < 3; i++) {
    const ph = frac((t + i * 1.6) / 4.8);
    const k = 0.5 + 0.85 * (1 - (1 - ph) ** 2);
    ctx.save();
    ctx.translate(RIPPLE.x, RIPPLE.y);
    ctx.scale(k, k);
    ctx.translate(-RIPPLE.x, -RIPPLE.y);
    ctx.strokeStyle = ink(0.4 * (1 - ph));
    ctx.lineWidth = 1.6 / k;
    ctx.stroke(ripple);
    ctx.restore();
  }
  ctx.strokeStyle = ink(0.22);
  ctx.lineWidth = 1.3;
  ctx.stroke(poolMarks);

  // White water at the foot: soft mist breathing, no outlines.
  ctx.globalCompositeOperation = "destination-out";
  for (const [x, y, rx, ry, delay] of MIST) {
    const k = 0.5 - 0.5 * Math.cos((TAU * (t + delay)) / 3.2);
    const r = rx * (0.92 + 0.12 * k);
    ctx.save();
    ctx.translate(x, y - 3 * k);
    ctx.scale(1, (ry * (0.9 + 0.15 * k)) / r);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    g.addColorStop(0, ink(1));
    g.addColorStop(0.55, ink(0.85));
    g.addColorStop(1, ink(0));
    ctx.fillStyle = g;
    ctx.fillRect(-r, -r, r * 2, r * 2);
    ctx.restore();
  }
  ctx.globalCompositeOperation = "source-over";
  // Churning: little waves running out from where the water lands.
  ctx.lineWidth = 1.4;
  for (const [x0, y, dir, delay] of CHURN) {
    const ph = frac((t + delay) / 2.6);
    const x = x0 + dir * ph * 46;
    const l = 7 + 6 * ph;
    ctx.strokeStyle = ink(0.32 * Math.sin(Math.PI * ph));
    ctx.beginPath();
    ctx.moveTo(x - l, y + ph * 4);
    ctx.quadraticCurveTo(x, y + ph * 4 - 3, x + l, y + ph * 4);
    ctx.stroke();
  }
  // Spray rising from it.
  for (const s of SPRAY) {
    const ph = frac((t - s.delay) / 1.8);
    const a = ph < 0.3 ? (ph / 0.3) * 0.9 : 0.9 * (1 - (ph - 0.3) / 0.7);
    ctx.fillStyle = ink(a * 0.7);
    ctx.beginPath();
    ctx.arc(s.x, s.y + 4 - 20 * (1 - (1 - ph) ** 2), s.r * 1.5, 0, TAU);
    ctx.fill();
  }
  occlude(ctx, rocks.fill);
  ctx.fillStyle = ink(0.34);
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  ctx.restore();
  ctx.strokeStyle = ink(0.3);
  ctx.stroke(rocks.marks);

  // The rock walls: denser down toward the pool, the gorge walls in shade,
  // dense along their edges, with their joints and strata.
  cliffs.forEach((c, i) => {
    occlude(ctx, c.d);
    const g = ctx.createLinearGradient(0, 60, 0, 560);
    g.addColorStop(0, ink(0.035));
    g.addColorStop(1, ink(0.085));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW.w, VIEW.h);
    ctx.lineWidth = 1.8;
    rockGrain[i].forEach((p, lv) => {
      ctx.strokeStyle = ink(0.03 + 0.03 * lv);
      ctx.stroke(p);
    });
    ctx.fillStyle = ink(0.11);
    ctx.fill(walls[i]);
    ridgeGlow(ctx, c.d, 22, 0.05);
    ctx.strokeStyle = ink(0.2);
    ctx.lineWidth = 1.6;
    ctx.stroke(c.rock);
    ctx.restore();
  });
  // Mist at the foot of the fall lightens the rock around it.
  ctx.globalCompositeOperation = "destination-out";
  const mist = ctx.createRadialGradient(300, 488, 0, 300, 488, 150);
  mist.addColorStop(0, ink(0.5));
  mist.addColorStop(1, ink(0));
  ctx.fillStyle = mist;
  ctx.fillRect(140, 330, 320, 320);
  ctx.globalCompositeOperation = "source-over";

  // Bushes on the cliff tops.
  occlude(ctx, bushes);
  ctx.fillStyle = ink(0.25);
  ctx.fillRect(0, 0, VIEW.w, 200);
  ctx.restore();

  // The bank in front, his boulder.
  occlude(ctx, bank.d);
  const b = ctx.createLinearGradient(0, 606, 0, VIEW.h);
  b.addColorStop(0, ink(0.12));
  b.addColorStop(1, ink(0.06));
  ctx.fillStyle = b;
  ctx.fillRect(0, 590, VIEW.w, 100);
  ridgeGlow(ctx, bank.d, 12, 0.1);
  ctx.restore();
  ctx.strokeStyle = ink(0.55);
  ctx.lineWidth = 1.4;
  ctx.stroke(bank.marks);

  // No frame: the scene thins out into the page all around the fall and the
  // hiker, like a mountain fading into mist.
  ctx.save();
  ctx.translate(300, 420);
  ctx.scale(1, 1.3);
  const fade = ctx.createRadialGradient(0, 0, 0, 0, 0, 330);
  fade.addColorStop(0.5, ink(0));
  fade.addColorStop(1, ink(1));
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = fade;
  ctx.fillRect(-600, -600, 1200, 1200);
  ctx.globalCompositeOperation = "source-over";
  ctx.restore();

  drawHiker(ctx, h, undefined, breath);
}
