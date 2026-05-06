'use client';

import { useEffect, useMemo, useState } from 'react';
import { readHubLedgerEntries } from '@/lib/rewards/hub-ledger-storage';
import type { HubLedgerEntry } from '@/lib/rewards/hub-ledger-types';
import { UNIFIED_REWARD_CATALOG } from '@/lib/rewards/unified-catalog';

function catalogTitle(id: string): string {
  return UNIFIED_REWARD_CATALOG.find((x) => x.id === id)?.title ?? id;
}

function entrySummary(e: HubLedgerEntry): string {
  if (e.kind === 'earn') {
    const src = e.source.replace(/_/g, ' ');
    return `${src}${e.meta?.note ? ` · ${String(e.meta.note)}` : ''}`;
  }
  const cid = typeof e.meta?.catalogItemId === 'string' ? e.meta.catalogItemId : '';
  const full =
    typeof e.meta?.fullCostPoints === 'number'
      ? (e.meta.fullCostPoints as number)
      : Math.max(0, Math.abs(e.redeemableDelta));
  const mc = typeof e.meta?.minecoreRefinementDeducted === 'number' ? (e.meta.minecoreRefinementDeducted as number) : null;
  const lg = typeof e.meta?.ledgerRedeemableDeducted === 'number' ? (e.meta.ledgerRedeemableDeducted as number) : null;
  const bits = [
    cid ? catalogTitle(cid) : 'Rewards catalog',
    typeof e.meta?.quantity === 'number' ? `qty ${e.meta.quantity}` : '',
  ].filter(Boolean);
  let tail = bits.join(' · ');
  if (mc != null && lg != null) {
    const parts: string[] = [];
    if (mc > 0) parts.push(`${mc.toLocaleString()} pts Minecore`);
    if (lg > 0) parts.push(`${lg.toLocaleString()} pts hub ledger`);
    if (parts.length) tail += ` (${parts.join(', ')})`;
  }
  return `${tail}${full > 0 ? ` · total ${full.toLocaleString()} pts` : ''}`;
}

export function RewardsHistoryTable(props: { walletNorm: string }) {
  const [bump, setBump] = useState(0);
  useEffect(() => {
    const up = () => setBump((n) => n + 1);
    window.addEventListener('kasparex-hub-ledger', up);
    return () => window.removeEventListener('kasparex-hub-ledger', up);
  }, []);

  const rows = useMemo(() => {
    const w = props.walletNorm.trim().toLowerCase();
    if (!w) return [];
    return readHubLedgerEntries(w).sort((a, b) => b.atMs - a.atMs);
  }, [props.walletNorm, bump]);

  if (!props.walletNorm.trim()) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">Connect your Kaspa wallet to see redeem and earn history.</p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/80">
          <tr>
            <th className="p-3 font-semibold text-zinc-700 dark:text-zinc-300">When</th>
            <th className="p-3 font-semibold text-zinc-700 dark:text-zinc-300">Kind</th>
            <th className="p-3 font-semibold text-zinc-700 dark:text-zinc-300 text-right">Δ pts</th>
            <th className="p-3 font-semibold text-zinc-700 dark:text-zinc-300">Detail</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                No ledger rows yet. Earn pts from Minecore / Hub activity or redeem from the catalog.
              </td>
            </tr>
          ) : (
            rows.map((e) => (
              <tr key={e.id} className="border-b border-zinc-100 dark:border-zinc-800">
                <td className="p-3 whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                  {new Date(e.atMs).toLocaleString()}
                </td>
                <td className="p-3 text-zinc-800 dark:text-zinc-200 capitalize">{e.kind.replace('_', ' ')}</td>
                <td
                  className={`p-3 text-right font-mono font-semibold tabular-nums ${
                    e.redeemableDelta >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
                  }`}
                >
                  {e.redeemableDelta >= 0 ? '+' : ''}
                  {e.redeemableDelta.toLocaleString()}
                </td>
                <td className="p-3 text-xs text-zinc-600 dark:text-zinc-400">{entrySummary(e)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <p className="border-t border-zinc-200 bg-zinc-50/80 px-3 py-2 text-[11px] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/60">
        Device-local ledger (same store as the halo balance). Catalog spends deduct Minecore refinement first, then hub ledger
        pts, so totals stay synchronized with the Minecore Redeem tab.
      </p>
    </div>
  );
}
