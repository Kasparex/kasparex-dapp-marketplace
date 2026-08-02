export type GameMilestoneMetric =
  | 'diamonds_earned'
  | 'diamonds_balance'
  | 'slots_unlocked'
  | 'refinement_points'
  | 'plants_unlocked'
  | 'plant_tier'
  | 'collections_complete'
  | 'quiz_levels'
  | 'cipher_clears'
  | 'cipher_fragments'
  | 'precision_score'
  | 'precision_levels'
  | 'strategy_rounds'
  | 'generic_progress';

export type GameMilestoneDef = {
  id: string;
  name: string;
  description?: string;
  metric: GameMilestoneMetric;
  target: number;
  /** Player level badge shown when complete. */
  level: number;
};

export type GameMilestoneProgressInput = Partial<Record<GameMilestoneMetric, number>>;

export type GameMilestoneRow = GameMilestoneDef & {
  current: number;
  completed: boolean;
  progressPct: number;
};

export const GAME_MILESTONES: Record<string, GameMilestoneDef[]> = {
  'diamond-veins': [
    {
      id: 'dv-first-1k',
      name: 'Mine your first 1,000 Diamonds',
      metric: 'diamonds_earned',
      target: 1_000,
      level: 1,
    },
    {
      id: 'dv-100k',
      name: 'Mine your first 100,000 Diamonds',
      metric: 'diamonds_earned',
      target: 100_000,
      level: 3,
    },
    {
      id: 'dv-million',
      name: 'Earn your first million Diamonds',
      metric: 'diamonds_earned',
      target: 1_000_000,
      level: 5,
    },
    {
      id: 'dv-extra-slot',
      name: 'Unlock your next worker slot',
      metric: 'slots_unlocked',
      target: 4,
      level: 2,
    },
    {
      id: 'dv-refine-stack',
      name: 'Bank 10,000 redeem points',
      metric: 'refinement_points',
      target: 10_000,
      level: 4,
    },
  ],
  minecore: [
    {
      id: 'mc-first-1k',
      name: 'Mine your first 1,000 Diamonds',
      metric: 'diamonds_earned',
      target: 1_000,
      level: 1,
    },
    {
      id: 'mc-unlock-slot',
      name: 'Unlock the next plant slot',
      metric: 'plants_unlocked',
      target: 2,
      level: 2,
    },
    {
      id: 'mc-next-plant',
      name: 'Upgrade a plant past Standard',
      metric: 'plant_tier',
      target: 2,
      level: 3,
    },
    {
      id: 'mc-100k',
      name: 'Mine your first 100,000 Diamonds',
      metric: 'diamonds_earned',
      target: 100_000,
      level: 4,
    },
    {
      id: 'mc-million',
      name: 'Earn your first million Diamonds',
      metric: 'diamonds_earned',
      target: 1_000_000,
      level: 5,
    },
  ],
  'cipher-vaults': [
    {
      id: 'cv-first-clear',
      name: 'Complete your first vault clear',
      metric: 'cipher_clears',
      target: 1,
      level: 1,
    },
    {
      id: 'cv-ten',
      name: 'Clear 10 vaults',
      metric: 'cipher_clears',
      target: 10,
      level: 3,
    },
    {
      id: 'cv-collection',
      name: 'Clear all five vault classes',
      metric: 'collections_complete',
      target: 1,
      level: 4,
    },
    {
      id: 'cv-fragments',
      name: 'Bank 1,000 Cipher Fragments lifetime',
      metric: 'cipher_fragments',
      target: 1000,
      level: 2,
    },
    {
      id: 'cv-refine',
      name: 'Refine 500 Hub points from Cipher Vaults',
      metric: 'refinement_points',
      target: 500,
      level: 5,
    },
  ],
  'kaspa-quiz': [
    {
      id: 'quiz-level-1',
      name: 'Clear your first quiz level',
      metric: 'quiz_levels',
      target: 1,
      level: 1,
    },
    {
      id: 'quiz-level-5',
      name: 'Unlock the next tier (level 5)',
      metric: 'quiz_levels',
      target: 5,
      level: 3,
    },
    {
      id: 'quiz-level-10',
      name: 'Complete the full chronicle',
      metric: 'quiz_levels',
      target: 10,
      level: 5,
    },
  ],
  'precision-click': [
    {
      id: 'pc-level-1',
      name: 'Clear Signal Trace',
      metric: 'precision_levels',
      target: 1,
      level: 1,
    },
    {
      id: 'pc-level-5',
      name: 'Clear Fragment Storm',
      metric: 'precision_levels',
      target: 5,
      level: 3,
    },
    {
      id: 'pc-level-10',
      name: 'Clear Full Sync',
      metric: 'precision_levels',
      target: 10,
      level: 5,
    },
    {
      id: 'pc-1k',
      name: 'Bank 1,000 Aria fragments',
      metric: 'precision_score',
      target: 1_000,
      level: 2,
    },
    {
      id: 'pc-10k',
      name: 'Bank 10,000 Aria fragments',
      metric: 'precision_score',
      target: 10_000,
      level: 4,
    },
    {
      id: 'pc-100k',
      name: 'Bank 100,000 Aria fragments',
      metric: 'precision_score',
      target: 100_000,
      level: 6,
    },
  ],
  'token-strategy': [
    {
      id: 'ts-first-round',
      name: 'Complete your first strategy round',
      metric: 'strategy_rounds',
      target: 1,
      level: 1,
    },
    {
      id: 'ts-ten',
      name: 'Complete 10 strategy rounds',
      metric: 'strategy_rounds',
      target: 10,
      level: 3,
    },
    {
      id: 'ts-million',
      name: 'Earn your first million (virtual)',
      metric: 'generic_progress',
      target: 1_000_000,
      level: 5,
    },
  ],
};

export function resolveMilestoneRows(
  gameId: string,
  progress: GameMilestoneProgressInput,
): GameMilestoneRow[] {
  const defs = GAME_MILESTONES[gameId] ?? [];
  return defs
    .map((d) => {
      const current = Math.max(0, Number(progress[d.metric] ?? 0));
      const completed = current >= d.target;
      const progressPct = d.target > 0 ? Math.min(100, (current / d.target) * 100) : 0;
      return { ...d, current, completed, progressPct };
    })
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
}

export function playerLevelFromMilestones(rows: GameMilestoneRow[]): number {
  const completed = rows.filter((r) => r.completed);
  if (completed.length === 0) return 0;
  return Math.max(...completed.map((r) => r.level));
}
