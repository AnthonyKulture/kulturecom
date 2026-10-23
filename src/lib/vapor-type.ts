// Vapor type — text that condenses out of a particle cloud, and breaks back
// into vapor around the pointer (native take on React Bits' Vapor Type).
//
// The element's real text stays in the DOM (SEO, selection, screen readers);
// it is only made transparent and painted on a canvas overlay instead. Each
// glyph is drawn at the exact spot the browser laid it out (one Range rect per
// character), so wrapping, tracking and font fallback all match the page.
//
// One model drives both effects: every particle owns a cell of the solid text
// and a displacement d ∈ [0, 1]. At d = 0 the cell shows as solid text; above
// that, the cell is cut out of the solid layer and the particle drifts up and
// away, fading into the vapor color.

const SWEEP = 1.0; // s — left-to-right condense sweep
const STAGGER = 0.5; // s — random extra delay per particle
const CONDENSE = 1.4; // s — one particle's trip home
const RECOVERY = 1.2; // s — hover vapor settling back
const RADIUS = 0.45; // em — pointer breath radius
const HOVER_MAX = 0.75; // max displacement under the pointer
const BUCKETS = 8; // color/alpha steps (keeps fillStyle changes low)
const SWAP_OUT = 0.7; // s — a swapped word breaking into vapor
const SWAP_IN = 0.9; // s — one particle's trip home in a swapped word

interface Particle {
  hx: number; // home cell, device px
  hy: number;
  ox: number; // drift at full displacement
  oy: number;
  delay: number;
  phase: number;
  cd: number; // condense displacement
  hd: number; // hover displacement
  in?: { at: number; dur: number }; // condensing back home (ms, s)
  out?: number; // breaking into vapor since (ms)
}

const rgb = (color: string): [number, number, number] => {
  const c = document.createElement("canvas").getContext("2d")!;
  c.fillStyle = color;
  c.fillRect(0, 0, 1, 1);
  const [r, g, b] = c.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
};

