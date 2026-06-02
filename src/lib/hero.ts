/**
 * Hero arrival animation + image carousel.
 * Pure vanilla — no GSAP, no React.
 *
 * Two layouts:
 *  - Mobile (< 640px) : editorial stack — 4 H1 lines, each followed by a baseline that
 *    traces (scaleX) left→right. Image carousel is full-bleed below the H1. Showreel
 *    label sits under the image.
 *  - Tablet+ (≥ 640px) : current layout — 4 H1 lines centered with an inline row
 *    (* + image + showreel) between L'ART and DE CRÉER. No baselines.
 *
 * Carousel cycles both <img> instances ([data-carousel-img] + [data-carousel-img-mobile])
 * in sync so the visible one always matches.
 *
 * `prefers-reduced-motion` is respected (instant reveal + no carousel).
 */

const LINE_DELAY = 130; // ms between line reveals (mobile + desktop)
const BASELINE_DELAY = 60; // ms after a line before its baseline traces
const INLINE_DELAY = 80; // ms between inline element reveals (desktop)
const POST_LINES_DELAY = 350; // ms after all lines before figure/cue
const CAROUSEL_INTERVAL = 1000; // ms per slide — 1 sec/image (calm, editorial)

export function initHero(): void {
  if (typeof window === "undefined") return;

  const hero = document.querySelector<HTMLElement>("[data-hero]");
  if (!hero) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = window.matchMedia("(max-width: 639px)").matches;

  const slidesSources = JSON.parse(
    hero.querySelector("[data-carousel-sources]")?.textContent ?? "[]"
  ) as string[];

  // Both carousel instances (mobile + desktop) — they cycle in sync
  const carouselImgs = Array.from(
    hero.querySelectorAll<HTMLImageElement>(
      "[data-carousel-img], [data-carousel-img-mobile]"
    )
  );

  // Visible elements based on layout.
  // NOTE : the desktop title container is a <div data-hero-desktop-title>
  // (not <h1>) — see Hero.astro for the rationale (single H1 per page for SEO).
  const mobileBlock = hero.querySelector<HTMLElement>(".mobile-hero");
  const desktopTitle = hero.querySelector<HTMLElement>("[data-hero-desktop-title]");

  const activeContainer = isMobile ? mobileBlock : desktopTitle;

  const lines = activeContainer
    ? Array.from(activeContainer.querySelectorAll<HTMLElement>("[data-anim-line]"))
    : [];
  const baselines = isMobile && mobileBlock
    ? Array.from(mobileBlock.querySelectorAll<HTMLElement>("[data-baseline]"))
    : [];
  const inlines = !isMobile && desktopTitle
    ? Array.from(desktopTitle.querySelectorAll<HTMLElement>("[data-anim-inline]"))
    : [];

  // Figure block (mobile only) + figcaption
  const figure = hero.querySelector<HTMLElement>("[data-anim-figure]");
  const figcap = hero.querySelector<HTMLElement>("[data-anim-figcap]");

  // Bottom availability — present on both layouts
  const bottomCue = hero.querySelector<HTMLElement>(
    "[data-anim-inline][class*='absolute'][class*='bottom-']"
  );

  // Side label "we're built for" (md+ only)
  const sideLabel = hero.querySelector<HTMLElement>(
    "[data-anim-inline][class*='top-1/2']"
  );

  // Subtitle paragraph — sits under the H1 on both layouts. Without explicit
  // reveal here it stays stuck in `.anim-hidden` (opacity 0) because it's
  // outside the desktopTitle container that the `inlines` query scopes to.
  const subtitle = hero.querySelector<HTMLElement>("[data-hero-subtitle]");

  // Preload all carousel slides
  slidesSources.forEach((src) => {
    const img = new Image();
    img.src = src;
  });

  // Reduced motion path
  if (reduced) {
    lines.forEach(revealNow);
    baselines.forEach((b) => b.classList.add("is-drawn"));
    inlines.forEach(revealNow);
    if (figure) revealNow(figure);
    if (figcap) revealNow(figcap);
    // Subtitle: bypass the per-word cascade; the global reduced-motion CSS
    // rule already forces .word-animate to opacity:1 / no animation. Setting
    // the attribute keeps state consistent with the non-reduced path.
    if (subtitle) subtitle.setAttribute("data-words-revealed", "");
    if (bottomCue) revealNow(bottomCue);
    if (sideLabel) revealNow(sideLabel);
    if (carouselImgs[0] && slidesSources[0]) {
      carouselImgs.forEach((img) => (img.src = slidesSources[0]));
    }
    return;
  }

  const start = () => {
    if (isMobile) {
      runMobileSequence(lines, baselines, figure, figcap, bottomCue, () => {
        // Trigger the per-word blur cascade via the parent attribute.
        // The CSS animation-delay on each word handles the stagger.
        if (subtitle) subtitle.setAttribute("data-words-revealed", "");
        if (carouselImgs.length && slidesSources.length) {
          startCarousel(carouselImgs, slidesSources);
        }
      });
    } else {
      runDesktopSequence(lines, inlines, sideLabel, bottomCue, () => {
        if (subtitle) subtitle.setAttribute("data-words-revealed", "");
        if (carouselImgs.length && slidesSources.length) {
          startCarousel(carouselImgs, slidesSources);
        }
      });
    }
  };

  // Coordinate with the preloader
  const preloaderEl = document.getElementById("preloader");
  let fontsReady = false;
  let preloaderDone = !preloaderEl;

  const tryStart = () => {
    if (fontsReady && preloaderDone) start();
  };

  const fontsPromise = document.fonts ? document.fonts.ready : Promise.resolve();
  fontsPromise.then(() => {
    fontsReady = true;
    tryStart();
  });

  if (preloaderEl) {
    document.addEventListener(
      "preloader:done",
      () => {
        preloaderDone = true;
        tryStart();
      },
      { once: true }
    );
  }
}

