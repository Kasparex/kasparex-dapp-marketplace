'use client';

import Link from 'next/link';
import { useChainId } from 'wagmi';
import { getExplorerUrl } from '@/lib/dapps/deployer';

interface DAppWidgetFooterProps {
  contractAddress?: string;
}

export function DAppWidgetFooter({ contractAddress }: DAppWidgetFooterProps) {
  const chainId = useChainId();
  
  const explorerUrl = contractAddress && contractAddress.startsWith('0x') 
    ? getExplorerUrl(contractAddress, chainId) 
    : null;
  const truncatedAddress = contractAddress && contractAddress.startsWith('0x')
    ? `${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}`
    : null;

  return (
    <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
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
          </div>
        ) : (
          <div></div>
        )}

        {/* Right: Footer Text */}
        <div className="text-sm text-zinc-600 dark:text-zinc-400 text-center sm:text-right">
          <Link
            href="/"
            className="text-[#02abb8] hover:text-[#0299a3] transition-colors font-medium"
          >
            Kasparex
          </Link>
          {' '}dApps – The Largest dApp Marketplace on Kaspa | Built with ❤️ by{' '}
          <Link
            href="https://bio.kasparex.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#02abb8] hover:text-[#0299a3] transition-colors font-medium"
          >
            Krex
          </Link>
        </div>
      </div>
    </div>
  );
}

