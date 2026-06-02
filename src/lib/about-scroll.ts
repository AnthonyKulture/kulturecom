/**
 * Screen orchestration — multi-section scroll-driven choreography.
 *
 *  ─── DESKTOP (≥640px) — pin +=875%, 5 layers ───
 *
 *    Phase 1 (0    → 30%):   about slides up (yPercent 100 → 0) to cover hero
 *    Phase 2 (20   → 47%):   about text lines stagger reveal — faster
 *                            (duration 0.22, stagger 0.05; last line ~0.45)
 *    Phase 3 (15   → 60%):   about corner photos parallax
 *    --      ~47 → 85%:     plateau (reading About 1 — ~40% timeline)
 *    Phase A (85   → 95%):   ABOUT 2 curtain horizontal (chapter reveal)
 *                            clip-path inset(50% 0) → inset(0)
 *    Parallax (85 → 137%):   Photo yPercent 0 → -45 (sine.inOut, continuous
 *                            until the very moment Services begins to cover)
 *    Phase 4 (137 → 157%):   services circle reveal (clip-path bottom-right)
 *    Phase 5 (147 → 161%):   services text lines stagger reveal
 *    --     186 → 224%:     plateau, progress ring fills (foreshadow)
 *    Phase 6 (224 → 254%):   projects letter-mask `+` reveal (mask-size 0 → 1500)
 *
 *  ─── MOBILE (<640px) — pin +=1135%, 5 layers ───
 *
 *    Phase 1 (0    → 30%):   about slides up
 *    Phase 2 (20   → 47%):   about text reveal — faster
 *    Phase 3 (15   → 60%):   about parallax photos
 *    --      ~47 → 85%:     plateau (reading About 1)
 *    Phase A (85   → 95%):   ABOUT 2 curtain horizontal (chapter reveal)
 *    Parallax (85 → 137%):   Photo yPercent 0 → -45 (sine.inOut, continuous
 *                            until the very moment services-mobile reveals)
 *    Phase 4 (139 → 149%):   services-mobile clip-path reveal
 *    Phase 5 (149 → 155%):   stable axis 0 (Web Design)
 *    Phase 6 (155 → 159%):   crossfade axis 0 → 1
 *    Phase 7 (159 → 165%):   stable axis 1 (Development)
 *    Phase 8 (165 → 169%):   crossfade axis 1 → 2
 *    Phase 9 (169 → 174%):   stable axis 2 (SEO)
 *    Phase 10 (174 → 184%):  push-stack (mobile transition 2)
 *    Below the pin → normal-flow ProjectsMobile list.
 *
 *  Independent of scroll: about pattern slot cycles via setInterval.
 *  `prefers-reduced-motion` → all states immediately revealed, no pin.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Note : Chrome rubber-band scroll-back is handled via CSS `overscroll-behavior: none`
// on html/body (src/styles/global.css). `ScrollTrigger.normalizeScroll(true)` is
// intentionally NOT enabled — it costs ~80ms of INP by replacing native scroll with
// a JS handler, and the CSS-only fix already prevents Chrome's reverse-scroll bug.

const PATTERNS = Array.from(
  { length: 10 },
  (_, i) => `/patterns/pattern-${String(i + 1).padStart(2, "0")}.svg`
);
const PATTERN_INTERVAL = 240; // ms between SVG pattern swaps in About corner.

// === Timeline pin distances (ScrollTrigger `end` strings) ===
// "+=N%" means: pin the section and let the user scroll N% of the viewport
// height before unpinning. Tuned phase-by-phase to give each scroll-driven
// reveal enough breathing room. Numbers were tuned through multiple
// iterations; bump only if a phase feels rushed.
const PIN_DISTANCE = {
  mobile: { withProjects: "+=1490%", noProjects: "+=300%" },
  desktop: { withProjects: "+=875%", noProjects: "+=370%" },
} as const;

// SVG circle r=46 → circumference = 2 × π × 46 ≈ 289.027.
// Set as both stroke-dasharray and initial stroke-dashoffset on the
// services progress ring so the line is fully hidden at scroll-start and
// fully drawn at scroll-end (dashoffset → 0 across the Services phase).
const PROGRESS_RING_CIRCUMFERENCE = 289.027;

export function initAboutScroll(): void {
  if (typeof window === "undefined") return;

  const stack = document.querySelector<HTMLElement>("[data-screen-stack]");
  const heroLayer = document.querySelector<HTMLElement>(
    "[data-screen-layer='hero']"
  );
  const aboutLayer = document.querySelector<HTMLElement>(
    "[data-screen-layer='about']"
  );
  const about2Layer = document.querySelector<HTMLElement>(
    "[data-screen-layer='about2']"
  );
  const about2ParallaxImg = document.querySelector<HTMLImageElement>(
    "[data-about-parallax]"
  );
  // Desktop layers
  const servicesLayer = document.querySelector<HTMLElement>(
    "[data-screen-layer='services']"
  );
  const projectsLayer = document.querySelector<HTMLElement>(
    "[data-screen-layer='projects']"
  );
  // Mobile layers
  const servicesMobileLayer = document.querySelector<HTMLElement>(
    "[data-screen-layer='services-mobile']"
  );
  const projectsMobileCoverLayer = document.querySelector<HTMLElement>(
    "[data-screen-layer='projects-mobile-cover']"
  );

  const aboutLines = Array.from(
    document.querySelectorAll<HTMLElement>("[data-about-line]")
  );
  // About manifesto items — word spans are pre-rendered server-side via
  // `splitTitle()` from `src/lib/text-split.ts` (each word wrapped in
  // `.split-word` > `.split-word-inner`). Doing the split at build time
  // avoids the FOUC-style layout reflow that would otherwise happen when
  // a runtime innerHTML mutation re-wraps the title between SSR paint
  // and JS execution.
  const aboutItemList = Array.from(
    document.querySelectorAll<HTMLElement>(".about-item")
  );
  const aboutItemWords = aboutItemList.map((item) =>
    Array.from(item.querySelectorAll<HTMLElement>(".split-word-inner"))
  );
  const aboutItemDescs = aboutItemList.map((item) =>
    item.querySelector<HTMLElement>(".about-item-desc")
  );
  const aboutAllWords = aboutItemWords.flat();
  const aboutAllDescs = aboutItemDescs.filter(
    (d): d is HTMLElement => d !== null
  );

  const servicesLines = Array.from(
    document.querySelectorAll<HTMLElement>("[data-services-line]")
  );
  // Desktop services — per-item word-split for elaborate cascade reveal.
  // H2 lines and each item's H3 title are pre-rendered with .split-word spans
  // (SSR in Services.astro). Item bodies stay as plain text; they fade-slide.
  const servicesH2Words = Array.from(
    document.querySelectorAll<HTMLElement>(
      "[data-services-h2-line] .split-word-inner"
    )
  );
  const servicesItemList = Array.from(
    document.querySelectorAll<HTMLElement>("[data-services-item]")
  );
  const servicesItemTitleWords = servicesItemList.map((item) =>
    Array.from(item.querySelectorAll<HTMLElement>(".split-word-inner"))
  );
  const servicesItemBodies = servicesItemList.map((item) =>
    item.querySelector<HTMLElement>("[data-services-item-body]")
  );
  const servicesAllItemWords = servicesItemTitleWords.flat();
  const servicesAllItemBodies = servicesItemBodies.filter(
    (b): b is HTMLElement => b !== null
  );

  const servicesProgressRing = document.querySelector<SVGCircleElement>(
    "[data-services-progress-ring]"
  );
  const cornerPhotos = Array.from(
    document.querySelectorAll<HTMLElement>("[data-parallax-corner]")
  );
  const patternEl = document.querySelector<HTMLImageElement>(
    "[data-about-pattern]"
  );
  // Mobile axes carousel
  const axisCards = Array.from(
    document.querySelectorAll<HTMLElement>("[data-axis-card]")
  );
  const axisTabs = Array.from(
    document.querySelectorAll<HTMLElement>("[data-axis-tab]")
  );
  // Mobile services — 3 full-screen panels stacked, only axis 0 is initially
  // visible. Each panel has header (eyebrow + count) / huge label number /
  // title with word-split / body / footer (accent line + hint). For axis 0
  // we animate every internal element on Phase 4 entry. Axes 1 and 2 have
  // their internals at final state (no per-element reveal) — they appear via
  // blur+opacity crossfade controlled by Phases 6 and 8.
  const servicesMobileFirstHeader = document.querySelector<HTMLElement>(
    "[data-axis-panel-header='0']"
  );
  const servicesMobileFirstLabel = document.querySelector<HTMLElement>(
    "[data-axis-panel-label='0']"
  );
  const servicesMobileFirstTitleWords = Array.from(
    document.querySelectorAll<HTMLElement>(
      "[data-axis-card-title='0'] .split-word-inner"
    )
  );
  const servicesMobileFirstBody = document.querySelector<HTMLElement>(
    "[data-axis-card-body='0']"
  );
  const servicesMobileFirstFooter = document.querySelector<HTMLElement>(
    "[data-axis-panel-footer='0']"
  );

  if (!stack || !heroLayer || !aboutLayer) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = window.matchMedia("(max-width: 639px)").matches;
  const hasDesktopProjects = !isMobile && projectsLayer !== null;
  const hasMobileTransitions =
    isMobile &&
    servicesMobileLayer !== null &&
    projectsMobileCoverLayer !== null &&
    axisCards.length >= 3;
  const hasAboutChapter = about2Layer !== null;

  // Preload patterns
  PATTERNS.forEach((src) => {
    const img = new Image();
    img.src = src;
  });

  // About pattern cycling (independent of scroll)
  if (patternEl && !reduced) {
    let idx = 0;
    window.setInterval(() => {
      idx = (idx + 1) % PATTERNS.length;
      patternEl.src = PATTERNS[idx];
    }, PATTERN_INTERVAL);
  }

  if (reduced) {
    gsap.set(aboutLayer, { yPercent: 0, opacity: 1 });
    gsap.set(aboutLines, { opacity: 1, y: 0 });
    gsap.set(aboutItemList, { opacity: 1, y: 0 });
    if (aboutAllWords.length > 0) {
      gsap.set(aboutAllWords, { yPercent: 0 });
    }
    if (aboutAllDescs.length > 0) {
      gsap.set(aboutAllDescs, { opacity: 1, y: 0 });
    }
    if (about2Layer) {
      about2Layer.style.clipPath = "inset(0 0 0 0)";
    }
    if (about2ParallaxImg) {
      gsap.set(about2ParallaxImg, { yPercent: -22 });
    }
    if (servicesLayer) {
      servicesLayer.style.clipPath = "circle(150% at 100% 100%)";
    }
    gsap.set(servicesLines, { opacity: 1, y: 0 });
    if (servicesH2Words.length > 0) {
      gsap.set(servicesH2Words, { yPercent: 0 });
    }
    if (servicesItemList.length > 0) {
      gsap.set(servicesItemList, { opacity: 1, y: 0 });
    }
    if (servicesAllItemWords.length > 0) {
      gsap.set(servicesAllItemWords, { yPercent: 0 });
    }
    if (servicesAllItemBodies.length > 0) {
      gsap.set(servicesAllItemBodies, { opacity: 1, y: 0 });
    }
    if (servicesMobileFirstHeader) {
      gsap.set(servicesMobileFirstHeader, {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
      });
    }
    if (servicesMobileFirstLabel) {
      gsap.set(servicesMobileFirstLabel, {
        opacity: 1,
        scale: 1,
        filter: "blur(0px)",
      });
    }
    if (servicesMobileFirstTitleWords.length > 0) {
      gsap.set(servicesMobileFirstTitleWords, { yPercent: 0 });
    }
    if (servicesMobileFirstBody) {
      gsap.set(servicesMobileFirstBody, {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
      });
    }
    if (servicesMobileFirstFooter) {
      gsap.set(servicesMobileFirstFooter, { opacity: 1, y: 0 });
    }
    if (servicesProgressRing) {
      gsap.set(servicesProgressRing, { strokeDashoffset: 0 });
    }
    if (projectsLayer) {
      projectsLayer.style.webkitMaskSize = "1500%";
      projectsLayer.style.maskSize = "1500%";
    }
    if (servicesMobileLayer) {
      servicesMobileLayer.style.clipPath = "circle(150% at 100% 100%)";
    }
    return;
  }

  const pinDistance = isMobile
    ? hasMobileTransitions
      ? PIN_DISTANCE.mobile.withProjects
      : PIN_DISTANCE.mobile.noProjects
    : hasDesktopProjects
      ? PIN_DISTANCE.desktop.withProjects
      : PIN_DISTANCE.desktop.noProjects;

  // Initial states
  gsap.set(aboutLayer, { yPercent: 100, opacity: 1 });
  gsap.set(aboutLines, { opacity: 0, y: 60 });
  gsap.set(aboutItemList, { opacity: 0, y: 28 });
  if (aboutAllWords.length > 0) {
    // yPercent 110 = inner translated 110% of its own height DOWN → fully below
    // the overflow:hidden wrapper → clipped, invisible. Animating to yPercent 0
    // makes the word rise into view as if revealed by a horizontal mask.
    gsap.set(aboutAllWords, { yPercent: 110 });
  }
  if (aboutAllDescs.length > 0) {
    gsap.set(aboutAllDescs, { opacity: 0, y: 10 });
  }
  gsap.set(servicesLines, { opacity: 0, y: 60 });
  if (servicesH2Words.length > 0) {
    gsap.set(servicesH2Words, { yPercent: 110 });
  }
  if (servicesItemList.length > 0) {
    gsap.set(servicesItemList, { opacity: 0, y: 28 });
  }
  if (servicesAllItemWords.length > 0) {
    gsap.set(servicesAllItemWords, { yPercent: 110 });
  }
  if (servicesAllItemBodies.length > 0) {
    gsap.set(servicesAllItemBodies, { opacity: 0, y: 10 });
  }
  if (servicesMobileFirstHeader) {
    gsap.set(servicesMobileFirstHeader, {
      opacity: 0,
      y: -12,
      filter: "blur(6px)",
    });
  }
  if (servicesMobileFirstLabel) {
    gsap.set(servicesMobileFirstLabel, {
      opacity: 0,
      scale: 0.85,
      filter: "blur(14px)",
    });
  }
  if (servicesMobileFirstTitleWords.length > 0) {
    gsap.set(servicesMobileFirstTitleWords, { yPercent: 110 });
  }
  if (servicesMobileFirstBody) {
    gsap.set(servicesMobileFirstBody, {
      opacity: 0,
      y: 12,
      filter: "blur(6px)",
    });
  }
  if (servicesMobileFirstFooter) {
    gsap.set(servicesMobileFirstFooter, { opacity: 0, y: 12 });
  }
  // Initial filter blur on inactive cards (1 and 2) so the crossfade-in
  // interpolates from blurry to sharp. Card 0 stays at no blur (it's the
  // visible one at section entry).
  if (axisCards.length >= 3) {
    gsap.set(axisCards[0], { filter: "blur(0px)" });
    gsap.set(axisCards[1], { filter: "blur(10px)" });
    gsap.set(axisCards[2], { filter: "blur(10px)" });
  }
  if (servicesProgressRing) {
    gsap.set(servicesProgressRing, { strokeDashoffset: PROGRESS_RING_CIRCUMFERENCE });
  }
  if (about2Layer) {
    gsap.set(about2Layer, { clipPath: "inset(50% 0 50% 0)" });
  }
  if (about2ParallaxImg) {
    gsap.set(about2ParallaxImg, { yPercent: 0 });
  }
  if (hasMobileTransitions && projectsMobileCoverLayer) {
    gsap.set(projectsMobileCoverLayer, { yPercent: 100 });
  }

  const tl = gsap.timeline({ defaults: { ease: "none" } });

  // ─── Phase 1 — About slides up to cover hero ───
  tl.to(aboutLayer, { yPercent: 0, duration: 0.3 }, 0);

  // ─── Phase 2 — Elaborate scroll reveal ───
  // Eyebrow first (simple fade-up), then each manifesto item cascades in with
  // a 3-layer sub-reveal:
  //   (a) container fade + translateY  → soft "landing"
  //   (b) title words stagger in       → word-by-word with scale + slide
  //   (c) description fade + slide     → supporting context arrives last
  // Items are inter-staggered by 0.035 timeline units so the sequence reads
  // top-to-bottom as the user scrolls, not all at once.
  tl.to(
    aboutLines,
    { opacity: 1, y: 0, duration: 0.20, ease: "power2.out" },
    0.18
  );

  aboutItemList.forEach((item, idx) => {
    const itemStart = 0.22 + idx * 0.035;
    const words = aboutItemWords[idx];
    const desc = aboutItemDescs[idx];

    // (a) Container — opacity + translateY landing
    tl.to(
      item,
      { opacity: 1, y: 0, duration: 0.22, ease: "power2.out" },
      itemStart
    );

    // (b) Title words mask-reveal — each word rises into its clipped wrapper
    if (words.length > 0) {
      tl.to(
        words,
        {
          yPercent: 0,
          stagger: 0.014,
          duration: 0.26,
          ease: "power3.out",
        },
        itemStart + 0.04
      );
    }

    // (c) Description slide-up
    if (desc) {
      tl.to(
        desc,
        { opacity: 1, y: 0, duration: 0.20, ease: "power2.out" },
        itemStart + 0.14
      );
    }
  });

  // ─── Phase 3 — Corner photos parallax ───
  cornerPhotos.forEach((photo) => {
    const direction = photo.dataset.parallaxDirection ?? "up";
    let startY: number;
    let endY: number;
    if (direction === "up") {
      const r = isMobile ? 60 : 110;
      startY = r;
      endY = -r;
    } else {
      startY = isMobile ? -50 : -90;
      endY = isMobile ? 15 : 30;
    }
    tl.fromTo(photo, { y: startY }, { y: endY, duration: 0.45 }, 0.15);
  });

  // ════════════════════════════════════════════════════════════════════════
  // COMMON BRANCH (desktop + mobile) — About 2 curtain reveal
  // ════════════════════════════════════════════════════════════════════════
  if (hasAboutChapter && about2Layer) {
    // --- Plateau 0.60 → 0.78 : About 1 fully visible, reading breathing room ---

    // Phase A — About 2 curtain horizontal (chapter reveal)
    // The center slit opens vertically (top + bottom edges recede) revealing
    // About 2 (Monte Carlo photo + dark overlay + cream prose) above About 1.
    tl.fromTo(
      about2Layer,
      { clipPath: "inset(50% 0 50% 0)" },
      { clipPath: "inset(0% 0 0% 0)", duration: 0.10, ease: "power2.inOut" },
      0.85
    );

    // Parallax — photo scrolls bottom-to-top continuously across About 2.
    // Image element is 200% of section height; yPercent -45 traverses ~90%
    // of the image. Spans 0.85 → 1.17 (duration 0.32). Animation ends at
    // the exact moment Services starts to cover About 2, so the image is
    // in constant motion until the next transition (no dead-air plateau).
    // Shortened from 0.52 to tighten the About 2 → Services transition —
    // the parallax phase felt too long on mobile.
    if (about2ParallaxImg) {
      tl.fromTo(
        about2ParallaxImg,
        { yPercent: 0 },
        { yPercent: -45, duration: 0.32, ease: "sine.inOut" },
        0.85
      );
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // DESKTOP BRANCH (≥640px) — phases follow About 2 plateau
  // ════════════════════════════════════════════════════════════════════════
  if (!isMobile) {
    // Phase 4 — Services circle reveal from bottom-right corner
    if (servicesLayer) {
      tl.fromTo(
        servicesLayer,
        { clipPath: "circle(0% at 100% 100%)" },
        { clipPath: "circle(150% at 100% 100%)", duration: 0.2 },
        1.17
      );
    }

    // Phase 5 — Services text reveal (elaborate, same pattern as About):
    //   - servicesLines (eyebrow + h2 spans + ul items) get container fade-up
    //   - H2 title words mask-reveal
    //   - Each item: container fade + title words mask-reveal + body fade-slide
    tl.to(
      servicesLines,
      { opacity: 1, y: 0, stagger: 0.04, duration: 0.16, ease: "power2.out" },
      1.27
    );
    if (servicesH2Words.length > 0) {
      tl.to(
        servicesH2Words,
        {
          yPercent: 0,
          stagger: 0.013,
          duration: 0.24,
          ease: "power3.out",
        },
        1.30
      );
    }
    servicesItemList.forEach((item, idx) => {
      const itemStart = 1.38 + idx * 0.04;
      const words = servicesItemTitleWords[idx];
      const body = servicesItemBodies[idx];
      tl.to(
        item,
        { opacity: 1, y: 0, duration: 0.22, ease: "power2.out" },
        itemStart
      );
      if (words.length > 0) {
        tl.to(
          words,
          {
            yPercent: 0,
            stagger: 0.012,
            duration: 0.22,
            ease: "power3.out",
          },
          itemStart + 0.04
        );
      }
      if (body) {
        tl.to(
          body,
          { opacity: 1, y: 0, duration: 0.20, ease: "power2.out" },
          itemStart + 0.12
        );
      }
    });

    // Plateau — progress ring fills (foreshadow next section)
    if (servicesProgressRing) {
      tl.to(
        servicesProgressRing,
        { strokeDashoffset: 0, duration: 0.38, ease: "none" },
        1.66
      );
    }

    // Phase 6 — Projects letter-mask `+` reveal
    if (hasDesktopProjects && projectsLayer) {
      tl.fromTo(
        projectsLayer,
        { maskSize: "0%", webkitMaskSize: "0%" },
        {
          maskSize: "1500%",
          webkitMaskSize: "1500%",
          duration: 0.3,
          ease: "power2.out",
        },
        2.04
      );
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // MOBILE BRANCH (<640px) — phases follow About 2 plateau
  // ════════════════════════════════════════════════════════════════════════
  if (hasMobileTransitions && servicesMobileLayer && projectsMobileCoverLayer) {
    // Phase 4 — services-mobile clip-path circle (transition 1)
    tl.fromTo(
      servicesMobileLayer,
      { clipPath: "circle(0% at 100% 100%)" },
      { clipPath: "circle(150% at 100% 100%)", duration: 0.10 },
      1.19
    );

    // Mobile Phase 4 (cont.) — Panel 0 elaborate reveal :
    //   - Header (eyebrow + count) blur-fade-down
    //   - Huge label number blur-fade-scale-up (cinematic centerpiece arrival)
    //   - Title words mask-reveal (word-by-word cascade)
    //   - Body blur-fade-slide
    //   - Footer (accent + hint) fade-slide
    // Panel 0 only — cards 1 and 2 internal elements stay at final state;
    // they get revealed via the blur+opacity crossfades in Phases 6 and 8.
    if (servicesMobileFirstHeader) {
      tl.to(
        servicesMobileFirstHeader,
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.22,
          ease: "power2.out",
        },
        1.21
      );
    }
    if (servicesMobileFirstLabel) {
      tl.to(
        servicesMobileFirstLabel,
        {
          opacity: 1,
          scale: 1,
          filter: "blur(0px)",
          duration: 0.32,
          ease: "power3.out",
        },
        1.23
      );
    }
    if (servicesMobileFirstTitleWords.length > 0) {
      tl.to(
        servicesMobileFirstTitleWords,
        {
          yPercent: 0,
          stagger: 0.015,
          duration: 0.26,
          ease: "power3.out",
        },
        1.27
      );
    }
    if (servicesMobileFirstBody) {
      tl.to(
        servicesMobileFirstBody,
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.24,
          ease: "power2.out",
        },
        1.32
      );
    }
    if (servicesMobileFirstFooter) {
      tl.to(
        servicesMobileFirstFooter,
        { opacity: 1, y: 0, duration: 0.20, ease: "power2.out" },
        1.35
      );
    }

    // Hide all layers below services-mobile (Hero z-10 + About z-20 + About2)
    // once the clip-reveal is complete. From timeline 1.49 onward, services-mobile
    // fully covers them. The fade is invisible at this point but prevents any
    // reveal of underlying layers during Phase 10 push-stack (where the scale
    // 0.96 + yPercent -15 opens thin gaps around services-mobile). Fading these
    // to 0 lets the gaps reveal the body bg (cream) — matching services-mobile.
    const layersToHide: HTMLElement[] = [heroLayer, aboutLayer];
    if (about2Layer) layersToHide.push(about2Layer);
    tl.to(layersToHide, { opacity: 0, duration: 0.05 }, 1.34);

    // --- Plateau 1.55 → 1.70 : Panel 0 fully revealed + still on screen ---
    // Gives the user ~95% of viewport scroll on mobile (~1 swipe) to read
    // the full label / title / body before the next crossfade starts.

    // Phase 6 — crossfade axis 0 → 1 (blur + opacity)
    // Outgoing card 0 blurs as it fades out; incoming card 1 sharpens as it
    // fades in. Cards 1 and 2 had initial filter blur(10px) set above so the
    // fade-in interpolates from blurry to sharp.
    tl.to(
      axisCards[0],
      { opacity: 0, filter: "blur(10px)", duration: 0.06 },
      1.70
    );
    tl.to(
      axisCards[1],
      { opacity: 1, filter: "blur(0px)", duration: 0.06 },
      1.70
    );

    // --- Plateau 1.76 → 1.91 : Panel 1 visible, reading breathing room ---

    // Phase 8 — crossfade axis 1 → 2 (blur + opacity)
    tl.to(
      axisCards[1],
      { opacity: 0, filter: "blur(10px)", duration: 0.06 },
      1.91
    );
    tl.to(
      axisCards[2],
      { opacity: 1, filter: "blur(0px)", duration: 0.06 },
      1.91
    );

    // --- Plateau 1.97 → 2.12 : Panel 2 visible, reading breathing room ---

    // Phase 10 — push-stack (transition 2)
    // Services-mobile recedes (yPercent + scale), cover arrives from below.
    tl.to(
      servicesMobileLayer,
      { yPercent: -15, scale: 0.96, duration: 0.10, ease: "power2.in" },
      2.12
    );
    tl.fromTo(
      projectsMobileCoverLayer,
      { yPercent: 100 },
      { yPercent: 0, duration: 0.10, ease: "power2.out" },
      2.12
    );
  }

  ScrollTrigger.create({
    trigger: stack,
    start: "top top",
    end: pinDistance,
    pin: true,
    scrub: 1,
    anticipatePin: 1,
    animation: tl,
    onUpdate: () => {
      // Mobile-only : highlight ribbon tab matching the visible axis card.
      // Crossfades sit at timeline times 1.55 (axis 0→1) and 1.65 (axis 1→2).
      if (hasMobileTransitions && axisTabs.length >= 3) {
        const t = tl.time();
        let activeIdx = 0;
        if (t >= 1.65) activeIdx = 2;
        else if (t >= 1.55) activeIdx = 1;
        axisTabs.forEach((tab, i) => {
          tab.setAttribute(
            "data-active",
            i === activeIdx ? "true" : "false"
          );
        });
      }
    },
  });
}
