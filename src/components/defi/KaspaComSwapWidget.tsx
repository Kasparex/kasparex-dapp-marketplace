'use client';

import { getSwapUrl } from '@/lib/defi/registry';
import { useChainId } from 'wagmi';

interface KaspaComSwapWidgetProps {
  inputCurrency?: string;
  outputCurrency?: string;
  isTestnet?: boolean;
}

export function KaspaComSwapWidget({
  inputCurrency,
  outputCurrency,
  isTestnet,
}: KaspaComSwapWidgetProps) {
  const chainId = useChainId();
  
  // Use provided chain or detect from wagmi
  const effectiveChain = isTestnet ? 167012 : 202555; // Example chain IDs, should be dynamic if possible

  const swapUrl = getSwapUrl('kaspacom', {
    inputCurrency,
    outputCurrency,
    chain: effectiveChain,
    isTestnet
  });

  return (
    <div className="w-full h-[650px] rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl relative">
      {/* Decorative background for the container to make it look premium */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      <iframe
        src={swapUrl}
        width="100%"
        height="100%"
        className="relative z-10"
        style={{ border: 'none' }}
        allow="clipboard-write"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    </div>
  );
}
