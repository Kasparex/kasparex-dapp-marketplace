/**
 * Diamond Veins of Kaspaland – central game config
 * Shop treasury address, NFT diamond/rarest IDs, KREX fee discounts, revenue pool.
 */

/**
 * L1 recipient for Diamond Veins payments (Shop / boosts).
 * Override via `NEXT_PUBLIC_DIAMOND_VEINS_TREASURY_ADDRESS`.
 */
export const DIAMOND_VEINS_GARAGE_ADDRESS =
  process.env.NEXT_PUBLIC_DIAMOND_VEINS_TREASURY_ADDRESS?.trim()
  || 'kaspa:qr54v0692g4csc45z6phshyh2twy5dv73mylx5uqjtpphynvg70vksky9xffw';

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

/** Base Diamonds/sec by role before tier + boosts (idle NFT mining). Tuned slow for progression. */
export const IDLE_ROLE_BASE_DPS = {
  worker: 0.008,
  operator: 0.014,
  foreman: 0.02,
} as const;

/** Tier multipliers applied to idle role base DPS. */
export const IDLE_TIER_DPS_MULT = {
  regular: 1,
  diamond: 1.25,
  rarest: 1.55,
} as const;

/**
 * Full-energy mining duration base (ms) by role.
 * Diamond / Rarest / Premium collection bonuses multiply this (see IDLE_SESSION_BONUS_PCT).
 */
export const IDLE_ENERGY_BASE_MS = {
  worker: 30 * 60_000,
  operator: 60 * 60_000,
  foreman: 180 * 60_000,
} as const;

/**
 * Additive session-length bonuses on role base.
 * Diamond +15%, Rarest +25%, any KREX Premium collection (KREXPRIME / PIXELKREX) +5%.
 */
export const IDLE_SESSION_BONUS_PCT = {
  diamond: 0.15,
  rarest: 0.25,
  premiumCollection: 0.05,
} as const;

/** @deprecated Prefer IDLE_ENERGY_BASE_MS + resolveSlotEnergyMax bonuses. */
export const IDLE_ENERGY_DURATION_MS = {
  worker: {
    regular: IDLE_ENERGY_BASE_MS.worker,
    diamond: Math.floor(IDLE_ENERGY_BASE_MS.worker * (1 + IDLE_SESSION_BONUS_PCT.diamond + IDLE_SESSION_BONUS_PCT.premiumCollection)),
    rarest: Math.floor(IDLE_ENERGY_BASE_MS.worker * (1 + IDLE_SESSION_BONUS_PCT.rarest + IDLE_SESSION_BONUS_PCT.premiumCollection)),
  },
  operator: {
    regular: IDLE_ENERGY_BASE_MS.operator,
    diamond: Math.floor(IDLE_ENERGY_BASE_MS.operator * (1 + IDLE_SESSION_BONUS_PCT.diamond + IDLE_SESSION_BONUS_PCT.premiumCollection)),
    rarest: Math.floor(IDLE_ENERGY_BASE_MS.operator * (1 + IDLE_SESSION_BONUS_PCT.rarest + IDLE_SESSION_BONUS_PCT.premiumCollection)),
  },
  foreman: {
    regular: IDLE_ENERGY_BASE_MS.foreman,
    diamond: Math.floor(IDLE_ENERGY_BASE_MS.foreman * (1 + IDLE_SESSION_BONUS_PCT.diamond + IDLE_SESSION_BONUS_PCT.premiumCollection)),
    rarest: Math.floor(IDLE_ENERGY_BASE_MS.foreman * (1 + IDLE_SESSION_BONUS_PCT.rarest + IDLE_SESSION_BONUS_PCT.premiumCollection)),
  },
} as const;

/** Paid NFT slot unlock list price by role (KAS before KREX fee discount). */
export { NFT_DECK_SLOT_UNLOCK_COST_KAS as DIAMOND_VEINS_NFT_SLOT_UNLOCK_COST_KAS } from '@/lib/game/nft-deck-slots';

/** Human-readable base session length for slot purchase UI. */
export const DIAMOND_VEINS_SLOT_BASE_SESSION_LABEL = {
  worker: '30m base',
  operator: '1h base',
  foreman: '3h base',
} as const;

/** Shop consumables that restore worker energy (% of energyMax). */
export const DIAMOND_VEINS_CONSUMABLES = [
  {
    id: 'field-ration' as const,
    name: 'Field Ration',
    desc: 'Restore 25% worker energy',
    restorePct: 0.25,
    priceKrex: 50,
    priceKAS: 0.25,
  },
  {
    id: 'energy-drink' as const,
    name: 'Energy Drink',
    desc: 'Restore 50% worker energy',
    restorePct: 0.5,
    priceKrex: 120,
    priceKAS: 0.5,
  },
  {
    id: 'repair-kit' as const,
    name: 'Repair Kit',
    desc: 'Fully restore worker energy',
    restorePct: 1,
    priceKrex: 250,
    priceKAS: 1,
  },
] as const;

/** Points per refined diamond (matches Minecore Hub redeem bridge). */
export const DIAMOND_VEINS_REFINE_POINTS_PER_DIAMOND = 1;

/** @deprecated Yield no longer scales with KREX tier; kept empty for legacy imports. */
export const KREX_TIER_YIELD_BONUS_PCT: Record<string, number> = {
  Tier0: 0,
  Tier1: 0,
  Tier2: 0,
  Tier3: 0,
  Tier4: 0,
};

/**
 * KREX tier shop / fee discount (percent off total KAS price).
 * Matches Hub / vBlog `KREX_TIERS[].feeDiscountPercent` (Tier4 = 80%).
 */
export const KREX_TIER_SHOP_DISCOUNT_PCT: Record<string, number> = {
  Tier0: 0,
  Tier1: 5,
  Tier2: 10,
  Tier3: 50,
  Tier4: 80,
};

/** Share of Shop revenue that goes to Diamond Veins rewards pool (0–1). */
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
 * @deprecated Time bonus removed. Refine is always 1 diamond = 1 Hub redeem point.
 */
export const REFINE_TIME_BONUS_CAP_MINUTES = 0;

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
