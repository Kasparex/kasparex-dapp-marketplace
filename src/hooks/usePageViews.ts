'use client';

import { useState, useEffect } from 'react';

const VIEWS_STORAGE_KEY = 'kasparex-dapp-views';

interface PageViews {
  [slug: string]: number;
}

/**
 * Hook to track or read page views for a dApp
 * @param slug - The dApp slug identifier
 * @param shouldIncrement - If true, increments the view count on mount. If false, only reads the count (default: true)
 */
export function usePageViews(slug: string, shouldIncrement: boolean = true) {
  const [views, setViews] = useState<number>(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!slug || !mounted || typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(VIEWS_STORAGE_KEY);
      const allViews: PageViews = stored ? JSON.parse(stored) : {};
      
      // Always load current view count
      setViews(allViews[slug] || 0);

      // Only increment if shouldIncrement is true (i.e., on detail page)
      if (shouldIncrement) {
        allViews[slug] = (allViews[slug] || 0) + 1;
        localStorage.setItem(VIEWS_STORAGE_KEY, JSON.stringify(allViews));
        setViews(allViews[slug]);
      }
    } catch (error) {
      console.error('Error handling page views:', error);
    }
  }, [slug, mounted, shouldIncrement]);

  return views;
}

