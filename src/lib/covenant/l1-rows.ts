/**
 * Detect and purge local/demo covenant rows that have no real L1 funding tx.
 */

import { COVENANT_LAB_CONFIG } from './config';
import type { CrowdfundCampaign } from './crowdfund-types';
import type { MilestoneDeal } from './milestone-types';
import type { SplitPayment } from './split-types';
import type { VoucherLock } from './voucher-types';
import { loadMap, saveMap } from './utils';

export function isRealL1TxHash(tx?: string | null): boolean {
  return Boolean(tx && /^[a-f0-9]{64}$/i.test(tx.trim()));
}

function isOnChainCovenantId(covenantId?: string | null): boolean {
  return Boolean(covenantId && /^[a-f0-9]{64}$/i.test(covenantId.trim()));
}

/** True when the row is a local demo / legacy record without a real funding tx. */
export function isDemoOrLocalCovenantRow(args: {
  origin?: 'l1' | 'simulator';
  covenantId?: string;
  /** Any funding / lock / pledge tx hashes associated with this row. */
  fundingTxHashes?: Array<string | null | undefined>;
}): boolean {
  if (args.origin === 'simulator') return true;

  const cid = (args.covenantId ?? '').trim();
  if (cid.startsWith('cov_')) return true;

  const hashes = (args.fundingTxHashes ?? []).map((h) => (h ?? '').trim()).filter(Boolean);
  if (hashes.some((h) => h.startsWith('sim_'))) return true;

  if (hashes.some(isRealL1TxHash)) return false;
  if (isOnChainCovenantId(cid)) return false;

  // Explicit L1 origin with no funding tx yet (e.g. crowdfund campaign before first pledge).
  if (args.origin === 'l1' && hashes.length === 0) return false;

  // No real fingerprint → treat as demo/local.
  return true;
}

export function isRealL1Split(split: SplitPayment): boolean {
  return !isDemoOrLocalCovenantRow({
    origin: split.origin,
    covenantId: split.covenantId,
    fundingTxHashes: [
      split.lockTxHash,
      ...split.recipients.map((r) => r.lockTxHash ?? r.utxo?.txId),
    ],
  });
}

export function isRealL1Milestone(deal: MilestoneDeal): boolean {
  return !isDemoOrLocalCovenantRow({
    origin: deal.origin,
    covenantId: deal.covenantId,
    fundingTxHashes: [
      deal.lockTxHash,
      ...deal.milestones.map((m) => m.lockTxHash ?? m.utxo?.txId),
    ],
  });
}

export function isRealL1Crowdfund(campaign: CrowdfundCampaign): boolean {
  return !isDemoOrLocalCovenantRow({
    origin: campaign.origin,
    covenantId: campaign.covenantId,
    fundingTxHashes: campaign.pledges.map((p) => p.txHash ?? p.utxo?.txId),
  });
}

export function isRealL1Voucher(voucher: VoucherLock): boolean {
  return !isDemoOrLocalCovenantRow({
    origin: voucher.origin,
    covenantId: voucher.covenantId,
    fundingTxHashes: [voucher.lockTxHash, voucher.utxo?.txId],
  });
}

function purgeMap<T>(
  storageKey: string,
  keep: (row: T) => boolean,
): void {
  if (typeof window === 'undefined') return;
  try {
    const map = loadMap<T>(storageKey);
    let dirty = false;
    for (const [id, row] of Array.from(map.entries())) {
      if (!keep(row)) {
        map.delete(id);
        dirty = true;
      }
    }
    if (dirty) saveMap(storageKey, map);
  } catch {
    /* ignore */
  }
}

/** Drop demo/local rows from all covenant template stores (except LockBox L1 helpers). */
export function purgeDemoCovenantLabRows(): void {
  purgeMap(COVENANT_LAB_CONFIG.splitStorageKey, isRealL1Split);
  purgeMap(COVENANT_LAB_CONFIG.milestoneStorageKey, isRealL1Milestone);
  purgeMap(COVENANT_LAB_CONFIG.crowdfundStorageKey, isRealL1Crowdfund);
  purgeMap(COVENANT_LAB_CONFIG.voucherStorageKey, isRealL1Voucher);
}
