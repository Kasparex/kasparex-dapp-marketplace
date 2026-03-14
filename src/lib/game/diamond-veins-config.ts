/**
 * Diamond Veins of Kaspaland – central game config
 * Garage address, NFT diamond/rarest IDs, KREX tier bonuses, revenue pool.
 */

/** L1 KREX recipient for Garage shop (Diamond Veins). */
export const DIAMOND_VEINS_GARAGE_ADDRESS = 'kaspa:qry6yp5hugn7ln3j6q3x7czaf2pammunpsqkelk58s4gjd3n45dwsfrqtefhc';

/** KREXPRIME Diamond NFT IDs by element (from plan Section 9). */
export const KREXPRIME_DIAMOND_IDS_BY_ELEMENT = {
  chronoShard: [301, 681, 336, 370, 273, 453, 148, 15, 613, 82, 587, 114, 385],
  auroraCore: [186, 606, 498, 60, 456, 600, 78, 219, 615, 674, 216, 412, 298, 256],
  cipherPrism: [200, 94, 502, 72, 257, 358, 460, 51, 581, 482, 485, 106, 414, 585, 43],
  eonCore: [129, 364, 642, 285, 537, 714, 232, 550, 509, 205, 618, 245, 483, 542, 441, 310, 286, 297, 387],
  eclipticFlame: [315, 535, 552, 491, 39, 476, 264, 515, 671, 71, 667, 184, 505, 713, 540, 501, 209, 74, 694, 328, 477, 633],
} as const;

/** Union of all KREXPRIME diamond IDs (for tier check). */
export const KREXPRIME_DIAMOND_IDS = (() => {
  const set = new Set<number>();
  Object.values(KREXPRIME_DIAMOND_IDS_BY_ELEMENT).forEach((ids) => ids.forEach((id) => set.add(id)));
  return Array.from(set);
})();

/** Rarest NFT IDs per collection (plan: KREXPRIME 345, PIXELKREX 515). */
export const RAREST_NFT_IDS: Record<string, number[]> = {
  KREXPRIME: [345],
  PIXELKREX: [515],
};

/** PIXELKREX: trait_type is "Diamonds"; value starts with one of these. */
export const PIXELKREX_DIAMOND_VALUE_PREFIXES = [
  'Cipher Prism Diamond',
  'Ecliptic Flame Diamond',
  'Aurora Core Diamond',
  'Chrono Shard Diamond',
  'Eon Core Diamond',
] as const;

/** Worker tier multipliers (regular, diamond, rarest). */
export const WORKER_TIER_MULTIPLIERS = {
  regular: 1,
  diamond: 1.25,
  rarest: 1.5,
} as const;

/** Operator tier multipliers. */
export const OPERATOR_TIER_MULTIPLIERS = {
  regular: 2,
  diamond: 2.5,
  rarest: 3,
} as const;

/** KREX tier yield bonus (on top of NFT yield). Tier0 = 0, Tier1 = 5%, etc. */
export const KREX_TIER_YIELD_BONUS_PCT: Record<string, number> = {
  Tier0: 0,
  Tier1: 5,
  Tier2: 10,
  Tier3: 15,
  Tier4: 20,
};

/** KREX tier shop discount (percent off). */
export const KREX_TIER_SHOP_DISCOUNT_PCT: Record<string, number> = {
  Tier0: 0,
  Tier1: 0,
  Tier2: 5,
  Tier3: 7,
  Tier4: 10,
};

/** Share of Garage revenue that goes to Diamond Veins rewards pool (0–1). */
export const GARAGE_REVENUE_TO_POOL_PCT = 0.8;

/** Minimum diamonds to refine. */
export const REFINE_MIN_DIAMONDS = 100;

/** Mining run lock options: duration (ms) and yield multiplier. */
export const MINING_RUN_OPTIONS = [
  { label: '10 min', durationMs: 10 * 60 * 1000, mult: 1.1 },
  { label: '30 min', durationMs: 30 * 60 * 1000, mult: 1.2 },
  { label: '1 hour', durationMs: 60 * 60 * 1000, mult: 1.3 },
  { label: '12 hours', durationMs: 12 * 60 * 60 * 1000, mult: 1.5 },
  { label: '24 hours', durationMs: 24 * 60 * 60 * 1000, mult: 2 },
] as const;

/**
 * Refinement time bonus: points = amount * (1 + min(secondsSinceRefine/3600, 0.5)).
 * Best refinement: wait at least REFINE_TIME_BONUS_CAP_MINUTES after last refine to get
 * full 1.5x multiplier on points. Refining at 100+ is fine for frequent claims.
 */
export const REFINE_TIME_BONUS_CAP_MINUTES = 30;

/** KRC-20 transfer type (KasWare: 4 = transfer). */
export const KRC20_TRANSFER_TYPE = 4;

/** KREX ticker and decimals for L1. */
export const KREX_TICKER = 'KREX';
export const KREX_DECIMALS = 8;

/** 1 KAS = 10^8 sompi (smallest unit for native KAS sends). */
export const SOMPI_PER_KAS = 100_000_000;

/**
 * Booster slot (third slot) is reserved for future Partner collections:
 * collaborations with other KRC-20 tokens and their NFT collections.
 * When supported, slot type 'booster' may accept partner collection NFTs
 * for additional yield or perks.
 */
