/**
 * Screen orchestration — pinned screen-stack for About 2 + Services + Projects.
 *
 * Hero and the About manifesto sections are now normal-flow (no pin); they
 * scroll naturally above the pinned stack. The function name is preserved
 * for backwards compat with the existing `<script>` import in index.astro.
 *
 *  ─── DESKTOP (≥640px) — pin +=550% ───
 *
 *    Phase A  (0    → 10%):  ABOUT 2 curtain horizontal (chapter reveal)
 *                            clip-path inset(50% 0) → inset(0)
 *    Parallax (0    → 32%):  About 2 photo yPercent 0 → -45 (sine.inOut)
 *    Phase 4  (32   → 52%):  services circle reveal (clip-path bottom-right)
 *    Phase 5  (42   → 76%):  services text lines stagger reveal
 *    --       (81   → 119%): plateau, progress ring fills (foreshadow)
 *    Phase 6  (119 → 149%):  projects letter-mask `+` reveal
 *
 *  ─── MOBILE (<640px) — pin +=880% ───
 *
 *    Phase A   (0    → 10%): ABOUT 2 curtain
 *    Parallax  (0    → 32%): About 2 photo
 *    Phase 4   (20   → 30%): services-mobile clip-path reveal
 *    Phase 5   (22   → 36%): panel 0 internals (header / label / title / body / footer)
 *    Phase 6   (71   → 77%): crossfade axis 0 → 1
 *    Phase 8   (92   → 98%): crossfade axis 1 → 2
 *    Phase 10  (113 → 123%): push-stack (mobile transition 2)
 *
 *  `prefers-reduced-motion` → all states immediately revealed, no pin.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Mobile browsers grow/shrink the viewport as the URL bar hides/shows on
// scroll — each height change fires a resize that would `refresh()` every
// ScrollTrigger mid-scroll, snapping pinned/fixed elements (e.g. the About
// portrait banner) to a new position. `ignoreMobileResize` makes ScrollTrigger
// disregard those URL-bar-only height changes (still refreshes on a real
// width change / orientation flip). Set ONCE here (this init runs first) so it
// applies to every trigger across the page.
ScrollTrigger.config({ ignoreMobileResize: true });

// Note : Chrome rubber-band scroll-back is handled via CSS `overscroll-behavior: none`
// on html/body (src/styles/global.css). `ScrollTrigger.normalizeScroll(true)` is
// intentionally NOT enabled — it costs ~80ms of INP by replacing native scroll with
// a JS handler, and the CSS-only fix already prevents Chrome's reverse-scroll bug.

// === Timeline pin distances (ScrollTrigger `end` strings) ===
// Tuned for the new (shorter) timeline now that Hero + About 5 chapters live
// in normal flow above the pinned stack. Roughly proportional to the new
// timeline length (desktop ~1.49 ; mobile ~1.23).
const PIN_DISTANCE = {
  mobile: { withProjects: "+=880%", noProjects: "+=300%" },
  desktop: { withProjects: "+=550%", noProjects: "+=200%" },
} as const;

// SVG circle r=46 → circumference = 2 × π × 46 ≈ 289.027.
const PROGRESS_RING_CIRCUMFERENCE = 289.027;

export function initAboutScroll(): void {
  if (typeof window === "undefined") return;

  const stack = document.querySelector<HTMLElement>("[data-screen-stack]");
  const about2Layer = document.querySelector<HTMLElement>(
    "[data-screen-layer='about2']"
  );
  // Dark backdrop behind About 2 — makes its clip-path curtain part from black
  // instead of the stack's cream base. Faded out on mobile alongside About 2
  // (before the push-stack) so it never shows a dark band between the cream
  // Services/Projects panels.
  const about2Dark = document.querySelector<HTMLElement>("[data-about2-dark]");
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

  const servicesLines = Array.from(
    document.querySelectorAll<HTMLElement>("[data-services-line]")
  );
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
  // Mobile axes carousel
  const axisCards = Array.from(
    document.querySelectorAll<HTMLElement>("[data-axis-card]")
  );
  const axisTabs = Array.from(
    document.querySelectorAll<HTMLElement>("[data-axis-tab]")
  );
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

  if (!stack || !about2Layer) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = window.matchMedia("(max-width: 639px)").matches;
  const hasDesktopProjects = !isMobile && projectsLayer !== null;
  const hasMobileTransitions =
    isMobile &&
    servicesMobileLayer !== null &&
    projectsMobileCoverLayer !== null &&
    axisCards.length >= 3;

  if (reduced) {
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
      // 6px (was 14px): mobile uses native touch scroll (no Lenis cushion), so
      // per-frame blur is the mobile jank source — keep the radius modest.
      filter: "blur(6px)",
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
  if (axisCards.length >= 3) {
    // Standby cards sit blurred behind the active one; the crossfade (opacity +
    // blur) below switches them. 4px (was 10px) keeps the mobile per-frame
    // repaint cheap while the opacity crossfade still carries the transition.
    gsap.set(axisCards[0], { filter: "blur(0px)" });
    gsap.set(axisCards[1], { filter: "blur(4px)" });
    gsap.set(axisCards[2], { filter: "blur(4px)" });
  }
  if (servicesProgressRing) {
    gsap.set(servicesProgressRing, { strokeDashoffset: PROGRESS_RING_CIRCUMFERENCE });
  }
  gsap.set(about2Layer, { clipPath: "inset(50% 0 50% 0)" });
  if (about2ParallaxImg) {
    gsap.set(about2ParallaxImg, { yPercent: 0 });
  }
  if (hasMobileTransitions && projectsMobileCoverLayer) {
    gsap.set(projectsMobileCoverLayer, { yPercent: 100 });
  }

  const tl = gsap.timeline({ defaults: { ease: "none" } });

  // ─── Phase A — About 2 curtain reveal (entry of the pinned stack) ───
  tl.fromTo(
    about2Layer,
    { clipPath: "inset(50% 0 50% 0)" },
    { clipPath: "inset(0% 0 0% 0)", duration: 0.10, ease: "power2.inOut" },
    0
  );

  // Parallax — photo scrolls bottom-to-top across About 2.
  if (about2ParallaxImg) {
    tl.fromTo(
      about2ParallaxImg,
      { yPercent: 0 },
      { yPercent: -45, duration: 0.32, ease: "sine.inOut" },
      0
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // DESKTOP BRANCH (≥640px)
  // ════════════════════════════════════════════════════════════════════════
  if (!isMobile) {
    // Phase 4 — Services circle reveal from bottom-right corner
    if (servicesLayer) {
      tl.fromTo(
        servicesLayer,
        { clipPath: "circle(0% at 100% 100%)" },
        { clipPath: "circle(150% at 100% 100%)", duration: 0.2 },
        0.32
      );
    }

    // Phase 5 — Services text reveal (eyebrow + h2 + items cascade)
    tl.to(
      servicesLines,
      { opacity: 1, y: 0, stagger: 0.04, duration: 0.16, ease: "power2.out" },
      0.42
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
        0.45
      );
    }
    servicesItemList.forEach((item, idx) => {
      const itemStart = 0.53 + idx * 0.04;
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
        0.81
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
        1.19
      );
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // MOBILE BRANCH (<640px)
  // ════════════════════════════════════════════════════════════════════════
  if (hasMobileTransitions && servicesMobileLayer && projectsMobileCoverLayer) {
    // Phase 4 — services-mobile clip-path circle (transition 1)
    tl.fromTo(
      servicesMobileLayer,
      { clipPath: "circle(0% at 100% 100%)" },
      { clipPath: "circle(150% at 100% 100%)", duration: 0.10 },
      0.20
    );

    // Phase 5 — Panel 0 elaborate reveal
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
        0.22
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
        0.24
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
        0.28
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
        0.33
      );
    }
    if (servicesMobileFirstFooter) {
      tl.to(
        servicesMobileFirstFooter,
        { opacity: 1, y: 0, duration: 0.20, ease: "power2.out" },
        0.36
      );
    }

    // Hide About 2 (and its dark backdrop) underneath services-mobile once the
    // clip-reveal is complete, so the push-stack scale gap in Phase 10 exposes
    // the CREAM base — not About 2 or a dark band between the cream panels.
    tl.to(
      [about2Layer, about2Dark].filter(Boolean),
      { opacity: 0, duration: 0.05 },
      0.35
    );

    // Phase 6 — crossfade axis 0 → 1 (blur + opacity)
    tl.to(
      axisCards[0],
      { opacity: 0, filter: "blur(4px)", duration: 0.06 },
      0.71
    );
    tl.to(
      axisCards[1],
      { opacity: 1, filter: "blur(0px)", duration: 0.06 },
      0.71
    );

    // Phase 8 — crossfade axis 1 → 2 (blur + opacity)
    tl.to(
      axisCards[1],
      { opacity: 0, filter: "blur(4px)", duration: 0.06 },
      0.92
    );
    tl.to(
      axisCards[2],
      { opacity: 1, filter: "blur(0px)", duration: 0.06 },
      0.92
    );

    // Phase 10 — push-stack (transition 2)
    tl.to(
      servicesMobileLayer,
      { yPercent: -15, scale: 0.96, duration: 0.10, ease: "power2.in" },
      1.13
    );
    tl.fromTo(
      projectsMobileCoverLayer,
      { yPercent: 100 },
      { yPercent: 0, duration: 0.10, ease: "power2.out" },
      1.13
    );
  }

  const mainTrigger = ScrollTrigger.create({
    trigger: stack,
    start: "top top",
    end: pinDistance,
    pin: true,
    scrub: 1,
    anticipatePin: 1,
    animation: tl,
    onUpdate: () => {
      // Mobile-only : highlight ribbon tab matching the visible axis card.
      // Crossfades sit at timeline times 0.70 (axis 0→1) and 0.80 (axis 1→2).
      if (hasMobileTransitions && axisTabs.length >= 3) {
        const t = tl.time();
        let activeIdx = 0;
        if (t >= 0.80) activeIdx = 2;
        else if (t >= 0.70) activeIdx = 1;
        axisTabs.forEach((tab, i) => {
          tab.setAttribute(
            "data-active",
            i === activeIdx ? "true" : "false"
          );
        });
      }
    },
  });

  // === About 2 "clic" CTA — smooth scroll to the Services reveal ===
  // Services clip-circle completes at timeline 0.52 desktop (0.32 + 0.20)
  // and 0.30 mobile (0.20 + 0.10). Map timeline-time → scroll-pixel via
  // the mainTrigger's start/end span.
  const chapterCta = document.querySelector<HTMLElement>(
    "[data-about-chapter-cta]"
  );
  if (chapterCta) {
    chapterCta.addEventListener("click", () => {
      const targetTime = isMobile ? 0.30 : 0.52;
      const ratio = targetTime / tl.duration();
      const y =
        mainTrigger.start + ratio * (mainTrigger.end - mainTrigger.start);
      window.scrollTo({
        top: y,
        behavior: reduced ? "auto" : "smooth",
      });
    });
  }
}
