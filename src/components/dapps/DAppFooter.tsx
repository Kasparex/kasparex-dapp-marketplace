'use client';

import Link from 'next/link';
import { useChainId } from 'wagmi';
import { getExplorerUrl } from '@/lib/dapps/deployer';

interface DAppFooterProps {
  contractAddress?: string;
}

export function DAppFooter({ contractAddress }: DAppFooterProps) {
  const chainId = useChainId();
  
  if (!contractAddress || !contractAddress.startsWith('0x')) {
    return null;
  }

  const explorerUrl = getExplorerUrl(contractAddress, chainId);
  const truncatedAddress = `${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}`;

  return (
    <div className="bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 mt-8 pt-6">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: Contract Address */}
        <div className="flex items-center gap-2">
          <span className="kx-body">Contract:</span>
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-mono text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            title={contractAddress}
          >
            {truncatedAddress}
          </a>
        </div>

        {/* Right: Kasparex Logo */}
        <div>
          <Link
            href="https://www.kasparex.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <span className="text-sm font-medium">Kasparex</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

