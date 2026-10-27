/**
 * Fade-up on scroll for `[data-reveal]` blocks (IntersectionObserver). Content
 * stays visible without JS or with reduced motion: the hidden state only
 * applies once `html.reveal-on` is set here.
 */
// How far ahead (s of scroll) a fast scroll reveals what it is about to show:
// the browser scrolls on its own, ahead of the page's frames, so a block
// found coming in only once it is on screen would show there empty a frame.
const LEAD = 0.15;
const FADE = 800; // ms: the fade (global.css)

export function initReveal(): void {
  if (!("IntersectionObserver" in window)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const blocks = document.querySelectorAll<HTMLElement>("[data-reveal]");
  if (!blocks.length) return;
  const waiting = new Set<Element>();
  const fading = new Map<Element, number>(); // revealed with a fade, since (ms)
  // A block that only comes in once it is well up the screen (a fast
  // scroll) is simply there, with no fade (`data-instant`, for two frames):
  // fading in, it would leave the screen empty a moment.
  const instant = (b: Element): void => {
    b.setAttribute("data-instant", "");
    requestAnimationFrame(() => requestAnimationFrame(() => b.removeAttribute("data-instant")));
  };
  const reveal = (b: Element, now: boolean): void => {
    if (now) instant(b);
    else fading.set(b, performance.now());
    b.setAttribute("data-revealed", "");
    waiting.delete(b);
    io.unobserve(b);
  };
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) reveal(e.target, e.target.getBoundingClientRect().top < 0.6 * window.innerHeight);
      }
    },
    { rootMargin: "0px 0px 10% 0px" },
  );
  // A scroll that takes a block well up the screen, or past it, in one go
  // (a flick) is checked on the scroll itself, in the frame it shows: the
  // observer would only tell a frame or two later, the block still empty.
  // The faster it goes, the further below the screen it looks (a block found
  // there fades in as usual); and a block it has already taken well up the
  // screen, found there or still fading in, is there at once.
  let lastY = window.scrollY;
  let lastT = performance.now();
  const late = (): void => {
    const t = performance.now();
    const y = window.scrollY;
    const ahead = Math.max(0, ((y - lastY) / Math.max(1, t - lastT)) * 1000 * LEAD);
    lastY = y;
    lastT = t;
    const h = window.innerHeight;
    for (const b of waiting) {
      const top = b.getBoundingClientRect().top;
      if (top < h + ahead) reveal(b, top < 0.6 * h);
    }
    for (const [b, since] of fading) {
      if (t - since > FADE) fading.delete(b);
      else if (b.getBoundingClientRect().top < 0.6 * h) {
        fading.delete(b);
        instant(b);
      }
    }
    if (!waiting.size && !fading.size) window.removeEventListener("scroll", late);
  };
  // Blocks already on screen are marked first, so nothing visible blinks out.
  blocks.forEach((b) => {
    if (b.getBoundingClientRect().top < window.innerHeight) b.setAttribute("data-revealed", "");
    else {
      waiting.add(b);
      io.observe(b);
    }
  });
  if (waiting.size) window.addEventListener("scroll", late, { passive: true });
  // A jump (home-seq.ts) flies over the page, or lands in one step: whatever
  // it passes is simply there. Home goes up; the others (End, the contact
  // CTA) down, to the foot of the page.
  window.addEventListener("seq:jump", (e) => {
    const up = (e as CustomEvent).detail === "home";
    for (const b of waiting) {
      const r = b.getBoundingClientRect();
      if (up ? r.bottom <= 0 : r.top >= window.innerHeight) reveal(b, true);
    }
  });
  document.documentElement.classList.add("reveal-on");
}
