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
 *  - WebGL boots LAZILY (IntersectionObserver, one viewport early) and the rAF render
 *    loop is GATED to the section's visibility + tab focus, so the GPU is idle
 *    everywhere else on the page (this site deliberately lazy-loads and keeps mobile
 *    touch native for INP — same budget discipline).
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
  "/hero-slides/vaulk.webp",
  "/hero-slides/bucket-regatta-2927.webp",
  "/hero-slides/slide-05.webp",
  "/hero-slides/slide-08.webp",
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
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const canvasRatio = w / h;
  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = img.naturalWidth;
  let sourceHeight = img.naturalHeight;
  if (imgRatio > canvasRatio) {
    sourceWidth = img.naturalHeight * canvasRatio;
    sourceX = (img.naturalWidth - sourceWidth) / 2;
  } else {
    sourceHeight = img.naturalWidth / canvasRatio;
    sourceY = (img.naturalHeight - sourceHeight) / 2;
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
  // The soft cover feather (after the spacer) and the screen-stack below — used to drive
  // the timeline by the REAL reveal→cover geometry (the timeline ends at the screen-stack
  // pin, not the spacer bottom). Both optional: fall back to the spacer-only geometry.
  const coverFeather = section.querySelector<HTMLElement>("[data-cinematic-cover-feather]");
  const screenStack = document.querySelector<HTMLElement>("[data-screen-stack]");

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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

  // --- rAF gating: renderFrame is assigned at boot; the loop is a no-op until then,
  //     and parks itself whenever the stage is off-screen or the tab is hidden. ---
  let running = false;
  let rafId = 0;
  let renderFrame: (() => void) | null = null;
  const loop = (): void => {
    if (!running || document.hidden || !renderFrame) {
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
  // Texture darkness → `uDarkness` uniform (0.3 = the normal look). The cylinder stays LIT
  // the whole time — the feathers do the soft reveal/cover (About's bottom feather on the
  // way in, the cover feather on the way out). This value is only nudged a little darker
  // over the cover window so bright image cells lose their edge as the feather crosses them
  // (no faint "horizon"). No black emerge — it starts at the normal look.
  const darknessAnim = { v: 0.3 };

  // === Reveal→cover geometry — so the timeline is SYNCED to what is actually on screen ===
  // DOM order: [About wrapper][spacer Hs][cover feather Hf][screen-stack]. The scrub runs
  // from "spacer top at viewport bottom" to "screen-stack top at viewport top" (its pin) —
  // range = Hs + Hf + V. As progress p ∈ [0,1]:
  //   • reveal_end = (V + about-feather 24vh) / range — About + its feather have cleared the
  //     viewport, the full cylinder is visible. Captions must not start before this, else
  //     they play behind the still-descending About (the bug being fixed).
  //   • cover_start = Hs / range — the cover feather's transparent top enters the viewport
  //     bottom and begins swallowing the lit cylinder.
  //   • cover_solid = (Hs + Hf) / range — the feather's solid #0b0b0b bottom (= screen-stack
  //     top) enters; from there the screen-stack covers the rest up to the pin (p = 1).
  const V = window.innerHeight;
  const Hs = spacer.offsetHeight;
  const Hf = coverFeather ? coverFeather.offsetHeight : 0;
  const range = Hs + Hf + V;
  const revealEnd = (1.24 * V) / range; // 1.24 = one viewport + the 24vh About bottom feather
  const coverStart = Hs / range;
  const coverSolid = (Hs + Hf) / range;

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
  // Cover framing: a frame-FILLING front shot (not the small establishing one). If the
  // cylinder sat small and centred during the cover, its black top margin would be the last
  // thing the rising feather covered → a dead-black tail before the curtain. Filling the
  // frame lets the feather swallow the cylinder edge-to-edge, right up to the pin.
  const coverZ = Math.max(4, initialCameraZ * 0.5);
  tl.to(cameraAnim, { z: initialCameraZ, duration: headHold, ease: "none" }) // hold establishing (reveal)
    .to(cameraAnim, { x: 0, y: 4, z: 5, duration: flySpan * 0.28, ease: "cinematicFlow" }) // rise / overhead
    .to(cameraAnim, { x: 1.3, y: 1.6, z: 1.7, duration: flySpan * 0.2, ease: "cinematicLinear" }) // swing in
    .to(cameraAnim, { x: 0.4, y: 0, z: 0.9, duration: flySpan * 0.22, ease: "power1.inOut" }) // close-up (mid window)
    .to(cameraAnim, { x: 0, y: 0, z: coverZ, duration: flySpan * 0.3, ease: "cinematicSmooth" }) // pull back to a frame-filling cover shot
    .to(cameraAnim, { z: coverZ, duration: tailHold, ease: "none" }); // hold it through the cover

  tl.to(rotationAnim, { y: "+=28.27", duration: DUR, ease: "none" }, 0);

  // Dissolve the cylinder fully to the site background (#0b0b0b) over the cover window:
  // 0.3 → 1.0 across [cover_start, cover_solid] (complements the feather; kills any horizon
  // on bright image cells). It reaches FULL dissolve at cover_solid and holds 1.0 to the end,
  // so the cinematic's exit state — and the whole [cover_solid → pin] handoff zone — is solid
  // site-black. This is what kills the mobile "cylinder flash": the stage's visibility gate is
  // instant (onToggle) while this dim is scrubbed, so a momentum bounce / scroll-up near the
  // pin re-exposes the stage; with the cylinder dissolved to #0b0b0b that re-exposure is
  // invisible against the About 2 backdrop (it used to flash the still-lit cylinder + particles).
  tl.to(
    darknessAnim,
    { v: 1.0, ease: "power2.in", duration: Math.max(0.4, (coverSolid - coverStart) * DUR) },
    coverStart * DUR
  );

  // Captions — all four land inside the fully-visible window [reveal_end, cover_start], so the
  // FIRST one is actually seen (it no longer plays behind the descending About). The LAST
  // ("Kulturecom") holds to cover_start, then fades over [cover_start, cover_solid] — dissolving
  // WITH the rising cover, integrated, never held alone on dead black.
  const w0 = revealEnd * DUR;
  const w1 = coverStart * DUR;
  const wCover = coverSolid * DUR;
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

  // Gate the render loop AND the stage's visibility on the spacer→screen-stack span. The
  // stage MUST stay rendered until the screen-stack pins (its opaque backdrop then covers it),
  // because the cover feather's transparent half only reads as "cylinder" — not the cream body
  // — while the stage is still visible behind it. Same start/endTrigger as the timeline → lockstep.
  ScrollTrigger.create({
    trigger: spacer,
    start: "top bottom",
    ...endConfig,
    onToggle: (self) => {
      running = self.isActive;
      setStageVisible(self.isActive);
      if (running) startLoop();
    },
  });

  // Lazy WebGL boot — one viewport early so the atlas is ready by the time it shows.
  let booted = false;
  const io = new IntersectionObserver(
    (entries) => {
      if (booted || !entries.some((e) => e.isIntersecting)) return;
      booted = true;
      io.disconnect();
      try {
        boot();
      } catch (err) {
        console.error("Cinematic: WebGL boot failed, showing fallback.", err);
        showFallback();
      }
    },
    { rootMargin: "100% 0px" }
  );
  io.observe(spacer);

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

    const renderer = new Renderer({
      canvas: canvas as HTMLCanvasElement,
      width: window.innerWidth,
      height: window.innerHeight,
      dpr: Math.min(window.devicePixelRatio, 2),
      alpha: true,
      antialias: true,
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
        running = false;
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
    const safeLimit = dimensions.mobile ? 2048 : Math.min(hardwareLimit, 8192);
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

    const imageElements: (HTMLImageElement | null)[] = new Array(numImages).fill(null);
    let settled = 0;
    const onSettle = (): void => {
      settled++;
      if (settled !== numImages) return;
      // Draw whatever loaded; any failed cell stays black rather than blanking all.
      imageElements.forEach((img, i) => {
        if (!img) return;
        const xPos = Math.floor((i / numImages) * atlas.width);
        const xEnd = Math.floor(((i + 1) / numImages) * atlas.width);
        drawImageCover(ctx, img, xPos, 0, xEnd - xPos, atlas.height);
      });
      buildScene();
    };
    IMAGES.forEach((src, index) => {
      const img = new Image();
      img.onload = () => {
        imageElements[index] = img;
        onSettle();
      };
      img.onerror = () => {
        console.error("Cinematic: image failed to load:", src);
        onSettle();
      };
      img.src = src;
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
      for (let i = 0; i < particleConfig.numParticles; i++) {
        const { geometry: lineGeometry, userData } = createParticleGeometry(
          gl,
          particleConfig,
          i,
          cylinderConfig.height
        );
        const lineProgram = new Program(gl, {
          vertex: particleVertex,
          fragment: particleFragment,
          uniforms: { uColor: { value: [1, 1, 1] }, uOpacity: { value: 0 } },
          transparent: true,
          depthTest: true,
        });
        const particle = new Mesh(gl, {
          geometry: lineGeometry,
          program: lineProgram,
          mode: gl.LINE_STRIP,
        }) as ParticleMesh;
        particle.userData = userData;
        particle.setParent(scene);
        particles.push(particle);
      }

      // --- The render frame (gated by `running` via the loop above). ---
      let lastRotation = rotationAnim.y;
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
        particles.forEach((particle) => {
          const ud = particle.userData;
          const targetOpacity =
            (isRotating ? Math.min(speed * 3, 0.95) : 0) * particleFade;
          const cur = particle.program.uniforms.uOpacity.value as number;
          particle.program.uniforms.uOpacity.value = cur + (targetOpacity - cur) * 0.15;
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

        renderer.render({ scene, camera });
      };

      window.addEventListener("resize", handleResize);

      // The atlas may finish while the stage is already in view (e.g. a reload scrolled into
      // the sequence/cover) — the gate's onToggle won't fire for an already-active trigger, so
      // seed `running` from the live rects: the spacer has entered AND the screen-stack hasn't
      // pinned/covered yet (its top still below the viewport top).
      const sRect = spacer!.getBoundingClientRect();
      const stackTop = screenStack ? screenStack.getBoundingClientRect().top : sRect.bottom;
      if (sRect.top < window.innerHeight && stackTop > 0) {
        running = true;
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
      if (!cylinder) return;
      if (dims.mobile) {
        cylinder.scale.set(dims.cylinderScale, dims.cylinderScale * heightCorrection, dims.cylinderScale);
      } else {
        cylinder.scale.set(dims.cylinderScale, dims.cylinderScale, dims.cylinderScale);
      }
    }
  }
}
