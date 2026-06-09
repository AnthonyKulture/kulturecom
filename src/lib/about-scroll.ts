/**
 * Screen orchestration — pinned screen-stack for About 2 → Contact.
 *
 * Hero + the About service teasers are normal-flow above; the CinematicScroll
 * immersive sequence pins and releases into this stack. The stack then pins for
 * ONE continuous transition:
 *
 *    Phase A  (0   → 10%):  ABOUT 2 curtain — clip-path inset(50% 0) → inset(0)
 *    Parallax (0   → 55%):  About 2 photo yPercent 0 → -45 (sine.inOut)
 *    --       (10  → 45%):  plateau — the "return to calm" message is read
 *    Reveal   (45  → 65%):  CONTACT circle reveal (clip-path bottom-right) —
 *                           the SAME transition that used to reveal Services
 *    Dwell    (65  → 100%): contact held before the pin releases → footer
 *
 * Services + Projects were moved off the homepage (future standalone pages), so
 * the old multi-layer desktop/mobile branches are gone — one timeline now.
 *
 * The function name is preserved for the existing `<script>` import in index.astro.
 *
 * `prefers-reduced-motion` → states immediately revealed, no pin.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Mobile browsers grow/shrink the viewport as the URL bar hides/shows on
// scroll — each height change fires a resize that would `refresh()` every
// ScrollTrigger mid-scroll, snapping pinned/fixed elements to a new position.
// `ignoreMobileResize` makes ScrollTrigger disregard those URL-bar-only height
// changes (still refreshes on a real width change / orientation flip). Set ONCE
// here (this init runs first) so it applies to every trigger across the page.
ScrollTrigger.config({ ignoreMobileResize: true });

// Note : Chrome rubber-band scroll-back is handled via CSS `overscroll-behavior: none`
// on html/body (src/styles/global.css). `ScrollTrigger.normalizeScroll(true)` is
// intentionally NOT enabled — it costs ~80ms of INP by replacing native scroll with
// a JS handler, and the CSS-only fix already prevents Chrome's reverse-scroll bug.

// Pin distance (ScrollTrigger `end`). Short now that the stack is only About 2 +
// Contact; mobile gets a touch more so the message has reading room. Tune live.
const PIN_DISTANCE = { mobile: "+=240%", desktop: "+=200%" } as const;

// Timeline time at which the contact is comfortably revealed — used to land the
// "clic" CTA and the #contact nav/footer links on the contact, not on About 2.
const CONTACT_REVEAL_TIME = 0.7;

export function initAboutScroll(): void {
  if (typeof window === "undefined") return;

  const stack = document.querySelector<HTMLElement>("[data-screen-stack]");
  const about2Layer = document.querySelector<HTMLElement>(
    "[data-screen-layer='about2']"
  );
  // Dark backdrop behind About 2 — makes its clip-path curtain part from black
  // instead of the stack's cream base.
  const about2ParallaxImg = document.querySelector<HTMLImageElement>(
    "[data-about-parallax]"
  );
  // Contact layer — revealed over About 2 with the circle clip-path (the
  // transition that used to bring in Services).
  const ctaLayer = document.querySelector<HTMLElement>(
    "[data-screen-layer='cta']"
  );

  if (!stack || !about2Layer) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = window.matchMedia("(max-width: 639px)").matches;

  if (reduced) {
    about2Layer.style.clipPath = "inset(0 0 0 0)";
    if (about2ParallaxImg) gsap.set(about2ParallaxImg, { yPercent: -22 });
    if (ctaLayer) ctaLayer.style.clipPath = "circle(150% at 100% 100%)";
    return;
  }

  // Initial states.
  gsap.set(about2Layer, { clipPath: "inset(50% 0 50% 0)" });
  if (about2ParallaxImg) gsap.set(about2ParallaxImg, { yPercent: 0 });
  if (ctaLayer) gsap.set(ctaLayer, { clipPath: "circle(0% at 100% 100%)" });

  const tl = gsap.timeline({ defaults: { ease: "none" } });

  // Phase A — About 2 curtain reveal (entry of the pinned stack).
  tl.fromTo(
    about2Layer,
    { clipPath: "inset(50% 0 50% 0)" },
    { clipPath: "inset(0% 0 0% 0)", duration: 0.1, ease: "power2.inOut" },
    0
  );

  // Parallax — peaceful photo scrolls bottom-to-top across About 2, lingering
  // through the reading plateau.
  if (about2ParallaxImg) {
    tl.fromTo(
      about2ParallaxImg,
      { yPercent: 0 },
      { yPercent: -45, duration: 0.55, ease: "sine.inOut" },
      0
    );
  }

  // Contact circle reveal — bottom-right corner, identical to the old
  // About 2 → Services transition. Starts after a reading plateau (0.10–0.45).
  if (ctaLayer) {
    tl.fromTo(
      ctaLayer,
      { clipPath: "circle(0% at 100% 100%)" },
      { clipPath: "circle(150% at 100% 100%)", duration: 0.2 },
      0.45
    );
  }

  // Pad to 1.0 so the revealed contact dwells before the pin releases → footer.
  tl.to({}, { duration: 0.35 }, 0.65);

  const mainTrigger = ScrollTrigger.create({
    trigger: stack,
    start: "top top",
    end: isMobile ? PIN_DISTANCE.mobile : PIN_DISTANCE.desktop,
    pin: true,
    scrub: 1,
    anticipatePin: 1,
    animation: tl,
  });

  // === Land on the revealed Contact ===
  // The "clic" CTA in About 2 and the nav/footer #contact links must scroll to
  // where the contact is revealed (inside the pin), not to the stack top (which
  // shows About 2). Map CONTACT_REVEAL_TIME → scroll pixel via the pin span.
  const contactRevealY = () =>
    mainTrigger.start +
    (CONTACT_REVEAL_TIME / tl.duration()) *
      (mainTrigger.end - mainTrigger.start);

  const scrollToY = (y: number): void => {
    const lenis = (window as unknown as { __lenis?: { scrollTo: (t: number) => void } })
      .__lenis;
    if (lenis) lenis.scrollTo(y);
    else window.scrollTo({ top: y, behavior: "smooth" });
  };

  const chapterCta = document.querySelector<HTMLElement>(
    "[data-about-chapter-cta]"
  );
  if (chapterCta) {
    chapterCta.addEventListener("click", () => scrollToY(contactRevealY()));
  }

  // Intercept same-page #contact links in CAPTURE phase so we beat the generic
  // anchor handler in smooth-scroll.ts (which would scroll to the stack top).
  document.addEventListener(
    "click",
    (e) => {
      const link = (e.target as HTMLElement | null)?.closest<HTMLAnchorElement>(
        "a[href]"
      );
      if (!link) return;
      let url: URL;
      try {
        url = new URL(link.href, window.location.href);
      } catch {
        return;
      }
      if (url.pathname !== window.location.pathname || url.hash !== "#contact") {
        return;
      }
      e.preventDefault();
      e.stopImmediatePropagation();
      scrollToY(contactRevealY());
    },
    true
  );
}
