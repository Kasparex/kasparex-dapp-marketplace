/**
 * Global Workers-tab NFT perks: flat rolling-cap bonus + extra stored runtime on every battery slot.
 * Classification: KREXPRIME / PIXELKREX use diamond/rarest tiers; Partner / Premium lists from config; else Standard baseline.
 */
import { getNFTTier } from '@/lib/game/diamond-bonuses';
import type { MiningSlot } from '@/lib/game/engine';
import type { ParsedNFTMetadata } from '@/lib/nft/metadata';
import { normalizePlantSetup } from './asset-usage';
import { MINECORE_PARTNER_COLLECTIONS, MINECORE_PREMIUM_COLLECTIONS } from './config';
import type { MinecoreComputeContext } from './compute-context';
import type { MinecoreState, PlantSlotState } from './types';

export type MinecoreDeckBenefits = { capBonus: number; batteryMinutes: number };

function deckMetadata(deckIndex: number, ctx?: MinecoreComputeContext): ParsedNFTMetadata | null {
  const raw = ctx?.nftMetadataByDeckIndex?.[deckIndex];
  return raw ?? null;
}

export function minecoreDeckBenefits(
  deck: Pick<MiningSlot, 'nftId' | 'collection' | 'minecorePerkTier'>,
  metadata?: ParsedNFTMetadata | null,
): MinecoreDeckBenefits {
  if (!deck.collection || deck.nftId == null) return { capBonus: 0, batteryMinutes: 0 };
  const col = deck.collection;
  const tier = deck.minecorePerkTier ?? getNFTTier(col, deck.nftId, metadata ?? null);

  if (col === 'KREXPRIME' || col === 'PIXELKREX') {
    if (tier === 'rarest') return { capBonus: 200, batteryMinutes: 40 };
    if (tier === 'diamond') return { capBonus: 150, batteryMinutes: 25 };
    return { capBonus: 100, batteryMinutes: 10 };
  }
  if (MINECORE_PARTNER_COLLECTIONS.includes(col)) {
    return tier === 'rarest'
      ? { capBonus: 80, batteryMinutes: 15 }
      : { capBonus: 50, batteryMinutes: 10 };
  }
  if (MINECORE_PREMIUM_COLLECTIONS.includes(col)) {
    return { capBonus: 100, batteryMinutes: 10 };
  }
  return { capBonus: 10, batteryMinutes: 5 };
}

export function computeMinecoreDailyCapBonusFromNfts(state: MinecoreState, ctx?: MinecoreComputeContext): number {
  const slots = state.nftSlots ?? [];
  let sum = 0;
  for (let i = 0; i < slots.length; i++) {
    const deck = slots[i];
    if (!deck?.nftId || !deck.collection) continue;
    sum += minecoreDeckBenefits(deck, deckMetadata(i, ctx)).capBonus;
  }
  return sum;
}

/**
 * Rolling-cap bonus from NFTs **assigned to this plant’s crew slots** only.
 * (Global `computeMinecoreDailyCapBonusFromNfts` is for deck-wide UI such as the Workers tab.)
 */
export function computeMinecoreDailyCapBonusForPlantCrew(
  state: MinecoreState,
  slot: PlantSlotState,
  ctx?: MinecoreComputeContext,
): number {
  const idxs = normalizePlantSetup(slot.type, slot.setup).workerNftDeckSlotIndices;
  let sum = 0;
  for (let i = 0; i < idxs.length; i++) {
    const dj = idxs[i];
    if (dj == null) continue;
    const deck = state.nftSlots?.[dj];
    if (!deck?.nftId || !deck.collection) continue;
    sum += minecoreDeckBenefits(deck, deckMetadata(dj, ctx)).capBonus;
  }
  return sum;
}

/** Extra ms added to each populated battery slot max capacity (summed crew perks). */
export function computeMinecoreBatteryBonusMsPerSlot(state: MinecoreState, ctx?: MinecoreComputeContext): number {
  const slots = state.nftSlots ?? [];
  let min = 0;
  for (let i = 0; i < slots.length; i++) {
    const deck = slots[i];
    if (!deck?.nftId || !deck.collection) continue;
    min += minecoreDeckBenefits(deck, deckMetadata(i, ctx)).batteryMinutes;
  }
  return min * 60 * 1000;
}

/** UI line for Workers tab - empty string when nothing deployed. */
export function formatMinecoreGlobalDeckBonusLine(
  slots: readonly MiningSlot[],
  ctx?: MinecoreComputeContext,
): string {
  let cap = 0;
  let min = 0;
  for (let i = 0; i < slots.length; i++) {
    const d = slots[i];
    if (!d?.nftId || !d.collection) continue;
    const b = minecoreDeckBenefits(d, deckMetadata(i, ctx));
    cap += b.capBonus;
    min += b.batteryMinutes;
  }
  if (cap === 0 && min === 0) return '';
  return `Deck +${cap} rolling cap · +${min} min per battery slot`;
}
