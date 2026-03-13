/**
 * Diamond Veins Game Logic: Bonuses & Yields
 * 
 * Rules:
 * 1. KREXPRIME (Workers): Provide base mining yield.
 * 2. PIXELKREX (Elite Operators): Provide massive production multipliers.
 * 3. Diamond Traits: Provide specific stat boosts based on trait type.
 */

export const BASE_YIELDS = {
  WORKER_BASE: 0.1, // Diamonds per second
  OPERATOR_MULTIPLIER_BASE: 2.0, // 2x multiplier
};

export const DIAMOND_TRAIT_BONUSES = {
  'Eon Core': { type: 'yield', value: 0.15 }, // +15% mining
  'Chrono Shard': { type: 'speed', value: 0.20 }, // +20% speed
  'Cipher Prism': { type: 'luck', value: 0.05 }, // +5% rare drop chance
  'Ecliptic Flame': { type: 'efficiency', value: 0.10 }, // efficiency boost
  'Aurora Core': { type: 'yield', value: 0.10 }, // +10% mining
} as const;

export type BonusType = 'yield' | 'speed' | 'luck' | 'efficiency';

export interface GameBonus {
  type: BonusType;
  value: number;
}

/**
 * Normalizes trait values for bonus matching
 */
export function getBonusForTrait(traitValue: string): GameBonus | null {
  const normalizedValue = traitValue.split(' - ')[0].trim();
  return DIAMOND_TRAIT_BONUSES[normalizedValue as keyof typeof DIAMOND_TRAIT_BONUSES] || null;
}
