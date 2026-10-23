/**
 * Shared pieces of the dot drawings (hero-halftone.ts, waterfall-halftone.ts):
 * tones are drawn as alpha on a tone canvas, then turned into dots by
 * halftone.ts. Soft puffs and clouds, shapes that hide what is behind them,
 * soft tone under a ridge, and the hiker himself.
 */

import { PIVOT, gait } from "~/lib/hiker-shape";
import { rng } from "~/lib/hero-scene";

export interface HikerState {
  x: number;
  y: number;
  s: number;
  phase: number; // walk cycle, in cycles
  amp: number; // 0 = standing still
  masked: boolean; // hidden behind something (the hero's ridge)
}

export const ink = (a: number) => `rgba(0,0,0,${Math.max(0, Math.min(1, a)).toFixed(3)})`;

/** Stable noise in 0..1 for a pair of integers: the same streak every frame. */
export function hash(a: number, b: number): number {
  let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
const RAD = Math.PI / 180;

/** A soft puff of tone: an ellipse, densest in its middle. */
export function puff(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, a: number): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, ink(a));
  g.addColorStop(0.55, ink(a * 0.6));
  g.addColorStop(1, ink(0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** A cloud: a row of soft puffs, rounder in the middle, a little denser on
 *  its underside, sitting on a flat base. */
export function cloud(ctx: CanvasRenderingContext2D, c: { x: number; y: number; len: number; seed: number }): void {
  const r = rng(c.seed * 131);
  const n = 5 + (c.seed % 3);
  const base = c.y + c.len * 0.05;
  ctx.save();
  ctx.beginPath();
  ctx.rect(c.x - c.len, -200, c.len * 3, base + 200);
  ctx.clip();
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n;
    const bulge = Math.sin(u * Math.PI);
    const rx = c.len * (0.12 + 0.07 * r());
    const ry = rx * (0.4 + 0.35 * bulge);
    const cx = c.x + u * c.len;
    const cy = base - ry * (0.35 + 0.25 * bulge) + (r() - 0.5) * 3;
    puff(ctx, cx, cy, rx, ry, 0.16);
    puff(ctx, cx, cy + ry * 0.45, rx * 0.75, ry * 0.45, 0.12);
  }
  ctx.restore();
}

/** Clear `body`, then draw into it only. */
export function occlude(ctx: CanvasRenderingContext2D, body: Path2D): void {
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = "#000";
  ctx.fill(body);
  ctx.globalCompositeOperation = "source-over";
  ctx.save();
  ctx.clip(body);
}

/** Tone under a ridge line: densest just below it, fading down the slope
 *  over `reach` units (layered soft strokes, kept inside the shape). */
export function ridgeGlow(ctx: CanvasRenderingContext2D, ridge: Path2D, reach: number, a: number): void {
  ctx.strokeStyle = ink(a);
  for (const f of [0.03, 0.08, 0.2, 0.38, 0.62, 1]) {
    ctx.lineWidth = Math.max(1, 2 * f * reach);
    ctx.stroke(ridge);
  }
}

type Pt = [number, number];

/** A tapered limb segment from `a` (width wa) to `b` (width wb), round at
 *  both ends, so joints read as joints rather than stacked blocks. */
function segment(a: Pt, b: Pt, wa: number, wb: number): Path2D {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const n = Math.hypot(dx, dy) || 1;
  const nx = -dy / n;
  const ny = dx / n;
  const ang = Math.atan2(dy, dx);
  const p = new Path2D();
  p.moveTo(a[0] + (nx * wa) / 2, a[1] + (ny * wa) / 2);
  p.lineTo(b[0] + (nx * wb) / 2, b[1] + (ny * wb) / 2);
  p.arc(b[0], b[1], wb / 2, ang + Math.PI / 2, ang - Math.PI / 2, true);
  p.lineTo(a[0] - (nx * wa) / 2, a[1] - (ny * wa) / 2);
  p.arc(a[0], a[1], wa / 2, ang - Math.PI / 2, ang + Math.PI / 2, true);
  p.closePath();
  return p;
}

/**
 * Draw a figure made of `parts` (painted in order, later over earlier): one
 * light halo around the whole silhouette, so it stands out from what is
 * behind, but no seam between its own parts — they overlap cleanly instead
 * of reading as stacked blocks. `seams` are then cut in as light lines.
 */
export function figure(ctx: CanvasRenderingContext2D, parts: [Path2D, number][], seams: Path2D[] = []): void {
  ctx.globalCompositeOperation = "destination-out";
  ctx.strokeStyle = "#000";
  ctx.fillStyle = "#000";
  ctx.lineWidth = 3.2;
  for (const [p] of parts) {
    ctx.stroke(p);
    ctx.fill(p);
  }
  for (const [p, tone] of parts) {
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "#000";
    ctx.fill(p);
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = ink(tone);
    ctx.fill(p);
  }
  ctx.globalCompositeOperation = "destination-out";
  ctx.strokeStyle = ink(0.5);
  ctx.lineWidth = 1;
  for (const p of seams) ctx.stroke(p);
  ctx.globalCompositeOperation = "source-over";
}

/** How high a foot is lifted at `phase` (0..amp), as in gait(). */
function lift(phase: number, amp: number): number {
  const x = ((phase % 1) + 1) % 1;
  return x < 0.55 ? Math.sin((Math.PI * x) / 0.55) * amp : 0;
}

/**
 * The scarf tied on the pack, as on the backpack at the camp
 * (gear-halftone.ts, same ribbon): two tails from a knot, each a ribbon whose
 * wave runs down it with the wind, growing toward the tip and twisting, with
 * its lower edge in shade. `angle` is where the wind blows them (radians),
 * `t` the time in seconds, `k` its size against the camp's pack (1 there).
 * Pushed into a `figure` parts list.
 */
export function scarf(parts: [Path2D, number][], knot: Pt, angle: number, t: number, k: number): void {
  const TAU = Math.PI * 2;
  const tail = (len: number, w0: number, phase: number, a: number): void => {
    const N = 16;
    const gust = 0.75 + 0.25 * Math.sin(t * 0.8) * Math.sin(t * 1.9 + 1);
    const mid: Pt[] = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const s = u * len;
      const amp = (1 + 7 * u ** 1.3) * gust * k;
      const wave = amp * Math.sin((s / (48 * k)) * TAU - t * TAU * 1.3 + phase);
      // The wave is across the wind; a little droop toward the tip.
      mid.push([
        knot[0] + s * Math.cos(a) - wave * Math.sin(a),
        knot[1] + s * Math.sin(a) + wave * Math.cos(a) + 7 * k * u * u,
      ]);
    }
    const left: Pt[] = [];
    const right: Pt[] = [];
    const fold: Pt[] = [];
    mid.forEach(([x, y], i) => {
      const [ax, ay] = mid[Math.max(0, i - 1)];
      const [bx, by] = mid[Math.min(N, i + 1)];
      const d = Math.hypot(bx - ax, by - ay) || 1;
      const nx = -(by - ay) / d;
      const ny = (bx - ax) / d;
      const u = i / N;
      const twist = 0.62 + 0.38 * Math.abs(Math.cos((u * len * TAU) / (96 * k) - t * TAU * 0.65 + phase));
      const half = (w0 / 2) * (1 - 0.62 * u) * twist;
      left.push([x + nx * half, y + ny * half]);
      right.push([x - nx * half, y - ny * half]);
      fold.push([x - nx * half * 0.45, y - ny * half * 0.45]);
    });
    const ribbon = new Path2D();
    [...left, ...[...right].reverse()].forEach(([x, y], i) => (i ? ribbon.lineTo(x, y) : ribbon.moveTo(x, y)));
    ribbon.closePath();
    parts.push([ribbon, 0.55]);
    const shade = new Path2D();
    [...fold, ...[...right].reverse()].forEach(([x, y], i) => (i ? shade.lineTo(x, y) : shade.moveTo(x, y)));
    shade.closePath();
    parts.push([shade, 0.85]);
  };
  tail(78 * k, 19 * k, 0, angle - 0.06);
  tail(54 * k, 14 * k, 1.4, angle + 0.2);
  const knotDot = new Path2D();
  knotDot.arc(knot[0], knot[1], 4.6 * k, 0, TAU);
  parts.push([knotDot, 0.85]);
}

