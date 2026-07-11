'use client';

import { useMemo } from 'react';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { resolveKpxCovenantDeployPrice } from '@/lib/covenant/kpxCovenantPricing';
import {
  computeCrowdKasL1PriceQuote,
  computeCrowdKasL2PriceQuote,
  VDONATE_DELETE_FEE,
  VDONATE_L1_EDIT_FEE_KAS,
  VDONATE_L2_CREATE_FEE_IKAS,
  VDONATE_L2_EDIT_FEE_IKAS,
  VDONATE_VERIFY_FEE_KAS,
  type CrowdKasAction,
  type CrowdKasL1PriceQuote,
  type CrowdKasL2PriceQuote,
} from '@/lib/donations/pricing';
import { getDonationModuleNftFlags, type DonationPaidModuleId } from '@/lib/donations/modules';

export function useCrowdKasPricing() {
  const { balance: krexBalance, tier } = useKREXBalance();
  const { nftStatus } = useNFTStatus();
  const moduleNftFlags = useMemo(() => getDonationModuleNftFlags(nftStatus), [nftStatus]);

  const l1CreateBaseFeeKas = useMemo(() => resolveKpxCovenantDeployPrice('crowdfund', tier).feeKas, [tier]);

  const estimateL1Quote = useMemo(
    () =>
      (
        action: CrowdKasAction,
        opts?: {
          enabledPaidModules?: DonationPaidModuleId[];
          payoutSplitRecipientCount?: number;
        },
      ): CrowdKasL1PriceQuote =>
        computeCrowdKasL1PriceQuote({
          action,
          enabledPaidModules: opts?.enabledPaidModules ?? [],
          payoutSplitRecipientCount: opts?.payoutSplitRecipientCount ?? 0,
          krexBalance,
          krexTier: tier,
          nft: moduleNftFlags,
        }),
    [krexBalance, moduleNftFlags, tier],
  );

  const estimateL2Quote = useMemo(
    () =>
      (
        action: CrowdKasAction,
        opts?: {
          pendingPaidModules?: import('@/lib/donations/modules').DonationPaidModuleId[];
          alreadyUnlocked?: Partial<Record<import('@/lib/donations/modules').DonationPaidModuleId, boolean>>;
        },
      ): CrowdKasL2PriceQuote =>
        computeCrowdKasL2PriceQuote({
          action,
          pendingPaidModules: opts?.pendingPaidModules ?? [],
          alreadyUnlocked: opts?.alreadyUnlocked ?? {},
          krexBalance,
          krexTier: tier,
          nft: moduleNftFlags,
        }),
    [krexBalance, moduleNftFlags, tier],
  );

  return {
    verifyFee: VDONATE_VERIFY_FEE_KAS,
    l1CreateFeeKas: l1CreateBaseFeeKas,
    l1EditFeeKas: VDONATE_L1_EDIT_FEE_KAS,
    l2CreateFeeIkas: VDONATE_L2_CREATE_FEE_IKAS,
    l2EditFeeIkas: VDONATE_L2_EDIT_FEE_IKAS,
    deleteFee: VDONATE_DELETE_FEE,
    tier,
    krexBalance,
    estimateL1Quote,
    estimateL2Quote,
  };
}
