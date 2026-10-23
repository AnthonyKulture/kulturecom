/**
 * Fifth illustration: the hiker walking up a slope that rises from bottom
 * left to top right, as a tone map for the dot screen (halftone.ts). He is
 * seen in profile, walking to the right: jointed legs (the foot he stands on
 * stays planted while the ground slides under it, the other swings up to the
 * next step), arms swinging against them, a pole in the front hand, leaning
 * into the slope with his pack on. He stays put in the frame; the ground (with
 * a pine, a bush or flowers now and then) and a far range slide by at their
 * own depth, in an endless loop. Kept light: one pale range, a thin ground.
 *
 * The context is set up in view-box units by the caller (runDots).
 */

import { cloud, figure, hash, ink, occlude, puff, ridgeGlow, scarf } from "~/lib/halftone-ink";

export const CLIMB_VIEW = { w: 600, h: 700 } as const;
const W = CLIMB_VIEW.w;
const H = CLIMB_VIEW.h;

const SPEED = 46; // ground speed along the slope, units per second
const STEP_TIME = 1.1; // one walk cycle, as in the hero
const SLOPE = { x0: -40, y0: 620, x1: W + 40, y1: 200 }; // the ridge line he walks up
const K = (SLOPE.y1 - SLOPE.y0) / (SLOPE.x1 - SLOPE.x0); // < 0: rising to the right
const COS = 1 / Math.hypot(1, K); // horizontal share of a step along the slope
const HIKER = { x: 280, s: 1.75 };
const PERIOD = 1200; // every pattern repeats over this, so the loop never shows a seam

/** Organic wobble, periodic over PERIOD. */
const wobble = (v: number, seed: number, amp: number): number => {
  const a = (v / PERIOD) * Math.PI * 2;
  return amp * (0.5 * Math.sin(a * 3 + seed) + 0.3 * Math.sin(a * 7 + seed * 2.3) + 0.2 * Math.sin(a * 13 + seed * 4.1));
};

/** The ground's edge at x, for a ground slid by `o` units. */
const groundY = (x: number, o: number): number => SLOPE.y0 + (x - SLOPE.x0) * K + wobble(x + o * COS, 7, 7);

/** A far range: a periodic ridge, slid by `o`, drawn pale. */
function range(ctx: CanvasRenderingContext2D, o: number, base: number, amp: number, seed: number, tone: number): void {
  const ridge = new Path2D();
  const body = new Path2D();
  body.moveTo(-20, H + 20);
  for (let x = -20; x <= W + 20; x += 6) {
    const v = x + o;
    const peaks = Math.abs(Math.sin((v / PERIOD) * Math.PI * 4 + seed)) * amp + wobble(v, seed, amp * 0.35);
    const y = base - peaks + x * K * 0.35;
    body.lineTo(x, y);
    x === -20 ? ridge.moveTo(x, y) : ridge.lineTo(x, y);
  }
  body.lineTo(W + 20, H + 20);
  body.closePath();
  occlude(ctx, body);
  const g = ctx.createLinearGradient(0, base - amp, 0, base + 160);
  g.addColorStop(0, ink(tone));
  g.addColorStop(1, ink(0));
  ctx.fillStyle = g;
  ctx.fillRect(-20, base - amp * 2, W + 40, 400);
  ridgeGlow(ctx, ridge, 16, tone * 0.8);
  ctx.restore();
}

