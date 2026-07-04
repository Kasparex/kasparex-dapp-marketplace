'use client';

import type { Token } from '@/lib/tokens/types';
import { tokenIsVerified } from '@/lib/tokens/listing';

export function TokenVerificationStatusBadge({ token, className = '' }: { token: Token; className?: string }) {
  const verified = tokenIsVerified(token);
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
        verified
          ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
          : 'border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300'
      } ${className}`.trim()}
    >
      {verified ? 'Verified' : 'Not verified'}
    </span>
  );
}
