/**
 * Hero image trail — while the pointer moves over the hero, a project slide pops
 * up under it every 100 ms (random tilt, scale 1 → 1.2 → 0), then is removed.
 *
 * Vanilla port of the former React + framer-motion island (~320 KB of JS to
 * download, parse and hydrate). Same look and timing, but: no framework, no
 * permanent rAF loop (one frame is scheduled per pointer move), the animation
 * runs on the compositor (WAAPI transform), and it idles once the hero has left
 * the viewport. ≥ 640px only, like before (the container is `hidden sm:block`).
 */

const SLIDES = Array.from(
  { length: 20 },
  (_, i) => `/hero-slides/slide-${String(i + 1).padStart(2, "0")}.webp`
);
const INTERVAL = 100; // ms between two spawns
const ROTATION_RANGE = 15; // ± degrees
const DURATION = 600; // 100 ms grow (circOut) + 500 ms shrink (circIn)
const CIRC_OUT = "cubic-bezier(0.075, 0.82, 0.165, 1)";
const CIRC_IN = "cubic-bezier(0.6, 0.04, 0.98, 0.335)";

export function initImageTrail(): void {
  const container = document.querySelector<HTMLElement>("[data-image-trail]");
  const hero = document.querySelector<HTMLElement>("[data-hero]");
  const layer = container?.firstElementChild as HTMLElement | null;
  if (!container || !hero || !layer) return;

  const wide = window.matchMedia("(min-width: 640px)");
  let heroVisible = true;
  new IntersectionObserver(([entry]) => {
    heroVisible = entry.isIntersecting;
  }).observe(hero);

  let clientX = 0;
  let clientY = 0;
  let lastX = NaN;
  let lastY = NaN;
  let lastSpawn = -Infinity;
  let index = 0;
  let queued = false;

  const spawn = (x: number, y: number): void => {
    const item = document.createElement("div");
    item.className = "absolute";
    item.style.left = `${x}px`;
    item.style.top = `${y}px`;
    item.innerHTML = `<div class="relative h-32 w-24 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-sm sm:h-40 sm:w-32 md:h-48 md:w-36"><img src="${SLIDES[index]}" alt="" class="absolute inset-0 block h-full w-full object-cover"></div>`;
    index = (index + 1) % SLIDES.length;
    layer.appendChild(item);

    const r = (Math.random() - 0.5) * ROTATION_RANGE * 2;
    item.animate(
      [
        { transform: `scale(1) rotate(${r}deg)`, easing: CIRC_OUT },
        { transform: `scale(1.2) rotate(${r}deg)`, offset: 100 / DURATION, easing: CIRC_IN },
        { transform: `scale(0) rotate(${r}deg)` },
      ],
      { duration: DURATION }
    ).onfinish = () => item.remove();
  };

  const frame = (time: number): void => {
    queued = false;
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    if (x === lastX && y === lastY) return;
    lastX = x;
    lastY = y;
    if (time - lastSpawn < INTERVAL) return;
    lastSpawn = time;
    spawn(x, y);
  };

  const onMove = (x: number, y: number): void => {
    clientX = x;
    clientY = y;
    if (queued || !heroVisible || !wide.matches) return;
    queued = true;
    requestAnimationFrame(frame);
  };

  window.addEventListener("mousemove", (e) => onMove(e.clientX, e.clientY), { passive: true });
  window.addEventListener(
    "touchmove",
    (e) => onMove(e.touches[0].clientX, e.touches[0].clientY),
    { passive: true }
  );
}
