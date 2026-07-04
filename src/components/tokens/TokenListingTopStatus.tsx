'use client';

import type { Token } from '@/lib/tokens/types';
import { TokenVerificationStatusBadge } from '@/components/tokens/TokenVerificationStatusBadge';
import { TokenNetworkChips } from '@/components/tokens/TokenNetworkChips';

/** Verification badge with network and featured pills stacked below (card and page header top-right). */
export function TokenListingTopStatus({ token, className = '' }: { token: Token; className?: string }) {
  return (
    <div className={`flex shrink-0 flex-col items-end gap-1 ${className}`.trim()}>
      <TokenVerificationStatusBadge token={token} />
      <TokenNetworkChips token={token} includeFeatured layout="stack" />
    </div>
  );
}
