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

/** Category (left), icon badges (center), vote controls (right). */
export function TokenListingFooterRow({
  token,
  onCategoryFilter,
  showCategory = true,
  className = '',
}: TokenListingFooterRowsProps) {
  return (
    <div className={`grid grid-cols-[1fr_auto_1fr] items-center gap-2 ${className}`.trim()}>
      <div className="justify-self-start min-w-0">
        {showCategory ? <TokenCategoryBadge token={token} onFilter={onCategoryFilter} /> : null}
      </div>
      <div className="justify-self-center px-1">
        <TokenListingBadges token={token} />
      </div>
      <div className="justify-self-end shrink-0">
        <TokenVoteControls token={token} compact />
      </div>
    </div>
  );
}

export function TokenListingFooterRows(props: TokenListingFooterRowsProps) {
  return <TokenListingFooterRow {...props} />;
}
