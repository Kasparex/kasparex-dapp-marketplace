/** Precision Click: ARIA Lock - shared game constants (entry, levels, targets, shop). */

export const PRECISION_CLICK_GAME_ID = 'precision-click';
export const PRECISION_CLICK_STORAGE_PREFIX = 'kasparex:precision-click:v3';

/** List price for lock entry (KAS). */
export const PRECISION_CLICK_ENTRY_KAS = 10;

/** Min Aria fragments to refine into Hub points (1:1). */
export const PRECISION_CLICK_REFINE_MIN = 1000;

/** Base lock window after paying entry. */
export const PRECISION_CLICK_RUN_MS = 24 * 60 * 60 * 1000;

/** Base fragments awarded for a standard target click before multipliers (progress only). */
export const PRECISION_CLICK_BASE_CLICK_FRAGMENTS = 10;

export type AriaTargetKind =
  | 'aria_shard'
  | 'krex_chip'
  | 'vector_node'
  | 'tessa_mark'
  | 'null_glyph'
  | 'static_burst';

export type AriaTargetDef = {
  id: AriaTargetKind;
  label: string;
  /** Multiplier on base click fragments (negative = hazard). */
  fragmentMult: number;
  /** Relative spawn weight inside a level. */
  weight: number;
  /** Visual size class in px radius range. */
  radiusMin: number;
  radiusMax: number;
  /** Placeholder art until final PNGs land. */
  imageSrc: string;
  hazard?: boolean;
};

export const ARIA_TARGETS: AriaTargetDef[] = [
  {
    id: 'aria_shard',
    label: 'ARIA Shard',
    fragmentMult: 1,
    weight: 40,
    radiusMin: 18,
    radiusMax: 28,
    imageSrc: '/games/precision-click/targets/aria-shard.svg',
  },
  {
    id: 'krex_chip',
    label: 'Krex Chip',
    fragmentMult: 1.5,
    weight: 22,
    radiusMin: 16,
    radiusMax: 24,
    imageSrc: '/games/precision-click/targets/krex-chip.svg',
  },
  {
    id: 'vector_node',
    label: 'Vector Node',
    fragmentMult: 2,
    weight: 14,
    radiusMin: 14,
    radiusMax: 22,
    imageSrc: '/games/precision-click/targets/vector-node.svg',
  },
  {
    id: 'tessa_mark',
    label: 'Tessa Mark',
    fragmentMult: 2.5,
    weight: 8,
    radiusMin: 12,
    radiusMax: 18,
    imageSrc: '/games/precision-click/targets/tessa-mark.svg',
  },
  {
    id: 'null_glyph',
    label: 'Null Glyph',
    fragmentMult: -1.5,
    weight: 10,
    radiusMin: 16,
    radiusMax: 26,
    imageSrc: '/games/precision-click/targets/null-glyph.svg',
    hazard: true,
  },
  {
    id: 'static_burst',
    label: 'Static Burst',
    fragmentMult: -1,
    weight: 6,
    radiusMin: 18,
    radiusMax: 30,
    imageSrc: '/games/precision-click/targets/static-burst.svg',
    hazard: true,
  },
];

export type PrecisionLevelDef = {
  id: number;
  name: string;
  subtitle: string;
  /** Progress goal to clear the level (session meter only; not banked). */
  clearGoal: number;
  /** Aria fragments banked on clear (before multipliers). */
  bankReward: number;
  durationMs: number;
  spawnEveryMs: number;
  /** Chance of a second spawn on the same tick. */
  doubleSpawnChance: number;
  ttlMinMs: number;
  ttlMaxMs: number;
  /** Soft miss cap; run ends early when exceeded. */
  maxMisses: number;
  /** Multiplies progress clicks and clear payout for this level. */
  fragmentMult: number;
  /** Hazard weight scale (1 = config weights). */
  hazardScale: number;
  scenerySrc: string;
  sceneryFallback: string;
};

