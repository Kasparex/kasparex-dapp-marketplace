'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRequestHost } from '@/components/CanonicalNavContext';
import { canonicalAppHref, canonicalDappsMarketplaceHref } from '@/lib/config/sectionHosts';

export interface SidebarHeaderProps {
  backLabel: string;
  onHide: () => void;
  className?: string;
  /** When true, link to dapps.* marketplace root (path /). Ignores backHref. */
  backToMarketplace?: boolean;
  /** Relative path or https URL; not used when backToMarketplace is true */
  backHref?: string;
}

export function SidebarHeader({
  backHref,
  backLabel,
  backToMarketplace,
  onHide,
  className = '',
}: SidebarHeaderProps) {
  const host = useRequestHost();

  const resolvedHref = useMemo(() => {
    if (backToMarketplace) {
      return canonicalDappsMarketplaceHref(host ?? undefined);
    }
    const target = backHref ?? '/hub';
    if (target.startsWith('http')) return target;
    return canonicalAppHref(target, host ?? undefined);
  }, [backToMarketplace, backHref, host]);

  return (
    <div
      className={`p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-950 ${className}`}
    >
      <Link
        href={resolvedHref}
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
