'use client';

import { CrowdKasPricingCards } from '@/components/donations/CrowdKasPricingCards';
import { useCrowdKasPricing } from '@/hooks/useCrowdKasPricing';

export function CrowdKasAuthorPricing({
  network,
  className = '',
}: {
  network: 'l1' | 'l2';
  className?: string;
}) {
  const pricing = useCrowdKasPricing();
  return (
    <CrowdKasPricingCards
      network={network}
      l1CreateFeeKas={pricing.l1CreateFeeKas}
      l2CreateFeeIkas={pricing.l2CreateFeeIkas}
      l1EditFeeKas={pricing.l1EditFeeKas}
      l2EditFeeIkas={pricing.l2EditFeeIkas}
      deleteFee={pricing.deleteFee}
      tier={pricing.tier}
      className={className}
    />
  );
}
