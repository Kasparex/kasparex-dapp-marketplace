export type GameType = 
  | 'puzzle'
  | 'arcade'
  | 'strategy'
  | 'casual'
  | 'multiplayer'
  | 'trivia'
  | 'skill';

export type GameDifficulty = 
  | 'easy'
  | 'medium'
  | 'hard'
  | 'expert';

export type GameStatus = 
  | 'beta'
  | 'active'
  | 'coming-soon'
  | 'maintenance';

export type GamePublisher = 'kasparex' | 'community';

export interface Game {
  id: string;
  name: string;
  slug: string; // URL-friendly identifier
  description: string;
  instructions?: string;
  gameType: GameType;
  difficulty: GameDifficulty;
  entryCostKAS: number; // Entry cost in KAS
  status: GameStatus;
  image?: string;
  featuredImage?: string; // 16:9 featured image
  createdAt?: string; // ISO date string for sorting
  developer: string;
  /** Official Kasparex title or community-submitted game. */
  publisher?: GamePublisher;
  /** Wallet or seed for author identicon and profile link. */
  authorAddress?: string;
  version?: string;
  // Reward configuration
  rewardConfig?: {
    gridReward?: number; // Base GRID reward
    xpReward?: number; // pts reward alongside GRID in UI displays
  };
  // Game embed URL (iframe)
  gameUrl?: string;
  // Metadata
  playCount?: number;
  likeCount?: number;
  favoriteCount?: number;
  shopItems?: any[];
}

export const gameTypes: Record<GameType, { name: string }> = {
  puzzle: { name: 'Puzzle' },
  arcade: { name: 'Arcade' },
  strategy: { name: 'Strategy' },
  casual: { name: 'Casual' },
  multiplayer: { name: 'Multiplayer' },
  trivia: { name: 'Trivia' },
  skill: { name: 'Skill' },
};

export const difficultyLevels: Record<GameDifficulty, { name: string; color: string }> = {
  easy: { name: 'Easy', color: 'green' },
  medium: { name: 'Medium', color: 'yellow' },
  hard: { name: 'Hard', color: 'orange' },
  expert: { name: 'Expert', color: 'red' },
};

