/**
 * Third illustration: his camp in the mountains — the backpack set down in
 * the meadow's grass (a scarf tied on, flapping in the wind), the water
 * bottle at its foot, and the laptop open on a tree stump, its screen typing
 * code. A tone map for the dot screen (halftone.ts), drawn at time `t`, like
 * the hero and the waterfall.
 *
 * Every object gets a light halo first, so it stands clear of what is behind
 * it; light marks (seams, highlights, code) are cut out of the dark masses.
 */

import { ink, hash } from "~/lib/halftone-ink";

export const GEAR_VIEW = { w: 400, h: 200 } as const; // the camp, from y 40 down

const TAU = Math.PI * 2;
const P = (d: string) => new Path2D(d);
type Pt = [number, number];

// --- the kit (drawn in its own units, then shifted into the view)
const PACK = {
  body: P("M128 258C124 200 126 140 136 104C140 92 150 86 175 86C200 86 210 92 214 104C224 140 226 200 222 258C200 264 150 264 128 258Z"),
  lid: P("M134 112C136 88 150 76 175 76C200 76 214 88 216 112C204 118 146 118 134 112Z"),
  mat: P("M142 56h66a10.5 10.5 0 0 1 0 21h-66a10.5 10.5 0 0 1 0 -21Z"),
  matRolls: P("M208 59a6 6 0 1 1 0 15M208 63a3 3 0 1 1 0 7M142 59a6 6 0 1 0 0 15"),
  matStraps: P("M154 54v25M196 54v25"),
  handle: P("M167 77q8 -9 16 0"),
  straps: P("M158 116v54M192 116v54"),
  buckles: P("M154.5 146h7v7h-7ZM188.5 146h7v7h-7Z"),
  pocket: P("M146 170h58q8 0 8 8v54q0 8 -8 8h-58q-8 0 -8 -8v-54q0 -8 8 -8Z"),
  pocketSeam: P("M140 186h70M175 192v10"),
};
const BOTTLE = {
  body: P("M73 258V200C73 189 82 185 84 178H92C94 185 103 189 103 200V258C96 262 80 262 73 258Z"),
  label: P("M73 220h30v16h-30Z"),
  cap: P("M81 165h14q2 0 2 2v11h-18v-11q0 -2 2 -2Z"),
  ring: P("M88 165a5.5 5.5 0 1 1 0.01 0"),
  shine: P("M79 202v52"),
};
// The laptop, a little turned (three-quarter view): a thin deck in
// perspective with its front edge, and a 16:10 screen leaning back.
const LAPTOP = {
  deck: P("M294 184L366 184L372 175L300 175Z"),
  lip: P("M294 184L366 184L366 187L294 187Z"),
  keys: P("M304 177.5H364M302 180H362"),
  pad: P("M322 182.6h14"),
  lid: P("M300 175L372 175L376 128L304 128Z"),
  display: P("M304 171.5L368.5 171.5L372 131.5L307.5 131.5Z"),
  bar: P("M307.5 131.5L372 131.5L371.7 135L307.2 135Z"),
};
const STUMP = {
  body: P("M286 178C287 192 286 202 282 210C300 218 362 218 380 210C376 202 375 192 376 178Z"),
  top: P("M286 178a45 9 0 1 0 90 0a45 9 0 1 0 -90 0Z"),
  rings: P("M300 178a31 5.5 0 1 0 62 0a31 5.5 0 1 0 -62 0M316 178a15 2.8 0 1 0 30 0a15 2.8 0 1 0 -30 0"),
  bark: P("M296 190v16M310 192v19M326 191v22M344 192v20M362 190v17M372 186v18"),
};
const RIDGE: Pt[] = [
  [-10, 142], [40, 128], [80, 134], [122, 116], [166, 130], [212, 120], [262, 136], [312, 122], [360, 132], [410, 124],
];
const ROCK = P("M228 216C230 204 238 199 248 199C258 199 264 206 266 216Z");
// The meadow's edge, a gentle swell across the view.
const MEADOW = P("M-10 164C60 158 140 168 220 162C290 157 350 166 410 160V260H-10Z");
// Blades of grass all over the meadow, denser toward us (built once).
const GRASS = (() => {
  const p = new Path2D();
  for (let i = 0; i < 150; i++) {
    const y = 176 + 60 * hash(i, 1) ** 0.6;
    const x = -6 + 412 * hash(i, 2);
    const h = 2 + 5 * ((y - 166) / 70) * (0.6 + 0.4 * hash(i, 3));
    p.moveTo(x, y);
    p.quadraticCurveTo(x + h * 0.15, y - h * 0.6, x + h * 0.4, y - h);
  }
  return p;
})();
/** Tufts in front of what stands in the grass, so it sits in it. */
function tufts(spots: [number, number, number][]): Path2D {
  const p = new Path2D();
  spots.forEach(([x, y, s], k) => {
    for (let i = 0; i < 5; i++) {
      const a = -0.9 + i * 0.42 + (hash(k, i) - 0.5) * 0.3;
      const l = (5 + hash(i, k) * 5) * s;
      const bx = x + (i - 2) * 2.4 * s;
      p.moveTo(bx, y);
      p.quadraticCurveTo(bx + Math.sin(a) * l * 0.4, y - l * 0.6, bx + Math.sin(a) * l + l * 0.15, y - l);
    }
  });
  return p;
}
const FRONT_TUFTS = tufts([
  [150, 218, 1], [176, 220, 1.1], [206, 219, 1], [122, 225, 0.9], [138, 226, 1],
  [242, 218, 0.8], [290, 214, 1], [330, 218, 1.1], [368, 214, 1], [60, 230, 1.2], [20, 228, 1], [392, 230, 1.1],
]);
const SCARF_KNOT: Pt = [216, 116]; // on the pack, in its own units

