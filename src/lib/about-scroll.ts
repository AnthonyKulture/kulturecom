/**
 * Screen orchestration — pinned screen-stack for About 2 → Contact.
 *
 * Hero + the About service teasers are normal-flow above; the CinematicScroll
 * immersive sequence CROSS-DISSOLVES into the calm Promesse photo (a fixed z:-1
 * layer, [data-promesse-photo], driven by cinematic-scroll.ts) and releases into
 * this stack. The stack is TRANSPARENT, so that held photo is the background; this
 * module only writes the text in over it, then reveals Contact.
 *
 *    Parallax (0   → 65%):  the tall calm photo travels from its TOP to its BOTTOM (yPercent
 *                           0 → -48), linear — "au rythme du scroll".
 *    Write-in (0   → 18%):  About 2 text ([data-about2-reveal] blocks) fades + rises
 *                           in over the held photo — "le texte Promesse s'écrit".
 *    --       (14  → 45%):  plateau — the "return to calm" message is read.
 *    Reveal   (45  → 65%):  CONTACT circle reveal (clip-path bottom-right) — the
 *                           SAME transition that used to reveal Services.
 *    Dwell    (65  → 100%): contact held before the pin releases → footer.
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
import { prefersReducedMotion, isMobileViewport } from "./env";

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
  // Contact layer — revealed over About 2 with the circle clip-path (the
  // transition that used to bring in Services).
  const ctaLayer = document.querySelector<HTMLElement>(
    "[data-screen-layer='cta']"
  );

  if (!stack || !about2Layer) return;

  // About 2 text blocks — they write in over the held Promesse photo once the stack pins (the
  // photo is the fixed [data-promesse-photo] layer the cylinder cross-dissolves into; this About 2
  // layer is transparent). The scrim is baked into the photo layer (fades in WITH the photo), so
  // there's no separate dark filter to animate here.
  const about2Reveal = Array.from(
    about2Layer.querySelectorAll<HTMLElement>("[data-about2-reveal]")
  );
  // The photo layer (opacity owned by cinematic-scroll.ts) + its tall inner image, which we
  // PARALLAX vertically: it travels from the top of the photo toward the bottom "au rythme du
  // scroll" as the message is read. The image is h-[200%], so a big yPercent drift shows no edge.
  const promessePhoto = document.querySelector<HTMLElement>("[data-promesse-photo]");
  const promessePhotoImg = document.querySelector<HTMLElement>("[data-promesse-photo-img]");

  const reduced = prefersReducedMotion();
  const isMobile = isMobileViewport();

  if (reduced) {
    gsap.set(about2Reveal, { opacity: 1, y: 0 });
    // cinematic-scroll.ts skips the cross-dissolve under reduced-motion, so show the photo here.
    if (promessePhoto) gsap.set(promessePhoto, { opacity: 1 });
    if (promessePhotoImg) gsap.set(promessePhotoImg, { yPercent: -24 });
    if (ctaLayer) ctaLayer.style.clipPath = "circle(150% at 100% 100%)";
    return;
  }

  // Initial states — text hidden (writes in once the stack pins); photo at the TOP of its travel;
  // circle closed.
  gsap.set(about2Reveal, { opacity: 0, y: 32 });
  if (promessePhotoImg) gsap.set(promessePhotoImg, { yPercent: 0 });
  if (ctaLayer) gsap.set(ctaLayer, { clipPath: "circle(0% at 100% 100%)" });

  const tl = gsap.timeline({ defaults: { ease: "none" } });

  // Parallax — the tall photo travels from its TOP (yPercent 0) toward its BOTTOM (-48) across the
  // read, linear "au rythme du scroll". The h-[200%] image means -48% never exposes an edge. It
  // runs over [0, 0.65] so the full travel is seen before the Contact circle covers the photo.
  if (promessePhotoImg) {
    tl.fromTo(
      promessePhotoImg,
      { yPercent: 0 },
      { yPercent: -48, duration: 0.65, ease: "none" },
      0
    );
  }

  // Write-in — the Promesse text blocks fade + rise in over the photo, staggered, right as the
  // stack pins. "le texte Promesse s'écrit" over the calm image.
  if (about2Reveal.length > 0) {
    tl.to(
      about2Reveal,
      { opacity: 1, y: 0, duration: 0.14, stagger: 0.05, ease: "power3.out" },
      0.04
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
    // Recompute the pin span on refresh (URL-bar/resize, late font/layout shifts) so a
    // fast scroll never lands on a stale pin geometry — matches every other trigger.
    invalidateOnRefresh: true,
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
    const lenis = window.__lenis;
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
      const link = (e.target as Element | null)?.closest<HTMLAnchorElement>(
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
