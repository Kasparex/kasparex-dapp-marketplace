'use client';

import { KxRichTextContent } from '@/components/ui/KxRichTextContent';
import { HubPointsEarnBadge } from '@/components/hub/HubPointsEarnBadge';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { KxCopyIconButton } from '@/components/ui/KxCopyIconButton';
import { formatAddress } from '@/lib/vblog/utils';
import type { KREXTier } from '@/lib/rewards/types';
import type { ResolvedPayoutSplit } from '@/lib/vblog/paymentSplit';

const PREMIUM_PREVIEW_FRAME_CLASS =
  'rounded-xl border-2 border-dashed border-[#02abb8]/40 dark:border-[#66dfe8]/35 bg-[#02abb8]/[0.03] dark:bg-[#02abb8]/[0.06]';

type VBlogPremiumSectionGateProps = {
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
            className="inline-flex items-center gap-1 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/60 pl-2.5 pr-1 py-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-300"
            title={split.address}
          >
            <span className="font-mono">{formatAddress(split.address)}</span>
            <span className="font-bold tabular-nums text-[#02abb8] dark:text-[#66dfe8]">
              {split.sharePercent}%
            </span>
            <span
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              role="presentation"
              className="inline-flex"
            >
              <KxCopyIconButton value={split.address} label="Copy split wallet address" />
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function VBlogPremiumSectionGate({
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

  const triggerUnlock = () => {
    if (isProcessing) return;
    onUnlock();
  };

  return (
    <div
      id="article-premium"
      className={`relative h-[20rem] sm:h-[22rem] overflow-hidden ${PREMIUM_PREVIEW_FRAME_CLASS}`}
    >
      <div
        className="pointer-events-none select-none absolute inset-0 overflow-hidden blur-sm opacity-40 px-4 sm:px-5 py-6 sm:py-8"
        aria-hidden
      >
        <KxRichTextContent html={previewHtml || '<p>Premium content preview</p>'} className="kx-prose" />
      </div>

      <div
        role="button"
        tabIndex={isProcessing ? -1 : 0}
        aria-label={`Unlock premium content for ${effectivePriceKas} KAS`}
        aria-disabled={isProcessing}
        onClick={triggerUnlock}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            triggerUnlock();
          }
        }}
        className={`absolute inset-0 z-20 flex flex-col items-center justify-center gap-2.5 sm:gap-3 px-6 sm:px-10 py-8 bg-white/92 dark:bg-zinc-950/92 backdrop-blur-xl text-center overflow-y-auto ${
          isProcessing ? 'cursor-wait' : 'cursor-pointer'
        }`}
      >
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#02abb8] dark:text-[#66dfe8] shrink-0">
          Premium Content
        </p>

        <div className="space-y-1 shrink-0">
          {hasDiscount ? (
            <p className="text-xs text-zinc-500 line-through tabular-nums">{listPriceKas} KAS</p>
          ) : null}
          <p className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-100 tabular-nums">
            {effectivePriceKas} KAS
          </p>
          {hasDiscount ? (
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              KREX holder discount ({discountPercent}% off)
            </p>
          ) : null}
        </div>

        <p className="text-sm sm:text-base font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed max-w-sm shrink-0">
          Unlock to keep reading.
          <br />
          Your payment goes directly to the author.
        </p>

        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed shrink-0">
          Support independent writing on Kaspa. One unlock, full access.
        </p>

        <PayoutSplitCapsules splits={payoutSplits} />

        {hubPointsBase > 0 ? (
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400 shrink-0">
            <span className="font-semibold uppercase tracking-wide">Earn:</span>
            <HubPointsEarnBadge basePoints={hubPointsBase} tier={tier} size="md" />
          </div>
        ) : null}

        <span className="k-control-btn text-sm font-bold uppercase tracking-wide pointer-events-none mt-1 shrink-0">
          {isProcessing ? 'Processing...' : isWalletConnected ? 'Unlock now' : 'Connect wallet to unlock'}
        </span>
      </div>
    </div>
  );
}