// Tones of the back-view hiker: skin lightest, then jacket, trousers, pack.
const SKIN = 0.42;
const JACKET = 0.58;
const TROUSERS = 0.74;
const PACK = 0.84;
const DARK = 0.95; // hair, boots, hat band
const HAT = 0.66;

const path = (fn: (p: Path2D) => void): Path2D => {
  const p = new Path2D();
  fn(p);
  return p;
};
const ellipse = (cx: number, cy: number, rx: number, ry: number, a = 0): Path2D =>
  path((p) => p.ellipse(cx, cy, rx, ry, a, 0, Math.PI * 2));

/**
 * One leg seen from behind: a shaped thigh, a calf that swells then narrows
 * to the ankle, a boot. Lifting the foot (walking away from us) raises the
 * knee a little, foreshortens the calf and shows the sole.
 */
function backLeg(parts: [Path2D, number][], side: -1 | 1, l: number): void {
  const hip: Pt = [side * 4.8, -42.5];
  const knee: Pt = [side * (5 + 0.3 * l), -22 - 4.5 * l];
  const ankle: Pt = [side * (3.6 - 0.5 * l), -4.6 - 11 * l];
  parts.push([segment(hip, knee, 9.2, 6.4), TROUSERS]);
  parts.push([segment(knee, ankle, 6.2, 3.8), TROUSERS]);
  // The calf, a little fuller just under the knee.
  const cx = knee[0] + (ankle[0] - knee[0]) * 0.32;
  const cy = knee[1] + (ankle[1] - knee[1]) * 0.32;
  parts.push([ellipse(cx, cy, 3.6, 5.6 * (1 - 0.35 * l)), TROUSERS]);
  // Boot: heel toward us; lifted, the sole turns up and shows darker.
  parts.push([ellipse(ankle[0] + side * 0.3, ankle[1] + 2.4 + 0.6 * l, 3.4, 2.8 + 1.5 * l), DARK]);
}

