'use client';

import { useMemo } from 'react';
import { getErrorMessage } from '@/lib/utils';

/**
 * Safely convert wagmi errors to strings using useMemo
 * This prevents React from trying to serialize error objects/functions
 */
export function useSafeError(error: unknown): string | null {
  return useMemo(() => {
    if (!error) {
      return null;
    }
    // Convert to string immediately to prevent serialization issues
    try {
      return getErrorMessage(error, 'An error occurred');
    } catch {
      // If getErrorMessage itself fails, return a safe fallback
      return 'An error occurred';
    }
  }, [error]);
}

