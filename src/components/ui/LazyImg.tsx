/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  src: string | null | undefined;
  alt: string;
  className?: string;
  /** How far before entering the viewport we start loading */
  rootMargin?: string;
};

/**
 * Lazy-load images using IntersectionObserver + native lazy loading.
 * This prevents downloading many off-screen thumbnails in dense grids/modals.
 */
export function LazyImg({ src, alt, className, rootMargin = '320px' }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (!src) return;
    const el = ref.current;
    if (!el) return;

    // If IO isn't available, fall back to eager-ish behavior (still uses native lazy).
    if (typeof IntersectionObserver === 'undefined') {
      setShouldLoad(true);
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShouldLoad(true);
          obs.disconnect();
        }
      },
      { root: null, rootMargin, threshold: 0.01 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [src, rootMargin]);

  if (!src) {
    return <div ref={ref} className={className} aria-hidden />;
  }

  return (
    <div ref={ref} className="w-full h-full min-h-0 min-w-0">
      {shouldLoad ? (
        <img src={src} alt={alt} className={className} loading="lazy" decoding="async" />
      ) : (
        <div className={className} aria-hidden />
      )}
    </div>
  );
}
