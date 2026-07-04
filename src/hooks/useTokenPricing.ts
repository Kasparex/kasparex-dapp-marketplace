'use client';

import { useMemo } from 'react';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { krexTierDiscountPercent } from '@/lib/chronicles/vault/pricing';
import { estimateTokenListingQuote, TOKEN_LISTING_FEES } from '@/lib/tokens/pricing';
import type { TokenListingDraft } from '@/lib/tokens/publish';
import { createDefaultPageConfig } from '@/lib/tokens/pageConfig';

const EMPTY_DRAFT: TokenListingDraft = {
  symbol: '',
  name: '',
  description: '',
  listingNetwork: 'l2_kasplex',
  pageConfig: createDefaultPageConfig([]),
  enabledModuleIds: [],
  author: '',
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function applyTierDiscount(baseKas: number, discountPercent: number): number {
  const discount = Math.min(Math.max(discountPercent, 0), 90) / 100;
  return round2(baseKas * (1 - discount));
}

export function useTokenPricing() {
  const { tier } = useKREXBalance();
  const discountPct = krexTierDiscountPercent(tier);

  return useMemo(() => {
    const createQuote = estimateTokenListingQuote({
      draft: EMPTY_DRAFT,
      action: 'create',
      discountPercent: discountPct,
    });
    const editQuote = estimateTokenListingQuote({
      draft: EMPTY_DRAFT,
      action: 'edit',
      discountPercent: discountPct,
    });

    return {
      createFee: createQuote.totalKas,
      editFee: editQuote.totalKas,
      verifyFee: applyTierDiscount(TOKEN_LISTING_FEES.verifyProjectKas, discountPct),
      tier,
      discountPct,
    };
  }, [tier, discountPct]);
}
