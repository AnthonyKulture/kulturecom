/**
 * Preloader logic:
 *  - Counts a percentage from 0 to 100 over ~2s.
 *  - Cycles SVG slides on multiple placements (different offsets so they don't sync).
 *  - On completion, exits via clip-path reveal and dispatches a `preloader:done` event.
 *  - sessionStorage skip: subsequent navigations within the same session skip the preloader.
 *  - `prefers-reduced-motion`: instant fade-out, no count animation.
 */

const COUNT_DURATION = 3080; // ms (total preloader ≈ 4s : count + hold + exit)
const HOLD_AT_100 = 220; // ms after reaching 100 before exit
const EXIT_DURATION = 700; // ms
const SLIDE_INTERVAL = 240; // ms per slide change (slightly slower for 4s flow)

const SLIDES = Array.from(
  { length: 20 },
  (_, i) => `/hero-slides/slide-${String(i + 1).padStart(2, "0")}.webp`
);

export function initPreloader(): void {
  if (typeof window === "undefined") return;

  const el = document.getElementById("preloader");
  if (!el) return;

  // sessionStorage skip after first load
  let alreadySeen = false;
  try {
    alreadySeen = sessionStorage.getItem("ap-preloader-v2") === "1";
  } catch {
    /* ignore */
  }

  if (alreadySeen) {
    // Remove the preloader immediately, hero starts on its own
    el.remove();
    document.dispatchEvent(new CustomEvent("preloader:done"));
    return;
  }

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const counterEl = el.querySelector<HTMLElement>("[data-preloader-counter]");
  const slideImgs = Array.from(
    el.querySelectorAll<HTMLImageElement>("[data-preloader-slide]")
  );

  // Preload all slides early
  SLIDES.forEach((src) => {
    const img = new Image();
    img.src = src;
  });

  // Lock body scroll
  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";

  const finish = () => {
    document.body.style.overflow = previousOverflow;
    try {
      sessionStorage.setItem("ap-preloader-v2", "1");
    } catch {
      /* ignore */
    }
    document.dispatchEvent(new CustomEvent("preloader:done"));
    el.addEventListener(
      "transitionend",
      () => {
        el.remove();
      },
      { once: true }
    );
    el.classList.add("preloader--exit");
  };

  if (reduced) {
    if (counterEl) counterEl.textContent = "100";
    window.setTimeout(finish, 200);
    return;
  }

  // Start cycling SVG slides — each slot has its own offset so they're desync'd
  const slideTimers: number[] = [];
  slideImgs.forEach((img) => {
    let idx = parseInt(img.dataset.cycleOffset ?? "0", 10) || 0;
    slideTimers.push(
      window.setInterval(() => {
        idx = (idx + 1) % SLIDES.length;
        img.src = SLIDES[idx];
      }, SLIDE_INTERVAL)
    );
  });

  // Run percentage counter — RAF for smoothness
  const start = performance.now();
  let lastShown = -1;

  function tick(now: number) {
    const ratio = Math.min((now - start) / COUNT_DURATION, 1);
    const value = Math.floor(ratio * 100);
    if (value !== lastShown && counterEl) {
      counterEl.textContent = String(value);
      lastShown = value;
    }
    if (ratio < 1) {
      requestAnimationFrame(tick);
    } else {
      // Stop slide cycling
      slideTimers.forEach((t) => window.clearInterval(t));
      // Hold then exit
      window.setTimeout(finish, HOLD_AT_100);
    }
  }
  requestAnimationFrame(tick);
}
