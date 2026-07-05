'use client';

import { useEffect } from 'react';

let lockCount = 0;
let previousOverflow = '';

/** Prevent background scroll while overlays (modals, drawers) are open. Uses ref counting. */
export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked || typeof document === 'undefined') return;

    lockCount += 1;
    if (lockCount === 1) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }

    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) {
        document.body.style.overflow = previousOverflow;
      }
    };
  }, [locked]);
}
