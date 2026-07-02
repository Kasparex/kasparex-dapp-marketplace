'use client';

import type { MouseEvent } from 'react';

function LockIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  );
}

function UnlockIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 11V7a4 4 0 018 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
      />
    </svg>
  );
}

/**
 * Premium indicator for vBlog articles that include the gated Premium Content module.
 * Shows a lock/unlock glyph. Clickable (opens the Modules tab of that article).
 */
export function VBlogPremiumBadge({
  unlocked = false,
  onClick,
  showLabel = false,
  className = '',
  title = 'Premium content. Open modules',
}: {
  unlocked?: boolean;
  onClick?: (e: MouseEvent) => void;
  showLabel?: boolean;
  className?: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={title}
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-amber-400/60 bg-amber-50/90 px-2 py-1.5 text-amber-700 backdrop-blur-md transition-all hover:scale-105 dark:border-amber-300/40 dark:bg-amber-500/15 dark:text-amber-300 ${className}`.trim()}
    >
      {unlocked ? <UnlockIcon /> : <LockIcon />}
      {showLabel ? (
        <span className="text-[10px] font-black uppercase tracking-wide">Premium</span>
      ) : null}
    </button>
  );
}
