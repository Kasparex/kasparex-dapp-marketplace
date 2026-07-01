'use client';

import { useVBlogPricing } from '@/hooks/useVBlogPricing';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { VBlogPricingCards } from '@/components/vblog/VBlogPricingCards';

export function AuthorPricing() {
  const { createFee, editFee, deleteFee } = useVBlogPricing();
  const { tier } = useKREXBalance();

  return (
    <div className="mt-10">
      <VBlogPricingCards createFee={createFee} editFee={editFee} deleteFee={deleteFee} tier={tier} />
    </div>
  );
}
