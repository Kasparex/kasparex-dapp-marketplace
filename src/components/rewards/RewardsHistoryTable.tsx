'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { readHubLedgerEntries } from '@/lib/rewards/hub-ledger-storage';
import type { HubLedgerEntry, HubLedgerEntryKind } from '@/lib/rewards/hub-ledger-types';
import { UNIFIED_REWARD_CATALOG, isTokenPoolClaimItem } from '@/lib/rewards/unified-catalog';
import {
  RX_HISTORY_FOOTER_NOTE,
  RX_HISTORY_TABLE,
  RX_HISTORY_TABLE_SHELL,
  RX_HISTORY_TD,
  RX_HISTORY_THEAD,
  RX_HISTORY_TH,
  RX_HISTORY_TR,
} from '@/components/rewards/rewardsHistoryTableChrome';

const PAGE_SIZE = 25;

/** Ledger stores redeem ledger-only deltas; gameplay-funded spends need meta totals for an honest pts column. */
function ledgerPtsDeltaDisplay(e: HubLedgerEntry): number {
  if (e.kind === 'redeem_spend') {
    const full =
      typeof e.meta?.fullCostPoints === 'number' ? Math.max(0, Math.floor(Number(e.meta.fullCostPoints))) : 0;
    if (full > 0) return -full;
    const mc =
      typeof e.meta?.minecoreRefinementDeducted === 'number'
        ? Math.max(0, Math.floor(Number(e.meta.minecoreRefinementDeducted)))
        : 0;
    const lg =
      typeof e.meta?.ledgerRedeemableDeducted === 'number'
        ? Math.max(0, Math.floor(Number(e.meta.ledgerRedeemableDeducted)))
        : 0;
    const sum = mc + lg;
    if (sum > 0) return -sum;
  }
  return e.redeemableDelta;
}

function motionLabel(kind: HubLedgerEntryKind, e: HubLedgerEntry): string {
  if (kind === 'earn') return 'Earn';
  if (kind === 'redeem_spend') {
    const cid = typeof e.meta?.catalogItemId === 'string' ? e.meta.catalogItemId : '';
    const item = cid ? UNIFIED_REWARD_CATALOG.find((x) => x.id === cid) : undefined;
    if (item && isTokenPoolClaimItem(item)) return 'Pool claim';
    return 'Redeem';
  }
  return kind;
}

function friendlyEarnSource(source: string): string {
  const labels: Record<string, string> = {
    chronicles_read: 'Reading rewards',
    chronicles_slot: 'Collection rewards',
    minecore_note: 'Minecore refine',
    rewards_catalog: 'Rewards catalog',
    legacy_import: 'Imported balance',
    vblog_article_create: 'vBlog publish',
    vblog_article_update: 'vBlog update',
    crowdkas_campaign_create: 'CrowdKAS campaign',
    store_product_list: 'Store listing',
    dapp_directory_list: 'dApp directory listing',
    magazine_issue_publish: 'Magazine publish',
    hub_ad_placement: 'Ads placement',
    dapp_l1_interaction: 'dApp (L1)',
    krex_node_operator: 'Krex node',
  };
  return labels[source] ?? source.replace(/_/g, ' ');
}

function catalogTitle(id: string): string {
  return UNIFIED_REWARD_CATALOG.find((x) => x.id === id)?.title ?? id;
}

function entrySummary(e: HubLedgerEntry): string {
  if (e.kind === 'earn') {
    const src = friendlyEarnSource(e.source);
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
    cid ? catalogTitle(cid) : 'Rewards offer',
    typeof e.meta?.quantity === 'number' ? `qty ${e.meta.quantity}` : '',
  ].filter(Boolean);
  let tail = bits.join(' · ');
  if (mc != null || lg != null) {
    const parts: string[] = [];
    if (mc != null && mc > 0) parts.push(`${mc.toLocaleString()} pts gameplay`);
    if (lg != null && lg > 0) parts.push(`${lg.toLocaleString()} pts wallet`);
    if (parts.length) tail += ` (${parts.join(', ')})`;
  }
  return `${tail}${full > 0 ? ` · ${full.toLocaleString()} pts total` : ''}`;
}

export function RewardsHistoryTable(props: { walletNorm: string }) {
  const [bump, setBump] = useState(0);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    const up = () => setBump((n) => n + 1);
    window.addEventListener('kasparex-hub-ledger', up);
    return () => window.removeEventListener('kasparex-hub-ledger', up);
  }, []);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [props.walletNorm]);

  const rows = useMemo(() => {
    const w = props.walletNorm.trim().toLowerCase();
    if (!w) return [];
    return readHubLedgerEntries(w).sort((a, b) => b.atMs - a.atMs);
  }, [props.walletNorm, bump]);

  const shown = rows.slice(0, visibleCount);
  const hasMore = rows.length > shown.length;

  if (!props.walletNorm.trim()) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Connect your Kaspa wallet to see earn and redeem History (unified ledger on this device).
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className={RX_HISTORY_TABLE_SHELL}>
        <table className={RX_HISTORY_TABLE}>
          <thead className={RX_HISTORY_THEAD}>
            <tr>
              <th className={RX_HISTORY_TH}>When</th>
              <th className={RX_HISTORY_TH}>Motion</th>
              <th className={`${RX_HISTORY_TH} text-right`}>pts</th>
              <th className={RX_HISTORY_TH}>Detail</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className={`${RX_HISTORY_TD} p-8 text-center text-zinc-500 dark:text-zinc-400`}>
                  No activity yet. Use Hub flows (games, Chronicles, creators, catalog) to populate this ledger for your
                  wallet.
                </td>
              </tr>
            ) : (
              shown.map((e) => {
                const pts = ledgerPtsDeltaDisplay(e);
                return (
                  <tr key={e.id} className={RX_HISTORY_TR}>
                    <td className={`${RX_HISTORY_TD} whitespace-nowrap text-zinc-600 dark:text-zinc-400`}>
                      {new Date(e.atMs).toLocaleString()}
                    </td>
                    <td className={`${RX_HISTORY_TD} text-zinc-800 dark:text-zinc-200`}>{motionLabel(e.kind, e)}</td>
                    <td
                      className={`${RX_HISTORY_TD} text-right font-mono font-semibold tabular-nums ${
                        pts >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      {pts >= 0 ? '+' : ''}
                      {pts.toLocaleString()}
                    </td>
                    <td className={`${RX_HISTORY_TD} text-xs text-zinc-600 dark:text-zinc-400`}>{entrySummary(e)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {hasMore ? (
          <div className="border-t border-zinc-200 bg-zinc-50/80 px-3 py-3 text-center dark:border-zinc-800 dark:bg-zinc-900/60">
            <button
              type="button"
              onClick={() => setVisibleCount((c) => Math.min(rows.length, c + PAGE_SIZE))}
              className="text-sm font-semibold text-[#02abb8] hover:underline"
            >
              Load more ({(rows.length - shown.length).toLocaleString()} older)
            </button>
          </div>
        ) : null}
        <p className={RX_HISTORY_FOOTER_NOTE}>
          Earns and redeems roll up here into one Rewards wallet ledger for this device plus Minecore refinement when catalog
          spends gameplay pts first. For what each flow pays, open the{' '}
          <Link href="/rewards#rewards-points" className="text-[#02abb8] hover:underline font-medium">
            Points
          </Link>{' '}
          tab.
        </p>
      </div>
    </div>
  );
}
