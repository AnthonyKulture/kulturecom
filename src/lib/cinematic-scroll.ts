/**
 * Cinematic cylinder scroll — vanilla port of Codrops "Cinematic 3D Scroll" Demo 1
 * (JosephASG/codrops-cinematic-scroll-animations), adapted to this site's stack.
 *
 * The original is React + OGL + GSAP ScrollSmoother. Here it is a plain module:
 *  - NO ScrollSmoother (a paid Club GSAP plugin). The scrubbed camera timeline is
 *    driven by the site's existing Lenis + ScrollTrigger (smooth-scroll.ts), exactly
 *    like hero-transition.ts / about-scroll.ts.
 *  - NO page-wide `position:fixed` canvas. The section is PINNED (ScrollTrigger
 *    pin:true) for a fixed scrub distance and the canvas is `position:absolute`
 *    inside it — so the WebGL only ever covers the viewport WHILE this section is on
 *    screen, never the whole page.
 *  - WebGL boots in idle time once the hero has arrived (IntersectionObserver, one
 *    viewport early, as the fallback) and the rAF render loop is GATED to the section's
 *    visibility + tab focus — and skips the draw when nothing moved — so the GPU is idle
 *    everywhere else on the page.
 *
 * Effect: 12 project images are drawn side-by-side into one canvas atlas, uploaded as
 * a single texture wrapped around a cylinder. A scrubbed GSAP timeline flies the
 * camera through 5 keyframes while the cylinder spins ~4.5 turns; velocity-reactive
 * line "particles" brighten on motion; 4 captions fade in/out, one per scroll-quarter.
 *
 * `prefers-reduced-motion` (and an optional mobile kill-switch): no WebGL, no pin — a
 * single static project image + the first caption stand in, the page scrolls normally.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import { Renderer, Camera, Transform, Texture, Program, Mesh, Geometry } from "ogl";
import { prefersReducedMotion } from "./env";

gsap.registerPlugin(ScrollTrigger, CustomEase);

// Custom eases that give the camera move its "cinematic" feel (registered once).
if (typeof window !== "undefined") {
  CustomEase.create("cinematicSilk", "0.45, 0.05, 0.55, 0.95");
  CustomEase.create("cinematicSmooth", "0.25, 0.1, 0.25, 1");
  CustomEase.create("cinematicFlow", "0.33, 0, 0.2, 1");
  CustomEase.create("cinematicLinear", "0.4, 0, 0.6, 1");
}

// Flip to false if low-end mobile shows jank — mobile then gets the static fallback.
const ENABLE_ON_MOBILE = true;

// Project images, drawn into the atlas in this order (same-origin → no CORS taint).
const IMAGES = [
  "/hero-slides/surly-superman.webp",
  "/hero-slides/eden-rock.webp",
  "/hero-slides/sunbeachhouse.webp",
  "/hero-slides/royal-yacht.avif",
  "/hero-slides/slide-02.webp",
  "/hero-slides/bucket-regatta-2927.webp",
  "/hero-slides/slide-05.webp",
  "/hero-slides/slide-04.webp",
  "/hero-slides/slide-11.webp",
  "/hero-slides/slide-13.webp",
  "/hero-slides/slide-17.webp",
  "/hero-slides/slide-20.webp",
];

// Atlas cell ratio — purely relative (every cell is cover-drawn, so the source
// aspect ratio is irrelevant; this just makes the cells square-ish).
const imageConfig = { width: 1024, height: 1024 };

const particleConfig = {
  numParticles: 12,
  particleRadius: 3.3, // cylinder radius + 0.8
  segments: 20,
  angleSpan: 0.3,
};

type GLContext = Renderer["gl"];

type ParticleUserData = {
  baseAngle: number;
  angleSpan: number;
  baseY: number;
  speed: number;
  radius: number;
};
type ParticleMesh = Mesh & { userData: ParticleUserData };

const cylinderVertex = /* glsl */ `
  attribute vec2 uv;
  attribute vec3 position;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const cylinderFragment = /* glsl */ `
  precision highp float;
  uniform sampler2D tMap;
  uniform float uDarkness; // 0.0 = normal, 1.0 = dissolved into the background
  varying vec2 vUv;
  void main() {
    vec4 tex = texture2D(tMap, vUv);
    // Dissolve TOWARD the site background (#0b0b0b ≈ 0.043), not pure black: at full
    // darkness the cylinder matches the clear colour and vanishes with no silhouette.
    // max() (not mix()) leaves the normal-state look untouched — only pixels already
    // darker than the background floor get lifted, which is imperceptible.
    tex.rgb = max(tex.rgb * (1.0 - uDarkness), vec3(0.043) * uDarkness);
    gl_FragColor = tex;
  }
