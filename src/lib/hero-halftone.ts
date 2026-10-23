/**
 * The hero scene as a tone map, for the dot screen (halftone.ts): the same
 * world as hero-scene.ts, drawn as densities instead of lines. Dense where a
 * slope turns from the light (from the left) and down its gullies, light on
 * the crests, thinning into the valley mist at the feet of the mountains.
 *
 * Drawn far to near; each mountain first clears what is behind it, so nothing
 * shows through. The context is set up in view-box units by the caller.
 */

import { cloud, drawHiker, hash, ink, occlude, ridgeGlow, type HikerState } from "~/lib/halftone-ink";
import {
  CX,
  GROUND_PATH,
  HORIZON,
  VIEW,
  decalFrame,
  depth,
  flockFrame,
  layerFrame,
  proj,
  type Layer,
  type Pt,
  type Scene,
} from "~/lib/hero-scene";

const groundPath = new Path2D(GROUND_PATH);
const behindRidge = (() => {
  const p = new Path2D();
  p.rect(-200, -200, VIEW.w + 400, VIEW.h + 400);
  p.addPath(groundPath);
  return p;
})();

function mountain(ctx: CanvasRenderingContext2D, l: Layer): void {
  const near = Math.min(1, l.p);
  const z = depth(l.p);
  const f = layerFrame(l);
  if (!f.fill) return;
  const pts: Pt[] = [];
  for (const [x, h] of l.profile) {
    const pt = proj(x, h, z);
    if (pt[0] >= -120 && pt[0] <= VIEW.w + 120) pts.push(pt); // as layerFrame culls
  }
  const top = Math.min(...pts.map((p) => p[1]));
  const foot = proj(0, 0, z)[1];
  if (pts.length < 2 || !Number.isFinite(top) || !Number.isFinite(foot)) return; // all but out of frame
  const reach = Math.min(150, Math.max(3, (foot - top) * 0.7));
  const k = 0.55 + 0.45 * near; // nearer, denser

  occlude(ctx, new Path2D(f.fill));
  // A light mass all through, so no hollow shows between two slopes.
  const mass = ctx.createLinearGradient(0, top, 0, foot + 40);
  mass.addColorStop(0, ink(0.1 * k));
  mass.addColorStop(0.8, ink(0.06 * k));
  mass.addColorStop(1, ink(0));
  ctx.fillStyle = mass;
  ctx.fillRect(-200, top - 2, VIEW.w + 400, foot - top + 44);
  ridgeGlow(ctx, new Path2D(f.d), reach, 0.1 * k);
  fallLines(ctx, l, z, reach, k);
  // Gullies: the slope strokes, as dense streaks.
  ctx.strokeStyle = ink(0.28 * k);
  ctx.lineWidth = Math.max(1, Math.min(10, (0.2 * 300) / z));
  ctx.stroke(new Path2D(f.hatch));
  // Where its outline stops inside the frame, the mountain dissolves into
  // mist instead of ending on a cut.
  ctx.globalCompositeOperation = "destination-out";
  const fadeW = Math.max(14, reach * 0.8);
  for (const [end, dir] of [[pts[0], 1], [pts[pts.length - 1], -1]] as const) {
    if (end[0] < 0 || end[0] > VIEW.w) continue;
    const g = ctx.createLinearGradient(end[0], 0, end[0] + dir * fadeW, 0);
    g.addColorStop(0, ink(1));
    g.addColorStop(1, ink(0));
    ctx.fillStyle = g;
    ctx.fillRect(dir > 0 ? end[0] - 2 : end[0] - fadeW, -200, fadeW + 2, VIEW.h + 400);
  }
  ctx.globalCompositeOperation = "source-over";
  ctx.restore();
}

/**
 * Streaks running down the slopes from the ridge, like water and scree: the
 * grain of the mountains. Denser and longer where a slope turns from the
 * light (from the left), and leaning downhill. Each streak belongs to a spot
 * on the mountain's profile, so it grows with the mountain as it comes.
 */
