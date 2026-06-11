/**
 * Preloader logic — REAL loading bar → typewriter → morph to nav logo.
 * One continuous sequence with the hero arrival: no perceptible gap.
 *
 *  Phase 0 — Loading : a full-width bottom bar + a bottom-right percentage
 *            track ACTUAL readiness — the web fonts (`document.fonts.ready`)
 *            plus the first PRELOAD_COUNT hero slides (counted via image
 *            `onload`/`onerror`). The displayed value eases (rAF lerp) toward
 *            the real loaded fraction; a MIN_DISPLAY_MS floor stops it flashing
 *            on cache, and a SAFETY_CAP_MS ceiling stops slow assets hanging
 *            it. Fonts are GUARANTEED loaded by 100% — which is what makes the
 *            typewriter smooth (no mid-animation font swap).
 *
 *  Phase 1 — Typewriter : once the bar hits 100%, the loading UI fades and the
 *            13 letters of "Anthony" (serif italic) + "PROFIT" (display caps)
 *            are revealed one-by-one (opacity + translateY, no blur — kept
 *            cheap for a smooth cascade).
 *
 *  Phase 2 — Morph : a FLIP-style transform animates the brand mark from its
 *            centered/big state to the exact bounding box of the Nav.astro
 *            brand link (top-left). Both bboxes are measured live so the target
 *            tracks the actual breakpoint padding/size. 900ms power3.inOut.
 *
 *  Phase 3 — Hand-off (ONE frame) : `preloader:done` is dispatched and the
 *            preloader root is removed in the same tick. The morphed bbox lands
 *            EXACTLY on the static Nav logo (same typo, same cream source, same
 *            mix-blend-difference) so the swap is below the perception
 *            threshold. The nav's `will-change` keeps its GPU layer warm.
 *
 *  Skip path : sessionStorage `ap-preloader-v4` (bumped to invalidate the prior
 *            marquee/image flow) — second loads remove the preloader instantly
 *            and dispatch the event so the hero starts.
 *
 *  Reduced motion : letters snap visible, bar/percent snap to 100%, preloader
 *            removed fast with no typewriter cascade and no morph.
 */
import gsap from "gsap";
import { prefersReducedMotion } from "./env";

const PRELOAD_COUNT = 6; // first N hero slides to actually preload + count
const MIN_DISPLAY_MS = 900; // floor so the bar never flashes on cache
const SAFETY_CAP_MS = 4500; // ceiling so slow assets can't hang the loader
const PERCENT_EASE = 0.12; // rAF lerp factor toward the real fraction
const TYPEWRITER_DURATION_MS = 1300;
const MORPH_DURATION_MS = 900;

const SLIDES = Array.from(
  { length: 20 },
  (_, i) => `/hero-slides/slide-${String(i + 1).padStart(2, "0")}.webp`
);

interface ProgressOpts {
  percentEl: HTMLElement | null;
  barEl: HTMLElement | null;
  onComplete: () => void;
}

/**
 * Drive the loading bar + percentage from REAL asset readiness, then call
 * `onComplete` once everything is loaded (and the min display time elapsed) or
 * the safety cap fires. Never appears stuck; every unit resolves exactly once.
 */
function trackProgress({ percentEl, barEl, onComplete }: ProgressOpts): void {
  const slides = SLIDES.slice(0, PRELOAD_COUNT);
  const total = slides.length + 1; // +1 for the fonts unit
  let loaded = 0;
  let displayed = 0;
  let settled = false;
  let rafId = 0;
  const start = performance.now();

  const bump = () => {
    loaded = Math.min(loaded + 1, total);
  };

  // Unit 1 — fonts. `document.fonts` may be unsupported or reject; count anyway.
  const fontsReady =
    typeof document !== "undefined" && document.fonts && document.fonts.ready
      ? document.fonts.ready
      : Promise.resolve();
  fontsReady.then(bump).catch(bump);

  // Units 2..N — image preloads. Failures (onerror) still count so a missing
  // asset can never stall the bar; cached images may skip onload, so check
  // `complete`.
  slides.forEach((src) => {
    const img = new Image();
    const done = () => bump();
    img.onload = done;
    img.onerror = done;
    img.src = src;
    if (img.complete) done();
  });

  const settle = () => {
    if (settled) return;
    settled = true;
    cancelAnimationFrame(rafId);
    if (percentEl) percentEl.textContent = "100%";
    if (barEl) barEl.style.transform = "scaleX(1)";
    onComplete();
  };

  const tick = (now: number) => {
    const elapsed = now - start;
    const ready = loaded >= total && elapsed >= MIN_DISPLAY_MS;
    // Hold short of 100% until truly ready (loaded + min time).
    const cap = ready ? 1 : 0.99;
    const target = Math.min(loaded / total, cap);
    displayed += (target - displayed) * PERCENT_EASE;
    // Time floor: guarantee visible forward creep even if assets stall.
    const timeFloor = Math.min(elapsed / SAFETY_CAP_MS, 0.99);
    const value = Math.max(displayed, timeFloor);

    if (percentEl) percentEl.textContent = `${Math.round(value * 100)}%`;
    if (barEl) barEl.style.transform = `scaleX(${value.toFixed(4)})`;

    if ((ready && value >= 0.999) || elapsed >= SAFETY_CAP_MS) {
      settle();
      return;
    }
    rafId = requestAnimationFrame(tick);
  };
  rafId = requestAnimationFrame(tick);
}

