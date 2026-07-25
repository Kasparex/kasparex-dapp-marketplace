'use client';

import Link from 'next/link';

interface MagazineDashboardButtonProps {
  variant?: 'header' | 'breadcrumb';
}

export function MagazineDashboardButton({ variant = 'header' }: MagazineDashboardButtonProps) {
  if (variant === 'breadcrumb') {
    return (
      <Link
        href="/magazines/dashboard"
        className="flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-600 transition-all hover:bg-[color:var(--hub-accent-muted)] hover:text-[color:var(--hub-accent)] dark:bg-zinc-800 dark:text-zinc-400"
      >
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
        My Dashboard
      </Link>
    );
  }

  return (
    <Link
      href="/magazines/dashboard"
      className="k-control-btn !border-[color:var(--hub-accent-border)] !bg-[color:var(--hub-accent-muted)] !text-[color:var(--hub-accent)]"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
        />
      </svg>
      User Dashboard
    </Link>
  );
}
