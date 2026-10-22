/**
 * Blueprint entry animation (home and About pages, on every load), in the spirit of a
 * design tool drawing the page before it exists: a blue grid, guide lines,
 * hatched boxes labelled like layers (LOGO, NAV, H1, COPY, CARD 01…) placed
 * exactly over the real elements, with their pixel dimensions. At the end
 * only the blue goes: every line and label stays, turned ink on the white
 * page, then the real hero rises in where each frame was.
 *
 * The decision to play is made before first paint by an inline script in
 * IntroBlueprint.astro (adds `html.intro-on`). CSS failsafes hide the overlay
 * and show the content after a few seconds even if this module never runs.
 */

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

type Box = { el: HTMLElement; label: string; rect: DOMRect };

const div = (cls: string, parent: HTMLElement, style: Partial<CSSStyleDeclaration> = {}): HTMLDivElement => {
  const d = document.createElement("div");
  d.className = cls;
  Object.assign(d.style, style);
  parent.appendChild(d);
  return d;
};

const px = (n: number): string => `${Math.round(n)}px`;

export function runIntro(): void {
  const root = document.documentElement;
  const overlay = document.querySelector<HTMLElement>("[data-intro]");
  const layer = overlay?.querySelector<HTMLElement>("[data-intro-layer]");
  if (!overlay || !layer || !root.classList.contains("intro-on")) return;

  let finished = false;
  const animations: Animation[] = [];
  const anim = (el: Element, frames: Keyframe[], opts: KeyframeAnimationOptions): Animation => {
    const a = el.animate(frames, { fill: "both", ...opts });
    animations.push(a);
    return a;
  };

  const finish = (fast = false): void => {
    if (finished) return;
    finished = true;
    ["pointerdown", "keydown", "wheel", "touchstart"].forEach((e) => window.removeEventListener(e, skip));
    // 1. Only the blue goes: lines and labels stay, turning ink on white.
    if (fast) overlay.style.transition = "none";
    overlay.classList.add("intro--paper");
    // 2. Then the real hero rises in where each frame was, while the drawing fades.
    window.setTimeout(
      () => {
        root.classList.add("intro-reveal");
        const fade = anim(overlay, [{ opacity: 1 }, { opacity: 0 }], {
          duration: fast ? 260 : 750,
          easing: EASE,
        });
        fade.finished.then(() => {
          overlay.remove();
          // Let the reveal cascade finish before dropping the hidden-state hooks.
          window.setTimeout(() => root.classList.remove("intro-on", "intro-reveal"), 1200);
        });
      },
      fast ? 0 : 1100,
    );
  };

  const skip = (): void => {
    animations.forEach((a) => a.finish());
    finish(true);
  };
  ["pointerdown", "keydown", "wheel", "touchstart"].forEach((e) =>
    window.addEventListener(e, skip, { once: true, passive: true }),
  );

  // Page restored mid-scroll: boxes would not line up, skip straight in.
  if (window.scrollY > 40) {
    finish(true);
    return;
  }

  const fontsReady = Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((r) => setTimeout(r, 500))]);
  fontsReady.then(() => requestAnimationFrame(() => (finished ? null : build())));

  function build(): void {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const grid = overlay!.querySelector(".intro-grid")!;
    anim(grid, [{ opacity: 0 }, { opacity: 1 }], { duration: 380, easing: EASE });

    // Guides: the content column (left/right edges) and the nav baseline.
    const container = document.querySelector<HTMLElement>("[data-intro-hero] > div")?.getBoundingClientRect();
    const nav = document.querySelector<HTMLElement>("[data-nav-smart] nav")?.getBoundingClientRect();
    if (container) {
      for (const x of [container.left, container.right]) {
        const g = div("ib-guide ib-guide--v", layer!, { left: px(x), top: "0", height: px(H) });
        anim(g, [{ transform: "scaleY(0)" }, { transform: "scaleY(1)" }], { duration: 650, delay: 90, easing: EASE });
      }
      // Hatched margins outside the column.
      const m1 = div("ib-margin", layer!, { left: "0", top: "0", width: px(container.left), height: px(H) });
      const m2 = div("ib-margin", layer!, { left: px(container.right), top: "0", width: px(W - container.right), height: px(H) });
      [m1, m2].forEach((m) => anim(m, [{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: 260 }));
      // Column width, measured along the top.
      const dim = div("ib-measure", layer!, { left: px(container.left), top: px(10), width: px(container.width) });
      dim.innerHTML = `<span class="ib-dim">${Math.round(container.width)}</span>`;
      anim(dim, [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: 700, delay: 220, easing: EASE });
    }
    if (nav) {
      const g = div("ib-guide ib-guide--h", layer!, { left: "0", top: px(nav.bottom), width: px(W) });
      anim(g, [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: 700, delay: 160, easing: EASE });
    }

    // Layer boxes over the real elements.
    // Text blocks are measured on their text (a Range), not on the block box,
    // so the frame hugs the real line lengths.
    const textRect = (el: HTMLElement): DOMRect => {
      let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const range = document.createRange();
      while (walker.nextNode()) {
        if (!walker.currentNode.textContent?.trim()) continue;
        range.selectNodeContents(walker.currentNode);
        for (const q of range.getClientRects()) {
          l = Math.min(l, q.left); t = Math.min(t, q.top); r = Math.max(r, q.right); b = Math.max(b, q.bottom);
        }
      }
      return r > l ? new DOMRect(l, t, r - l, b - t) : el.getBoundingClientRect();
    };
    // Tilted elements (polaroids): their own size around the centre of their
    // bounding box, drawn with the same rotation.
    const tiltedRect = (el: HTMLElement): DOMRect => {
      const bb = el.getBoundingClientRect();
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      return new DOMRect(bb.left + bb.width / 2 - w / 2, bb.top + bb.height / 2 - h / 2, w, h);
    };
    const boxes: Box[] = [...document.querySelectorAll<HTMLElement>("[data-intro-box]")]
      .map((el) => {
        const label = el.dataset.introBox!;
        const rect =
          el.dataset.introText !== undefined ? textRect(el) : el.dataset.introRotate ? tiltedRect(el) : el.getBoundingClientRect();
        return { el, label, rect };
      })
      .filter(
        (b) =>
          b.rect.width > 0 &&
          b.rect.height > 0 &&
          b.rect.top < H &&
          b.rect.bottom > 0 &&
          // Laid out but hidden (visibility: hidden) gets no frame.
          getComputedStyle(b.el).visibility !== "hidden",
      );

    boxes.forEach((b, i) => {
      const r = b.rect;
      const delay = 360 + i * 85;
      const rot = parseFloat(b.el.dataset.introRotate ?? "0");
      const box = div("ib-box", layer!, {
        left: px(r.left),
        top: px(r.top),
        width: px(r.width),
        height: px(r.height),
        transform: rot ? `rotate(${rot}deg)` : "",
      });
      const fill = div("ib-fill", box);
      const isTitle = b.label === "H1";
      // The title "resizes" like a frame being dragged: 60 % first, then full.
      anim(
        fill,
        isTitle
          ? [{ transform: "scaleX(0)" }, { transform: "scaleX(0.6)", offset: 0.4 }, { transform: "scaleX(0.6)", offset: 0.62 }, { transform: "scaleX(1)" }]
          : [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }],
        { duration: isTitle ? 1250 : 520, delay, easing: EASE },
      );

      // Image plate (cross) where the element holds a picture or room for one.
      const space = b.el.querySelector<HTMLElement>("[data-intro-plate]");
      if (space && space.offsetHeight > 0) {
        const own = space.offsetParent === b.el;
        const sr = space.getBoundingClientRect();
        const plate = div("ib-plate", box, {
          left: px(own ? space.offsetLeft : sr.left - r.left),
          top: px(own ? space.offsetTop : sr.top - r.top),
          width: px(own ? space.offsetWidth : sr.width),
          height: px(own ? space.offsetHeight : sr.height),
        });
        plate.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><line x1="0" y1="0" x2="100" y2="100"/><line x1="100" y1="0" x2="0" y2="100"/></svg>`;
        anim(plate, [{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: delay + 260 });
      }

      const tag = div("ib-tag", box);
      tag.textContent = b.label;
      anim(tag, [{ opacity: 0, transform: "translateY(4px)" }, { opacity: 1, transform: "none" }], { duration: 260, delay: delay + 180, easing: EASE });

      if (isTitle || b.label === "COPY" || b.label === "COPY 01") {
        const d = div("ib-dim ib-dim--size", box);
        d.textContent = `${Math.round(r.width)} × ${Math.round(r.height)}`;
        anim(d, [{ opacity: 0 }, { opacity: 1 }], { duration: 260, delay: delay + (isTitle ? 1100 : 420) });
      }
    });

    // Width of the card row.
    const cards = boxes.filter((b) => b.label.startsWith("CARD"));
    if (cards.length > 1) {
      const left = Math.min(...cards.map((c) => c.rect.left));
      const right = Math.max(...cards.map((c) => c.rect.right));
      const bottom = Math.max(...cards.map((c) => c.rect.bottom));
      if (bottom + 18 < H) {
        const m = div("ib-measure", layer!, { left: px(left), top: px(bottom + 10), width: px(right - left) });
        m.innerHTML = `<span class="ib-dim">${Math.round(right - left)}</span>`;
        anim(m, [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: 650, delay: 1150, easing: EASE });
      }
    }

    const total = 360 + boxes.length * 85 + 1250;
    window.setTimeout(() => finish(false), Math.min(total, 2300));
  }
}