// Code on the screen: [indent, length] per line, in a box of the display.
const CODE = [
  [0, 24], [1, 34], [2, 22], [2, 38], [1, 16], [0, 26], [1, 30],
] as const;
const CODE_BOX = { x: 312, y: 140, line: 4.6, indent: 4.5 };
const TYPE_SPEED = 30; // units per second
const LINE_PAUSE = 0.28; // s between two lines
const HOLD = 1.6; // s with everything typed, before it starts again

/** Light halo, then the shape in its tone. */
function solid(ctx: CanvasRenderingContext2D, p: Path2D, tone: CanvasGradient | string, halo = 2.6): void {
  ctx.globalCompositeOperation = "destination-out";
  ctx.strokeStyle = "#000";
  ctx.lineWidth = halo;
  ctx.stroke(p);
  ctx.fill(p);
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = tone;
  ctx.fill(p);
}

/** Light marks cut out of what is drawn. */
function cut(ctx: CanvasRenderingContext2D, p: Path2D, a: number, width: number): void {
  ctx.globalCompositeOperation = "destination-out";
  ctx.strokeStyle = ink(a);
  ctx.lineWidth = width;
  ctx.stroke(p);
  ctx.globalCompositeOperation = "source-over";
}

function line(ctx: CanvasRenderingContext2D, p: Path2D, a: number, width: number, halo = 0): void {
  if (halo) {
    ctx.globalCompositeOperation = "destination-out";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = width + halo;
    ctx.stroke(p);
    ctx.globalCompositeOperation = "source-over";
  }
  ctx.strokeStyle = ink(a);
  ctx.lineWidth = width;
  ctx.stroke(p);
}

function backpack(ctx: CanvasRenderingContext2D): void {
  const side = ctx.createLinearGradient(124, 0, 226, 0); // lit from the left
  side.addColorStop(0, ink(0.42));
  side.addColorStop(1, ink(0.72));
  solid(ctx, PACK.body, side);
  line(ctx, PACK.straps, 0.95, 3.2, 1.6);
  solid(ctx, PACK.buckles, ink(1), 1.6);
  solid(ctx, PACK.pocket, ink(0.82));
  cut(ctx, PACK.pocketSeam, 0.6, 1.4);
  solid(ctx, PACK.lid, ink(0.74));
  solid(ctx, PACK.mat, ink(0.34));
  cut(ctx, PACK.matRolls, 0.55, 1.2);
  line(ctx, PACK.matStraps, 0.95, 3, 1.4);
  line(ctx, PACK.handle, 0.9, 2.2, 1.4);
}

function bottle(ctx: CanvasRenderingContext2D): void {
  const side = ctx.createLinearGradient(73, 0, 103, 0);
  side.addColorStop(0, ink(0.28));
  side.addColorStop(1, ink(0.56));
  solid(ctx, BOTTLE.body, side);
  ctx.save();
  ctx.clip(BOTTLE.body);
  ctx.fillStyle = ink(0.78);
  ctx.fill(BOTTLE.label);
  ctx.restore();
  cut(ctx, BOTTLE.shine, 0.65, 2);
  solid(ctx, BOTTLE.cap, ink(0.9));
  line(ctx, BOTTLE.ring, 0.85, 1.8, 1.4);
}

