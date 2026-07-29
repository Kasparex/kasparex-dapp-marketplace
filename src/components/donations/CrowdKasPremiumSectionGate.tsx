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
  'rounded-xl border-2 border-dashed border-emerald-500/40 dark:border-emerald-400/35 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.06]';

type CrowdKasPremiumSectionGateProps = {
  unlocked: boolean;
  previewHtml: string;
  listPriceKas: number;
  effectivePriceKas: number;
  discountPercent?: number;
  hubPointsBase?: number;
  tier?: KREXTier;
  isProcessing?: boolean;
  isWalletConnected?: boolean;
  paymentCurrencies?: string[];
  selectedCurrency?: string;
  onCurrencyChange?: (currency: string) => void;
  pricingSnapshot?: PricingSnapshot | null;
  flowSteps?: HubFlowStep[];
  flowBusy?: boolean;
  flowComplete?: boolean;
  actionError?: string | null;
  onUnlock: () => void;
};

export function CrowdKasPremiumSectionGate({
  unlocked,
  previewHtml,
  listPriceKas,
  effectivePriceKas,
  discountPercent = 0,
  hubPointsBase = 0,
  tier = 'Tier0',
  isProcessing = false,
  isWalletConnected = true,
  paymentCurrencies = ['KAS'],
  selectedCurrency = 'KAS',
  onCurrencyChange,
  pricingSnapshot = null,
  flowSteps,
  flowBusy,
  flowComplete = false,
  actionError = null,
  onUnlock,
}: CrowdKasPremiumSectionGateProps) {
  if (unlocked) {
    return (
      <div id="crowdkas-premium" className="space-y-4">
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

  const lines: HubPaymentQuoteLine[] = [
    { label: 'List price', value: fmt(listPriceKas) },
    ...(hasDiscount
      ? [{ label: `KREX discount (${discountPercent}%)`, value: `−${fmt(listPriceKas - effectivePriceKas)}` }]
      : []),
    { label: 'Creator payout', value: fmt(effectivePriceKas), dividerBefore: true },
  ];

  const currencyOptions = paymentCurrencies.map((c) => ({
    id: c,
    label: c,
    kind: (c === 'KAS' ? 'kas' : c === 'KREX' ? 'krex' : 'krc20') as 'kas' | 'krex' | 'krc20',
  }));
  const earnPoints = hubPointsBase > 0 ? computeEarnedHubPoints(hubPointsBase, tier) : undefined;

  return (
    <div
      id="crowdkas-premium"
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
          asideClassName="rounded-2xl border border-emerald-500/25 bg-white/95 p-5 space-y-4 dark:border-emerald-400/20 dark:bg-zinc-950/95"
          lines={lines}
          totalDisplay={fmt(effectivePriceKas)}
          totalSubtitle="Kaspa L1 payment to the campaign creator."
          currencies={currencyOptions.length > 1 ? currencyOptions : undefined}
          selectedCurrencyId={payCurrency}
          onCurrencyChange={onCurrencyChange}
          discountNote={
            hasDiscount ? `KREX holder discount: ${discountPercent}% off list price.` : undefined
          }
          infoAccent="emerald"
          tier={tier}
          hubPoints={earnPoints}
          hubPointsBaseSpendKas={effectivePriceKas}
          flowSteps={flowSteps}
          flowPreset="hubPay"
          flowBusy={flowBusy ?? isProcessing}
          flowComplete={flowComplete}
          footer={
            <button
              type="button"
              disabled={isProcessing || !isWalletConnected}
              onClick={onUnlock}
              className="k-control-btn w-full !bg-emerald-600 !text-white !border-emerald-600 hover:!bg-emerald-700 text-sm font-bold uppercase tracking-wide disabled:opacity-50"
            >
              {isProcessing
                ? 'Processing…'
                : isWalletConnected
                  ? 'Unlock premium content'
                  : 'Connect wallet to unlock'}
            </button>
          }
          alerts={
            actionError ? (
              <p className="rounded-xl border border-red-300/70 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-200">
                {actionError}
              </p>
            ) : null
          }
        />
      </div>
    </div>
  );
}
