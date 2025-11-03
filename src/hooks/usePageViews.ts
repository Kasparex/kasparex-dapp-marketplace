'use client';

import { useState, useEffect } from 'react';

const VIEWS_STORAGE_KEY = 'kasparex-dapp-views';

interface PageViews {
  [slug: string]: number;
}

export function usePageViews(slug: string) {
  const [views, setViews] = useState<number>(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!slug || !mounted || typeof window === 'undefined') return;

    // Load views from localStorage
    try {
      const stored = localStorage.getItem(VIEWS_STORAGE_KEY);
      const allViews: PageViews = stored ? JSON.parse(stored) : {};
      setViews(allViews[slug] || 0);

      // Increment view count
      allViews[slug] = (allViews[slug] || 0) + 1;
      localStorage.setItem(VIEWS_STORAGE_KEY, JSON.stringify(allViews));
      setViews(allViews[slug]);
    } catch (error) {
      console.error('Error handling page views:', error);
    }
  }, [slug, mounted]);

  return views;
}

