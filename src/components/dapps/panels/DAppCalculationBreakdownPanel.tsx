'use client';

import { useMemo, useState, memo } from 'react';
import { useChainId } from 'wagmi';
import { usePaymentAmount } from '@/lib/dapps/PaymentAmountContext';
import { DApp, getDAppNetworkType } from '@/lib/dapps';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { getDAppPaymentConfig } from '@/lib/payments/config';
import { formatPrice } from '@/lib/payments/calculator';
import {
  calculateDAppHubQuote,
  isCovenantDAppSlug,
  quoteCurrencyForDApp,
} from '@/lib/payments/hubQuote';
import { KREX_TIERS } from '@/lib/rewards/types';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { KX_CALCULATION_ASIDE } from '@/lib/hub/shellTokens';
import { TierBadge } from '@/components/rewards/TierBadge';
import { KREXBuyWizard } from '@/components/rewards/KREXBuyWizard';
import type { ReactNode } from 'react';

export const DAppCalculationBreakdownPanel = memo(function DAppCalculationBreakdownPanel({
  dapp,
  footer,
  showWhenEmpty = false,
}: {
  dapp: DApp;
  footer?: ReactNode;
  showWhenEmpty?: boolean;
}) {
  const chainId = useChainId();
  const currency = quoteCurrencyForDApp(dapp, chainId);
  const networkType = getDAppNetworkType(dapp);
  const isCovenant = isCovenantDAppSlug(dapp.slug);
  const { paymentAmount, actionId: quoteActionId, hubQuote: customHubQuote } = usePaymentAmount();
  const { balance: krexBalance, tier } = useKREXBalance();
  const { nftStatus } = useNFTStatus();
  const [isKrexWizardOpen, setIsKrexWizardOpen] = useState(false);

  const paymentConfig = useMemo(() => getDAppPaymentConfig(dapp, networkType), [dapp, networkType]);

  const hasVariableActions = useMemo(
    () => paymentConfig?.actions.some((action) => action.variableAmount) ?? false,
    [paymentConfig],
  );

  const waitingForAmount =
    !customHubQuote && !isCovenant && hasVariableActions && (paymentAmount == null || paymentAmount <= 0);

  const computedQuote = useMemo(() => {
    if (customHubQuote) return customHubQuote;
    if (isCovenant || !paymentConfig || waitingForAmount) return null;

    const action =
      (quoteActionId
        ? paymentConfig.actions.find((a) => a.actionId === quoteActionId)
        : null) ?? paymentConfig.actions[0];
    if (!action) return null;

    return calculateDAppHubQuote({
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
      variableAmount: !!action.variableAmount,
      actionLabel: action.actionName,
      overrideBaseCost:
        action.variableAmount && paymentAmount != null && paymentAmount > 0 ? paymentAmount : undefined,
      chainId,
      currency,
    });
  }, [
    customHubQuote,
    isCovenant,
    paymentConfig,
    waitingForAmount,
    quoteActionId,
    dapp,
    krexBalance,
    tier,
    nftStatus,
    paymentAmount,
    chainId,
    currency,
  ]);

  const quote = computedQuote;

  if (!waitingForAmount && !quote && !showWhenEmpty && !footer) {
    return null;
  }

  const tierConfig = KREX_TIERS[tier];
  const showBuyKrex = !quote?.hasKrexDiscount && krexBalance < KREX_TIERS.Tier1.minKREX;
  const discountCurrency = quote?.discountCurrency ?? quote?.currency ?? currency;

  return (
    <aside className={KX_CALCULATION_ASIDE}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <DAppSectionHeader title="Calculation breakdown" className="!mb-0" />
        <TierBadge tier={tier} isUnlocked={krexBalance > 0} />
      </div>

      {waitingForAmount ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Enter an amount in the widget to see fees, KREX tier discounts, and your total.
        </p>
      ) : quote ? (
        <>
          <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
            {quote.lines.map((line) => (
              <div key={line.label} className="flex justify-between gap-2">
                <span className="truncate">{line.label}</span>
                <span className="shrink-0 font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
                  {line.value}
                </span>
              </div>
            ))}
            {quote.subtotalKas != null && quote.discountKas > 0 ? (
              <div className="flex justify-between gap-2 border-t border-zinc-200 pt-1.5 dark:border-zinc-700">
                <span>Subtotal</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
                  {formatPrice(quote.subtotalKas)} {discountCurrency}
                </span>
              </div>
            ) : null}
          </div>

          <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-700">
            <p className="text-xs uppercase tracking-widest text-zinc-500">Total to pay</p>
            <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tabular-nums">
              {formatPrice(quote.totalKas)} {quote.currency}
            </p>
          </div>

          {quote.infoText ? (
            <div className="rounded-xl border border-[#02abb8]/25 bg-[#02abb8]/10 p-3 text-sm text-zinc-700 dark:text-zinc-300">
              {quote.infoText}
            </div>
          ) : null}

          {quote.discountKas > 0 ? (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-300">
              KREX discount: -{formatPrice(quote.discountKas)} {discountCurrency} ({quote.discountPercent}%
              off total).
            </div>
          ) : null}

          {quote.hubPoints != null && quote.hubPoints > 0 ? (
            <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
              <span>Hub points on action</span>
              <span className="font-semibold text-[#02abb8] tabular-nums">
                +{quote.hubPoints.toLocaleString()} pts
                {quote.hubPointsDetail ? ` (${quote.hubPointsDetail})` : ''}
              </span>
            </div>
          ) : null}

          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Current tier: {tierConfig.label} ({tierConfig.description})
          </p>
        </>
      ) : (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Review your inputs, then confirm the action below.
        </p>
      )}

      {showBuyKrex ? (
        <button
          type="button"
          onClick={() => setIsKrexWizardOpen(true)}
          className="w-full k-control-btn !border-emerald-500/30 !text-emerald-700 dark:!text-emerald-300"
        >
          Buy KREX to unlock discount
        </button>
      ) : null}

      {footer ? <div className="space-y-3">{footer}</div> : null}

      <KREXBuyWizard isOpen={isKrexWizardOpen} onClose={() => setIsKrexWizardOpen(false)} />
    </aside>
  );
});
