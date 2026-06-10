/**
 * Projects mobile — simple fade-up batch reveal as cards enter the viewport.
 *
 * Lightweight (no pin, no scrub): each [data-project-card-mobile] starts hidden
 * (opacity 0, translateY 24px) and animates to its natural position when it
 * scrolls into view. Reduced-motion or desktop: bail out, cards stay visible.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion, isMobileViewport } from "./env";

gsap.registerPlugin(ScrollTrigger);

export function initProjectsMobile(): void {
  if (typeof window === "undefined") return;

  const isMobile = isMobileViewport();
  if (!isMobile) return;

  const reduced = prefersReducedMotion();
  const cards = Array.from(
    document.querySelectorAll<HTMLElement>("[data-project-card-mobile]")
  );
  if (cards.length === 0) return;

  if (reduced) {
    gsap.set(cards, { opacity: 1, y: 0 });
    return;
  }

  gsap.set(cards, { opacity: 0, y: 24 });

  ScrollTrigger.batch(cards, {
    start: "top 85%",
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.08,
        ease: "power3.out",
      }),
  });
}
