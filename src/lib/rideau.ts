/**
 * Rideau — a page-transition curtain WITHOUT SPA routing.
 *
 * The site keeps real, full-page navigations on purpose, so the WebGL hero,
 * Lenis, the pinned ScrollTriggers, the preloader and every per-page GSAP
 * script keep initializing exactly as they do today — NOTHING in the animation
 * stack is touched. A single ink panel just masks the reload:
 *
 *   leave  — on an internal link click we preventDefault, sweep the panel UP
 *            from the bottom edge until it covers the viewport, THEN navigate.
 *   enter  — the next document loads with the panel already covering: an inline
 *            <head> script sets `data-rideau="cover"` BEFORE first paint, so the
 *            fresh page paints beneath the panel (no flash), and we sweep it out
 *            through the TOP edge to reveal. Cover-up then reveal-up reads as one
 *            continuous vertical wipe passing through the screen.
 *
 * Coordination with the rest of the page:
 *   - The transition is signalled across the hard navigation by a one-shot
 *     sessionStorage flag (`ap-rideau`). The inline head script consumes it into
 *     the `data-rideau` attribute and clears it immediately, so a failed module
 *     load can never leave the curtain stuck down on the next reload.
 *   - On transition-entries the once-per-session preloader is already
 *     skip-pathed (removed instantly); CSS also hides it under
 *     `data-rideau="cover"` so its cream layer can't flash before the ink panel.
 *   - bfcache: a `pageshow`/persisted restore resets the panel to idle, so the
 *     page you left (restored with the curtain still down) isn't stuck covered.
 *   - prefers-reduced-motion: no interception at all — links navigate natively
 *     and the panel is `display:none`. The inline head script forces idle too.
 */
import gsap from "gsap";
import { prefersReducedMotion } from "./env";

const COVER_MS = 500; // sweep up to cover before navigating
const REVEAL_MS = 560; // sweep out the top to reveal the new page

export function initRideau(): void {
  if (typeof window === "undefined") return;
  if (prefersReducedMotion()) return;

  const root = document.documentElement;
  const panel = document.querySelector<HTMLElement>("[data-rideau-panel]");
  if (!panel) return;

  let navigating = false;

  // ─── Enter: reveal the freshly-loaded page ────────────────────────────
  // The inline head script set `data-rideau="cover"` before paint when we
  // arrived via a transition. Sweep the panel out through the top edge.
  if (root.dataset.rideau === "cover") {
    gsap.set(panel, { transformOrigin: "center top", scaleY: 1 });
    requestAnimationFrame(() => {
      gsap.to(panel, {
        scaleY: 0,
        duration: REVEAL_MS / 1000,
        ease: "power3.inOut",
        onComplete: () => {
          root.dataset.rideau = "idle";
        },
      });
    });
  }

  // ─── Leave: cover, then navigate ──────────────────────────────────────
  document.addEventListener("click", (e) => {
    if (e.defaultPrevented) return; // already handled (e.g. Lenis hash scroll)
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // new tab etc.
    if (navigating) return;

    const link = (e.target as Element | null)?.closest<HTMLAnchorElement>(
      "a[href]"
    );
    if (!link) return;
    if (link.target && link.target !== "_self") return; // _blank
    if (link.hasAttribute("download")) return;
    if (link.getAttribute("rel")?.includes("external")) return;

    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin) return; // external host
    if (url.protocol !== "http:" && url.protocol !== "https:") return; // mailto/tel
    // Same-page (hash / identical) link — let Lenis / native smooth-scroll run.
    if (
      url.pathname === window.location.pathname &&
      url.search === window.location.search
    ) {
      return;
    }

    e.preventDefault();
    navigating = true;
    // Signal the next document to load in its covered state (consumed by the
    // inline <head> script there) so it can sweep the curtain out on arrival.
    try {
      sessionStorage.setItem("ap-rideau", "1");
    } catch {
      /* sessionStorage unavailable — the cover still plays, just no reveal */
    }
    root.dataset.rideau = "leave";
    gsap.set(panel, { transformOrigin: "center bottom", scaleY: 0 });
    gsap.to(panel, {
      scaleY: 1,
      duration: COVER_MS / 1000,
      ease: "power3.inOut",
      onComplete: () => {
        window.location.href = url.href;
      },
    });
  });

  // ─── bfcache restore: never leave the curtain stuck down ──────────────
  window.addEventListener("pageshow", (e) => {
    if (!e.persisted) return;
    navigating = false;
    gsap.killTweensOf(panel);
    gsap.set(panel, { scaleY: 0 });
    root.dataset.rideau = "idle";
  });
}
