'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

export type CarouselIntervalMs = number | ((slideIndex: number) => number);

function resolveIntervalMs(intervalMs: CarouselIntervalMs, slideIndex: number): number {
  return typeof intervalMs === 'function' ? intervalMs(slideIndex) : intervalMs;
}

/**
 * Auto-advance carousel index; pauses on hover (unless disabled).
 * When `respectReducedMotion` is true, autoplay is off if the user prefers reduced motion.
 * `intervalMs` may be a function for per-slide durations (e.g. paid exposure bonus).
 * Interval callbacks are read via ref so unstable function identities do not reset the timer.
 */
export function useCarouselAutoplay(
  itemCount: number,
  intervalMs: CarouselIntervalMs = 5500,
  disablePauseOnHover = false,
  respectReducedMotion = true,
) {
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef(intervalMs);
  intervalRef.current = intervalMs;

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
    const ms = resolveIntervalMs(intervalRef.current, slide);
    const id = window.setTimeout(() => {
      setSlide((s) => (s + 1) % itemCount);
    }, Math.max(250, ms));
    return () => clearTimeout(id);
  }, [itemCount, paused, disablePauseOnHover, respectReducedMotion, slide]);

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
