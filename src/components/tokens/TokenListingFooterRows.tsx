'use client';

import type { Token } from '@/lib/tokens/types';
import { TokenCategoryBadge } from '@/components/tokens/TokenCategoryBadge';
import { TokenVoteControls } from '@/components/tokens/TokenVoteControls';

type TokenListingFooterRowsProps = {
  token: Token;
  onCategoryFilter?: (category: string) => void;
  className?: string;
  showCategory?: boolean;
};

/** Category (left), vote controls (right). Network chips live on featured media. */
export function TokenListingFooterRow({
  token,
  onCategoryFilter,
  showCategory = true,
  className = '',
}: TokenListingFooterRowsProps) {
  return (
    <div
      className={`flex items-center justify-between gap-3 border-t border-zinc-100 pt-3 dark:border-zinc-800 ${className}`.trim()}
    >
      <div className="min-w-0">
        {showCategory ? <TokenCategoryBadge token={token} onFilter={onCategoryFilter} /> : null}
      </div>
      <div className="shrink-0">
        <TokenVoteControls token={token} compact />
      </div>
    </div>
  );
}

export function TokenListingFooterRows(props: TokenListingFooterRowsProps) {
  return <TokenListingFooterRow {...props} />;
}
