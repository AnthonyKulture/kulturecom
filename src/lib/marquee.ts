/**
 * A slow, endless row: `track` holds its items twice and glides left at a
 * steady pace, wrapping at half its width. It stops on hover, on keyboard
 * focus, with the pause button, and while `root` is off screen. With reduced
 * motion nothing runs (the CSS turns the row into a strip to swipe) and the
 * button is hidden.
 */
export function initMarquee(root: HTMLElement, track: HTMLElement, pauseBtn: HTMLButtonElement, speed = 28): void {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    pauseBtn.hidden = true;
    return;
  }
  let x = 0;
  let last = 0;
  let raf = 0;
  let visible = false;
  let hovered = false;
  let paused = false;

  const frame = (now: number): void => {
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    if (!hovered && !paused) x -= speed * dt;
    const half = track.scrollWidth / 2;
    if (half > 0 && -x >= half) x += half;
    track.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
    raf = visible ? requestAnimationFrame(frame) : 0;
  };
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !raf) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  }).observe(root);

  const viewport = track.parentElement!;
  viewport.addEventListener("pointerenter", () => (hovered = true));
  viewport.addEventListener("pointerleave", () => (hovered = false));
  viewport.addEventListener("focusin", () => (hovered = true));
  viewport.addEventListener("focusout", () => (hovered = false));
  pauseBtn.addEventListener("click", () => {
    paused = !paused;
    pauseBtn.setAttribute("aria-pressed", String(paused));
    pauseBtn.textContent = (paused ? pauseBtn.dataset.labelPlay : pauseBtn.dataset.labelPause) ?? "";
  });
}
