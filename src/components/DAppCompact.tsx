'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useChainId } from 'wagmi';
import { DApp, generateSimulatedTicker, getDAppNetworkType } from '@/lib/dapps';
import { getCategoryById } from '@/lib/categories';
import { generateDAppSlug } from '@/lib/utils';
import { StatusIndicator } from './dapps/StatusIndicator';
import { mergeDAppData, useDAppFromContract } from '@/lib/dapps/contractData';
import { DAppIcon } from './dapps/DAppIcon';
import { getContractAddress } from '@/lib/contracts/addresses';

interface DAppCompactProps {
    dapps: DApp[];
}

function DAppCompactRow({ dapp }: { dapp: DApp }) {
    const chainId = useChainId();
    const mergedDApp = mergeDAppData(null, dapp);
    const category = getCategoryById(mergedDApp.category);
    const slug = mergedDApp.slug || generateDAppSlug(mergedDApp.name);

    // Get contract data for token information
    let contractAddress = mergedDApp.contractAddress || '';
    if (!contractAddress) {
        contractAddress = getContractAddress(chainId, 'DAppRegistry') || '';
    }
    const { data: contractData } = useDAppFromContract(
        contractAddress?.startsWith('0x') ? contractAddress : undefined,
        chainId
    );

    // Get token information
    const isL1DApp = getDAppNetworkType(mergedDApp) === 'L1';
    let rawTicker: string | null = null;
    if (isL1DApp) {
        if (mergedDApp.slug === 'send-kas' || mergedDApp.name.toLowerCase().includes('send kas')) {
            rawTicker = 'KAS';
        } else if (mergedDApp.slug === 'send-krex' || mergedDApp.name.toLowerCase().includes('send krex')) {
            rawTicker = 'KREX';
        }
    } else {
        rawTicker = contractData?.ticker || generateSimulatedTicker(mergedDApp.name);
    }
    const tokenTicker = rawTicker ? rawTicker.substring(0, 6) : null;

    const networkType = getDAppNetworkType(mergedDApp);
    const networkBadgeColor =
        networkType === 'L1'
            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
            : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';

    return (
        <Link
            href={`/dapps/${slug}`}
            className="flex items-center gap-4 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all group"
        >
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
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">{tokenTicker || 'N/A'}</span>
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
        </Link>
    );
}

export function DAppCompact({ dapps }: DAppCompactProps) {
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
                <DAppCompactRow key={dapp.id} dapp={dapp} />
            ))}
        </div>
    );
}