/**
 * One arm seen from behind, in its sleeve, jointed at the elbow and swinging
 * with the step: `fwd` > 0 swings it away from us (the hand rises and comes
 * in a little).
 */
function backArm(parts: [Path2D, number][], side: -1 | 1, fwd: number, pole: boolean): void {
  const shoulder: Pt = [side * 10.2, -75.5];
  const elbow: Pt = [side * (13.2 - 0.5 * fwd), -60 - 2.5 * fwd];
  const hand: Pt = [side * (12.8 - 1.6 * fwd), -48 - 7 * fwd];
  if (pole) parts.push([segment([hand[0] + 0.3, hand[1] - 1], [side * 17, 0.5], 1.3, 1.1), DARK]);
  parts.push([segment(shoulder, elbow, 6, 5), JACKET]);
  parts.push([segment(elbow, hand, 5, 3.8), JACKET]);
  parts.push([ellipse(hand[0], hand[1] + 1.6, 2.3, 2.9), SKIN]);
}

/** Torso, pack, head: shaped with curves, in several tones. */
function backBody(parts: [Path2D, number][], seams: Path2D[]): void {
  // Jacket: sloping shoulders, narrowing to the waist.
  parts.push([
    path((p) => {
      p.moveTo(-8.4, -42);
      p.bezierCurveTo(-9.2, -52, -10.6, -64, -11.4, -73);
      p.bezierCurveTo(-11.6, -76.5, -8.5, -78.5, -4.2, -80);
      p.lineTo(4.2, -80);
      p.bezierCurveTo(8.5, -78.5, 11.6, -76.5, 11.4, -73);
      p.bezierCurveTo(10.6, -64, 9.2, -52, 8.4, -42);
      p.bezierCurveTo(4, -40.6, -4, -40.6, -8.4, -42);
    }),
    JACKET,
  ]);
  // Neck and head; hair over the back of the head, ears at the sides.
  parts.push([segment([0, -78], [0, -84], 4.6, 4.2), SKIN]);
  parts.push([ellipse(-5.3, -88.6, 1.2, 1.9), SKIN]);
  parts.push([ellipse(5.3, -88.6, 1.2, 1.9), SKIN]);
  parts.push([ellipse(0, -89, 5.2, 6.2), SKIN]);
  parts.push([
    path((p) => {
      p.moveTo(-5.3, -88);
      p.bezierCurveTo(-5.8, -97, 5.8, -97, 5.3, -88);
      p.bezierCurveTo(4.8, -85.2, 2.6, -84, 0, -84);
      p.bezierCurveTo(-2.6, -84, -4.8, -85.2, -5.3, -88);
    }),
    DARK,
  ]);
  // His hiking hat: a soft crown, a dark band, and a wide brim all round
  // (seen from behind, a flat oval, its back half in front of the crown).
  parts.push([
    path((p) => {
      p.moveTo(-5.6, -91.4);
      p.bezierCurveTo(-6.2, -100.4, 6.2, -100.4, 5.6, -91.4);
      p.closePath();
    }),
    HAT,
  ]);
  parts.push([
    path((p) => {
      p.moveTo(-5.7, -92.4);
      p.quadraticCurveTo(0, -91.2, 5.7, -92.4);
      p.lineTo(5.6, -94.2);
      p.quadraticCurveTo(0, -93, -5.6, -94.2);
      p.closePath();
    }),
    DARK,
  ]);
  parts.push([ellipse(0, -91, 10.4, 2.4), HAT]);
  // Shoulder straps, coming over the shoulders into the pack.
  parts.push([segment([-5.4, -79.5], [-8.6, -76], 2.4, 2.4), PACK]);
  parts.push([segment([5.4, -79.5], [8.6, -76], 2.4, 2.4), PACK]);
  // The pack: rounded, a lid on top, narrower than his shoulders.
  const pack = path((p) => {
    p.moveTo(-8.6, -51);
    p.bezierCurveTo(-9.8, -60, -9.8, -70, -8.4, -76);
    p.bezierCurveTo(-7, -79.6, 7, -79.6, 8.4, -76);
    p.bezierCurveTo(9.8, -70, 9.8, -60, 8.6, -51);
    p.bezierCurveTo(5, -48.6, -5, -48.6, -8.6, -51);
  });
  parts.push([pack, PACK]);
  // Sleeping mat strapped across the bottom of the pack.
  parts.push([
    path((p) => {
      p.moveTo(-10.6, -51.5);
      p.lineTo(10.6, -51.5);
      p.arc(10.6, -48.9, 2.6, -Math.PI / 2, Math.PI / 2);
      p.lineTo(-10.6, -46.3);
      p.arc(-10.6, -48.9, 2.6, Math.PI / 2, (3 * Math.PI) / 2);
    }),
    JACKET - 0.08,
  ]);
  // Seams: the lid, a pocket, the mat's ties.
  seams.push(path((p) => {
    p.moveTo(-8.6, -71.5);
    p.bezierCurveTo(-4, -74, 4, -74, 8.6, -71.5);
  }));
  seams.push(path((p) => {
    p.moveTo(-5.6, -64);
    p.bezierCurveTo(-2, -65, 2, -65, 5.6, -64);
    p.bezierCurveTo(5.4, -59, 4.8, -56, 0, -55.6);
    p.bezierCurveTo(-4.8, -56, -5.4, -59, -5.6, -64);
  }));
  seams.push(path((p) => {
    p.moveTo(-5.5, -51.5);
    p.lineTo(-5.5, -46.3);
    p.moveTo(5.5, -51.5);
    p.lineTo(5.5, -46.3);
  }));
}

