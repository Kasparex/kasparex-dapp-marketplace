'use client';

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
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/50 p-4 space-y-2">
      <div>
        <h4 className="font-semibold text-zinc-900 dark:text-white">{contract.key}</h4>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">
          {contract.metadata.description}
        </p>
      </div>
      {(param0 !== null && param0 !== '—') || (param1 !== null && param1 !== '—') ? (
        <div className="text-xs text-zinc-500 dark:text-zinc-500 space-y-0.5">
          {param0 !== null && param0 !== '—' && <div>Params: {param0}</div>}
          {param1 !== null && param1 !== '—' && <div>{param1}</div>}
        </div>
      ) : null}
      <div className="text-xs font-mono">
        {contract.explorerUrl !== '#' ? (
          <a
            href={contract.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-600 dark:text-violet-400 hover:underline"
          >
            {contract.address.slice(0, 10)}…{contract.address.slice(-8)}
          </a>
        ) : (
          <span className="text-zinc-500 dark:text-zinc-500">
            {contract.address.slice(0, 10)}…{contract.address.slice(-8)}
          </span>
        )}
      </div>
      {(contract.metadata.linksTo ?? []).length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1 border-t border-zinc-100 dark:border-zinc-800">
          <span className="text-[10px] font-bold uppercase text-zinc-400 dark:text-zinc-500 mr-1">
            Connects to:
          </span>
          {(contract.metadata.linksTo ?? []).map((k) => (
            <span
              key={k}
              className="inline-flex px-2 py-0.5 rounded text-xs bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-500/20"
            >
              {k}
            </span>
          ))}
        </div>
      )}
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
  const byCategory = new Map<string, ContractListItem[]>();
  for (const c of contractList) {
    const cat = c.metadata.category;
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(c);
  }
  const order = ['core', 'registry', 'dapp', 'tokens', 'rewards', 'other'];
  const categories = order.filter((c) => byCategory.has(c));

  return (
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
  );
}
