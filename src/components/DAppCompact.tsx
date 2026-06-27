'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DApp, getDAppNetworkType, isDirectoryListingDApp, type DAppNetworkFilter } from '@/lib/dapps';
import { getCategoryById } from '@/lib/categories';
import { generateDAppSlug } from '@/lib/utils';
import { formatLargeNumber } from '@/lib/rewards/calculator';
import { useDAppXpReward } from '@/hooks/useDAppXpReward';
import { mergeDAppData } from '@/lib/dapps/contractData';
import { DAppIcon } from './dapps/DAppIcon';
import { StatusIndicator } from './dapps/StatusIndicator';
import { useDAppAccess } from '@/hooks/useDAppAccess';
import { useDAppWalletGate } from '@/hooks/useDAppWalletGate';
import { DAppWalletGateModal } from './dapps/DAppWalletGateModal';
import { isTestnetDApp } from '@/lib/dapps/access';

interface DAppCompactProps {
    dapps: DApp[];
    selectedNetwork?: DAppNetworkFilter;
}

function DAppCompactRow({ dapp, selectedNetwork = 'all' }: { dapp: DApp; selectedNetwork?: DAppNetworkFilter }) {
    const mergedDApp = mergeDAppData(null, dapp);
    const category = getCategoryById(mergedDApp.category);
    const slug = mergedDApp.slug || generateDAppSlug(mergedDApp.name);
    const access = useDAppAccess({ dapp: mergedDApp, selectedNetwork });
    const { isOpenable } = access;
    const { l1Modal, closeL1Modal, promptGate } = useDAppWalletGate();

    const networkType = getDAppNetworkType(mergedDApp);
    const xpReward = useDAppXpReward(mergedDApp);
    const isTestnet = isTestnetDApp(mergedDApp);
    const networkBadgeColor = isTestnet
        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
        : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300';

    const rowContent = (
        <>
            <div className="flex-shrink-0">
                <DAppIcon
                    dAppName={mergedDApp.name}
                    category={mergedDApp.category}
                    size={40}
                    className="rounded-lg"
                />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {mergedDApp.name}
                    </h3>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${networkBadgeColor}`}>
                        {networkType}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                    <span className="truncate">{category?.emoji} {category?.name}</span>
                    <span>•</span>
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">
                      {isDirectoryListingDApp(mergedDApp) ? 'N/A' : `${formatLargeNumber(xpReward)} pts`}
                    </span>
                </div>
                {mergedDApp.description && (
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5 opacity-80">
                        {mergedDApp.description}
                    </p>
                )}
            </div>

            <div className="flex flex-col items-end gap-2">
                <StatusIndicator dapp={mergedDApp} size="sm" clickable={false} />
                <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                    ID: {mergedDApp.id}
                </div>
            </div>
        </>
    );

    return (
        <div className="relative group">
            {isOpenable ? (
                <Link
                    href={`/dapps/${slug}`}
                    className="flex items-center gap-4 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all"
                >
                    {rowContent}
                </Link>
            ) : (
                <button
                    type="button"
                    onClick={() => promptGate(mergedDApp, access, { selectedNetwork })}
                    className="flex w-full items-center gap-4 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all text-left"
                >
                    {rowContent}
                </button>
            )}

            {l1Modal ? (
                <DAppWalletGateModal
                    dapp={l1Modal.dapp}
                    isOpen
                    onClose={closeL1Modal}
                    selectedNetwork={l1Modal.selectedNetwork}
                />
            ) : null}
        </div>
    );
}

export function DAppCompact({ dapps, selectedNetwork = 'all' }: DAppCompactProps) {
    const [isSidebarHidden, setIsSidebarHidden] = useState(false);

    // Check sidebar state from localStorage
    useEffect(() => {
        const checkSidebarState = () => {
            const savedHidden = localStorage.getItem('sidebar-hidden');
            setIsSidebarHidden(savedHidden === 'true');
        };

        checkSidebarState();
        window.addEventListener('storage', checkSidebarState);
        const interval = setInterval(checkSidebarState, 100);

        return () => {
            window.removeEventListener('storage', checkSidebarState);
            clearInterval(interval);
        };
    }, []);

    if (dapps.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-zinc-500 dark:text-zinc-400">
                    No dApps found matching your filters.
                </p>
            </div>
        );
    }

    const gridCols = isSidebarHidden
        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3';

    return (
        <div className={`grid ${gridCols} gap-3`}>
            {dapps.map((dapp) => (
                <DAppCompactRow key={dapp.id} dapp={dapp} selectedNetwork={selectedNetwork} />
            ))}
        </div>
    );
}