/* ============ Mobile sequence ============
 * For each line: reveal the text, then trace its baseline ~60ms after.
 * Lines stagger by LINE_DELAY. After all lines + baselines:
 *   - reveal figure (image carousel)
 *   - reveal figcaption (* showreel)
 *   - reveal bottom availability cue
 *   - start carousel cycling
 */
function runMobileSequence(
  lines: HTMLElement[],
  baselines: HTMLElement[],
  figure: HTMLElement | null,
  figcap: HTMLElement | null,
  bottomCue: HTMLElement | null,
  onAllDone: () => void
): void {
  lines.forEach((line, i) => {
    const lineDelay = i * LINE_DELAY;

    window.setTimeout(() => revealNow(line), lineDelay);

    const baseline = baselines[i];
    if (baseline) {
      window.setTimeout(
        () => baseline.classList.add("is-drawn"),
        lineDelay + BASELINE_DELAY
      );
    }
  });

  const linesEnd = (lines.length - 1) * LINE_DELAY + BASELINE_DELAY + 600;

  window.setTimeout(() => {
    if (figure) revealNow(figure);
  }, linesEnd + POST_LINES_DELAY);

  window.setTimeout(() => {
    if (figcap) revealNow(figcap);
  }, linesEnd + POST_LINES_DELAY + 180);

  window.setTimeout(() => {
    if (bottomCue) revealNow(bottomCue);
    onAllDone();
  }, linesEnd + POST_LINES_DELAY + 360);
}

/* ============ Desktop sequence ============
 * Current behavior: lines cascade, then inline row, then side label + bottom cue,
 * then carousel starts.
 */
function runDesktopSequence(
  lines: HTMLElement[],
  inlines: HTMLElement[],
  sideLabel: HTMLElement | null,
  bottomCue: HTMLElement | null,
  onAllDone: () => void
): void {
  revealSequential(lines, LINE_DELAY, () => {
    revealSequential(inlines, INLINE_DELAY, () => {
      if (sideLabel) revealNow(sideLabel);
      if (bottomCue) revealNow(bottomCue);
      onAllDone();
    });
  });
}

function revealSequential(
  els: HTMLElement[],
  delay: number,
  done?: () => void
): void {
  if (els.length === 0) {
    done?.();
    return;
  }
  els.forEach((el, i) => {
    window.setTimeout(() => {
      revealNow(el);
      if (i === els.length - 1 && done) {
        window.setTimeout(done, 320);
      }
    }, i * delay);
  });
}

function revealNow(el: HTMLElement): void {
  el.classList.remove("anim-hidden");
  el.classList.add("anim-in");
}

function startCarousel(imgs: HTMLImageElement[], sources: string[]): void {
  if (!imgs.length || !sources.length) return;
  let i = 0;
  imgs.forEach((img) => (img.src = sources[0]));

  window.setInterval(() => {
    i = (i + 1) % sources.length;
    imgs.forEach((img) => (img.src = sources[i]));
  }, CAROUSEL_INTERVAL);
}
