/**
 * SSR per-word splitter for mask-reveal scroll animations.
 *
 * Wraps each word in nested spans: outer `.split-word` is an inline-block
 * with `overflow: hidden` (the clipping mask); inner `.split-word-inner`
 * holds the word and is what GSAP animates with `yPercent` to slide it
 * up from below the mask. The CSS lives in `src/styles/global.css`
 * (`.split-word` / `.split-word-inner` block).
 *
 * Used SSR-side (Astro frontmatter + `set:html`) so the spans render in
 * the initial HTML and no runtime DOM mutation causes layout reflow
 * before the GSAP timeline starts.
 *
 * Pass `wordClass` to override the outer class when a component uses
 * a parallel utility (e.g. legacy `.about-word`); defaults to
 * `split-word` which is the canonical class.
 */
export const splitTitle = (
  s: string,
  wordClass: string = "split-word"
): string =>
  s
    .split(/\s+/)
    .map(
      (w) =>
        `<span class="${wordClass}"><span class="${wordClass}-inner">${w}</span></span>`
    )
    .join(" ");
