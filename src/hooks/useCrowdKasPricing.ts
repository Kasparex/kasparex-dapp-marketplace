'use client';

import { useMemo } from 'react';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import {
  computeCrowdKasPriceQuote,
  CROWDKAS_CREATE_FEE_KAS,
  CROWDKAS_DELETE_FEE_KAS,
  CROWDKAS_EDIT_FEE_KAS,
  CROWDKAS_VERIFY_FEE_KAS,
  type CrowdKasAction,
  type CrowdKasPriceQuote,
} from '@/lib/donations/pricing';
import type { DonationPaidModuleId } from '@/lib/donations/modules';

export function useCrowdKasPricing() {
  const { balance: krexBalance, tier } = useKREXBalance();
  const { nftStatus } = useNFTStatus();

  const estimateQuote = useMemo(
    () =>
      (action: CrowdKasAction, enabledPaidModules: DonationPaidModuleId[] = []): CrowdKasPriceQuote =>
        computeCrowdKasPriceQuote({
          action,
          enabledPaidModules,
          krexBalance,
          krexTier: tier,
          nft: nftStatus,
        }),
    [krexBalance, nftStatus, tier],
  );

  return {
    verifyFee: CROWDKAS_VERIFY_FEE_KAS,
    createFee: CROWDKAS_CREATE_FEE_KAS,
    editFee: CROWDKAS_EDIT_FEE_KAS,
    deleteFee: CROWDKAS_DELETE_FEE_KAS,
    tier,
    krexBalance,
    estimateQuote,
  };
}
