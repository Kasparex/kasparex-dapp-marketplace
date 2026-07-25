'use client';

import { useState, useMemo } from 'react';
import { useContractParam } from '@/hooks/useContractParams';
import type { ContractListItem } from './SmartContractsPage';

const CATEGORY_LABELS: Record<string, string> = {
  core: 'Core',
  registry: 'Registry',
  dapp: 'dApps',
  tokens: 'Tokens',
  rewards: 'Rewards',
  other: 'Other',
};

export type TreeSortOption = 'category' | 'name-asc' | 'name-desc';

function sortContracts(list: ContractListItem[], sort: TreeSortOption): ContractListItem[] {
  const copy = [...list];
  if (sort === 'name-asc') return copy.sort((a, b) => a.key.localeCompare(b.key));
  if (sort === 'name-desc') return copy.sort((a, b) => b.key.localeCompare(a.key));
  return copy;
}

function ContractTreeCard({
  contract,
  chainId,
}: {
  contract: ContractListItem;
  chainId: number;
}) {
  const paramKeys = contract.metadata.params ?? [];
  const p0 = paramKeys[0];
  const p1 = paramKeys[1];
  const r0 = useContractParam(chainId, contract.key, p0 ?? 'balance');
  const r1 = useContractParam(chainId, contract.key, p1 ?? 'balance');
  const param0 = p0 ? r0.value : null;
  const param1 = p1 ? r1.value : null;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 p-4 flex flex-row gap-4 flex-wrap">
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-zinc-900 dark:text-white">{contract.key}</h4>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">
          {contract.metadata.description}
        </p>
        {(contract.metadata.linksTo ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2 mt-2 border-t border-zinc-100 dark:border-zinc-800">
            <span className="text-[10px] font-bold uppercase text-zinc-400 dark:text-zinc-500 mr-1">
              Connects to:
            </span>
            {(contract.metadata.linksTo ?? []).map((k) => (
              <span
                key={k}
                className="inline-flex rounded border border-[color:var(--hub-accent-border)] bg-[color:var(--hub-accent-muted)] px-2 py-0.5 text-xs text-[color:var(--hub-accent)]"
              >
                {k}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-col items-end gap-1.5 text-right shrink-0">
        {(param0 !== null && param0 !== '-') || (param1 !== null && param1 !== '-') ? (
          <div className="text-xs text-zinc-500 dark:text-zinc-500 space-y-0.5">
            {param0 !== null && param0 !== '-' && <div>Params: {param0}</div>}
            {param1 !== null && param1 !== '-' && <div>{param1}</div>}
          </div>
        ) : null}
        <div className="text-xs font-mono">
          {contract.explorerUrl !== '#' ? (
            <a
              href={contract.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[color:var(--hub-accent)] hover:underline"
            >
              {contract.address.slice(0, 10)}…{contract.address.slice(-8)}
            </a>
          ) : (
            <span className="text-zinc-500 dark:text-zinc-500">
              {contract.address.slice(0, 10)}…{contract.address.slice(-8)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function ContractTreeView({
  contractList,
  chainId,
}: {
  contractList: ContractListItem[];
  chainId: number;
}) {
  const [sortBy, setSortBy] = useState<TreeSortOption>('category');

  const byCategory = useMemo(() => {
    const map = new Map<string, ContractListItem[]>();
    for (const c of contractList) {
      const cat = c.metadata.category;
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(c);
    }
    const order = ['core', 'registry', 'dapp', 'tokens', 'rewards', 'other'];
    order.forEach((cat) => {
      const list = map.get(cat);
      if (list) map.set(cat, sortContracts(list, sortBy));
    });
    return map;
  }, [contractList, sortBy]);

  const order = ['core', 'registry', 'dapp', 'tokens', 'rewards', 'other'];
  const categories = order.filter((c) => byCategory.has(c));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-zinc-500 dark:text-zinc-400">Sort:</span>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as TreeSortOption)}
          className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-700 focus:border-[color:var(--hub-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--hub-accent-border)] dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
        >
          <option value="category">Category (default)</option>
          <option value="name-asc">Name A–Z</option>
          <option value="name-desc">Name Z–A</option>
        </select>
      </div>
      <div className="space-y-8">
        {categories.map((cat) => (
          <section key={cat}>
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
              {CATEGORY_LABELS[cat] ?? cat}
            </h3>
            <div className="space-y-3">
              {byCategory.get(cat)!.map((contract) => (
                <ContractTreeCard key={contract.key} contract={contract} chainId={chainId} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
