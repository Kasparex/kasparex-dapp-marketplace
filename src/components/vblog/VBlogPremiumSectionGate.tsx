'use client';

import { KxRichTextContent } from '@/components/ui/KxRichTextContent';
import { HubPointsEarnBadge } from '@/components/hub/HubPointsEarnBadge';
import type { KREXTier } from '@/lib/rewards/types';

const PREMIUM_FRAME_CLASS =
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
  onUnlock: () => void;
};

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
  onUnlock,
}: VBlogPremiumSectionGateProps) {
  if (unlocked) {
    return (
      <div id="article-premium" className={`space-y-4 p-4 sm:p-5 ${PREMIUM_FRAME_CLASS}`}>
        <p className="text-xs font-black uppercase tracking-widest text-[#02abb8] dark:text-[#66dfe8]">
          Premium Content
        </p>
        <KxRichTextContent html={previewHtml} className="text-base sm:text-[1.05rem] leading-relaxed" />
      </div>
    );
  }

  return (
    <div
      id="article-premium"
      className={`relative overflow-hidden min-h-[14rem] max-h-[70vh] ${PREMIUM_FRAME_CLASS}`}
    >
      <div
        className="pointer-events-none select-none overflow-hidden max-h-[70vh] min-h-[14rem] blur-sm opacity-40 p-4 sm:p-5"
        aria-hidden
      >
        <KxRichTextContent
          html={previewHtml || '<p>Premium content preview</p>'}
          className="text-base sm:text-[1.05rem] leading-relaxed"
        />
      </div>
      <PremiumUnlockOverlay
        listPriceKas={listPriceKas}
        effectivePriceKas={effectivePriceKas}
        discountPercent={discountPercent}
        hubPointsBase={hubPointsBase}
        tier={tier}
        isProcessing={isProcessing}
        isWalletConnected={isWalletConnected}
        onUnlock={onUnlock}
      />
    </div>
  );
}

function PremiumUnlockOverlay({
  listPriceKas,
  effectivePriceKas,
  discountPercent,
  hubPointsBase,
  tier,
  isProcessing,
  isWalletConnected,
  onUnlock,
}: {
  listPriceKas: number;
  effectivePriceKas: number;
  discountPercent: number;
  hubPointsBase: number;
  tier: KREXTier;
  isProcessing: boolean;
  isWalletConnected: boolean;
  onUnlock: () => void;
}) {
  const hasDiscount = discountPercent > 0 && effectivePriceKas < listPriceKas;

  return (
    <button
      type="button"
      onClick={onUnlock}
      disabled={isProcessing}
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 p-6 sm:p-8 bg-white/92 dark:bg-zinc-950/92 backdrop-blur-xl text-center cursor-pointer border-0 rounded-xl disabled:cursor-wait"
      aria-label={`Unlock premium content for ${effectivePriceKas} KAS`}
    >
      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#02abb8] dark:text-[#66dfe8]">
        Premium Content
      </p>
      <div className="space-y-1">
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
      <p className="text-sm sm:text-base font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed max-w-sm">
        Unlock to keep reading. Your payment goes directly to the author.
      </p>
      <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed">
        Support independent writing on Kaspa. One unlock, full access.
      </p>
      {hubPointsBase > 0 ? (
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400">
          <span className="font-semibold uppercase tracking-wide">You will get:</span>
          <HubPointsEarnBadge basePoints={hubPointsBase} tier={tier} size="md" />
        </div>
      ) : null}
      <span className="k-control-btn text-sm font-bold uppercase tracking-wide pointer-events-none mt-1">
        {isProcessing ? 'Processing...' : isWalletConnected ? 'Unlock now' : 'Connect wallet to unlock'}
      </span>
    </button>
  );
}
