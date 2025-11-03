'use client';

import { useEffect } from 'react';
import { resetPageViews } from '@/hooks/usePageViews';

/**
 * One-time component to reset all page view counts
 * Remove this component after deployment or once counts are reset
 */
export function VisitCountReset() {
  useEffect(() => {
    // Reset visit counts on mount (one-time)
    resetPageViews();
  }, []);

  return null;
}