/** The hiker, at his place and step. `clip` (even-odd) is what he may show
 *  through when masked; `breath` (0..1) lifts him a hair, standing still.
 *  Drawn from shaped parts in several tones with one halo around the whole
 *  figure (see `figure`). */
export function drawHiker(ctx: CanvasRenderingContext2D, h: HikerState, clip?: Path2D, breath = 0): void {
  const p = gait(h.phase, h.amp);
  const swing = Math.cos(h.phase * Math.PI * 2) * h.amp;
  ctx.save();
  if (h.masked && clip) ctx.clip(clip, "evenodd");
  ctx.translate(h.x, h.y);
  ctx.scale(h.s, h.s * (1 + 0.012 * breath));
  // Weight shift (about his middle), then the bob of each step.
  ctx.translate(PIVOT.sway[0] + p.swayX, PIVOT.sway[1]);
  ctx.rotate(p.swayDeg * RAD);
  ctx.translate(-PIVOT.sway[0], -PIVOT.sway[1] + p.bob);
  const parts: [Path2D, number][] = [];
  const seams: Path2D[] = [];
  backLeg(parts, -1, lift(h.phase, h.amp));
  backLeg(parts, 1, lift(h.phase + 0.5, h.amp));
  backBody(parts, seams);
  // The scarf tied at the top of the pack, flying out to his left in the
  // wind (it keeps moving even when he stands still).
  scarf(parts, [-7.6, -74], Math.PI + 0.25, performance.now() / 1000, 0.26);
  // Each arm swings against the leg on its side; drawn over the jacket.
  backArm(parts, -1, -swing, false);
  backArm(parts, 1, swing, true);
  figure(ctx, parts, seams);
  ctx.restore();
}
