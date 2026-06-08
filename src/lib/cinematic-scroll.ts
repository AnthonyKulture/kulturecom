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
  uniform float uDarkness; // 0.0 = normal, 1.0 = fully black
  varying vec2 vUv;
  void main() {
    vec4 tex = texture2D(tMap, vUv);
    tex.rgb *= (1.0 - uDarkness);
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

  // Camera position, cylinder rotation and texture darkness are tweened on PLAIN
  // objects; the cylinder (created later, lazily) reads them every frame. ONE scrubbed
  // timeline, driven by the scroll spacer, runs the whole sequence — the Codrops
  // single-timeline model. The fixed stage never moves; only this timeline animates.
  const initialCameraZ = window.innerWidth < 768 ? 6 : window.innerWidth < 1024 ? 7 : 8;
  const cameraAnim = { x: 0, y: 0, z: initialCameraZ };
  const rotationAnim = { y: 0.5 };
  // Texture darkness → `uDarkness` uniform (1 = full black, 0.3 = normal). Starts black
  // so the cylinder EMERGES from black once the About has scrolled off the stage, and
  // DISSOLVES back to black before the screen-stack scrolls over it — both ends
  // dark-on-dark, so the reveal and cover are seamless and the stage never seems to move.
  const darknessAnim = { v: 1 };

  // The spacer scrubs the timeline. Start at "top bottom" (the moment the About begins
  // scrolling off, revealing the stage) so the cylinder EMERGES during that reveal —
  // no dead black scroll waiting for the About to fully clear first.
  const tl = gsap.timeline({
    scrollTrigger: { trigger: spacer, start: "top bottom", end: "bottom bottom", scrub: 1 },
  });
  tl.to(cameraAnim, { x: 0, y: 0, z: initialCameraZ, duration: 1, ease: "cinematicSilk" })
    .to(cameraAnim, { x: 0, y: 5, z: 5, duration: 1, ease: "cinematicFlow" })
    .to(cameraAnim, { x: 1.5, y: 2, z: 2, duration: 2, ease: "cinematicLinear" })
    .to(cameraAnim, { x: 0.5, y: 0, z: 0.8, duration: 3.5, ease: "power1.inOut" })
    // Final keyframe: settle back to a front establishing shot (no fly-away "descent").
    .to(cameraAnim, { x: 0, y: 0, z: initialCameraZ, duration: 1, ease: "cinematicSmooth" });
  tl.to(rotationAnim, { y: "+=28.27", duration: 8.5, ease: "none" }, 0);
  // Emerge from black over the reveal (longer, so it tracks the About scrolling off),
  // dissolve back to black over the last stretch (total 8.5).
  tl.to(darknessAnim, { v: 0.3, duration: 1.2, ease: "power2.out" }, 0);
  tl.to(darknessAnim, { v: 1, duration: 1.0, ease: "power2.in" }, 7.5);

  // Captions fade in/out, one per scroll-quarter, folded into the same scrubbed timeline.
  const seg = tl.duration() / (captions.length || 1);
  captions.forEach((cap, i) => {
    const at = i * seg;
    tl.fromTo(cap, { opacity: 0 }, { opacity: 1, duration: seg * 0.2, ease: "cinematicSmooth" }, at)
      .to(cap, { opacity: 1, duration: seg * 0.55 }, at + seg * 0.2)
      .to(cap, { opacity: 0, duration: seg * 0.25, ease: "cinematicSmooth" }, at + seg * 0.75);
  });

  // Gate the render loop AND the stage's visibility on the spacer being in view — i.e.
  // whenever the fixed stage could be on screen (during the reveal, sequence, and cover).
  ScrollTrigger.create({
    trigger: spacer,
    start: "top bottom",
    end: "bottom top",
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

        particles.forEach((particle) => {
          const ud = particle.userData;
          const targetOpacity = isRotating ? Math.min(speed * 3, 0.95) : 0;
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

      // The atlas may finish while the spacer is already in view (e.g. a reload
      // scrolled into the sequence) — the gating trigger's onToggle won't necessarily
      // fire for an already-active trigger, so seed `running` from the live rect.
      const rect = spacer!.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
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
