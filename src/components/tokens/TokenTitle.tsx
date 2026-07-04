'use client';

import type { Token } from '@/lib/tokens/types';

/** Ticker as primary title, full name as secondary text. */
export function TokenTitle({
  token,
  size = 'md',
  className = '',
  layout = 'standalone',
}: {
  token: Token;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** When logo sits beside the title, show name only (no duplicate ticker). */
  layout?: 'standalone' | 'besideLogo';
}) {
  const titleClass =
    size === 'lg'
      ? layout === 'besideLogo'
        ? 'text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-white'
        : 'text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-white'
      : size === 'sm'
        ? layout === 'besideLogo'
          ? 'text-[17px] font-bold text-zinc-900 dark:text-zinc-100'
          : 'text-sm font-semibold text-zinc-900 dark:text-zinc-100'
        : 'text-base font-bold text-zinc-900 dark:text-zinc-100';

  const subtitleClass =
    size === 'lg'
      ? 'mt-2 kx-body max-w-2xl'
      : size === 'sm'
        ? 'text-[11px] text-zinc-500 dark:text-zinc-400 truncate'
        : 'text-sm text-zinc-500 dark:text-zinc-400 truncate';

  if (layout === 'besideLogo') {
    return (
      <div className={`min-w-0 ${className}`.trim()}>
        <p className={`${titleClass} truncate`}>{token.symbol}</p>
        <p className={subtitleClass}>{token.name}</p>
      </div>
    );
  }

  return (
    <div className={`min-w-0 ${className}`.trim()}>
      <p className={`${titleClass} truncate`}>{token.symbol}</p>
      <p className={subtitleClass}>{token.name}</p>
    </div>
  );
}
