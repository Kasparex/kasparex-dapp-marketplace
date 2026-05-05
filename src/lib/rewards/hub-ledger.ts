'use client';

import type { SeasonId } from '@/lib/leaderboard/seasons';
import type { EarnSource, HubLedgerEntry, LedgerSeasonBucket } from './hub-ledger-types';

export type {
  HubLedgerEntry,
  EarnSource,
  HubLedgerEntryKind,
} from './hub-ledger-types';

import {
  migrateLegacyCatalogRedemptionsOnce,
  readHubLedgerEntries,
  writeHubLedgerEntries,
} from './hub-ledger-storage';

/** Client-only: dispatch after mutating persisted hub ledger */
export function broadcastHubLedgerChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event('kasparex-hub-ledger'));
}

/** Sum leaderboard units for wallet in season (projection for hub leaderboard UX). */
export function sumLeaderboardUnitsForSeason(walletL1Norm: string, seasonId: SeasonId): number {
  const entries = readHubLedgerEntries(walletL1Norm).filter((e) => e.seasonId === seasonId);
  return entries.reduce((acc, e) => acc + e.leaderboardWeight, 0);
}

/** Net redeemable from hub ledger (earns minus spends). Chronicles and other sources contribute positive deltas via earns. */
export function sumLedgerRedeemableNet(walletL1Norm: string): number {
  return readHubLedgerEntries(walletL1Norm).reduce((acc, e) => acc + e.redeemableDelta, 0);
}

/** Append verified earn event (positive or negative deltas allowed e.g. slot clear). Idempotent ids avoid double credit when passed same id. */
export function appendHubLedgerEarn(args: {
  walletL1: string;
  seasonId: LedgerSeasonBucket;
  source: EarnSource;
  redeemableDelta: number;
  leaderboardWeight: number;
  idempotencyKey: string;
  meta?: Record<string, unknown>;
}): HubLedgerEntry | null {
  const wallet = (args.walletL1 ?? '').trim().toLowerCase();
  if (!wallet) return null;
  const rd = Math.floor(args.redeemableDelta);
  const lb = Math.floor(args.leaderboardWeight);
  if (rd === 0 && lb === 0) return null;

  const all = readHubLedgerEntries(wallet);
  const id = `earn:${args.idempotencyKey}`;
  if (all.some((e) => e.id === id)) return null;

  const entry: HubLedgerEntry = {
    id,
    atMs: Date.now(),
    walletL1: wallet,
    seasonId: args.seasonId,
    kind: 'earn',
    source: args.source,
    redeemableDelta: rd,
    leaderboardWeight: lb,
    meta: args.meta,
  };
  const next = [entry, ...all].slice(0, 2000);
  writeHubLedgerEntries(wallet, next);
  migrateLegacyCatalogRedemptionsOnce(wallet);
  broadcastHubLedgerChanged();
  return entry;
}

export { migrateLegacyCatalogRedemptionsOnce };
/** Record catalog redemption as spend (negative redeemable; does not reduce leaderboard by default). */
export function appendHubLedgerRedeemSpend(args: {
  walletL1: string;
  seasonId: SeasonId;
  /** Positive point cost (stored as negative redeemable delta). */
  costPoints: number;
  catalogItemId: string;
  quantity: number;
}): HubLedgerEntry {
  const wallet = (args.walletL1 ?? '').trim().toLowerCase();
  const cost = Math.max(0, Math.floor(args.costPoints));
  const id = `redeem:${wallet}:${args.catalogItemId}:${args.quantity}:${Date.now()}`;
  const entry: HubLedgerEntry = {
    id,
    atMs: Date.now(),
    walletL1: wallet,
    seasonId: args.seasonId,
    kind: 'redeem_spend',
    source: 'rewards_catalog',
    redeemableDelta: -cost,
    leaderboardWeight: 0,
    meta: { catalogItemId: args.catalogItemId, quantity: args.quantity },
  };
  const all = readHubLedgerEntries(wallet);
  const next = [entry, ...all].slice(0, 2000);
  writeHubLedgerEntries(wallet, next);
  migrateLegacyCatalogRedemptionsOnce(wallet);
  broadcastHubLedgerChanged();
  return entry;
}
