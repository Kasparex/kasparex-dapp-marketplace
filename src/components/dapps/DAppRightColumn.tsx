'use client';

import { DApp } from '@/lib/dapps';
import { getCategoryById } from '@/lib/categories';
import { DAppIcon } from './DAppIcon';
import { DAppActionsColumn } from './DAppActionsColumn';
import { getDAppNetworkType } from '@/lib/dapps';
import { mergeDAppData } from '@/lib/dapps/contractData';

interface DAppRightColumnProps {
  dapp: DApp;
  contractAddress?: string;
}

/**
 * Premium right column: Category badge → Title → Description → Actions/Purchase box → Rewards & fee reductions.
 * Follows the same pattern as Kasparex Magazines issue pages.
 */
export function DAppRightColumn({ dapp, contractAddress }: DAppRightColumnProps) {
  const mergedDApp = mergeDAppData(null, dapp);
  const category = getCategoryById(mergedDApp.category);
  const networkType = getDAppNetworkType(dapp);
  const networkName = mergedDApp.network || (networkType === 'L1' ? 'L1 Kaspa' : 'L2 Igra');

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Category Badge */}
      {category && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-100 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-black uppercase tracking-widest w-fit">
          {category.name}
        </div>
      )}

      {/* Logo + Title */}
      <div className="flex items-start gap-4">
        <DAppIcon
          dAppName={mergedDApp.name}
          category={mergedDApp.category}
          size={64}
          className="flex-shrink-0 rounded-xl"
        />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl lg:text-3xl font-black text-zinc-900 dark:text-zinc-100 leading-tight">
            {mergedDApp.name}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {networkName}
            {mergedDApp.version && mergedDApp.version !== 'N/A' && (
              <span className="ml-2">• v{mergedDApp.version.replace(/^v\s*/i, '')}</span>
            )}
          </p>
        </div>
      </div>

      {/* Description */}
      <div>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm lg:text-base leading-relaxed">
          {mergedDApp.utility || mergedDApp.description || mergedDApp.process || ''}
        </p>
      </div>

      {/* Actions, Costs & Fees, Revenue Tree (merged) */}
      <DAppActionsColumn dapp={dapp} contractAddress={contractAddress} />
    </div>
  );
}
