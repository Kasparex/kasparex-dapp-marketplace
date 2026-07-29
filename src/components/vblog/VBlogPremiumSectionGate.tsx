'use client';

import { KxRichTextContent } from '@/components/ui/KxRichTextContent';
import { HubPaymentPanel } from '@/components/payments/HubPaymentPanel';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { formatHubPaymentFromKas } from '@/lib/pricing';
import type { PricingSnapshot } from '@/lib/pricing/types';
import type { KREXTier } from '@/lib/rewards/types';
import type { HubFlowStep } from '@/lib/hub/hubFlowProgress';
import type { HubPaymentQuoteLine } from '@/lib/payments/hubPaymentTypes';
import { computeEarnedHubPoints } from '@/lib/rewards/hub-points';

const PREMIUM_PREVIEW_FRAME_CLASS =
  'rounded-xl border-2 border-dashed border-[color:var(--hub-accent-border)] dark:border-[color:var(--hub-accent-border)] bg-[color:var(--hub-accent-muted)] dark:bg-[color:var(--hub-accent-muted)]';

type VBlogPremiumSectionGateProps = {
  unlocked: boolean;
  previewHtml: string;
  listPriceKas: number;
  effectivePriceKas: number;
  authorKas?: number;
  platformKas?: number;
  discountPercent?: number;
  hubPointsBase?: number;
  tier?: KREXTier;
  isProcessing?: boolean;
  isWalletConnected?: boolean;
  hasPendingPayment?: boolean;
  paymentCurrencies?: string[];
  selectedCurrency?: string;
  onCurrencyChange?: (currency: string) => void;
  pricingSnapshot?: PricingSnapshot | null;
  flowSteps?: HubFlowStep[];
  flowBusy?: boolean;
  flowComplete?: boolean;
  flowActiveStepId?: string | null;
  actionError?: string | null;
  onUnlock: () => void;
};

export function VBlogPremiumSectionGate({
  unlocked,
  previewHtml,
  listPriceKas,
  effectivePriceKas,
  authorKas,
  platformKas,
  discountPercent = 0,
  hubPointsBase = 0,
  tier = 'Tier0',
  isProcessing = false,
  isWalletConnected = true,
  hasPendingPayment = false,
  paymentCurrencies = ['KAS'],
  selectedCurrency = 'KAS',
  onCurrencyChange,
  pricingSnapshot = null,
  flowSteps,
  flowBusy,
  flowComplete = false,
  flowActiveStepId = null,
  actionError = null,
  onUnlock,
}: VBlogPremiumSectionGateProps) {
  if (unlocked) {
    return (
      <div id="article-premium" className="space-y-4">
        <DAppSectionHeader title="Premium content" className="mb-0" />
        <KxRichTextContent html={previewHtml} className="kx-prose" />
      </div>
    );
  }

  const hasDiscount = discountPercent > 0 && effectivePriceKas < listPriceKas;
  const payCurrency = selectedCurrency || 'KAS';
  const fmt = (kas: number) =>
    formatHubPaymentFromKas(kas, payCurrency, pricingSnapshot, {
      showKasSuffix: payCurrency !== 'KAS',
    });

  const authorAmount = authorKas ?? Math.max(0, effectivePriceKas - (platformKas ?? 0));
  const feeAmount = platformKas ?? 0;

  const lines: HubPaymentQuoteLine[] = [
    { label: 'List price', value: fmt(listPriceKas) },
    ...(hasDiscount
      ? [{ label: `KREX discount (${discountPercent}%)`, value: `−${fmt(listPriceKas - effectivePriceKas)}` }]
      : []),
    { label: 'Author payout', value: fmt(authorAmount), dividerBefore: true },
    ...(feeAmount > 1e-9 ? [{ label: 'Hub platform fee', value: fmt(feeAmount) }] : []),
  ];

  const currencyOptions = paymentCurrencies.map((c) => ({
    id: c,
    label: c,
    kind: (c === 'KAS' ? 'kas' : c === 'KREX' ? 'krex' : 'krc20') as 'kas' | 'krex' | 'krc20',
  }));
  const earnPoints = hubPointsBase > 0 ? computeEarnedHubPoints(hubPointsBase, tier) : undefined;

  const ctaLabel = isProcessing
    ? 'Processing…'
    : !isWalletConnected
      ? 'Connect wallet to unlock'
      : hasPendingPayment
        ? 'Continue unlock'
        : 'Unlock now';

  return (
    <div
      id="article-premium"
      className={`relative min-h-[28rem] overflow-hidden ${PREMIUM_PREVIEW_FRAME_CLASS}`}
    >
      <div
        className="pointer-events-none select-none absolute inset-0 overflow-hidden blur-sm opacity-35 px-4 sm:px-5 py-6"
        aria-hidden
      >
        <KxRichTextContent html={previewHtml || '<p>Premium content preview</p>'} className="kx-prose" />
      </div>

      <div className="relative z-20 flex min-h-[28rem] items-center justify-center p-4 sm:p-6">
        <HubPaymentPanel
          title="Premium unlock"
          className="w-full max-w-md shadow-xl shadow-zinc-900/10 dark:shadow-black/40"
          lines={lines}
          totalDisplay={fmt(effectivePriceKas)}
          totalSubtitle={
            feeAmount > 1e-9
              ? 'Two wallet approvals: author payout, then Hub fee.'
              : 'One wallet approval to unlock.'
          }
          currencies={currencyOptions.length > 1 ? currencyOptions : undefined}
          selectedCurrencyId={payCurrency}
          onCurrencyChange={onCurrencyChange}
          discountNote={
            hasDiscount ? `KREX holder discount: ${discountPercent}% off list price.` : undefined
          }
          tier={tier}
          hubPoints={earnPoints}
          hubPointsBaseSpendKas={effectivePriceKas}
          flowSteps={flowSteps}
          flowPreset="hubReaderUnlock"
          flowBusy={flowBusy ?? isProcessing}
          flowComplete={flowComplete}
          flowActiveStepId={flowActiveStepId}
          footer={
            <button
              type="button"
              disabled={isProcessing || !isWalletConnected}
              onClick={onUnlock}
              className="k-control-btn w-full text-sm font-bold uppercase tracking-wide disabled:opacity-50"
            >
              {ctaLabel}
            </button>
          }
          alerts={
            actionError ? (
              <p className="rounded-xl border border-red-300/70 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-200">
                {actionError}
              </p>
            ) : hasPendingPayment && !isProcessing ? (
              <p className="rounded-xl border border-amber-300/70 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-100">
                A previous payment step already succeeded in your wallet. Continue to finish unlock without
                re-paying completed steps.
              </p>
            ) : null
          }
        />
      </div>
    </div>
  );
}
