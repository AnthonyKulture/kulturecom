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

/**
 * SSR per-word splitter for the staggered blur-reveal animation (inspired by
 * 21st.dev's digital-serenity word-appear effect). Each word becomes an
 * inline-block `.word-animate` span with an inline `animation-delay` so the
 * cascade runs without runtime JS scheduling — once the parent receives the
 * `data-words-revealed` attribute, the CSS animations start in sequence.
 *
 * The CSS lives in `src/styles/global.css` (`.word-animate` + `@keyframes
 * word-appear`).
 *
 * @param s        the text to split
 * @param stepMs   delay between consecutive word starts (default 30 ms)
 * @param baseMs   initial delay added to all words (default 0 ms)
 */
export const splitWordsWithDelay = (
  s: string,
  stepMs: number = 30,
  baseMs: number = 0
): string =>
  s
    .split(/\s+/)
    .map((w, i) => {
      const delay = baseMs + i * stepMs;
      return `<span class="word-animate" style="animation-delay:${delay}ms">${w}</span>`;
    })
    .join(" ");
