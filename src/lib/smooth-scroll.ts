/**
 * Lenis smooth-scroll — lerps the native scroll position so a hard wheel flick
 * becomes a bounded velocity. This is what stops the scrubbed GSAP timelines
 * from "skipping" on fast scroll (the desync / flash bug): the scroll position
 * can no longer jump several hundred px in one frame, so a `scrub: 1` timeline
 * always has a continuous value to catch up to.
 *
 * Touch is also routed through Lenis (`syncTouch`, tuned conservative) to BOUND
 * the mobile fling velocity — a fast flick can no longer out-run the scrubbed
 * timelines or blow past a pinned sequence before it plays. Costs some INP (touch
 * goes through JS); revert `syncTouch:false` in the init below if it regresses.
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
import { prefersReducedMotion } from "./env";

gsap.registerPlugin(ScrollTrigger);

export function initSmoothScroll(): void {
  if (typeof window === "undefined") return;
  if (prefersReducedMotion()) return;

  // `lerp: 0.1` bounds the DESKTOP wheel/keyboard/scrollbar velocity (Lenis drives
  // those) so a hard flick can't make the scrubbed timelines skip. MOBILE touch was
  // left native (`syncTouch` off) — but a fast fling then out-runs the `scrub:1`
  // timelines and blows PAST a pinned sequence (Hero, screen-stack) before it can
  // play, and races ahead of the instant render-gates → coupe sèche / flash.
  // Route touch through Lenis to BOUND the fling: the scroll position lerps toward
  // the finger (capping per-frame travel and stretching the fling over a longer,
  // controlled duration), so the timelines + gates stay synced to what's on screen.
  // Tuned CONSERVATIVE to stay close to the native feel (syncTouchLerp ≈ the wheel
  // lerp) — this is the "plafonner la vélocité" choice, not heavy glide. The wheel +
  // touch multipliers sit at 0.9 ("modéré"): one notch / one fling injects ~10% less
  // travel, so a violent gesture can't shove a giant progress delta through the
  // pinned hero scrub (the saccade). Lower them further (~0.85/0.8) for stronger
  // guidance, or raise the pinned `scrub` — both reduce per-frame deltas, don't
  // over-apply both. `lerp`/`syncTouchLerp` left at 0.1 (they affect the whole-site
  // feel); only tighten those if 0.9 isn't enough.
  // NB: costs some INP (touch goes through JS) — measured; revert `syncTouch:false`
  // if it regresses. Under prefers-reduced-motion Lenis is never created (native).
  const lenis = new Lenis({
    lerp: 0.1,
    wheelMultiplier: 0.9,
    syncTouch: true,
    syncTouchLerp: 0.1,
    touchMultiplier: 0.9,
  });
  // Expose the instance: about-scroll.ts routes the "clic" CTA + #contact links
  // through `window.__lenis.scrollTo` (and falls back to native scroll if absent).
  window.__lenis = lenis;

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
    const link = (e.target as Element | null)?.closest<HTMLAnchorElement>(
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
