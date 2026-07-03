'use client';

import Link from 'next/link';
import { useChainId } from 'wagmi';
import { DApp } from '@/lib/dapps';
import { useDAppFromContract, mergeDAppData } from '@/lib/dapps/contractData';
import { getDAppContractAddress } from '@/lib/dapps/contractResolver';
import { getCategoryById } from '@/lib/categories';

interface DAppWidgetFooterProps {
  dapp: DApp;
  contractAddress?: string;
  hideIcons?: boolean;
  hideStar?: boolean;
  hideHeart?: boolean;
  hideEmbed?: boolean;
  /** When true, do not render the category/version/ID/modal/star/heart row (used on dApp page where that row lives in the right column). */
  hideMetaRow?: boolean;
}

export function DAppWidgetFooter({ 
  dapp, 
  contractAddress,
  hideMetaRow = false,
}: DAppWidgetFooterProps) {
  const chainId = useChainId();

  let resolvedContractAddress = contractAddress || dapp.contractAddress || '';
  if (!resolvedContractAddress) {
    resolvedContractAddress = getDAppContractAddress(dapp, chainId) || '';
  }
  
  const { data: contractData } = useDAppFromContract(
    resolvedContractAddress && resolvedContractAddress.startsWith('0x') ? resolvedContractAddress : undefined,
    chainId
  );

  const mergedDApp = mergeDAppData(contractData, dapp);
  const category = getCategoryById(mergedDApp.category);

  return (
    <>
      <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="flex items-center justify-between gap-6">
          <div className="min-w-0 flex flex-wrap items-center gap-2">
            {!hideMetaRow ? (
              <>
                {category ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-[10px] font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    <span className="text-[11px] leading-none">{category.emoji}</span>
                    {category.name}
                  </span>
                ) : null}
                {mergedDApp.version && mergedDApp.version !== 'N/A' ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-[10px] font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    v{mergedDApp.version.replace(/^v\s*/i, '')}
                  </span>
                ) : null}
                <span className="inline-flex items-center px-2 py-0.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-[10px] font-mono text-zinc-700 dark:text-zinc-300">
                  {mergedDApp.id}
                </span>
              </>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1 text-xs text-zinc-500 dark:text-zinc-500 text-right">
            <Link
              href="https://hub.kasparex.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors"
              title="Kasparex Hub"
            >
              Kasparex Hub
            </Link>
            <span className="opacity-60">|</span>
            <span>Built with love by</span>{' '}
            <Link
              href="https://bio.kasparex.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors"
              title="Symbol of intelligence, resilience, and purpose. Fair-launched, community-owned KRC-20 and L2 token on the Kaspa network.

Est. 2024"
            >
              Krex
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
