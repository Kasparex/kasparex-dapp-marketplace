'use client';

import { useKREXBalance } from '@/hooks/useKREXBalance';
import { VBlogFeeCard } from '@/components/vblog/VBlogPricingCards';
import { TOKEN_LISTING_FEES } from '@/lib/tokens/pricing';

export function TokenPricingCards({ className = '' }: { className?: string }) {
  const { tier } = useKREXBalance();

  return (
    <div className={`grid grid-cols-1 gap-4 md:grid-cols-3 ${className}`.trim()}>
      <VBlogFeeCard
        title="List Token"
        feeKas={TOKEN_LISTING_FEES.createListingKas}
        tier={tier}
        note="Publish your token landing page on Kasparex Tokens."
      />
      <VBlogFeeCard
        title="Update Page"
        feeKas={TOKEN_LISTING_FEES.updateListingKas}
        tier={tier}
        note="Refresh on-chain metadata and landing content."
      />
      <VBlogFeeCard
        title="Verify Project"
        feeKas={TOKEN_LISTING_FEES.verifyProjectKas}
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