function fallLines(ctx: CanvasRenderingContext2D, l: Layer, z: number, reach: number, k: number): void {
  const BUCKETS = 4;
  const long = Array.from({ length: BUCKETS }, () => new Path2D());
  const short = Array.from({ length: BUCKETS }, () => new Path2D());
  const seed = Math.round(l.profile[0][0] * 997) + l.profile.length;
  for (let i = 1; i < l.profile.length; i++) {
    const a = proj(l.profile[i - 1][0], l.profile[i - 1][1], z);
    const b = proj(l.profile[i][0], l.profile[i][1], z);
    if (Math.max(a[0], b[0]) < -20 || Math.min(a[0], b[0]) > VIEW.w + 20) continue;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    if (dx <= 0) continue;
    const facing = Math.max(-1, Math.min(1, dy / dx / 1.2)); // +1: steep, facing right (shade)
    const shade = 0.5 + 0.5 * facing;
    const n = Math.max(1, Math.round(Math.hypot(dx, dy) / 2.4));
    for (let j = 0; j < n; j++) {
      const t = (j + hash(seed + i, j)) / n;
      const x = a[0] + dx * t;
      const y = a[1] + dy * t + 0.5;
      const r = hash(seed - i, j + 17);
      const len = reach * (0.2 + 0.8 * r) * (0.45 + 0.55 * shade);
      const lean = 0.4 * facing * len;
      const bucket = Math.min(BUCKETS - 1, Math.floor(shade * BUCKETS * (0.75 + 0.25 * r)));
      long[bucket].moveTo(x, y);
      long[bucket].lineTo(x + lean, y + len);
      short[bucket].moveTo(x, y);
      short[bucket].lineTo(x + lean * 0.4, y + len * 0.4);
    }
  }
  ctx.lineWidth = 1.8;
  for (let b = 0; b < BUCKETS; b++) {
    ctx.strokeStyle = ink((0.06 + 0.07 * b) * k);
    ctx.stroke(long[b]);
    ctx.stroke(short[b]); // denser near the ridge
  }
}

/** Draw the whole scene's tones; `w`×`h` is the tone canvas in pixels. */
export function drawHeroTone(ctx: CanvasRenderingContext2D, scene: Scene, h: HikerState, w: number, hgt: number): void {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, w, hgt);
  ctx.restore();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Sky: soft clouds, birds now and then, the sun on the horizon, the horizon line.
  for (const c of scene.clouds) cloud(ctx, c);
  const birds = flockFrame(scene.flock);
  if (birds) {
    ctx.strokeStyle = ink(0.9);
    ctx.lineWidth = 2.8;
    ctx.stroke(new Path2D(birds));
  }
  // The sun sits on the horizon: only its dome above the line shows.
  const sun = new Path2D();
  sun.arc(CX + 150, HORIZON - 4, 27, 0, Math.PI * 2);
  ctx.save();
  ctx.beginPath();
  ctx.rect(-200, -200, VIEW.w + 400, HORIZON + 200);
  ctx.clip();
  ctx.fillStyle = ink(0.14);
  ctx.fill(sun);
  ctx.strokeStyle = ink(0.6);
  ctx.lineWidth = 2;
  ctx.stroke(sun);
  ctx.restore();
  ctx.fillStyle = ink(0.42);
  ctx.fillRect(-200, HORIZON - 0.7, VIEW.w + 400, 1.4);

  // The still far range, then the mountains, far to near.
  for (const b of scene.backdrop) {
    occlude(ctx, new Path2D(b.d));
    ridgeGlow(ctx, new Path2D(b.d), 14, 0.07);
    ctx.restore();
  }
  for (const l of [...scene.layers].sort((a, b) => a.p - b.p)) mountain(ctx, l);

  // Valley mist: the feet of the mountains fade out around the horizon.
  ctx.globalCompositeOperation = "destination-out";
  const mist = ctx.createLinearGradient(0, HORIZON - 4, 0, HORIZON + 70);
  mist.addColorStop(0, ink(0));
  mist.addColorStop(0.25, ink(0.5));
  mist.addColorStop(1, ink(0));
  ctx.fillStyle = mist;
  ctx.fillRect(-200, HORIZON - 4, VIEW.w + 400, 74);
  ctx.globalCompositeOperation = "source-over";

  // His ridge: an even mass, a little denser under its crest, shaded on the
  // right, fading downward.
  occlude(ctx, groundPath);
  const mass = ctx.createLinearGradient(0, HORIZON + 90, 0, VIEW.h);
  mass.addColorStop(0, ink(0.14));
  mass.addColorStop(1, ink(0.08));
  ctx.fillStyle = mass;
  ctx.fillRect(-200, HORIZON, VIEW.w + 400, VIEW.h);
  ridgeGlow(ctx, groundPath, 30, 0.06);
  const side = ctx.createLinearGradient(CX - 40, 0, CX + 260, 0);
  side.addColorStop(0, ink(0));
  side.addColorStop(1, ink(0.14));
  ctx.fillStyle = side;
  ctx.fillRect(CX - 40, 0, VIEW.w, VIEW.h + 200);
  ctx.globalCompositeOperation = "destination-out";
  const fade = ctx.createLinearGradient(0, VIEW.h - 200, 0, VIEW.h);
  fade.addColorStop(0, ink(0));
  fade.addColorStop(1, ink(0.9));
  ctx.fillStyle = fade;
  ctx.fillRect(-200, VIEW.h - 200, VIEW.w + 400, 400);
  ctx.globalCompositeOperation = "source-over";
  ctx.restore();
  ctx.strokeStyle = ink(0.55);
  ctx.lineWidth = 1.6;
  ctx.stroke(groundPath);

  // Pebbles and tufts streaming toward us.
  ctx.strokeStyle = ink(0.6);
  ctx.lineWidth = 1.4;
  ctx.stroke(new Path2D(scene.decals.map(decalFrame).join("")));

  drawHiker(ctx, h, behindRidge);
}
