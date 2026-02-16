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
      className={`p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-transparent ${className}`}
    >
      <Link
        href={backHref}
        className="text-zinc-500 dark:text-zinc-400 hover:text-[#02abb8] font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 transition-colors group"
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
        className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-colors"
        aria-label="Hide sidebar"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
    </div>
  );
}
