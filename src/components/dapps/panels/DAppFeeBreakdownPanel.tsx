'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { usePaymentAmount } from '@/lib/dapps/PaymentAmountContext';
import { DApp, getDAppNetworkType } from '@/lib/dapps';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { getDAppPaymentConfig } from '@/lib/payments/config';
import { calculateCost, formatPrice } from '@/lib/payments/calculator';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { KX_ASIDE_PANEL } from '@/lib/hub/shellTokens';
import { KxCallout } from '@/components/kx/KxCallout';

export function DAppFeeBreakdownPanel({ dapp }: { dapp: DApp }) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { paymentAmount } = usePaymentAmount();
  const networkType = getDAppNetworkType(dapp);
  const { balance: krexBalance, tier } = useKREXBalance();
  const { nftStatus } = useNFTStatus();

  const paymentConfig = useMemo(() => getDAppPaymentConfig(dapp, networkType), [dapp, networkType]);

  const actionCosts = useMemo(() => {
    if (!paymentConfig || !isConnected) return [];
    return paymentConfig.actions.map((action) => {
      const isVariableAmount = !!action.variableAmount;
      const overrideBaseCost =
        isVariableAmount && paymentAmount != null && paymentAmount > 0 ? paymentAmount : undefined;
      const costBreakdown = calculateCost({
        dapp,
        actionId: action.actionId,
        krexBalance: krexBalance || 0,
        krexTier: tier,
        hasAnyNFT: !!(
          nftStatus?.hasKREXPRIME ||
          nftStatus?.hasPIXELKREX ||
          (nftStatus?.partnerCollections && Object.values(nftStatus.partnerCollections || {}).some((v) => v))
        ),
        hasDiamondNFT: !!(
          nftStatus?.hasDiamondKREXPRIME ||
          nftStatus?.hasDiamondPIXELKREX ||
          (nftStatus?.partnerDiamonds && Object.values(nftStatus.partnerDiamonds || {}).some((v) => v))
        ),
        hasRarestNFT: !!nftStatus?.hasRarestNFT,
        isNodeProvider: false,
        nodeFeeReduction: 0,
        overrideBaseCost,
      });
      return { actionName: action.actionName, costBreakdown };
    });
  }, [paymentConfig, dapp, krexBalance, tier, nftStatus, isConnected, paymentAmount]);

  if (!isConnected) {
    return (
      <div className={KX_ASIDE_PANEL}>
        <DAppSectionHeader title="Fee breakdown" className="mb-3" />
        <KxCallout variant="info" title="Connect wallet">
          Connect your wallet to see live fee estimates for this dApp.
        </KxCallout>
      </div>
    );
  }

  if (actionCosts.length === 0) {
    return null;
  }

  return (
    <div className={KX_ASIDE_PANEL}>
      <DAppSectionHeader title="Fee breakdown" className="mb-3" />
      <div className="space-y-4 text-sm">
        {actionCosts.map(({ actionName, costBreakdown }) => (
          <div key={actionName} className="space-y-1.5 border-b border-zinc-200 pb-3 last:border-0 dark:border-zinc-800">
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">{actionName}</p>
            <div className="flex justify-between gap-2 text-zinc-500">
              <span>Base</span>
              <span className="tabular-nums text-zinc-800 dark:text-zinc-200">
                {formatPrice(costBreakdown.baseCost, chainId)}
              </span>
            </div>
            {costBreakdown.costReductionAmount > 0 ? (
              <div className="flex justify-between gap-2 text-emerald-600 dark:text-emerald-400">
                <span>Discount</span>
                <span className="tabular-nums">-{formatPrice(costBreakdown.costReductionAmount, chainId)}</span>
              </div>
            ) : null}
            <div className="flex justify-between gap-2 font-semibold">
              <span>Total</span>
              <span className="tabular-nums text-[#02abb8]">{formatPrice(costBreakdown.finalCost, chainId)}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-col gap-2 text-sm">
        <Link href="/rewards-calculator" className="font-semibold text-[#02abb8] hover:underline">
          Rewards calculator ↗
        </Link>
        <Link href="/dapps/dashboard?tab=create" className="font-semibold text-zinc-600 hover:text-[#02abb8] dark:text-zinc-400">
          List your dApp ↗
        </Link>
      </div>
    </div>
  );
}
