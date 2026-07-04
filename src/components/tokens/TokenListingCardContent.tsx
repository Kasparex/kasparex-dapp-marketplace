'use client';

import type { ReactNode } from 'react';
import type { Token } from '@/lib/tokens/types';
import { TokenLogo } from '@/components/tokens/TokenLogo';
import { TokenTitle } from '@/components/tokens/TokenTitle';
import { TokenListingMeta } from '@/components/tokens/TokenListingMeta';
import { TokenNetworkChips } from '@/components/tokens/TokenNetworkChips';
import { TokenListingBadges } from '@/components/tokens/TokenListingBadges';
import { TokenVoteControls } from '@/components/tokens/TokenVoteControls';
import { TokenCategoryBadge } from '@/components/tokens/TokenCategoryBadge';
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
    <div className="relative flex flex-1 flex-col pb-10">
      <div className="mb-3 flex items-start gap-4">
        <TokenLogo token={token} size={56} showName={false} showSymbol={false} shape="rounded" className="flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <TokenTitle token={token} size="sm" layout="besideLogo" />
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <TokenVerificationStatusBadge token={token} />
          <TokenVoteControls token={token} compact />
        </div>
      </div>

      {ownershipLabel ? <div className="mb-2">{ownershipLabel}</div> : null}

      <p className="mb-3 flex-1 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
        {token.shortDescription || token.description}
      </p>

      <div className="mb-2">
        <TokenListingMeta token={token} />
      </div>

      <div className="mb-2 flex items-center justify-between gap-2">
        {creatorWallet ? (
          <AuthorInline
            address={creatorWallet}
            displayName={formatAddress(creatorWallet)}
            href={`/u/${encodeURIComponent(creatorWallet)}`}
            className="min-w-0"
          />
        ) : (
          <span />
        )}
        <TokenNetworkChips token={token} className="justify-end shrink-0" />
      </div>

      <div className="mt-auto pt-2">
        <TokenListingBadges token={token} />
      </div>

      {footer ? <div className="mt-3">{footer}</div> : null}

      <div className="absolute bottom-3 right-3">
        <TokenCategoryBadge token={token} onFilter={onCategoryFilter} />
      </div>
    </div>
  );
}
