import type { MiningSlotType } from '@/lib/game/engine/types';

/**
 * Shared paid NFT deck slot unlock list prices (KAS before KREX fee discount).
 * Used by Diamond Veins, Minecore Crew, and any future Add NFT Slot modals.
 */
export const NFT_DECK_SLOT_UNLOCK_COST_KAS: Record<MiningSlotType, number> = {
  worker: 10,
  operator: 15,
  foreman: 25,
};
