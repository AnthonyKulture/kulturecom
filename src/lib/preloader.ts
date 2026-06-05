/**
 * Preloader logic — typewriter + morph to nav logo. One continuous sequence
 * with the hero arrival : no perceptible gap at the hand-off.
 *
 *  Phase 1 — Typewriter (0 → 2.5s) : the 13 letters of "Anthony" (serif italic)
 *            + "PROFIT" (display caps) are revealed one-by-one in the center
 *            of the viewport. Each letter fades opacity 0 → 1, slides up 8px,
 *            and un-blurs over 200ms; staggers are spaced so the last letter
 *            resolves at the 2.5s mark.
 *
 *  Phase 2 — Fade-around (2.5 → 3.1s) : every `[data-preloader-around]`
 *            element (top + bottom marquees, 4 cycling slide images, top-left
 *            "Loading" label, bottom-right "anthony.profit / 2026" label)
 *            fades to opacity 0 over 600ms. The slide-cycling intervals are
 *            cleared at the start of this phase. The center brand mark stays
 *            at full size.
 *
 *  Phase 3 — Morph (3.1 → 4.0s) : a FLIP-style transform animates the brand
 *            mark from its centered/big state to the exact bounding box of
 *            the Nav.astro brand link (top-left, ~28px on desktop). We measure
 *            both bboxes at the moment the phase starts so the target tracks
 *            the actual breakpoint padding/size. 900ms with power3.inOut.
 *
 *  Phase 4 — Hand-off (4.0s, ONE frame) : `preloader:done` is dispatched
 *            and the preloader root is removed in the same tick. The
 *            preloader name's morphed bbox lands EXACTLY on the static
 *            Nav logo's bbox (z-50, same typo, same cream source, same
 *            mix-blend-difference render → pure black on cream), and
 *            the nav's `will-change: transform, opacity` keeps its GPU
 *            layer warm even while occluded — so the single-frame swap
 *            is below the perception threshold. A fade was tried here
 *            but exposed sub-pixel rendering differences between the
 *            scaled transform and the nav's native paint as a tiny
 *            left-right wobble; instant removal avoids that entirely.
 *
 *  Skip path : sessionStorage `ap-preloader-v3` (bumped from v2 to invalidate
 *            the prior counter-based flow) — second loads remove the
 *            preloader instantly and dispatch the event so the hero starts.
 *
 *  Reduced motion : letters snap to opacity 1, surroundings fade in 200ms,
 *            preloader removed at 400ms with no translate/scale.
 */
import gsap from "gsap";

const TYPEWRITER_DURATION_MS = 2500;
const FADE_AROUND_DURATION_MS = 600;
const MORPH_DURATION_MS = 900;
const SLIDE_INTERVAL_MS = 200;

const SLIDES = Array.from(
  { length: 20 },
  (_, i) => `/hero-slides/slide-${String(i + 1).padStart(2, "0")}.webp`
);

