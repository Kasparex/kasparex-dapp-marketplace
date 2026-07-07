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
import type { ReactNode } from 'react';

function currencyForDApp(dapp: DApp, chainId: number): string {
  const networkType = getDAppNetworkType(dapp);
  if (networkType === 'L1') return 'KAS';
  if (chainId === 38833 || chainId === 38836) return 'iKAS';
  return getNativeCurrencySymbol(chainId);
}

export function DAppCalculationBreakdownPanel({
  dapp,
  footer,
  showWhenEmpty = false,
}: {
  dapp: DApp;
  footer?: ReactNode;
  showWhenEmpty?: boolean;
}) {
  const chainId = useChainId();
  const currency = currencyForDApp(dapp, chainId);
  const networkType = getDAppNetworkType(dapp);
  const { paymentAmount, actionId: quoteActionId } = usePaymentAmount();
  const { balance: krexBalance, tier } = useKREXBalance();
  const { nftStatus } = useNFTStatus();
  const tierConfig = KREX_TIERS[tier];
  const tierLabel = tierConfig.label;

  const paymentConfig = useMemo(() => getDAppPaymentConfig(dapp, networkType), [dapp, networkType]);

  const hasVariableActions = useMemo(
    () => paymentConfig?.actions.some((action) => action.variableAmount) ?? false,
    [paymentConfig],
  );

  const waitingForAmount =
    hasVariableActions && (paymentAmount == null || paymentAmount <= 0);

  const actionCosts = useMemo(() => {
    if (!paymentConfig) return [];
    return paymentConfig.actions
      .map((action) => {
        const isVariableAmount = !!action.variableAmount;
        if (isVariableAmount && (paymentAmount == null || paymentAmount <= 0)) {
          return null;
        }

        const overrideBaseCost = isVariableAmount ? paymentAmount ?? undefined : undefined;
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
        return {
          actionId: action.actionId,
          actionName: action.actionName,
          variableAmount: isVariableAmount,
          costBreakdown,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row != null);
  }, [paymentConfig, dapp, krexBalance, tier, nftStatus, paymentAmount]);

  const quotedAction =
    quoteActionId != null
      ? actionCosts.find((row) => row.actionId === quoteActionId) ?? actionCosts[0]
      : actionCosts[0];

  if (!waitingForAmount && actionCosts.length === 0 && !showWhenEmpty && !footer) {
    return null;
  }

  const primary = quotedAction ?? actionCosts[0];
  const totalFeeDiscount = actionCosts.reduce((sum, { costBreakdown }) => sum + costBreakdown.feeDiscountAmount, 0);

  return (
    <aside className={KX_CALCULATION_ASIDE}>
      <DAppSectionHeader title="Calculation breakdown" className="mb-1" />

      {waitingForAmount ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Enter an amount in the widget above to see fees, KREX tier discounts, and your total.
        </p>
      ) : primary ? (
        <>
          <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
            {actionCosts.map(({ actionId, actionName, variableAmount, costBreakdown }) => (
              <div key={actionId} className="space-y-1.5">
                {actionCosts.length > 1 ? (
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{actionName}</p>
                ) : null}
                <div className="flex justify-between gap-2">
                  <span>{variableAmount ? 'Payment amount' : 'Base fee'}</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
                    {formatPrice(costBreakdown.baseCost)} {currency}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>
                    Platform fee ({formatPercent(costBreakdown.feePercent)}%
                    {costBreakdown.feePercent < costBreakdown.standardFeePercent
                      ? `, was ${formatPercent(costBreakdown.standardFeePercent)}%`
                      : ''}
                    )
                  </span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
                    {formatPrice(costBreakdown.feeAmount)} {currency}
                  </span>
                </div>
                {costBreakdown.feeDiscountAmount > 0 ? (
                  <div className="flex justify-between gap-2 text-emerald-700 dark:text-emerald-400">
                    <span>KREX / NFT fee discount ({tierLabel})</span>
                    <span className="font-semibold tabular-nums">
                      -{formatPrice(costBreakdown.feeDiscountAmount)} {currency}
                    </span>
                  </div>
                ) : null}
                {costBreakdown.costReductionAmount > 0 ? (
                  <div className="flex justify-between gap-2 text-emerald-700 dark:text-emerald-400">
                    <span>KREX cost discount</span>
                    <span className="font-semibold tabular-nums">
                      -{formatPrice(costBreakdown.costReductionAmount)} {currency}
                    </span>
                  </div>
                ) : null}
                <div className="flex justify-between gap-2 border-t border-zinc-200 pt-1.5 dark:border-zinc-700">
                  <span>Recipient receives</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
                    {formatPrice(costBreakdown.breakdown.subtotal)} {currency}
                  </span>
                </div>
                {actionCosts.length > 1 ? (
                  <div className="flex justify-between gap-2 font-semibold">
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
              ? 'L1 dApps settle in KAS. KREX tier discounts reduce platform fees from your connected wallet balance.'
              : 'L2 dApps settle on Kasplex. Totals update live from the amount you enter in the widget.'}
          </div>

          {totalFeeDiscount > 0 ? (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-300">
              {tierLabel} saves {formatPrice(totalFeeDiscount)} {currency} in platform fees on this action.
            </div>
          ) : null}
        </>
      ) : (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Review your inputs, then confirm the action below.
        </p>
      )}

      {footer ? <div className="space-y-3 pt-1">{footer}</div> : null}
    </aside>
  );
}
