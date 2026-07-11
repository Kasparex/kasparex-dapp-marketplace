'use client';

import { useMemo } from 'react';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import {
  computeCrowdKasL1PriceQuote,
  computeCrowdKasL2PriceQuote,
  VDONATE_CREATE_BASE_FEE_KAS,
  VDONATE_DELETE_FEE,
  VDONATE_EDIT_BASE_FEE_KAS,
  VDONATE_L2_CREATE_FEE_IKAS,
  VDONATE_L2_EDIT_FEE_IKAS,
  VDONATE_VERIFY_FEE_KAS,
  type CrowdKasAction,
  type CrowdKasL1PriceQuote,
  type CrowdKasL2PriceQuote,
  type CrowdKasPricingDraft,
} from '@/lib/donations/pricing';
import { getDonationModuleNftFlags, type DonationPaidModuleId } from '@/lib/donations/modules';

export function useCrowdKasPricing() {
  const { balance: krexBalance, tier } = useKREXBalance();
  const { nftStatus } = useNFTStatus();
  const moduleNftFlags = useMemo(() => getDonationModuleNftFlags(nftStatus), [nftStatus]);

  const estimateL1Quote = useMemo(
    () =>
      (
        action: CrowdKasAction,
        opts?: {
          draft?: CrowdKasPricingDraft;
          enabledPaidModules?: DonationPaidModuleId[];
          payoutSplitRecipientCount?: number;
        },
      ): CrowdKasL1PriceQuote =>
        computeCrowdKasL1PriceQuote({
          action,
          draft: opts?.draft,
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
          draft?: CrowdKasPricingDraft;
          pendingPaidModules?: DonationPaidModuleId[];
          alreadyUnlocked?: Partial<Record<DonationPaidModuleId, boolean>>;
        },
      ): CrowdKasL2PriceQuote =>
        computeCrowdKasL2PriceQuote({
          action,
          draft: opts?.draft,
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
    l1CreateFeeKas: VDONATE_CREATE_BASE_FEE_KAS,
    l1EditFeeKas: VDONATE_EDIT_BASE_FEE_KAS,
    l2CreateFeeIkas: VDONATE_L2_CREATE_FEE_IKAS,
    l2EditFeeIkas: VDONATE_L2_EDIT_FEE_IKAS,
    deleteFee: VDONATE_DELETE_FEE,
    tier,
    krexBalance,
    estimateL1Quote,
    estimateL2Quote,
  };
}
