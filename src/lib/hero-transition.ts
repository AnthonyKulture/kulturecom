/**
 * Hero → About scroll-driven transition.
 *
 *  Pin the Hero (via `[data-hero-pin]`) for +=200% of scroll while a GSAP
 *  timeline scrubs against the scroll position. Page doesn't actually move
 *  during the pin — the timeline animates instead.
 *
 *  ONE continuous arc — NOT discrete phases. The whole 0 → 1 progress
 *  reads as a single fused gesture (the Hero gives way, the image sweeps
 *  through, About arrives) with NO dead stop anywhere. Each slice of
 *  progress has motion; the segments below overlap so the eye never sees
 *  the animation pause.
 *
 *    a) Reveal (0 → ~0.30) : the H1 splits horizontally and the
 *       transition image emerges from a thin horizontal line at the
 *       middle of the viewport.
 *         - Top H1 lines (data-anim-line-half="top", lines 1-3) translate
 *           UP and fade — pushed off the top edge.
 *         - Bottom H1 lines (data-anim-line-half="bottom", lines 4-5)
 *           translate DOWN and fade — pushed off the bottom edge.
 *         - Peripherals (subtitle, side label, scroll hint, mobile
 *           carousel figure) simple opacity fade.
 *         - Image clip-path opens from `inset(50% 0 50% 0)` (invisible
 *           horizontal slit at center) to `inset(0)` (fully visible
 *           full-screen). NO opacity tween — the image "appears" through
 *           the opening, no fade/blur entrance.
 *
 *    b) Settle (~0.28 → ~0.60) : REPLACES the old dead "hold". A slow,
 *       continuous scale push-in on the image (1.15 → 1.24) keeps the
 *       frame visibly alive through what used to be a full stop. It
 *       overlaps the reveal end AND the departure start, so motion is
 *       unbroken from reveal into departure — the scrub never lands on a
 *       static frame. Scale only (no Y, no blur yet) so it can't expose
 *       the cream bg and doesn't touch the departure's glue math; a bigger
 *       scale only pushes the image edges further off-screen.
 *
 *    c) Departure (~0.55 → 1.0) : two synchronized linear tweens that
 *       hand the screen from the image to About.
 *         - Image translates UP from `y: 0` to `y: -95vh` (off-screen
 *           above) and progressively blurs (`filter: blur 0 → 24px`,
 *           eased separately on expo.inOut since it has no spatial sync
 *           constraint).
 *         - About wrapper (`[data-about-wrapper]`, z-index: 60) translates
 *           UP from `+50vh` (below viewport) to `0` (at viewport top).
 *           Both Y tweens are LINEAR (`ease: "none"`) and equal-rate so
 *           the image bottom edge stays glued to the About top edge — see
 *           the glue note at the departure block. About paints over the
 *           blurred image during the overlap window (z-60 > z-30).
 *
 *  Pin config : `pinSpacing: false` + `end: "+=100%"` (= 100vh = Hero
 *           height). About sits at its natural DOM position (scroll 100vh)
 *           and arrives at viewport top exactly when the pin releases.
 *           The +50vh initial translateY on About keeps it below the
 *           viewport during reveal + settle so the image stays full-screen
 *           ALONE. NO cream visible at any point in the sequence.
 *
 *  Init flow :
 *    Run `setupTimeline()` IMMEDIATELY when fonts are ready — don't wait
 *    for `preloader:done`. The preloader locks body scroll until it
 *    finishes, so the user can't scroll during init. By the time the
 *    preloader releases, our ScrollTrigger is already in place with the
 *    pin engaged at scroll 0. If we waited (as a prior version did),
 *    the user could scroll past the pin range BEFORE ScrollTrigger
 *    creation — and the moment we created it, GSAP would scrub the
 *    timeline straight to the current progress, making the image appear
 *    "violently" mid-page rather than during the pinned sequence.
 *
 *    Inside init, force Hero elements to revealed state via `gsap.set`
 *    so the scroll-driven fade-out has visible content to push around,
 *    even if the Hero arrival animation in hero.ts hasn't run yet
 *    (script-order race condition with the preloader:done event).
 *    Trade-off : the editorial Hero arrival cascade is visually skipped
 *    (elements snap to opacity 1 instead of fading in), but the pin
 *    works correctly from scroll 0.
 *
 *  `prefers-reduced-motion` skips the pin entirely : image hidden, Hero
 *  scrolls naturally, About scrolls in normally.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function initHeroTransition(): void {
  if (typeof window === "undefined") return;

  const pinTrigger = document.querySelector<HTMLElement>("[data-hero-pin]");
  const transitionImg = document.querySelector<HTMLElement>(
    "[data-hero-transition-image]"
  );
  if (!pinTrigger || !transitionImg) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) {
    transitionImg.style.display = "none";
    return;
  }

  // Top H1 lines (1-3): pushed UP during phase 1.
  const topLines = Array.from(
    document.querySelectorAll<HTMLElement>(
      '[data-hero] [data-anim-line-half="top"]'
    )
  );
  // Bottom H1 lines (4-5) AND the subtitle: pushed DOWN during phase 1.
  // The subtitle sits right under the H1, so if it just faded in place
  // (peripherals group), the bottom H1 lines descending +60vh would
  // visually overlap it around progress 0.05. Translating the subtitle
  // DOWN with the bottom lines keeps them moving in formation — no
  // overlap.
  const bottomLines = Array.from(
    document.querySelectorAll<HTMLElement>(
      '[data-hero] [data-anim-line-half="bottom"], [data-hero] [data-hero-subtitle]'
    )
  );
  // Side label + scroll hint : simple opacity fade (they don't sit in the
  // path of the descending bottom H1 stack).
  const peripherals = Array.from(
    document.querySelectorAll<HTMLElement>("[data-hero] [data-anim-inline]")
  );
  // Mobile inline carousel figure (the image between the H1 halves) : faded
  // out on its OWN front-loaded tween (see below). It sits dead-center, where
  // the transition image's slit opens FIRST, so it must clear EARLY — a slow
  // fade leaves it visibly lingering over the opening image.
  const figure = document.querySelector<HTMLElement>(
    "[data-hero] [data-anim-figure]"
  );

  let initFired = false;

  const setupTimeline = () => {
    if (initFired) return;
    initFired = true;

    // ─── Disable CSS transitions on GSAP targets ──────────────────────
    // `.anim-in` (added by hero.ts during arrival) declares
    // `transition: opacity 0.9s, transform 0.9s`. With scrub: 1 firing
    // many transform/opacity updates per second, every update kicks off
    // a fresh 0.9s CSS transition — the visual position never catches
    // up to GSAP's intended value and the H1 lines appear stuck. The
    // `clip-path` animation on the image works because clip-path is NOT
    // in `.anim-in`'s transitioned-properties list. Setting an inline
    // `transition: none` overrides `.anim-in` (inline beats class) and
    // lets GSAP drive these elements unimpeded.
    const allFadeTargets = [
      ...topLines,
      ...bottomLines,
      ...peripherals,
      ...(figure ? [figure] : []),
    ];
    allFadeTargets.forEach((el) => {
      el.style.transition = "none";
    });

    // Force subtitle word-cascade revealed (CSS gates it on this attribute).
    const subtitle = document.querySelector<HTMLElement>(
      "[data-hero] [data-hero-subtitle]"
    );
    if (subtitle && !subtitle.hasAttribute("data-words-revealed")) {
      subtitle.setAttribute("data-words-revealed", "");
    }

    // Base scale 1.15 on the transition image — pushes its bounding box
    // edges OFF-SCREEN (-7.5vw to 107.5vw horizontally, -7.5vh to 107.5vh
    // vertically when at y=0). The `filter: blur(24px)` applied during the
    // departure creates a ~3vh band of partial transparency at the bounding
    // box edges (blur samples off-element pixels as alpha=0, which fades the
    // inner-edge pixels). Without scale, that fade band sits INSIDE the
    // viewport at the left, right, top edges — revealing the cream body bg
    // through, looking like a white frame around the image. Scale keeps the
    // fade band off-screen, so only the fully-opaque central portion of the
    // blurred image is ever visible. It's also large enough to accommodate
    // the departure's y translation (the image's lower edge during the rise
    // stays ahead of About's upper edge, with the halo zone covered by
    // About z-60). The settle (below) only grows this scale (1.15 → 1.24),
    // so the off-screen margin and the About overlap can only widen — never
    // shrink — across the whole sequence.
    gsap.set(transitionImg, { scale: 1.15, transformOrigin: "center center" });

    const tl = gsap.timeline({ defaults: { ease: "none" } });

    // ─── Reveal — Split H1 + image emerges (0 → 0.30) ─────────────────
    // Using `fromTo` with explicit FROM values + immediateRender (default
    // true) so GSAP applies the starting state IMMEDIATELY at timeline
    // creation — overriding any residual .anim-hidden styling from the
    // Hero arrival. This skips the Hero arrival cascade visually (the
    // elements snap to opacity 1 / y 0 at trigger creation) but makes
    // the scroll-driven split + clip-path tweens deterministic.

    // H1 lines move FIRST at constant rate (linear) — they start
    // immediately at t=0 so the user sees the title splitting before
    // the image starts emerging from the middle.
    if (topLines.length > 0) {
      tl.fromTo(
        topLines,
        { y: 0, opacity: 1 },
        {
          y: () => -window.innerHeight * 0.6,
          opacity: 0,
          duration: 0.30,
          ease: "none",
          // NO stagger : the lines must move as ONE rigid block. With a
          // stagger, the topmost line travels further than those below it
          // at any given scrub position — harmless going UP (they spread
          // apart) but it desyncs the group. We keep both halves in
          // formation so the split reads as a clean parting.
        },
        0
      );
    }

    if (bottomLines.length > 0) {
      tl.fromTo(
        bottomLines,
        { y: 0, opacity: 1 },
        {
          y: () => window.innerHeight * 0.6,
          opacity: 0,
          duration: 0.30,
          ease: "none",
          // NO stagger : CRITICAL going DOWN. With a stagger the topmost
          // bottom-line (+ the subtitle, which trails it in DOM order)
          // travel at different rates, so on mobile — where the bottom
          // lines and the subtitle are tightly stacked — the faster upper
          // line crashes into the slower lines below it AND into the
          // subtitle. Moving the whole bottom group (lines + subtitle) as
          // one block keeps their gaps constant: no overlap at any scrub
          // position.
        },
        0
      );
    }

    if (peripherals.length > 0) {
      tl.fromTo(
        peripherals,
        { opacity: 1 },
        {
          opacity: 0,
          duration: 0.20,
          ease: "power2.in",
        },
        0
      );
    }

    // Carousel figure (mobile) : front-loaded fade — `power2.out` (fast
    // start) over a SHORT window so it's essentially gone by the time the
    // transition image's clip-path begins to widen (the clip starts at
    // 0.08 and the figure sits dead-center where the slit opens first).
    // A slow fade left the carousel visibly hovering over the opening
    // image; this clears the center early so the big image opens into
    // clean space.
    if (figure) {
      tl.fromTo(
        figure,
        { opacity: 1 },
        {
          opacity: 0,
          duration: 0.16,
          ease: "power2.out",
        },
        0
      );
    }

    // Image clip-path : DELAYED by 0.08 (~16vh of scroll head-start for
    // the H1 split) and uses `power2.in` ease (slow start, fast end) so
    // the image emerges progressively after the title has had time to
    // visibly part. Without this delay/ease the clip opened too fast and
    // the image dominated the viewport before the user perceived the
    // H1 split as a cause-and-effect of the image appearing.
    tl.fromTo(
      transitionImg,
      { clipPath: "inset(50% 0% 50% 0%)", y: 0 },
      {
        clipPath: "inset(0% 0% 0% 0%)",
        duration: 0.22,
        ease: "power2.in",
      },
      0.08
    );

    // ─── Settle — continuous scale push-in (0.28 → 0.60) ───────────────
    // Fills what used to be a dead "hold" with unbroken motion so the
    // transition never lands on a static frame (the dead stop was what
    // made the image and About read as two separate sections). A slow
    // 1.15 → 1.24 zoom on the image, `sine.inOut` for a soft, organic
    // drift. It overlaps the reveal end (clip-path finishes ~0.30) and the
    // departure start (0.55), bridging both into one continuous gesture.
    // Scale ONLY — no Y, no blur — so it can't expose the cream bg and is
    // fully decoupled from the departure's Y glue math. `.to` (not
    // `fromTo`) reads the current scale (1.15, from the gsap.set above) as
    // its start, leaving the reveal untouched at scale 1.15.
    tl.to(
      transitionImg,
      {
        scale: 1.24,
        duration: 0.32,
        ease: "sine.inOut",
      },
      0.28
    );

    // ─── Departure — image rises + blurs, About rises from below (0.55 → 1.0) ──
    // Sync requirement : image bottom edge must stay glued to About top
    // edge throughout — otherwise the cream body bg shows through.
    //
    // The math forces LINEAR ease on both Y tweens :
    //   - Image moves via translateY only (one source of motion)
    //   - About moves via translateY (50vh, eased) + natural scroll
    //     (45vh, ALWAYS linear since scroll position is linear with p)
    //
    // With matching expo.inOut on translateY, About's combined motion
    // is mixed-curve (eased + linear) while image's is pure-eased. At
    // p=0.7, expo.inOut(0.7) ≈ 0.97 → image moves 97vh while About moves
    // only 48.5+31.5 = 80vh. The 17vh gap exposes the cream.
    //
    // Fix : linear ease on BOTH translateY tweens. Both rise 95vh total
    // (image translate 95vh = About translate 50vh + scroll 45vh). Image
    // bottom and About top move at IDENTICAL rate, separated by a
    // constant 12.5vh overlap (image extends below About top, About z-60
    // paints over).
    //
    // Blur stays on `expo.inOut` (modern smooth-fast-smooth feel) — split
    // into its own tween since it has no spatial sync constraint.
    tl.to(
      transitionImg,
      {
        y: () => -window.innerHeight * 0.95,
        duration: 0.45,
        ease: "none",
      },
      0.55
    );
    tl.to(
      transitionImg,
      {
        filter: "blur(24px)",
        duration: 0.45,
        ease: "expo.inOut",
      },
      0.55
    );

    const aboutWrapper = document.querySelector<HTMLElement>(
      "[data-about-wrapper]"
    );
    if (aboutWrapper) {
      tl.fromTo(
        aboutWrapper,
        { y: () => window.innerHeight * 0.5 },
        {
          y: 0,
          duration: 0.45,
          ease: "none",
        },
        0.55
      );
    }

    ScrollTrigger.create({
      trigger: pinTrigger,
      start: "top top",
      end: "+=100%",
      pin: true,
      pinSpacing: false,
      scrub: 1,
      invalidateOnRefresh: true,
      anticipatePin: 1,
      animation: tl,
    });

    // Refresh all ScrollTriggers (some were created synchronously at
    // script load, BEFORE the pin spacer was injected). Recomputes
    // their cached element positions against the current layout.
    ScrollTrigger.refresh();
  };

  // Run setupTimeline ASAP — as soon as fonts are loaded. The preloader
  // locks body scroll until it finishes, so the user can't scroll while
  // we're creating the ScrollTrigger. The pin engages at scroll 0 and
  // is already in place by the time the preloader releases.
  const ready =
    document.fonts && document.fonts.ready
      ? document.fonts.ready
      : Promise.resolve();
  ready.then(setupTimeline);
}
