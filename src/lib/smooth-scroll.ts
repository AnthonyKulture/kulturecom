/**
 * Lenis smooth-scroll — lerps the native scroll position so a hard wheel flick
 * becomes a bounded velocity. This is what stops the scrubbed GSAP timelines
 * from "skipping" on fast scroll (the desync / flash bug): the scroll position
 * can no longer jump several hundred px in one frame, so a `scrub: 1` timeline
 * always has a continuous value to catch up to.
 *
 * Touch stays NATIVE (`syncTouch` left off) so mobile INP is unaffected — Lenis
 * only smooths the desktop wheel. Mobile (native touch) smoothness comes from
 * the separately-lightened blur work (manifesto blur moved to the container,
 * hero seam blur reduced), not from a JS scroll handler.
 *
 * Integration follows GSAP's official pattern: Lenis drives `ScrollTrigger.update`
 * on its scroll event, and ONE shared rAF (`gsap.ticker`) advances Lenis;
 * `lagSmoothing(0)` keeps the two in lockstep so the scrub never falls behind.
 * `ScrollTrigger.normalizeScroll` stays OFF (Lenis replaces that role).
 *
 * Disabled under `prefers-reduced-motion` — native scroll is used, and the CSS
 * `scroll-behavior: smooth` fallback (global.css) still smooths anchor jumps.
 */
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function initSmoothScroll(): void {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const lenis = new Lenis({ lerp: 0.1 });

  // Keep ScrollTrigger in sync with Lenis' interpolated scroll position.
  lenis.on("scroll", ScrollTrigger.update);

  // Single rAF for both: the GSAP ticker advances Lenis (expects ms).
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  // Pin spacers (about-scroll.ts) are injected AFTER this init and change the
  // document height; re-measure Lenis whenever ScrollTrigger refreshes.
  ScrollTrigger.addEventListener("refresh", () => lenis.resize());

  // In-page anchors (nav/footer "#contact" / "#projects", skip-link
  // "#main-content"): native smooth-scroll is disabled while Lenis is active
  // (.lenis-smooth forces scroll-behavior:auto), so route same-page hash links
  // through lenis.scrollTo to keep them smooth. The hrefs render as
  // `/#contact` / `/en/#contact`, so we compare the resolved pathname rather
  // than matching `href^="#"`.
  document.addEventListener("click", (e) => {
    const link = (e.target as HTMLElement | null)?.closest<HTMLAnchorElement>(
      "a[href]"
    );
    if (!link) return;
    const url = new URL(link.href, window.location.href);
    if (url.pathname !== window.location.pathname) return;
    if (!url.hash || url.hash === "#") return;
    const dest = document.querySelector<HTMLElement>(url.hash);
    if (!dest) return;
    e.preventDefault();
    lenis.scrollTo(dest);
  });
}