export function initPreloader(): void {
  if (typeof window === "undefined") return;

  const el = document.getElementById("preloader");
  if (!el) return;

  // sessionStorage skip after first load (v3 key — bumped to invalidate
  // any prior counter-based flow cached during this session).
  let alreadySeen = false;
  try {
    alreadySeen = sessionStorage.getItem("ap-preloader-v3") === "1";
  } catch {
    /* ignore */
  }

  if (alreadySeen) {
    el.remove();
    document.dispatchEvent(new CustomEvent("preloader:done"));
    return;
  }

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const nameEl = el.querySelector<HTMLElement>("[data-preloader-name]");
  const letters = Array.from(
    el.querySelectorAll<HTMLElement>(".preloader-letter")
  );
  const aroundEls = Array.from(
    el.querySelectorAll<HTMLElement>("[data-preloader-around]")
  );
  const slideImgs = Array.from(
    el.querySelectorAll<HTMLImageElement>("[data-preloader-slide]")
  );
  // Source of truth for the morph target: the actual Nav brand link.
  // Measuring its bbox at runtime sidesteps having to hardcode the
  // padding/font-size matrix for each Tailwind breakpoint.
  const targetLogo = document.querySelector<HTMLElement>(
    '[aria-label="Anthony Profit"]'
  );

  // Defensive bail: if any critical handle is missing, drop the preloader
  // instantly rather than freezing the page in front of an unfinished overlay.
  if (!nameEl || letters.length === 0 || !targetLogo) {
    el.remove();
    document.dispatchEvent(new CustomEvent("preloader:done"));
    return;
  }

  // Eager-preload the first few hero slides so the carousel has frames ready
  // when the hero starts; the rest stream lazily as the carousel rotates.
  SLIDES.slice(0, 3).forEach((src) => {
    const img = new Image();
    img.src = src;
  });

  // Lock body scroll for the duration of the preloader.
  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";

  const finish = () => {
    document.body.style.overflow = previousOverflow;
    try {
      sessionStorage.setItem("ap-preloader-v3", "1");
    } catch {
      /* ignore */
    }
    document.dispatchEvent(new CustomEvent("preloader:done"));
  };

  if (reduced) {
    // Reduced-motion path: skip the cascade and the morph, drop fast.
    gsap.set(letters, { opacity: 1, y: 0, filter: "blur(0px)" });
    gsap.to(aroundEls, { opacity: 0, duration: 0.2, ease: "power2.out" });
    gsap.to(el, {
      opacity: 0,
      duration: 0.2,
      delay: 0.2,
      ease: "power2.out",
      onComplete: () => {
        finish();
        el.remove();
      },
    });
    return;
  }

  // Cycle the corner/edge slides until the typewriter is done.
  const slideTimers: number[] = [];
  slideImgs.forEach((img) => {
    let idx = parseInt(img.dataset.cycleOffset ?? "0", 10) || 0;
    slideTimers.push(
      window.setInterval(() => {
        idx = (idx + 1) % SLIDES.length;
        img.src = SLIDES[idx];
      }, SLIDE_INTERVAL_MS)
    );
  });

  const startTimeline = () => {
    const tl = gsap.timeline();

    // ─── Phase 1 — Typewriter ──────────────────────────────────────────
    // Per-letter cascade. Stagger spread = TYPEWRITER_DURATION minus the
    // tail of the last letter's own tween, so the last letter resolves
    // right at the 4s mark.
    const perLetterSec = 0.2;
    const staggerSec =
      (TYPEWRITER_DURATION_MS / 1000 - perLetterSec) /
      Math.max(letters.length - 1, 1);
    tl.to(
      letters,
      {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: perLetterSec,
        stagger: staggerSec,
        ease: "power2.out",
      },
      0
    );

    // ─── Phase 2 — Fade-around ─────────────────────────────────────────
    tl.to(
      aroundEls,
      {
        opacity: 0,
        duration: FADE_AROUND_DURATION_MS / 1000,
        ease: "power2.out",
        onStart: () => {
          slideTimers.forEach((t) => window.clearInterval(t));
        },
      },
      TYPEWRITER_DURATION_MS / 1000
    );

    // ─── Phase 3 — Morph to nav logo position ──────────────────────────
    // We can't tween to a static target — the nav logo bbox depends on
    // viewport size and font load state. Capture both bboxes at the
    // moment the phase starts via a timeline callback, then fire a
    // separate tween whose targets are computed live.
    tl.call(
      () => {
        const nameRect = nameEl.getBoundingClientRect();
        const targetRect = targetLogo.getBoundingClientRect();
        // Width ratio collapses to font-size ratio when the two logos
        // share the same fonts and tracking — which they do (font-serif +
        // font-display, identical tracking). transformOrigin 0 0 means
        // scaling shrinks from the top-left corner, so translating by
        // (target - current) places the post-scale top-left exactly at
        // the target's top-left.
        const scale = targetRect.width / nameRect.width;
        const dx = targetRect.left - nameRect.left;
        const dy = targetRect.top - nameRect.top;

        gsap.to(nameEl, {
          x: dx,
          y: dy,
          scale,
          // `force3D: true` forces GSAP to use translate3d() under the
          // hood, keeping the element on a GPU compositing layer with
          // sub-pixel-stable rendering throughout the morph. Without it,
          // the last few frames of `power3.inOut` decelerate through
          // very small deltas (~0.05px/frame), which the browser may
          // re-snap differently between transformed and non-transformed
          // states — perceived as a small left-right wobble on arrival.
          force3D: true,
          duration: MORPH_DURATION_MS / 1000,
          ease: "power3.inOut",
          onComplete: () => {
            // Instant hand-off — NOT a fade. Both the preloader name
            // and the Nav logo render as pure black on cream (cream
            // source + mix-blend-difference on both), and the nav's
            // `will-change: transform, opacity` keeps its GPU layer warm
            // even while occluded. A fade here would EXPOSE any sub-
            // pixel rendering difference between the scaled transform
            // and the nav's native paint — visible as a micro left-right
            // shift over the ~10 fade frames. Instant removal collapses
            // that swap into 1 frame, below the perception threshold.
            finish();
            el.remove();
          },
        });
      },
      [],
      (TYPEWRITER_DURATION_MS + FADE_AROUND_DURATION_MS) / 1000
    );
  };

  // Wait for fonts so the bbox measurements (which drive the morph scale)
  // reflect the final font metrics rather than the fallback's. Small budget
  // — fonts are already <link rel="preload">'d by the base layout, so this
  // usually resolves within a few ms.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(startTimeline);
  } else {
    startTimeline();
  }
}
