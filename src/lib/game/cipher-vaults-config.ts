/** Krex's Cipher Vaults: covenant chambers, levels, shop, wardens, refine. */

export const CIPHER_VAULTS_GAME_ID = 'cipher-vaults';
export const CIPHER_VAULTS_STORAGE_PREFIX = 'kasparex:cipher-vaults:v3';

/** L1 KAS recipient for Cipher Vault fees. Override via `NEXT_PUBLIC_CIPHER_VAULTS_TREASURY_ADDRESS`. */
export const CIPHER_VAULTS_TREASURY_ADDRESS =
  process.env.NEXT_PUBLIC_CIPHER_VAULTS_TREASURY_ADDRESS?.trim()
  || process.env.NEXT_PUBLIC_GAME_TREASURY_ADDRESS?.trim()
  || 'kaspa:qr54v0692g4csc45z6phshyh2twy5dv73mylx5uqjtpphynvg70vksky9xffw';

export const KASPA_REWARDS_ADDRESS =
  process.env.NEXT_PUBLIC_REWARDS_ADDRESS?.trim()
  || 'kaspa:qzsjrd50vw36g4aj7ufj2d9a4fhewehaegxm7xmlt7jntlx6dpv2q77jl6fkn';

export const CIPHER_REFINE_MIN = 1000;
export const CIPHER_WARDEN_SLOT_UNLOCK_KAS = 10;
/** Paid covenant window (extendable via Chrono / Wardens). */
export const CIPHER_COVENANT_WINDOW_MS = 4 * 60 * 60 * 1000;

/** Seal points awarded per newly correct cell after a swap (session only). */
export const CIPHER_SEAL_POINTS_PER_CORRECT = 2;

// ---------------------------------------------------------------------------
// Vault entry classes (pay once → play levels until covenant expires)
// ---------------------------------------------------------------------------

export type CipherVaultTierId = 'seal' | 'rune' | 'null' | 'aria' | 'master';

export type CipherVaultTierDef = {
  id: CipherVaultTierId;
  label: string;
  subtitle: string;
  entryKAS: number;
  /** Highest level id unlocked on this track (inclusive). */
  maxLevel: number;
  /** Multiplies Cipher Fragments banked on level clear. */
  fragmentMult: number;
};

export const CIPHER_VAULT_TIERS: readonly CipherVaultTierDef[] = [
  {
    id: 'seal',
    label: 'Seal Fragment',
    subtitle: 'Levels 1–3. Soft opener covenant.',
    entryKAS: 10,
    maxLevel: 3,
    fragmentMult: 1,
  },
  {
    id: 'rune',
    label: 'Rune Chamber',
    subtitle: 'Levels 1–4. Deeper scramble track.',
    entryKAS: 18,
    maxLevel: 4,
    fragmentMult: 1.1,
  },
  {
    id: 'null',
    label: 'Null Lockbox',
    subtitle: 'Levels 1–5. Fog seals begin.',
    entryKAS: 28,
    maxLevel: 5,
    fragmentMult: 1.2,
  },
  {
    id: 'aria',
    label: 'ARIA Reliquary',
    subtitle: 'Levels 1–6. High fragment payout.',
    entryKAS: 45,
    maxLevel: 6,
    fragmentMult: 1.35,
  },
  {
    id: 'master',
    label: 'Master Covenant',
    subtitle: 'Full ladder levels 1–8.',
    entryKAS: 80,
    maxLevel: 8,
    fragmentMult: 1.5,
  },
] as const;

export function getCipherVaultTier(id: CipherVaultTierId): CipherVaultTierDef | undefined {
  return CIPHER_VAULT_TIERS.find((t) => t.id === id);
}

export function isCipherVaultTierId(x: string): x is CipherVaultTierId {
  return CIPHER_VAULT_TIERS.some((t) => t.id === x);
}

export const CIPHER_VAULT_PASS_TIER: CipherVaultTierId = 'seal';

// ---------------------------------------------------------------------------
// Levels (growing grids + fog)
// ---------------------------------------------------------------------------

export type CipherLevelDef = {
  id: number;
  name: string;
  subtitle: string;
  size: number;
  moveLimit: number;
  timeLimitMs: number;
  /** Cipher Fragments banked on clear (before multipliers). */
  bankReward: number;
  scrambleDepth: number;
  /** How many Vault Seal cells are hidden (fog). */
  fogCount: number;
};

