'use client';

import { getSwapUrl } from '@/lib/defi/registry';
import { useChainId } from 'wagmi';
import { useTheme } from '@/components/ThemeProvider';

interface KaspaComSwapWidgetProps {
  inputCurrency?: string;
  outputCurrency?: string;
  isTestnet?: boolean;
  type?: 'swap' | 'create-liquidity';
}

export function KaspaComSwapWidget({
  inputCurrency,
  outputCurrency,
  isTestnet,
  type = 'swap',
}: KaspaComSwapWidgetProps) {
  const chainId = useChainId();
  const { theme } = useTheme();
  
  // Use provided chain or detect from wagmi
  const effectiveChain = isTestnet ? 167012 : 202555; 

  const swapUrl = getSwapUrl('kaspacom', {
    inputCurrency,
    outputCurrency,
    chain: effectiveChain,
    isTestnet,
    type,
    theme
  });

  return (
    <div className="flex flex-col gap-6 w-full max-w-full mx-auto">
      <div className="w-full h-[850px] rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl relative">
        {/* Decorative background for the container */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden text-center flex items-center justify-center opacity-5">
           <span className="text-9xl font-black rotate-12 select-none tracking-tighter">KASPACOM</span>
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
      
      {/* Third-party Disclaimer */}
      <div className="flex items-start gap-3 px-6 py-4 rounded-2xl bg-zinc-100/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
        <svg className="w-5 h-5 text-zinc-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>
          <span className="font-bold text-zinc-700 dark:text-zinc-200 uppercase tracking-tighter mr-1">Third-Party Service Disclosure:</span> 
          The swapping and liquidity features provided on this page are powered by the <a href="https://defi.kaspa.com" target="_blank" rel="noopener noreferrer" className="text-[#02abb8] hover:underline font-bold">KaspaCom DEX</a>. 
          Kasparex Hub acts solely as an interface and does not control, manage, or guarantee the operation of these decentralized tools. 
          Users are interacting directly with the KaspaCom protocol. Always perform your own research and exercise caution when performing financial transactions.
        </p>
      </div>
    </div>
  );
}
