'use client';

import { useState, useMemo } from 'react';
import { useContractParam } from '@/hooks/useContractParams';
import type { ContractListItem } from './SmartContractsPage';

const CATEGORY_LABELS: Record<string, string> = {
  core: 'Core',
  registry: 'Registry',
  dapp: 'dApp',
  tokens: 'Tokens',
  rewards: 'Rewards',
  other: 'Other',
};

export type TableSortOption =
  | 'name-asc'
  | 'name-desc'
  | 'category-asc'
  | 'category-desc'
  | 'address-asc'
  | 'address-desc';

function sortTableList(
  list: ContractListItem[],
  sort: TableSortOption
): ContractListItem[] {
  const copy = [...list];
  switch (sort) {
    case 'name-asc':
      return copy.sort((a, b) => a.key.localeCompare(b.key));
    case 'name-desc':
      return copy.sort((a, b) => b.key.localeCompare(a.key));
    case 'category-asc':
      return copy.sort(
        (a, b) =>
          (CATEGORY_LABELS[a.metadata.category] ?? a.metadata.category).localeCompare(
            CATEGORY_LABELS[b.metadata.category] ?? b.metadata.category
          )
      );
    case 'category-desc':
      return copy.sort(
        (a, b) =>
          (CATEGORY_LABELS[b.metadata.category] ?? b.metadata.category).localeCompare(
            CATEGORY_LABELS[a.metadata.category] ?? a.metadata.category
          )
      );
    case 'address-asc':
      return copy.sort((a, b) => a.address.localeCompare(b.address));
    case 'address-desc':
      return copy.sort((a, b) => b.address.localeCompare(a.address));
    default:
      return copy;
  }
}

function ContractTableRow({
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
  const param0 = p0 ? r0.value : '-';
  const param1 = p1 ? r1.value : '-';
  const paramsStr =
    param0 !== '-' && param1 !== '-'
      ? `${param0} · ${param1}`
      : param0 !== '-'
        ? param0
        : param1 !== '-'
          ? param1
          : '-';

  const truncate = (addr: string) =>
    addr.length > 10 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;

  return (
    <tr className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
      <td className="py-3 px-3 text-sm font-medium text-zinc-900 dark:text-white">
        {contract.key}
      </td>
      <td className="py-3 px-3 text-sm text-zinc-600 dark:text-zinc-400 max-w-[200px] truncate">
        {contract.metadata.description}
      </td>
      <td className="py-3 px-3">
        <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
          {CATEGORY_LABELS[contract.metadata.category] ?? contract.metadata.category}
        </span>
      </td>
      <td className="py-3 px-3 text-sm text-zinc-600 dark:text-zinc-400">
        {paramsStr}
      </td>
      <td className="py-3 px-3 text-sm font-mono">
        {contract.explorerUrl !== '#' ? (
          <a
            href={contract.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[color:var(--hub-accent)] hover:underline"
          >
            {truncate(contract.address)}
          </a>
        ) : (
          <span className="text-zinc-600 dark:text-zinc-400">{truncate(contract.address)}</span>
        )}
      </td>
      <td className="py-3 px-3">
        <div className="flex flex-wrap gap-1">
          {(contract.metadata.linksTo ?? []).map((k) => (
            <span
              key={k}
              className="inline-flex rounded border border-[color:var(--hub-accent-border)] bg-[color:var(--hub-accent-muted)] px-2 py-0.5 text-xs text-[color:var(--hub-accent)]"
            >
              {k}
            </span>
          ))}
          {(contract.metadata.linksTo ?? []).length === 0 && '-'}
        </div>
      </td>
    </tr>
  );
}

export function ContractTableView({
  contractList,
  chainId,
}: {
  contractList: ContractListItem[];
  chainId: number;
}) {
  const [sortBy, setSortBy] = useState<TableSortOption>('name-asc');

  const sortedList = useMemo(
    () => sortTableList(contractList, sortBy),
    [contractList, sortBy]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-zinc-500 dark:text-zinc-400">Sort:</span>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as TableSortOption)}
          className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-700 focus:border-[color:var(--hub-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--hub-accent-border)] dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
        >
          <option value="name-asc">Name A–Z</option>
          <option value="name-desc">Name Z–A</option>
          <option value="category-asc">Category A–Z</option>
          <option value="category-desc">Category Z–A</option>
          <option value="address-asc">Address A–Z</option>
          <option value="address-desc">Address Z–A</option>
        </select>
      </div>
      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
              <th className="py-3 px-3 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Name
              </th>
              <th className="py-3 px-3 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Description
              </th>
              <th className="py-3 px-3 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Category
              </th>
              <th className="py-3 px-3 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Params
              </th>
              <th className="py-3 px-3 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Address
              </th>
              <th className="py-3 px-3 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Connects to
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedList.map((contract) => (
              <ContractTableRow key={contract.key} contract={contract} chainId={chainId} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
