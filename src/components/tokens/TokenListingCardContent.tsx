'use client';

import type { ReactNode } from 'react';
import type { Token } from '@/lib/tokens/types';
import { TokenLogo } from '@/components/tokens/TokenLogo';
import { TokenTitle } from '@/components/tokens/TokenTitle';
import { TokenListingFooterRows } from '@/components/tokens/TokenListingFooterRows';
import { TokenListingBadges } from '@/components/tokens/TokenListingBadges';
import { TokenVerificationStatusBadge } from '@/components/tokens/TokenVerificationStatusBadge';
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
        <TokenLogo token={token} size={56} showName={false} showSymbol={false} shape="rounded" className="flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <TokenTitle token={token} size="sm" layout="besideLogo" nameInTooltip />
          {creatorWallet ? (
            <AuthorInline
              address={creatorWallet}
              displayName={formatAddress(creatorWallet)}
              href={`/u/${encodeURIComponent(creatorWallet)}`}
              className="mt-1.5 min-w-0"
            />
          ) : null}
        </div>
        <TokenVerificationStatusBadge token={token} className="shrink-0" />
      </div>

      {ownershipLabel ? <div className="mb-2">{ownershipLabel}</div> : null}

      <p className="mb-3 line-clamp-3 flex-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        {token.shortDescription || token.description}
      </p>

      <TokenListingBadges token={token} className="mb-3" />

      <TokenListingFooterRows token={token} onCategoryFilter={onCategoryFilter} className="mt-auto pt-2" />

      {footer ? <div className="mt-3">{footer}</div> : null}
    </div>
  );
}
