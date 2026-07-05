'use client';

import { useEffect, useRef } from 'react';

type Edge = 'left' | 'right';

export interface MobileEdgeSwipeOptions {
  enabled: boolean;
  /** Swipe right anywhere (or from left edge) to open left drawer */
  onOpenLeft?: () => void;
  /** Swipe left while left drawer is open to close it */
  onCloseLeft?: () => void;
  leftOpen?: boolean;
  /** Swipe left from right edge to open right drawer */
  onOpenRight?: () => void;
  /** Swipe right while right drawer is open to close it */
  onCloseRight?: () => void;
  rightOpen?: boolean;
  /** Minimum horizontal travel in px */
  threshold?: number;
}

function isInteractiveOverlayOpen() {
  return Boolean(
    document.querySelector('[role="dialog"][aria-modal="true"]') ||
      document.querySelector('[data-rk] [role="dialog"]'),
  );
}

/**
 * Document-level touch swipe handler for mobile drawer panels.
 * Ignores swipes when modals are open or when vertical scroll dominates.
 */
export function useMobileEdgeSwipe({
  enabled,
  onOpenLeft,
  onCloseLeft,
  leftOpen = false,
  onOpenRight,
  onCloseRight,
  rightOpen = false,
  threshold = 56,
}: MobileEdgeSwipeOptions) {
  const stateRef = useRef({ startX: 0, startY: 0, tracking: false });

  useEffect(() => {
    if (!enabled) return;

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1 || isInteractiveOverlayOpen()) return;
      stateRef.current = {
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        tracking: true,
      };
    };

    const onEnd = (e: TouchEvent) => {
      const { tracking, startX, startY } = stateRef.current;
      stateRef.current.tracking = false;
      if (!tracking || e.changedTouches.length !== 1 || isInteractiveOverlayOpen()) return;

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const dx = endX - startX;
      const dy = endY - startY;

      if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy) * 1.25) return;

      const swipeRight = dx > 0;
      const swipeLeft = dx < 0;

      if (rightOpen && swipeRight) {
        onCloseRight?.();
        return;
      }
      if (leftOpen && swipeLeft) {
        onCloseLeft?.();
        return;
      }
      if (!leftOpen && !rightOpen) {
        if (swipeRight) onOpenLeft?.();
        else if (swipeLeft) onOpenRight?.();
      }
    };

    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchend', onEnd);
    };
  }, [
    enabled,
    leftOpen,
    onCloseLeft,
    onCloseRight,
    onOpenLeft,
    onOpenRight,
    rightOpen,
    threshold,
  ]);
}
