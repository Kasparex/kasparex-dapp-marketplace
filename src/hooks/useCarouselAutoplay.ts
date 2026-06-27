'use client';

import { useEffect, useMemo, useState } from 'react';

export type CarouselIntervalMs = number | ((slideIndex: number) => number);

function resolveIntervalMs(intervalMs: CarouselIntervalMs, slideIndex: number): number {
  return typeof intervalMs === 'function' ? intervalMs(slideIndex) : intervalMs;
}

/**
 * Auto-advance carousel index; pauses on hover (unless disabled).
 * When `respectReducedMotion` is true, autoplay is off if the user prefers reduced motion.
 * `intervalMs` may be a function for per-slide durations (e.g. paid exposure bonus).
 */
export function useCarouselAutoplay(
  itemCount: number,
  intervalMs: CarouselIntervalMs = 5500,
  disablePauseOnHover = false,
  respectReducedMotion = true,
) {
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setSlide((s) => Math.min(s, Math.max(0, itemCount - 1)));
  }, [itemCount]);

  useEffect(() => {
    if (itemCount <= 1 || (!disablePauseOnHover && paused)) return;
    if (
      respectReducedMotion &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }
    const ms = resolveIntervalMs(intervalMs, slide);
    const id = window.setTimeout(() => {
      setSlide((s) => (s + 1) % itemCount);
    }, ms);
    return () => clearTimeout(id);
  }, [itemCount, intervalMs, paused, disablePauseOnHover, respectReducedMotion, slide]);

  const pauseOnHover = useMemo(
    () =>
      disablePauseOnHover
        ? {}
        : {
            onMouseEnter: () => setPaused(true),
            onMouseLeave: () => setPaused(false),
          },
    [disablePauseOnHover],
  );

  return { slide, setSlide, pauseOnHover };
}