function ground(ctx: CanvasRenderingContext2D, o: number): void {
  const edge = new Path2D();
  const body = new Path2D();
  body.moveTo(-20, H + 20);
  for (let x = -20; x <= W + 20; x += 6) {
    const y = groundY(x, o);
    body.lineTo(x, y);
    x === -20 ? edge.moveTo(x, y) : edge.lineTo(x, y);
  }
  body.lineTo(W + 20, H + 20);
  body.closePath();
  occlude(ctx, body);
  // A thin band of tone under the edge, fading down: a light, airy ground.
  ridgeGlow(ctx, edge, 40, 0.07);
  // Marks sliding down the slope with the ground: tufts and stones.
  for (let i = 0; i < 80; i++) {
    const u = ((((hash(i, 1) * PERIOD - o) % PERIOD) + PERIOD) % PERIOD) * COS; // slid along the slope
    const x = SLOPE.x0 + u;
    if (x < -20 || x > W + 20) continue;
    const depth = 8 + hash(i, 2) * 110; // how far under the edge
    const y = groundY(x, o) + depth;
    const fade = 1 - depth / 140;
    const kind = hash(i, 3);
    if (kind < 0.55) {
      // A tuft: three short curved strokes.
      ctx.strokeStyle = ink(0.35 * fade);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (const d of [-3, 0, 3]) {
        ctx.moveTo(x + d, y);
        ctx.quadraticCurveTo(x + d * 1.4, y - 4, x + d * 2, y - 7 - hash(i, 4) * 4);
      }
      ctx.stroke();
    } else if (kind < 0.8) {
      // A stone: a small lump, set along the slope.
      ctx.fillStyle = ink(0.3 * fade);
      ctx.beginPath();
      ctx.ellipse(x, y, 4 + hash(i, 5) * 4, 2 + hash(i, 6) * 2, Math.atan(K), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // The trail just under the edge: dashes sliding down.
  ctx.strokeStyle = ink(0.28);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  const dash = 22;
  const off = (((o * COS) % dash) + dash) % dash;
  for (let x = -20 + dash - off; x < W + 20; x += dash) {
    ctx.moveTo(x, groundY(x, o) + 6);
    ctx.lineTo(x - 10, groundY(x - 10, o) + 6);
  }
  ctx.stroke();
  ctx.restore();
  // The edge itself.
  ctx.strokeStyle = ink(0.45);
  ctx.lineWidth = 1.4;
  ctx.stroke(edge);
}

// ===== The hiker, in profile =====

const THIGH = 23;
const SHIN = 22;
const UPPER_ARM = 15;
const FOREARM = 14;
const STANCE = 0.6; // share of a cycle a foot spends on the ground
const RAD = Math.PI / 180;
const SLOPE_A = Math.atan(K); // the ground's tilt (negative: rising right)
type P = [number, number];

const add = (a: P, b: P): P => [a[0] + b[0], a[1] + b[1]];
const rot = (v: P, a: number): P => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];

/** A tapered limb segment from `a` (width wa) to `b` (width wb), with round
 *  ends, so joints read as joints and not as stacked blocks. */
function segment(a: P, b: P, wa: number, wb: number): Path2D {
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

/** Knee (or elbow) of a two-part limb from `a` to `b`, bent toward `dir`. */
function joint(a: P, b: P, l1: number, l2: number, dir: 1 | -1): P {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const d = Math.min(Math.hypot(dx, dy), l1 + l2 - 0.01);
  const u = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - u * u));
  const n = Math.hypot(dx, dy) || 1;
  const px = a[0] + (u * dx) / n;
  const py = a[1] + (u * dy) / n;
  const k1: P = [px - (h * dy) / n, py + (h * dx) / n];
  const k2: P = [px + (h * dy) / n, py - (h * dx) / n];
  return (k1[0] - k2[0]) * dir > 0 ? k1 : k2;
}

/**
 * One foot through the cycle, in figure units (hip at the origin): its ankle
 * and the boot's angle. Planted and sliding back with the ground while it
 * carries him, rolling onto the toe at the end (heel up), then lifted and
 * swung forward, toe raised, to the next step. `ground(x)` is the ground
 * under figure x.
 */
function foot(phase: number, stride: number, ground: (x: number) => number): { ankle: P; angle: number } {
  const u = ((phase % 1) + 1) % 1;
  if (u < STANCE) {
    const x = stride / 2 - (u / STANCE) * stride;
    const ankle: P = [x, ground(x) - 2.5];
    // Last third of the stance: the heel peels off, the boot pivots on its toe.
    const roll = Math.max(0, (u / STANCE - 0.66) / 0.34);
    if (roll <= 0) return { ankle, angle: SLOPE_A };
    const a = -roll * 32 * RAD;
    const toe = add(ankle, rot([7, 2.5], SLOPE_A));
    return { ankle: add(toe, rot([-7, -2.5], SLOPE_A + a)), angle: SLOPE_A + a };
  }
  const v = (u - STANCE) / (1 - STANCE);
  const e = v * v * (3 - 2 * v);
  const x = -stride / 2 + e * stride;
  const lift = Math.sin(v * Math.PI) * 9 + Math.sin(v * Math.PI * 0.5) * 2;
  // Toe down as it leaves, toe up as it reaches for the next step.
  const angle = SLOPE_A + (-20 * (1 - v) + 14 * v) * RAD * Math.sin(v * Math.PI);
  return { ankle: [x, ground(x) - 2.5 - lift], angle };
}

function boot(ankle: P, angle: number): Path2D {
  const p = new Path2D();
  const q = (x: number, y: number): P => add(ankle, rot([x, y], angle));
  const pts: P[] = [q(-3.2, -2), q(-3.6, 2.4), q(7.6, 2.6), q(8.2, 0.6), q(4, -1.2), q(1.5, -3.4)];
  pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
  p.closePath();
  return p;
}

// Tones, as for the back-view hiker: skin lightest, then jacket, hat,
// trousers, pack, then hat band and boots. The far limbs are a step lighter.
const SKIN = 0.42;
const JACKET = 0.58;
const TROUSERS = 0.74;
const PACK = 0.84;
const DARK = 0.95;
const HAT = 0.66;
const FAR = 0.16; // how much lighter the far arm and leg are

function hiker(ctx: CanvasRenderingContext2D, t: number, o: number): void {
  const s = HIKER.s;
  const phase = t / STEP_TIME;
  // Stride: how far the ground slides under a planted foot (figure units).
  const stride = (SPEED * COS * STANCE * STEP_TIME) / s;
  const a = phase * Math.PI * 2;
  const hipX = HIKER.x;
  // The hips ride up over each planted leg, twice a cycle.
  const hipY = groundY(hipX, o) - 41.5 * s - Math.abs(Math.sin(a)) * 1.4 * s;
  const ground = (fx: number): number => (groundY(hipX + fx * s, o) - hipY) / s;

  ctx.save();
  ctx.translate(hipX, hipY);
  ctx.scale(s, s);

  // Leaning into the slope, rocking a little with each push.
  const lean = (12 + Math.sin(a * 2) * 1.5) * RAD;
  const up: P = [Math.sin(lean), -Math.cos(lean)];
  const fwd: P = [-up[1], up[0]];
  const at = (k: number, w: number): P => [up[0] * k + fwd[0] * w, up[1] * k + fwd[1] * w];
  const shoulder = at(26, 0.5);
  const head = at(37.5, 2.5);
  const parts: [Path2D, number][] = [];
  const seams: Path2D[] = [];
  const curved = (start: P, ...qs: [P, P][]): Path2D => {
    const p = new Path2D();
    p.moveTo(start[0], start[1]);
    for (const [c, e] of qs) p.quadraticCurveTo(c[0], c[1], e[0], e[1]);
    p.closePath();
    return p;
  };

  const leg = (ph: number, far: number): void => {
    const f = foot(ph, stride, ground);
    const k = joint([0, 0], f.ankle, THIGH, SHIN, 1);
    parts.push([segment([0.5, 0], k, 8.4, 6), TROUSERS - far]);
    parts.push([segment(k, f.ankle, 6, 4), TROUSERS - far]);
    // The calf, fuller just under the knee.
    const calf = add(k, [(f.ankle[0] - k[0]) * 0.35 - 1.2, (f.ankle[1] - k[1]) * 0.35]);
    parts.push([ellipseAt(calf, 3.4, 5.4, Math.atan2(f.ankle[0] - k[0], k[1] - f.ankle[1])), TROUSERS - far]);
    parts.push([boot(f.ankle, f.angle), DARK - far]);
  };
  const arm = (ph: number, far: number, pole: boolean): void => {
    const c = Math.sin(ph * Math.PI * 2);
    const swing = -22 * c * RAD + lean * 0.6;
    const elbow = add(shoulder, [Math.sin(swing) * UPPER_ARM, Math.cos(swing) * UPPER_ARM]);
    // The elbow bends more as the arm comes forward.
    const bend = swing + (22 + 26 * Math.max(0, -c)) * RAD;
    const hand = add(elbow, [Math.sin(bend) * FOREARM, Math.cos(bend) * FOREARM]);
    if (pole) {
      // The pole: from the fist down to the ground a little ahead.
      const tip: P = [hand[0] + 8, ground(hand[0] + 8)];
      parts.push([segment([hand[0] - 0.3, hand[1] - 4], tip, 1.3, 1.1), DARK]);
    }
    parts.push([segment(shoulder, elbow, 5.6, 4.6), JACKET - far]);
    parts.push([segment(elbow, hand, 4.6, 3.6), JACKET - far]);
    parts.push([ellipseAt(hand, 2.2, 2.7, bend), SKIN - far]);
  };

  // Far side first (lighter), then the body, then the near side.
  leg(phase + 0.5, FAR);
  arm(phase, FAR, false);

  // Torso: a jacket with a rounded back and chest, narrower at the waist.
  parts.push([curved(at(-1, -6.2), [at(13, -8.4), at(27, -6.6)], [at(32, -2), at(30, 4.6)], [at(21, 9.4), at(10, 7.6)], [at(3, 6.6), at(-1, 6.6)]), JACKET]);
  // Neck, ear, head with a little nose; hair at the nape under the hat.
  parts.push([segment(at(27, 1), at(32, 2), 4.6, 4), SKIN]);
  const skull = new Path2D();
  skull.ellipse(head[0], head[1], 5.6, 6.6, lean, 0, Math.PI * 2);
  const nose = add(head, rot([5.8, 1], lean));
  skull.moveTo(nose[0], nose[1] - 1.4);
  skull.quadraticCurveTo(nose[0] + 1.8, nose[1] + 0.6, nose[0] - 0.3, nose[1] + 1.6);
  parts.push([skull, SKIN]);
  parts.push([ellipseAt(add(head, rot([-1.2, 0.6], lean)), 1.3, 2, lean), SKIN + 0.08]);
  const hq = (x: number, y: number): P => add(head, rot([x, y], lean));
  parts.push([curved(hq(-5.6, -1), [hq(-6.4, 3), hq(-3.6, 5)], [hq(-2.4, 1.6), hq(-2.6, -1)]), DARK]);
  // His hiking hat: a soft crown, a dark band, and a wide brim, front and
  // back, its edges drooping a little.
  parts.push([curved(hq(-5.8, -2.6), [hq(-5.6, -11.6), hq(0, -11.8)], [hq(5.6, -11.6), hq(5.8, -2.6)]), HAT]);
  parts.push([curved(hq(-5.9, -2.4), [hq(0, -1.6), hq(5.9, -2.4)], [hq(5.8, -4.4), hq(5.8, -4.4)], [hq(0, -3.6), hq(-5.8, -4.4)]), DARK]);
  parts.push([curved(hq(-11.2, 0.4), [hq(-6, -3.6), hq(0, -3.4)], [hq(6, -3.6), hq(11.6, 0.2)], [hq(6, -1.4), hq(0, -1.6)], [hq(-6, -1.4), hq(-11.2, 0.4)]), HAT]);
  // The pack: a rounded bag on his back, its lid, a strap over the shoulder,
  // and the mat rolled under it (seen end-on: a round).
  parts.push([curved(at(5, -6.4), [at(3, -15), at(10, -16)], [at(22, -17.4), at(28.5, -14)], [at(31.5, -9.5), at(28.5, -6.6)]), PACK]);
  parts.push([ellipseAt(at(4.6, -11.5), 4.4, 4.4, 0), JACKET - 0.06]);
  seams.push(curved(at(4.6, -11.5), [at(6.6, -13), at(4.6, -13.6)], [at(2.8, -12.6), at(3.8, -10.6)]));
  seams.push(curved(at(23, -16.6), [at(26, -11), at(29.5, -8)]));
  parts.push([segment(at(27.5, -6.4), at(14, 6.2), 2.2, 2.2), PACK]);
  // The scarf tied at the top of the pack, streaming behind him in the wind
  // he walks into (as on the pack at the camp).
  scarf(parts, at(27, -15.5), Math.PI - 0.05 - lean * 0.5, t, 0.26);

  leg(phase, 0);
  arm(phase + 0.5, 0, true);
  figure(ctx, parts, seams);
  ctx.restore();
}

// ===== Plants and trees going by =====

// Placed along the ground (world x before sliding), repeating every FLORA_SPAN.
// `front` ones pass in front of him, the others behind.
const FLORA_SPAN = 1100;
const FLORA = [
  { v: 60, kind: "pine", size: 1.1, front: false },
  { v: 150, kind: "flowers", size: 1, front: true },
  { v: 330, kind: "bush", size: 1, front: false },
  { v: 470, kind: "pine", size: 0.8, front: false },
  { v: 520, kind: "pine", size: 1.25, front: false },
  { v: 700, kind: "flowers", size: 0.9, front: true },
  { v: 860, kind: "bush", size: 1.2, front: true },
  { v: 980, kind: "pine", size: 0.95, front: false },
] as const;

function pine(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, tone: number): void {
  const p = new Path2D();
  const tiers = 5;
  for (let i = 0; i < tiers; i++) {
    const top = y - h + (i * h * 0.8) / tiers;
    const half = h * (0.1 + 0.055 * i);
    p.moveTo(x, top);
    p.quadraticCurveTo(x + half * 0.4, top + h * 0.12, x + half, top + h * 0.26);
    p.lineTo(x - half, top + h * 0.26);
    p.quadraticCurveTo(x - half * 0.4, top + h * 0.12, x, top);
    p.closePath();
  }
  p.rect(x - h * 0.025, y - h * 0.12, h * 0.05, h * 0.14);
  ctx.globalCompositeOperation = "destination-out";
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 3;
  ctx.stroke(p);
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = ink(tone);
  ctx.fill(p);
}

function bush(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, tone: number): void {
  for (const [dx, dy, k] of [[-0.6, -0.5, 0.75], [0.5, -0.55, 0.8], [0, -0.95, 0.9], [-0.1, -0.35, 1]] as const) {
    puff(ctx, x + dx * r, y + dy * r, r * k, r * k * 0.8, tone);
  }
}

function flowers(ctx: CanvasRenderingContext2D, x: number, y: number, k: number, tone: number): void {
  ctx.strokeStyle = ink(tone);
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 6; i++) {
    const sx = x + (i - 2.5) * 5 * k;
    const h = (12 + hash(i, 7) * 10) * k;
    const tip: P = [sx + (hash(i, 8) - 0.5) * 6, y - h];
    ctx.beginPath();
    ctx.moveTo(sx, y);
    ctx.quadraticCurveTo(sx, y - h * 0.5, tip[0], tip[1]);
    ctx.stroke();
    ctx.fillStyle = ink(tone + 0.15);
    ctx.beginPath();
    ctx.arc(tip[0], tip[1], 2.2 * k, 0, Math.PI * 2);
    ctx.fill();
  }
}

