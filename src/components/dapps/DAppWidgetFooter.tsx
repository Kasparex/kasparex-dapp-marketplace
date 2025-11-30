'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useChainId } from 'wagmi';
import { getExplorerUrl } from '@/lib/dapps/deployer';

interface DAppWidgetFooterProps {
  contractAddress?: string;
}

export function DAppWidgetFooter({ contractAddress }: DAppWidgetFooterProps) {
  const chainId = useChainId();
  const [copied, setCopied] = useState(false);
  
  const explorerUrl = contractAddress && contractAddress.startsWith('0x') 
    ? getExplorerUrl(contractAddress, chainId) 
    : null;
  const truncatedAddress = contractAddress && contractAddress.startsWith('0x')
    ? `${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}`
    : null;

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (contractAddress) {
      await navigator.clipboard.writeText(contractAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-black/50 dark:bg-black/50 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Contract Address - Always visible if available */}
        {contractAddress && contractAddress.startsWith('0x') && explorerUrl ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">Contract:</span>
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-mono text-zinc-700 dark:text-zinc-300 hover:text-[#02abb8] dark:hover:text-[#02abb8] transition-colors underline"
              title={contractAddress}
            >
              {truncatedAddress}
            </a>
            <button
              onClick={handleCopy}
              className="ml-1 p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              title="Copy address"
            >
              {copied ? (
                <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
        ) : (
          <div></div>
        )}

        {/* Right: Footer Text */}
        <div className="text-xs text-zinc-500 dark:text-zinc-500 text-center sm:text-right">
          <Link
            href="/"
            className="hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors"
            title="The Largest dApp Marketplace on Kaspa. Explore, Build, and Earn Today."
          >
            Kasparex dApps
          </Link>
          {' '}| Built with ❤️ by{' '}
          <Link
            href="https://bio.kasparex.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors"
            title="Symbol of intelligence, resilience, and purpose. Fair-launched, community-owned KRC-20 and L2 token on the Kaspa network.

Est. 2024 🔥"
          >
            Krex
          </Link>
        </div>
      </div>
    </div>
  );
}

