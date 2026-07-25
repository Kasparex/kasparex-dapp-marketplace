'use client';

import type { Token } from '@/lib/tokens/types';
import { TokenCategoryBadge } from '@/components/tokens/TokenCategoryBadge';
import { TokenVoteControls } from '@/components/tokens/TokenVoteControls';
import { TokenListingTopStatus } from '@/components/tokens/TokenListingTopStatus';

type TokenListingFooterRowsProps = {
  token: Token;
  onCategoryFilter?: (category: string) => void;
  className?: string;
  showCategory?: boolean;
};

/** Category (left), network/verification badges (center), vote controls (right). */
export function TokenListingFooterRow({
  token,
  onCategoryFilter,
  showCategory = true,
  className = '',
}: TokenListingFooterRowsProps) {
  return (
    <div
      className={`grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800 ${className}`.trim()}
    >
      <div className="min-w-0 justify-self-start">
        {showCategory ? <TokenCategoryBadge token={token} onFilter={onCategoryFilter} /> : null}
      </div>
      <div className="justify-self-center px-1">
        <TokenListingTopStatus token={token} layout="inline" />
      </div>
      <div className="shrink-0 justify-self-end">
        <TokenVoteControls token={token} compact />
      </div>
    </div>
  );
}

export function TokenListingFooterRows(props: TokenListingFooterRowsProps) {
  return <TokenListingFooterRow {...props} />;
}
