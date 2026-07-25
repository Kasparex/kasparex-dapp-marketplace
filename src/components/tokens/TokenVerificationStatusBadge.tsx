'use client';

import type { Token } from '@/lib/tokens/types';
import { tokenIsVerified } from '@/lib/tokens/listing';
import { Tooltip } from '@/components/ui/Tooltip';

export function TokenVerificationStatusBadge({ token, className = '' }: { token: Token; className?: string }) {
  const verified = tokenIsVerified(token);
  const tooltip = verified
    ? 'This token listing is verified on-chain'
    : 'This token listing is not yet verified on-chain';

  return (
    <Tooltip content={tooltip}>
      <span
        className={`inline-flex shrink-0 cursor-help items-center rounded-lg border px-2.5 py-1 text-[11px] font-medium ${
          verified
            ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-200'
            : 'border-amber-500/35 bg-amber-500/10 text-amber-800 dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-200'
        } ${className}`.trim()}
        aria-label={tooltip}
      >
        {verified ? 'Verified' : 'Not verified'}
      </span>
    </Tooltip>
  );
}
