'use client';

import type { ReactNode } from 'react';
import type { Token } from '@/lib/tokens/types';
import { TokenLogo } from '@/components/tokens/TokenLogo';
import { TokenTitle } from '@/components/tokens/TokenTitle';
import { TokenListingTopStatus } from '@/components/tokens/TokenListingTopStatus';
import { TokenListingFooterRows } from '@/components/tokens/TokenListingFooterRows';
import { TokenListingBadges } from '@/components/tokens/TokenListingBadges';

type TokenListingCardContentProps = {
  token: Token;
  onCategoryFilter?: (category: string) => void;
  footer?: ReactNode;
  ownershipLabel?: ReactNode;
};

export function TokenListingCardContent({
  token,
  onCategoryFilter,
  footer,
  ownershipLabel,
}: TokenListingCardContentProps) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-3 flex items-start gap-3">
        <TokenLogo token={token} size={64} showName={false} showSymbol={false} shape="rounded" className="flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <TokenTitle token={token} size="sm" layout="besideLogo" />
          <TokenListingBadges token={token} className="mt-2" />
        </div>
        <TokenListingTopStatus token={token} />
      </div>

      {ownershipLabel ? <div className="mb-2">{ownershipLabel}</div> : null}

      {token.listingNetwork === 'kcc20' || token.onChainSnapshot?.source === 'kcc20' ? (
        <div className="mb-2 flex flex-wrap gap-2">
          <span className="rounded-lg border border-violet-500/35 bg-violet-500/10 px-2.5 py-1 text-[11px] font-medium text-violet-800 dark:border-violet-400/30 dark:bg-violet-500/15 dark:text-violet-200">
            KCC-20
          </span>
          {token.onChainSnapshot?.templateLabel ? (
            <span className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-300">
              {token.onChainSnapshot.templateLabel}
            </span>
          ) : null}
        </div>
      ) : null}

      <p className="mb-3 flex-1 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
        {token.shortDescription || token.description}
      </p>

      <TokenListingFooterRows token={token} onCategoryFilter={onCategoryFilter} className="mt-auto pt-2" />

      {footer ? <div className="mt-3">{footer}</div> : null}
    </div>
  );
}
