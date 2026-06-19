/**
 * Scroll-driven blur reveal for the About manifesto sections.
 *
 * Each `[data-about-chapter-section]` (5 of them, normal-flow under the
 * Hero) is driven by a SINGLE GSAP timeline scrubbed by ScrollTrigger.
 * The timeline spans the section's full traversal of the viewport
 * (start `top bottom` → end `bottom top`), and inside that range we
 * choreograph 3 phases — chosen so the visibility curve matches the
 * user's spec :
 *
 *   progress 0.00 → 0.30 : INVISIBLE (content below viewport / near 10%
 *                          from the bottom edge)
 *   progress 0.30 → 0.50 : reveal IN  (content rises toward viewport center,
 *                          words gain opacity / lose blur / slide up)
 *   progress 0.50         : PEAK visibility (content centered in viewport)
 *   progress 0.50 → 0.70 : reveal OUT (content rises past center, words
 *                          fade + blur + slide up)
 *   progress 0.70 → 1.00 : INVISIBLE (content near 10% from top edge /
 *                          above viewport)
 *
 *  Math: for a 100vh section, ScrollTrigger maps progress 0 → 1 over a
 *  scroll distance of 200vh (section height + viewport height). At
 *  progress 0.5, the section TOP is at viewport TOP, so the centered
 *  content is at viewport center. Progress 0.3 / 0.7 correspond to the
 *  content center being at 90% / 10% of viewport height respectively —
 *  matching the "disparaît à 10% en haut ou en bas" spec.
 *
 *  `scrub: true` makes everything reversible : scrolling back up plays
 *  the timeline backwards (words re-blur and fall).
 *
 *  `prefers-reduced-motion` bypasses GSAP entirely : words are revealed
 *  instantly via inline gsap.set.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "./env";

gsap.registerPlugin(ScrollTrigger);

export function initAboutReveal(): void {
  if (typeof window === "undefined") return;

  const sections = Array.from(
    document.querySelectorAll<HTMLElement>("[data-about-chapter-section]")
  );
  if (sections.length === 0) return;

  const reduced = prefersReducedMotion();

  if (reduced) {
    // Words carry opacity/transform only now (blur lives on the chapter
    // title/body CONTAINERS, set via gsap below — never reached in this
    // branch, so containers stay un-blurred under reduced motion).
    const allWords = Array.from(
      document.querySelectorAll<HTMLElement>(".about-reveal-word")
    );
    if (allWords.length > 0) {
      gsap.set(allWords, { opacity: 1, y: 0 });
    }
    const allBodyWords = Array.from(
      document.querySelectorAll<HTMLElement>(".about-body-word")
    );
    if (allBodyWords.length > 0) {
      gsap.set(allBodyWords, { opacity: 1, y: 0 });
    }
    const allCtas = Array.from(
      document.querySelectorAll<HTMLElement>("[data-about-svc-cta]")
    );
    if (allCtas.length > 0) {
      gsap.set(allCtas, { opacity: 1, pointerEvents: "auto" });
    }
    // Parallax targets snap to neutral so they don't carry a Y offset
    // when scroll-driven motion is disabled.
    const allTextContents = Array.from(
      document.querySelectorAll<HTMLElement>("[data-about-chapter-content]")
    );
    if (allTextContents.length > 0) gsap.set(allTextContents, { y: 0 });
    return;
  }

  // True document offset of an element via the offsetTop chain. Unlike
  // getBoundingClientRect(), offsetTop is a LAYOUT value and is immune to CSS
  // transforms — critical here because every chapter lives inside
  // [data-about-wrapper], which hero-transition.ts holds at translateY(+50vh)
  // at scroll 0 (the start of its scrubbed departure). ScrollTrigger.refresh()
  // runs at scroll 0, so a rect-based start ("top bottom") would be cached
  // ~50vh too low and every reveal would fire ~50vh LATE — the text would only
  // sharpen once it had already risen to the top of the viewport, leaving a big
  // black gap below it. docTop() gives the real position, so the triggers are
  // correct regardless of the wrapper transform.
  const docTop = (el: HTMLElement): number => {
    let top = 0;
    let node: HTMLElement | null = el;
    while (node) {
      top += node.offsetTop;
      node = node.offsetParent as HTMLElement | null;
    }
    return top;
  };

  sections.forEach((section, idx) => {
    const titleWords = Array.from(
      section.querySelectorAll<HTMLElement>(
        "[data-about-chapter-title] .about-reveal-word"
      )
    );
    const bodyWords = Array.from(
      section.querySelectorAll<HTMLElement>(
        "[data-about-chapter-body] .about-body-word"
      )
    );
    const textContent = section.querySelector<HTMLElement>(
      "[data-about-chapter-content]"
    );
    const titleEl = section.querySelector<HTMLElement>(
      "[data-about-chapter-title]"
    );
    const bodyEl = section.querySelector<HTMLElement>(
      "[data-about-chapter-body]"
    );
    const ctaEl = section.querySelector<HTMLElement>("[data-about-svc-cta]");
    if (titleWords.length === 0 && bodyWords.length === 0) return;

    // Blur is applied ONCE to the whole title/body BLOCK (one layer each)
    // rather than per word (~200 layers across all chapters) — same
    // "sharpens into focus" look at a fraction of the per-frame repaint cost.
    // The words themselves animate opacity + translate only (cheap, GPU-
    // composited). The words' own opacity:0 (CSS) hides them until the cascade,
    // so there's no FOUC despite the block starting un-blurred in markup.
    // Radii kept modest (5px / 4px, was 8px / 6px): the IN sharpen and OUT
    // re-blur ramp the radius every scrub frame, so a smaller gaussian is cheaper
    // to re-rasterize — still reads as a clean "sharpens into focus" pull.
    if (titleEl) gsap.set(titleEl, { filter: "blur(5px)" });
    if (bodyEl) gsap.set(bodyEl, { filter: "blur(4px)" });

    // The intro (statement 0) starts revealing at 0.72 viewport of scroll —
    // DURING the
    // tail of the Hero pin (pin spans scroll 0 → 100vh), not at pin release.
    // The transition photo lifts/blurs away over the back half of the pin;
    // if the content waited for full pin-release (100vh) the rising photo
    // left a big empty black panel below it ("trop de vide"). Starting at
    // 72vh brings the content up to MEET the lifting photo, so it fills the
    // space as the photo dissolves. It finishes at 200vh.
    //
    // We CANNOT use element-relative starts ("top top") here : chapter 0
    // lives inside [data-about-wrapper], which hero-transition.ts animates
    // via a scrubbed translateY (+50vh → 0). At ScrollTrigger.refresh() time
    // the wrapper carries that transform, so section.getBoundingClientRect()
    // reports chapter 0's top ~50vh LOWER than its layout position — an
    // element-relative start would be cached too late and the reveal would
    // stay frozen at its initial (opacity 0 / blur 8px) state. Numeric
    // (function) start/end make ScrollTrigger treat them as ABSOLUTE scroll
    // pixels, bypassing the transformed trigger measurement entirely.
    // (Verified in-browser: with "top top" the title stays opacity 0 across
    // the whole arrival band; with the numeric start it reveals on screen.)
    // Chapters 1-4 use docTop()-based ABSOLUTE starts for the SAME reason —
    // element-relative `top bottom` is cached ~50vh late (wrapper transform),
    // which made each block only sharpen once it had risen to the top of the
    // viewport (big black gap below). docTop() restores the true `top bottom`
    // → `bottom top` IN-PEAK-OUT bell-curve, so the block is sharp when it sits
    // at viewport CENTER.
    // Chapter 0 uses ABSOLUTE-pixel starts calibrated to the hero pin release
    // (now at 1.4·innerHeight, since the pin runway is +=140% — see
    // hero-transition.ts). Shifted +0.40·innerHeight from the old 0.72/2.0
    // (which were tuned for a 100vh pin) so ch0 still begins revealing ~0.28·vh
    // before release and holds the same 1.28·vh window. Chapters 1-4 use
    // docTop() (offsetTop) and auto-track the taller pin — no change needed.
    const triggerStart =
      idx === 0
        ? () => window.innerHeight * 1.12
        : () => docTop(section) - window.innerHeight;
    const triggerEnd =
      idx === 0
        ? () => window.innerHeight * 2.4
        : () => docTop(section) + section.offsetHeight;

    // Chapter 0 has a shorter trigger range than other chapters (its reveal
    // spans the ~1.28·vh window from just before pin-release [1.12·vh] to
    // scroll-out [2.4·vh], vs the 200vh top-bottom→bottom-top range
    // of chapters 1-4). It uses the same parallax magnitude as the others
    // (mult 1). A previous 2x value sat the content very low to leave a big
    // dark band above it, but that read as "trop de vide" under the rising
    // transition photo before the content arrived — mult 1 lifts the
    // content so it fills the panel as the photo clears, with only a modest
    // dark band remaining.
    const parallaxMult = 1;

    // Text-vertical parallax magnitude (fraction of viewport). The portrait
    // chapter uses a GENTLE 0.10 so its intro text drifts up slowly and
    // LINGERS — staying in view long enough to meet chapter 1 rising from
    // below (closing the intro→chapter-2 gap). Text-only chapters use 0.12
    // so each block travels slower through the viewport — its visible window
    // (text-center ∈ [0,100]vh) widens to ~0.49 of the trigger range, which
    // (with the 78vh section height) exceeds the chapter-to-chapter spacing,
    // so consecutive blocks OVERLAP instead of leaving a void.
    const textParallax = idx === 0 ? 0.1 : 0.08;

    // Chapter 0 arrives with its content ALREADY in the upper viewport
    // (its absolute-pixel start fires at pin-release, when the section top
    // is at the viewport top) and only travels UP — unlike chapters 1-4,
    // whose content enters from the bottom edge. The default IN windows
    // (title 0.16, body 0.25) are tuned for that bottom-entry; applied to
    // chapter 0 they fire AFTER its content has already risen near the top
    // edge, so the first block only flashed there for an instant. Chapter 0
    // therefore reveals AT arrival (IN ~0) and holds LATER (OUT pushed back)
    // so it stays readable across its upward drift instead of whipping past.
    // Text-only chapters (1-4): OUT pushed LATE (title 0.54, body 0.62) so
    // each centered block stays visible as it rises to the top edge while
    // the NEXT chapter's text is already entering from the bottom — the two
    // overlap (one leaving the top, one arriving at the bottom) instead of
    // the block vanishing mid-screen and leaving a black void between
    // chapters. (The old 0.42/0.50 OUT was tuned for image-driven overlap;
    // with the images gone it left a gap — the "trop d'espace" report.)
    // Chapter 0 keeps its arrival-time IN (0.0) but its OUT is likewise
    // extended (title 0.52, body 0.62, portrait 0.70) so the intro lingers
    // and rises to meet chapter 1's entry, closing the ch0→ch1 seam.
    const inTitle = idx === 0 ? 0.0 : 0.18;
    const inBody = idx === 0 ? 0.06 : 0.26;
    const outTitle = idx === 0 ? 0.66 : 0.54;
    const outBody = idx === 0 ? 0.78 : 0.62;

    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: section,
        start: triggerStart,
        end: triggerEnd,
        scrub: 1,
        // Re-evaluate function-based values (the viewport-relative
        // parallax y) when the trigger refreshes — happens on every
        // window resize so the parallax stays proportionally correct.
        invalidateOnRefresh: true,
      },
    });

    // (Chapter 0's old clip-path curtain has been removed — the new
    // scroll-driven Hero → About wipe in src/lib/hero-transition.ts
    // handles the boundary transition with an image overlay rising up.)

    // ─── Parallax ─────────────────────────────────────────────────────
    // Reduced parallax magnitudes (image 6vh, text 25vh — down from 14vh
    // and 56vh). With shorter sections (now 100dvh, was 130dvh) the
    // chapters overlap much more in scroll, and aggressive parallax
    // pushed elements off-screen before their natural reading band could
    // be reached. Smaller parallax keeps elements in-band longer, which
    // tightens the timing windows below.
    if (textContent) {
      tl.fromTo(
        textContent,
        { y: () => window.innerHeight * textParallax * parallaxMult },
        {
          y: () => window.innerHeight * -textParallax * parallaxMult,
          duration: 1.0,
          ease: "none",
        },
        0
      );
    }

    // ─── Reveal IN ────────────────────────────────────────────────────
    // Timings re-derived for the new geometry : sections are now 100dvh
    // (was 130dvh), parallax magnitudes are 25vh / 6vh (were 56vh / 14vh),
    // textContent pt is 8vh (was 16vh), image natural top is 4vh
    // (was 10vh). The IN windows below catch each element JUST as it
    // crosses into the viewport, so the cascade plays across the visible
    // band rather than below it.
    //
    // Math @ progress 0.05 (image IN start, 100dvh section, 1000px vp):
    //   section_top = 90vh, image natural y = 4vh, parallax = +5.4vh
    //   ⇒ image top = 99.4vh — entering bottom edge ✓
    //
    // Math @ progress 0.16 (title IN start):
    //   section_top = 68vh, title natural y = 8vh, parallax = +17vh
    //   ⇒ title y   = 93vh — entering bottom ✓
    //
    // Math @ progress 0.25 (body IN start):
    //   section_top = 50vh, body natural y ≈ 28vh, parallax = +12.5vh
    //   ⇒ body y    = 90.5vh — entering bottom ✓
    //
    // Title — earliest reveal of the textual content. Cascade tightened
    // (stagger 0.006, duration 0.10) so 22-word title finishes its IN
    // by ~0.36, leaving a plateau before title OUT at 0.42.
    if (titleWords.length > 0) {
      tl.to(
        titleWords,
        {
          opacity: 1,
          y: 0,
          stagger: 0.006,
          duration: 0.10,
          ease: "power2.out",
        },
        inTitle
      );
    }
    // Block sharpens over (≈) the cascade span so it reads as the words
    // resolving into focus together.
    if (titleEl) {
      tl.to(
        titleEl,
        { filter: "blur(0px)", duration: 0.16, ease: "power2.out" },
        inTitle
      );
    }
    // Body — per-word stagger. Body sits ~28vh below section_top
    // (8vh pt + 6vh title + ~14vh gap). With the +25vh → -25vh parallax,
    // body enters viewport at progress ~0.244. Cascade starts at 0.25
    // so first words rise into the visible band naturally.
    //
    // Stagger 0.0010 across 80 words → cascade span 0.08, last word
    // resolves at ~0.39. Plateau until OUT at 0.50.
    if (bodyWords.length > 0) {
      tl.to(
        bodyWords,
        {
          opacity: 1,
          y: 0,
          stagger: 0.0010,
          duration: 0.06,
          ease: "power2.out",
        },
        inBody
      );
    }
    if (bodyEl) {
      tl.to(
        bodyEl,
        { filter: "blur(0px)", duration: 0.14, ease: "power2.out" },
        inBody
      );
    }
    // Service CTA — fades in just after the body. pointerEvents toggles with
    // opacity so the (transparent) button can't capture clicks off-peak.
    if (ctaEl) {
      tl.to(
        ctaEl,
        { opacity: 1, pointerEvents: "auto", duration: 0.08, ease: "power2.out" },
        inBody + 0.04
      );
    }

    // ─── Plateau (reading time) ────────────────────────────────────────
    // Title fully in by ~0.40, body by ~0.40. Both hold through center
    // (progress ~0.5) until the OUT windows (see `outTitle`/`outBody`).

    // ─── Reveal OUT ───────────────────────────────────────────────────
    // Title — exits first (sits highest in the block, reaches the top edge
    // earliest). Starts at `outTitle`.
    if (titleWords.length > 0) {
      tl.to(
        titleWords,
        {
          opacity: 0,
          y: -30,
          stagger: 0.008,
          duration: 0.15,
          ease: "power2.in",
        },
        outTitle
      );
    }
    if (titleEl) {
      tl.to(
        titleEl,
        { filter: "blur(5px)", duration: 0.15, ease: "power2.in" },
        outTitle
      );
    }
    // Body — exits after the title (`outBody`). With 100dvh chapters,
    // chapter N+1's timeline starts at chapter N progress 0.5; the late
    // body OUT (0.62, cascade tail ~0.79) keeps chapter N's text visible
    // and rising toward the top edge while chapter N+1's text is already
    // entering from the bottom (its IN fires at chapter N progress ~0.59).
    // The two coexist briefly — one leaving the top, one arriving at the
    // bottom — so there is no empty band between chapters.
    if (bodyWords.length > 0) {
      tl.to(
        bodyWords,
        {
          opacity: 0,
          y: -40,
          stagger: 0.0015,
          duration: 0.05,
          ease: "power2.in",
        },
        outBody
      );
    }
    if (bodyEl) {
      tl.to(
        bodyEl,
        { filter: "blur(4px)", duration: 0.10, ease: "power2.in" },
        outBody
      );
    }
    if (ctaEl) {
      tl.to(
        ctaEl,
        { opacity: 0, pointerEvents: "none", duration: 0.08, ease: "power2.in" },
        outBody
      );
    }
    // Pad the timeline to duration 1.0 so the ScrollTrigger scrub maps
    // progress 0 → 1 linearly to timeline time 0 → 1. Last tween ends
    // around 0.80 (image-out), so we add 0.20 of padding.
    tl.to({}, { duration: 0.20 }, 0.80);
  });

  // Re-measure trigger positions once the layout has fully settled
  // (after the screen-stack pin from `about-scroll.ts` has been
  // established). Without this, the first ScrollTrigger positions may be
  // computed against an in-flux layout and fire too early or late.
  ScrollTrigger.refresh();
}
