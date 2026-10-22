/**
 * Waterfall scene: the hiker stands at the foot of a waterfall, seen from
 * behind, in the same blue-ink line drawing as the hero. Everything here is
 * static geometry, computed once at build time (fixed seed); the loop (falling
 * water, boiling foam, spray, ripples, drifting clouds, his breathing) is
 * plain CSS in WaterfallScene.astro.
 *
 * Drawn far to near and every shape filled white, so a nearer shape hides
 * what is behind it: no line ever shows through another.
 */

import { cloudFrame, rng } from "~/lib/hero-scene";

export const VIEW = { w: 600, h: 680 } as const;
export const HIKER = { x: 330, y: 612, scale: 1.4 } as const;
/** Centre of the pool's ripples, under the foam. */
export const RIPPLE = { x: 300, y: 512 } as const;

type Pt = [number, number];

const rand = rng(7);
const n1 = (v: number) => Math.round(v * 10) / 10;

/** A hand-drawn line through points: each stretch split in a few, trembling slightly across. */
function rough(points: Pt[], amp = 0.9, close = false): string {
  let d = `M${n1(points[0][0])} ${n1(points[0][1])}`;
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1];
    const [bx, by] = points[i];
    const len = Math.hypot(bx - ax, by - ay) || 1;
    const steps = Math.max(1, Math.round(len / 14));
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const j = s === steps ? 0 : (rand() - 0.5) * 2 * amp;
      d += `L${n1(ax + (bx - ax) * t - ((by - ay) / len) * j)} ${n1(ay + (by - ay) * t + ((bx - ax) / len) * j)}`;
    }
  }
  return close ? `${d}Z` : d;
}

/** Short strokes, each from one point to another (a few trembling steps). */
const strokes = (segs: [number, number, number, number][]) => segs.map(([x1, y1, x2, y2]) => rough([[x1, y1], [x2, y2]], 0.6)).join("");

/** A rounded, scalloped puff (foam, bush): small arcs bulging out all round. */
function puff(cx: number, cy: number, r: number, squash = 0.78): string {
  const n = 7 + Math.floor(rand() * 3);
  const off = rand() * Math.PI * 2;
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = off + (i / n) * Math.PI * 2;
    const rr = r * (0.86 + rand() * 0.14);
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * squash]);
  }
  let d = `M${n1(pts[0][0])} ${n1(pts[0][1])}`;
  for (let i = 1; i <= n; i++) {
    const [px, py] = pts[i - 1];
    const [x, y] = pts[i % n];
    const rho = Math.hypot(x - px, y - py) * 0.62;
    d += `A${n1(rho)} ${n1(rho)} 0 0 1 ${n1(x)} ${n1(y)}`;
  }
  return `${d}Z`;
}

/** A tuft of grass: a fan of short curved blades. */
function tuft(x: number, y: number, s: number): string {
  let d = "";
  for (let i = 0; i < 5; i++) {
    const a = -1.1 + i * 0.55 + (rand() - 0.5) * 0.3;
    const l = (6 + rand() * 5) * s;
    d += `M${n1(x + (i - 2) * 1.3 * s)} ${n1(y)}q${n1(Math.sin(a) * l * 0.4)} ${n1(-l * 0.6)} ${n1(Math.sin(a) * l)} ${n1(-l)}`;
  }
  return d;
}

// ------------------------------------------------------------- far away

export const CLOUDS = [
  { x: 24, y: 38, len: 190, speed: 0, seed: 1 },
  { x: 330, y: 24, len: 220, speed: 0, seed: 2 },
  { x: 214, y: 70, len: 120, speed: 0, seed: 3 },
]
  .map(cloudFrame)
  .join("");

/** Distant peaks seen through the gorge, behind the river. */
const farPts: Pt[] = [
  [120, 168], [168, 140], [204, 150], [244, 118], [272, 132], [300, 108],
  [334, 130], [366, 116], [404, 146], [440, 132], [480, 160],
];
export const FAR = { fill: `${rough(farPts)}L480 240L120 240Z`, line: rough(farPts) };

/** The river coming from the distance to the lip of the fall. */
const LIP_L: Pt = [232, 190];
const LIP_R: Pt = [368, 186];
export const RIVER = {
  fill: `M${LIP_L.join(" ")}L278 152L322 150L${LIP_R.join(" ")}Z`,
  banks: rough([LIP_L, [278, 152]], 0.5) + rough([LIP_R, [322, 150]], 0.5),
  flow: "M262 177h22M296 168h16M306 180h24M290 159h10M318 161h8",
};

