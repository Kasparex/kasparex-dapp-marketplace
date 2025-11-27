/**
 * Affiliate Widget Component
 * One-click copy referral link generator
 * Supports both simple (dAppId) and contract-based (affiliateManagerAddress) modes
 */

'use client';

import { useState, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useAffiliate } from '@/hooks/useAffiliate';

export interface AffiliateWidgetProps {
  // Simple mode (for dApps without contract integration)
  dAppId?: string;
  dAppName?: string;
  // Contract-based mode (for dApps with AffiliateManager integration)
  affiliateManagerAddress?: string | null;
  dAppContractAddress?: string;
  className?: string;
}

export function AffiliateWidget({
  dAppId,
  dAppName,
  affiliateManagerAddress,
  dAppContractAddress,
  className = '',
}: AffiliateWidgetProps) {
  const { address } = useAccount();
  const [copied, setCopied] = useState(false);

  // Use contract-based affiliate if addresses provided
  const useContractMode = !!affiliateManagerAddress && !!dAppContractAddress;
  
  const { referralCount, referrals, isLoading: isLoadingAffiliate } = useAffiliate(
    useContractMode ? affiliateManagerAddress : undefined,
    useContractMode ? dAppContractAddress : undefined
  );

  const referralLink = useMemo(() => {
    if (!address) return '';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    if (useContractMode && dAppContractAddress) {
      // For contract-based, use the contract address in the URL
      return `${baseUrl}/dapps/${dAppId || 'contract'}?ref=${address}&contract=${dAppContractAddress}`;
    }
    return `${baseUrl}/dapps/${dAppId}?ref=${address}`;
  }, [address, dAppId, useContractMode, dAppContractAddress]);

  const handleCopy = async () => {
    if (!referralLink) return;
    
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (!address) {
    return (
      <div className={`p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 ${className}`}>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Connect wallet to generate referral link
        </p>
      </div>
    );
  }

  const displayName = dAppName || 'this dApp';

  return (
    <div className={`space-y-3 ${className}`}>
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Referral Link
        </h3>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3">
          Share this link to earn rewards when others use {displayName}
        </p>
      </div>

      <button
        onClick={handleCopy}
        className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left font-mono text-xs break-all"
      >
        {copied ? '✓ Copied!' : referralLink}
      </button>

      {/* Show referral stats if using contract mode */}
      {useContractMode && !isLoadingAffiliate && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-xs text-green-700 dark:text-green-300">
            📊 Referrals: {referralCount?.toString() || '0'}
          </p>
        </div>
      )}

      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          💡 You&apos;ll earn rewards when users click your referral link and interact with this dApp
        </p>
      </div>
    </div>
  );
}

