'use client';

import { useMemo } from 'react';
import { useChainId } from 'wagmi';
import { usePaymentAmount } from '@/lib/dapps/PaymentAmountContext';
import { DApp, getDAppNetworkType } from '@/lib/dapps';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { getDAppPaymentConfig } from '@/lib/payments/config';
import { calculateCost, formatPrice, formatPercent } from '@/lib/payments/calculator';
import { getNativeCurrencySymbol } from '@/lib/wagmi';
import { KREX_TIERS } from '@/lib/rewards/types';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { KX_CALCULATION_ASIDE } from '@/lib/hub/shellTokens';

function currencyForDApp(dapp: DApp, chainId: number): string {
  const networkType = getDAppNetworkType(dapp);
  if (networkType === 'L1') return 'KAS';
  if (chainId === 38833 || chainId === 38836) return 'iKAS';
  return getNativeCurrencySymbol(chainId);
}

export function DAppCalculationBreakdownPanel({ dapp }: { dapp: DApp }) {
  const chainId = useChainId();
  const currency = currencyForDApp(dapp, chainId);
  const networkType = getDAppNetworkType(dapp);
  const { paymentAmount } = usePaymentAmount();
  const { balance: krexBalance, tier } = useKREXBalance();
  const { nftStatus } = useNFTStatus();
  const tierConfig = KREX_TIERS[tier];
  const hasKrexDiscount = krexBalance > 0 && tierConfig.costReduction > 0;

  const paymentConfig = useMemo(() => getDAppPaymentConfig(dapp, networkType), [dapp, networkType]);

  const actionCosts = useMemo(() => {
    if (!paymentConfig) return [];
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
  }, [paymentConfig, dapp, krexBalance, tier, nftStatus, paymentAmount]);

  if (actionCosts.length === 0) {
    return null;
  }

  const primary = actionCosts[0];
  const totalDiscount = actionCosts.reduce((sum, { costBreakdown }) => sum + costBreakdown.costReductionAmount, 0);
  const discountPercent = primary.costBreakdown.costReductionPercent;

  return (
    <aside className={KX_CALCULATION_ASIDE}>
      <DAppSectionHeader
        title="Calculation breakdown"
        hint="Estimated action cost with platform fee and KREX tier discounts applied."
        className="mb-1"
      />

      <div className="space-y-4">
        {actionCosts.map(({ actionName, costBreakdown }) => (
          <div key={actionName} className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
            {actionCosts.length > 1 ? (
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{actionName}</p>
            ) : null}
            <div className="flex justify-between gap-2">
              <span>Base fee</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
                {formatPrice(costBreakdown.baseCost)} {currency}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span>Platform fee ({formatPercent(costBreakdown.feePercent)}%)</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
                {formatPrice(costBreakdown.feeAmount)} {currency}
              </span>
            </div>
            {costBreakdown.costReductionAmount > 0 ? (
              <div className="flex justify-between gap-2 text-emerald-700 dark:text-emerald-400">
                <span>KREX / NFT discount</span>
                <span className="font-semibold tabular-nums">
                  -{formatPrice(costBreakdown.costReductionAmount)} {currency}
                </span>
              </div>
            ) : null}
            {actionCosts.length > 1 ? (
              <div className="flex justify-between gap-2 border-t border-zinc-200 pt-1.5 font-semibold dark:border-zinc-700">
                <span>Action total</span>
                <span className="text-[#02abb8] tabular-nums">
                  {formatPrice(costBreakdown.finalCostWithFee)} {currency}
                </span>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-700">
        <p className="text-xs uppercase tracking-widest text-zinc-500">Total to pay</p>
        <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tabular-nums">
          {formatPrice(primary.costBreakdown.finalCostWithFee)} {currency}
        </p>
      </div>

      <div className="rounded-xl border border-[#02abb8]/25 bg-[#02abb8]/10 p-3 text-sm text-zinc-700 dark:text-zinc-300">
        {networkType === 'L1'
          ? 'L1 dApps settle in KAS. KREX tier discounts apply from your connected Kaspa or EVM wallet balance.'
          : 'L2 dApps settle on Kasplex. Connect the matching network wallet when you are ready to transact.'}
      </div>

      {hasKrexDiscount && totalDiscount > 0 ? (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-300">
          KREX discount: -{formatPrice(totalDiscount)} {currency} ({discountPercent}% off eligible cost).
        </div>
      ) : null}
    </aside>
  );
}
