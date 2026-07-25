'use client';

import type { Token } from '@/lib/tokens/types';
import { Tooltip } from '@/components/ui/Tooltip';

/** Ticker as primary title. Full name available via tooltip when `nameInTooltip`. */
export function TokenTitle({
  token,
  size = 'md',
  className = '',
  layout = 'standalone',
  nameInTooltip = false,
}: {
  token: Token;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** When logo sits beside the title, show ticker only (name optional as subtitle). */
  layout?: 'standalone' | 'besideLogo';
  /** Hide the name line and show it as a hover tooltip on the ticker. */
  nameInTooltip?: boolean;
}) {
  const titleClass =
    size === 'lg'
      ? 'text-3xl font-black tracking-tight text-zinc-900 dark:text-white sm:text-4xl'
      : size === 'sm'
        ? layout === 'besideLogo'
          ? 'text-[17px] font-bold text-zinc-900 dark:text-zinc-100'
          : 'text-sm font-semibold text-zinc-900 dark:text-zinc-100'
        : 'text-base font-bold text-zinc-900 dark:text-zinc-100';

  const subtitleClass =
    size === 'lg'
      ? 'mt-2 kx-body max-w-2xl'
      : size === 'sm'
        ? 'truncate text-[11px] text-zinc-500 dark:text-zinc-400'
        : 'truncate text-sm text-zinc-500 dark:text-zinc-400';

  const ticker = nameInTooltip ? (
    <Tooltip content={token.name}>
      <p className={`${titleClass} truncate cursor-help`}>{token.symbol}</p>
    </Tooltip>
  ) : (
    <p className={`${titleClass} truncate`}>{token.symbol}</p>
  );

  if (layout === 'besideLogo') {
    return (
      <div className={`min-w-0 ${className}`.trim()}>
        {ticker}
        {!nameInTooltip ? <p className={subtitleClass}>{token.name}</p> : null}
      </div>
    );
  }

  return (
    <div className={`min-w-0 ${className}`.trim()}>
      {ticker}
      {!nameInTooltip ? <p className={subtitleClass}>{token.name}</p> : null}
    </div>
  );
}
