'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useIsMobileViewport } from '@/hooks/useIsMobileViewport';
import type { ReactNode } from 'react';

export interface HubMobileRightPanelProps {
  panelId: string;
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

/** Fixed right-edge trigger for mobile right panel drawer. */
export function HubMobileRightPanelTrigger({
  panelId,
  onClick,
  label = 'Panel',
}: {
  panelId: string;
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-controls={panelId}
      aria-label={`Open ${label}`}
      className="fixed right-1 z-40 flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white/95 p-1.5 text-zinc-600 shadow-lg backdrop-blur-sm transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950/95 dark:text-zinc-300 dark:hover:bg-zinc-800 lg:hidden"
      style={{ top: '4rem' }}
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" />
      </svg>
    </button>
  );
}

/** Slide-in right drawer for Hub page side panels on mobile. */
export function HubMobileRightPanel({ panelId, open, onClose, title = 'Side panel', children }: HubMobileRightPanelProps) {
  const isMobile = useIsMobileViewport();
  useBodyScrollLock(open && isMobile);

  if (!open || !isMobile || typeof document === 'undefined') return null;

  return createPortal(
    <>
      <div className="fixed inset-0 top-16 z-[44] bg-black/50 lg:hidden" aria-hidden onClick={onClose} />
      <aside
        id={panelId}
        className="fixed top-16 right-0 z-[45] flex h-[calc(100dvh-4rem)] w-[min(100vw,320px)] flex-col border-l border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950 lg:hidden"
        aria-label={title}
      >
        <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800 shrink-0">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Close panel"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-6">{children}</div>
      </aside>
    </>,
    document.body,
  );
}

/** Hook: mobile drawer open state separate from desktop rightOpen preference. */
export function useHubMobileRightPanel() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useIsMobileViewport();

  useEffect(() => {
    if (!isMobile) setDrawerOpen(false);
  }, [isMobile]);

  return {
    isMobile,
    drawerOpen,
    openDrawer: () => setDrawerOpen(true),
    closeDrawer: () => setDrawerOpen(false),
  };
}
