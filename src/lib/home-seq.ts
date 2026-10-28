/**
 * The home's scroll sequences, directed from one place: the hero's dive into
 * the hiker's backpack (HeroDots.astro), then section 2 pulling back out of
 * it to the waterfall (WaterfallDots.astro), then Projets
 * (HomeSections.astro, ClimbScene.astro).
 *
 * They are layers of one box, the theatre (HomeContent.astro): as tall as the
 * screen at its tallest (100lvh) and stuck by CSS for the whole of its
 * spacer, so the browser keeps the screen covered by itself, however fast the
 * page scrolls and however late a frame comes: a late frame only ever shows a
 * slightly old picture of the right scene. Nothing here moves a stage. Each
 * frame reads the scroll, moves the sequences' clocks on (each at its own
 * pace, and one only once the one before it is done), shows the one layer
 * that is playing and draws it. There is one loop, this one.
 *
 * Projets is the third layer only on wide screens where it holds in one
 * screen: section 2 ends there with the water rising until it fills the
 * screen, and Projets comes in on that blue. Elsewhere section 2 ends once
 * its text is all in, the theatre lets go, and Projets follows it in the
 * page, its drawing condensing as it comes up, its cards coming in with the
 * scroll.
 *
 * The page is marked with the layer shown (html[data-seq-layer]) and while
 * the sequences hold the screen (html[data-seq-hold]): the nav reads both. A
 * jump (the contact CTA, Home, End) flies over the sequences instead of
 * playing them: they wait for it to land, then are where it has landed.
 *
 * The scenes register themselves in `scenes` from their own scripts;
 * startHome() takes over once they all have. Without motion, or when the hero
 * doesn't hold in one screen, the theatre stays off: the sections follow each
 * other in the page and the scenes sit at rest.
 */

import { clamp01, follow } from "./camera";
import type { Dots } from "./halftone";

/** The screen the scenes are measured for. */
export interface Metrics {
  /** The theatre's box (100lvh tall: the phone toolbars don't change it). */
  vw: number;
  vh: number;
  /** The screen with its toolbars showing (the hero layer, 100svh): what
   *  text must clear to be read. */
  svh: number;
  phone: boolean;
  wide: boolean;
  /** The sequences play (the theatre is on); off, the scenes sit at rest. */
  on: boolean;
}

/** The hero's dive, `q` from 0 (at rest) to 1 (inside the pack). */
export interface HeroScene {
  el: HTMLElement;
  measure(m: Metrics): void;
  apply(q: number): void;
  draw(dt: number): void;
  dots: Dots;
}

/** Section 2, on a timeline `at` in px of scroll, from inside the pack to
 *  its end at `end` (the water full, with `water`: Projets follows as a
 *  layer); the theatre holds it `len` px in all. Its text is all in at
 *  `rest` (where the water starts). */
export interface ApproachScene {
  el: HTMLElement;
  measure(m: Metrics, water: boolean): { end: number; len: number; rest: number };
  /** Its own pace at `at`, px a second. */
  rate(at: number): number;
  /** How long it takes, at its own pace, to go from `a` to `b` (s). */
  time(a: number, b: number): number;
  /** `shown`: it is the layer on screen (its words condense only there). */
  apply(at: number, shown: boolean): void;
  draw(dt: number): void;
  dots: Dots;
}

/** Projets, its entrance `r` from 0 to 1 (the title coming clear, the cards
 *  rising). */
export interface WorkScene {
  el: HTMLElement;
  /** Its place in the page, when it is not a layer of the theatre. */
  home: HTMLElement;
  /** `layer`: it plays as the theatre's third layer (else in the page). */
  measure(m: Metrics, layer: boolean): void;
  apply(r: number): void;
  /** In the page, its top `top` px down the screen: brings its cards in
   *  there. `seen`: some of it is on screen; `navLock`: it covers the top of
   *  the screen, under the nav. */
  flow(top: number): { seen: boolean; navLock: boolean };
}

/** Projets' drawing, condensing out of vapor over the entrance `r`. */
export interface ClimbScene {
  draw(dt: number, r: number): void;
}

export const scenes: { hero?: HeroScene; approach?: ApproachScene; work?: WorkScene; climb?: ClimbScene } = {};

type Layer = "hero" | "approach" | "work" | "";

