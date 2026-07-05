'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { footerLinkSections } from '@/lib/footerLinks';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useIsMobileViewport } from '@/hooks/useIsMobileViewport';

export interface MobileFooterDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileFooterDrawer({ open, onOpenChange }: MobileFooterDrawerProps) {
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobileViewport();

  useBodyScrollLock(open && isMobile);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  const drawer =
    open && mounted && typeof document !== 'undefined'
      ? createPortal(
          <>
            <div
              className="fixed inset-0 z-[90] bg-black/50 lg:hidden"
              aria-hidden
              onClick={() => onOpenChange(false)}
            />
            <div
              className="fixed inset-x-0 bottom-0 z-[91] lg:hidden flex flex-col max-h-[min(85dvh,640px)] rounded-t-2xl border border-zinc-200 dark:border-zinc-800 border-b-0 bg-white dark:bg-zinc-950 shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-label="Site links"
              style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
            >
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Site links</p>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  aria-label="Close site links"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="overflow-y-auto overscroll-contain flex-1 min-h-0 px-4 py-3 space-y-5">
                {footerLinkSections.map((section) => (
                  <div key={section.id}>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">
                      {section.title}
                    </p>
                    <ul className="space-y-1">
                      {section.links.map((link) => (
                        <li key={`${section.id}-${link.href}-${link.label}`}>
                          {link.external ? (
                            <a
                              href={link.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
                              onClick={() => onOpenChange(false)}
                            >
                              {link.icon}
                              <span>{link.label}</span>
                            </a>
                          ) : (
                            <Link
                              href={link.href}
                              className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
                              onClick={() => onOpenChange(false)}
                            >
                              {link.icon}
                              <span>{link.label}</span>
                            </Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </>,
          document.body,
        )
      : null;

  return drawer;
}