`;

const particleVertex = /* glsl */ `
  attribute vec3 position;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const particleFragment = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform float uOpacity;
  void main() {
    gl_FragColor = vec4(uColor, uOpacity);
  }
`;

/** Draw an image with object-fit: cover behaviour into a sub-rect of a 2D canvas. */
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: ImageBitmap,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  const imgRatio = img.width / img.height;
  const canvasRatio = w / h;
  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = img.width;
  let sourceHeight = img.height;
  if (imgRatio > canvasRatio) {
    sourceWidth = img.height * canvasRatio;
    sourceX = (img.width - sourceWidth) / 2;
  } else {
    sourceHeight = img.width / canvasRatio;
    sourceY = (img.height - sourceHeight) / 2;
  }
  // Flip vertically so the texture maps right-side up on the cylinder UVs.
  ctx.save();
  ctx.translate(x, y + h);
  ctx.scale(1, -1);
  ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, w, h);
  ctx.restore();
}

/** Cylinder geometry (positions, UVs, indices) wrapping the atlas 360°. */
function createCylinderGeometry(
  gl: GLContext,
  config: { radius: number; height: number; radialSegments: number; heightSegments: number }
): Geometry {
  const { radius, height, radialSegments, heightSegments } = config;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let y = 0; y <= heightSegments; y++) {
    const v = y / heightSegments;
    const yPos = (v - 0.5) * height;
    for (let x = 0; x <= radialSegments; x++) {
      const u = x / radialSegments;
      const theta = u * Math.PI * 2;
      positions.push(Math.cos(theta) * radius, yPos, Math.sin(theta) * radius);
      uvs.push(u, 1 - v);
    }
  }
  for (let y = 0; y < heightSegments; y++) {
    for (let x = 0; x < radialSegments; x++) {
      const a = y * (radialSegments + 1) + x;
      const b = a + radialSegments + 1;
      const c = a + 1;
      const d = b + 1;
      indices.push(a, b, c, b, d, c);
    }
  }
  return new Geometry(gl, {
    position: { size: 3, data: new Float32Array(positions) },
    uv: { size: 2, data: new Float32Array(uvs) },
    index: { data: new Uint16Array(indices) },
  });
}

/** A single curved line-strip "particle" orbiting above/below the cylinder. */
function createParticleGeometry(
  gl: GLContext,
  config: typeof particleConfig,
  index: number,
  height: number
): { geometry: Geometry; userData: ParticleUserData } {
  const { numParticles, particleRadius, segments, angleSpan } = config;
  const linePositions: number[] = [];
  const startAngle = (index / numParticles) * Math.PI * 2;
  const isTopHalf = index < numParticles / 2;
  const yPosition = isTopHalf
    ? height * 0.7 + Math.random() * height * 0.3
    : -height * 1.0 + Math.random() * height * 0.3;
  for (let j = 0; j <= segments; j++) {
    const t = j / segments;
    const angle = startAngle + angleSpan * t;
    linePositions.push(Math.cos(angle) * particleRadius, yPosition, Math.sin(angle) * particleRadius);
  }
  return {
    geometry: new Geometry(gl, {
      position: { size: 3, data: new Float32Array(linePositions) },
    }),
    userData: {
      baseAngle: startAngle,
      angleSpan,
      baseY: yPosition,
      speed: 0.5 + Math.random() * 1.0,
      radius: particleRadius,
    },
  };
}

export function initCinematicScroll(): void {
  if (typeof window === "undefined") return;

  const section = document.querySelector<HTMLElement>("[data-cinematic]");
  if (!section) return;
  // The fixed stage is hidden by default (opacity-0); it covers the whole viewport, so
  // it must only be shown while the spacer is in view — otherwise its black hides the
  // cream hero (above) and CTA (below).
  const stage = section.querySelector<HTMLElement>("[data-cinematic-stage]");
  const canvas = section.querySelector<HTMLCanvasElement>("[data-cinematic-canvas]");
  const captions = Array.from(section.querySelectorAll<HTMLElement>("[data-cinematic-caption]"));
  const fallback = section.querySelector<HTMLElement>("[data-cinematic-fallback]");
  // The fixed stage never moves; this tall, normal-flow spacer provides the scroll runway.
  const spacer = section.querySelector<HTMLElement>("[data-cinematic-spacer]");
  if (!canvas || !spacer || !stage) return;
  // The screen-stack below — drives the timeline by the REAL geometry (the scrub ends at the
  // screen-stack's pin, not the spacer bottom). The calm Promesse photo is the cross-dissolve
  // target: a fixed z:-1 layer that fades in over the dimming cylinder as the stack rises, so
  // the spinning cylinder turns into the still photo IN PLACE (the fondu). Both optional.
  const screenStack = document.querySelector<HTMLElement>("[data-screen-stack]");
  const calmPhoto = document.querySelector<HTMLElement>("[data-promesse-photo]");

  const reduced = prefersReducedMotion();
  const isMobile = window.matchMedia("(max-width: 767px)").matches;

  const setStageVisible = (v: boolean): void => {
    stage!.style.opacity = v ? "1" : "0";
  };

  // Static fallback: reveal a representative image + first caption, no WebGL.
  const showFallback = (): void => {
    fallback?.classList.remove("hidden");
    canvas.style.display = "none";
    if (captions[0]) captions[0].style.opacity = "1";
  };
  if (reduced || (isMobile && !ENABLE_ON_MOBILE)) {
    showFallback();
    // Still gate the stage's visibility on scroll so the fallback only shows in phase.
    ScrollTrigger.create({
      trigger: spacer,
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => setStageVisible(self.isActive),
    });
    return;
  }

  // --- rAF gating with "settle-then-park". renderFrame is assigned at boot; the
  //     loop is a no-op until then. While the section is IN RANGE it renders every
  //     frame; once we LEAVE range it keeps rendering until the scrubbed timeline's
  //     eased playhead has reached a rest extreme (progress 0 or 1), THEN hides the
  //     stage and parks. This is what makes a FAST scroll clean: the gate's onToggle
  //     fires INSTANTLY at the boundary, but the `scrub:1` playhead lags ~1s — so a
  //     fast scroll to the pin used to hide the stage MID-cross-dissolve (the cylinder
  //     vanishing before the calm photo had resolved over it). Now the fondu finishes
  //     off the boundary and the stage hides invisibly under the fully-resolved photo
  //     (or, leaving upward, behind the opaque About). ---
  let inRange = false;
  let rafId = 0;
  let renderFrame: (() => void) | null = null;
  // renderFrame skips the draw when nothing moved; set this to force the next one.
  let forceDraw = true;
  // The scrubbed timeline's eased playhead has caught up to an end of its range.
  // (`tl` is defined below; the loop only ever runs after that, so this is safe.)
  const scrubSettled = (): boolean => {
    const p = tl.progress();
    return p <= 0.001 || p >= 0.999;
  };
  const loop = (): void => {
    if (document.hidden || !renderFrame) {
      rafId = 0;
      return;
    }
    // Out of range AND the scrub has caught up → safe to hide the stage and park.
    if (!inRange && scrubSettled()) {
      setStageVisible(false);
      rafId = 0;
      return;
    }
    rafId = requestAnimationFrame(loop);
    renderFrame();
  };
  const startLoop = (): void => {
    if (!rafId) loop();
  };

  // Camera position, cylinder rotation and texture darkness are tweened on PLAIN objects;
  // the cylinder (created lazily) reads them every frame. ONE scrubbed timeline runs the
  // whole sequence. The fixed stage never moves; only this timeline animates.
  const initialCameraZ = window.innerWidth < 768 ? 6 : window.innerWidth < 1024 ? 7 : 8;
  const cameraAnim = { x: 0, y: 0, z: initialCameraZ };
  const rotationAnim = { y: 0.5 };
  // Texture darkness → `uDarkness` uniform (0.3 = the normal look). The cylinder emerges from
  // About's bottom feather LIT (0.3) and stays lit through the fly-through; on the way OUT it
  // dims 0.3 → 1.0 across the fondu so it cross-dissolves to #0b0b0b under the calm photo that
  // fades in over it (see the FONDU block below). No black emerge on entry — starts at 0.3.
  const darknessAnim = { v: 0.3 };

  // === Reveal→cross-dissolve geometry — timeline SYNCED to what's on screen ===
  // DOM order: [About wrapper][spacer Hs][screen-stack]. The scrub runs from "spacer top at
  // viewport bottom" to "screen-stack top at viewport top" (its pin) — range = Hs + V.
  // As progress p ∈ [0,1]:
  //   • reveal_end = (V + about-feather 24vh) / range — About + its bottom feather have cleared
  //     the viewport, the full cylinder is visible. Captions only start after this.
  //   • cover_start = Hs / range — the screen-stack's top enters the viewport bottom; its rise
  //     begins. This is where the FONDU starts: the cylinder slows + dims while the calm photo
  //     fades in. The stack is transparent, so the cross-dissolve shows through it, in place.
  //   • cross_end = cover_start + 0.85·(1 − cover_start) — the calm photo is fully resolved
  //     (cylinder gone). A short settle then runs to the pin (p = 1) where the text writes in.
  const V = window.innerHeight;
  const Hs = spacer.offsetHeight;
  const range = Hs + V;
  const revealEnd = (1.24 * V) / range; // 1.24 = one viewport + the 24vh About bottom feather
  const coverStart = Hs / range;
  const crossEnd = coverStart + 0.85 * (1 - coverStart);

  // End the scrub at the screen-stack's pin ("top top"), NOT the spacer bottom — that is the
  // exact scroll where About 2 takes over, so the timeline maps 1:1 onto the geometry above.
  // Fall back to the spacer's own bottom if the stack isn't present.
  const endConfig: { endTrigger?: HTMLElement; end: string } = screenStack
    ? { endTrigger: screenStack, end: "top top" }
    : { end: "bottom top" };
  const tl = gsap.timeline({
    scrollTrigger: { trigger: spacer, start: "top bottom", ...endConfig, scrub: 1 },
  });

  // Fixed timeline length; every keyframe below is placed as a fraction of it.
  const DUR = 8.5;

  // Camera — hold a calm establishing shot through the feathered REVEAL and COVER, and do
  // the fly-through (incl. the close-up) only inside the fully-visible window. A close-up
  // landing during the cover would be wasted on a darkening frame; a calm front shot feathers
  // cleanly. The head/tail holds derive from the geometry so the framing tracks the feathers.
  let headHold = revealEnd * DUR;
  let tailHold = (1 - coverStart) * DUR;
  const minFly = 2.0;
  if (headHold + tailHold > DUR - minFly) {
    const s = (DUR - minFly) / (headHold + tailHold);
    headHold *= s;
    tailHold *= s;
  }
  const flySpan = DUR - headHold - tailHold;
  // Cross-dissolve framing: a frame-FILLING front shot (not the small establishing one) so the
  // cylinder fills the viewport edge-to-edge as the calm photo fades in over it — the fondu
  // reads as one full-frame image becoming another, with no black margin peeking at the edges.
  const coverZ = Math.max(4, initialCameraZ * 0.5);
  tl.to(cameraAnim, { z: initialCameraZ, duration: headHold, ease: "none" }) // hold establishing (reveal)
    .to(cameraAnim, { x: 0, y: 4, z: 5, duration: flySpan * 0.28, ease: "cinematicFlow" }) // rise / overhead
    .to(cameraAnim, { x: 1.3, y: 1.6, z: 1.7, duration: flySpan * 0.2, ease: "cinematicLinear" }) // swing in
    .to(cameraAnim, { x: 0.4, y: 0, z: 0.9, duration: flySpan * 0.22, ease: "power1.inOut" }) // close-up (mid window)
    .to(cameraAnim, { x: 0, y: 0, z: coverZ, duration: flySpan * 0.3, ease: "cinematicSmooth" }) // pull back to a frame-filling cover shot
    .to(cameraAnim, { z: coverZ, duration: tailHold, ease: "none" }); // hold it through the cover

  // Spin: steady through the fly-through, then DECELERATE to a near-stop across the fondu —
  // "le cylindre ralentit sa rotation et se fond". Two tweens so the tail can ease-out.
  tl.to(rotationAnim, { y: `+=${28.27 * coverStart}`, duration: coverStart * DUR, ease: "none" }, 0);
  tl.to(
    rotationAnim,
    { y: `+=${28.27 * (1 - coverStart) * 0.55}`, ease: "power2.out", duration: (crossEnd - coverStart) * DUR },
    coverStart * DUR
  );

  // FONDU — the cylinder cross-dissolves into the calm Promesse photo across the stack's rise.
  //  • the calm photo layer (fixed z:-1, ABOVE the cylinder stage) fades opacity 0 → 1 over the
  //    window. The OPAQUE photo is what covers the cylinder, so it's a real cross-dissolve (you
  //    see the textured cylinder BECOME the photo). Its vertical PARALLAX (a top→bottom drift of
  //    the tall inner image while the message is read) is owned by about-scroll.ts.
  //  • uDarkness only dims 0.3 → 0.7 (LINEAR) over the same window — a soft dim so the bright
  //    project cells don't fight the calm photo at the 50/50 blend, while the cylinder stays
  //    visibly textured through it (a hard dim-to-black would hide the cylinder before the photo
  //    arrived → "fade through black", not a fondu). No flash risk: the photo is the cover and is
  //    scrubbed in lockstep, so a momentum bounce just runs the cross-dissolve smoothly backwards.
  // Both finish by cross_end; a short settle holds to the pin, where the screen-stack text writes in.
  if (calmPhoto) {
    tl.fromTo(
      calmPhoto,
      { opacity: 0 },
      { opacity: 1, ease: "power1.inOut", duration: (crossEnd - coverStart) * DUR },
      coverStart * DUR
    );
  }
  tl.to(
    darknessAnim,
    { v: 0.7, ease: "none", duration: (crossEnd - coverStart) * DUR },
    coverStart * DUR
  );

  // Captions — all four land inside the fully-visible window [reveal_end, cover_start], so the
  // FIRST one is actually seen (it no longer plays behind the descending About). The LAST
  // ("Kulturecom") holds to cover_start, then fades over the first part of the fondu — gone by
  // mid-cross-dissolve as the cylinder gives way to the photo, never held alone.
  const w0 = revealEnd * DUR;
  const w1 = coverStart * DUR;
  const wCover = w1 + (crossEnd - coverStart) * DUR * 0.6;
  const N = captions.length || 1;
  const slot = (w1 - w0) / N;
  captions.forEach((cap, i) => {
    const at = w0 + i * slot;
    tl.fromTo(cap, { opacity: 0 }, { opacity: 1, duration: slot * 0.25, ease: "cinematicSmooth" }, at);
    if (i === N - 1) {
      tl.to(cap, { opacity: 1, duration: Math.max(0, w1 - (at + slot * 0.25)) }, at + slot * 0.25)
        .to(cap, { opacity: 0, duration: Math.max(0.3, wCover - w1), ease: "cinematicSmooth" }, w1);
      return;
    }
    tl.to(cap, { opacity: 1, duration: slot * 0.5 }, at + slot * 0.25)
      .to(cap, { opacity: 0, duration: slot * 0.25, ease: "cinematicSmooth" }, at + slot * 0.75);
  });

  // Gate the render loop AND the cylinder stage's visibility on the spacer→screen-stack span.
  // The stage stays rendered until the pin; by then the cylinder is dimmed to #0b0b0b and the
  // calm photo (a separate z:-1 layer, opacity-driven by the timeline above) has fully faded in
  // over it, so hiding the stage at the pin is invisible — the photo is already the background.
  // Same start/endTrigger as the timeline → lockstep.
  ScrollTrigger.create({
    trigger: spacer,
    start: "top bottom",
    ...endConfig,
    onToggle: (self) => {
      inRange = self.isActive;
      if (inRange) {
        // Entering → show the stage + render.
        setStageVisible(true);
        forceDraw = true;
        startLoop();
      } else if (!renderFrame) {
        // Leaving with NO WebGL loop (fallback / not yet booted) → nothing to settle,
        // so hide immediately (the old behaviour; settle-then-park only applies when a
        // cylinder is actually rendering).
        setStageVisible(false);
      } else {
        // Leaving WITH a live WebGL loop → DO NOT hide now. Keep rendering so the scrub
        // can finish the cross-dissolve; loop() hides + parks once scrubSettled()
        // (settle-then-park, above). This is what kills the fast-scroll flash.
        startLoop();
      }
    },
  });

  // WebGL boot. Context creation + shader compile + atlas are main-thread work that used to
  // land mid-scroll (one viewport early = right as the hero pin releases) and froze the page.
  // So boot while the visitor reads the hero (idle time after its arrival cascade); the
  // IntersectionObserver, one viewport early, stays as the fallback for fast scrollers.
  let booted = false;
  const startBoot = (): void => {
    if (booted) return;
    booted = true;
    io.disconnect();
    try {
      boot();
    } catch (err) {
      console.error("Cinematic: WebGL boot failed, showing fallback.", err);
      showFallback();
    }
  };
  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) startBoot();
    },
    { rootMargin: "100% 0px" }
  );
  io.observe(spacer);
  document.addEventListener(
    "hero:revealed",
    () => {
      if ("requestIdleCallback" in window) requestIdleCallback(startBoot, { timeout: 2000 });
      else setTimeout(startBoot, 200);
    },
    { once: true }
  );

  function boot(): void {
    const cylinderConfig = {
      radius: window.innerWidth > 768 ? 2.5 : 2.2,
      height: window.innerWidth > 768 ? 2 : 1.2,
      radialSegments: 64,
      heightSegments: 1,
    };

    const getResponsiveDimensions = () => {
      const width = window.innerWidth;
      const mobile = width < 768;
      const tablet = width >= 768 && width < 1024;
      const maxRadius = mobile ? 1.8 : tablet ? 2.2 : 2.5;
      const cameraZ = mobile ? 6 : tablet ? 7 : 8;
      const fov = mobile ? 50 : 45;
      return { cylinderScale: maxRadius / cylinderConfig.radius, cameraZ, fov, mobile };
    };
    const dimensions = getResponsiveDimensions();

    const dpr = Math.min(window.devicePixelRatio, 2);
    const renderer = new Renderer({
      canvas: canvas as HTMLCanvasElement,
      width: window.innerWidth,
      height: window.innerHeight,
      dpr,
      alpha: true,
      // MSAA only below DPR 2. On Retina the jaggies are half a CSS pixel (invisible), but 4×
      // multisampling this full-viewport canvas saturated an Intel iGPU: 39 → 59 fps without it.
      antialias: dpr < 2,
    });
    const gl = renderer.gl;
    // Match the site's near-black (#0b0b0b) used by the dark About sections, rather
    // than pure #000 — keeps the cinematic band consistent with the rest of the site.
    gl.clearColor(0x0b / 255, 0x0b / 255, 0x0b / 255, 1);
    gl.disable(gl.CULL_FACE);

    canvas!.addEventListener(
      "webglcontextlost",
      (e) => {
        e.preventDefault();
        // Context lost — stop the WebGL loop (null renderFrame trips the loop guard)
        // and show the static fallback. Visibility stays gate-managed: with renderFrame
        // now null, the gate's no-WebGL branch hides the stage on leave.
        renderFrame = null;
        showFallback();
      },
      { once: true }
    );

    // Always set aspect to the real viewport ratio (the Codrops source only did so
    // on mobile, leaving desktop at OGL's default aspect of 1 → horizontal stretch).
    const camera = new Camera(gl, {
      fov: dimensions.fov,
      aspect: window.innerWidth / window.innerHeight,
    });
    camera.position.set(0, 0, dimensions.cameraZ);

    const scene = new Transform();
    const geometry = createCylinderGeometry(gl, cylinderConfig);

    // --- Build the atlas: every image cover-drawn into one wide canvas texture. ---
    const hardwareLimit = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
    // Desktop cap raised 8192 → 16384: at 8192 the 12-image atlas was downscaled to
    // ~683px per cell (scale ≈ 0.67), softening even the high-res sources. 16384 lets
    // the atlas hold full 1024px cells (scale = 1) so HD images render sharp at the
    // close-up climax. Guarded by the real GPU MAX_TEXTURE_SIZE; mobile stays 2048.
    const safeLimit = dimensions.mobile ? 2048 : Math.min(hardwareLimit, 16384);
    const numImages = IMAGES.length;
    const totalWidthOriginal = imageConfig.width * numImages;
    const heightOriginal = imageConfig.height;
    const scale = Math.min(1, safeLimit / totalWidthOriginal);

    const atlas = document.createElement("canvas");
    atlas.width = Math.floor(totalWidthOriginal * scale);
    atlas.height = Math.floor(heightOriginal * scale);
    const ctx = atlas.getContext("2d", { willReadFrequently: false, alpha: false });
    if (!ctx) {
      showFallback();
      return;
    }
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, atlas.width, atlas.height);

    // Mobile-only vertical squash so cover-drawn images aren't stretched on resize.
    const circumference = 2 * Math.PI * cylinderConfig.radius;
    const textureAspectRatio = imageConfig.height / (imageConfig.width * numImages);
    const heightCorrection = (circumference * textureAspectRatio) / cylinderConfig.height;

    let settled = 0;
    const onSettle = (): void => {
      settled++;
      if (settled === numImages) buildScene();
    };
    // fetch + createImageBitmap decodes OFF the main thread. Drawing plain <img>s here forced a
    // synchronous decode of all 12 images in a single task (~0.6 s on an Intel iGPU Mac) that
    // froze the scroll. Each cell is drawn as soon as its own bitmap is ready, so the remaining
    // (cheap) draws are spread out. A failed cell stays black rather than blanking all.
    // When the cells are smaller than the design size (mobile: ~170 px), the decoder also
    // downscales each image to the cell height, so the GPU isn't fed tens of MB of full-size
    // bitmaps for tiny cells (that upload blocked the main thread ~0.2 s on a mid-range phone).
    const decodeOptions: ImageBitmapOptions | undefined =
      atlas.height < imageConfig.height
        ? { resizeHeight: atlas.height, resizeQuality: "high" }
        : undefined;
    IMAGES.forEach((src, i) => {
      fetch(src)
        .then((res) => res.blob())
        .then((blob) => createImageBitmap(blob, decodeOptions))
        .then((bitmap) => {
          const xPos = Math.floor((i / numImages) * atlas.width);
          const xEnd = Math.floor(((i + 1) / numImages) * atlas.width);
          drawImageCover(ctx, bitmap, xPos, 0, xEnd - xPos, atlas.height);
          bitmap.close();
        })
        .catch(() => console.error("Cinematic: image failed to load:", src))
        .finally(onSettle);
    });

    let lastWidth = window.innerWidth;
    let cylinder: Mesh;
    const particles: ParticleMesh[] = [];

    function buildScene(): void {
      const texture = new Texture(gl, {
        wrapS: gl.CLAMP_TO_EDGE,
        wrapT: gl.CLAMP_TO_EDGE,
        minFilter: gl.LINEAR,
        magFilter: gl.LINEAR,
        generateMipmaps: false,
      });
      texture.image = atlas;
      texture.needsUpdate = true;

      const program = new Program(gl, {
        vertex: cylinderVertex,
        fragment: cylinderFragment,
        uniforms: { tMap: { value: texture }, uDarkness: { value: 0.3 } },
        cullFace: null,
      });

      cylinder = new Mesh(gl, { geometry, program });
      cylinder.setParent(scene);
      cylinder.scale.set(dimensions.cylinderScale, dimensions.cylinderScale, dimensions.cylinderScale);

      // --- Velocity-reactive line particles. ---
      // ONE program for all lines: their opacity is always identical (same target, same lerp
      // from 0), so sharing it saves 11 shader compiles at boot.
      const lineProgram = new Program(gl, {
        vertex: particleVertex,
        fragment: particleFragment,
        uniforms: { uColor: { value: [1, 1, 1] }, uOpacity: { value: 0 } },
        transparent: true,
        depthTest: true,
      });
      for (let i = 0; i < particleConfig.numParticles; i++) {
        const { geometry: lineGeometry, userData } = createParticleGeometry(
          gl,
          particleConfig,
          i,
          cylinderConfig.height
        );
        const particle = new Mesh(gl, {
          geometry: lineGeometry,
          program: lineProgram,
          mode: gl.LINE_STRIP,
        }) as ParticleMesh;
        particle.userData = userData;
        particle.setParent(scene);
        particles.push(particle);
      }

      // --- The render frame (gated by `inRange` + settle-then-park via the loop above). ---
      let lastRotation = rotationAnim.y;
      let lastDrawn = "";
      renderFrame = () => {
        camera.position.set(cameraAnim.x, cameraAnim.y, cameraAnim.z);
        camera.lookAt([0, 0, 0]);
        cylinder.rotation.y = rotationAnim.y;
        program.uniforms.uDarkness.value = darknessAnim.v;

        const velocity = rotationAnim.y - lastRotation;
        lastRotation = rotationAnim.y;
        const speed = Math.abs(velocity) * 100;
        const isRotating = Math.abs(velocity) > 0.0001;

        // Fade the line particles out as the cover dim ramps in (darknessAnim 0.3 → 0.5
        // over the cover window), so no faint motion lines linger above the rising feather.
        const particleFade = Math.max(0, 1 - (darknessAnim.v - 0.3) / 0.2);
        const targetOpacity = (isRotating ? Math.min(speed * 3, 0.95) : 0) * particleFade;
        const opacity = lineProgram.uniforms.uOpacity;
        opacity.value += (targetOpacity - opacity.value) * 0.15;
        particles.forEach((particle) => {
          const ud = particle.userData;
          if (!isRotating) return;
          ud.baseAngle += velocity * ud.speed * 1.5;
          const segments = particleConfig.segments;
          const pos = particle.geometry.attributes.position.data as Float32Array;
          for (let j = 0; j <= segments; j++) {
            const t = j / segments;
            const angle = ud.baseAngle + ud.angleSpan * t;
            pos[j * 3] = Math.cos(angle) * ud.radius;
            pos[j * 3 + 1] = ud.baseY;
            pos[j * 3 + 2] = Math.sin(angle) * ud.radius;
          }
          particle.geometry.attributes.position.needsUpdate = true;
        });

        // Draw only when something visible changed: once the scrub settles (scroll idle) the
        // frame is static, so the canvas keeps its last frame and the GPU stays idle.
        const state = `${cameraAnim.x} ${cameraAnim.y} ${cameraAnim.z} ${rotationAnim.y} ${darknessAnim.v} ${opacity.value.toFixed(3)}`;
        if (!forceDraw && state === lastDrawn) return;
        forceDraw = false;
        lastDrawn = state;
        renderer.render({ scene, camera });
      };

      // Pre-warm while the stage is still hidden: this first draw uploads the atlas texture and
      // links the shaders now (at boot) rather than on the first visible frame, mid-scroll.
      // The texture then lives on the GPU, so the 2D atlas copy (~50 MB on desktop) is dropped.
      renderFrame();
      atlas.width = atlas.height = 0;

      window.addEventListener("resize", handleResize);

      // The atlas may finish while the stage is already in view (e.g. a reload scrolled into
      // the sequence/cover) — the gate's onToggle won't fire for an already-active trigger, so
      // seed `inRange` from the live rects: the spacer has entered AND the screen-stack hasn't
      // pinned/covered yet (its top still below the viewport top).
      const sRect = spacer!.getBoundingClientRect();
      const stackTop = screenStack ? screenStack.getBoundingClientRect().top : sRect.bottom;
      if (sRect.top < window.innerHeight && stackTop > 0) {
        inRange = true;
        setStageVisible(true);
      }
      startLoop();
    }

    function handleResize(): void {
      const currentWidth = window.innerWidth;
      const dims = getResponsiveDimensions();
      // Mobile address-bar show/hide fires a resize with UNCHANGED width — ignore it,
      // else the camera re-zooms and crops the cylinder.
      if (dims.mobile && currentWidth === lastWidth) return;
      lastWidth = currentWidth;

      renderer.setSize(currentWidth, window.innerHeight);
      camera.perspective({ fov: dims.fov, aspect: currentWidth / window.innerHeight });
      forceDraw = true; // resizing cleared the drawing buffer
      if (!cylinder) return;
      if (dims.mobile) {
        cylinder.scale.set(dims.cylinderScale, dims.cylinderScale * heightCorrection, dims.cylinderScale);
      } else {
        cylinder.scale.set(dims.cylinderScale, dims.cylinderScale, dims.cylinderScale);
      }
    }
  }
}
