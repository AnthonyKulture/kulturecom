/**
 * Projects gallery (the work page) — the section pins and the vertical scroll
 * drives the row of projects sideways.
 *
 * Inside the moving row: each picture drifts against the travel (parallax),
 * the outlined numbers drift the other way, and the pictures lean a little
 * with the scroll speed, then settle. The counter and the bar follow the
 * project nearest the middle. Panels off screen at the start uncover as they
 * come in. A pill follows the pointer over the pictures.
 *
 * Reduced motion or no script: no pin, the row scrolls natively with snap
 * (the component's base styles). Phones use ProjectsMobile instead.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function initProjectsGallery(): void {
  const section = document.querySelector<HTMLElement>("[data-gallery]");
  if (!section) return;
  const viewport = section.querySelector<HTMLElement>("[data-gallery-viewport]")!;
  const track = section.querySelector<HTMLElement>("[data-gallery-track]")!;
  const panels = Array.from(section.querySelectorAll<HTMLElement>("[data-gallery-panel]"));
  const now = section.querySelector<HTMLElement>("[data-gallery-now]")!;
  const bar = section.querySelector<HTMLElement>("[data-gallery-bar]")!;
  const cursor = section.querySelector<HTMLElement>("[data-gallery-cursor]")!;
  const projectCount = section.querySelectorAll("[data-gallery-media]").length;

  initCursor(section, cursor);

  const mm = gsap.matchMedia();
  mm.add("(min-width: 640px) and (prefers-reduced-motion: no-preference)", () => {
    section.setAttribute("data-enhanced", "");
    viewport.scrollLeft = 0;

    const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
    const travel = gsap.to(track, { x: () => -distance(), ease: "none" });

    // Which project sits nearest the middle of the screen.
    let centers: number[] = [];
    const measure = () => {
      centers = panels.slice(0, projectCount).map((p) => p.offsetLeft + p.offsetWidth / 2);
    };
    let current = 0;
    const show = (index: number) => {
      if (index === current) return;
      const down = index > current;
      current = index;
      gsap.timeline()
        .to(now, { yPercent: down ? -100 : 100, duration: 0.18, ease: "power2.in" })
        .add(() => { now.textContent = String(index + 1).padStart(2, "0"); })
        .fromTo(now, { yPercent: down ? 100 : -100 }, { yPercent: 0, duration: 0.42, ease: "power3.out" });
    };

    // The pictures lean with the scroll speed, then come back upright.
    const media = gsap.utils.toArray<HTMLElement>("[data-gallery-media]", section);
    const lean = media.map((m) => gsap.quickTo(m, "skewX", { duration: 0.6, ease: "power3.out" }));

    const pin = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: () => `+=${distance()}`,
      pin: true,
      scrub: 0.9,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      animation: travel,
      onRefresh: measure,
      onUpdate: (self) => {
        gsap.set(bar, { scaleX: self.progress });
        const middle = -Number(gsap.getProperty(track, "x")) + viewport.clientWidth / 2;
        let best = 0;
        centers.forEach((c, i) => {
          if (Math.abs(c - middle) < Math.abs(centers[best] - middle)) best = i;
        });
        show(best);
        const skew = gsap.utils.clamp(-4, 4, self.getVelocity() / -400);
        lean.forEach((to) => to(skew));
      },
      onScrubComplete: () => lean.forEach((to) => to(0)),
    });
    measure();

    // Parallax inside the row: pictures against the travel, numbers with it.
    panels.forEach((panel) => {
      const img = panel.querySelector("[data-gallery-img]");
      const num = panel.querySelector("[data-gallery-num]");
      const scrub = {
        trigger: panel,
        containerAnimation: travel,
        start: "left right",
        end: "right left",
        scrub: true,
      };
      if (img) gsap.fromTo(img, { xPercent: 6 }, { xPercent: -6, ease: "none", scrollTrigger: scrub });
      if (num) gsap.fromTo(num, { xPercent: -30 }, { xPercent: 30, ease: "none", scrollTrigger: { ...scrub } });
    });

    // Uncovering: the panels in view at the start together as the section
    // arrives, the others one by one as they come in from the right.
    const width = viewport.clientWidth;
    const first = panels.filter((p) => p.offsetLeft < width);
    const later = panels.filter((p) => p.offsetLeft >= width);
    const parts = (p: HTMLElement) => ({
      media: p.querySelector("[data-gallery-media]"),
      rest: p.querySelectorAll(".pg-text, .pg-num, .pg-end"),
    });
    first.forEach((p, i) => {
      const { media: m, rest } = parts(p);
      const tl = gsap.timeline({
        delay: i * 0.12,
        scrollTrigger: { trigger: section, start: "top 75%", once: true },
      });
      if (m) tl.fromTo(m, { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 1.1, ease: "power4.out" });
      tl.fromTo(rest, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", stagger: 0.06 }, m ? 0.25 : 0);
    });
    later.forEach((p) => {
      const { media: m, rest } = parts(p);
      const tl = gsap.timeline({
        scrollTrigger: { trigger: p, containerAnimation: travel, start: "left 92%", once: true },
      });
      if (m) tl.fromTo(m, { clipPath: "inset(0 0 0 100%)" }, { clipPath: "inset(0 0 0 0%)", duration: 1, ease: "power4.out" });
      tl.fromTo(rest, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", stagger: 0.06 }, m ? 0.2 : 0);
    });

    // A link reached with Tab scrolls the page to its panel instead of letting
    // the browser slide the hidden row on its own.
    const onFocus = (e: FocusEvent) => {
      const panel = (e.target as HTMLElement).closest<HTMLElement>("[data-gallery-panel]");
      if (!panel) return;
      viewport.scrollLeft = 0;
      const target = Math.min(distance(), Math.max(0, panel.offsetLeft - viewport.clientWidth * 0.2));
      const d = distance();
      window.scrollTo({ top: pin.start + (d ? (target / d) * (pin.end - pin.start) : 0), behavior: "auto" });
    };
    section.addEventListener("focusin", onFocus);

    return () => {
      section.removeEventListener("focusin", onFocus);
      section.removeAttribute("data-enhanced");
      gsap.set([track, bar, ...media], { clearProps: "all" });
    };
  });
}

/** The "View project" pill trailing the pointer over the pictures. */
function initCursor(section: HTMLElement, cursor: HTMLElement): void {
  if (!window.matchMedia("(hover: hover)").matches) return;
  // Out of the section: the pin gives it a transform, which would make
  // `position: fixed` follow the section instead of the screen.
  document.body.appendChild(cursor);
  const x = gsap.quickTo(cursor, "x", { duration: 0.45, ease: "power3.out" });
  const y = gsap.quickTo(cursor, "y", { duration: 0.45, ease: "power3.out" });
  section.addEventListener("pointermove", (e) => {
    x(e.clientX);
    y(e.clientY);
    const over = (e.target as HTMLElement).closest("[data-gallery-media]");
    cursor.toggleAttribute("data-on", !!over);
  });
  section.addEventListener("pointerleave", () => cursor.removeAttribute("data-on"));
}
