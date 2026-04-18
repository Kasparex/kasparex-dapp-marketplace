'use client';

import Link from 'next/link';

export interface SidebarHeaderProps {
  backHref: string;
  backLabel: string;
  onHide: () => void;
  className?: string;
}

export function SidebarHeader({ backHref, backLabel, onHide, className = '' }: SidebarHeaderProps) {
  return (
    <div
      className={`p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-950 ${className}`}
    >
      <Link
        href={backHref}
        className="text-zinc-600 dark:text-zinc-300 hover:text-[#02abb8] text-sm font-medium tracking-normal flex items-center gap-2 transition-colors group"
      >
        <svg
          className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
        </svg>
        {backLabel}
      </Link>
      <button
        type="button"
        onClick={onHide}
        className="k-control-icon-btn h-9 w-9"
        aria-label="Hide sidebar"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
    </div>
  );
}
