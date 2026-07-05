'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { hubProjects, type HubProject } from '@/lib/hubProjects';
import { HubProjectsMenuContent } from '@/components/hub/HubProjectsMenuContent';
import { HubProjectStatusBadge } from '@/components/hub/hubMenuIcons';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useIsMobileViewport } from '@/hooks/useIsMobileViewport';

export interface HubMegaMenuProps {
  currentSectionTitle: string;
  currentProject: HubProject | null;
  pathname: string;
}

export function HubMegaMenu({ currentSectionTitle, currentProject, pathname }: HubMegaMenuProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobileViewport();

  useBodyScrollLock(open && isMobile);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const id = window.setTimeout(() => document.addEventListener('click', onClick, true), 0);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener('click', onClick, true);
    };
  }, [open]);

  const panel = open ? (
    <>
      {isMobile ? (
        <div className="fixed inset-0 z-[100] bg-black/20" aria-hidden onClick={() => setOpen(false)} />
      ) : null}
      <div
        ref={panelRef}
        className={
          isMobile
            ? 'fixed left-3 right-3 top-[4.25rem] z-[101] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden'
            : 'absolute left-0 top-full mt-2 z-[101] w-[min(calc(100vw-2rem),920px)] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden'
        }
        role="menu"
      >
        <div className="px-3 py-2.5 border-b border-zinc-200 dark:border-zinc-800">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Hub projects</p>
        </div>
        <div className="max-h-[min(calc(100dvh-6rem),520px)] overflow-y-auto overscroll-contain p-2">
          <HubProjectsMenuContent
            pathname={pathname}
            currentProject={currentProject}
            onNavigate={() => setOpen(false)}
            columns={isMobile ? 1 : 4}
          />
        </div>
      </div>
    </>
  ) : null;

  return (
    <div className="relative min-w-0">
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="inline-flex items-center gap-1.5 min-w-0 max-w-[46vw] sm:max-w-none rounded-lg px-1.5 py-1 -ml-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="text-sm sm:text-base font-medium text-zinc-900 dark:text-zinc-100 truncate">
          {currentSectionTitle}
        </span>
        {currentProject?.status && currentProject.status !== 'available' ? (
          <HubProjectStatusBadge status={currentProject.status} />
        ) : null}
        <svg
          className={`w-4 h-4 shrink-0 text-zinc-600 dark:text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {mounted && open ? (isMobile ? createPortal(panel, document.body) : panel) : null}
    </div>
  );
}