export function vaporType(el: HTMLElement, vaporColor: string) {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:absolute;pointer-events:none;";
  el.style.position = "relative";
  el.append(canvas);
  const ctx = canvas.getContext("2d")!;
  const solid = document.createElement("canvas");
  const sctx = solid.getContext("2d", { willReadFrequently: true })!;

  const ink = rgb(getComputedStyle(el).color);
  // Each element's own color, read before the text is hidden: a word set in
  // another color (the hero's accent word) keeps it on the canvas.
  const colors = new Map<Element, string>();
  for (const node of [el, ...el.querySelectorAll("*")]) colors.set(node, getComputedStyle(node).color);
  const vapor = rgb(vaporColor);
  const palette = Array.from({ length: BUCKETS }, (_, i) => {
    const d = (i + 0.5) / BUCKETS;
    // Particles turn vapor-colored quickly, so the cloud reads as color.
    const mix = (k: number) => Math.round(ink[k] + (vapor[k] - ink[k]) * Math.min(1, d * 2.5));
    return `rgba(${mix(0)},${mix(1)},${mix(2)},${(1 - d * d).toFixed(3)})`;
  });
  for (const node of colors.keys()) (node as HTMLElement).style.color = "transparent";

  let particles: Particle[] = [];
  let step = 2;
  let em = 100;
  let pad = 0;
  let started = false;
  let startTime = 0;
  let condensing = false;
  let pointer: { x: number; y: number } | null = null;
  let reach = 1; // breath radius factor (wider for a finger than a cursor)
  let raf = 0;
  let last = 0;

  const build = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const box = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    em = parseFloat(cs.fontSize) * dpr;
    pad = Math.round(em * 0.8); // room for vapor to drift outside the text box
    const w = Math.ceil(box.width * dpr) + pad * 2;
    const h = Math.ceil(box.height * dpr) + pad * 2;
    for (const c of [canvas, solid]) {
      c.width = w;
      c.height = h;
    }
    Object.assign(canvas.style, {
      left: `${-pad / dpr}px`,
      top: `${-pad / dpr}px`,
      width: `${w / dpr}px`,
      height: `${h / dpr}px`,
    });

    // Solid layer: every character where the browser put it.
    sctx.clearRect(0, 0, w, h);
    sctx.font = `${cs.fontStyle} ${cs.fontWeight} ${em}px ${cs.fontFamily}`;
    const ascent = sctx.measureText("A").fontBoundingBoxAscent;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent ?? "";
      sctx.fillStyle = colors.get(node.parentElement!) ?? `rgb(${ink.join(",")})`;
      for (let i = 0; i < text.length; i++) {
        if (!text[i].trim()) continue;
        range.setStart(node, i);
        range.setEnd(node, i + 1);
        const r = range.getClientRects()[0];
        if (!r) continue;
        sctx.fillText(text[i], (r.left - box.left) * dpr + pad, (r.top - box.top) * dpr + pad + ascent);
      }
    }

    // One particle per cell that holds any ink.
    step = Math.max(2, Math.round(em / 90));
    const data = sctx.getImageData(0, 0, w, h).data;
    const textW = box.width * dpr;
    const next: Particle[] = [];
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        // Any inked pixel claims the cell, so antialiased glyph edges get a
        // particle too — otherwise they'd stay behind as an outline on hover.
        let inked = false;
        for (let yy = y; yy < Math.min(y + step, h) && !inked; yy++) {
          for (let xx = x; xx < Math.min(x + step, w); xx++) {
            if (data[(yy * w + xx) * 4 + 3] > 0) {
              inked = true;
              break;
            }
          }
        }
        if (!inked) continue;
        const delay = ((x - pad) / textW) * SWEEP + Math.random() * STAGGER;
        next.push({
          hx: x,
          hy: y,
          ox: (0.05 + Math.random() * 0.5) * em,
          oy: -(0.1 + Math.random() * 0.55) * em,
          delay,
          phase: Math.random() * Math.PI * 2,
          cd: condensing || !started ? 1 : 0,
          hd: 0,
          in: condensing ? { at: startTime + delay * 1000, dur: CONDENSE } : undefined,
        });
      }
    }
    particles = next;
    draw(performance.now());
  };

  const draw = (now: number) => {
    const t = now / 1000;
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    const elapsed = (now - startTime) / 1000;
    const r = RADIUS * em * reach;
    let moving = false;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (started) ctx.drawImage(solid, 0, 0);
    const buckets: Particle[][] = Array.from({ length: BUCKETS }, () => []);

    for (const p of particles) {
      if (p.in) {
        const k = Math.min(1, Math.max(0, (now - p.in.at) / 1000 / p.in.dur));
        p.cd = (1 - k) ** 3; // ease-out cubic
        if (k >= 1) p.in = undefined;
        else moving = true;
      } else if (p.out !== undefined) {
        const k = Math.min(1, Math.max(0, (now - p.out) / 1000 / SWAP_OUT));
        p.cd = k * k; // ease-in
        if (k < 1) moving = true;
      }
      let target = 0;
      if (pointer) {
        const dist = Math.hypot(p.hx - pointer.x, p.hy - pointer.y);
        if (dist < r) target = HOVER_MAX * (1 - dist / r) ** 0.7;
      }
      p.hd = target > p.hd ? p.hd + (target - p.hd) * 0.25 : Math.max(target, p.hd - dt / RECOVERY);
      if (p.hd > 0) moving = true;

      const d = Math.max(p.cd, p.hd);
      if (!(d >= 0.002)) continue; // also skips a NaN, rather than crash the loop
      ctx.clearRect(p.hx, p.hy, step, step);
      buckets[Math.min(BUCKETS - 1, Math.floor(d * BUCKETS))].push(p);
    }

    const size = step * 0.85;
    const wobble = em * 0.06;
    buckets.forEach((list, i) => {
      if (!list.length) return;
      ctx.fillStyle = palette[i];
      for (const p of list) {
        const d = Math.max(p.cd, p.hd);
        const x = p.hx + p.ox * d + Math.sin(t * 2 + p.phase) * wobble * d;
        const y = p.hy + p.oy * d + Math.cos(t * 1.7 + p.phase) * wobble * d;
        ctx.fillRect(x, y, size, size);
      }
    });

    if (condensing && elapsed > SWEEP + STAGGER + CONDENSE) condensing = false;
    return condensing || moving || pointer !== null;
  };

  const loop = (now: number) => {
    raf = draw(now) ? requestAnimationFrame(loop) : 0;
  };
  const wake = () => {
    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }
  };

  const aim = (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    const k = canvas.width / rect.width;
    pointer = { x: (e.clientX - rect.left) * k, y: (e.clientY - rect.top) * k };
    wake();
  };
  el.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    reach = 1;
    aim(e);
  });
  // Touch: a tap breathes on the letters under the finger, then they settle.
  let tapTimer = 0;
  el.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse") return;
    reach = 2.6;
    aim(e);
    clearTimeout(tapTimer);
    tapTimer = window.setTimeout(() => (pointer = null), 650);
  });
  // Mouse only: a finger "leaves" right after every tap, which would cut the
  // breath short (the tap timer clears it instead).
  el.addEventListener("pointerleave", (e) => {
    if (e.pointerType === "mouse") pointer = null;
  });

  let resizeTimer = 0;
  new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(build, 150);
  }).observe(el);

  const ready = document.fonts.ready.then(build);

  return {
    // Condense the text in. Safe to call before fonts are ready.
    start() {
      ready.then(() => {
        if (started) return;
        started = condensing = true;
        startTime = performance.now();
        for (const p of particles) p.in = { at: startTime + p.delay * 1000, dur: CONDENSE };
        wake();
      });
    },
    // Swap the text of `word` (an element inside the vapor text): the cells
    // of `zone` (the word, or a box around it that also holds what moves with
    // it) break into vapor, then the new text condenses in their place.
    // Resolves once it has settled. The layout around the word must not move.
    swap(word: HTMLElement, text: string, zone: HTMLElement = word): Promise<void> {
      const inZone = () => {
        const box = canvas.getBoundingClientRect();
        const z = zone.getBoundingClientRect();
        const k = canvas.width / box.width;
        const m = em * 0.15;
        const x0 = (z.left - box.left) * k - m;
        const x1 = (z.right - box.left) * k + m;
        const y0 = (z.top - box.top) * k - m;
        const y1 = (z.bottom - box.top) * k + m;
        return { x0, x1, has: (p: Particle) => p.hx >= x0 && p.hx <= x1 && p.hy >= y0 && p.hy <= y1 };
      };
      return ready.then(
        () =>
          new Promise<void>((done) => {
            const before = inZone();
            const t = performance.now();
            for (const p of particles) {
              if (before.has(p)) p.out = t + ((p.hx - before.x0) / (before.x1 - before.x0)) * 250 + Math.random() * 150;
            }
            wake();
            window.setTimeout(() => {
              word.textContent = text;
              build();
              const after = inZone();
              const t2 = performance.now();
              for (const p of particles) {
                if (!after.has(p)) continue;
                p.cd = 1;
                p.in = { at: t2 + ((p.hx - after.x0) / (after.x1 - after.x0)) * 300 + Math.random() * 200, dur: SWAP_IN };
              }
              wake();
              window.setTimeout(done, 500 + SWAP_IN * 1000);
            }, 400 + SWAP_OUT * 1000);
          }),
      );
    },
  };
}
