'use client';

import { useEffect, useRef } from 'react';

export interface MobileEdgeSwipeOptions {
  enabled: boolean;
  onOpenLeft?: () => void;
  onCloseLeft?: () => void;
  leftOpen?: boolean;
  onOpenRight?: () => void;
  onCloseRight?: () => void;
  rightOpen?: boolean;
  threshold?: number;
}

function isBlockingOverlayOpen() {
  if (document.querySelector('[data-rk] [role="dialog"]')) return true;
  const dialogs = document.querySelectorAll('[role="dialog"][aria-modal="true"]');
  for (const el of dialogs) {
    if (!el.closest('[data-kx-left-sidebar]') && !el.closest('[data-kx-right-drawer]')) {
      return true;
    }
  }
  return false;
}

/**
 * Document-level touch swipe handler for mobile drawer panels.
 * Uses refs for open state so gestures stay responsive after drawers close.
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
  const leftOpenRef = useRef(leftOpen);
  const rightOpenRef = useRef(rightOpen);

  leftOpenRef.current = leftOpen;
  rightOpenRef.current = rightOpen;

  useEffect(() => {
    if (!enabled) return;

    const resetTracking = () => {
      stateRef.current.tracking = false;
    };

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1 || isBlockingOverlayOpen()) return;
      stateRef.current = {
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        tracking: true,
      };
    };

    const onEnd = (e: TouchEvent) => {
      const { tracking, startX, startY } = stateRef.current;
      resetTracking();
      if (!tracking || e.changedTouches.length !== 1) return;
      if (isBlockingOverlayOpen()) return;

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const dx = endX - startX;
      const dy = endY - startY;

      if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy) * 1.25) return;

      const swipeRight = dx > 0;
      const swipeLeft = dx < 0;
      const leftIsOpen = leftOpenRef.current;
      const rightIsOpen = rightOpenRef.current;

      if (rightIsOpen && swipeRight) {
        onCloseRight?.();
        return;
      }
      if (leftIsOpen && swipeLeft) {
        onCloseLeft?.();
        return;
      }
      if (!leftIsOpen && !rightIsOpen) {
        if (swipeRight) onOpenLeft?.();
        else if (swipeLeft) onOpenRight?.();
      }
    };

    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchend', onEnd, { passive: true });
    document.addEventListener('touchcancel', resetTracking, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchend', onEnd);
      document.removeEventListener('touchcancel', resetTracking);
    };
  }, [enabled, onCloseLeft, onCloseRight, onOpenLeft, onOpenRight, threshold]);
}
