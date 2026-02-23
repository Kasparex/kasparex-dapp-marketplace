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
import { ContractTableView } from './ContractTableView';
import { ContractTreeView } from './ContractTreeView';
import { ContractFlowView } from './ContractFlowView';

export interface ContractListItem {
  key: ContractKey;
  address: string;
  metadata: ContractMetadataEntry;
  explorerUrl: string;
}

const TABS = ['Flow', 'Tree view', 'Table view'] as const;
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
  const [tab, setTab] = useState<TabId>('Flow');

  const contractList = useMemo(() => {
    if (typeof chainId === 'number' && chainId > 0) {
      return buildContractList(chainId);
    }
    return [];
  }, [chainId]);

  return (
    <section className="space-y-6">
      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-700 pb-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors ' +
              (tab === t
                ? 'bg-violet-500/20 text-violet-700 dark:text-violet-400 border border-violet-500/30'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800')
            }
          >
            {t}
          </button>
        ))}
      </div>

      {contractList.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400 py-8 text-center">
          Connect your wallet and select a supported network to see contracts.
        </p>
      ) : (
        <>
          {tab === 'Flow' && <ContractFlowView contractList={contractList} chainId={chainId} />}
          {tab === 'Tree view' && <ContractTreeView contractList={contractList} chainId={chainId} />}
          {tab === 'Table view' && <ContractTableView contractList={contractList} chainId={chainId} />}
        </>
      )}
    </section>
  );
}
