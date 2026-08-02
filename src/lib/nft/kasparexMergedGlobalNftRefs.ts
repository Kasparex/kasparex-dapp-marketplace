import type { MiningSlot } from '@/lib/game/engine';
import { PRECISION_CLICK_STORAGE_PREFIX } from '@/lib/game/precision-click/config';

export type GlobalNftUsageRow = {
  entityType: string;
  entityId: string;
  slotIndex: number;
  href: string;
  label: string;
};

export type PrecisionOperativeUsageSlot = {
  nftRef?: string | null;
  collection?: string | null;
  tokenId?: number | null;
} | null;

export function nftRefKey(collection: string, tokenId: number): string {
  return `${collection}#${tokenId}`;
}

export function readPrecisionOperativeFromStorage(payerKaspa: string | undefined): PrecisionOperativeUsageSlot {
  if (typeof window === 'undefined' || !payerKaspa?.trim()) return null;
  try {
    const raw = localStorage.getItem(`${PRECISION_CLICK_STORAGE_PREFIX}:${payerKaspa.trim().toLowerCase()}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { operative?: PrecisionOperativeUsageSlot };
    return parsed.operative ?? null;
  } catch {
    return null;
  }
}

/** Minecore + Diamond Veins + Precision Click Sync Operative (cross-game NFT lock). */
export function buildGlobalNftRefsForMinecoreWorkers(props: {
  payerKaspa: string | undefined;
  minecoreNftSlots: MiningSlot[];
  tyconSlots?: MiningSlot[] | null;
  precisionOperative?: PrecisionOperativeUsageSlot;
}): {
  usageByRef: Record<string, GlobalNftUsageRow[]>;
  inUseRefs: Set<string>;
} {
  const usageByRef: Record<string, GlobalNftUsageRow[]> = {};
  const inUseRefs = new Set<string>();

  const push = (ref: string, row: GlobalNftUsageRow) => {
    usageByRef[ref] = [...(usageByRef[ref] ?? []), row];
    inUseRefs.add(ref);
  };

  props.minecoreNftSlots.forEach((s, idx) => {
    if (s.nftId == null || !s.collection) return;
    push(nftRefKey(s.collection, s.nftId), {
      entityType: 'minecore',
      entityId: 'workers',
      slotIndex: idx,
      href: '/games/minecore?tab=workers',
      label: `Minecore (${s.type}) #${idx + 1}`,
    });
  });

  const tycon = props.tyconSlots;
  if (tycon?.length) {
    tycon.forEach((s, idx) => {
      if (s.nftId == null || !s.collection) return;
      push(nftRefKey(s.collection, s.nftId), {
        entityType: 'tycon',
        entityId: 'mining',
        slotIndex: idx,
        href: '/games/diamond-mining',
        label: `Diamond Mining (${s.type}) #${idx + 1}`,
      });
    });
  }

  const op = props.precisionOperative;
  if (op) {
    let ref = (op.nftRef ?? '').trim();
    if (!ref && op.collection != null && op.tokenId != null) {
      ref = nftRefKey(String(op.collection), Number(op.tokenId));
    }
    if (ref.includes('#')) {
      push(ref, {
        entityType: 'precision-click',
        entityId: 'sync-operative',
        slotIndex: 0,
        href: '/games/precision-click',
        label: 'Precision Click · Sync Operative',
      });
    }
  }

  return { usageByRef, inUseRefs };
}
