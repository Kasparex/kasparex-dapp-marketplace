'use client';

import Link from 'next/link';

export interface StatsCardProps {
  title: string;
  value?: React.ReactNode;
  subtitle?: string;
  href?: string;
  loading?: boolean;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Shared card for Stats page: consistent border, radius, padding.
 * Use for Treasury summary, contract count, networks, dApps, nodes, etc.
 */
export function StatsCard({
  title,
  value,
  subtitle,
  href,
  loading = false,
  children,
  className = '',
}: StatsCardProps) {
  const content = (
    <div
      className={
        'rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800/50 p-5 ' +
        (href
          ? 'hover:border-cyan-500/30 dark:hover:border-cyan-500/30 transition-colors '
          : '') +
        className
      }
    >
      <div className="flex flex-col gap-1">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {title}
        </span>
        {loading ? (
          <span className="text-sm text-zinc-500 dark:text-zinc-500">Loading…</span>
        ) : children !== undefined ? (
          children
        ) : (
          <span className="text-xl font-semibold text-zinc-900 dark:text-white">
            {value ?? '—'}
          </span>
        )}
        {subtitle && (
          <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }
  return content;
}
