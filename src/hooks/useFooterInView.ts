'use client';

import { useEffect, useState } from 'react';
import { useIsMobileViewport } from '@/hooks/useIsMobileViewport';

export const SITE_FOOTER_ID = 'site-footer';

/** True when the site footer is visible on mobile (for floating site-links button). */
export function useFooterInView() {
  const isMobile = useIsMobileViewport();
  const [footerInView, setFooterInView] = useState(false);

  useEffect(() => {
    if (!isMobile) {
      setFooterInView(false);
      return;
    }

    const footer = document.getElementById(SITE_FOOTER_ID);
    if (!footer) return;

    const observer = new IntersectionObserver(
      ([entry]) => setFooterInView(entry.isIntersecting),
      { threshold: 0.08, rootMargin: '0px 0px -32px 0px' },
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, [isMobile]);

  return { isMobile, footerInView };
}
