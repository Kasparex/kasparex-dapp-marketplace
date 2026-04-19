import { BASE_YIELDS, getBonusForTrait, getNFTTier, type ParsedNFTMetadata } from '@/lib/game/diamond-bonuses';
import {
  WORKER_TIER_MULTIPLIERS,
  OPERATOR_TIER_MULTIPLIERS,
  KREX_TIER_YIELD_BONUS_PCT,
} from '@/lib/game/diamond-veins-config';
import type { ActiveBoost, MachineTier, MiningSlot, TyconGameState, YieldStats } from './types';

function machineYieldFactor(machines: MachineTier[]): number {
  let acc = 0;
  for (const m of machines) {
    acc += m.count * m.yieldPerUnit;
  }
  // Diminishing: sqrt scaling on excess beyond first drill
  const base = 1 + Math.min(acc, 3) * 0.08;
  const extra = acc > 3 ? Math.sqrt(acc - 3) * 0.05 : 0;
  return base + extra;
}

function totalPowerUsedMw(machines: MachineTier[]): number {
  return machines.reduce((s, m) => s + m.count * m.powerPerUnit, 0);
}

export function powerEfficiency(powerCapMw: number, machines: MachineTier[]): number {
  const used = totalPowerUsedMw(machines);
  if (used <= 0) return 1;
  if (used <= powerCapMw) return 1;
  return Math.max(0.35, powerCapMw / used);
}

/**
 * Pure yield computation from game state + wallet tier + optional NFT metadata map.
 */
export function computeYieldStats(
  state: TyconGameState,
  krexTier: string,
  slottedMetadata: Record<number, ParsedNFTMetadata>,
  nowMs: number = Date.now()
): YieldStats {
  let yieldPerSecond = 0;
  let totalMultiplier = 1;

  const workerSlot = state.slots.find((s) => s.type === 'worker');
  if (workerSlot && workerSlot.nftId !== null && workerSlot.collection) {
    const baseYield = BASE_YIELDS.WORKER_BASE;
    const meta = slottedMetadata[workerSlot.nftId];
    const tier = getNFTTier(workerSlot.collection, workerSlot.nftId, meta);
    const tierMult = WORKER_TIER_MULTIPLIERS[tier];
    yieldPerSecond = baseYield * tierMult;

    meta?.traits?.forEach((trait) => {
      const bonus = getBonusForTrait(String(trait.value));
      if (bonus?.type === 'yield') yieldPerSecond += BASE_YIELDS.WORKER_BASE * bonus.value;
      if (bonus?.type === 'efficiency') yieldPerSecond += BASE_YIELDS.WORKER_BASE * (bonus.value / 2);
    });
  }

  const operatorSlot = state.slots.find((s) => s.type === 'operator');
  if (operatorSlot && operatorSlot.nftId !== null && operatorSlot.collection) {
    const meta = slottedMetadata[operatorSlot.nftId];
    const tier = getNFTTier(operatorSlot.collection, operatorSlot.nftId, meta);
    const tierMult = OPERATOR_TIER_MULTIPLIERS[tier];
    totalMultiplier *= tierMult;

    meta?.traits?.forEach((trait) => {
      const bonus = getBonusForTrait(String(trait.value));
      if (bonus?.type === 'speed') totalMultiplier += bonus.value;
    });
  }

  const krexBonusPct = KREX_TIER_YIELD_BONUS_PCT[krexTier] ?? 0;
  const krexMult = 1 + krexBonusPct / 100;
  yieldPerSecond *= krexMult;

  state.activeBoosts.forEach((boost) => {
    if (boost.endTime > nowMs) {
      if (boost.type === 'yield') yieldPerSecond *= 1 + boost.multiplier;
      if (boost.type === 'speed') totalMultiplier *= 1 + boost.multiplier;
      if (boost.type === 'efficiency') yieldPerSecond *= 1 + boost.multiplier;
      if (boost.type === 'luck') totalMultiplier *= 1 + boost.multiplier;
    }
  });

  let finalYield = yieldPerSecond * totalMultiplier;
  if (state.miningRunEndTime > nowMs) finalYield *= state.miningRunMultiplier;

  const mach = machineYieldFactor(state.machines);
  finalYield *= mach;

  const pEff = powerEfficiency(state.powerCapMw, state.machines);
  finalYield *= pEff;

  // Foreman: small yield bonus when assigned (automation is separate)
  const foreman = state.slots.find((s) => s.type === 'foreman');
  if (foreman?.nftId != null) finalYield *= 1.03;

  const engineer = state.slots.find((s) => s.type === 'engineer');
  if (engineer?.nftId != null) {
    totalMultiplier *= 1.02;
    finalYield *= 1.02;
  }

  return {
    yieldPerSecond: finalYield,
    totalMultiplier,
    rawYield: yieldPerSecond,
    powerEfficiency: pEff,
    powerUsedMw: totalPowerUsedMw(state.machines),
    powerCapMw: state.powerCapMw,
  };
}

/** Trait-based weights for the five diamonds + rubble (normalized). */
export function computeDiamondDropWeights(
  state: TyconGameState,
  slottedMetadata: Record<number, ParsedNFTMetadata>
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
    { type: 'worker', nftId: null, collection: 'KREXPRIME' },
    { type: 'operator', nftId: null, collection: 'PIXELKREX' },
    { type: 'booster', nftId: null, collection: null },
    { type: 'foreman', nftId: null, collection: 'PIXELKREX' },
    { type: 'engineer', nftId: null, collection: 'KREXPRIME' },
  ];
  if (!slots?.length) return defaults;
  if (slots.length >= 5) return slots;
  const merged = [...slots];
  while (merged.length < 5) {
    const i = merged.length;
    merged.push(defaults[i]!);
  }
  return merged;
}
