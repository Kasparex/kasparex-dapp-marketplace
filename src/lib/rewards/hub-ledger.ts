'use client';

import type { LedgerSeasonBucket } from './ledger-season';
import type { EarnSource, HubLedgerEntry } from './hub-ledger-types';

export type {
  HubLedgerEntry,
  EarnSource,
  HubLedgerEntryKind,
  LedgerSeasonBucket,
} from './hub-ledger-types';

import {
  migrateLegacyCatalogRedemptionsOnce,
  readHubLedgerEntries,
  writeHubLedgerEntries,
} from './hub-ledger-storage';
import { readMinecoreRefinementPointsTotal } from '@/lib/game/minecore/read-refinement-points';
import { deductMinecoreRefinementPointsPersisted } from '@/lib/game/minecore/deduct-refinement-hub';
import {
  deductDiamondVeinsRefinementPointsPersisted,
  readDiamondVeinsRefinementPointsTotal,
} from '@/lib/game/diamond-veins-hub';
import { currentLedgerSeasonBucket } from './ledger-season';

/** Client-only: dispatch after mutating persisted hub ledger */
export function broadcastHubLedgerChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event('kasparex-hub-ledger'));
}

/** Net redeemable from hub ledger (earns minus spends). */
export function sumLedgerRedeemableNet(walletL1Norm: string): number {
  return readHubLedgerEntries(walletL1Norm).reduce((acc, e) => acc + e.redeemableDelta, 0);
}

/** Append verified earn event (positive or negative deltas allowed). Idempotent ids avoid double credit when passed same id. */
export function appendHubLedgerEarn(args: {
  walletL1: string;
  seasonId: LedgerSeasonBucket;
  source: EarnSource;
  redeemableDelta: number;
  idempotencyKey: string;
  meta?: Record<string, unknown>;
}): HubLedgerEntry | null {
  const wallet = (args.walletL1 ?? '').trim().toLowerCase();
  if (!wallet) return null;
  const rd = Math.floor(args.redeemableDelta);
  if (rd === 0) return null;

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
    leaderboardWeight: 0,
    meta: args.meta,
  };
  const next = [entry, ...all].slice(0, 2000);
  writeHubLedgerEntries(wallet, next);
  migrateLegacyCatalogRedemptionsOnce(wallet);
  broadcastHubLedgerChanged();
  return entry;
}

export { migrateLegacyCatalogRedemptionsOnce };

/**
 * Unified catalog redemption: consumes Minecore then Diamond Veins refinement points, then hub-ledger remainder
 * so gameplay + ledger totals drop by `costPoints` exactly once.
 */
export function recordUnifiedCatalogRedeem(args: {
  walletKaspaL1: string;
  seasonId?: LedgerSeasonBucket;
  costPoints: number;
  catalogItemId: string;
  quantity: number;
}): HubLedgerEntry {
  const walletLedger = (args.walletKaspaL1 ?? '').trim().toLowerCase();
  const walletGameplay = (args.walletKaspaL1 ?? '').trim();
  const cost = Math.max(0, Math.floor(args.costPoints));
  const minecoreBefore = readMinecoreRefinementPointsTotal(walletGameplay);
  const minecorePlan = Math.min(cost, minecoreBefore);
  const minecoreApplied = deductMinecoreRefinementPointsPersisted(walletGameplay, minecorePlan);
  const afterMinecore = cost - minecoreApplied;
  const dvBefore = readDiamondVeinsRefinementPointsTotal(walletGameplay);
  const dvPlan = Math.min(afterMinecore, dvBefore);
  const dvApplied = deductDiamondVeinsRefinementPointsPersisted(walletGameplay, dvPlan);
  const ledgerPortion = afterMinecore - dvApplied;
  const seasonId = args.seasonId ?? currentLedgerSeasonBucket();

  const id = `redeem:${walletLedger}:${args.catalogItemId}:${args.quantity}:${Date.now()}`;
  const entry: HubLedgerEntry = {
    id,
    atMs: Date.now(),
    walletL1: walletLedger,
    seasonId,
    kind: 'redeem_spend',
    source: 'rewards_catalog',
    redeemableDelta: -ledgerPortion,
    leaderboardWeight: 0,
    meta: {
      catalogItemId: args.catalogItemId,
      quantity: args.quantity,
      fullCostPoints: cost,
      minecoreRefinementDeducted: minecoreApplied,
      diamondVeinsRefinementDeducted: dvApplied,
      ledgerRedeemableDeducted: ledgerPortion,
    },
  };
  const all = readHubLedgerEntries(walletLedger);
  const next = [entry, ...all].slice(0, 2000);
  writeHubLedgerEntries(walletLedger, next);
  migrateLegacyCatalogRedemptionsOnce(walletLedger);
  broadcastHubLedgerChanged();
  return entry;
}

/** @deprecated Prefer {@link recordUnifiedCatalogRedeem} so Minecore refinement stays in sync. */
export function appendHubLedgerRedeemSpend(args: {
  walletL1: string;
  seasonId?: LedgerSeasonBucket;
  /** Positive point cost (stored as negative redeemable delta). */
  costPoints: number;
  catalogItemId: string;
  quantity: number;
}): HubLedgerEntry {
  const wallet = (args.walletL1 ?? '').trim().toLowerCase();
  const cost = Math.max(0, Math.floor(args.costPoints));
  const seasonId = args.seasonId ?? currentLedgerSeasonBucket();
  const id = `redeem:${wallet}:${args.catalogItemId}:${args.quantity}:${Date.now()}`;
  const entry: HubLedgerEntry = {
    id,
    atMs: Date.now(),
    walletL1: wallet,
    seasonId,
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
