/**
 * Token Info Section
 * Displays basic token information
 */

'use client';

import type { Token } from '@/lib/tokens/types';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import {
  getNetworkChipLabel,
  getNetworkExplorerUrl,
  getTokenNetworkEntries,
} from '@/lib/tokens/networks';

interface TokenInfoSectionProps {
  token: Token;
}

export function TokenInfoSection({ token }: TokenInfoSectionProps) {
  const networkEntries = getTokenNetworkEntries(token);

  return (
    <section id="info" className="scroll-mt-28 space-y-6">
      <DAppSectionHeader title="About" />

      <div className="prose prose-zinc dark:prose-invert max-w-none">
        <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">{token.description}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 pt-4">
        {networkEntries.length > 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50 sm:col-span-2">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Network availability
            </div>
            <div className="space-y-3">
              {networkEntries.map((entry) => {
                const explorerUrl = getNetworkExplorerUrl(entry.network, entry.contractAddress);
                const statusLabel = entry.primary
                  ? entry.verified
                    ? 'Primary · verified'
                    : 'Primary'
                  : entry.verified
                    ? 'Verified'
                    : 'Linked · unverified';
                return (
                  <div
                    key={`${entry.network}-${entry.contractAddress ?? 'none'}`}
                    className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950/40"
                  >
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {getNetworkChipLabel(entry.network)}
                      </span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          entry.verified
                            ? 'bg-[#02abb8]/15 text-[#02abb8]'
                            : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                        }`}
                      >
                        {statusLabel}
                      </span>
                    </div>
                    {entry.contractAddress ? (
                      <div className="flex items-center gap-2">
                        <code className="break-all text-sm font-mono text-zinc-700 dark:text-zinc-300">
                          {entry.contractAddress}
                        </code>
                        {explorerUrl ? (
                          <a
                            href={explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0 text-[#02abb8] hover:text-[#028a94] transition-colors"
                            title="View on explorer"
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
                        ) : null}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">No address listed yet.</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {token.totalSupply ? (
          <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Total Supply</div>
            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {token.totalSupply.toLocaleString()} {token.symbol}
            </div>
          </div>
        ) : null}

        {token.decimals !== undefined ? (
          <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Decimals</div>
            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{token.decimals}</div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
