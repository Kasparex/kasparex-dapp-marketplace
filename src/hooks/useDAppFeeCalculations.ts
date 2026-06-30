'use client';

import { useMemo } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { DApp, getDAppNetworkType } from '@/lib/dapps';
import { useDAppFromContract } from '@/lib/dapps/contractData';
import { getContractAddress } from '@/lib/contracts/addresses';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import {
  KREX_TIERS,
  NFT_FEE_REDUCTION,
  DIAMOND_NFT_FEE_REDUCTION,
  RAREST_NFT_FEE_REDUCTION,
  NFT_COST_REDUCTION,
  DIAMOND_NFT_COST_REDUCTION,
  RAREST_NFT_COST_REDUCTION,
} from '@/lib/rewards/types';
import { getDefaultRewardsBreakdown } from '@/lib/rewards/mockData';
import { getDAppPaymentConfig, getActionCost } from '@/lib/payments/config';

export function useDAppFeeCalculations(dapp: DApp, contractAddress?: string) {
  const chainId = useChainId();
  const { isConnected } = useAccount();
  const isL1DApp = getDAppNetworkType(dapp) === 'L1';
  const networkType = getDAppNetworkType(dapp);

  const { data: contractData } = useDAppFromContract(
    !isL1DApp && contractAddress && contractAddress.startsWith('0x') ? contractAddress : undefined,
    chainId,
  );

  const { balance: krexBalance, tier } = useKREXBalance();
  const { nftStatus } = useNFTStatus();
  const tierConfig = KREX_TIERS[tier];

  const feeCalc = useMemo(() => {
    const baseFee = 1.0;
    let feePercent = baseFee;
    if (krexBalance >= KREX_TIERS.Tier1.minKREX) {
      feePercent = Math.max(0, feePercent * (1 - tierConfig.feeDiscountPercent / 100));
    }

    const hasAnyNFT = !!(
      nftStatus?.hasKREXPRIME ||
      nftStatus?.hasPIXELKREX ||
      (nftStatus?.partnerCollections && Object.values(nftStatus.partnerCollections || {}).some((v) => v))
    );
    const hasDiamondNFT = !!(
      nftStatus?.hasDiamondKREXPRIME ||
      nftStatus?.hasDiamondPIXELKREX ||
      (nftStatus?.partnerDiamonds && Object.values(nftStatus.partnerDiamonds || {}).some((v) => v))
    );
    const hasRarestNFT = !!nftStatus?.hasRarestNFT;

    if (hasRarestNFT) {
      feePercent = 0;
    } else if (hasDiamondNFT) {
      feePercent = Math.max(0, feePercent - DIAMOND_NFT_FEE_REDUCTION);
    } else if (hasAnyNFT) {
      feePercent = Math.max(0, feePercent - NFT_FEE_REDUCTION);
    }

    let costReductionPercent = krexBalance > 0 ? tierConfig.costReduction : 0;
    if (hasRarestNFT) {
      costReductionPercent += RAREST_NFT_COST_REDUCTION;
    } else if (hasDiamondNFT) {
      costReductionPercent += DIAMOND_NFT_COST_REDUCTION;
    } else if (hasAnyNFT) {
      costReductionPercent += NFT_COST_REDUCTION;
    }
    costReductionPercent = Math.min(costReductionPercent, 50);

    return { baseFee, feePercent, costReductionPercent };
  }, [krexBalance, tierConfig, nftStatus]);

  const rewards = getDefaultRewardsBreakdown(chainId);
  const paymentConfig = getDAppPaymentConfig(dapp, networkType);
  const actions = (paymentConfig?.actions ?? []).map((a) => ({
    action: a.actionName,
    costKAS: getActionCost(dapp, a.actionId, networkType),
  }));

  const gridTokenAddress = !isL1DApp ? getContractAddress(chainId, 'GRIDToken') || undefined : undefined;
  const feeHandlerAddress = !isL1DApp ? getContractAddress(chainId, 'FeeHandler') || undefined : undefined;
  const rewardManagerAddress = !isL1DApp ? getContractAddress(chainId, 'RewardManager') || undefined : undefined;
  const resolvedContractAddress = !isL1DApp ? contractAddress || dapp.contractAddress || '' : '';

  return {
    chainId,
    isConnected,
    isL1DApp,
    contractData,
    actions,
    rewards,
    ...feeCalc,
    gridTokenAddress,
    feeHandlerAddress,
    rewardManagerAddress,
    resolvedContractAddress,
    krexBalance,
    tier,
  };
}
