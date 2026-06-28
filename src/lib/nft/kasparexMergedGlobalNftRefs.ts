import type { MiningSlot } from '@/lib/game/engine';

export type GlobalNftUsageRow = {
  entityType: string;
  entityId: string;
  slotIndex: number;
  href: string;
  label: string;
};

export function nftRefKey(collection: string, tokenId: number): string {
  return `${collection}#${tokenId}`;
}

/** Minecore worker-deck NFTs and optional Tycon mining slots. */
export function buildGlobalNftRefsForMinecoreWorkers(props: {
  payerKaspa: string | undefined;
  minecoreNftSlots: MiningSlot[];
  tyconSlots?: MiningSlot[] | null;
}): {
  usageByRef: Record<string, GlobalNftUsageRow[]>;
  inUseRefs: Set<string>;
} {
  const usageByRef: Record<string, GlobalNftUsageRow[]> = {};
  const inUseRefs = new Set<string>();

  props.minecoreNftSlots.forEach((s, idx) => {
    if (s.nftId == null || !s.collection) return;
    const ref = nftRefKey(s.collection, s.nftId);
    const row: GlobalNftUsageRow = {
      entityType: 'minecore',
      entityId: 'workers',
      slotIndex: idx,
      href: '/games/minecore?tab=workers',
      label: `Minecore (${s.type}) #${idx + 1}`,
    };
    usageByRef[ref] = [...(usageByRef[ref] ?? []), row];
    inUseRefs.add(ref);
  });

  const tycon = props.tyconSlots;
  if (tycon?.length) {
    tycon.forEach((s, idx) => {
      if (s.nftId == null || !s.collection) return;
      const ref = nftRefKey(s.collection, s.nftId);
      const row: GlobalNftUsageRow = {
        entityType: 'tycon',
        entityId: 'mining',
        slotIndex: idx,
        href: '/games/diamond-mining',
        label: `Diamond Mining (${s.type}) #${idx + 1}`,
      };
      usageByRef[ref] = [...(usageByRef[ref] ?? []), row];
      inUseRefs.add(ref);
    });
  }

  return { usageByRef, inUseRefs };
}