// Placeholder games data
export const placeholderGames: Game[] = [
  {
    id: 'game-1',
    name: 'Kaspa Blocks',
    slug: 'kaspa-blocks',
    description: 'Match colorful blocks in this classic puzzle game. Clear rows to score points and earn rewards!',
    instructions: 'Click or tap blocks to swap them. Match 3 or more of the same color to clear them. Clear rows to earn bonus points.',
    gameType: 'puzzle',
    difficulty: 'easy',
    entryCostKAS: 0.1,
    status: 'beta',
    developer: 'Kasparex',
    version: '1.0.0',
    rewardConfig: {
      gridReward: 1,
      xpReward: 10,
    },
    createdAt: '2025-01-15T10:00:00.000Z',
    playCount: 0,
    likeCount: 0,
    favoriteCount: 0,
  },
  {
    id: 'game-2',
    name: 'Crypto Runner',
    slug: 'crypto-runner',
    description: 'Run through the Kaspa blockchain collecting coins and avoiding obstacles. How far can you go?',
    instructions: 'Use arrow keys or swipe to move. Collect coins for points. Avoid obstacles. Power-ups give temporary boosts.',
    gameType: 'arcade',
    difficulty: 'medium',
    entryCostKAS: 0.25,
    status: 'beta',
    developer: 'Kasparex',
    version: '1.0.0',
    rewardConfig: {
      gridReward: 2,
      xpReward: 15,
    },
    createdAt: '2025-01-16T10:00:00.000Z',
    playCount: 0,
    likeCount: 0,
    favoriteCount: 0,
  },
  {
    id: 'game-3',
    name: 'Token Strategy',
    slug: 'token-strategy',
    description: 'Build your token empire in this strategic resource management game. Plan your moves carefully!',
    instructions: 'Manage resources, build infrastructure, and expand your token network. Each decision affects your final score.',
    gameType: 'strategy',
    difficulty: 'hard',
    entryCostKAS: 0.5,
    status: 'beta',
    developer: 'Kasparex',
    version: '1.0.0',
    rewardConfig: {
      gridReward: 5,
      xpReward: 25,
    },
    createdAt: '2025-01-17T10:00:00.000Z',
    playCount: 0,
    likeCount: 0,
    favoriteCount: 0,
  },
  {
    id: 'game-4',
    name: 'Kaspa Quiz',
    slug: 'kaspa-quiz',
    description: 'Test your knowledge about Kaspa, blockchain, and crypto. Answer questions correctly to earn rewards!',
    instructions: 'Answer multiple choice questions about Kaspa and blockchain technology. Each correct answer earns points.',
    gameType: 'trivia',
    difficulty: 'easy',
    entryCostKAS: 0.15,
    status: 'beta',
    developer: 'Kasparex',
    version: '1.0.0',
    rewardConfig: {
      gridReward: 1.5,
      xpReward: 12,
    },
    createdAt: '2025-01-18T10:00:00.000Z',
    playCount: 0,
    likeCount: 0,
    favoriteCount: 0,
  },
  {
    id: 'game-5',
    name: 'Precision Click',
    slug: 'precision-click',
    description: 'Test your reflexes and precision in this skill-based clicking game. Accuracy is key!',
    instructions: 'Click targets as they appear. Smaller targets give more points. Miss too many and the game ends.',
    gameType: 'skill',
    difficulty: 'expert',
    entryCostKAS: 0.3,
    status: 'beta',
    developer: 'Kasparex',
    version: '1.0.0',
    rewardConfig: {
      gridReward: 3,
      xpReward: 20,
    },
    createdAt: '2025-01-19T10:00:00.000Z',
    playCount: 0,
    likeCount: 0,
    favoriteCount: 0,
  },
  {
    id: 'game-6',
    name: 'Blockchain Battle',
    slug: 'blockchain-battle',
    description: 'Compete with other players in real-time multiplayer matches. Build the strongest blockchain!',
    instructions: 'Compete against other players in real-time. Build your blockchain faster than opponents to win.',
    gameType: 'multiplayer',
    difficulty: 'medium',
    entryCostKAS: 0.4,
    status: 'beta',
    developer: 'Kasparex',
    version: '1.0.0',
    rewardConfig: {
      gridReward: 4,
      xpReward: 30,
    },
    createdAt: '2025-01-20T10:00:00.000Z',
    playCount: 0,
    likeCount: 0,
    favoriteCount: 0,
  },
  {
    id: 'game-7',
    name: 'Casual Miner',
    slug: 'casual-miner',
    description: 'A relaxing mining simulation game. Mine blocks at your own pace and collect rewards.',
    instructions: 'Click to mine blocks. Each block gives coins. Upgrade your mining equipment to mine faster.',
    gameType: 'casual',
    difficulty: 'easy',
    entryCostKAS: 0.1,
    status: 'beta',
    developer: 'Kasparex',
    version: '1.0.0',
    rewardConfig: {
      gridReward: 1,
      xpReward: 8,
    },
    createdAt: '2025-01-21T10:00:00.000Z',
    playCount: 0,
    likeCount: 0,
    favoriteCount: 0,
  },
  {
    id: 'game-8',
    name: 'Puzzle Master',
    slug: 'puzzle-master',
    description: 'Solve complex puzzles and unlock new levels. Each puzzle is more challenging than the last!',
    instructions: 'Rearrange pieces to solve puzzles. Use hints if stuck. Complete puzzles to unlock new levels.',
    gameType: 'puzzle',
    difficulty: 'hard',
    entryCostKAS: 0.35,
    status: 'beta',
    developer: 'Kasparex',
    version: '1.0.0',
    rewardConfig: {
      gridReward: 3.5,
      xpReward: 22,
    },
    createdAt: '2025-01-22T10:00:00.000Z',
    playCount: 0,
    likeCount: 0,
    favoriteCount: 0,
  },
  {
    id: 'game-10',
    name: 'Krex’s Cipher Vaults',
    slug: 'cipher-vaults',
    description: 'Decode Krex’s encrypted vaults scattered across Kaspaland. Pay a small KAS entry (or redeem Diamond Veins refinement) to attempt a cipher run and earn GRID checkpoints.',
    instructions:
      'Connect your Kaspa wallet. Start a vault run (pay with KAS or a Cipher Ticket redeemed from Diamond Veins refinement points). Solve the Cipher Grid and submit your solution to record a checkpoint.',
    gameType: 'puzzle',
    difficulty: 'easy',
    entryCostKAS: 0.5,
    status: 'beta',
    developer: 'Kasparex',
    version: '1.0.0',
    featuredImage: 'https://static.wixstatic.com/media/de4185_efae4724bb814ecd8b995da523a42c36~mv2.jpg',
    rewardConfig: {
      gridReward: 1,
      xpReward: 10,
    },
    createdAt: new Date().toISOString(),
    playCount: 0,
    likeCount: 0,
    favoriteCount: 0,
  },
  {
    id: 'game-9',
    name: 'Diamond Veins',
    slug: 'diamond-veins',
    description: 'Mine mysterious Krex Diamonds deep beneath Kaspaland. Deploy KREXPRIME Workers and PIXELKREX Elite Operators. Hold KREX for Shop fee discounts; pay with KREX or KAS in the Shop to restore energy and boost production. Revenue funds the rewards pool. Powered by Kasparex infrastructure.',
    instructions: 'Connect your Kaspa (KasWare) wallet. Deploy KREXPRIME as Workers and PIXELKREX as Elite Operators. Hold KREX for Shop fee discounts on the full purchase price. Mine in-game diamonds (the counter from your Workers/Operators), then Refine when you have at least 100 to earn Hub redeem points. For best points per diamond, wait 30+ minutes after your last refine to get the full 1.5x time bonus. Spend KREX or KAS in the Shop to buy supplies and boosts (e.g. Vector\'s Overclock, ARIA Auto-Refiner); a share of Shop revenue goes to the Diamond Veins rewards pool. Defend the veins from Null Gang interference.',
    gameType: 'strategy',
    difficulty: 'medium',
    entryCostKAS: 0,
    status: 'beta',
    developer: 'Kasparex',
    version: '1.0.0',
    featuredImage: 'https://static.wixstatic.com/media/de4185_d624b5a44cf34912bce7e3525fd63aaf~mv2.jpg',
    rewardConfig: {
      gridReward: 0,
      xpReward: 0,
    },
    createdAt: new Date().toISOString(),
    playCount: 0,
    likeCount: 0,
    favoriteCount: 0,
  },
];

// Helper functions
export function getGameBySlug(games: Game[], slug: string): Game | undefined {
  return games.find((game) => game.slug === slug);
}

export function getGameById(games: Game[], id: string): Game | undefined {
  return games.find((game) => game.id === id);
}

export function getGamesByType(games: Game[], type: GameType): Game[] {
  return games.filter((game) => game.gameType === type);
}

export function getGamesByDifficulty(games: Game[], difficulty: GameDifficulty): Game[] {
  return games.filter((game) => game.difficulty === difficulty);
}

export function generateGameSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
