'use client';

import { Game, gameTypes, difficultyLevels } from '@/lib/games/games';
import { GameDifficultyBadge } from './GameDifficultyBadge';
import { GameTypeIcon } from './GameTypeIcon';
import { KxBadge } from '@/components/ui/KxBadge';

interface GameInfoPanelProps {
  game: Game;
}

export function GameInfoPanel({ game }: GameInfoPanelProps) {
  const gameType = gameTypes[game.gameType];
  const difficulty = difficultyLevels[game.difficulty];

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
          Game Information
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="kx-body">Type:</span>
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              <span className="inline-flex items-center gap-2">
                <GameTypeIcon type={game.gameType} className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                {gameType.name}
              </span>
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="kx-body">Difficulty:</span>
            <GameDifficultyBadge difficulty={game.difficulty} size="sm" />
          </div>
          <div className="flex items-center justify-between">
            <span className="kx-body">Status:</span>
            {game.status === 'beta' ? <KxBadge variant="violet">Beta</KxBadge> : null}
            {game.status === 'active' ? <KxBadge variant="emerald">Active</KxBadge> : null}
            {game.status === 'coming-soon' ? <KxBadge variant="amber">Coming Soon</KxBadge> : null}
            {game.status === 'maintenance' ? <KxBadge variant="orange">Maintenance</KxBadge> : null}
          </div>
          <div className="flex items-center justify-between">
            <span className="kx-body">Developer:</span>
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {game.developer}
            </span>
          </div>
          {game.version && (
            <div className="flex items-center justify-between">
              <span className="kx-body">Version:</span>
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {game.version}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
          Entry Cost
        </h3>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {game.entryCostKAS}
          </span>
          <span className="text-lg font-medium text-zinc-600 dark:text-zinc-400">KAS</span>
        </div>
      </div>

      {game.rewardConfig && (
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
            Rewards
          </h3>
          <div className="space-y-2">
            {game.rewardConfig.gridReward && (
              <div className="flex items-center justify-between">
                <span className="kx-body">GRID:</span>
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {game.rewardConfig.gridReward} GRID
                </span>
              </div>
            )}
            {game.rewardConfig.xpReward && (
              <div className="flex items-center justify-between">
                <span className="kx-body">pts:</span>
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {game.rewardConfig.xpReward} pts
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {game.instructions && (
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
            How to Play
          </h3>
          <p className="kx-body">
            {game.instructions}
          </p>
        </div>
      )}
    </div>
  );
}