export const PRECISION_LEVELS: PrecisionLevelDef[] = [
  {
    id: 1,
    name: 'Signal Trace',
    subtitle: 'Warm up on calm ARIA pulses.',
    clearGoal: 120,
    bankReward: 100,
    durationMs: 35_000,
    spawnEveryMs: 700,
    doubleSpawnChance: 0.1,
    ttlMinMs: 1400,
    ttlMaxMs: 2200,
    maxMisses: 12,
    fragmentMult: 1,
    hazardScale: 0.4,
    scenerySrc: '/games/precision-click/levels/level-01.svg',
    sceneryFallback: 'from-emerald-900/40 via-zinc-900 to-zinc-950',
  },
  {
    id: 2,
    name: 'Glyph Corridor',
    subtitle: 'Narrow windows, cleaner clicks.',
    clearGoal: 180,
    bankReward: 150,
    durationMs: 34_000,
    spawnEveryMs: 650,
    doubleSpawnChance: 0.15,
    ttlMinMs: 1200,
    ttlMaxMs: 2000,
    maxMisses: 11,
    fragmentMult: 1.15,
    hazardScale: 0.6,
    scenerySrc: '/games/precision-click/levels/level-02.svg',
    sceneryFallback: 'from-teal-900/40 via-zinc-900 to-zinc-950',
  },
  {
    id: 3,
    name: 'Null Static',
    subtitle: 'Hazards start leaking into the feed.',
    clearGoal: 240,
    bankReward: 200,
    durationMs: 32_000,
    spawnEveryMs: 600,
    doubleSpawnChance: 0.2,
    ttlMinMs: 1100,
    ttlMaxMs: 1800,
    maxMisses: 10,
    fragmentMult: 1.3,
    hazardScale: 0.9,
    scenerySrc: '/games/precision-click/levels/level-03.svg',
    sceneryFallback: 'from-rose-950/50 via-zinc-900 to-zinc-950',
  },
  {
    id: 4,
    name: 'Visor Overlay',
    subtitle: 'Krex highlights keep shifting.',
    clearGoal: 320,
    bankReward: 280,
    durationMs: 32_000,
    spawnEveryMs: 560,
    doubleSpawnChance: 0.22,
    ttlMinMs: 1000,
    ttlMaxMs: 1700,
    maxMisses: 10,
    fragmentMult: 1.45,
    hazardScale: 1,
    scenerySrc: '/games/precision-click/levels/level-04.svg',
    sceneryFallback: 'from-cyan-950/50 via-zinc-900 to-zinc-950',
  },
  {
    id: 5,
    name: 'Fragment Storm',
    subtitle: 'Dense spawn. Prioritize value.',
    clearGoal: 420,
    bankReward: 360,
    durationMs: 30_000,
    spawnEveryMs: 520,
    doubleSpawnChance: 0.3,
    ttlMinMs: 900,
    ttlMaxMs: 1500,
    maxMisses: 9,
    fragmentMult: 1.6,
    hazardScale: 1.1,
    scenerySrc: '/games/precision-click/levels/level-05.svg',
    sceneryFallback: 'from-violet-950/45 via-zinc-900 to-zinc-950',
  },
  {
    id: 6,
    name: 'Vector Drift',
    subtitle: 'Calibration slips. Stay precise.',
    clearGoal: 520,
    bankReward: 450,
    durationMs: 30_000,
    spawnEveryMs: 480,
    doubleSpawnChance: 0.32,
    ttlMinMs: 850,
    ttlMaxMs: 1400,
    maxMisses: 9,
    fragmentMult: 1.8,
    hazardScale: 1.2,
    scenerySrc: '/games/precision-click/levels/level-06.svg',
    sceneryFallback: 'from-sky-950/50 via-zinc-900 to-zinc-950',
  },
  {
    id: 7,
    name: 'Stealth Window',
    subtitle: 'Tessa marks fade fast.',
    clearGoal: 640,
    bankReward: 550,
    durationMs: 28_000,
    spawnEveryMs: 450,
    doubleSpawnChance: 0.35,
    ttlMinMs: 750,
    ttlMaxMs: 1300,
    maxMisses: 8,
    fragmentMult: 2,
    hazardScale: 1.3,
    scenerySrc: '/games/precision-click/levels/level-07.svg',
    sceneryFallback: 'from-amber-950/40 via-zinc-900 to-zinc-950',
  },
  {
    id: 8,
    name: 'ARIA Pulse',
    subtitle: 'High yield, high risk.',
    clearGoal: 780,
    bankReward: 700,
    durationMs: 28_000,
    spawnEveryMs: 420,
    doubleSpawnChance: 0.38,
    ttlMinMs: 700,
    ttlMaxMs: 1200,
    maxMisses: 8,
    fragmentMult: 2.25,
    hazardScale: 1.4,
    scenerySrc: '/games/precision-click/levels/level-08.svg',
    sceneryFallback: 'from-emerald-950/55 via-zinc-900 to-zinc-950',
  },
  {
    id: 9,
    name: 'Lock Cascade',
    subtitle: 'Almost synced. No wasted motion.',
    clearGoal: 960,
    bankReward: 900,
    durationMs: 26_000,
    spawnEveryMs: 390,
    doubleSpawnChance: 0.42,
    ttlMinMs: 650,
    ttlMaxMs: 1100,
    maxMisses: 7,
    fragmentMult: 2.5,
    hazardScale: 1.5,
    scenerySrc: '/games/precision-click/levels/level-09.svg',
    sceneryFallback: 'from-fuchsia-950/45 via-zinc-900 to-zinc-950',
  },
  {
    id: 10,
    name: 'Full Sync',
    subtitle: 'Master lock. Bank the fragments.',
    clearGoal: 1200,
    bankReward: 1200,
    durationMs: 25_000,
    spawnEveryMs: 360,
    doubleSpawnChance: 0.48,
    ttlMinMs: 600,
    ttlMaxMs: 1000,
    maxMisses: 6,
    fragmentMult: 3,
    hazardScale: 1.7,
    scenerySrc: '/games/precision-click/levels/level-10.svg',
    sceneryFallback: 'from-lime-950/50 via-zinc-900 to-zinc-950',
  },
];

