'use client';

import type { Token } from '@/lib/tokens/types';
import { TokenListingBadges } from '@/components/tokens/TokenListingBadges';
import { TokenCategoryBadge } from '@/components/tokens/TokenCategoryBadge';
import { TokenVoteControls } from '@/components/tokens/TokenVoteControls';

type TokenListingFooterRowsProps = {
  token: Token;
  onCategoryFilter?: (category: string) => void;
  className?: string;
  showCategory?: boolean;
};

/** Icon badges (left) and vote controls (right). */
export function TokenListingFooterRow({
  token,
  className = '',
}: Pick<TokenListingFooterRowsProps, 'token' | 'className'>) {
  return (
    <div className={`flex items-center justify-between gap-2 ${className}`.trim()}>
      <TokenListingBadges token={token} className="flex-1 min-w-0" />
      <TokenVoteControls token={token} compact />
    </div>
  );
}

export function TokenListingFooterRows({
  token,
  onCategoryFilter,
  className = '',
  showCategory = true,
}: TokenListingFooterRowsProps) {
  return (
    <div className={`space-y-2 ${className}`.trim()}>
      {showCategory ? (
        <div>
          <TokenCategoryBadge token={token} onFilter={onCategoryFilter} />
        </div>
      ) : null}
      <TokenListingFooterRow token={token} />
    </div>
  );
}
