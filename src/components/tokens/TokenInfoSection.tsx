/**
 * Token Info Section
 * Displays basic token information
 */

'use client';

import type { Token } from '@/lib/tokens/types';
import { getExplorerUrl } from '@/lib/dapps/deployer';
import { useChainId } from 'wagmi';

interface TokenInfoSectionProps {
  token: Token;
}

export function TokenInfoSection({ token }: TokenInfoSectionProps) {
  const chainId = useChainId();

  const explorerUrl = token.contractAddress
    ? getExplorerUrl(token.contractAddress, chainId)
    : null;

  return (
    <section id="info" className="scroll-mt-28 space-y-6 border-b border-zinc-200 py-10 dark:border-zinc-800">
      <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100">About</h2>
      
      <div className="prose prose-zinc dark:prose-invert max-w-none">
        <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
          {token.description}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
        {/* Contract Address */}
        {token.contractAddress && (
          <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Contract Address</div>
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono text-zinc-900 dark:text-zinc-100 break-all">
                {token.contractAddress}
              </code>
              {explorerUrl && (
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 text-[#02abb8] hover:text-[#028a94] transition-colors"
                  title="View on Explorer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Network */}
        <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Network</div>
          <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {token.network === 'L1' ? 'Kaspa L1' : 'Kasplex L2'}
          </div>
        </div>

        {/* Total Supply */}
        {token.totalSupply && (
          <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Total Supply</div>
            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {token.totalSupply.toLocaleString()} {token.symbol}
            </div>
          </div>
        )}

        {/* Decimals */}
        {token.decimals !== undefined && (
          <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Decimals</div>
            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {token.decimals}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
