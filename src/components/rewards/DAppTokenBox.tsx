'use client';

import { useAccount } from 'wagmi';
import Link from 'next/link';
import { DApp, getDAppNetworkType } from '@/lib/dapps';
import { useDAppFromContract, mergeDAppData } from '@/lib/dapps/contractData';
import { getContractAddress } from '@/lib/contracts/addresses';
import { useChainId } from 'wagmi';
import { generateSimulatedTicker } from '@/lib/dapps';
import { getTokenBySlug, getAllTokens } from '@/lib/tokens/registry';
import { formatLargeNumber } from '@/lib/rewards/calculator';
import { TokenLogoImage } from '@/components/ui/TokenLogoImage';
import { useKaspaBalance } from '@/hooks/useKaspaBalance';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useKaspaWallet } from '@/lib/kaspa/context';

interface DAppTokenBoxProps {
  dapp: DApp;
}

export function DAppTokenBox({ dapp }: DAppTokenBoxProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  
  // Merge dApp data
  const mergedDApp = mergeDAppData(null, dapp);
  const isL1DApp = getDAppNetworkType(mergedDApp) === 'L1';
  
  // Get contract data for L2 dApps
  let contractAddress = mergedDApp.contractAddress || '';
  if (!contractAddress) {
    contractAddress = getContractAddress(chainId, 'DAppRegistry') || '';
  }
  const { data: contractData } = useDAppFromContract(
    contractAddress?.startsWith('0x') ? contractAddress : undefined,
    chainId
  );
  
  // Determine token ticker and slug
  let tokenTicker: string | null = null;
  let tokenSlug: string | null = null;
  
  if (isL1DApp) {
    // L1 dApps: map to actual tokens
    if (mergedDApp.slug === 'send-kas' || mergedDApp.name.toLowerCase().includes('send kas')) {
      tokenTicker = 'KAS';
      tokenSlug = 'kas';
    } else if (mergedDApp.slug === 'send-krex' || mergedDApp.name.toLowerCase().includes('send krex')) {
      tokenTicker = 'KREX';
      tokenSlug = 'krex';
    }
  } else {
    // L2 dApps: use contract data or generate
    const rawTicker = contractData?.ticker || generateSimulatedTicker(mergedDApp.name);
    tokenTicker = rawTicker ? rawTicker.substring(0, 6) : null;
    
    // Find token in registry
    if (tokenTicker) {
      const allTokens = getAllTokens();
      const token = allTokens.find(t => 
        t.symbol.toUpperCase() === tokenTicker?.toUpperCase() ||
        t.id === `dapp-${mergedDApp.id}` ||
        t.slug === `${mergedDApp.slug}-token`
      );
      tokenSlug = token?.slug || null;
    }
  }
  
  // Get token data for display
  const token = tokenSlug ? getTokenBySlug(tokenSlug) : null;
  
  // Get actual balances for KAS and KREX
  const { balanceInKas: kasBalance } = useKaspaBalance();
  const { balance: krexBalance } = useKREXBalance();
  
  // Determine if wallet is connected (EVM or Kaspa)
  const isWalletConnected = isConnected || (kaspaState.isConnected && kaspaState.provider === 'kasware');
  
  // Don't show box if no token
  if (!tokenTicker || !tokenSlug) {
    return null;
  }
  
  // Get supply metrics
  let progress = 0;
  let minted = 0;
  let maxSupply = 0;
  let supplyLabel = 'Max Supply';
  
  if (tokenTicker === 'KREX') {
    // KREX is fully minted
    maxSupply = token?.maxSupply || 21_000_000_000;
    minted = token?.circulatingSupply || 21_000_000_000;
    progress = 100;
    supplyLabel = 'Total Supply';
  } else if (tokenTicker === 'KAS') {
    // KAS is mined, not minted - we'll implement accurate data later
    // For now, show placeholder
    maxSupply = 0; // Infinite (mined)
    minted = 0;
    progress = 0;
    supplyLabel = 'Mined Supply';
  } else if (token) {
    // L2 dApp tokens
    maxSupply = token.maxSupply || 0;
    minted = token.circulatingSupply || 0;
    progress = maxSupply > 0 ? (minted / maxSupply) * 100 : 0;
  }
  
  return (
    <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center gap-2 mb-3">
        <TokenLogoImage tokenId={token?.id || tokenSlug} size={20} />
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {tokenTicker} Token
        </h3>
      </div>
      
      <div className="space-y-3">
        {/* Progress Bar Metrics (only for tokens with supply data) */}
        {maxSupply > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-600 dark:text-zinc-400">
                {supplyLabel}
              </span>
              {progress > 0 && (
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {progress.toFixed(2)}% {tokenTicker === 'KREX' ? 'minted' : 'mined'}
                </span>
              )}
            </div>
            
            {/* Progress Bar */}
            {progress > 0 && (
              <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2 mb-2">
                <div
                  className="bg-[#02abb8] h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, progress)}%` }}
                />
              </div>
            )}
            
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {formatLargeNumber(minted)} / {formatLargeNumber(maxSupply)}
            </div>
          </div>
        )}
        
        {/* Balance (if connected) */}
        {isWalletConnected && tokenTicker && (
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-600 dark:text-zinc-400">
                Your Balance
              </span>
              <span className="text-xl font-bold text-[#02abb8]">
                {tokenTicker === 'KAS' 
                  ? formatLargeNumber(kasBalance || 0)
                  : tokenTicker === 'KREX'
                  ? formatLargeNumber(krexBalance || 0)
                  : '—'}
              </span>
            </div>
          </div>
        )}
        
        {/* Token Landing Page Button */}
        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
          <Link
            href={`/tokens/${tokenSlug}`}
            className="block w-full mt-2 px-3 py-2 text-xs font-medium text-center bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
          >
            View Token Page
          </Link>
        </div>
      </div>
    </div>
  );
}
