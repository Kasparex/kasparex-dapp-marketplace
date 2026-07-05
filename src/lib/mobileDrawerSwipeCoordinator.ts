'use client';

type DrawerRegistration = {
  isOpen: () => boolean;
  open: () => void;
  close: () => void;
  enabled: () => boolean;
};

let leftDrawer: DrawerRegistration | null = null;
let rightDrawer: DrawerRegistration | null = null;
let listenerAttached = false;

const H_THRESHOLD = 44;
const V_THRESHOLD = 56;

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

function attachListener() {
  if (listenerAttached || typeof document === 'undefined') return;
  listenerAttached = true;

  let startX = 0;
  let startY = 0;
  let tracking = false;

  const reset = () => {
    tracking = false;
  };

  const onStart = (e: TouchEvent) => {
    if (e.touches.length !== 1 || isBlockingOverlayOpen()) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    tracking = true;
  };

  const onEnd = (e: TouchEvent) => {
    if (!tracking || e.changedTouches.length !== 1) {
      reset();
      return;
    }
    tracking = false;
    if (isBlockingOverlayOpen()) return;

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const dx = endX - startX;
    const dy = endY - startY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    const leftOpen = leftDrawer?.isOpen() ?? false;
    const rightOpen = rightDrawer?.isOpen() ?? false;

    // Swipe down closes an open drawer (vertical dismiss).
    if (absDy > V_THRESHOLD && absDy > absDx * 1.15) {
      if (dy > 0) {
        if (rightOpen) rightDrawer?.close();
        else if (leftOpen) leftDrawer?.close();
      }
      return;
    }

    if (absDx < H_THRESHOLD || absDx < absDy * 1.15) return;

    const swipeRight = dx > 0;
    const swipeLeft = dx < 0;

    if (rightOpen && swipeRight) {
      rightDrawer?.close();
      return;
    }
    if (leftOpen && swipeLeft) {
      leftDrawer?.close();
      return;
    }

    if (!leftOpen && !rightOpen) {
      if (swipeRight && leftDrawer?.enabled()) {
        if (!rightOpen) leftDrawer.open();
      } else if (swipeLeft && rightDrawer?.enabled()) {
        if (!leftOpen) rightDrawer.open();
      }
    }
  };

  document.addEventListener('touchstart', onStart, { passive: true });
  document.addEventListener('touchend', onEnd, { passive: true });
  document.addEventListener('touchcancel', reset, { passive: true });
}

export function registerMobileLeftDrawer(reg: DrawerRegistration | null) {
  leftDrawer = reg;
  attachListener();
}

export function registerMobileRightDrawer(reg: DrawerRegistration | null) {
  rightDrawer = reg;
  attachListener();
}