export const CIPHER_LEVELS: readonly CipherLevelDef[] = [
  {
    id: 1,
    name: 'Glyph Gate',
    subtitle: '3×3 warm-up. Learn the swaps.',
    size: 3,
    moveLimit: 16,
    timeLimitMs: 5 * 60 * 1000,
    bankReward: 80,
    scrambleDepth: 0,
    fogCount: 0,
  },
  {
    id: 2,
    name: 'Seal Corridor',
    subtitle: 'Classic 4×4 vault key.',
    size: 4,
    moveLimit: 24,
    timeLimitMs: 6 * 60 * 1000,
    bankReward: 140,
    scrambleDepth: 0,
    fogCount: 0,
  },
  {
    id: 3,
    name: 'Fog Rune',
    subtitle: '4×4 with a veiled seal.',
    size: 4,
    moveLimit: 22,
    timeLimitMs: 5 * 60 * 1000,
    bankReward: 200,
    scrambleDepth: 1,
    fogCount: 4,
  },
  {
    id: 4,
    name: 'Null Lattice',
    subtitle: '5×5 lattice. More cells, tighter budget.',
    size: 5,
    moveLimit: 32,
    timeLimitMs: 6 * 60 * 1000,
    bankReward: 320,
    scrambleDepth: 1,
    fogCount: 0,
  },
  {
    id: 5,
    name: 'Blind Chamber',
    subtitle: '5×5 with heavy fog on the seal.',
    size: 5,
    moveLimit: 30,
    timeLimitMs: 5 * 60 * 1000,
    bankReward: 450,
    scrambleDepth: 2,
    fogCount: 8,
  },
  {
    id: 6,
    name: 'ARIA Weave',
    subtitle: '5×5 memory weave. Sparse seal reveal.',
    size: 5,
    moveLimit: 28,
    timeLimitMs: 4 * 60 * 1000 + 30_000,
    bankReward: 600,
    scrambleDepth: 2,
    fogCount: 12,
  },
  {
    id: 7,
    name: 'Deep Covenant',
    subtitle: '6×6 deep chamber.',
    size: 6,
    moveLimit: 42,
    timeLimitMs: 7 * 60 * 1000,
    bankReward: 850,
    scrambleDepth: 3,
    fogCount: 6,
  },
  {
    id: 8,
    name: 'Master Seal',
    subtitle: '6×6 master fog. Elite clears only.',
    size: 6,
    moveLimit: 38,
    timeLimitMs: 5 * 60 * 1000,
    bankReward: 1200,
    scrambleDepth: 4,
    fogCount: 14,
  },
];

export function getCipherLevel(id: number): CipherLevelDef | undefined {
  return CIPHER_LEVELS.find((l) => l.id === id);
}

// ---------------------------------------------------------------------------
// Entry add-ons
// ---------------------------------------------------------------------------

export type CipherAddonId = 'extra_moves' | 'chrono_buffer' | 'fragment_amp' | 'second_seal';

export type CipherAddonDef = {
  id: CipherAddonId;
  label: string;
  description: string;
  listKas: number;
  extraMoves?: number;
  extraTimeMs?: number;
  fragmentBonusMult?: number;
  retryCharge?: number;
};

export const CIPHER_ENTRY_ADDONS: CipherAddonDef[] = [
  {
    id: 'extra_moves',
    label: 'Extra Swaps',
    description: '+4 swaps on every level this covenant.',
    listKas: 3,
    extraMoves: 4,
  },
  {
    id: 'chrono_buffer',
    label: 'Chrono Buffer',
    description: '+3 minutes on every level timer this covenant.',
    listKas: 4,
    extraTimeMs: 3 * 60 * 1000,
  },
  {
    id: 'fragment_amp',
    label: 'Fragment Amplifier',
    description: '+20% Cipher Fragments banked on each clear.',
    listKas: 5,
    fragmentBonusMult: 1.2,
  },
  {
    id: 'second_seal',
    label: 'Second Seal',
    description: 'One free level retry if you burn moves or time.',
    listKas: 6,
    retryCharge: 1,
  },
];

export function getCipherAddon(id: CipherAddonId): CipherAddonDef | undefined {
  return CIPHER_ENTRY_ADDONS.find((a) => a.id === id);
}

export function addonListKas(ids: CipherAddonId[]): number {
  return ids.reduce((sum, id) => sum + (getCipherAddon(id)?.listKas ?? 0), 0);
}

export function bundleAddons(ids: CipherAddonId[]) {
  let extraMoves = 0;
  let extraTimeMs = 0;
  let fragmentBonusMult = 1;
  let retryCharge = 0;
  for (const id of ids) {
    const def = getCipherAddon(id);
    if (!def) continue;
    extraMoves += def.extraMoves ?? 0;
    extraTimeMs += def.extraTimeMs ?? 0;
    if (def.fragmentBonusMult) fragmentBonusMult *= def.fragmentBonusMult;
    retryCharge += def.retryCharge ?? 0;
  }
  return { extraMoves, extraTimeMs, fragmentBonusMult, retryCharge };
}

// ---------------------------------------------------------------------------
// Shop
// ---------------------------------------------------------------------------

export type CipherShopItemId =
  | 'boost_overclock'
  | 'boost_deep_scan'
  | 'boost_cipher_sync'
  | 'item_rune_hint'
  | 'item_vault_pass'
  | 'chrono_seal_2h'
  | 'chrono_seal_6h';

export type CipherShopItemDef = {
  id: CipherShopItemId;
  title: string;
  category: 'Booster' | 'Item' | 'Chrono';
  description: string;
  listKas: number;
  imageSrc: string;
  boosterMult?: number;
  durationMs?: number;
  extendCovenantMs?: number;
  charges?: number;
  effect?: 'rune_hint' | 'vault_pass';
};

