'use client';

import { useKREXBalance } from '@/hooks/useKREXBalance';
import { VBlogPricingCards } from '@/components/vblog/VBlogPricingCards';

interface VBlogPricingStripProps {
  createFee: number;
  editFee: number;
  deleteFee: number;
}

export function VBlogPricingStrip({ createFee, editFee, deleteFee }: VBlogPricingStripProps) {
  const { tier } = useKREXBalance();

  return <VBlogPricingCards createFee={createFee} editFee={editFee} deleteFee={deleteFee} tier={tier} className="mt-10" />;
}
