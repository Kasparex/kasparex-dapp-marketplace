'use client';

import { useEffect, type MouseEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

export interface KxModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Panel width class, default max-w-md */
  panelClassName?: string;
  /** Overlay z-index class */
  zIndexClass?: string;
  /** Close when clicking backdrop */
  closeOnBackdrop?: boolean;
  /** aria-labelledby target id on panel */
  labelledBy?: string;
}

/**
 * Mobile-safe modal shell: scrollable overlay, viewport-bound panel, body scroll lock.
 */
export function KxModalShell({
  isOpen,
  onClose,
  children,
  panelClassName = 'max-w-md',
  zIndexClass = 'z-[99999]',
  closeOnBackdrop = true,
  labelledBy,
}: KxModalShellProps) {
  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen || typeof window === 'undefined') return null;

  const onOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!closeOnBackdrop) return;
    if (e.target === e.currentTarget) onClose();
  };

  return createPortal(
    <div
      className={`kx-modal-overlay fixed inset-0 ${zIndexClass} flex items-center justify-center`}
      onClick={onOverlayClick}
      role="presentation"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden />
      <div
        className={`kx-modal-panel relative w-full ${panelClassName} rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
