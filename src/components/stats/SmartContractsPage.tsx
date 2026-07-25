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
import { STATS_PANEL } from '@/lib/stats/statsUi';
import { GameSectionHeader } from '@/components/games/layout/GameSectionHeader';
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
        <GameSectionHeader title="Contract explorer" />
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          {contractList.length > 0
            ? `${contractList.length} contract${contractList.length !== 1 ? 's' : ''} on the connected network`
            : 'Connect your wallet and select a supported network'}
        </p>
      </div>

      <div className="k-control-group flex w-fit flex-wrap items-center gap-1 p-1">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
              tab === t
                ? 'bg-zinc-100 text-[color:var(--hub-accent)] shadow-sm dark:bg-zinc-800'
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
        <div className={`${STATS_PANEL} p-4`}>
          {tab === 'Tree view' && <ContractTreeView contractList={contractList} chainId={chainId} />}
          {tab === 'Table view' && <ContractTableView contractList={contractList} chainId={chainId} />}
          {tab === 'Flow' && <ContractFlowView contractList={contractList} chainId={chainId} />}
        </div>
      )}
    </section>
  );
}
