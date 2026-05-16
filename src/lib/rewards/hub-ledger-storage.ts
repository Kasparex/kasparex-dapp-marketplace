'use client';

import { sumRedeemedPointsAllSeasons } from '@/lib/redeem/storage';
import type { HubLedgerEntry } from '@/lib/rewards/hub-ledger-types';

/** Hub ledger blobs in localStorage: `kasparex_hub_ledger_v1:<normalized_wallet>`. */
export const KASAPEX_HUB_LEDGER_LS_PREFIX = 'kasparex_hub_ledger_v1';

function keyForWallet(walletNorm: string): string {
  return `${KASAPEX_HUB_LEDGER_LS_PREFIX}:${walletNorm.toLowerCase()}`;
}

export function readHubLedgerEntries(walletNorm: string): HubLedgerEntry[] {
  if (typeof window === 'undefined') return [];
  const w = (walletNorm ?? '').trim().toLowerCase();
  if (!w) return [];
  try {
    const raw = localStorage.getItem(keyForWallet(w));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as HubLedgerEntry[];
  } catch {
    return [];
  }
}

export function writeHubLedgerEntries(walletNorm: string, entries: HubLedgerEntry[]) {
  if (typeof window === 'undefined') return;
  const w = (walletNorm ?? '').trim().toLowerCase();
  if (!w) return;
  try {
    localStorage.setItem(keyForWallet(w), JSON.stringify(entries));
  } catch {
    // ignore
  }
}

const LEGACY_MIGRATION_FLAG = 'kasparex_hub_ledger_legacy_redeem_migrated_v1';

/**
 * One-time: convert historic catalog redemptions (all seasons) into synthetic redeem_spend rows
 * so they reduce unified redeemable against hub earns without using Chronicles season math.
 */
export function migrateLegacyCatalogRedemptionsOnce(walletNorm: string): void {
  if (typeof window === 'undefined') return;
  const w = (walletNorm ?? '').trim().toLowerCase();
  if (!w) return;
  const flag = `${LEGACY_MIGRATION_FLAG}:${w}`;
  if (localStorage.getItem(flag) === '1') return;

  const legacyTotal = sumRedeemedPointsAllSeasons(w);
  if (legacyTotal <= 0) {
    localStorage.setItem(flag, '1');
    return;
  }

  const existing = readHubLedgerEntries(w);
  if (existing.some((e) => e.id === 'legacy:catalog_redeems_sum')) {
    localStorage.setItem(flag, '1');
    return;
  }

  const entry: HubLedgerEntry = {
    id: 'legacy:catalog_redeems_sum',
    atMs: Date.now(),
    walletL1: w,
    seasonId: 'legacy',
    kind: 'redeem_spend',
    source: 'legacy_import',
    redeemableDelta: -legacyTotal,
    leaderboardWeight: 0,
    meta: { note: 'Imported sum of pre-unified catalog redemptions' },
  };
  writeHubLedgerEntries(w, [entry, ...existing].slice(0, 2000));
  localStorage.setItem(flag, '1');
}