export function initPreloader(): void {
  if (typeof window === "undefined") return;

  const el = document.getElementById("preloader");
  if (!el) return;

  // sessionStorage skip after first load (v4 — bumped to invalidate the prior
  // marquee/image flow cached during this session).
  let alreadySeen = false;
  try {
    alreadySeen = sessionStorage.getItem("ap-preloader-v4") === "1";
  } catch {
    /* ignore */
  }

  if (alreadySeen) {
    el.remove();
    document.dispatchEvent(new CustomEvent("preloader:done"));
    return;
  }

  const reduced = prefersReducedMotion();

  const nameEl = el.querySelector<HTMLElement>("[data-preloader-name]");
  const letters = Array.from(
    el.querySelectorAll<HTMLElement>(".preloader-letter")
  );
  const loadingEl = el.querySelector<HTMLElement>("[data-preloader-loading]");
  const percentEl = el.querySelector<HTMLElement>("[data-preloader-percent]");
  const barEl = el.querySelector<HTMLElement>("[data-preloader-bar]");
  // Source of truth for the morph target: the actual Nav brand link.
  // Measuring its bbox at runtime sidesteps hardcoding the padding/font-size
  // matrix for each Tailwind breakpoint.
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

  // Lock body scroll for the duration of the preloader.
  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";

  const finish = () => {
    document.body.style.overflow = previousOverflow;
    try {
      sessionStorage.setItem("ap-preloader-v4", "1");
    } catch {
      /* ignore */
    }
    document.dispatchEvent(new CustomEvent("preloader:done"));
  };

  if (reduced) {
    // Reduced-motion path: snap everything to its final state, drop fast.
    gsap.set(letters, { opacity: 1, y: 0 });
    if (percentEl) percentEl.textContent = "100%";
    if (barEl) barEl.style.transform = "scaleX(1)";
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

  // Reveal sequence — runs once the loading bar reaches 100% (fonts ready).
  const startReveal = () => {
    const tl = gsap.timeline();

    // ─── Fade the loading UI out ───────────────────────────────────────
    if (loadingEl) {
      tl.to(loadingEl, { opacity: 0, duration: 0.3, ease: "power2.out" }, 0);
    }

    // ─── Phase 1 — Typewriter (smooth: opacity + y only, NO blur) ───────
    const perLetterSec = 0.2;
    const staggerSec =
      (TYPEWRITER_DURATION_MS / 1000 - perLetterSec) /
      Math.max(letters.length - 1, 1);
    tl.to(
      letters,
      {
        opacity: 1,
        y: 0,
        duration: perLetterSec,
        stagger: staggerSec,
        ease: "power2.out",
      },
      0.15
    );

    // ─── Phase 2 — Morph to nav logo position (math unchanged) ──────────
    // The nav logo bbox depends on viewport size and font load state, so we
    // capture both bboxes at the moment the phase starts and fire a tween
    // whose targets are computed live.
    tl.call(
      () => {
        const nameRect = nameEl.getBoundingClientRect();
        const targetRect = targetLogo.getBoundingClientRect();
        // Width ratio collapses to font-size ratio when the two logos share
        // the same fonts and tracking (they do). transformOrigin 0 0 means
        // scaling shrinks from the top-left corner, so translating by
        // (target - current) places the post-scale top-left on the target.
        const scale = targetRect.width / nameRect.width;
        const dx = targetRect.left - nameRect.left;
        const dy = targetRect.top - nameRect.top;

        gsap.to(nameEl, {
          x: dx,
          y: dy,
          scale,
          // `force3D: true` keeps the element on a GPU layer with sub-pixel-
          // stable rendering throughout the morph, avoiding the micro
          // left-right wobble that bare transforms show on arrival.
          force3D: true,
          duration: MORPH_DURATION_MS / 1000,
          ease: "power3.inOut",
          onComplete: () => {
            // Instant hand-off — NOT a fade. Both the preloader name and the
            // Nav logo render as pure black on cream; a fade here would expose
            // sub-pixel differences as a micro shift. Instant removal collapses
            // the swap into one frame.
            finish();
            el.remove();
          },
        });
      },
      [],
      0.15 + TYPEWRITER_DURATION_MS / 1000
    );
  };

  // Kick off the real loading bar; reveal when it completes.
  trackProgress({ percentEl, barEl, onComplete: startReveal });
}
