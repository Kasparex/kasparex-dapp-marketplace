'use client';

import { VBlogFeeCard } from '@/components/vblog/VBlogPricingCards';
import { useTokenPricing } from '@/hooks/useTokenPricing';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { HUB_DELETE_FEE_KAS } from '@/lib/hub/paidDelete';
import { applyKrexFeeDiscount } from '@/lib/hub/applyKrexFeeDiscount';
import { Tooltip } from '@/components/ui/Tooltip';
import { gameTooltipRich } from '@/components/games/gameTooltipRich';

export function TokenPricingCards({ className = '' }: { className?: string }) {
  const { createFee, editFee, tier } = useTokenPricing();

  return (
    <div className={`grid grid-cols-1 gap-4 md:grid-cols-3 ${className}`.trim()}>
      <VBlogFeeCard
        title="Listing Fee"
        feeKas={createFee}
        basePoints={HUB_EARN_POINTS.tokenListingCreate}
        tier={tier}
        note="Publish your token landing page on Kasparex Tokens."
      />
      <VBlogFeeCard
        title="Edit / Update"
        feeKas={editFee}
        tier={tier}
        note="Refresh on-chain metadata and landing content."
      />
      <VBlogFeeCard
        title="Delete Fee"
        feeKas={applyKrexFeeDiscount(HUB_DELETE_FEE_KAS.tokens, tier ?? 'Tier0')}
        tier={tier}
      />
    </div>
  );
}

export function TokenAuthorPricing() {
  return (
    <div className="mt-10">
      <div className="mb-4 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Listing fees</h3>
        <Tooltip
          content={gameTooltipRich(
            'Fee details',
            'Fee boxes update with your KREX tier discount and Hub points multiplier. Deployer ownership verify is free (wallet signature after publish). Module fees appear in the calculation rail when you publish.',
          )}
        >
          <button
            type="button"
            className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-300 text-[10px] font-bold text-zinc-500 transition hover:border-[color:var(--hub-accent)] hover:text-[color:var(--hub-accent)] dark:border-zinc-600"
            aria-label="About listing fees"
          >
            i
          </button>
        </Tooltip>
      </div>
      <TokenPricingCards />
    </div>
  );
}
