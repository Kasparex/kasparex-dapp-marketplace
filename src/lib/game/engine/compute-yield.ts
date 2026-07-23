import { BASE_YIELDS, getBonusForTrait, getNFTTier, type ParsedNFTMetadata } from '@/lib/game/diamond-bonuses';
import {
  IDLE_ENERGY_DURATION_MS,
  IDLE_ROLE_BASE_DPS,
  IDLE_TIER_DPS_MULT,
  KREX_TIER_YIELD_BONUS_PCT,
} from '@/lib/game/diamond-veins-config';
import type { MiningSlot, MiningSlotType, SlotYieldInfo, TyconGameState, YieldStats } from './types';
import type { NFTTier } from '@/lib/game/diamond-bonuses';

function boostMultiplier(state: TyconGameState, nowMs: number): number {
  let m = 1;
  for (const boost of state.activeBoosts) {
    if (boost.endTime <= nowMs) continue;
    if (boost.type === 'yield' || boost.type === 'efficiency') m *= 1 + boost.multiplier;
    if (boost.type === 'speed' || boost.type === 'luck') m *= 1 + boost.multiplier * 0.5;
  }
  return m;
}

export function resolveSlotEnergyMax(
  type: MiningSlotType,
  tier: NFTTier,
): number {
  const byRole = IDLE_ENERGY_DURATION_MS[type];
  return byRole[tier];
}

export function computeSlotYieldPerSecond(
  slot: MiningSlot,
  meta: ParsedNFTMetadata | null | undefined,
  krexTier: string,
  globalBoostMult: number,
): number {
  if (slot.nftId == null || !slot.collection) return 0;
  const energy = slot.energy ?? 0;
  if (energy <= 0) return 0;

  const tier = getNFTTier(slot.collection, slot.nftId, meta ?? null);
  let dps = IDLE_ROLE_BASE_DPS[slot.type] * IDLE_TIER_DPS_MULT[tier];

  meta?.traits?.forEach((trait) => {
    const bonus = getBonusForTrait(String(trait.value));
    if (bonus?.type === 'yield') dps += IDLE_ROLE_BASE_DPS.worker * bonus.value;
    if (bonus?.type === 'efficiency') dps += IDLE_ROLE_BASE_DPS.worker * (bonus.value / 2);
    if (bonus?.type === 'speed') dps *= 1 + bonus.value * 0.25;
  });

  const krexBonusPct = KREX_TIER_YIELD_BONUS_PCT[krexTier] ?? 0;
  dps *= 1 + krexBonusPct / 100;
  dps *= globalBoostMult;
  return dps;
}

/**
 * Idle mining: only slots with an assigned NFT and remaining energy produce Diamonds.
 */
export function computeYieldStats(
  state: TyconGameState,
  krexTier: string,
  slottedMetadata: Record<number, ParsedNFTMetadata>,
  nowMs: number = Date.now(),
): YieldStats {
  const globalBoost = boostMultiplier(state, nowMs);
  const slots: SlotYieldInfo[] = state.slots.map((slot, slotIndex) => {
    if (slot.nftId == null || !slot.collection) {
      return {
        slotIndex,
        yieldPerSecond: 0,
        energy: 0,
        energyMax: 0,
        status: 'empty' as const,
        remainingMs: 0,
      };
    }
    const meta = slottedMetadata[slot.nftId] ?? slottedMetadata[slotIndex];
    const energyMax = Math.max(0, slot.energyMax ?? 0);
    const energy = Math.max(0, Math.min(energyMax, slot.energy ?? 0));
    const yieldPerSecond =
      energy > 0 ? computeSlotYieldPerSecond({ ...slot, energy, energyMax }, meta, krexTier, globalBoost) : 0;
    let status: SlotYieldInfo['status'] = 'mining';
    if (energyMax <= 0 || energy <= 0) status = 'exhausted';
    return {
      slotIndex,
      yieldPerSecond,
      energy,
      energyMax,
      status,
      remainingMs: energy,
    };
  });

  const yieldPerSecond = slots.reduce((s, x) => s + x.yieldPerSecond, 0);
  return {
    yieldPerSecond,
    totalMultiplier: globalBoost,
    rawYield: yieldPerSecond,
    powerEfficiency: 1,
    powerUsedMw: 0,
    powerCapMw: state.powerCapMw,
    slots,
  };
}

