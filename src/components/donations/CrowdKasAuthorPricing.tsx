'use client';

import { CrowdKasPricingCards } from '@/components/donations/CrowdKasPricingCards';
import { useCrowdKasPricing } from '@/hooks/useCrowdKasPricing';

export function CrowdKasAuthorPricing({ className = '' }: { className?: string }) {
  const pricing = useCrowdKasPricing();
  return (
    <CrowdKasPricingCards
      verifyFee={pricing.verifyFee}
      createFee={pricing.createFee}
      editFee={pricing.editFee}
      deleteFee={pricing.deleteFee}
      tier={pricing.tier}
      className={className}
    />
  );
}
