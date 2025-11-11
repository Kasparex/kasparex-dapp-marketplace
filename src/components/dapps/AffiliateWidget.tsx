/**
 * Affiliate Widget Component
 * One-click copy referral link generator
 */

'use client';

import { useState, useMemo } from 'react';
import { useAccount } from 'wagmi';

export interface AffiliateWidgetProps {
  dAppId: string;
  dAppName: string;
  className?: string;
}

export function AffiliateWidget({
  dAppId,
  dAppName,
  className = '',
}: AffiliateWidgetProps) {
  const { address } = useAccount();
  const [copied, setCopied] = useState(false);

  const referralLink = useMemo(() => {
    if (!address) return '';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/dapps/${dAppId}?ref=${address}`;
  }, [address, dAppId]);

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

  return (
    <div className={`space-y-3 ${className}`}>
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Referral Link
        </h3>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3">
          Share this link to earn rewards when others use {dAppName}
        </p>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={referralLink}
          readOnly
          className="flex-1 px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100"
        />
        <button
          onClick={handleCopy}
          className="px-4 py-2 bg-[#02abb8] hover:bg-[#0199a3] text-white text-sm font-medium rounded-lg transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          💡 You'll earn rewards when users click your referral link and interact with this dApp
        </p>
      </div>
    </div>
  );
}

