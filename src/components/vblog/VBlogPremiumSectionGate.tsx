'use client';

import { KxRichTextContent } from '@/components/ui/KxRichTextContent';
import { HubPointsEarnBadge } from '@/components/hub/HubPointsEarnBadge';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
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
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/60 px-2.5 py-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-300"
            title={split.address}
          >
            <span className="font-mono">{formatAddress(split.address)}</span>
            <span className="font-bold tabular-nums text-[#02abb8] dark:text-[#66dfe8]">
              {split.sharePercent}%
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

  return (
    <div id="article-premium" className={`relative overflow-hidden ${PREMIUM_PREVIEW_FRAME_CLASS}`}>
      <div
        className="pointer-events-none select-none max-h-56 overflow-hidden blur-sm opacity-40 px-4 sm:px-5 py-6"
        aria-hidden
      >
        <KxRichTextContent html={previewHtml || '<p>Premium content preview</p>'} className="kx-prose" />
      </div>

      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 px-6 sm:px-10 py-10 bg-white/92 dark:bg-zinc-950/92 backdrop-blur-xl text-center">
        <p className="text-xs font-black uppercase tracking-widest text-[#02abb8] dark:text-[#66dfe8]">
          Premium content
        </p>

        <div className="space-y-1">
          {hasDiscount ? (
            <p className="text-xs text-zinc-500 line-through tabular-nums">{listPriceKas} KAS</p>
          ) : null}
          <p className="text-xl font-black text-zinc-900 dark:text-zinc-100 tabular-nums">
            {effectivePriceKas} KAS
          </p>
          {hasDiscount ? (
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              KREX holder discount ({discountPercent}% off)
            </p>
          ) : null}
        </div>

        <p className="kx-body-sm max-w-sm">
          Unlock to keep reading. Your payment goes directly to the author.
        </p>

        <PayoutSplitCapsules splits={payoutSplits} />

        {hubPointsBase > 0 ? (
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400">
            <span className="font-semibold uppercase tracking-wide">Earn:</span>
            <HubPointsEarnBadge basePoints={hubPointsBase} tier={tier} size="md" />
          </div>
        ) : null}

        <button
          type="button"
          onClick={onUnlock}
          disabled={isProcessing}
          className="k-cta-primary mt-1 !w-auto px-8 text-sm font-bold disabled:cursor-wait disabled:opacity-70"
          aria-label={`Unlock premium content for ${effectivePriceKas} KAS`}
        >
          {isProcessing ? 'Processing...' : isWalletConnected ? 'Unlock now' : 'Connect wallet to unlock'}
        </button>
      </div>
    </div>
  );
}
