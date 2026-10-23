/**
 * The water rising over the approach (WaterfallDots.astro), in the site's
 * dot language: a halftone screen of round dots that grow from nothing at the
 * water's edge until they run into each other and close (solid blue) a little
 * below it, dithered so the edge breaks up instead of drawing a line. The edge itself swells slowly, like a surface,
 * never like a drawn wave.
 *
 * Drawn in device pixels on its own canvas, over the section.
 */

// 4×4 Bayer thresholds, centred on 0, as in the dot screen (halftone.ts).
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16 - 0.5);

/**
 * Draw the water with its edge at `edge` (CSS px from the canvas top; the
 * edge swells around it), at time `t` (s). `cell` is the dot pitch and `band`
 * how deep the dots take to close up, both in CSS px; `px` is device pixels
 * per CSS px.
 */
export function drawFlood(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  edge: number,
  t: number,
  cell: number,
  band: number,
  px: number,
): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, w * px, h * px);
  const c = Math.max(2, Math.round(cell * px)); // device px, whole
  const cols = Math.ceil((w * px) / c);
  // The surface: two slow swells running past each other.
  const surface = (x: number): number =>
    edge + 16 * Math.sin(x * 0.0038 + t * 0.55) + 9 * Math.sin(x * 0.0105 - t * 0.8);
  const top = Math.max(0, Math.floor(((edge - 26 - band * 0.2) * px) / c));
  const solid = Math.ceil(((edge + 26 + band) * px) / c); // first row closed everywhere
  const dots = new Path2D();
  for (let j = top; j < Math.min(solid, Math.ceil((h * px) / c)); j++) {
    const y = (j + 0.5) * (c / px);
    for (let i = 0; i < cols; i++) {
      const depth = y - surface((i + 0.5) * (c / px));
      if (depth < -band * 0.2) continue;
      // Dithered, and closed for good by the band's foot.
      const k = (depth / band) * 1.25 + BAYER[(j & 3) * 4 + (i & 3)] * 0.4;
      if (k <= 0.04) continue;
      // Round dots, grown from the cell's centre: past half the pitch they
      // overlap, leaving shrinking holes; past √½ of it, the cell is closed.
      if (k >= 1) {
        dots.rect(i * c, j * c, c, c);
        continue;
      }
      const rad = c * 0.72 * Math.sqrt(k);
      const cx = (i + 0.5) * c;
      const cy = (j + 0.5) * c;
      dots.moveTo(cx + rad, cy);
      dots.arc(cx, cy, rad, 0, Math.PI * 2);
    }
  }
  ctx.fill(dots);
  if (solid * c < h * px) ctx.fillRect(0, solid * c, w * px, h * px - solid * c);
}
