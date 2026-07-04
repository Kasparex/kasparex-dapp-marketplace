'use client';

import type { Token } from '@/lib/tokens/types';
import { TokenListingBadges } from '@/components/tokens/TokenListingBadges';
import { TokenNetworkChips } from '@/components/tokens/TokenNetworkChips';
import { TokenCategoryBadge } from '@/components/tokens/TokenCategoryBadge';
import { TokenVoteControls } from '@/components/tokens/TokenVoteControls';

type TokenListingFooterRowsProps = {
  token: Token;
  networkSize?: 'sm' | 'md';
  onCategoryFilter?: (category: string) => void;
  className?: string;
};

/** Icon badges (left) and network chips (right), shared by cards and page headers. */
export function TokenListingBadgeRow({
  token,
  networkSize = 'sm',
  className = '',
}: Pick<TokenListingFooterRowsProps, 'token' | 'networkSize' | 'className'>) {
  return (
    <div className={`flex items-center justify-between gap-2 ${className}`.trim()}>
      <TokenListingBadges token={token} />
      <TokenNetworkChips token={token} size={networkSize} className="justify-end shrink-0" />
    </div>
  );
}

/** Category badge (left) and vote controls (right), shared by cards and page headers. */
export function TokenListingActionRow({
  token,
  onCategoryFilter,
  className = '',
}: Pick<TokenListingFooterRowsProps, 'token' | 'onCategoryFilter' | 'className'>) {
  return (
    <div className={`flex items-center justify-between gap-2 ${className}`.trim()}>
      <TokenCategoryBadge token={token} onFilter={onCategoryFilter} />
      <TokenVoteControls token={token} compact />
    </div>
  );
}

export function TokenListingFooterRows({
  token,
  networkSize = 'sm',
  onCategoryFilter,
  className = '',
}: TokenListingFooterRowsProps) {
  return (
    <div className={`space-y-2 ${className}`.trim()}>
      <TokenListingBadgeRow token={token} networkSize={networkSize} />
      <TokenListingActionRow token={token} onCategoryFilter={onCategoryFilter} />
    </div>
  );
}
