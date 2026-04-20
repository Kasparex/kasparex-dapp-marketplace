'use client';

import { useMemo } from 'react';
import { shortenAddress } from '@/lib/walletUi';
import { getExplorerTxUrl } from '@/lib/store/utils';
import { getExplorerTxUrlForChain } from '@/lib/dapps/deployer';
import { useWalletHistory } from '@/hooks/useWalletHistory';

function copyToClipboard(text: string) {
  if (!text) return;
  void navigator.clipboard?.writeText(text);
}

function fmtDate(ms: number) {
  try {
    return new Date(ms).toLocaleString();
  } catch {
    return '-';
  }
}

export function ProfileTransactionsTab(props: { kaspaAddress: string | null; linkedEvmAddress?: string | null; chainId?: number | null }) {
  const address = props.kaspaAddress;
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useWalletHistory(address, { limit: 20 });

  const rows = useMemo(() => {
    const items = data?.pages?.flatMap((p) => (p?.ok ? p.items : [])) ?? [];
    // De-dup by id (in case of refetch overlap)
    const seen = new Set<string>();
    return items.filter((x) => {
      if (seen.has(x.id)) return false;
      seen.add(x.id);
      return true;
    });
  }, [data]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/30 p-5">
        <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100">Transactions</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Unified history of your wallet activity (hashes + statuses). Served node-first with central fallback.
        </p>
      </div>

      {!address ? (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/30 p-5 text-sm text-zinc-600 dark:text-zinc-400">
          No Kaspa address found for this profile.
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/30 overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
            <div className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-widest">
              {shortenAddress(address, { head: 10, tail: 6 })}
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(address)}
              className="k-control-btn h-9 px-3 text-xs"
            >
              Copy address
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                  <th className="text-left py-3 px-4 font-bold">Date</th>
                  <th className="text-left py-3 px-4 font-bold">Type</th>
                  <th className="text-left py-3 px-4 font-bold">Status</th>
                  <th className="text-left py-3 px-4 font-bold">Network</th>
                  <th className="text-left py-3 px-4 font-bold">Tx hash</th>
                  <th className="text-right py-3 px-4 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 px-4 text-center text-zinc-500 dark:text-zinc-500">
                      Loading…
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 px-4 text-center text-zinc-500 dark:text-zinc-500">
                      No history yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => {
                    const explorerUrl =
                      r.network === 'L1'
                        ? getExplorerTxUrl(r.txHash)
                        : props.chainId
                          ? getExplorerTxUrlForChain(props.chainId, r.txHash)
                          : '#';
                    return (
                      <tr key={r.id} className="border-b border-zinc-100 dark:border-zinc-800/70">
                        <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{fmtDate(r.createdAt)}</td>
                        <td className="py-3 px-4 font-medium text-zinc-900 dark:text-zinc-100">
                          {r.actionType}
                        </td>
                        <td className="py-3 px-4 text-zinc-700 dark:text-zinc-300">{r.status}</td>
                        <td className="py-3 px-4 text-zinc-700 dark:text-zinc-300">{r.network}</td>
                        <td className="py-3 px-4 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                          {r.txHash ? `${r.txHash.slice(0, 12)}...${r.txHash.slice(-8)}` : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => copyToClipboard(r.txHash)}
                              className="p-1.5 rounded border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                              title="Copy tx hash"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                            <a
                              href={explorerUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                              title="Open in explorer"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 3h7m0 0v7m0-7L10 14m-1 7H3a2 2 0 01-2-2V7a2 2 0 012-2h6" />
                              </svg>
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-3 px-5 py-4">
            <div className="text-xs text-zinc-500 dark:text-zinc-500">
              Showing {rows.length} items
            </div>
            <button
              type="button"
              disabled={!hasNextPage || isFetchingNextPage}
              onClick={() => fetchNextPage()}
              className="k-control-btn h-9 px-3 text-xs disabled:opacity-50"
            >
              {isFetchingNextPage ? 'Loading…' : hasNextPage ? 'Load more' : 'No more'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

