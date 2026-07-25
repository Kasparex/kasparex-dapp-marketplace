'use client';

import Link from 'next/link';
import { STATS_PANEL } from '@/lib/stats/statsUi';

export interface StatsCardProps {
  title: string;
  value?: React.ReactNode;
  subtitle?: string;
  href?: string;
  loading?: boolean;
  children?: React.ReactNode;
  className?: string;
}

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
      className={`${STATS_PANEL} p-4 transition-colors ${
        href ? 'hover:border-[color:var(--hub-accent-border)]' : ''
      } ${className}`}
    >
      <div className="flex flex-col gap-1">
        <span className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
          {title}
        </span>
        {loading ? (
          <span className="text-sm text-zinc-500">Loading…</span>
        ) : children !== undefined ? (
          children
        ) : (
          <span className="text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">{value ?? '-'}</span>
        )}
        {subtitle ? <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p> : null}
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
