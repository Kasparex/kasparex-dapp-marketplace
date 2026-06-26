'use client';

import { useState, useMemo } from 'react';
import { useChainId } from 'wagmi';
import { getContractAddress } from '@/lib/contracts/addresses';
import { getExplorerUrl } from '@/lib/dapps/deployer';
import {
  getContractsWithAddress,
  getContractMetadata,
  type ContractKey,
  type ContractMetadataEntry,
} from '@/lib/contracts/contractsMetadata';
import { STATS_PANEL } from '@/components/stats/StatsHeader';
import { ContractTableView } from './ContractTableView';
import { ContractTreeView } from './ContractTreeView';
import { ContractFlowView } from './ContractFlowView';

export interface ContractListItem {
  key: ContractKey;
  address: string;
  metadata: ContractMetadataEntry;
  explorerUrl: string;
}

const TABS = ['Tree view', 'Table view', 'Flow'] as const;
type TabId = (typeof TABS)[number];

function buildContractList(chainId: number): ContractListItem[] {
  const keys = getContractsWithAddress(chainId);
  return keys.map((key) => {
    const address = getContractAddress(chainId, key);
    const metadata = getContractMetadata(key);
    const explorerUrl = getExplorerUrl(address, chainId);
    return { key, address, metadata, explorerUrl };
  });
}

export function SmartContractsPage() {
  const chainId = useChainId();
  const [tab, setTab] = useState<TabId>('Tree view');

  const contractList = useMemo(() => {
    if (typeof chainId === 'number' && chainId > 0) {
      return buildContractList(chainId);
    }
    return [];
  }, [chainId]);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">Contract explorer</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {contractList.length > 0
            ? `${contractList.length} contract${contractList.length !== 1 ? 's' : ''} on the connected network`
            : 'Connect your wallet and select a supported network'}
        </p>
      </div>

      <div className="flex items-center gap-1 p-1 k-control-group w-fit flex-wrap">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              tab === t
                ? 'bg-zinc-100 dark:bg-zinc-800 text-[#02abb8] shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {contractList.length === 0 ? (
        <div className={`${STATS_PANEL} p-8 text-center`}>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Connect your wallet and select a supported network to see contracts.
          </p>
        </div>
      ) : (
        <div className={`${STATS_PANEL} p-4 sm:p-6`}>
          {tab === 'Tree view' && <ContractTreeView contractList={contractList} chainId={chainId} />}
          {tab === 'Table view' && <ContractTableView contractList={contractList} chainId={chainId} />}
          {tab === 'Flow' && <ContractFlowView contractList={contractList} chainId={chainId} />}
        </div>
      )}
    </section>
  );
}
