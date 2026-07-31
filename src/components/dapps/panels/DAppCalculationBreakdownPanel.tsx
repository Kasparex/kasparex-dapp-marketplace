'use client';

import { useMemo, useState, memo } from 'react';
import { useChainId } from 'wagmi';
import { usePaymentAmount } from '@/lib/dapps/PaymentAmountContext';
import { DApp, getDAppNetworkType } from '@/lib/dapps';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { getDAppPaymentConfig } from '@/lib/payments/config';
import {
  calculateDAppHubQuote,
  isCovenantDAppSlug,
  quoteCurrencyForDApp,
} from '@/lib/payments/hubQuote';
import { KREX_TIERS } from '@/lib/rewards/types';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { HubFlowProgress } from '@/components/hub/HubFlowProgress';
import { KX_CALCULATION_ASIDE } from '@/lib/hub/shellTokens';
import { getHubFlowPreset, type HubFlowStep } from '@/lib/hub/hubFlowProgress';
import { HubPointsEarnBadge } from '@/components/hub/HubPointsEarnBadge';
import { TierBadge } from '@/components/rewards/TierBadge';
import { HubPaymentCurrencyCatalogTrigger } from '@/components/payments/HubPaymentCurrencyCatalogModal';
import { useHubPayWithCatalog, hubCatalogSelectionToStoreCurrency } from '@/hooks/useHubPayWithCatalog';
import { resolveCatalogPaymentOption } from '@/lib/payments/currencyCatalog';
import { formatHubPaymentAmount } from '@/lib/payments/hubPaymentTypes';
import { buildHubPlatformFeePlan } from '@/lib/payments/paymentPlan';
import { resolveHubTokenRailFeeKas } from '@/lib/payments/tokenRailKasFee';
import { getKaspaCapsuleTreasuryL1Address } from '@/lib/genesis/config';
import { KREXBuyWizard } from '@/components/rewards/KREXBuyWizard';
import type { ReactNode } from 'react';

function reformatKasLineValue(
  value: string,
  formatPay: (kas: number) => string,
): string {
  const trimmed = value.trim();
  const match = trimmed.match(/^([\d]+(?:[.,]\d+)?)\s*KAS$/i);
  if (!match) return value;
  const raw = match[1]!.replace(',', '.');
  const kas = Number(raw);
  if (!Number.isFinite(kas)) return value;
  return formatPay(kas);
}