const DIVE_TIME = 1.5; // s: the dive's own pace, either way
const ENTER_TIME = 2; // s: Projets' entrance, unhurried: each card is seen arriving
const HERO = { phone: 1.2, wide: 1.7 }; // the dive's scroll, in screen heights
const WORK = 0.45; // Projets' scroll as a layer, in screen heights
// In the page, Projets' entrance plays once its top has risen this far up
// the screen (shares of it, toolbars showing), and back below the other.
const RISE = { in: 0.75, out: 0.9 };
// Screens of slack after the sequences: a big flick ends in it (one that
// would carry the page three screens past them, with room to spare for where
// it lands), and the theatre stays stuck while they play out at their own
// pace.
const SLACK = 3.5;
// And at least as much as a steady scroll this fast (px a second) gets ahead
// of them, played through from the start, with this to spare (s: each
// hand-over between them costs a frame or so): it never outruns them (short
// screens, where the theatre's scroll is short for their time).
const STEADY = 900;
const SPARE = 0.25;
// And on phones and tablets, as far as a few flicks in a row carry the page
// from its top (px, whatever the screen): the device speeds up each flick
// that follows another, so three of them run 7 to 10.4k px.
const FLICKS = 11000;
// However far behind the scroll, a sequence plays at its own pace while the
// theatre holds the screen. Only past the slack, a sequence still playing as
// the theatre scrolls away finishes in this (s), rather than leave with a
// scene half done.
const LEAVE = 0.3;
// The clocks follow the scroll on a light spring (s), smoothing its steps.
// Into either end of its range a clock goes straight on at its own pace
// instead: the next one waits on it, and a spring's slow tail there would
// only hold the theatre longer (each scene eases its own ends).
const TAU = 0.12;
const ease = (to: number, end: number): number => (to <= 0 || to >= end ? 0 : TAU);
const JUMP = 2.5; // screens in one frame: a jump (scrollbar, restoration), not a scroll
const RECLAIM = 300; // ms without scrolling before the slack is given back
// A jump (the contact CTA, Home, End) has landed once its scroll has ended,
// or not moved for this long (ms), and at the latest after the other.
const LANDED = { still: 150, max: 2000 };
// The hint to scroll on shows once the reader has been still this long (ms)
// where the sequences wait on the scroll to go on.
const HINT = 1500;

/** Take the home's sequences over, once every component script has run. */
export function startHome(): void {
  let started = false;
  const start = (): void => {
    if (started) return;
    started = true;
    direct();
  };
  if (document.readyState === "complete") start();
  else {
    document.addEventListener("DOMContentLoaded", start, { once: true });
    window.addEventListener("load", start, { once: true });
  }
}

