'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface MobileHeaderDrawerProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

/** Mobile site menu drawer portaled to body so it does not fight sticky header / wallet modals. */
export function MobileHeaderDrawer({ open, onClose, children }: MobileHeaderDrawerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted || typeof document === 'undefined') return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 top-16 z-[70] bg-black/50 lg:hidden"
        aria-hidden
        onClick={onClose}
      />
      <aside
        className="fixed top-16 right-0 z-[71] flex h-[calc(100dvh-4rem)] w-[min(100vw,320px)] flex-col border-l border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950 lg:hidden"
        aria-label="Site menu"
      >
        {children}
      </aside>
    </>,
    document.body,
  );
}
