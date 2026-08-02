import type { Game, GamePublisher, GameType, GameDifficulty, GameStatus } from './games';
import { getKasparexGamesAuthorWallet } from '@/lib/games/author';

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
  publisher?: GamePublisher;
  authorAddress?: string;
  version?: string;
  featuredImage?: string;
  gameUrl?: string;
  rewardConfig?: Game['rewardConfig'];
  createdAt?: string;
}): Game {
  const publisher = input.publisher ?? (input.developer.toLowerCase().includes('kasparex') ? 'kasparex' : 'community');
  return {
    ...input,
    publisher,
    authorAddress:
      input.authorAddress ??
      (publisher === 'kasparex' ? getKasparexGamesAuthorWallet() : `author:${input.developer}`),
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
        'Idle-mine Diamonds by deploying Kasparex NFTs into Worker, Operator, and Foreman slots. Keep energy topped up from the Shop, use boosts to extend sessions, refine Diamonds into Hub points, and climb Milestones.',
      instructions:
        'Connect your Kaspa wallet. Use the free starter Worker slot or buy more roles, deploy an NFT, Feed when Exhausted, refine Diamonds from the Game Deck into Hub points, and track Milestones.',
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
    tags: ['Diamonds', 'NFT slots', 'Idle mining', 'Hub points'],
  },
  {
    ...baseGame({
      id: 'minecore',
      name: 'Minecore',
      slug: 'minecore',
      description:
        'Operate mining plants beneath Kaspaland. Craft parts, unlock plants with KAS, assign Crew NFTs, run timed extraction cycles, then refine Diamonds into GRID or KREX on Redeem.',
      instructions:
        'Connect your Kaspa wallet. Buy ingredients in Shop, craft on Build, unlock a plant on Mining, install machine + power + Crew, start a run, then refine Diamonds on Redeem.',
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
  },
  {
    ...baseGame({
      id: 'cipher-vaults',
      name: "Krex’s Cipher Vaults",
      slug: 'cipher-vaults',
      description:
        'Open timed Cipher Vault covenants on the Kaspa network. Solve rune grids, bank Cipher Fragments, and refine them into Hub redeem points. Entry from 10 KAS.',
      instructions:
        'Connect your Kaspa wallet. Use the Calculation breakdown to pay entry for a vault class (optional add-ons), solve the Cipher Grid within the move limit and timer, then refine Cipher Fragments from the Game Deck into Hub points.',
      gameType: 'puzzle',
      difficulty: 'medium',
      entryCostKAS: 10,
      status: 'beta',
      developer: 'Kasparex',
      version: '2.0.0',
      featuredImage: 'https://static.wixstatic.com/media/de4185_efae4724bb814ecd8b995da523a42c36~mv2.jpg',
      rewardConfig: { gridReward: 1, xpReward: 10 },
      createdAt: new Date().toISOString(),
    }),
    route: { kind: 'custom', href: '/games/cipher-vaults' },
    capabilities: ['wallet_l1', 'payments_l1_kas', 'leaderboard_unified', 'rewards_grid'],
    skus: [
      {
        id: 'cipher-vaults:entry',
        type: 'entry',
        title: 'Seal Fragment Entry',
        currency: 'KAS',
        amount: 10,
        kasTreasuryAddress: process.env.NEXT_PUBLIC_CIPHER_VAULTS_TREASURY_ADDRESS || DEFAULT_GAMES_TREASURY,
      },
    ],
    categories: ['Puzzles', 'Vaults', 'Lore'],
    tags: ['Cipher grid', 'Covenants', 'Refine', 'NFT wardens'],
  },
  {
    ...baseGame({
      id: 'token-strategy',
      name: 'Token Strategy: Kasparex Defense',
      slug: 'token-strategy',
      description:
        'A short strategy mission in Krex’s network defense. Choose responses that shape Security, Power, and Stealth, stack boosters, and outplay Null Gang interference.',
      instructions:
        'Pay the KAS entry to start. Pick mission choices each round to raise Security, Power, and Stealth. Optional KREX boosters and NFT deck bonuses multiply your final score.',
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
  },
  {
    ...baseGame({
      id: 'kaspa-quiz',
      name: "Krex's Chronicles: Mystery Quiz",
      slug: 'kaspa-quiz',
      description:
        'A 10-level mystery quiz through Krex’s Chronicles. Each level has 5 lore questions; clear them to unlock deeper chapters and raise your score.',
      instructions:
        'Pay the KAS case entry once. Answer 5 questions per level across up to 10 levels. KREX boosters and NFT deck bonuses multiply your score.',
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
  },
  {
    ...baseGame({
      id: 'precision-click',
      name: 'Precision Click: ARIA Lock',
      slug: 'precision-click',
      description:
        'Open a 24h ARIA Lock, clear ten cascading seals, and bank Aria fragments only on clear. Extend with Chrono Seals or a Sync Operative NFT. Refine fragments into Hub points.',
      instructions:
        'Pay 10 KAS to open the lock. Clear each level once per lock window. Clicks fill progress only. Fragments bank on clear. Chrono Seals and Sync Operative NFTs extend time. Refine min 1,000 fragments from the Game Deck.',
      gameType: 'skill',
      difficulty: 'expert',
      entryCostKAS: 10,
      status: 'beta',
      developer: 'Kasparex',
      version: '2.1.0',
      rewardConfig: { gridReward: 3, xpReward: 20 },
      createdAt: '2025-01-19T10:00:00.000Z',
      featuredImage: 'https://static.wixstatic.com/media/de4185_aedf26d623274f75aa8322e9a2266b7f~mv2.jpg',
    }),
    route: { kind: 'custom', href: '/games/precision-click' },
    capabilities: ['wallet_l1', 'payments_l1_kas', 'leaderboard_unified'],
    skus: [
      { id: 'precision-click:entry', type: 'entry', title: 'Training Entry', currency: 'KAS', amount: 10, kasTreasuryAddress: DEFAULT_GAMES_TREASURY },
      { id: 'precision-click:boost:krex', type: 'boost', title: 'KREX Booster', currency: 'KREX', amount: 25 },
    ],
    categories: ['Skill', 'Training', 'Lore'],
    tags: ['ARIA', 'Fragments', 'Reflex'],
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

