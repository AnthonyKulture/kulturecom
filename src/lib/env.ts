/**
 * Tiny shared environment checks. Centralizes the media queries that were
 * repeated verbatim across the animation modules so the reduced-motion and
 * mobile-breakpoint strings live in exactly one place.
 *
 * NB: the cinematic stage uses a different `(max-width: 767px)` threshold and
 * ServicesTrail/Nav attach `(min-width: 640px)` change-listeners — those are
 * intentionally NOT funneled through here (different semantics).
 */

/** True when the user has requested reduced motion. */
export const prefersReducedMotion = (): boolean =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** True on the mobile layout (< 640px), matching Tailwind's `sm` breakpoint. */
export const isMobileViewport = (): boolean =>
  window.matchMedia("(max-width: 639px)").matches;
