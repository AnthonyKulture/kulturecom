/**
 * Dot screen: turns a tone map (one pixel per cell, density in the alpha
 * channel) into square dots on a fixed grid. Each dot's strength follows the
 * tone, in a few steps dithered against each other (ordered 4×4), so light
 * areas get faint dots and dark ones strong dots. The grid never moves, so
 * shapes moving through it make dots come and go.
 *
 * The dots are written straight into a small image, two pixels per cell (the
 * dot in one corner, the gap in the other three), which is then drawn onto
 * the canvas enlarged without smoothing: one image to put on screen per
 * frame, however many dots. (Pattern or path fills of a screen full of dots
 * were far too slow in Safari.)
 */

const LEVELS = 10;
// 4×4 Bayer thresholds, centred on 0.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16 - 0.5);

/** Any CSS colour as [r, g, b]. */
function rgb(color: string): [number, number, number] {
  const c = document.createElement("canvas").getContext("2d")!;
  c.fillStyle = color;
  c.fillRect(0, 0, 1, 1);
  const [r, g, b] = c.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}

interface Cells {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Run a dot drawing on `canvas`: one tone pixel per dot, `cellCss` CSS px
 * apart, with the view box covering the frame (like "slice"). `paint` draws
 * the tones (in view-box units) for a frame `dt` seconds after the last; it
 * runs every frame while the canvas is on screen, or once (dt 0) when `still`.
 * A paint that frames its own camera can use `px`, the tone pixels per CSS px.
 * It may return `false` to skip the frame (nothing of it is seen), or the
 * part of the tone canvas that holds anything (in tone pixels), so only that
 * part is turned into dots. If drawing gets slow (a slow device or browser),
 * the dots grow a step coarser, up to twice their size.
 */
export function runDots(
  canvas: HTMLCanvasElement,
  view: { w: number; h: number },
  paint: (
    tone: CanvasRenderingContext2D,
    cols: number,
    rows: number,
    dt: number,
    px: number,
  ) => void | false | { x: number; y: number; w: number; h: number },
  still: boolean,
  cellCss = 2,
): void {
  const out = canvas.getContext("2d")!;
  const tone = document.createElement("canvas");
  const tctx = tone.getContext("2d", { willReadFrequently: true })!;
  const dots = document.createElement("canvas"); // two pixels per cell
  const dctx = dots.getContext("2d")!;
  // Each strength of dot, as one RGBA pixel (little-endian word).
  const [r, g, b] = rgb(getComputedStyle(canvas).color);
  const ink = Array.from({ length: LEVELS }, (_, lv) => ((Math.round(((lv + 1) / LEVELS) * 255) << 24) | (b << 16) | (g << 8) | r) >>> 0);
  let cell = 2; // device px, even (two dot pixels per cell)
  let cols = 0;
  let rows = 0;
  let image: ImageData | null = null;
  let pixels = new Uint32Array(0);
  let shown: Cells = { x: 0, y: 0, w: 0, h: 0 }; // cells holding dots now

  /** Turn the tone of `part` into dots, clearing what was shown before. */
  const screen = (part: Cells): void => {
    if (!image) return;
    const w2 = cols * 2;
    // Clear the dots shown last time.
    for (let y = shown.y; y < shown.y + shown.h; y++) {
      for (let x = shown.x; x < shown.x + shown.w; x++) pixels[y * 2 * w2 + x * 2] = 0;
    }
    if (part.w > 0 && part.h > 0) {
      const data = tctx.getImageData(part.x, part.y, part.w, part.h).data;
      for (let y = 0; y < part.h; y++) {
        const row = ((part.y + y) & 3) * 4;
        const base = (part.y + y) * 2 * w2 + part.x * 2;
        for (let x = 0; x < part.w; x++) {
          const a = data[(y * part.w + x) * 4 + 3] / 255;
          if (a < 0.03) continue;
          const lv = Math.min(LEVELS - 1, Math.floor(a * LEVELS + BAYER[row + ((part.x + x) & 3)]));
          if (lv >= 0) pixels[base + x * 2] = ink[lv];
        }
      }
    }
    // Put on screen only what changed: last time's cells and this time's.
    const both = [shown, part].filter((c) => c.w > 0 && c.h > 0);
    shown = part;
    if (!both.length) return;
    const x0 = Math.min(...both.map((c) => c.x));
    const y0 = Math.min(...both.map((c) => c.y));
    const x1 = Math.max(...both.map((c) => c.x + c.w));
    const y1 = Math.max(...both.map((c) => c.y + c.h));
    dctx.putImageData(image, 0, 0, x0 * 2, y0 * 2, (x1 - x0) * 2, (y1 - y0) * 2);
    out.imageSmoothingEnabled = false;
    out.clearRect(x0 * cell, y0 * cell, (x1 - x0) * cell, (y1 - y0) * cell);
    out.drawImage(dots, x0 * 2, y0 * 2, (x1 - x0) * 2, (y1 - y0) * 2, x0 * cell, y0 * cell, (x1 - x0) * cell, (y1 - y0) * cell);
  };

  const coarsest = cellCss * 2;
  let cost = 0; // ms per frame, smoothed
  let frames = 0;
  const draw = (dt: number): void => {
    if (!cols || !rows) return;
    const t0 = performance.now();
    const part = paint(tctx, cols, rows, dt, Math.min(window.devicePixelRatio || 1, 2) / cell);
    if (part === false) return;
    const x = part ? Math.max(0, Math.floor(part.x)) : 0;
    const y = part ? Math.max(0, Math.floor(part.y)) : 0;
    const w = part ? Math.max(0, Math.min(cols, Math.ceil(part.x + part.w)) - x) : cols;
    const h = part ? Math.max(0, Math.min(rows, Math.ceil(part.y + part.h)) - y) : rows;
    screen({ x, y, w, h });
    // Too slow here: coarser dots (fewer of them), a step at a time.
    cost = cost * 0.9 + (performance.now() - t0) * 0.1;
    if (dt && ++frames > 40 && cost > 11 && cellCss < coarsest) {
      cellCss = Math.min(coarsest, cellCss * 1.25);
      frames = 0;
      cost = 0;
      fit();
    }
  };
  const fit = (): void => {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cell = Math.max(2, 2 * Math.round((cellCss * dpr) / 2));
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    cols = Math.ceil(canvas.width / cell);
    rows = Math.ceil(canvas.height / cell);
    tone.width = cols;
    tone.height = rows;
    dots.width = cols * 2;
    dots.height = rows * 2;
    image = cols && rows ? dctx.createImageData(cols * 2, rows * 2) : null;
    pixels = image ? new Uint32Array(image.data.buffer) : new Uint32Array(0);
    shown = { x: 0, y: 0, w: 0, h: 0 };
    const k = (Math.max(rect.width / view.w, rect.height / view.h) * dpr) / cell;
    tctx.setTransform(k, 0, 0, k, (canvas.width / cell - view.w * k) / 2, (canvas.height / cell - view.h * k) / 2);
    draw(0);
  };
  new ResizeObserver(fit).observe(canvas);
  if (still) return;

  let raf = 0;
  let last = 0;
  let onScreen = true;
  const frame = (now: number): void => {
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    raf = requestAnimationFrame(frame); // first, so one failed frame can't stop the loop
    draw(dt);
  };
  const run = (): void => {
    if (raf || !onScreen || document.hidden) return;
    last = 0;
    raf = requestAnimationFrame(frame);
  };
  const stop = (): void => {
    cancelAnimationFrame(raf);
    raf = 0;
  };
  new IntersectionObserver(([e]) => {
    onScreen = e.isIntersecting;
    if (onScreen) run();
    else stop();
  }).observe(canvas);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : run()));
  run();
}
