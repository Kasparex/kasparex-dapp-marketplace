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
        'rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm ' +
        (href
          ? 'hover:border-[#02abb8]/30 dark:hover:border-[#02abb8]/30 transition-all hover:scale-[1.02] '
          : '') +
        className
      }
    >
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">
          {title}
        </span>
        {loading ? (
          <span className="text-sm text-zinc-500 dark:text-zinc-500">Loading…</span>
        ) : children !== undefined ? (
          children
        ) : (
          <span className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">
            {value ?? '-'}
          </span>
        )}
        {subtitle && (
          <p className="text-[10px] font-bold text-zinc-500 uppercase mt-1">{subtitle}</p>
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
