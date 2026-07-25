'use client';

import type { ReactNode } from 'react';
import type { Token } from '@/lib/tokens/types';
import { TokenLogo } from '@/components/tokens/TokenLogo';
import { TokenTitle } from '@/components/tokens/TokenTitle';
import { TokenListingTopStatus } from '@/components/tokens/TokenListingTopStatus';
import { TokenListingFooterRows } from '@/components/tokens/TokenListingFooterRows';
import { TokenListingBadges } from '@/components/tokens/TokenListingBadges';
import { AuthorInline } from '@/components/ui/AuthorInline';
import { resolveTokenCreatorWallet } from '@/lib/tokens/creatorWallet';
import { formatAddress } from '@/lib/vblog/utils';

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
  const creatorWallet = resolveTokenCreatorWallet(token);

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-3 flex items-start gap-3">
        <TokenLogo token={token} size={64} showName={false} showSymbol={false} shape="rounded" className="flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <TokenTitle token={token} size="sm" layout="besideLogo" />
        </div>
        {creatorWallet ? (
          <AuthorInline
            address={creatorWallet}
            displayName={formatAddress(creatorWallet)}
            href={`/u/${encodeURIComponent(creatorWallet)}`}
            className="max-w-[40%] shrink-0 justify-end text-right"
          />
        ) : null}
      </div>

      <TokenListingBadges token={token} className="mb-3" />

      {ownershipLabel ? <div className="mb-2">{ownershipLabel}</div> : null}

      {token.listingNetwork === 'kcc20' || token.onChainSnapshot?.source === 'kcc20' ? (
        <div className="mb-2 flex flex-wrap gap-2">
          <span className="rounded-lg bg-violet-200 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-violet-950 dark:bg-violet-500/35 dark:text-violet-100">
            KCC-20
          </span>
          {token.onChainSnapshot?.templateLabel ? (
            <span className="rounded-lg bg-zinc-200 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-zinc-700 dark:bg-zinc-700/60 dark:text-zinc-200">
              {token.onChainSnapshot.templateLabel}
            </span>
          ) : null}
        </div>
      ) : null}

      <p className="mb-3 line-clamp-3 flex-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        {token.shortDescription || token.description}
      </p>

      <TokenListingFooterRows token={token} onCategoryFilter={onCategoryFilter} className="mt-auto pt-2" />

      {footer ? <div className="mt-3">{footer}</div> : null}
    </div>
  );
}