// ----------------------------------------------------------------- water

/** The falling sheet, between the two rock faces (they cover its edges). */
export const SHEET = `M${LIP_L.join(" ")}Q300 204 ${LIP_R.join(" ")}L384 500L218 500Z`;
/** The water bulging over the lip, and a few curls on it. */
export const LIP = "M232 190Q300 204 368 186M250 194q8 5 18 5M292 200q9 2 18 0M332 197q9 -1 16 -4";

export interface Streak {
  d: string;
  dash: string;
  dur: number;
  offset: number;
  width: number;
  opacity: number;
}

/** Falling streaks: dashed lines whose dashes run down (one CSS loop each). */
export const STREAKS: Streak[] = Array.from({ length: 18 }, (_, i) => {
  const u = (i + 0.5) / 18 + (rand() - 0.5) * 0.03;
  // On the lip's curve (a quadratic from LIP_L to LIP_R through (300, 204)).
  const x0 = LIP_L[0] + u * (LIP_R[0] - LIP_L[0]);
  const y0 = (1 - u) ** 2 * LIP_L[1] + 2 * u * (1 - u) * 204 + u ** 2 * LIP_R[1] + 1.5;
  const x1 = 220 + u * 162 + (rand() - 0.5) * 4;
  const y1 = 506; // under the foam
  const d = `M${n1(x0)} ${n1(y0)}C${n1(x0 + (u - 0.5) * 6)} ${n1(y0 + 50)} ${n1(x1 + (rand() - 0.5) * 4)} ${n1(y1 - 170)} ${n1(x1)} ${y1}`;
  // Every pattern adds up to a divisor of 100 (pathLength), so the loop is seamless.
  const dash = ["30 20", "14 11", "40 10", "8 12", "22 28"][Math.floor(rand() * 5)];
  const front = i % 2 === 0;
  return { d, dash, dur: n1(1.5 + rand() * 1.1), offset: Math.round(rand() * 100), width: front ? 1.1 : 0.8, opacity: front ? 0.9 : 0.55 };
});

/** Foam at the foot of the fall: puffs, back row first. */
export const FOAM: { d: string; delay: number }[] = [
  [218, 468, 20], [250, 462, 24], [284, 466, 22], [316, 460, 25], [350, 466, 22], [382, 470, 20],
  [206, 492, 24], [244, 490, 28], [290, 496, 30], [338, 490, 28], [378, 494, 25],
  [262, 516, 16], [318, 518, 18],
].map(([x, y, r]) => ({ d: puff(x, y, r), delay: -n1(rand() * 2.4) }));

/** Spray droplets above the foam. */
export const SPRAY = Array.from({ length: 14 }, () => ({
  x: n1(214 + rand() * 172),
  y: n1(436 + rand() * 26),
  r: n1(0.9 + rand() * 0.7),
  delay: -n1(rand() * 1.8),
}));

/** One ripple ring's front half; three of them spread out in turn. */
export const RIPPLE_PATH = `M${RIPPLE.x - 120} ${RIPPLE.y}A120 22 0 0 0 ${RIPPLE.x + 120} ${RIPPLE.y}`;

/** Calm water marks on the pool, and two rocks breaking its surface. */
export const POOL_MARKS = "M86 575h40M150 592h28M430 560h36M478 584h28M520 602h22M60 600h22";
export const POOL_ROCKS = {
  fill: "M124 590q4 -15 22 -15q19 0 25 15ZM456 573q3 -10 15 -10q12 0 16 10Z",
  marks: "M116 591h-10M176 591h12M452 574h-8M490 574h9M140 581l4 6",
};

// ----------------------------------------------------------------- rock

const leftCliff: Pt[] = [
  [-20, 98], [38, 92], [76, 104], [112, 97], [146, 116], [176, 130], [204, 158], LIP_L,
  [231, 236], [226, 290], [230, 342], [223, 400], [220, 470],
  [208, 496], [172, 516], [120, 534], [60, 546], [-20, 554],
];
const rightCliff: Pt[] = [
  [620, 72], [566, 76], [524, 66], [484, 86], [448, 104], [414, 134], [388, 160], LIP_R,
  [371, 234], [377, 292], [372, 346], [379, 404], [382, 470],
  [396, 494], [438, 512], [498, 524], [560, 530], [620, 534],
];

