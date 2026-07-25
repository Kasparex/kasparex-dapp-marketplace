'use client';

import { VBlogFeeCard } from '@/components/vblog/VBlogPricingCards';
import { useTokenPricing } from '@/hooks/useTokenPricing';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { HUB_DELETE_FEE_KAS } from '@/lib/hub/paidDelete';
import { applyKrexFeeDiscount } from '@/lib/hub/applyKrexFeeDiscount';

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
      <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
        Fee boxes below update with your KREX tier discount and Hub points multiplier. Deployer ownership verify is{' '}
        <span className="font-semibold text-[#02abb8]">free</span> (wallet signature after publish). Module fees appear in
        the calculation rail when you publish.
      </p>
      <TokenPricingCards />
    </div>
  );
}
