import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Auto-playing hero slideshow (max 5 images).
 * Pauses on hover, respects reduced-motion, renders a static image for a single slide.
 */
export function HeroCarousel({
  images,
  alt,
  className,
  imageClassName,
  interval = 3000,
  dotTone = "dark",
}: {
  images: string[];
  alt: string;
  className?: string;
  imageClassName?: string;
  interval?: number;
  dotTone?: "dark" | "light";
}) {
  const slides = images.filter(Boolean).slice(0, 5);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (slides.length < 2 || paused || reduced.current) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, interval);
    return () => window.clearInterval(id);
  }, [slides.length, paused, interval]);

  if (slides.length === 0) return null;

  return (
    <div
      className={cn("relative isolate overflow-hidden", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((src, i) => (
        <img
          key={`${src}-${i}`}
          src={src}
          alt={i === index ? alt : ""}
          aria-hidden={i !== index}
          width={1600}
          height={906}
          decoding="async"
          loading={i === 0 ? "eager" : "lazy"}
          {...(i === 0 ? { fetchPriority: "high" as const } : {})}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-700",
            i === index ? "opacity-100" : "opacity-0",
            imageClassName,
          )}
        />
      ))}
      {slides.length > 1 && (
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          {slides.map((src, i) => (
            <button
              key={`dot-${src}-${i}`}
              type="button"
              aria-label={`Ảnh ${i + 1}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === index ? "w-6" : "w-1.5",
                dotTone === "dark" ? "bg-primary-foreground" : "bg-foreground",
                i === index ? "opacity-90" : "opacity-45",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
