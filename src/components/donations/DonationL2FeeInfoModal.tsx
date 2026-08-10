'use client';

import { VDONATIONS_L2_FEE_PERCENT } from '@/lib/donations/config';
import { Tooltip } from '@/components/ui/Tooltip';

/** Fee note via hover on the label (no ? icon). */
export function DonationL2FeeInfoModal() {
  return (
    <Tooltip
      content={`${VDONATIONS_L2_FEE_PERCENT}% goes to the Kasparex Revenue Tree (community rewards + referral). The rest is escrowed for the creator when the goal is reached.`}
    >
      <span className="text-xs text-zinc-500 dark:text-zinc-400 cursor-help border-b border-dotted border-zinc-400/60">
        Fee info
      </span>
    </Tooltip>
  );
}
