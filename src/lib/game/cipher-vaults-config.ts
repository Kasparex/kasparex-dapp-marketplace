/** Krex's Cipher Vaults: covenant chambers, entry, shop, wardens, refine. */

export const CIPHER_VAULTS_GAME_ID = 'cipher-vaults';
export const CIPHER_VAULTS_STORAGE_PREFIX = 'kasparex:cipher-vaults:v2';

/** L1 KAS recipient for Cipher Vault fees. Override via `NEXT_PUBLIC_CIPHER_VAULTS_TREASURY_ADDRESS`. */
export const CIPHER_VAULTS_TREASURY_ADDRESS =
  process.env.NEXT_PUBLIC_CIPHER_VAULTS_TREASURY_ADDRESS?.trim()
  || process.env.NEXT_PUBLIC_GAME_TREASURY_ADDRESS?.trim()
  || 'kaspa:qr54v0692g4csc45z6phshyh2twy5dv73mylx5uqjtpphynvg70vksky9xffw';

/** Rewards wallet (future on-chain distributions). Override via `NEXT_PUBLIC_REWARDS_ADDRESS`. */
export const KASPA_REWARDS_ADDRESS =
  process.env.NEXT_PUBLIC_REWARDS_ADDRESS?.trim()
  || 'kaspa:qzsjrd50vw36g4aj7ufj2d9a4fhewehaegxm7xmlt7jntlx6dpv2q77jl6fkn';

/** Minimum Cipher Fragments to refine into Hub points (1:1). */
export const CIPHER_REFINE_MIN = 500;

/** List KAS to unlock one extra Cipher Warden slot (first slot is free). */
export const CIPHER_WARDEN_SLOT_UNLOCK_KAS = 10;

/** How long a paid covenant window stays open after entry (extendable via Chrono / Wardens). */
export const CIPHER_COVENANT_WINDOW_MS = 4 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Vault covenant tiers (min entry 10 KAS)
// ---------------------------------------------------------------------------

export type CipherVaultTierId = 'seal' | 'rune' | 'null' | 'aria' | 'master';

export type CipherVaultTierDef = {
  id: CipherVaultTierId;
  label: string;
  subtitle: string;
  /** List entry price in KAS. */
  entryKAS: number;
  /** Max swaps before the seal collapses. */
  moveLimit: number;
  /** Solve countdown for this vault attempt. */
  timeLimitMs: number;
  /** Cipher Fragments banked on a verified clear (before multipliers). */
  bankReward: number;
  /** Extra Fisher-Yates passes to deepen scramble (0 = single shuffle). */
  scrambleDepth: number;
  /** Preview GRID weight for catalog / lore (not minted here). */
  gridPreview: number;
};

export const CIPHER_VAULT_TIERS: readonly CipherVaultTierDef[] = [
  {
    id: 'seal',
    label: 'Seal Fragment',
    subtitle: 'Entry covenant. Soft scramble, generous clock.',
    entryKAS: 10,
    moveLimit: 24,
    timeLimitMs: 12 * 60 * 1000,
    bankReward: 150,
    scrambleDepth: 0,
    gridPreview: 1,
  },
  {
    id: 'rune',
    label: 'Rune Chamber',
    subtitle: 'Standard vault. Tighter move budget.',
    entryKAS: 18,
    moveLimit: 20,
    timeLimitMs: 10 * 60 * 1000,
    bankReward: 280,
    scrambleDepth: 1,
    gridPreview: 2,
  },
  {
    id: 'null',
    label: 'Null Lockbox',
    subtitle: 'Null Gang interference. Stay precise.',
    entryKAS: 28,
    moveLimit: 18,
    timeLimitMs: 8 * 60 * 1000,
    bankReward: 450,
    scrambleDepth: 2,
    gridPreview: 3,
  },
  {
    id: 'aria',
    label: 'ARIA Reliquary',
    subtitle: 'High-value memory seal. Fast collapse.',
    entryKAS: 45,
    moveLimit: 16,
    timeLimitMs: 6 * 60 * 1000,
    bankReward: 750,
    scrambleDepth: 3,
    gridPreview: 5,
  },
  {
    id: 'master',
    label: 'Master Covenant',
    subtitle: 'Krex’s master vault. Elite clears only.',
    entryKAS: 80,
    moveLimit: 14,
    timeLimitMs: 5 * 60 * 1000,
    bankReward: 1400,
    scrambleDepth: 4,
    gridPreview: 8,
  },
] as const;

