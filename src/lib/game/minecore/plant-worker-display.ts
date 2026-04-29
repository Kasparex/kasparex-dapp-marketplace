import type { MiningSlotType } from '@/lib/game/engine';
import { miningWorkerNftSlotsRequired } from './config';
import { MINECORE_NFT_CREW_ROLES_ORDER, nftDeckRoleLabel, normalizePlantSetup } from './asset-usage';
import { minecoreDeckBenefits } from './nft-deck-benefits';
import type { MinecoreComputeContext } from './compute-context';
import type { MinecoreState, PlantSlotState } from './types';

export type PlantWorkerAssignmentBadge = { key: string; text: string };

/**
 * Role counts + NFT rolling-cap badges (collection perks only).
 */
export function describePlantWorkerAssignments(
  state: MinecoreState,
  slot: PlantSlotState,
  ctx?: MinecoreComputeContext,
): { summary: string; badges: PlantWorkerAssignmentBadge[] } {
  const need = miningWorkerNftSlotsRequired(slot.type);
  const idxs = normalizePlantSetup(slot.type, slot.setup).workerNftDeckSlotIndices;
  const counts = new Map<MiningSlotType, number>();
  const badges: PlantWorkerAssignmentBadge[] = [];
  let anyForeman = false;

  for (let i = 0; i < need; i++) {
    const ix = idxs[i];
    if (ix == null) continue;
    const deck = state.nftSlots?.[ix];
    if (!deck || deck.nftId == null || !deck.collection) continue;
    counts.set(deck.type, (counts.get(deck.type) ?? 0) + 1);
    const b = minecoreDeckBenefits(deck, ctx?.nftMetadataByDeckIndex?.[ix] ?? null);
    badges.push({
      key: `${ix}-${i}`,
      text: `+${b.capBonus} D`,
    });
    if (deck.type === 'foreman') anyForeman = true;
  }
  if (anyForeman) badges.push({ key: 'foreman-auto', text: 'Auto' });

  const summary = MINECORE_NFT_CREW_ROLES_ORDER.filter((r) => (counts.get(r) ?? 0) > 0)
    .map((r) => `${nftDeckRoleLabel(r)} (${counts.get(r)})`)
    .join(', ');

  return { summary, badges };
}
