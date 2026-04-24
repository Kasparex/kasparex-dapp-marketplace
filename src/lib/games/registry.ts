import type { Game, GameStatus, GameType, GameDifficulty } from './games';

export type GameCurrency = 'KAS' | 'KREX' | 'GRID' | 'DIAMONDS';
export type GameSkuType = 'entry' | 'boost' | 'unlock' | 'slot' | 'other';

export type GameRoute =
  | { kind: 'custom'; href: `/games/${string}` }
  | { kind: 'slug'; slug: string };

export type GameCapability =
  | 'wallet_l1'
  | 'payments_l1_kas'
  | 'payments_krc20_krex'
  | 'rewards_grid'
  | 'rewards_xp'
  | 'currency_diamonds'
  | 'nft_deck'
  | 'leaderboard_unified';

export type GameSKU = {
  id: string;
  type: GameSkuType;
  title: string;
  currency: GameCurrency;
  amount: number;
  /**
   * L1 treasury address (for KAS payments).
   * Kept as plain string so registry stays node/edge-safe; validation happens at runtime.
   */
  kasTreasuryAddress?: string;
};

export type UnifiedGame = Game & {
  route: GameRoute;
  capabilities: GameCapability[];
  skus?: GameSKU[];
  categories?: string[];
  tags?: string[];
  connections?: Array<{
    toSlug?: string;
    toHref?: string;
    title: string;
    punch: string;
    requirement?: string;
    actionKey?: 'wallet' | 'diamonds_100' | 'krex_or_nft' | 'tickets' | 'read_chronicles' | 'none';
    actionHint?: string;
  }>;
};

function baseGame(input: {
  id: string;
  name: string;
  slug: string;
  description: string;
  instructions?: string;
  gameType: GameType;
  difficulty: GameDifficulty;
  status: GameStatus;
  entryCostKAS: number;
  developer: string;
  version?: string;
  featuredImage?: string;
  gameUrl?: string;
  rewardConfig?: Game['rewardConfig'];
  createdAt?: string;
}): Game {
  return {
    ...input,
    image: undefined,
    playCount: 0,
    likeCount: 0,
    favoriteCount: 0,
  };
}

const DEFAULT_GAMES_TREASURY = process.env.NEXT_PUBLIC_GAME_TREASURY_ADDRESS || '';

/**
 * Single source of truth for all Kasparex Games.
 *
 * Keep it simple + static so it scales cheaply:
 * - UI reads from this registry.
 * - Server/Workers can later expose a read-only endpoint that returns this list.
 * - Game-specific state stays inside each game's own modules/APIs.
 */
