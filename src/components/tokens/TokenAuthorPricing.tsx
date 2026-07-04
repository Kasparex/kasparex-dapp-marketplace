'use client';

import { VBlogFeeCard } from '@/components/vblog/VBlogPricingCards';
import { useTokenPricing } from '@/hooks/useTokenPricing';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';

export function TokenPricingCards({ className = '' }: { className?: string }) {
  const { createFee, editFee, verifyFee, tier } = useTokenPricing();

  return (
    <div className={`grid grid-cols-1 gap-4 md:grid-cols-3 ${className}`.trim()}>
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
      <VBlogFeeCard
        title="Verify Project"
        feeKas={verifyFee}
        basePoints={HUB_EARN_POINTS.tokenListingVerify}
        tier={tier}
        note="Claim ownership and unlock verified status."
      />
    </div>
  );
}

export function TokenAuthorPricing() {
  return (
    <div className="mt-10">
      <TokenPricingCards />
    </div>
  );
}