function direct(): void {
  const { hero, approach, work, climb } = scenes;
  const wrap = document.querySelector<HTMLElement>("[data-theatre-wrap]");
  const theatre = wrap?.querySelector<HTMLElement>(":scope > [data-theatre]");
  const spacer = wrap?.querySelector<HTMLElement>(":scope > [data-theatre-spacer]");
  const hint = theatre?.querySelector<HTMLElement>(":scope > [data-seq-hint]");
  if (!hero || !approach || !work || !climb || !wrap || !theatre || !spacer) return;
  const root = document.documentElement;
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const phone = window.matchMedia("(max-width: 767px)");
  const wide = window.matchMedia("(min-width: 1024px)");

  let on = false; // the theatre runs
  let layered = false; // Projets is its third layer
  let m: Metrics = { vw: 0, vh: 0, svh: 0, phone: false, wide: false, on };
  // Lengths in px of scroll; `s` is how far the page has scrolled into the
  // theatre. The dive takes the first Lh of it, section 2 the next La (its
  // timeline ends at aEnd, the water full), Projets as a layer the next Lw;
  // E in all. Then the slack, S.
  let top = 0;
  let Lh = 1;
  let La = 0;
  let Lw = 0;
  let aEnd = 0;
  let aRest = 0; // section 2's text all in
  let E = 0;
  let S = 0;
  let slack = 0; // what S is while they play
  let s = 0;
  let prevS = 0;
  let below = 0; // in the page: Projets' top below the theatre's end, px
  // The clocks: the dive (0..1), section 2's timeline (px), Projets'
  // entrance (0..1).
  let q = 0;
  let at = 0;
  let r = 0;
  let rise = 0; // in the page: where Projets' entrance is headed (0 or 1)
  let boost = 1; // how much faster than their own pace they play (1: not at all)
  let rate = 0;
  let layer: Layer = "";
  let hold = false;
  let fresh = true; // snap the clocks to the scroll on the next frame
  let snaps = 0;
  let dirty = false; // measure again on the next frame
  let raf = 0;
  let last = 0;
  let moved = 0; // when the scroll last moved (ms)
  let calm = 0; // when the reader last wasn't still where they wait on the scroll (ms)
  let frozen = 0; // a jump is flying over the sequences: until when at the latest (ms)
  let flown = false; // its scroll has moved
  let landed = false; // and has ended
  let dest: [number, number, number] | null = null; // the clocks where it goes, if known
  let touching = false;
  let idle = 0; // frames in a row with no clock moving
  let drawn = 0; // frames drawn since the dots last grew coarser
  let slow = 0; // frames in a row drawn too slowly
  const seen = new Set<Element>(); // sections on screen, the theatre off

  // The slack only once the browser has put the page back where it was
  // (reload, history, a #link), so its scroll lands where it should. It may
  // glide there (html's smooth scroll-behavior), from early in the load on:
  // that flies over the sequences as a jump does (see play), and the slack
  // comes once it has landed, after the load.
  const entry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  let armed = !location.hash && entry?.type !== "reload" && entry?.type !== "back_forward";
  const restore = (): void => {
    moved = performance.now();
    frozen = moved + LANDED.max;
    flown = landed = false;
    dest = null;
  };
  if (!armed) {
    restore();
    if (document.readyState !== "complete") {
      window.addEventListener("load", () => {
        restore();
        kick();
      }, { once: true });
    }
  }

  // Whether a layer holds in its box: its content, that is, padding
  // included. (scrollHeight would count the hero's dots, which run on below
  // it on purpose, and Projets' entrance moving things about.)
  const fits = (el: HTMLElement): boolean => {
    let bottom = 0;
    for (const c of el.children) {
      if (c instanceof HTMLElement && getComputedStyle(c).position !== "absolute") bottom = Math.max(bottom, c.offsetTop + c.offsetHeight);
    }
    return bottom + (parseFloat(getComputedStyle(el).paddingBottom) || 0) <= el.clientHeight + 8;
  };
  // The hero must hold in its layer (100svh) for the dive to play: laid out
  // as a layer to see whether it does; back in the page if not. (Tried
  // there, the page is shorter for a moment, and the browser may have
  // scrolled a reader near its foot up with it: put back.)
  const gate = (): boolean => {
    if (still) return false;
    const trial = wrap.dataset.seq !== "on";
    const y = window.scrollY;
    wrap.dataset.seq = "on";
    if (fits(hero.el)) return true;
    delete wrap.dataset.seq;
    if (trial && window.scrollY !== y) window.scrollTo({ top: y, behavior: "instant" });
    return false;
  };
  // Projets the same way, on wide screens: the theatre's third layer if all
  // of it holds there, in the page otherwise.
  const place = (): boolean => {
    const want = on && wide.matches;
    if (want && work.el.parentElement !== theatre) theatre.append(work.el);
    if (want && fits(work.el)) return true;
    if (work.el.parentElement !== work.home) work.home.prepend(work.el);
    return false;
  };

  const measure = (): void => {
    m = { vw: theatre.clientWidth, vh: theatre.clientHeight, svh: hero.el.clientHeight, phone: phone.matches, wide: wide.matches, on };
    top = wrap.getBoundingClientRect().top + window.scrollY;
    hero.measure(m);
    const tl = approach.measure(m, layered);
    work.measure(m, layered);
    Lh = Math.max(1, Math.round((m.phone ? HERO.phone : HERO.wide) * m.vh));
    aEnd = tl.end;
    aRest = tl.rest;
    La = tl.len;
    Lw = layered ? Math.round(WORK * m.vh) : 0;
    E = Lh + La + Lw;
    const time = DIVE_TIME + approach.time(0, aEnd) + (layered ? ENTER_TIME : 0);
    slack = Math.round(Math.max(SLACK * m.vh, STEADY * (time + SPARE) - E, m.wide ? 0 : FLICKS - E));
    below = layered ? 0 : work.el.getBoundingClientRect().top - wrap.getBoundingClientRect().bottom;
  };

  // What the reader past the theatre is reading: the first thing after it
  // still on screen, as deep in the page as it goes (as the browser's own
  // scroll anchoring picks it), not a fixed bar or a stuck title.
  const after = (): Element | null => {
    const shows = (el: Element): boolean => el.getBoundingClientRect().bottom > 0 && !/fixed|sticky/.test(getComputedStyle(el).position);
    const first = (box: Element | null): Element | null => {
      for (let el = box?.firstElementChild ?? null; el; el = el.nextElementSibling) if (shows(el)) return el;
      return null;
    };
    let mark: Element | null = null;
    for (let box: Element | null = wrap; box && box !== document.body && !mark; box = box.parentElement) {
      for (let el = box.nextElementSibling; el && !mark; el = el.nextElementSibling) if (shows(el)) mark = el;
    }
    for (let el = first(mark); el; el = first(el)) mark = el;
    return mark;
  };

  // Into the theatre, or out of it, to rest.
  const enter = (): void => {
    layer = "";
    hero.el.removeAttribute("data-on");
    approach.el.removeAttribute("data-on");
    work.el.removeAttribute("data-on");
    if (on) {
      fresh = true;
      spacer.style.height = `${E + S}px`;
      return;
    }
    S = 0;
    spacer.style.height = "";
    hold = false;
    hint?.removeAttribute("data-show");
    delete root.dataset.seqLayer;
    delete root.dataset.seqHold;
    delete wrap.dataset.seqRest;
    hero.apply(0);
    approach.apply(0, false);
    work.apply(1); // (no entrance: it is simply there)
    hero.draw(0);
    approach.draw(0);
    climb.draw(0, 1);
  };

  // A new layout (a real viewport change, the fonts, a breakpoint).
  const remeasure = (): void => {
    const was = on;
    const wasLayered = layered;
    const end = aEnd;
    // (When the theatre comes on or goes off, or Projets moves in or out of
    // it, a reader in it stays where they are: laid out anew, its spacer
    // first gone then back, the page would otherwise be scrolled on by the
    // browser's scroll anchoring. A reader past it stays on what they were
    // reading (after), at the same place on the screen.)
    const y = window.scrollY;
    const inside = wrap.getBoundingClientRect().bottom > 0;
    const mark = inside ? null : after();
    const markTop = mark?.getBoundingClientRect().top ?? 0;
    on = gate();
    layered = place();
    measure();
    if (on !== was || layered !== wasLayered) {
      enter();
      const to = mark && !theatre.contains(mark) ? mark.getBoundingClientRect().top + window.scrollY - markTop : y;
      if (window.scrollY !== to) window.scrollTo({ top: to, behavior: "instant" });
      return;
    }
    if (!on) return enter();
    // Section 2 at the same moment of its new timeline: it never jumps.
    const before = at;
    if (end > 0) at = Math.min(aEnd, at * (aEnd / end));
    if (at !== before) snaps++;
    spacer.style.height = `${E + S}px`;
  };

  /** Where the scroll `v` px into the theatre would have the clocks, one
   *  after the other (Projets' as a layer). */
  const finals = (v: number): [number, number, number] => {
    const fq = clamp01(v / Lh);
    const fa = fq < 1 ? 0 : Math.min(Math.max(v - Lh, 0), aEnd);
    return [fq, fa, fa < aEnd ? 0 : v >= Lh + La ? 1 : 0];
  };

  /** The clocks shown: the one layer that is playing, each scene where its
   *  clock is. */
  const show = (): void => {
    // At each cut both are the same picture, the pack filling the screen,
    // then the screen full of water.
    const shown: Layer = layered && r > 0 ? "work" : q >= 1 ? "approach" : "hero";
    if (shown !== layer) {
      layer = shown;
      hero.el.toggleAttribute("data-on", layer === "hero");
      approach.el.toggleAttribute("data-on", layer === "approach");
      work.el.toggleAttribute("data-on", layer === "work");
      root.dataset.seqLayer = layer;
    }
    // At their end the layer shown hides the others (section 2, opaque, or
    // Projets' blue): they are left visible under it, so that the page's
    // title (the hero's) and section 2's are there for a screen reader.
    const end = q >= 1 && at >= aEnd && (!layered || r >= 1);
    if (end !== (wrap.dataset.seqRest === "on")) {
      if (end) wrap.dataset.seqRest = "on";
      else delete wrap.dataset.seqRest;
    }
    hero.apply(q);
    approach.apply(at, layer === "approach");
    work.apply(r);
  };

  /** One frame of the theatre; true while it, or Projets after it, is on
   *  screen. */
  const play = (now: number, dt: number): boolean => {
    s = window.scrollY - top;
    if (Math.abs(s - prevS) > 0.5) {
      moved = now;
      flown = frozen > 0;
    }
    // A jump in flight (or the browser's restore, see armed): nothing plays
    // until it has landed, then everything is simply where it has landed.
    if (frozen && (landed || now - moved > LANDED.still || now > frozen)) {
      frozen = 0;
      dest = null;
      fresh = true;
      if (document.readyState === "complete") armed = true;
    }
    const jump = fresh || Math.abs(s - prevS) > JUMP * m.vh;
    const off = s >= E + S + m.vh; // the theatre is off the screen
    let snapped = false;
    const [fq, fa, fr] = finals(s);
    const q0 = q;
    const a0 = at;
    const r0 = r;
    rate = approach.rate(at);
    if (frozen ? off || (fresh && !dest) : jump || off) {
      // Nothing to play out: a new layout, a jump, or the theatre off the
      // screen. They are where the scroll is (under a jump, where it goes;
      // under a restore, where it is so far).
      const [tq, ta, tr] = (frozen && dest) || [fq, fa, fr];
      snapped = fresh || q !== tq || at !== ta || (layered && r !== tr) || boost !== 1;
      fresh = false;
      q = tq;
      at = ta;
      if (layered) r = tr;
      boost = 1;
    } else if (!frozen) {
      // Each at its own pace; going down, section 2 starts once the dive is
      // done and Projets once the water is full; going up, each one comes
      // back once the one after it is back at its start.
      const lag = Math.abs(fq - q) * DIVE_TIME + approach.time(at, fa) + (layered ? Math.abs(fr - r) * ENTER_TIME : 0);
      // (Back in the stuck theatre, at its own pace again.)
      boost = s <= E + S || lag < 0.02 ? 1 : Math.max(boost, lag / LEAVE);
      const tq = at > 0 ? 1 : fq;
      q = follow(q, tq, dt, ease(tq, 1), boost / DIVE_TIME);
      const ta = q < 1 ? 0 : layered && r > 0 ? aEnd : Math.min(Math.max(s - Lh, 0), aEnd);
      at = follow(at, ta, dt, ease(ta, aEnd), boost * rate, 0.5);
      if (layered) r = follow(r, at < aEnd ? 0 : s >= Lh + La ? 1 : 0, dt, 0, boost / ENTER_TIME);
    }

    // The slack: there while they still have to play out, resized only
    // where nobody sees it (what follows the theatre is below the screen
    // while it is stuck), and given back once the scroll rests in it or past
    // it, scrolling the page back by as much: what is on screen stays where
    // it is (the theatre stuck before and after, or the page after it moved
    // up with it), so nothing shows, and the way back up has no dead scroll.
    // Left as it is under a jump, which was aimed at the page as it is.
    if (!frozen) {
      const atEnd = q >= 1 && at >= aEnd && (!layered || r >= 1);
      const want = armed && !atEnd ? slack : 0;
      let next = S;
      if (want > S && s <= E + S) next = want;
      else if (want < S) next = Math.min(S, Math.max(want, s - E));
      let back = 0;
      if (atEnd && next > 0 && s > E && !touching && now - moved > RECLAIM) {
        back = next; // (all of it above the reader: next <= s - E here)
        next = 0;
      }
      // (Aimed before the page shrinks: at its foot the browser would pull
      // the scroll up with it first, and scroll anchoring may follow it.)
      const to = top + s - back;
      if (next !== S) {
        S = next;
        spacer.style.height = `${E + S}px`;
      }
      if (back) {
        window.scrollTo({ top: to, behavior: "instant" });
        s -= back;
        // (The page moved under the reader, who didn't scroll: Nav.astro.)
        window.dispatchEvent(new CustomEvent("seq:reclaim"));
      }
    }
    prevS = s;

    // Projets in the page, right after the theatre (where the slack has just
    // put it): its entrance plays once it has risen into the screen, at its
    // own pace either way, and is simply where the scroll is while none of
    // it shows, or a jump flies by.
    let flow = { seen: false, navLock: false };
    let rising = false; // Projets coming up the screen as the theatre leaves
    if (!layered) {
      const wt = m.vh + E + S + below - s;
      flow = work.flow(wt);
      rising = flow.seen && wt > 0 && s <= E + S + m.vh;
      if (wt < RISE.in * m.svh) rise = 1;
      else if (wt > RISE.out * m.svh) rise = 0;
      if (jump || frozen || !flow.seen) {
        snapped ||= r !== rise;
        r = rise;
      } else r = follow(r, rise, dt, TAU, 1 / ENTER_TIME);
    }
    if (snapped) snaps++;

    // (The nav stays while the theatre holds the screen, while Projets rises
    // after it, and while Projets is under it: all the way through.)
    if (hold !== (s <= E + S || rising || flow.navLock)) {
      hold = !hold;
      if (hold) root.dataset.seqHold = "on";
      else delete root.dataset.seqHold;
    }
    // The hint to scroll on, once the reader has been still a while where the
    // sequences wait on the scroll to go on (the hero, section 2 until its
    // text is all in): not while they play, at their end, nor under the
    // page's entry animation.
    if (hint) {
      const waits = !frozen && now !== moved && q === q0 && at === a0 && (q < 1 || (at < aEnd && at <= aRest)) && !root.classList.contains("intro-on");
      if (!waits) calm = now;
      const shown = now - calm > HINT;
      if (shown !== hint.hasAttribute("data-show")) {
        if (shown) hint.dataset.step = q < 1 ? "hero" : "approach";
        hint.toggleAttribute("data-show", shown);
      }
    }
    show();

    // Only the scene shown is drawn, and in the frame it comes up, so it is
    // never stale; Projets' drawing in the page while it is on screen.
    if (flow.seen) climb.draw(dt, r);
    // (Off the screen it runs on while a jump is in flight, till it lands,
    // and while there is slack to give back. It is drawn there only once
    // its clocks have snapped: the browser may scroll it back on screen
    // before a frame draws it, and it then shows where they are, not the
    // picture it was left with.)
    if (off) {
      if (snapped) {
        if (layer === "work") climb.draw(0, r);
        else (layer === "hero" ? hero : approach).draw(0);
      }
      return flow.seen || frozen > 0 || S > 0;
    }
    if (layer === "work") {
      climb.draw(dt, r);
      return true;
    }
    const scene = layer === "hero" ? hero : approach;
    scene.draw(dt);
    // Too slow here (for a while, not a passing spike): coarser dots, a step
    // at a time, only while nothing moves, and on both scenes at once (the
    // cut shows one pitch), both redrawn there and then: the one not shown
    // is not refitted later, at the cut, in the middle of a sequence.
    idle = q !== q0 || at !== a0 || r !== r0 ? 0 : idle + 1;
    slow = scene.dots.cost() > 11 ? slow + 1 : 0;
    if (++drawn >= 40 && idle >= 30 && slow >= 40 && !frozen && boost === 1) {
      hero.dots.coarsen();
      approach.dots.coarsen();
      drawn = 0;
    }
    return true;
  };

  /** One frame at rest (the theatre off): what is on screen idles. */
  const rest = (dt: number): boolean => {
    if (still) return false;
    if (seen.has(hero.el)) hero.draw(dt);
    if (seen.has(approach.el)) approach.draw(dt);
    if (seen.has(work.el)) climb.draw(dt, 1);
    return seen.size > 0;
  };

  const tick = (now: number, dt: number): boolean => {
    if (dirty) {
      dirty = false;
      remeasure();
    }
    return on ? play(now, dt) : rest(dt);
  };
  const frame = (now: number): void => {
    // (A first frame after a pause counts as an ordinary one.)
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    raf = requestAnimationFrame(frame); // first, so one failed frame can't stop the loop
    if (!tick(now, dt)) stop();
  };
  const kick = (): void => {
    if (!raf && !document.hidden) raf = requestAnimationFrame(frame);
  };
  const stop = (): void => {
    cancelAnimationFrame(raf);
    raf = 0;
    last = 0;
  };
  const restart = (): void => {
    stop();
    kick();
  };
  const relayout = (): void => {
    dirty = true;
    kick();
  };

  on = gate();
  layered = place();
  measure();
  enter();
  if (tick(performance.now(), 0)) kick();

  // Measured again only on a real change of the screen (the theatre is
  // 100lvh: a phone toolbar coming and going is not one), of the text's
  // height (section 2's, Projets'), of the fonts or of a breakpoint.
  const ro = new ResizeObserver(relayout);
  ro.observe(theatre);
  const content = approach.el.querySelector("[data-approach-content]");
  if (content) ro.observe(content);
  ro.observe(work.el);
  document.fonts?.ready.then(relayout);
  phone.addEventListener("change", relayout);
  wide.addEventListener("change", relayout);
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) seen.add(e.target);
      else seen.delete(e.target);
    }
    kick();
  });
  io.observe(hero.el);
  io.observe(approach.el);
  io.observe(work.el);
  window.addEventListener("scroll", kick, { passive: true });
  window.addEventListener("pageshow", (e) => e.persisted && restart());
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : restart()));
  const touch = (e: TouchEvent): void => {
    touching = e.touches.length > 0;
  };
  window.addEventListener("touchstart", touch, { passive: true });
  window.addEventListener("touchend", touch, { passive: true });
  window.addEventListener("touchcancel", touch, { passive: true });

  // A jump (`detail`: "contact", the contact CTA, see MobileBar.astro;
  // "home" or "end", the keys below): the page flies over the sequences
  // rather than play them through. The slack goes first, what of it is still
  // under the reader, before the jump is aimed, so it lands where it was
  // aimed; then the clocks and the slack wait for it to land (see play).
  window.addEventListener("seq:jump", () => {
    if (!on) return;
    s = window.scrollY - top;
    const next = Math.max(0, Math.min(S, s - E));
    if (next !== S) {
      S = next;
      spacer.style.height = `${E + S}px`;
    }
    prevS = s;
    moved = performance.now();
    frozen = moved + LANDED.max;
    flown = landed = false;
    dest = null;
    kick();
  });
  window.addEventListener("scrollend", () => {
    // (Its own end, once it has flown: not that of a scroll it cut short.)
    if (frozen && flown) landed = true;
    kick();
  });
  // Home and End fly too, and Cmd+Up and Cmd+Down, theirs on a Mac (PageUp,
  // PageDown and Space stay plain scrolls). Where the theatre will show the
  // same scenes all the way (Home: it lands in it; or it is off the screen),
  // they are at once where the jump goes: Home shows the hero at rest from
  // the first frame the theatre is back. With the theatre on they go there in
  // one step: the browser's own glide there crosses the whole page in a fifth
  // of a second, faster than a phone can paint it, and flashes empty screens
  // on the way.
  const fly = (home: boolean): void => {
    const to = home ? -top : Infinity;
    if (on) {
      s = window.scrollY - top;
      if (to <= E + S || s >= E + S + m.vh) {
        const [fq, fa, fr] = finals(to);
        if (q !== fq || at !== fa || (layered && r !== fr)) snaps++;
        q = fq;
        at = fa;
        if (layered) r = fr;
        boost = 1;
        show();
        if (layer === "work") climb.draw(0, r);
        else (layer === "hero" ? hero : approach).draw(0);
      }
    }
    window.dispatchEvent(new CustomEvent("seq:jump", { detail: home ? "home" : "end" }));
    if (frozen) dest = finals(to);
    if (on) window.scrollTo({ top: home ? 0 : document.documentElement.scrollHeight, behavior: "instant" });
  };
  window.addEventListener("keydown", (e) => {
    const home = e.key === "Home" || (e.metaKey && e.key === "ArrowUp");
    if ((!home && e.key !== "End" && !(e.metaKey && e.key === "ArrowDown")) || e.defaultPrevented || e.altKey) return;
    const t = e.target;
    if (t instanceof HTMLElement && (t.isContentEditable || t.closest("input, textarea, select, dialog, [role='dialog']"))) return;
    fly(home);
    if (on) e.preventDefault();
  });

  // For the tests (dev only): where the sequences are, read-only.
  if (import.meta.env.DEV) {
    Object.defineProperty(window, "__seq", {
      configurable: true,
      get: () => ({ s, q, at, r, layer, S, E, boost, snaps, aEnd, rate, layered, frozen: frozen > 0 }),
    });
  }
}