function flora(ctx: CanvasRenderingContext2D, o: number, front: boolean): void {
  for (const f of FLORA) {
    if (f.front !== front) continue;
    // Slides with the ground (same rate as its edge), wraps around.
    const x = ((((f.v - o * COS) % FLORA_SPAN) + FLORA_SPAN) % FLORA_SPAN) - 120;
    if (x < -100 || x > W + 100) continue;
    const y = groundY(x, o) + (front ? 10 : 2);
    if (f.kind === "pine") pine(ctx, x, y, 95 * f.size, 0.42);
    else if (f.kind === "bush") bush(ctx, x, y, 16 * f.size, front ? 0.5 : 0.35);
    else flowers(ctx, x, y, f.size, 0.5);
  }
}

function ellipseAt(c: P, rx: number, ry: number, angle: number): Path2D {
  const p = new Path2D();
  p.ellipse(c[0], c[1], rx, ry, angle, 0, Math.PI * 2);
  return p;
}

export function drawClimbTone(ctx: CanvasRenderingContext2D, t: number, w: number, hgt: number): void {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, w, hgt);
  ctx.restore();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const o = t * SPEED; // how far he has walked

  // Sky: slow clouds, drifting a little against his way.
  for (const c of [
    { x: 40, y: 110, len: 180, seed: 4 },
    { x: 380, y: 60, len: 140, seed: 8 },
  ]) {
    const span = W + c.len * 2;
    const x = ((((c.x - o * 0.08) % span) + span) % span) - c.len;
    cloud(ctx, { x, y: c.y, len: c.len, seed: c.seed });
  }
  // One far range, pale and low, drifting slowly.
  range(ctx, o * 0.15, 420, 45, 1, 0.07);
  ground(ctx, o);

  // The hiker, in place on the edge, walking.
  flora(ctx, o, false);
  hiker(ctx, t, o);
  flora(ctx, o, true);
}
