/**
 * The camera of the scroll sequences (HeroDots.astro, WaterfallDots.astro):
 * each one pins its section while the page scrolls, and films its dot scene
 * through a camera that frames the scene in a box and dollies in or out
 * around one point (the hiker's backpack).
 *
 * Boxes and points are in CSS px relative to the canvas; the tone canvas is
 * `px` tone pixels per CSS px (see runDots).
 */

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Smoothstep of `v` between `a` and `b`. */
export const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const lerpBox = (a: Box, b: Box, t: number): Box => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  w: lerp(a.w, b.w, t),
  h: lerp(a.h, b.h, t),
});

/** `el`'s box relative to `root`. */
export function boxIn(el: Element, root: DOMRect): Box {
  const r = el.getBoundingClientRect();
  return { x: r.left - root.left, y: r.top - root.top, w: r.width, h: r.height };
}

/** The part of the screen `root` is under (all of the screen, in its terms). */
export function screenIn(root: DOMRect): Box {
  return { x: -root.left, y: -root.top, w: window.innerWidth, h: window.innerHeight };
}

/** How far the page has scrolled through a sequence: 0 when its section
 *  sticks to the top, 1 when it has used up its `spacer` and lets go. */
export function seqProgress(wrap: Element, spacer: HTMLElement): number {
  return clamp01(-wrap.getBoundingClientRect().top / Math.max(1, spacer.offsetHeight));
}

/**
 * Set the tone context to film a `view` (w×h units) framed like "slice" in
 * `box`, zoomed `zoom`× about `focus` (view units). `centre` (0..1) moves the
 * focus from where the framing puts it to the middle of `screen`.
 */
export function film(
  ctx: CanvasRenderingContext2D,
  view: { w: number; h: number },
  box: Box,
  zoom: number,
  focus: { x: number; y: number },
  centre: number,
  screen: Box,
  px: number,
): void {
  const s = Math.max(box.w / view.w, box.h / view.h);
  const ox = box.x + (box.w - view.w * s) / 2;
  const oy = box.y + (box.h - view.h * s) / 2;
  const fx = lerp(ox + focus.x * s, screen.x + screen.w / 2, centre);
  const fy = lerp(oy + focus.y * s, screen.y + screen.h / 2, centre);
  const k = s * zoom;
  ctx.setTransform(k * px, 0, 0, k * px, (fx - focus.x * k) * px, (fy - focus.y * k) * px);
}

/**
 * Keep only what is inside `box`: clear the tones outside it, and fade them
 * out near its edges over the given fractions of its size (left, top,
 * bottom), so the scene melts into the page there.
 */
export function frame(
  ctx: CanvasRenderingContext2D,
  box: Box,
  fade: { left: number; top: number; bottom: number },
  px: number,
  cols: number,
  rows: number,
): void {
  const x = box.x * px;
  const y = box.y * px;
  const w = box.w * px;
  const h = box.h * px;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "destination-out";
  const outside = new Path2D();
  outside.rect(-1, -1, cols + 2, rows + 2);
  outside.rect(x, y, w, h);
  ctx.fillStyle = "#000";
  ctx.fill(outside, "evenodd");
  const edge = (x0: number, y0: number, x1: number, y1: number, rx: number, ry: number, rw: number, rh: number) => {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, "#000");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(rx, ry, rw, rh);
  };
  if (fade.left > 0) edge(x, 0, x + w * fade.left, 0, x, y, w * fade.left, h);
  if (fade.top > 0) edge(0, y, 0, y + h * fade.top, x, y, w, h * fade.top);
  if (fade.bottom > 0) edge(0, y + h, 0, y + h * (1 - fade.bottom), x, y + h * (1 - fade.bottom), w, h * fade.bottom);
  ctx.restore();
}

/**
 * Ease `value` toward `target` over a frame `dt` s long: a light spring
 * (`tau` s), but never faster than `rate` units a second, so a sequence takes
 * its time however fast the page is scrolled. Lands exactly on the target
 * once within `eps`.
 */
export function follow(value: number, target: number, dt: number, tau: number, rate: number, eps = 1e-4): number {
  if (!dt) return target;
  const cap = rate * dt;
  const step = Math.max(-cap, Math.min(cap, (target - value) * (1 - Math.exp(-dt / tau))));
  const next = value + step;
  return Math.abs(target - next) < eps ? target : next;
}

/**
 * Keeps a pinned stage on screen while its sequence is still catching up
 * with the scroll: if the page has already scrolled past its pin (or back
 * above it), the stage is fixed at the top of the screen (its place in the
 * page kept by padding on its wrapper, so nothing below moves) until the
 * sequence is done, then let go with a short slide. Fixed rather than
 * shifted against the scroll, so it never trembles while the page moves.
 * Past `limit` (a screen and a half) it gives up: `update` returns true and
 * the caller should jump to the end.
 */
export class Hold {
  private fixed = false;
  private offset = 0; // the let-go slide, px

  constructor(
    private stage: HTMLElement,
    private wrap: HTMLElement,
  ) {}

  /** Where the stage's top would be without the hold (px from the screen's
   *  top): pinned at 0 while its wrapper allows, above or below otherwise. */
  natural(): number {
    const r = this.wrap.getBoundingClientRect();
    return Math.min(Math.max(r.top, 0), r.bottom - this.stage.offsetHeight);
  }

  /** `down`: still playing forward; `up`: still playing back. */
  update(dt: number, down: boolean, up: boolean): boolean {
    const natural = this.natural();
    const want = (natural < -0.5 && down) || (natural > 0.5 && up);
    const over = want && Math.abs(natural) > window.innerHeight * 1.5;
    if (want && !over) {
      if (!this.fixed) this.fix(true);
      this.offset = 0;
      this.stage.style.translate = "";
      return false;
    }
    if (this.fixed) {
      // Let go from where it is shown, the top of the screen.
      this.fix(false);
      this.offset = over ? 0 : -natural;
    }
    this.offset = Math.abs(this.offset) < 0.5 ? 0 : this.offset * Math.exp(-dt / 0.16);
    this.stage.style.translate = this.offset ? `0 ${this.offset.toFixed(1)}px` : "";
    return over;
  }

  private fix(on: boolean): void {
    this.fixed = on;
    const s = this.stage.style;
    this.wrap.style.paddingTop = on ? `${this.stage.offsetHeight}px` : "";
    s.position = on ? "fixed" : "";
    s.top = on ? "0" : "";
    s.left = on ? "0" : "";
    s.right = on ? "0" : "";
  }

  /** Shifted at all (held, or being let go). */
  active(): boolean {
    return this.fixed || this.offset !== 0;
  }

  /** Held at the top while playing back (above its pin). */
  holdingUp(): boolean {
    return this.fixed && this.natural() > 0;
  }
}