export function getCipherVaultTier(id: CipherVaultTierId): CipherVaultTierDef | undefined {
  return CIPHER_VAULT_TIERS.find((t) => t.id === id);
}

export function isCipherVaultTierId(x: string): x is CipherVaultTierId {
  return CIPHER_VAULT_TIERS.some((t) => t.id === x);
}

/** Lowest-tier vault that a Vault Pass can open without KAS. */
export const CIPHER_VAULT_PASS_TIER: CipherVaultTierId = 'seal';

// ---------------------------------------------------------------------------
// Entry add-ons (Calculation breakdown)
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
  /** One free restart of the same vault seed if you fail (moves / timer). */
  retryCharge?: number;
};

export const CIPHER_ENTRY_ADDONS: CipherAddonDef[] = [
  {
    id: 'extra_moves',
    label: 'Extra Swaps',
    description: '+4 swaps on this vault attempt.',
    listKas: 3,
    extraMoves: 4,
  },
  {
    id: 'chrono_buffer',
    label: 'Chrono Buffer',
    description: '+4 minutes on the solve countdown.',
    listKas: 4,
    extraTimeMs: 4 * 60 * 1000,
  },
  {
    id: 'fragment_amp',
    label: 'Fragment Amplifier',
    description: '+20% Cipher Fragments banked on a clear.',
    listKas: 5,
    fragmentBonusMult: 1.2,
  },
  {
    id: 'second_seal',
    label: 'Second Seal',
    description: 'One free retry if you burn out of moves or time (same vault).',
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
    description: 'Open one Seal Fragment vault without paying entry KAS.',
    listKas: 8,
    imageSrc: '/games/precision-click/shop/item-null-filter.svg',
    charges: 1,
    effect: 'vault_pass',
  },
  {
    id: 'chrono_seal_2h',
    title: 'Chrono Seal +2h',
    category: 'Chrono',
    description: 'Extend your open covenant window by 2 hours. Does not reset the active puzzle.',
    listKas: 4,
    imageSrc: '/games/precision-click/shop/boost-overclock.svg',
    extendCovenantMs: 2 * 60 * 60 * 1000,
  },
  {
    id: 'chrono_seal_6h',
    title: 'Chrono Seal +6h',
    category: 'Chrono',
    description: 'Extend your open covenant window by 6 hours. Does not reset the active puzzle.',
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
  standard: { extraMoves: 1, extraTimeMs: 60_000, fragmentMult: 1, covenantExtendMs: 30 * 60 * 1000, label: 'Standard' },
  partner: { extraMoves: 2, extraTimeMs: 90_000, fragmentMult: 1.05, covenantExtendMs: 60 * 60 * 1000, label: 'Partner' },
  premium: { extraMoves: 3, extraTimeMs: 120_000, fragmentMult: 1.1, covenantExtendMs: 2 * 60 * 60 * 1000, label: 'Premium' },
  diamond: { extraMoves: 3, extraTimeMs: 150_000, fragmentMult: 1.12, covenantExtendMs: 3 * 60 * 60 * 1000, label: 'Diamond' },
  rarest: { extraMoves: 4, extraTimeMs: 180_000, fragmentMult: 1.15, covenantExtendMs: 4 * 60 * 60 * 1000, label: 'Rarest' },
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
  addonFragmentMult: number;
  boosterMult: number;
  wardenMult: number;
}): number {
  return Math.max(
    1,
    Math.round(args.bankReward * args.addonFragmentMult * args.boosterMult * args.wardenMult),
  );
}

/** @deprecated Tickets bridge removed; kept for legacy state migration only. */
export const CIPHER_TICKET_REDEEM_RATE_POINTS = 100;
