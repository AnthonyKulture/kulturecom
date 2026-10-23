/**
 * The hiker's drawing and walk cycle, shared by the line drawing (Hiker.astro)
 * and the dot rendering (hero-halftone.ts), so both always show the same man.
 *
 * Figure units, feet at the origin, about 95 tall. Seen from behind: legs,
 * arms (a trekking pole in the right hand), jacket, head, then the backpack
 * with its rolled mat over it all. The dot rendering draws the legs and arms
 * jointed and tapered itself (drawHiker in halftone-ink.ts); the marks below
 * draw the still pose of the line drawing, and the body for both.
 */

export interface Mark {
  ink: "fill" | "line" | "tube";
  d: string;
  tone?: number; // dot density for the dot rendering (fills)
}

const disc = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`;

// Legs: thigh and calf taper to the knee and the ankle, feet almost under him.
export const LEG_L: Mark[] = [
  { ink: "fill", tone: 0.85, d: "M-10 -41C-10.2 -34 -9.4 -26 -8.4 -21C-8.8 -15 -7.4 -10 -6.6 -6L-2.4 -6C-2.4 -10 -2.2 -15 -2.6 -21C-2.2 -27 -1.6 -34 -1.2 -41Z" },
  { ink: "fill", tone: 0.92, d: "M-7.2 -7C-8 -4.4 -8.2 -1.8 -7.6 -0.4C-5.6 0.6 -2.6 0.6 -1.2 -0.4C-1 -2 -1.4 -4.6 -2 -7Z" },
];
export const LEG_R: Mark[] = [
  { ink: "fill", tone: 0.85, d: "M10 -41C10.2 -34 9.4 -26 8.4 -21C8.8 -15 7.4 -10 6.6 -6L2.4 -6C2.4 -10 2.2 -15 2.6 -21C2.2 -27 1.6 -34 1.2 -41Z" },
  { ink: "fill", tone: 0.92, d: "M7.2 -7C8 -4.4 8.2 -1.8 7.6 -0.4C5.6 0.6 2.6 0.6 1.2 -0.4C1 -2 1.4 -4.6 2 -7Z" },
];
export const ARM_L: Mark[] = [
  { ink: "tube", tone: 0.9, d: "M-10 -69C-14 -63 -15.2 -55 -14.6 -47" },
  { ink: "fill", tone: 0.9, d: disc(-14.6, -45.2, 2.3) },
];
export const ARM_R: Mark[] = [
  { ink: "line", tone: 0.95, d: "M14.8 -47.5L19.6 0.5" },
  { ink: "tube", tone: 0.9, d: "M10 -69C14 -63 15.2 -55 14.6 -47" },
  { ink: "fill", tone: 0.9, d: disc(14.6, -45.2, 2.3) },
];
export const BODY: Mark[] = [
  // Jacket.
  { ink: "fill", tone: 0.7, d: "M-11.4 -43C-12.4 -52 -12.2 -62 -10 -71C-6 -73.5 6 -73.5 10 -71C12.2 -62 12.4 -52 11.4 -43C4 -40.6 -4 -40.6 -11.4 -43Z" },
  // Head and ears, under his hiking hat (crown, band, wide brim).
  { ink: "fill", tone: 0.8, d: disc(0, -87.5, 6.2) },
  { ink: "line", d: "M-6.1 -87.2q-1.7 0.4 -0.5 2.7M6.1 -87.2q1.7 0.4 0.5 2.7" },
  { ink: "fill", tone: 0.66, d: "M-5.6 -91.4C-6.2 -100.4 6.2 -100.4 5.6 -91.4Z" },
  { ink: "line", d: "M-5.6 -93.2Q0 -92 5.6 -93.2" },
  { ink: "fill", tone: 0.66, d: "M-10.4 -91a10.4 2.4 0 1 0 20.8 0a10.4 2.4 0 1 0 -20.8 0Z" },
  // Backpack, rolled mat, bottle.
  { ink: "fill", tone: 1, d: "M-12.4 -47.5C-13.2 -56 -13.4 -68 -12 -76C-11.2 -80.5 -7 -82 0 -82C7 -82 11.2 -80.5 12 -76C13.4 -68 13.2 -56 12.4 -47.5C5 -45 -5 -45 -12.4 -47.5Z" },
  { ink: "fill", tone: 0.5, d: "M-11 -86.4h22a3.3 3.3 0 0 1 0 6.6h-22a3.3 3.3 0 0 1 0 -6.6Z" },
  { ink: "fill", tone: 0.8, d: "M12.4 -59.5h3.2v10.5q0 1.4 -1.4 1.4h-1.8Z" },
  // Straps, pocket, mat ties.
  { ink: "line", d: "M-6 -86.4v6.6M6 -86.4v6.6M-11.6 -73C-6 -76 6 -76 11.6 -73M-7.2 -62.4C-3 -63.6 3 -63.6 7.2 -62.4C7 -58 6.8 -55 6.2 -53.2C5.6 -51.6 4 -51.2 0 -51.2C-4 -51.2 -5.6 -51.6 -6.2 -53.2C-6.8 -55 -7 -58 -7.2 -62.4ZM-1.8 -63.2q1.8 3 3.6 0M-9.2 -80.2C-10.8 -78 -11.6 -75 -11.2 -71M9.2 -80.2C10.8 -78 11.6 -75 11.2 -71M-12.9 -60.5h-1.8" },
];

/** Where each limb turns: the top middle of its box. */
export const PIVOT = {
  legL: [-5.8, -41],
  legR: [5.8, -41],
  armL: [-12.4, -69],
  armR: [14.8, -69],
  sway: [1.4, -47],
} as const;

export interface Pose {
  bob: number; // px, up is negative
  swayX: number;
  swayDeg: number;
  legL: [number, number]; // scaleY, translateX
  legR: [number, number];
  armLDeg: number;
  armRDeg: number;
}

/** The walk cycle at `phase` (in cycles, 1.1 s each at walking pace);
 *  `amp` fades it out to a standing pose. */
export function gait(phase: number, amp: number): Pose {
  const a = phase * 2 * Math.PI;
  const lift = (f: number) => {
    const x = ((f % 1) + 1) % 1;
    return x < 0.55 ? Math.sin((Math.PI * x) / 0.55) * amp : 0;
  };
  const l = lift(phase);
  const r = lift(phase + 0.5);
  return {
    bob: -0.7 * amp * (1 - Math.cos(2 * a)),
    swayX: -0.9 * amp * Math.cos(a),
    swayDeg: -0.6 * amp * Math.cos(a),
    legL: [1 - 0.2 * l, 0.8 * l],
    legR: [1 - 0.2 * r, 0.8 * r],
    armLDeg: 6 * amp * Math.cos(a),
    armRDeg: -6 * amp * Math.cos(a),
  };
}