export type PrecisionAddonId = 'extra_time' | 'fragment_magnet' | 'second_chance';

export type PrecisionAddonDef = {
  id: PrecisionAddonId;
  label: string;
  description: string;
  listKas: number;
  /** Extra run time applied when purchased with entry. */
  extraTimeMs?: number;
  /** Multiplies fragment gains (not hazards). */
  fragmentBonusMult?: number;
  /** Extra misses allowed before early end. */
  missForgiveness?: number;
};

/** Optional add-ons selectable in the Calculation breakdown before paying entry. */
export const PRECISION_ENTRY_ADDONS: PrecisionAddonDef[] = [
  {
    id: 'extra_time',
    label: 'Focus Extension',
    description: '+5s arena time on every level this lock.',
    listKas: 2,
    extraTimeMs: 5_000,
  },
  {
    id: 'fragment_magnet',
    label: 'Fragment Magnet',
    description: '+15% clear payout and progress from positive targets.',
    listKas: 3,
    fragmentBonusMult: 1.15,
  },
  {
    id: 'second_chance',
    label: 'Second Chance',
    description: '+3 miss forgiveness before a level ends early.',
    listKas: 2,
    missForgiveness: 3,
  },
];

export type PrecisionShopItemId =
  | 'boost_overclock'
  | 'boost_deep_scan'
  | 'boost_aria_sync'
  | 'item_shard_lens'
  | 'item_null_filter'
  | 'chrono_seal_12h'
  | 'chrono_seal_24h';

export type PrecisionShopItemDef = {
  id: PrecisionShopItemId;
  title: string;
  category: 'Booster' | 'Item' | 'Chrono';
  description: string;
  listKas: number;
  imageSrc: string;
  /** Time-limited score/fragment multiplier while active. */
  boosterMult?: number;
  durationMs?: number;
  /** Extends the 24h lock window. */
  extendRunMs?: number;
  /** Permanent inventory item used in Play (consumable charges). */
  charges?: number;
  /** Effect id for runtime. */
  effect?: 'shard_lens' | 'null_filter';
};

