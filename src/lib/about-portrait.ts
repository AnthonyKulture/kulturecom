/**
 * Fixed About portrait — the "sticky image" the manifesto statements scroll past.
 *
 * The portrait ([data-about-portrait]) lives OUTSIDE [data-about-wrapper] (whose
 * translateY transform would break position:fixed) and is held FIXED on the
 * right while every About service scrolls past it. DESKTOP ONLY — it is hidden
 * on mobile (AboutPortrait.astro), so this skips its wiring there. We fade it IN
 * as the first service arrives and OUT before the screen-stack, on ABSOLUTE
 * (docTop-based) scroll positions — the services live inside the transformed
 * wrapper, so rect-based triggers would be cached ~50vh off (same reason
 * about-reveal.ts uses docTop()).
 *
 * `prefers-reduced-motion`: no scrub — opacity is toggled on/off across the
 * range so the portrait is simply present (never floating over the Hero or the
 * screen-stack).
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function initAboutPortrait(): void {
  if (typeof window === "undefined") return;

  const portrait = document.querySelector<HTMLElement>("[data-about-portrait]");
  if (!portrait) return;

  // The portrait is DESKTOP-ONLY (hidden on mobile via `hidden md:block` in
  // AboutPortrait.astro); skip all of its scroll wiring on small screens.
  if (window.matchMedia("(max-width: 639px)").matches) return;

  const sections = Array.from(
    document.querySelectorAll<HTMLElement>("[data-about-chapter-section]")
  );
  if (sections.length === 0) return;
  const first = sections[0];
  const last = sections[sections.length - 1];

  // True layout offset via the offsetTop chain — immune to the wrapper's
  // translateY transform (getBoundingClientRect would be ~50vh off at refresh).
  const docTop = (el: HTMLElement): number => {
    let top = 0;
    let node: HTMLElement | null = el;
    while (node) {
      top += node.offsetTop;
      node = node.offsetParent as HTMLElement | null;
    }
    return top;
  };

  // Visible scroll window. The intro (first statement) does NOT enter from the
  // bottom — it arrives via the hero seam at pin-release (≈ docTop(first), the
  // wrapper sits one viewport below the hero). So the portrait fades IN from
  // there, holds across every statement, and fades OUT before the screen-stack
  // (wrapper bottom) reaches the viewport top.
  // Fade IN exactly as the first About section reaches the top — i.e. right when the
  // hero's full-screen transition photo has finished rising off and the About arrives
  // (hero pin release). Starting any earlier overlaps the still-present photo. Fade OUT
  // well before the last section scrolls off, so the portrait never lingers over the
  // revealed cylinder. Both offsets are easy to tune.
  const startY = () => docTop(first);
  const endY = () =>
    docTop(last) + last.offsetHeight - window.innerHeight * 0.85;

  const reduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (reduced) {
    gsap.set(portrait, { opacity: 0 });
    ScrollTrigger.create({
      trigger: first,
      start: startY,
      end: endY,
      invalidateOnRefresh: true,
      onToggle: (self) =>
        gsap.set(portrait, { opacity: self.isActive ? 1 : 0 }),
    });
    return;
  }

  // Initial state. The portrait floats free on the right, so a subtle
  // scale/translate "settle" on entry reads as intentional motion.
  gsap.set(portrait, {
    opacity: 0,
    scale: 1.04,
    y: () => window.innerHeight * 0.04,
  });

  const tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: first,
      start: startY,
      end: endY,
      scrub: 1,
      invalidateOnRefresh: true,
    },
  });

  // Arrival → hold → departure. The hold pad (0.76) keeps the scrub mapping
  // linear to scroll across the whole window.
  tl.to(
    portrait,
    { opacity: 1, scale: 1, y: 0, duration: 0.12, ease: "power2.out" },
    0
  );
  tl.to({}, { duration: 0.76 }, 0.12);
  tl.to(
    portrait,
    { opacity: 0, scale: 1.02, duration: 0.12, ease: "power2.in" },
    0.88
  );

  ScrollTrigger.refresh();
}