/** The laptop; its lit screen types code, line after line, then starts over. */
function laptop(ctx: CanvasRenderingContext2D, t: number): void {
  solid(ctx, LAPTOP.lid, ink(0.92));
  // The screen is on: light, with the editor's bar on top.
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = "#000";
  ctx.fill(LAPTOP.display);
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = ink(0.07);
  ctx.fill(LAPTOP.display);
  ctx.fillStyle = ink(0.35);
  ctx.fill(LAPTOP.bar);
  const deck = ctx.createLinearGradient(0, 175, 0, 184);
  deck.addColorStop(0, ink(0.5));
  deck.addColorStop(1, ink(0.66));
  solid(ctx, LAPTOP.deck, deck);
  ctx.fillStyle = ink(0.92);
  ctx.fill(LAPTOP.lip);
  ctx.setLineDash([2.6, 1.6]);
  cut(ctx, LAPTOP.keys, 0.55, 1.4);
  ctx.setLineDash([]);
  cut(ctx, LAPTOP.pad, 0.5, 2);

  // The code, in two strengths like syntax colours.
  const timing = CODE.map(([, len]) => len / TYPE_SPEED + LINE_PAUSE);
  const cycle = timing.reduce((a, b) => a + b, 0) + HOLD;
  let c = t % cycle;
  let cursor: Pt | null = null;
  ctx.save();
  ctx.clip(LAPTOP.display);
  ctx.lineCap = "butt";
  ctx.lineWidth = 2;
  CODE.forEach(([indent, len], i) => {
    if (c < 0) return;
    const typed = Math.min(len, c * TYPE_SPEED);
    c -= timing[i];
    const x0 = CODE_BOX.x + indent * CODE_BOX.indent;
    const y = CODE_BOX.y + i * CODE_BOX.line;
    let x = 0;
    let w = 0;
    while (x < typed) {
      const word = 4 + hash(i, w) * 8;
      const end = Math.min(typed, x + word);
      ctx.strokeStyle = ink(w % 2 ? 0.45 : 0.85);
      ctx.beginPath();
      ctx.moveTo(x0 + x, y);
      ctx.lineTo(x0 + end, y);
      ctx.stroke();
      x += word + 2.4;
      w++;
    }
    if (typed < len || i === CODE.length - 1) cursor = [x0 + typed + 2, y];
  });
  // The cursor blinks where the typing is.
  if (cursor && Math.floor(t * 2) % 2 === 0) {
    ctx.fillStyle = ink(0.95);
    ctx.fillRect(cursor[0], cursor[1] - 1.8, 2, 3.6);
  }
  ctx.restore();
}

/** One tail of the scarf: a ribbon whose wave runs down it with the wind,
 *  growing toward the tip, twisting (narrower where the cloth turns). */
function tail(ctx: CanvasRenderingContext2D, t: number, len: number, w0: number, phase: number, angle: number): void {
  const N = 20;
  const gust = 0.75 + 0.25 * Math.sin(t * 0.8) * Math.sin(t * 1.9 + 1);
  const mid: Pt[] = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const s = u * len;
    const amp = (1 + 7 * u ** 1.3) * gust;
    const wave = amp * Math.sin((s / 48) * TAU - t * TAU * 1.3 + phase);
    mid.push([SCARF_KNOT[0] + s * Math.cos(angle), SCARF_KNOT[1] + s * Math.sin(angle) + wave + 7 * u * u]);
  }
  const left: Pt[] = [];
  const right: Pt[] = [];
  mid.forEach(([x, y], i) => {
    const [ax, ay] = mid[Math.max(0, i - 1)];
    const [bx, by] = mid[Math.min(N, i + 1)];
    const d = Math.hypot(bx - ax, by - ay) || 1;
    const nx = -(by - ay) / d;
    const ny = (bx - ax) / d;
    const u = i / N;
    const twist = 0.62 + 0.38 * Math.abs(Math.cos((u * len * TAU) / 96 - t * TAU * 0.65 + phase));
    const half = (w0 / 2) * (1 - 0.62 * u) * twist;
    left.push([x + nx * half, y + ny * half]);
    right.push([x - nx * half, y - ny * half]);
  });
  const p = new Path2D();
  [...left, ...[...right].reverse()].forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
  p.closePath();
  solid(ctx, p, ink(0.55), 2.2);
  // Its lower edge in shade, for the thickness of the cloth.
  const fold = new Path2D();
  right.forEach(([x, y], i) => (i ? fold.lineTo(x, y) : fold.moveTo(x, y)));
  ctx.save();
  ctx.clip(p);
  ctx.strokeStyle = ink(0.85);
  ctx.lineWidth = 3;
  ctx.stroke(fold);
  ctx.restore();
}

