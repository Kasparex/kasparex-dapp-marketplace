'use client';

import { KxRichTextContent } from '@/components/ui/KxRichTextContent';

type VBlogPremiumSectionGateProps = {
  unlocked: boolean;
  previewHtml: string;
  priceKas: number;
  isProcessing?: boolean;
  isWalletConnected?: boolean;
  onUnlock: () => void;
};

export function VBlogPremiumSectionGate({
  unlocked,
  previewHtml,
  priceKas,
  isProcessing = false,
  isWalletConnected = true,
  onUnlock,
}: VBlogPremiumSectionGateProps) {
  if (unlocked) {
    return (
      <div id="article-premium" className="space-y-4">
        <p className="text-xs font-black uppercase tracking-widest text-[#02abb8] dark:text-[#66dfe8]">
          Premium Content
        </p>
        <KxRichTextContent html={previewHtml} />
      </div>
    );
  }

  return (
    <div id="article-premium" className="relative overflow-hidden rounded-xl min-h-[14rem] max-h-[70vh]">
      <div
        className="pointer-events-none select-none overflow-hidden max-h-[70vh] min-h-[14rem] blur-sm opacity-40"
        aria-hidden
      >
        <KxRichTextContent html={previewHtml || '<p>Premium content preview</p>'} />
      </div>
      <PremiumUnlockOverlay
        priceKas={priceKas}
        isProcessing={isProcessing}
        isWalletConnected={isWalletConnected}
        onUnlock={onUnlock}
      />
    </div>
  );
}

function PremiumUnlockOverlay({
  priceKas,
  isProcessing,
  isWalletConnected,
  onUnlock,
}: {
  priceKas: number;
  isProcessing: boolean;
  isWalletConnected: boolean;
  onUnlock: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onUnlock}
      disabled={isProcessing}
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 p-6 sm:p-8 bg-white/92 dark:bg-zinc-950/92 backdrop-blur-xl text-center cursor-pointer border-0 rounded-xl disabled:cursor-wait"
      aria-label={`Unlock premium content for ${priceKas} KAS`}
    >
      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#02abb8] dark:text-[#66dfe8]">
        Premium Content
      </p>
      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed max-w-sm">
        Unlock for {priceKas} KAS. Your payment goes directly to the author.
      </p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed">
        Support independent writing on Kaspa. One unlock, full access.
      </p>
      <span className="k-control-btn text-sm font-bold uppercase tracking-wide pointer-events-none mt-1">
        {isProcessing ? 'Processing...' : isWalletConnected ? 'Unlock now' : 'Connect wallet to unlock'}
      </span>
    </button>
  );
}