/** Outline y at screen x along a polyline (the first stretch that spans x). */
function yAt(points: Pt[], x: number): number {
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1];
    const [bx, by] = points[i];
    if ((x - ax) * (x - bx) <= 0 && ax !== bx) return ay + ((by - ay) * (x - ax)) / (bx - ax);
  }
  return points[0][1];
}

/**
 * Rock texture for one cliff: the corner where its front face turns into the
 * gorge, strata on that side wall (steep under the rim, flattening lower
 * down, as it recedes toward the fall), and on the front face joints
 * running down from the top with ledges between them, so the face reads as
 * stacked blocks. Every stroke starts or ends on another line.
 */
function rock(outline: Pt[], face: Pt[], corner: [Pt, Pt], cracks: number[], bankY: (x: number) => number): string {
  const [[cx0, cy0], [cx1, cy1]] = corner;
  const cornerX = (y: number) => cx0 + ((cx1 - cx0) * (y - cy0)) / (cy1 - cy0);
  // The rock face beside the fall, as x at a given y (strata stop just short of it).
  const side = Math.sign(face[0][0] - cx0);
  const faceX = (y: number) => {
    for (let i = 1; i < face.length; i++) {
      const [ax, ay] = face[i - 1];
      const [bx, by] = face[i];
      if (y >= ay && y <= by) return ax + ((bx - ax) * (y - ay)) / (by - ay) - side * 1.5;
    }
    return face[face.length - 1][0] - side * 1.5;
  };
  const rimSlope = (face[0][1] - cy0) / (face[0][0] - cx0); // the rim, down toward the lip
  const segs: [number, number, number, number][] = [];
  // Side wall strata.
  for (let y = cy0 + 26; y < cy1 - 30; y += 24 + rand() * 8) {
    const k = (y - cy0) / (cy1 - cy0);
    const x0 = cornerX(y);
    const slope = rimSlope * (1 - k);
    let x1 = faceX(y + slope * (face[0][0] - x0));
    x1 = faceX(y + slope * (x1 - x0));
    segs.push([x0, y, x1, y + slope * (x1 - x0)]);
  }
  // Front face: joints down from the top edge, ledges joining neighbours.
  const joints = cracks.map((x) => {
    const top = yAt(outline, x) + 2;
    const len = 70 + rand() * 260;
    return { x, top, bottom: Math.min(top + len, bankY(x) - 24) };
  });
  for (const j of joints) segs.push([j.x, j.top, j.x + (rand() - 0.5) * 6, j.bottom]);
  for (let i = 1; i < joints.length; i++) {
    const a = joints[i - 1];
    const b = joints[i];
    const lo = Math.max(a.top, b.top) + 30;
    const hi = Math.min(a.bottom, b.bottom) - 10;
    if (hi <= lo) continue;
    const y = lo + rand() * (hi - lo);
    segs.push([a.x, y, b.x, y + (rand() - 0.5) * 6]);
  }
  return rough([corner[0], corner[1]], 0.8) + strokes(segs);
}

export const CLIFFS = [
  {
    d: rough(leftCliff, 0.9, true),
    rock: rock(leftCliff, leftCliff.slice(7, 13), [[176, 130], [168, 517]], [22, 58, 96, 136], (x) => yAt(leftCliff.slice(13), x)),
  },
  {
    d: rough(rightCliff, 0.9, true),
    rock: rock(rightCliff, rightCliff.slice(7, 13), [[414, 134], [436, 513]], [586, 552, 516, 478], (x) => yAt(rightCliff.slice(13), x)),
  },
];

/** Bushes along the cliff tops. */
export const BUSHES = [
  [58, 90, 12], [82, 96, 10], [150, 112, 9], [500, 62, 12], [530, 66, 9], [452, 98, 9],
]
  .map(([x, y, r]) => puff(x, y, r, 0.7))
  .join("");

// ---------------------------------------------------------- foreground

/** The bank in front of the pool, with the flat boulder he stands on. */
const bank: Pt[] = [
  [-20, 640], [40, 634], [96, 640], [150, 650], [212, 646], [262, 634], [290, 618], [306, 612],
  [356, 610], [380, 616], [404, 630], [452, 640], [510, 634], [566, 642], [620, 646],
];
export const BANK = {
  d: `${rough(bank)}L620 700L-20 700Z`,
  marks: "M300 624l6 16M372 622l-4 14M286 632q6 -3 10 2M392 636q5 -3 9 1",
  tufts: [tuft(60, 637, 1.1), tuft(198, 648, 1), tuft(436, 637, 1.1), tuft(540, 639, 1.2), tuft(286, 626, 0.8)].join(""),
};
