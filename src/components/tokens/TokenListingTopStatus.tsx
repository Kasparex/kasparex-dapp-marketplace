'use client';

import type { Token } from '@/lib/tokens/types';
import { TokenVerificationStatusBadge } from '@/components/tokens/TokenVerificationStatusBadge';
import { TokenNetworkChips } from '@/components/tokens/TokenNetworkChips';

/** Verification + network pills (stack for corners, inline for footer center). */
export function TokenListingTopStatus({
  token,
  className = '',
  layout = 'stack',
}: {
  token: Token;
  className?: string;
  layout?: 'stack' | 'inline';
}) {
  if (layout === 'inline') {
    return (
      <div className={`flex flex-wrap items-center justify-center gap-1.5 ${className}`.trim()}>
        <TokenVerificationStatusBadge token={token} />
        <TokenNetworkChips token={token} layout="inline" />
      </div>
    );
  }

  return (
    <div className={`flex shrink-0 flex-col items-end gap-1 ${className}`.trim()}>
      <TokenVerificationStatusBadge token={token} />
      <TokenNetworkChips token={token} layout="stack" />
    </div>
  );
}
