import { BASE_YIELDS, getBonusForTrait, getNFTTier, type ParsedNFTMetadata } from '@/lib/game/diamond-bonuses';
import {
  IDLE_ENERGY_BASE_MS,
  IDLE_ROLE_BASE_DPS,
  IDLE_SESSION_BONUS_PCT,
  IDLE_TIER_DPS_MULT,
} from '@/lib/game/diamond-veins-config';
import type { ActiveBoost, MiningSlot, MiningSlotType, SlotYieldInfo, TyconGameState, YieldStats } from './types';
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

/** KREXPRIME / PIXELKREX count as Premium collections for session bonus. */
export function isDiamondVeinsPremiumCollection(collection: string | null | undefined): boolean {
  const c = (collection ?? '').trim().toUpperCase();
  return c === 'KREXPRIME' || c === 'PIXELKREX';
}

export type SlotEnergyResolveOpts = {
  collection?: string | null;
  activeBoosts?: ActiveBoost[];
  nowMs?: number;
};

export type SlotSessionBonusBreakdown = {
  baseMs: number;
  energyMax: number;
  nftBonusPct: number;
  shopMult: number;
  diamondPct: number;
  rarestPct: number;
  premiumPct: number;
};

/** Resolve full session length including NFT tier / Premium / active Shop boosts. */
export function resolveSlotEnergyMax(
  type: MiningSlotType,
  tier: NFTTier,
  opts?: SlotEnergyResolveOpts,
): number {
  return resolveSlotSessionBreakdown(type, tier, opts).energyMax;
}

export function resolveSlotSessionBreakdown(
  type: MiningSlotType,
  tier: NFTTier,
  opts?: SlotEnergyResolveOpts,
): SlotSessionBonusBreakdown {
  const baseMs = IDLE_ENERGY_BASE_MS[type];
  let diamondPct = 0;
  let rarestPct = 0;
  let premiumPct = 0;
  if (tier === 'diamond') diamondPct = IDLE_SESSION_BONUS_PCT.diamond;
  if (tier === 'rarest') rarestPct = IDLE_SESSION_BONUS_PCT.rarest;
  if (isDiamondVeinsPremiumCollection(opts?.collection)) {
    premiumPct = IDLE_SESSION_BONUS_PCT.premiumCollection;
  }
  const nftBonusPct = diamondPct + rarestPct + premiumPct;
  let shopMult = 1;
  const now = opts?.nowMs ?? Date.now();
  for (const boost of opts?.activeBoosts ?? []) {
    if (boost.endTime <= now) continue;
    if (boost.type === 'yield' || boost.type === 'efficiency') shopMult *= 1 + boost.multiplier;
    if (boost.type === 'speed') shopMult *= 1 + boost.multiplier * 0.5;
  }
  const energyMax = Math.max(1, Math.floor(baseMs * (1 + nftBonusPct) * shopMult));
  return { baseMs, energyMax, nftBonusPct, shopMult, diamondPct, rarestPct, premiumPct };
}

/** Keep persisted energyMax in sync with live NFT + Shop session bonuses. */
export function syncDiamondVeinsEnergyCaps(
  state: TyconGameState,
  slottedMetadata: Record<number, ParsedNFTMetadata>,
  nowMs: number = Date.now(),
): TyconGameState {
  let changed = false;
  const slots = state.slots.map((slot) => {
    if (slot.nftId == null || !slot.collection) return slot;
    const meta = slottedMetadata[slot.nftId] ?? null;
    const tier = getNFTTier(slot.collection, slot.nftId, meta);
    const energyMax = resolveSlotEnergyMax(slot.type, tier, {
      collection: slot.collection,
      activeBoosts: state.activeBoosts,
      nowMs,
    });
    const prevMax = Math.max(0, slot.energyMax ?? 0);
    const prevEnergy = Math.max(0, slot.energy ?? 0);
    /** When session max grows (Shop / NFT bonuses), scale remaining energy so Energy left extends with it. */
    let energy = prevEnergy;
    if (prevMax > 0 && energyMax > prevMax && prevEnergy > 0) {
      energy = Math.floor(prevEnergy * (energyMax / prevMax));
    }
    energy = Math.min(energy, energyMax);
    if (energyMax === prevMax && energy === prevEnergy) return slot;
    changed = true;
    return { ...slot, energyMax, energy };
  });
  if (!changed) return state;
  return { ...state, slots, version: state.version + 1 };
}

export function computeSlotYieldPerSecond(
  slot: MiningSlot,
  meta: ParsedNFTMetadata | null | undefined,
  _krexTier: string,
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
  const synced = syncDiamondVeinsEnergyCaps(state, slottedMetadata, nowMs);
  const globalBoost = boostMultiplier(synced, nowMs);
  const slots: SlotYieldInfo[] = synced.slots.map((slot, slotIndex) => {
    if (slot.nftId == null || !slot.collection) {
      return {
        slotIndex,
        yieldPerSecond: 0,
        energy: 0,
        energyMax: resolveSlotEnergyMax(slot.type, 'regular', {
          collection: null,
          activeBoosts: synced.activeBoosts,
          nowMs,
        }),
        status: 'empty' as const,
        remainingMs: 0,
      };
    }
    const meta = slottedMetadata[slot.nftId] ?? slottedMetadata[slotIndex];
    const tier = getNFTTier(slot.collection, slot.nftId, meta ?? null);
    const energyMax = resolveSlotEnergyMax(slot.type, tier, {
      collection: slot.collection,
      activeBoosts: synced.activeBoosts,
      nowMs,
    });
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
    powerCapMw: synced.powerCapMw,
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
  const freeDefault: MiningSlot = {
    type: 'worker',
    nftId: null,
    collection: 'KREXPRIME',
    energy: 0,
    energyMax: 0,
  };
  if (!slots?.length) return [{ ...freeDefault }];

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
            ? IDLE_ENERGY_BASE_MS[type]
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

  return mapped.length > 0 ? mapped : [{ ...freeDefault }];
}

/** @deprecated Legacy helper retained for imports; idle model uses IDLE_* constants. */
export { BASE_YIELDS };
