'use client';

import Link from 'next/link';
import { useChainId } from 'wagmi';
import { getExplorerUrl } from '@/lib/dapps/deployer';

interface DAppWidgetFooterProps {
  contractAddress?: string;
}

export function DAppWidgetFooter({ contractAddress }: DAppWidgetFooterProps) {
  const chainId = useChainId();
  
  if (!contractAddress || !contractAddress.startsWith('0x')) {
    return (
      <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="flex items-center justify-center">
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            Powered by{' '}
            <Link
              href="https://www.kasparex.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#02abb8] hover:text-[#0299a3] transition-colors font-medium"
            >
              Kasparex
            </Link>
            {' '}— The Kaspa dApp Marketplace
          </div>
        </div>
      </div>
    );
  }

  const explorerUrl = getExplorerUrl(contractAddress, chainId);
  const truncatedAddress = `${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}`;

  return (
    <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Contract Address */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">Contract:</span>
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-mono text-zinc-700 dark:text-zinc-300 hover:text-[#02abb8] dark:hover:text-[#02abb8] transition-colors"
            title={contractAddress}
          >
            {truncatedAddress}
          </a>
        </div>

        {/* Right: Kasparex Info */}
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          Powered by{' '}
          <Link
            href="https://www.kasparex.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#02abb8] hover:text-[#0299a3] transition-colors font-medium"
          >
            Kasparex
          </Link>
          {' '}— The Kaspa dApp Marketplace
        </div>
      </div>
    </div>
  );
}