export const CIPHER_SHOP_ITEMS: CipherShopItemDef[] = [
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
    id: 'boost_cipher_sync',
    title: 'Cipher Sync',
    category: 'Booster',
    description: '×1.3 clear payout for 180 minutes.',
    listKas: 9,
    imageSrc: '/games/precision-click/shop/boost-aria-sync.svg',
    boosterMult: 1.3,
    durationMs: 3 * 60 * 60 * 1000,
  },
  {
    id: 'item_rune_hint',
    title: 'Rune Hint',
    category: 'Item',
    description: 'Reveal one incorrect tile on your grid (3 charges).',
    listKas: 2,
    imageSrc: '/games/precision-click/shop/item-shard-lens.svg',
    charges: 3,
    effect: 'rune_hint',
  },
  {
    id: 'item_vault_pass',
    title: 'Vault Pass',
    category: 'Item',
    description: 'Open one Seal Fragment covenant without paying entry KAS.',
    listKas: 8,
    imageSrc: '/games/precision-click/shop/item-null-filter.svg',
    charges: 1,
    effect: 'vault_pass',
  },
  {
    id: 'chrono_seal_2h',
    title: 'Chrono Seal +2h',
    category: 'Chrono',
    description: 'Extend your open covenant window by 2 hours. Cleared levels stay locked.',
    listKas: 4,
    imageSrc: '/games/precision-click/shop/boost-overclock.svg',
    extendCovenantMs: 2 * 60 * 60 * 1000,
  },
  {
    id: 'chrono_seal_6h',
    title: 'Chrono Seal +6h',
    category: 'Chrono',
    description: 'Extend your open covenant window by 6 hours. Cleared levels stay locked.',
    listKas: 9,
    imageSrc: '/games/precision-click/shop/boost-deep-scan.svg',
    extendCovenantMs: 6 * 60 * 60 * 1000,
  },
];

export function getCipherShopItem(id: CipherShopItemId): CipherShopItemDef | undefined {
  return CIPHER_SHOP_ITEMS.find((i) => i.id === id);
}

// ---------------------------------------------------------------------------
// Cipher Warden NFT perks
// ---------------------------------------------------------------------------

export const CIPHER_WARDEN_PERKS = {
  standard: {
    extraMoves: 5,
    extraTimeMs: 1 * 60 * 1000,
    fragmentMult: 1,
    covenantExtendMs: 30 * 60 * 1000,
    label: 'Standard',
  },
  partner: {
    extraMoves: 15,
    extraTimeMs: 3 * 60 * 1000,
    fragmentMult: 1.05,
    covenantExtendMs: 60 * 60 * 1000,
    label: 'Partner',
  },
  premium: {
    extraMoves: 25,
    extraTimeMs: 5 * 60 * 1000,
    fragmentMult: 1.1,
    covenantExtendMs: 2 * 60 * 60 * 1000,
    label: 'Premium',
  },
  diamond: {
    extraMoves: 30,
    extraTimeMs: 6 * 60 * 1000,
    fragmentMult: 1.12,
    covenantExtendMs: 3 * 60 * 60 * 1000,
    label: 'Diamond',
  },
  rarest: {
    extraMoves: 35,
    extraTimeMs: 7 * 60 * 1000,
    fragmentMult: 1.15,
    covenantExtendMs: 4 * 60 * 60 * 1000,
    label: 'Rarest',
  },
} as const;

export type CipherWardenTier = keyof typeof CIPHER_WARDEN_PERKS;

export function resolveCipherWardenTier(
  collection: string,
  tokenId: number,
  classify: (input: { collection: string; tokenId: number }) => 'diamond' | 'rare' | 'standard',
): CipherWardenTier {
  const c = collection.trim().toUpperCase();
  const rarity = classify({ collection: c, tokenId });
  if (c === 'KREXPRIME' || c === 'PIXELKREX') {
    if (rarity === 'diamond') return 'diamond';
    if (rarity === 'rare') return 'rarest';
    return 'standard';
  }
  return 'partner';
}

export function bankFragmentsForClear(args: {
  bankReward: number;
  vaultMult: number;
  addonFragmentMult: number;
  boosterMult: number;
  wardenMult: number;
}): number {
  return Math.max(
    1,
    Math.round(
      args.bankReward * args.vaultMult * args.addonFragmentMult * args.boosterMult * args.wardenMult,
    ),
  );
}

/** @deprecated Legacy DV bridge. */
export const CIPHER_TICKET_REDEEM_RATE_POINTS = 100;

/** Rune palette accents for special glyphs (not white borders). */
export function cipherRuneAccentClass(n: number): string {
  const i = n % 6;
  if (i === 0) return 'text-emerald-600 dark:text-emerald-400';
  if (i === 1) return 'text-sky-600 dark:text-sky-400';
  if (i === 2) return 'text-amber-600 dark:text-amber-400';
  if (i === 3) return 'text-violet-600 dark:text-violet-400';
  if (i === 4) return 'text-rose-600 dark:text-rose-400';
  return 'text-teal-600 dark:text-teal-400';
}