export const PRECISION_SHOP_ITEMS: PrecisionShopItemDef[] = [
  {
    id: 'boost_overclock',
    title: 'Overclock',
    category: 'Booster',
    description: '×1.1 clear payout for 60 minutes.',
    listKas: 2,
    imageSrc: '/games/precision-click/shop/boost-overclock.svg',
    boosterMult: 1.1,
    durationMs: 60 * 60 * 1000,
  },
  {
    id: 'boost_deep_scan',
    title: 'Deep Scan',
    category: 'Booster',
    description: '×1.2 clear payout for 120 minutes.',
    listKas: 5,
    imageSrc: '/games/precision-click/shop/boost-deep-scan.svg',
    boosterMult: 1.2,
    durationMs: 2 * 60 * 60 * 1000,
  },
  {
    id: 'boost_aria_sync',
    title: 'ARIA Sync',
    category: 'Booster',
    description: '×1.3 clear payout for 180 minutes.',
    listKas: 9,
    imageSrc: '/games/precision-click/shop/boost-aria-sync.svg',
    boosterMult: 1.3,
    durationMs: 3 * 60 * 60 * 1000,
  },
  {
    id: 'chrono_seal_12h',
    title: 'Chrono Seal +12h',
    category: 'Chrono',
    description: 'Extend your active lock window by 12 hours. Does not reset cleared levels.',
    listKas: 4,
    imageSrc: '/games/precision-click/shop/boost-overclock.svg',
    extendRunMs: 12 * 60 * 60 * 1000,
  },
  {
    id: 'chrono_seal_24h',
    title: 'Chrono Seal +24h',
    category: 'Chrono',
    description: 'Extend your active lock window by 24 hours. Does not reset cleared levels.',
    listKas: 7,
    imageSrc: '/games/precision-click/shop/boost-deep-scan.svg',
    extendRunMs: 24 * 60 * 60 * 1000,
  },
  {
    id: 'item_shard_lens',
    title: 'Shard Lens',
    category: 'Item',
    description: 'Next level: +1 radius on positive targets (easier clicks). 3 charges.',
    listKas: 1.5,
    imageSrc: '/games/precision-click/shop/item-shard-lens.svg',
    charges: 3,
    effect: 'shard_lens',
  },
  {
    id: 'item_null_filter',
    title: 'Null Filter',
    category: 'Item',
    description: 'Next level: hazard progress loss halved. 2 charges.',
    listKas: 2.5,
    imageSrc: '/games/precision-click/shop/item-null-filter.svg',
    charges: 2,
    effect: 'null_filter',
  },
];

/** Perks while an NFT Sync Operative is slotted. */
export const PRECISION_OPERATIVE_PERKS = {
  standard: { extendMs: 6 * 60 * 60 * 1000, fragmentMult: 1, missForgiveness: 1, label: 'Standard' },
  partner: { extendMs: 8 * 60 * 60 * 1000, fragmentMult: 1.05, missForgiveness: 2, label: 'Partner' },
  premium: { extendMs: 12 * 60 * 60 * 1000, fragmentMult: 1.1, missForgiveness: 3, label: 'Premium' },
} as const;

export type PrecisionOperativeTier = keyof typeof PRECISION_OPERATIVE_PERKS;

/** List KAS to unlock one extra Sync Operative slot (first slot is free). */
export const PRECISION_OPERATIVE_SLOT_UNLOCK_KAS = 10;

export function bankFragmentsForClear(args: {
  bankReward: number;
  levelMult: number;
  addonFragmentMult: number;
  boosterMult: number;
  operativeMult: number;
}): number {
  return Math.max(
    1,
    Math.round(
      args.bankReward *
        args.levelMult *
        args.addonFragmentMult *
        args.boosterMult *
        args.operativeMult,
    ),
  );
}

export function getPrecisionLevel(id: number): PrecisionLevelDef | undefined {
  return PRECISION_LEVELS.find((l) => l.id === id);
}

export function getAriaTarget(id: AriaTargetKind): AriaTargetDef | undefined {
  return ARIA_TARGETS.find((t) => t.id === id);
}

export function getPrecisionShopItem(id: PrecisionShopItemId): PrecisionShopItemDef | undefined {
  return PRECISION_SHOP_ITEMS.find((i) => i.id === id);
}

/** Weighted pick of a target kind for a level. */
export function pickAriaTargetKind(hazardScale: number): AriaTargetKind {
  const scaled = ARIA_TARGETS.map((t) => ({
    id: t.id,
    weight: t.hazard ? t.weight * hazardScale : t.weight,
  }));
  const total = scaled.reduce((s, t) => s + t.weight, 0);
  let roll = Math.random() * total;
  for (const t of scaled) {
    roll -= t.weight;
    if (roll <= 0) return t.id;
  }
  return 'aria_shard';
}

export function fragmentsForClick(args: {
  kind: AriaTargetKind;
  levelMult: number;
  addonFragmentMult: number;
  boosterMult: number;
  nullFilterActive: boolean;
}): number {
  const def = getAriaTarget(args.kind);
  if (!def) return 0;
  let raw = PRECISION_CLICK_BASE_CLICK_FRAGMENTS * def.fragmentMult * args.levelMult;
  if (def.hazard) {
    if (args.nullFilterActive) raw *= 0.5;
    return Math.round(raw);
  }
  raw *= args.addonFragmentMult * args.boosterMult;
  return Math.max(1, Math.round(raw));
}