export const gamesRegistry: UnifiedGame[] = [
  {
    ...baseGame({
      id: 'diamond-veins',
      name: 'Diamond Veins',
      slug: 'diamond-veins',
      description:
        "Mine mysterious Krex Diamonds deep beneath Kaspaland. Deploy KREXPRIME Workers and PIXELKREX Elite Operators. Hold KREX for bonuses; pay with KREX or KAS in Vector's Garage to boost production. Revenue funds the rewards pool. Powered by Kasparex infrastructure.",
      instructions:
        "Connect your Kaspa (KasWare) wallet. Deploy KREXPRIME as Workers and PIXELKREX as Elite Operators. Hold KREX for higher yield and shop discounts. Mine in-game diamonds, then Refine when you have at least 100 to earn refinement points.",
      gameType: 'strategy',
      difficulty: 'medium',
      entryCostKAS: 0,
      status: 'beta',
      developer: 'Kasparex',
      version: '1.0.0',
      featuredImage: 'https://static.wixstatic.com/media/de4185_d624b5a44cf34912bce7e3525fd63aaf~mv2.jpg',
      rewardConfig: { gridReward: 0, xpReward: 0 },
      createdAt: new Date().toISOString(),
    }),
    route: { kind: 'custom', href: '/games/diamond-veins' },
    capabilities: ['wallet_l1', 'currency_diamonds', 'nft_deck', 'leaderboard_unified'],
    categories: ['Economy', 'Mining', 'Lore'],
    tags: ['Diamonds', 'NFT slots', 'Refinement points', 'KREX boosts'],
    connections: [
      {
        toSlug: 'cipher-vaults',
        title: 'Refinement → Cipher Tickets',
        punch: 'Mine diamonds, refine points, then redeem tickets to enter Cipher Vaults without paying KAS.',
        requirement: 'Refine at least 100 diamonds to earn refinement points.',
        actionKey: 'diamonds_100',
        actionHint: 'Mine more diamonds, then refine (100+).',
      },
    ],
  },
  {
    ...baseGame({
      id: 'minecore',
      name: 'Minecore',
      slug: 'minecore',
      description:
        'Operate a diamond mining complex beneath Kaspaland. Craft parts, build mining plants, run timed extraction cycles, refine diamonds, and redeem output into GRID as the ecosystem expands.',
      instructions:
        'Connect your Kaspa wallet. Unlock a plant slot with KAS, install machine and power, assign workers and modules, then start a mining cycle. Extract diamonds when complete and refine output for ecosystem rewards.',
      gameType: 'strategy',
      difficulty: 'easy',
      entryCostKAS: 0,
      status: 'beta',
      developer: 'Kasparex',
      version: '0.1.0',
      featuredImage: 'https://static.wixstatic.com/media/de4185_9ad0e3518282411d8120cff70533a7e1~mv2.jpg',
      rewardConfig: { gridReward: 0, xpReward: 0 },
      createdAt: new Date().toISOString(),
    }),
    route: { kind: 'custom', href: '/games/minecore' },
    capabilities: ['wallet_l1', 'payments_l1_kas', 'currency_diamonds', 'leaderboard_unified'],
    skus: [
      {
        id: 'minecore:slot:unlock',
        type: 'slot',
        title: 'Plant Slot Unlock',
        currency: 'KAS',
        amount: 1,
        kasTreasuryAddress: DEFAULT_GAMES_TREASURY,
      },
      {
        id: 'minecore:slot:expand',
        type: 'slot',
        title: 'Plant Slot Expansion',
        currency: 'KAS',
        amount: 50,
        kasTreasuryAddress: DEFAULT_GAMES_TREASURY,
      },
    ],
    categories: ['Economy', 'Mining', 'Crafting'],
    tags: ['Plant slots', 'Timers', 'Refine', 'GRID'],
    connections: [
      {
        toSlug: 'cipher-vaults',
        title: 'Diamonds → Vault access',
        punch: 'Mine diamonds in Minecore, then spend them later across Kasparex Games unlocks and entries.',
        actionKey: 'none',
        actionHint: 'Open Minecore and start a plant cycle.',
      },
    ],
  },
  {
    ...baseGame({
      id: 'cipher-vaults',
      name: "Krex’s Cipher Vaults",
      slug: 'cipher-vaults',
      description:
        'Decode Krex’s encrypted vaults scattered across Kaspaland. Pay a small KAS entry (or redeem Diamond Veins refinement) to attempt a cipher run and earn GRID checkpoints.',
      instructions:
        'Connect your Kaspa wallet. Start a vault run (pay with KAS or redeem Cipher Tickets). Solve the Cipher Grid and submit your solution to record a checkpoint.',
      gameType: 'puzzle',
      difficulty: 'easy',
      entryCostKAS: 0.5,
      status: 'beta',
      developer: 'Kasparex',
      version: '1.0.0',
      featuredImage: 'https://static.wixstatic.com/media/de4185_efae4724bb814ecd8b995da523a42c36~mv2.jpg',
      rewardConfig: { gridReward: 1, xpReward: 10 },
      createdAt: new Date().toISOString(),
    }),
    route: { kind: 'custom', href: '/games/cipher-vaults' },
    capabilities: ['wallet_l1', 'payments_l1_kas', 'currency_diamonds', 'leaderboard_unified', 'rewards_grid'],
    skus: [
      {
        id: 'cipher-vaults:entry',
        type: 'entry',
        title: 'Vault Entry',
        currency: 'KAS',
        amount: 0.5,
        kasTreasuryAddress: process.env.NEXT_PUBLIC_CIPHER_VAULTS_TREASURY_ADDRESS || DEFAULT_GAMES_TREASURY,
      },
    ],
    categories: ['Puzzles', 'Vaults', 'Lore'],
    tags: ['Cipher grid', 'Tickets', 'Checkpoints'],
    connections: [
      {
        toSlug: 'diamond-veins',
        title: 'Need tickets?',
        punch: 'To farm Cipher Tickets cheaply, mine and refine in Diamond Veins first.',
        requirement: 'Redeem Diamond Veins refinement points into tickets.',
        actionKey: 'diamonds_100',
        actionHint: 'Mine diamonds and refine to generate redeemable points.',
      },
    ],
  },
  {
    ...baseGame({
      id: 'token-strategy',
      name: 'Token Strategy: Kasparex Defense',
      slug: 'token-strategy',
      description:
        "A lightweight strategy run inside Krex’s network defense. Choose responses, stack security, and outplay Null Gang interference.",
      instructions:
        'Pay entry to start. Pick mission actions to improve Security/Power/Stealth. Boosters (KREX + NFT deck + optional KREX booster) increase your final score.',
      gameType: 'strategy',
      difficulty: 'hard',
      entryCostKAS: 0.5,
      status: 'beta',
      developer: 'Kasparex',
      version: '1.0.0',
      rewardConfig: { gridReward: 5, xpReward: 25 },
      createdAt: '2025-01-17T10:00:00.000Z',
      featuredImage: 'https://static.wixstatic.com/media/de4185_9b221e79f0e146fba3439a85a3bcb196~mv2.jpg',
    }),
    route: { kind: 'custom', href: '/games/token-strategy' },
    capabilities: ['wallet_l1', 'payments_l1_kas', 'leaderboard_unified'],
    skus: [
      { id: 'token-strategy:entry', type: 'entry', title: 'Mission Entry', currency: 'KAS', amount: 0.5, kasTreasuryAddress: DEFAULT_GAMES_TREASURY },
      { id: 'token-strategy:boost:krex', type: 'boost', title: 'KREX Booster', currency: 'KREX', amount: 25 },
    ],
    categories: ['Strategy', 'Defense', 'Lore'],
    tags: ['Security', 'Stealth', 'Null Gang'],
    connections: [
      {
        toSlug: 'diamond-veins',
        title: 'Gear up with the deck',
        punch: 'Your KREX tier + NFT deck boosts your final score. Build your deck power in Diamond Veins.',
        requirement: 'Hold KREX and/or equip NFTs for better multipliers.',
        actionKey: 'krex_or_nft',
        actionHint: 'Hold KREX or equip any supported NFT to boost multipliers.',
      },
    ],
  },
  {
    ...baseGame({
      id: 'kaspa-quiz',
      name: "Krex's Chronicles: Mystery Quiz",
      slug: 'kaspa-quiz',
      description:
        "A mysterious 10-level quiz run through Krex's Chronicles. Each level contains 5 lore questions — clear them to unlock deeper chapters.",
      instructions:
        "Pay the entry fee to start. Answer 5 questions per level. Use boosters (KREX tier + NFTs) to increase your score multiplier.",
      gameType: 'trivia',
      difficulty: 'easy',
      entryCostKAS: 0.2,
      status: 'beta',
      developer: 'Kasparex',
      version: '1.0.0',
      rewardConfig: { gridReward: 0, xpReward: 0 },
      createdAt: '2025-01-18T10:00:00.000Z',
      featuredImage: 'https://static.wixstatic.com/media/de4185_b0884a9874954eecadc2a90d67ec3891~mv2.jpg',
    }),
    route: { kind: 'custom', href: '/games/kaspa-quiz' },
    capabilities: ['wallet_l1', 'payments_l1_kas', 'leaderboard_unified', 'nft_deck'],
    skus: [
      { id: 'kaspa-quiz:entry', type: 'entry', title: 'Case Entry', currency: 'KAS', amount: 0.2, kasTreasuryAddress: DEFAULT_GAMES_TREASURY },
      { id: 'kaspa-quiz:boost:krex', type: 'boost', title: 'KREX Booster', currency: 'KREX', amount: 25 },
    ],
    categories: ['Trivia', 'Chronicles', 'Lore'],
    tags: ['Chapters', 'Characters', 'Mystery'],
    connections: [
      {
        toHref: '/chronicles/chapters',
        title: 'Read the source',
        punch: 'Want perfect clears? Skim the Chronicles chapters and character dossiers.',
        requirement: 'Explore chapters and characters in Chronicles.',
        actionKey: 'read_chronicles',
        actionHint: 'Open Chapters / Characters for lore context.',
      },
      {
        toSlug: 'cipher-vaults',
        title: 'Solve the real locks',
        punch: 'Quiz trained your mind. Cipher Vaults tests it for real—decode the grid and record checkpoints.',
        actionKey: 'none',
        actionHint: 'Start a Cipher Vault run and submit a clear.',
      },
    ],
  },
  {
    ...baseGame({
      id: 'precision-click',
      name: 'Precision Click: ARIA Lock',
      slug: 'precision-click',
      description:
        'Test your reflexes and precision in this skill-based clicking game. Accuracy is key!',
      instructions:
        'Click targets as they appear. Smaller targets give more points. Miss too many and the game ends.',
      gameType: 'skill',
      difficulty: 'expert',
      entryCostKAS: 0.3,
      status: 'beta',
      developer: 'Kasparex',
      version: '1.0.0',
      rewardConfig: { gridReward: 3, xpReward: 20 },
      createdAt: '2025-01-19T10:00:00.000Z',
      featuredImage: 'https://static.wixstatic.com/media/de4185_aedf26d623274f75aa8322e9a2266b7f~mv2.jpg',
    }),
    route: { kind: 'custom', href: '/games/precision-click' },
    capabilities: ['wallet_l1', 'payments_l1_kas', 'leaderboard_unified'],
    skus: [
      { id: 'precision-click:entry', type: 'entry', title: 'Training Entry', currency: 'KAS', amount: 0.3, kasTreasuryAddress: DEFAULT_GAMES_TREASURY },
      { id: 'precision-click:boost:krex', type: 'boost', title: 'KREX Booster', currency: 'KREX', amount: 25 },
    ],
    categories: ['Skill', 'Training', 'Lore'],
    tags: ['ARIA', 'Fragments', 'Reflex'],
    connections: [
      {
        toSlug: 'cipher-vaults',
        title: 'ARIA fragments → Vaults',
        punch: 'Precision Lock trains the fragment timing. Then go clear Cipher Vaults for real checkpoints.',
        actionKey: 'none',
        actionHint: 'Start a Cipher Vault run and record checkpoints.',
      },
    ],
  },
];

export function listGames(): UnifiedGame[] {
  return gamesRegistry;
}

export function getGameBySlugFromRegistry(slug: string): UnifiedGame | undefined {
  const s = (slug ?? '').trim();
  if (!s) return undefined;
  return gamesRegistry.find((g) => g.slug === s);
}

export function getSlugRoutedGames(): UnifiedGame[] {
  return gamesRegistry.filter((g) => g.route.kind === 'slug');
}

export function getEntrySku(game: UnifiedGame): GameSKU | undefined {
  return game.skus?.find((s) => s.type === 'entry');
}

