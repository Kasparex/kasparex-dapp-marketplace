'use client';

import { KxRichTextContent } from '@/components/ui/KxRichTextContent';
import { HubPointsEarnBadge } from '@/components/hub/HubPointsEarnBadge';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { KxCopyIconButton } from '@/components/ui/KxCopyIconButton';
import { HubPaymentCurrencyDropdown } from '@/components/payments/HubPaymentCurrencyDropdown';
import { formatAddress } from '@/lib/vblog/utils';
import { formatHubPaymentFromKas } from '@/lib/pricing';
import type { PricingSnapshot } from '@/lib/pricing/types';
import type { KREXTier } from '@/lib/rewards/types';
import type { ResolvedPayoutSplit } from '@/lib/vblog/paymentSplit';

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
  payoutSplits?: ResolvedPayoutSplit[];
  paymentCurrencies?: string[];
  selectedCurrency?: string;
  onCurrencyChange?: (currency: string) => void;
  pricingSnapshot?: PricingSnapshot | null;
  onUnlock: () => void;
};

function PayoutSplitCapsules({ splits }: { splits: ResolvedPayoutSplit[] }) {
  if (splits.length <= 1) return null;
  return (
    <div className="w-full max-w-sm">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        Payment split
      </p>
      <div className="flex flex-wrap justify-center gap-1.5">
        {splits.map((split) => (
          <span
            key={split.address}
            className="inline-flex items-center gap-1 rounded-full border border-zinc-200/50 dark:border-zinc-700/40 bg-zinc-100/40 dark:bg-zinc-800/25 pl-2.5 pr-1 py-1 text-[11px] font-normal text-zinc-500 dark:text-zinc-400"
            title={split.address}
          >
            <span className="font-mono">{formatAddress(split.address)}</span>
            <span className="font-medium tabular-nums text-zinc-500 dark:text-zinc-400">{split.sharePercent}%</span>
            <span
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              role="presentation"
              className="inline-flex opacity-70"
            >
              <KxCopyIconButton value={split.address} label="Copy split wallet address" />
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

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
  payoutSplits = [],
  paymentCurrencies = ['KAS'],
  selectedCurrency = 'KAS',
  onCurrencyChange,
  pricingSnapshot = null,
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
  const listPriceLabel = formatHubPaymentFromKas(listPriceKas, payCurrency, pricingSnapshot, { showKasSuffix: false });
  const effectivePriceLabel = formatHubPaymentFromKas(effectivePriceKas, payCurrency, pricingSnapshot, {
    showKasSuffix: payCurrency !== 'KAS',
  });

  return (
    <div
      id="crowdkas-premium"
      className={`relative h-[30rem] sm:h-[34rem] overflow-hidden ${PREMIUM_PREVIEW_FRAME_CLASS}`}
    >
      <div
        className="pointer-events-none select-none absolute inset-0 overflow-hidden blur-sm opacity-40 px-4 sm:px-5 py-6 sm:py-8"
        aria-hidden
      >
        <KxRichTextContent html={previewHtml || '<p>Premium content preview</p>'} className="kx-prose" />
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
        <DAppSectionHeader title="Premium content" className="mb-0" />
        <p className="text-sm text-zinc-600 dark:text-zinc-300 max-w-md">
          Unlock premium campaign content with a Kaspa L1 payment. This counts as an additional donation to the creator.
        </p>
        <PayoutSplitCapsules splits={payoutSplits} />
        {paymentCurrencies.length > 1 && onCurrencyChange ? (
          <div className="w-full max-w-xs">
            <HubPaymentCurrencyDropdown
              value={payCurrency}
              onChange={onCurrencyChange}
              options={paymentCurrencies.map((c) => ({ value: c, label: c }))}
              ariaLabel="Premium unlock currency"
              accent="emerald"
            />
          </div>
        ) : null}
        <div className="space-y-1">
          {hasDiscount ? (
            <p className="text-xs text-zinc-500 line-through tabular-nums">{listPriceLabel}</p>
          ) : null}
          <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tabular-nums">{effectivePriceLabel}</p>
        </div>
        {hubPointsBase > 0 ? <HubPointsEarnBadge basePoints={hubPointsBase} tier={tier} size="sm" /> : null}
        <button
          type="button"
          disabled={isProcessing || !isWalletConnected}
          onClick={onUnlock}
          className="k-control-btn !bg-emerald-600 !text-white !border-emerald-600 hover:!bg-emerald-700 disabled:opacity-50"
        >
          {isProcessing ? 'Processing…' : isWalletConnected ? 'Unlock premium content' : 'Connect wallet to unlock'}
        </button>
      </div>
    </div>
  );
}
