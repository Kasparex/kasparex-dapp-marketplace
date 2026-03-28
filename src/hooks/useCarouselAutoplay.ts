'use client';

import { useEffect, useMemo, useState } from 'react';

/**
 * Auto-advance carousel index; pauses on hover and when prefers-reduced-motion is set.
 */
export function useCarouselAutoplay(itemCount: number, intervalMs = 5500) {
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setSlide((s) => Math.min(s, Math.max(0, itemCount - 1)));
  }, [itemCount]);

  useEffect(() => {
    if (itemCount <= 1 || paused) return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const id = window.setInterval(() => {
      setSlide((s) => (s + 1) % itemCount);
    }, intervalMs);
    return () => clearInterval(id);
  }, [itemCount, intervalMs, paused]);

  const pauseOnHover = useMemo(
    () => ({
      onMouseEnter: () => setPaused(true),
      onMouseLeave: () => setPaused(false),
    }),
    []
  );

  return { slide, setSlide, pauseOnHover };
}