/** Trait-based weights for the five diamonds + rubble (normalized). */
export function computeDiamondDropWeights(
  state: TyconGameState,
  slottedMetadata: Record<number, ParsedNFTMetadata>,
): Record<import('./types').DiamondCommodity, number> {
  const w: Record<import('./types').DiamondCommodity, number> = {
    chronoShard: 1,
    auroraCore: 1,
    cipherPrism: 1,
    eonCore: 1,
    eclipticFlame: 1,
    rubble: 0.5,
  };

  const bumpTrait = (traitValue: string, amt: number) => {
    const v = traitValue.toLowerCase();
    if (v.includes('chrono')) w.chronoShard += amt;
    else if (v.includes('aurora')) w.auroraCore += amt;
    else if (v.includes('cipher')) w.cipherPrism += amt;
    else if (v.includes('eon core')) w.eonCore += amt;
    else if (v.includes('ecliptic')) w.eclipticFlame += amt;
  };

  for (const slot of state.slots) {
    if (slot.nftId == null || !slot.collection) continue;
    const meta = slottedMetadata[slot.nftId];
    meta?.traits?.forEach((t) => bumpTrait(String(t.value), 0.4));
    const tier = getNFTTier(slot.collection, slot.nftId, meta);
    if (tier === 'diamond' || tier === 'rarest') {
      w.rubble += 0.05;
    }
  }

  const sum = Object.values(w).reduce((a, b) => a + b, 0);
  const out = { ...w };
  (Object.keys(out) as (keyof typeof out)[]).forEach((k) => {
    out[k] /= sum;
  });
  return out;
}

export function migrateSlotsToTycon(slots: MiningSlot[]): MiningSlot[] {
  const defaults: MiningSlot[] = [
    { type: 'worker', nftId: null, collection: 'KREXPRIME', energy: 0, energyMax: 0 },
    { type: 'operator', nftId: null, collection: 'PIXELKREX', energy: 0, energyMax: 0 },
    { type: 'foreman', nftId: null, collection: 'PIXELKREX', energy: 0, energyMax: 0 },
  ];
  if (!slots?.length) return defaults.map((s) => ({ ...s }));

  const lane = (t: string): 'worker' | 'operator' | 'foreman' | null => {
    if (t === 'engineer') return 'worker';
    if (t === 'booster') return null;
    if (t === 'worker' || t === 'operator' || t === 'foreman') return t;
    return null;
  };

  const mapped = slots
    .map((s) => {
      const type = lane(String(s.type));
      if (!type) return null;
      const energyMax =
        typeof s.energyMax === 'number' && s.energyMax > 0
          ? s.energyMax
          : s.nftId != null
            ? IDLE_ENERGY_DURATION_MS[type].regular
            : 0;
      const energy =
        typeof s.energy === 'number'
          ? Math.min(s.energy, energyMax)
          : s.nftId != null
            ? energyMax
            : 0;
      return {
        type,
        nftId: s.nftId ?? null,
        collection: s.collection ?? (type === 'worker' ? 'KREXPRIME' : 'PIXELKREX'),
        energy,
        energyMax,
        minecorePerkTier: s.minecorePerkTier,
      } satisfies MiningSlot;
    })
    .filter(Boolean) as MiningSlot[];

  if (mapped.length >= 3) return mapped;
  // Ensure at least the three default roles exist for older saves with fewer rows.
  const have = new Set(mapped.map((m) => m.type));
  for (const d of defaults) {
    if (!have.has(d.type)) mapped.push({ ...d });
  }
  return mapped;
}

/** @deprecated Legacy helper retained for imports; idle model uses IDLE_* constants. */
export { BASE_YIELDS };
