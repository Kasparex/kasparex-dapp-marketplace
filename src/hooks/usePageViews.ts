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
      
      // Always load current view count first (for immediate display)
      const currentViews = allViews[slug] || 0;
      setViews(currentViews);

      // Only increment if shouldIncrement is true (i.e., on detail page)
      if (shouldIncrement) {
        // Use a timestamp-based debounce to prevent multiple increments on rapid refreshes
        const lastIncrementKey = `last-increment-${slug}`;
        const lastIncrement = localStorage.getItem(lastIncrementKey);
        const now = Date.now();
        const DEBOUNCE_MS = 1000; // 1 second debounce
        
        // Only increment if enough time has passed since last increment
        if (!lastIncrement || (now - parseInt(lastIncrement, 10)) > DEBOUNCE_MS) {
          allViews[slug] = currentViews + 1;
          localStorage.setItem(VIEWS_STORAGE_KEY, JSON.stringify(allViews));
          localStorage.setItem(lastIncrementKey, now.toString());
          setViews(allViews[slug]);
        }
      }
    } catch (error) {
      console.error('Error handling page views:', error);
    }
  }, [slug, mounted, shouldIncrement]);

  return views;
}

/**
 * Reset all page view counts to 0
 */
export function resetPageViews() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(VIEWS_STORAGE_KEY);
  } catch (error) {
    console.error('Error resetting page views:', error);
  }
}
