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

function usageFromSlot(slot: PrecisionOperativeUsageSlot, slotIndex: number): { ref: string; row: GlobalNftUsageRow } | null {
  if (!slot) return null;
  let ref = (slot.nftRef ?? '').trim();
  if (!ref && slot.collection != null && slot.tokenId != null) {
    ref = nftRefKey(String(slot.collection), Number(slot.tokenId));
  }
  if (!ref.includes('#')) return null;
  return {
    ref,
    row: {
      entityType: 'precision-click',
      entityId: 'sync-operative',
      slotIndex,
      href: '/games/precision-click',
      label: `Precision Click · Sync Operative #${slotIndex + 1}`,
    },
  };
}

/** Read all Sync Operative slots from Precision Click localStorage. */
export function readPrecisionOperativesFromStorage(payerKaspa: string | undefined): PrecisionOperativeUsageSlot[] {
  if (typeof window === 'undefined' || !payerKaspa?.trim()) return [];
  try {
    const raw = localStorage.getItem(`${PRECISION_CLICK_STORAGE_PREFIX}:${payerKaspa.trim().toLowerCase()}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as {
      operativeSlots?: PrecisionOperativeUsageSlot[];
      operative?: PrecisionOperativeUsageSlot;
    };
    if (Array.isArray(parsed.operativeSlots) && parsed.operativeSlots.length > 0) {
      return parsed.operativeSlots;
    }
    if (parsed.operative) return [parsed.operative];
    return [];
  } catch {
    return [];
  }
}

/** @deprecated Prefer readPrecisionOperativesFromStorage. */
export function readPrecisionOperativeFromStorage(payerKaspa: string | undefined): PrecisionOperativeUsageSlot {
  return readPrecisionOperativesFromStorage(payerKaspa)[0] ?? null;
}

/** Minecore + Diamond Veins + Precision Click Sync Operative (cross-game NFT lock). */
export function buildGlobalNftRefsForMinecoreWorkers(props: {
  payerKaspa: string | undefined;
  minecoreNftSlots: MiningSlot[];
  tyconSlots?: MiningSlot[] | null;
  /** Single slot (legacy) or full Sync Operative deck. */
  precisionOperative?: PrecisionOperativeUsageSlot | PrecisionOperativeUsageSlot[];
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

  const ops = Array.isArray(props.precisionOperative)
    ? props.precisionOperative
    : props.precisionOperative
      ? [props.precisionOperative]
      : [];
  ops.forEach((op, idx) => {
    const hit = usageFromSlot(op, idx);
    if (hit) push(hit.ref, hit.row);
  });

  return { usageByRef, inUseRefs };
}
