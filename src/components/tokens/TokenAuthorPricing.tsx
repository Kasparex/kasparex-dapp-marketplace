'use client';

import { VBlogFeeCard } from '@/components/vblog/VBlogPricingCards';
import { useTokenPricing } from '@/hooks/useTokenPricing';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';

export function TokenPricingCards({ className = '' }: { className?: string }) {
  const { createFee, editFee, tier } = useTokenPricing();

  return (
    <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 ${className}`.trim()}>
      <VBlogFeeCard
        title="List Token"
        feeKas={createFee}
        basePoints={HUB_EARN_POINTS.tokenListingCreate}
        tier={tier}
        note="Publish your token landing page on Kasparex Tokens."
      />
      <VBlogFeeCard
        title="Update Page"
        feeKas={editFee}
        basePoints={HUB_EARN_POINTS.tokenListingUpdate}
        tier={tier}
        note="Refresh on-chain metadata and landing content."
      />
    </div>
  );
}

export function TokenAuthorPricing() {
  return (
    <div className="mt-10">
      <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
        Deployer ownership verify is <span className="font-semibold text-[#02abb8]">free</span> (wallet
        signature after publish). Module and listing fees appear in the breakdown when you publish.
      </p>
      <TokenPricingCards />
    </div>
  );
}