/** A soft shadow on the ground. */
function shadow(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, a: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, 0.12);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, ink(a));
  g.addColorStop(1, ink(0));
  ctx.fillStyle = g;
  ctx.fillRect(-rx, -rx, rx * 2, rx * 2);
  ctx.restore();
}

/** Draw the camp's tones at time `t` (s); `w`×`h` is the tone canvas in pixels. */
export function drawGearTone(ctx: CanvasRenderingContext2D, t: number, w: number, hgt: number): void {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, w, hgt);
  ctx.restore();
  ctx.save();
  ctx.translate(0, -40);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Far away: a pale ridge; then the meadow, its grass denser toward us.
  const ridge = new Path2D();
  RIDGE.forEach(([x, y], i) => (i ? ridge.lineTo(x, y) : ridge.moveTo(x, y)));
  const ridgeBody = new Path2D(ridge);
  ridgeBody.lineTo(410, 200);
  ridgeBody.lineTo(-10, 200);
  ridgeBody.closePath();
  const far = ctx.createLinearGradient(0, 116, 0, 168);
  far.addColorStop(0, ink(0.05));
  far.addColorStop(1, ink(0));
  ctx.fillStyle = far;
  ctx.fill(ridgeBody);
  ctx.strokeStyle = ink(0.12);
  ctx.lineWidth = 1.2;
  ctx.stroke(ridge);
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = "#000";
  ctx.fill(MEADOW);
  ctx.globalCompositeOperation = "source-over";
  const meadow = ctx.createLinearGradient(0, 160, 0, 240);
  meadow.addColorStop(0, ink(0.02));
  meadow.addColorStop(0.7, ink(0.05));
  meadow.addColorStop(1, ink(0));
  ctx.fillStyle = meadow;
  ctx.fill(MEADOW);
  ctx.strokeStyle = ink(0.2);
  ctx.lineWidth = 1.1;
  ctx.stroke(GRASS);

  // The stump, the laptop open on it.
  shadow(ctx, 331, 212, 62, 0.3);
  const bark = ctx.createLinearGradient(282, 0, 380, 0);
  bark.addColorStop(0, ink(0.32));
  bark.addColorStop(1, ink(0.6));
  solid(ctx, STUMP.body, bark);
  line(ctx, STUMP.bark, 0.8, 1.4);
  solid(ctx, STUMP.top, ink(0.22), 2);
  cut(ctx, STUMP.rings, 0.5, 1.1);
  laptop(ctx, t);

  // A stone, the backpack set down in the grass beside it (leaning a little),
  // its scarf flying, and the bottle at its foot.
  shadow(ctx, 248, 217, 24, 0.3);
  solid(ctx, ROCK, ink(0.5));
  shadow(ctx, 186, 216, 52, 0.4);
  ctx.save();
  ctx.translate(186, 216);
  ctx.rotate(-0.07);
  ctx.scale(0.74, 0.74);
  ctx.translate(-175, -260);
  backpack(ctx);
  tail(ctx, t, 78, 19, 0, 0.12);
  tail(ctx, t, 54, 14, 1.4, 0.38);
  const knot = new Path2D();
  knot.arc(SCARF_KNOT[0], SCARF_KNOT[1], 4.6, 0, TAU);
  solid(ctx, knot, ink(0.85), 2);
  ctx.restore();
  shadow(ctx, 128, 224, 18, 0.35);
  ctx.save();
  ctx.translate(128, 224);
  ctx.rotate(0.06);
  ctx.scale(0.72, 0.72);
  ctx.translate(-88, -260);
  bottle(ctx);
  ctx.restore();

  // Grass in front of it all, so everything sits in the meadow.
  ctx.strokeStyle = ink(0.5);
  ctx.lineWidth = 1.3;
  ctx.stroke(FRONT_TUFTS);

  // The camp fades out at the edges, into the page.
  ctx.globalCompositeOperation = "destination-out";
  for (const [x0, x1] of [[0, 30], [400, 370]]) {
    const g = ctx.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, ink(1));
    g.addColorStop(1, ink(0));
    ctx.fillStyle = g;
    ctx.fillRect(Math.min(x0, x1), 0, 30, 300);
  }
  ctx.globalCompositeOperation = "source-over";
  ctx.restore();
}
