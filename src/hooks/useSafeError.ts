'use client';

import { useMemo } from 'react';
import { getErrorMessage } from '@/lib/utils';

/**
 * Safely convert wagmi errors to strings using useMemo
 * This prevents React from trying to serialize error objects/functions
 * 
 * CRITICAL: This must be called IMMEDIATELY when the error is received,
 * before React tries to serialize it for rendering.
 */
export function useSafeError(error: unknown): string | null {
  return useMemo(() => {
    if (!error) {
      return null;
    }
    
    // CRITICAL: Convert to string immediately using a try-catch wrapper
    // This ensures that even if getErrorMessage fails, we return a safe string
    try {
      // Double-wrap to ensure we never throw
      try {
        return getErrorMessage(error, 'An error occurred');
      } catch (innerErr) {
        // If getErrorMessage itself fails, try to stringify the error safely
        try {
          if (typeof error === 'string') {
            return error;
          }
          if (typeof error === 'function') {
            return 'An error occurred (function-type error)';
          }
          const str = String(error);
          if (str && str !== '[object Object]') {
            return str;
          }
        } catch {
          // Last resort fallback
        }
        return 'An error occurred';
      }
    } catch {
      // Ultimate fallback - this should never happen, but ensures we always return a string
      return 'An error occurred';
    }
  }, [error]);
}
