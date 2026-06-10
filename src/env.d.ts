/// <reference types="astro/client" />

import type Lenis from "lenis";

declare global {
  interface Window {
    /** Shared Lenis instance, created once by initSmoothScroll() (src/lib/smooth-scroll.ts). */
    __lenis?: Lenis;
  }
}