export const DAppCalculationBreakdownPanel = memo(function DAppCalculationBreakdownPanel({
  dapp,
  footer,
  showWhenEmpty = false,
  flowSteps,
  flowBusy = false,
  flowComplete = false,
  flowProgressSlot = null,
}: {
  dapp: DApp;
  footer?: ReactNode;
  showWhenEmpty?: boolean;
  flowSteps?: HubFlowStep[];
  flowBusy?: boolean;
  flowComplete?: boolean;
  /** Custom Flow Progress node from the action rail (overrides default). */
  flowProgressSlot?: ReactNode;
}) {
  const chainId = useChainId();
  const currency = quoteCurrencyForDApp(dapp, chainId);
  const networkType = getDAppNetworkType(dapp);
  const isCovenant = isCovenantDAppSlug(dapp.slug);
  const {
    paymentAmount,
    actionId: quoteActionId,
    hubQuote: customHubQuote,
    payCurrencyId,
    setPayCurrencyId,
  } = usePaymentAmount();
  const { balance: krexBalance, tier } = useKREXBalance();
  const [isKrexWizardOpen, setIsKrexWizardOpen] = useState(false);
  const { catalogEntries, pricingSnapshot } = useHubPayWithCatalog({
    amountKas: paymentAmount ?? customHubQuote?.totalKas ?? undefined,
  });
  const paymentOption = resolveCatalogPaymentOption(catalogEntries, payCurrencyId);

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
      hasAnyNFT: false,
      hasDiamondNFT: false,
      hasRarestNFT: false,
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
    paymentAmount,
    chainId,
    currency,
  ]);

  const quote = computedQuote;

  const formatPayAmount = (kas: number) =>
    formatHubPaymentAmount(paymentOption, kas, { snapshot: pricingSnapshot });

  const splitLegs = useMemo(() => {
    if (!quote) return undefined;
    try {
      const treasury =
        dapp.slug === 'kaspa-capsule' ? getKaspaCapsuleTreasuryL1Address() : undefined;
      return buildHubPlatformFeePlan({
        totalKas: resolveHubTokenRailFeeKas(quote.totalKas),
        treasuryAddress: treasury,
      }).legs;
    } catch {
      return undefined;
    }
  }, [quote, dapp.slug]);

  const displayLines = useMemo(() => {
    if (!quote) return [];
    return quote.lines.map((line) => ({
      ...line,
      value: reformatKasLineValue(line.value, (kas) =>
        formatHubPaymentAmount(paymentOption, kas, { snapshot: pricingSnapshot }),
      ),
    }));
  }, [quote, paymentOption, pricingSnapshot]);

  if (!waitingForAmount && !quote && !showWhenEmpty && !footer) {
    return null;
  }

  const showBuyKrex = !quote?.hasKrexDiscount && krexBalance < KREX_TIERS.Tier1.minKREX;
  const baseSpendKas = paymentAmount ?? quote?.subtotalKas ?? quote?.totalKas;
  const steps = flowSteps ?? getHubFlowPreset(isCovenant ? 'covenantCreate' : 'hubPay');
  const showPayWith = !isCovenant && networkType === 'L1' && catalogEntries.length > 0;
  const showSplit = Boolean(splitLegs && splitLegs.length > 0);
  const infoText =
    quote?.infoText &&
    (paymentOption.kind === 'kas'
      ? quote.infoText
      : `${quote.infoText} Token settlement also runs the same Hub KAS multi-out split as a pure-KAS payment.`);

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
          <div className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
            {displayLines.map((line) => (
              <div key={line.label} className="flex justify-between gap-2">
                <span className="truncate">{line.label}</span>
                <span className="shrink-0 font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
                  {line.value}
                </span>
              </div>
            ))}
            {quote.subtotalKas != null && quote.discountKas > 0 ? (
              <div className="flex justify-between gap-2 border-t border-zinc-200 pt-2 dark:border-zinc-700">
                <span>Subtotal</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
                  {formatPayAmount(quote.subtotalKas)}
                </span>
              </div>
            ) : null}
          </div>

          <div className="space-y-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-700">
            {showPayWith ? (
              <div>
                <p className="mb-2 text-xs uppercase tracking-widest text-zinc-500">Pay with</p>
                <HubPaymentCurrencyCatalogTrigger
                  entries={catalogEntries}
                  selectedId={payCurrencyId}
                  onSelect={(opt) => {
                    setPayCurrencyId(hubCatalogSelectionToStoreCurrency(opt));
                  }}
                />
              </div>
            ) : null}
            {showSplit ? (
              <div
                className={`space-y-1.5${showPayWith ? ' border-t border-zinc-200 pt-3 dark:border-zinc-700' : ''}`}
              >
                <p className="text-xs uppercase tracking-widest text-zinc-500">Payment split</p>
                {splitLegs!.map((leg) => (
                  <div
                    key={`${leg.role}-${leg.address}`}
                    className="flex justify-between gap-2 text-xs text-zinc-600 dark:text-zinc-400"
                  >
                    <span className="truncate">{leg.label ?? leg.role}</span>
                    <span className="shrink-0 font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                      {leg.amount} KAS
                    </span>
                  </div>
                ))}
                <p className="pt-1 text-[11px] text-zinc-500">
                  {paymentOption.kind === 'kas'
                    ? 'One transaction. Change returns to your wallet.'
                    : 'Token transfer, then the same Hub KAS multi-out split. Change returns to your wallet.'}
                </p>
              </div>
            ) : null}
            <div
              className={
                showPayWith || showSplit ? 'border-t border-zinc-200 pt-3 dark:border-zinc-700' : ''
              }
            >
              <p className="text-xs uppercase tracking-widest text-zinc-500">Total to pay</p>
              <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tabular-nums">
                {formatPayAmount(quote.totalKas)}
              </p>
            </div>
          </div>

          {infoText ? (
            <div className="rounded-xl border border-[#02abb8]/25 bg-[#02abb8]/10 p-3 text-sm text-zinc-700 dark:text-zinc-300">
              {infoText}
            </div>
          ) : null}

          {quote.discountKas > 0 ? (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-300">
              KREX discount: -{formatPayAmount(quote.discountKas)} ({quote.discountPercent}%
              {quote.subtotalKas != null && quote.totalKas < quote.subtotalKas
                ? ' off total'
                : ' off platform fees'}
              ).
            </div>
          ) : null}

          {quote.hubPoints != null && quote.hubPoints > 0 ? (
            <div className="flex items-center justify-between gap-2 rounded-xl border border-zinc-200 px-3 py-2.5 text-xs text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
              <span>Hub points on action</span>
              <span className="inline-flex items-center gap-1.5">
                <HubPointsEarnBadge points={quote.hubPoints} baseSpendKas={baseSpendKas} />
                {quote.hubPointsDetail ? (
                  <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                    ({quote.hubPointsDetail})
                  </span>
                ) : null}
              </span>
            </div>
          ) : null}
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

      {flowProgressSlot ?? (
        <HubFlowProgress steps={steps} busy={flowBusy} complete={flowComplete} />
      )}

      <KREXBuyWizard isOpen={isKrexWizardOpen} onClose={() => setIsKrexWizardOpen(false)} />
    </aside>
  );
});
