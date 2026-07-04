'use client';

import type { Token } from '@/lib/tokens/types';
import { tokenIsVerified } from '@/lib/tokens/listing';
import { Tooltip } from '@/components/ui/Tooltip';

function VerifiedStatusIcon() {
  return (
    <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
      />
    </svg>
  );
}

export function TokenVerificationStatusBadge({ token, className = '' }: { token: Token; className?: string }) {
  const verified = tokenIsVerified(token);
  const tooltip = verified
    ? 'This token listing is verified on-chain'
    : 'This token listing is not yet verified on-chain';

  return (
    <Tooltip content={tooltip}>
      <span
        className={`inline-flex shrink-0 cursor-help items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
          verified
            ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-200'
            : 'bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200'
        } ${className}`.trim()}
        aria-label={tooltip}
      >
        <VerifiedStatusIcon />
        <span>{verified ? 'Verified' : 'Not verified'}</span>
      </span>
    </Tooltip>
  );
}
