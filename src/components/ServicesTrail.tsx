import { useEffect, useRef, useState } from "react";
import { ImageTrail } from "~/components/ui/image-trail";

const SLIDES = Array.from(
  { length: 20 },
  (_, i) => `/hero-slides/slide-${String(i + 1).padStart(2, "0")}.webp`
);

export default function ServicesTrail() {
  const ref = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    setEnabled(mq.matches);
    const handler = (e: MediaQueryListEvent) => setEnabled(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (!enabled) return null;

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      <ImageTrail containerRef={ref}>
        {SLIDES.map((src, i) => (
          <div
            key={i}
            className="relative h-32 w-24 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-sm sm:h-40 sm:w-32 md:h-48 md:w-36"
          >
            <img
              src={src}
              alt=""
              className="absolute inset-0 block h-full w-full object-cover"
            />
          </div>
        ))}
      </ImageTrail>
    </div>
  );
}
