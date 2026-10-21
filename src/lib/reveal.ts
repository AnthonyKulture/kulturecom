/**
 * Fade-up on scroll for `[data-reveal]` blocks (IntersectionObserver, no
 * scroll listener). Content stays visible without JS or with reduced motion:
 * the hidden state only applies once `html.reveal-on` is set here.
 */
export function initReveal(): void {
  if (!("IntersectionObserver" in window)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const blocks = document.querySelectorAll<HTMLElement>("[data-reveal]");
  if (!blocks.length) return;
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.setAttribute("data-revealed", "");
        io.unobserve(e.target);
      }
    },
    { rootMargin: "0px 0px -8% 0px" },
  );
  // Blocks already on screen are marked first, so nothing visible blinks out.
  blocks.forEach((b) => {
    if (b.getBoundingClientRect().top < window.innerHeight) b.setAttribute("data-revealed", "");
    else io.observe(b);
  });
  document.documentElement.classList.add("reveal-on");
}
